import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'

interface RouteParams {
  params: Promise<{ missionId: string }>
}

// GET /api/missions/[missionId] — mission with story and submission count
export async function GET(_request: NextRequest, { params }: RouteParams) {
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

    const { data: mission, error: missionError } = await supabase
      .from('missions')
      .select('*, stories(*)')
      .eq('id', missionId)
      .single()

    if (missionError || !mission) {
      return NextResponse.json(
        { data: null, error: 'Mission not found' },
        { status: 404 }
      )
    }

    // Count submissions for this mission
    const { count: submissionsCount } = await supabase
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .eq('mission_id', missionId)

    const result = {
      ...mission,
      submissions_count: submissionsCount ?? 0,
    }

    return NextResponse.json({ data: result, error: null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}

// PATCH /api/missions/[missionId] — admin only
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const body = await request.json()

    // Only allow patching safe fields
    const allowedFields = [
      'title',
      'description',
      'instructions',
      'type',
      'difficulty',
      'points',
      'time_limit_seconds',
      'evaluation_criteria',
      'hints',
      'estimated_minutes',
      'order_index',
      'is_boss_battle',
      'story_id',
      'status',
    ]

    const updatePayload: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updatePayload[field] = body[field]
      }
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { data: null, error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    updatePayload.updated_at = new Date().toISOString()

    const { data: updated, error: updateError } = await supabase
      .from('missions')
      .update(updatePayload)
      .eq('id', missionId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { data: null, error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: updated, error: null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}

// DELETE /api/missions/[missionId] — admin only, no submissions
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
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

    // Check submissions exist
    const { count: submissionsCount } = await supabase
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .eq('mission_id', missionId)

    if (submissionsCount && submissionsCount > 0) {
      return NextResponse.json(
        {
          data: null,
          error: `Cannot delete mission — it has ${submissionsCount} submission(s)`,
        },
        { status: 409 }
      )
    }

    const { error: deleteError } = await supabase
      .from('missions')
      .delete()
      .eq('id', missionId)

    if (deleteError) {
      return NextResponse.json(
        { data: null, error: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: { deleted: true, missionId }, error: null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
