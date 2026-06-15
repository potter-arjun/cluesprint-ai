import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth'
import { NextResponse } from 'next/server'

type RouteContext = { params: Promise<{ teamId: string }> }

// POST /api/teams/[teamId]/add-member — admin only, adds a user by email
export async function POST(request: Request, { params }: RouteContext) {
  const { teamId } = await params
  const supabase = await createClient()

  const admin = await getUser()
  if (!admin) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  if (admin.role !== 'admin') return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })

  const { email } = await request.json()
  if (!email?.trim()) {
    return NextResponse.json({ data: null, error: 'email is required' }, { status: 400 })
  }

  // Look up target user by email
  const { data: targetUser } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('email', email.trim().toLowerCase())
    .single()

  if (!targetUser) {
    return NextResponse.json({ data: null, error: `No user found with email "${email}"` }, { status: 404 })
  }

  // Get team + event info
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('id, event_id, events!inner(id, max_players_per_team), team_members(count)')
    .eq('id', teamId)
    .single()

  if (teamError || !team) {
    return NextResponse.json({ data: null, error: 'Team not found' }, { status: 404 })
  }

  // Check user not already on a team in this event
  const { data: existing } = await supabase
    .from('team_members')
    .select('id, teams!inner(event_id)')
    .eq('user_id', targetUser.id)
    .eq('teams.event_id', team.event_id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ data: null, error: `${targetUser.name ?? email} is already on a team in this event` }, { status: 409 })
  }

  // Check capacity
  const eventData = Array.isArray(team.events) ? team.events[0] : team.events
  const maxPlayers: number = (eventData as { max_players_per_team: number } | null)?.max_players_per_team ?? 5
  const memberCountArr = team.team_members as { count: number }[] | undefined
  const currentCount = memberCountArr?.[0]?.count ?? 0

  if (currentCount >= maxPlayers) {
    return NextResponse.json({ data: null, error: `Team is full (max ${maxPlayers} players)` }, { status: 409 })
  }

  // Use service-role client to bypass RLS (admin inserting on behalf of another user)
  const adminClient = createAdminClient()
  const { error: insertError } = await adminClient.from('team_members').insert({
    team_id: teamId,
    user_id: targetUser.id,
    role: currentCount === 0 ? 'captain' : 'member',
  })

  if (insertError) {
    return NextResponse.json({ data: null, error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ data: { user: targetUser }, error: null }, { status: 201 })
}
