import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'
import { generateMissionSet } from '@/lib/ai/mission-generator'

// POST /api/ai/generate-missions — admin only
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
    const { eventId, storyContext: passedContext, storyTheme, theme, count, teamCount } = body
    const resolvedTheme = storyTheme || theme

    if (!eventId || !resolvedTheme) {
      return NextResponse.json(
        { data: null, error: 'eventId and storyTheme are required' },
        { status: 400 }
      )
    }

    const missionCount = typeof count === 'number' && count > 0 ? count : 6
    const teams = typeof teamCount === 'number' && teamCount > 0 ? teamCount : 4

    // Verify admin owns this event (events table has no story_id column)
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, admin_id, name, theme')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json(
        { data: null, error: 'Event not found' },
        { status: 404 }
      )
    }

    if (event.admin_id !== user.id) {
      return NextResponse.json(
        { data: null, error: 'Forbidden: you do not own this event' },
        { status: 403 }
      )
    }

    // Resolve story context and id by fetching the event's story
    let storyContext = passedContext as string | undefined
    let storyId: string | null = null

    const { data: existingStory } = await supabase
      .from('stories')
      .select('id, content')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingStory) {
      storyId = existingStory.id as string
      if (!storyContext) storyContext = existingStory.content as string
    }

    if (!storyContext) {
      storyContext = `A ${resolvedTheme} themed corporate team-building adventure for ${event.name}`
    }

    // Generate mission set via AI
    const generatedMissions = await generateMissionSet(
      storyContext.trim(),
      resolvedTheme.trim(),
      missionCount,
      teams
    )

    // Determine starting order_index
    const { data: maxRow } = await supabase
      .from('missions')
      .select('order_index')
      .eq('event_id', eventId)
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle()

    const startIndex = maxRow ? maxRow.order_index + 1 : 0

    // Bulk insert missions
    const insertPayloads = generatedMissions.map((m, idx) => ({
      event_id: eventId,
      story_id: storyId,
      title: m.title,
      description: m.description,
      instructions: m.instructions,
      type: m.type,
      status: 'upcoming' as const,
      difficulty: idx === generatedMissions.length - 1 && generatedMissions.length > 3
        ? 'hard'
        : (idx < 2 ? 'easy' : idx < 4 ? 'medium' : 'hard') as 'easy' | 'medium' | 'hard',
      points: m.points,
      time_limit_seconds: m.estimatedMinutes * 60,
      evaluation_criteria: m.evaluationCriteria,
      hints: m.hints,
      estimated_minutes: m.estimatedMinutes,
      order_index: startIndex + idx,
      is_boss_battle: idx === generatedMissions.length - 1 && generatedMissions.length > 3,
    }))

    const { data: missions, error: insertError } = await supabase
      .from('missions')
      .insert(insertPayloads as any)
      .select()

    if (insertError) {
      return NextResponse.json(
        { data: null, error: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { data: missions, error: null },
      { status: 201 }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
