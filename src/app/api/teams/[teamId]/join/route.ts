import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type RouteContext = { params: Promise<{ teamId: string }> }

export async function POST(_request: Request, { params }: RouteContext) {
  const { teamId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch the team and its event in one query
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select(
      `
      id,
      event_id,
      name,
      color,
      is_active,
      events!inner(
        id,
        status,
        max_players_per_team
      ),
      team_members(count)
    `
    )
    .eq('id', teamId)
    .single()

  if (teamError) {
    if (teamError.code === 'PGRST116') {
      return NextResponse.json({ data: null, error: 'Team not found' }, { status: 404 })
    }
    return NextResponse.json({ data: null, error: teamError.message }, { status: 500 })
  }

  const eventData = Array.isArray(team.events) ? team.events[0] : team.events
  const eventStatus: string = eventData?.status ?? ''
  const maxPlayers: number = eventData?.max_players_per_team ?? 5

  // Only allow joining events that are in draft or active state
  if (eventStatus !== 'draft' && eventStatus !== 'active') {
    return NextResponse.json(
      { data: null, error: 'Cannot join a team for a completed or paused event' },
      { status: 409 }
    )
  }

  // Check the user is not already on a team in this event
  const { data: existingMembership } = await supabase
    .from('team_members')
    .select(
      `
      id,
      teams!inner(event_id)
    `
    )
    .eq('user_id', user.id)
    .eq('teams.event_id', team.event_id)
    .maybeSingle()

  if (existingMembership) {
    return NextResponse.json(
      { data: null, error: 'You are already a member of a team in this event' },
      { status: 409 }
    )
  }

  // Check team capacity
  const memberCountArr = team.team_members as { count: number }[] | undefined
  const currentCount =
    memberCountArr && memberCountArr.length > 0 ? memberCountArr[0].count : 0

  if (currentCount >= maxPlayers) {
    return NextResponse.json(
      {
        data: null,
        error: `Team is full (max ${maxPlayers} players)`,
      },
      { status: 409 }
    )
  }

  // Insert the team member record
  const { error: insertError } = await supabase.from('team_members').insert({
    team_id: teamId,
    user_id: user.id,
    role: currentCount === 0 ? 'captain' : 'member',
  })

  if (insertError) {
    return NextResponse.json({ data: null, error: insertError.message }, { status: 500 })
  }

  // Return the updated team with members
  const { data: updatedTeam, error: fetchError } = await supabase
    .from('teams')
    .select(
      `
      *,
      team_members(
        *,
        users(id, name, avatar_url, level, xp)
      )
    `
    )
    .eq('id', teamId)
    .single()

  if (fetchError) {
    return NextResponse.json({ data: null, error: fetchError.message }, { status: 500 })
  }

  return NextResponse.json({ data: updatedTeam, error: null })
}
