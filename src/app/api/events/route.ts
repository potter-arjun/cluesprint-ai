import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { generateEventCode } from '@/lib/utils'
import type { EventStatus } from '@/types/database'

const CreateEventSchema = z.object({
  name: z.string().min(1, 'Event name is required').max(100),
  description: z.string().optional(),
  theme: z.string().optional(),
  venue: z.string().optional(),
  max_teams: z.number().int().min(2).max(100).default(10),
  max_players_per_team: z.number().int().min(1).max(20).default(5),
  starts_at: z.string().optional().nullable(),
  ends_at: z.string().optional().nullable(),
  settings: z.record(z.unknown()).optional(),
})

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const search = searchParams.get('search')

  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  let query = supabase
    .from('events')
    .select(`
      *,
      stories(id, title, theme),
      teams(count)
    `)

  if (userProfile?.role !== 'admin') {
    query = query.in('status', ['active', 'completed'] as EventStatus[])
  }
  if (status) query = query.eq('status', status as unknown as EventStatus)
  if (search) query = query.ilike('name', `%${search}%`)

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query
  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  return NextResponse.json({ data, error: null })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ data: null, error: 'Forbidden: Admin access required' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ data: null, error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = CreateEventSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ data: null, error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const joinCode = generateEventCode()

  const { data, error } = await supabase
    .from('events')
    .insert({
      ...parsed.data,
      admin_id: user.id,
      join_code: joinCode,
      status: 'draft',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, error: null }, { status: 201 })
}
