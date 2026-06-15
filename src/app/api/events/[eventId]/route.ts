import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const PatchEventSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  max_teams: z.number().int().min(2).max(50).optional(),
  max_players_per_team: z.number().int().min(1).max(20).optional(),
  starts_at: z.string().datetime().optional(),
  ends_at: z.string().datetime().optional(),
  settings: z.record(z.unknown()).optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed']).optional(),
})

type RouteContext = { params: Promise<{ eventId: string }> }

export async function GET(_request: Request, { params }: RouteContext) {
  const { eventId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  }

  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const { data: event, error } = await supabase
    .from('events')
    .select(
      `
      *,
      stories(*),
      teams(
        *,
        team_members(
          *,
          users(id, name, avatar_url, level, xp)
        )
      ),
      missions(*)
    `
    )
    .eq('id', eventId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ data: null, error: 'Event not found' }, { status: 404 })
    }
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  // Non-admins can only view active or completed events
  if (
    userProfile?.role !== 'admin' &&
    event.status !== 'active' &&
    event.status !== 'completed'
  ) {
    return NextResponse.json({ data: null, error: 'Event not found' }, { status: 404 })
  }

  return NextResponse.json({ data: event, error: null })
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { eventId } = await params
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
  const parsed = PatchEventSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ data: null, error: parsed.error.message }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('events')
    .update(parsed.data)
    .eq('id', eventId)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ data: null, error: 'Event not found' }, { status: 404 })
    }
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, error: null })
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { eventId } = await params
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

  // Fetch event to check status before deleting
  const { data: event, error: fetchError } = await supabase
    .from('events')
    .select('id, status')
    .eq('id', eventId)
    .single()

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return NextResponse.json({ data: null, error: 'Event not found' }, { status: 404 })
    }
    return NextResponse.json({ data: null, error: fetchError.message }, { status: 500 })
  }

  if (event.status === 'active') {
    return NextResponse.json(
      { data: null, error: 'Cannot delete an active event. End the event first.' },
      { status: 409 }
    )
  }

  const { error } = await supabase.from('events').delete().eq('id', eventId)

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: { id: eventId }, error: null })
}
