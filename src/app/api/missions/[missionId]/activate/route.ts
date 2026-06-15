import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'

interface RouteParams {
  params: Promise<{ missionId: string }>
}

// POST /api/missions/[missionId]/activate — admin only
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { missionId } = await params
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

    // Fetch the mission to get event_id
    const { data: mission, error: missionError } = await supabase
      .from('missions')
      .select('id, title, event_id, status')
      .eq('id', missionId)
      .single()

    if (missionError || !mission) {
      return NextResponse.json(
        { data: null, error: 'Mission not found' },
        { status: 404 }
      )
    }

    if (mission.status === 'completed') {
      return NextResponse.json(
        { data: null, error: 'Cannot activate a completed mission' },
        { status: 409 }
      )
    }

    const now = new Date().toISOString()

    // Deactivate all other active missions for this event
    const { error: deactivateError } = await supabase
      .from('missions')
      .update({
        status: 'upcoming',
        updated_at: now,
      })
      .eq('event_id', mission.event_id)
      .eq('status', 'active')
      .neq('id', missionId)

    if (deactivateError) {
      return NextResponse.json(
        { data: null, error: `Failed to deactivate other missions: ${deactivateError.message}` },
        { status: 500 }
      )
    }

    // Activate this mission
    const { data: activated, error: activateError } = await supabase
      .from('missions')
      .update({
        status: 'active',
        activated_at: now,
        updated_at: now,
      })
      .eq('id', missionId)
      .select()
      .single()

    if (activateError) {
      return NextResponse.json(
        { data: null, error: activateError.message },
        { status: 500 }
      )
    }

    // Create broadcast notification for all event participants
    const { error: notifError } = await supabase.from('notifications').insert({
      user_id: null,
      team_id: null,
      event_id: mission.event_id,
      type: 'mission_activated',
      title: 'New Mission Activated!',
      message: `New mission activated: ${mission.title}`,
      metadata: { mission_id: missionId, mission_title: mission.title },
      is_read: false,
    })

    if (notifError) {
      // Log but don't fail the request — activation succeeded
      console.error('Failed to create activation notification:', notifError.message)
    }

    return NextResponse.json({ data: activated, error: null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
