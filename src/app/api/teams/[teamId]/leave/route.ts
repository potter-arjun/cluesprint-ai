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

  // Fetch team and its event status in one query
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select(
      `
      id,
      event_id,
      events!inner(
        id,
        status
      )
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

  // Leaving is only allowed when the event is in draft status
  if (eventStatus !== 'draft') {
    return NextResponse.json(
      {
        data: null,
        error:
          'You can only leave a team before the event starts. Contact an admin for assistance.',
      },
      { status: 409 }
    )
  }

  // Verify the user is actually a member of this team
  const { data: membership, error: memberError } = await supabase
    .from('team_members')
    .select('id, is_captain')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (memberError) {
    return NextResponse.json({ data: null, error: memberError.message }, { status: 500 })
  }

  if (!membership) {
    return NextResponse.json(
      { data: null, error: 'You are not a member of this team' },
      { status: 404 }
    )
  }

  // Remove the member record
  const { error: deleteError } = await supabase
    .from('team_members')
    .delete()
    .eq('id', membership.id)

  if (deleteError) {
    return NextResponse.json({ data: null, error: deleteError.message }, { status: 500 })
  }

  // If the departing member was captain, promote the next member to captain
  if (membership.is_captain) {
    const { data: nextMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .order('joined_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (nextMember) {
      await supabase
        .from('team_members')
        .update({ is_captain: true })
        .eq('id', nextMember.id)
    }
  }

  return NextResponse.json({
    data: { team_id: teamId, user_id: user.id, left: true },
    error: null,
  })
}
