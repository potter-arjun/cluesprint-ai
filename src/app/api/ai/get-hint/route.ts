import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'
import { generateHint } from '@/lib/ai/hint-generator'

// POST /api/ai/get-hint — authenticated
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

    const body = await request.json()
    const { missionId, teamId, hintNumber, teamProgress } = body

    if (!missionId || !teamId || !hintNumber) {
      return NextResponse.json(
        { data: null, error: 'missionId, teamId, and hintNumber are required' },
        { status: 400 }
      )
    }

    if (hintNumber < 1 || hintNumber > 3) {
      return NextResponse.json(
        { data: null, error: 'hintNumber must be between 1 and 3' },
        { status: 400 }
      )
    }

    // Verify user is in the specified team
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (membershipError || !membership) {
      return NextResponse.json(
        { data: null, error: 'You are not a member of this team' },
        { status: 403 }
      )
    }

    // Fetch mission with story context
    const { data: mission, error: missionError } = await supabase
      .from('missions')
      .select('*, stories(content, title, theme)')
      .eq('id', missionId)
      .single()

    if (missionError || !mission) {
      return NextResponse.json(
        { data: null, error: 'Mission not found' },
        { status: 404 }
      )
    }

    if (mission.status !== 'active') {
      return NextResponse.json(
        { data: null, error: 'Hints are only available for active missions' },
        { status: 409 }
      )
    }

    const storyContext = mission.stories
      ? `${(mission.stories as { title: string }).title}: ${(mission.stories as { content: string }).content.substring(0, 300)}`
      : 'Corporate adventure game'

    // Generate hint via AI
    const hintResponse = await generateHint({
      missionTitle: mission.title,
      missionDescription: mission.description,
      storyContext,
      hintNumber: Number(hintNumber),
      teamProgress: teamProgress?.trim() ?? undefined,
    })

    // Log the hint request for analytics
    await supabase.from('notifications').insert({
      user_id: user.id,
      team_id: teamId,
      event_id: mission.event_id,
      type: 'hint_requested',
      title: `Hint #${hintNumber} requested`,
      message: `Team requested hint #${hintNumber} for: ${mission.title}`,
      metadata: {
        mission_id: missionId,
        hint_number: hintNumber,
        hint_text: hintResponse.hint,
      },
      is_read: true,
    })

    return NextResponse.json({ data: hintResponse, error: null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
