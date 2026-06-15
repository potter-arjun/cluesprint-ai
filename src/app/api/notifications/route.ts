import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'

// GET /api/notifications?eventId=<id>
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json(
        { data: null, error: 'eventId query parameter is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const user = await getUser()

    if (!user) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch player's team_id for this event
    const { data: membership } = await supabase
      .from('team_members')
      .select('team_id, teams!inner(event_id)')
      .eq('user_id', user.id)
      .eq('teams.event_id', eventId)
      .maybeSingle()

    const teamId = membership?.team_id ?? null

    // Return broadcast (event-level) notifications + user-specific + team-specific
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
      .limit(50)

    // Build OR filter: event broadcast OR user-specific OR team-specific
    const orClauses: string[] = [
      'user_id.is.null,team_id.is.null', // broadcast
      `user_id.eq.${user.id}`,
    ]

    if (teamId) {
      orClauses.push(`team_id.eq.${teamId}`)
    }

    query = query.or(orClauses.join(','))

    const { data: notifications, error } = await query

    if (error) {
      return NextResponse.json(
        { data: null, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: notifications, error: null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}

// POST /api/notifications — admin only
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const user = await getUser()

    if (!user) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { data: null, error: 'Forbidden: admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { event_id, user_id, team_id, type, title, message, metadata } = body

    if (!event_id || !type || !title || !message) {
      return NextResponse.json(
        { data: null, error: 'event_id, type, title, and message are required' },
        { status: 400 }
      )
    }

    const { data: notification, error: insertError } = await supabase
      .from('notifications')
      .insert({
        event_id,
        user_id: user_id ?? null,
        team_id: team_id ?? null,
        type,
        title: title.trim(),
        message: message.trim(),
        metadata: metadata ?? null,
        is_read: false,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json(
        { data: null, error: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: notification, error: null }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
