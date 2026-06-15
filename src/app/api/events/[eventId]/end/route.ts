import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { LeaderboardRow } from '@/types/database'

type RouteContext = { params: Promise<{ eventId: string }> }

export async function POST(_request: Request, { params }: RouteContext) {
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

  // Verify event exists and is in an endable state
  const { data: existing, error: fetchError } = await supabase
    .from('events')
    .select('id, status, name')
    .eq('id', eventId)
    .single()

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return NextResponse.json({ data: null, error: 'Event not found' }, { status: 404 })
    }
    return NextResponse.json({ data: null, error: fetchError.message }, { status: 500 })
  }

  if (existing.status === 'completed') {
    return NextResponse.json({ data: null, error: 'Event is already completed' }, { status: 409 })
  }

  if (existing.status === 'draft') {
    return NextResponse.json(
      { data: null, error: 'Cannot end a draft event. Start the event first.' },
      { status: 409 }
    )
  }

  const now = new Date().toISOString()

  // Update event status to completed
  const { data: event, error: updateError } = await supabase
    .from('events')
    .update({
      status: 'completed',
      ended_at: now,
    })
    .eq('id', eventId)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ data: null, error: updateError.message }, { status: 500 })
  }

  // Fetch the final leaderboard via the DB function
  let finalLeaderboard: LeaderboardRow[] = []
  const { data: leaderboard, error: lbError } = await supabase.rpc('get_event_leaderboard', {
    p_event_id: eventId,
  })

  if (lbError) {
    console.error('Failed to fetch final leaderboard:', lbError.message)
  } else {
    finalLeaderboard = leaderboard ?? []
  }

  // Determine the winner name for the notification message
  const winner = finalLeaderboard.length > 0 ? finalLeaderboard[0] : null
  const winnerText = winner
    ? ` Congratulations to "${winner.team_name}" for taking 1st place!`
    : ''

  // Broadcast a game-over notification to all participants
  const { error: notifError } = await supabase.from('notifications').insert({
    event_id: eventId,
    user_id: null,
    team_id: null,
    type: 'event_ended',
    title: 'Game Over!',
    message: `Game Over! Check the final results.${winnerText}`,
    metadata: {
      event_id: eventId,
      ended_at: now,
      final_leaderboard: finalLeaderboard,
    },
    is_read: false,
  })

  if (notifError) {
    console.error('Failed to insert end notification:', notifError.message)
  }

  return NextResponse.json({
    data: {
      event,
      finalLeaderboard,
    },
    error: null,
  })
}
