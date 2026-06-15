import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'
import { generateStory } from '@/lib/ai/story-generator'

// POST /api/ai/generate-story — admin only
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
    const { eventName, companyName, numberOfTeams, theme, customTheme, event_id } = body

    if (!eventName || !numberOfTeams) {
      return NextResponse.json(
        { data: null, error: 'eventName and numberOfTeams are required' },
        { status: 400 }
      )
    }

    if (typeof numberOfTeams !== 'number' || numberOfTeams < 1) {
      return NextResponse.json(
        { data: null, error: 'numberOfTeams must be a positive number' },
        { status: 400 }
      )
    }

    const storyResponse = await generateStory({
      eventName: eventName.trim(),
      companyName: companyName?.trim(),
      numberOfTeams: Number(numberOfTeams),
      theme: theme ?? undefined,
      customTheme: customTheme?.trim(),
    })

    // Persist story to DB
    const { data: story, error: insertError } = await supabase
      .from('stories')
      .insert({
        event_id: event_id ?? null,
        title: storyResponse.title,
        content: storyResponse.content,
        theme: storyResponse.theme,
        key_elements: storyResponse.keyElements,
        mission_hints: storyResponse.missionHints,
        mood: storyResponse.mood,
      } as any)
      .select()
      .single()

    if (insertError) {
      return NextResponse.json(
        { data: null, error: insertError.message },
        { status: 500 }
      )
    }

    // Story is linked to the event via stories.event_id — no separate update needed

    return NextResponse.json({ data: story, error: null }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
