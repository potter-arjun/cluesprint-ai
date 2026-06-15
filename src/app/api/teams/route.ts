import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getTeamColor } from '@/lib/utils'

const CreateTeamSchema = z.object({
  event_id: z.string().uuid(),
  name: z.string().min(1).max(60),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
})

export async function GET(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const eventId = searchParams.get('event_id')

  if (!eventId) {
    return NextResponse.json(
      { data: null, error: 'event_id query parameter is required' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('teams')
    .select(
      `
      *,
      team_members(count)
    `
    )
    .eq('event_id', eventId)
    .order('total_score', { ascending: false })

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, error: null })
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = CreateTeamSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ data: null, error: parsed.error.message }, { status: 400 })
  }

  const { event_id, name, color } = parsed.data

  // Verify the event exists
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id')
    .eq('id', event_id)
    .single()

  if (eventError || !event) {
    return NextResponse.json({ data: null, error: 'Event not found' }, { status: 404 })
  }

  // Enforce unique team name per event
  const { data: duplicate } = await supabase
    .from('teams')
    .select('id')
    .eq('event_id', event_id)
    .ilike('name', name)
    .maybeSingle()

  if (duplicate) {
    return NextResponse.json(
      { data: null, error: 'A team with this name already exists in the event' },
      { status: 409 }
    )
  }

  // Auto-assign color based on current team count if not provided
  let teamColor = color
  if (!teamColor) {
    const { count } = await supabase
      .from('teams')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', event_id)

    teamColor = getTeamColor(count ?? 0)
  }

  const { data, error } = await supabase
    .from('teams')
    .insert({
      event_id,
      name,
      color: teamColor,
      total_score: 0,
      missions_completed: 0,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, error: null }, { status: 201 })
}
