import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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

  // Verify event exists and is in a startable state
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

  if (existing.status === 'active') {
    return NextResponse.json({ data: null, error: 'Event is already active' }, { status: 409 })
  }

  if (existing.status === 'completed') {
    return NextResponse.json(
      { data: null, error: 'Cannot start a completed event' },
      { status: 409 }
    )
  }

  const now = new Date().toISOString()

  // Update event status to active
  const { data: event, error: updateError } = await supabase
    .from('events')
    .update({
      status: 'active',
      started_at: now,
    })
    .eq('id', eventId)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ data: null, error: updateError.message }, { status: 500 })
  }

  // Broadcast a notification to all participants
  const { error: notifError } = await supabase.from('notifications').insert({
    event_id: eventId,
    user_id: null,
    team_id: null,
    type: 'event_started',
    title: 'The Adventure Begins!',
    message: `The adventure begins! "${existing.name}" is now live. Good luck to all teams!`,
    metadata: { event_id: eventId, started_at: now },
    is_read: false,
  })

  if (notifError) {
    // Notification failure is non-fatal — event was started successfully
    console.error('Failed to insert start notification:', notifError.message)
  }

  return NextResponse.json({ data: event, error: null })
}
