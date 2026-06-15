import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'

// GET /api/missions?eventId=<id>
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

    const { data: missions, error } = await supabase
      .from('missions')
      .select('*')
      .eq('event_id', eventId)
      .order('order_index', { ascending: true })

    if (error) {
      return NextResponse.json(
        { data: null, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: missions, error: null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}

// POST /api/missions — admin only
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

    // ── Batch save from MissionGenerator: { eventId, missions: [...] } ──
    if (body.eventId && Array.isArray(body.missions)) {
      const { eventId, missions } = body as {
        eventId: string
        missions: {
          title: string
          description: string
          type: string
          points: number
          time_limit_seconds?: number
          is_boss_battle?: boolean
        }[]
      }

      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id, admin_id')
        .eq('id', eventId)
        .single()

      if (eventError || !event) {
        return NextResponse.json({ data: null, error: 'Event not found' }, { status: 404 })
      }
      if (event.admin_id !== user.id) {
        return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })
      }

      const { data: maxRow } = await supabase
        .from('missions')
        .select('order_index')
        .eq('event_id', eventId)
        .order('order_index', { ascending: false })
        .limit(1)
        .maybeSingle()

      const startIndex = maxRow ? maxRow.order_index + 1 : 0

      const payloads = missions.map((m, idx) => ({
        event_id: eventId,
        title: m.title,
        description: m.description,
        instructions: '',
        type: m.type,
        status: 'upcoming' as const,
        difficulty: 'medium',
        points: Number(m.points),
        time_limit_seconds: m.time_limit_seconds ?? null,
        evaluation_criteria: '',
        hints: [] as string[],
        estimated_minutes: 10,
        order_index: startIndex + idx,
        is_boss_battle: Boolean(m.is_boss_battle ?? false),
      }))

      const { data: saved, error: insertError } = await supabase
        .from('missions')
        .insert(payloads as any)
        .select()

      if (insertError) {
        return NextResponse.json({ data: null, error: insertError.message }, { status: 500 })
      }

      return NextResponse.json({ data: saved, error: null }, { status: 201 })
    }

    // ── Single mission save ──
    const {
      event_id,
      story_id,
      title,
      description,
      instructions,
      type,
      difficulty,
      points,
      time_limit_seconds,
      evaluation_criteria,
      hints,
      estimated_minutes,
      is_boss_battle,
    } = body

    if (!event_id || !title || !description || !type || !difficulty || !points) {
      return NextResponse.json(
        { data: null, error: 'Missing required fields: event_id, title, description, type, difficulty, points' },
        { status: 400 }
      )
    }

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, admin_id')
      .eq('id', event_id)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ data: null, error: 'Event not found' }, { status: 404 })
    }
    if (event.admin_id !== user.id) {
      return NextResponse.json({ data: null, error: 'Forbidden: you do not own this event' }, { status: 403 })
    }

    const { data: maxRow } = await supabase
      .from('missions')
      .select('order_index')
      .eq('event_id', event_id)
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextOrderIndex = maxRow ? maxRow.order_index + 1 : 0

    const { data: mission, error: insertError } = await supabase
      .from('missions')
      .insert({
        event_id,
        story_id: story_id ?? null,
        title: title.trim(),
        description: description.trim(),
        instructions: instructions?.trim() ?? '',
        type,
        status: 'upcoming',
        difficulty,
        points: Number(points),
        time_limit_seconds: time_limit_seconds ? Number(time_limit_seconds) : null,
        evaluation_criteria: evaluation_criteria?.trim() ?? '',
        hints: Array.isArray(hints) ? hints : [],
        estimated_minutes: Number(estimated_minutes ?? 10),
        order_index: nextOrderIndex,
        is_boss_battle: Boolean(is_boss_battle ?? false),
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ data: null, error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ data: mission, error: null }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
