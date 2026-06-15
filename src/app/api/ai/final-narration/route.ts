import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'
import { generateFinalNarration } from '@/lib/ai/final-narrator'
import type { FinalNarrationRequest } from '@/types/ai'

// POST /api/ai/final-narration — admin only
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
    const { eventId } = body

    if (!eventId) {
      return NextResponse.json(
        { data: null, error: 'eventId is required' },
        { status: 400 }
      )
    }

    // Fetch event with story
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*, stories(*)')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json(
        { data: null, error: 'Event not found' },
        { status: 404 }
      )
    }

    // Fetch all teams with their scores
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name, total_score, missions_completed')
      .eq('event_id', eventId)
      .eq('is_active', true)
      .order('total_score', { ascending: false })

    if (teamsError || !teams) {
      return NextResponse.json(
        { data: null, error: 'Failed to fetch teams' },
        { status: 500 }
      )
    }

    // Fetch top submission highlights per team
    const teamHighlightsMap: Record<string, string[]> = {}
    for (const team of teams) {
      const { data: topSubs } = await supabase
        .from('submissions')
        .select('missions(title), ai_feedback(narrative, highlights)')
        .eq('team_id', team.id)
        .order('score', { ascending: false })
        .limit(3)

      const highlights: string[] = []
      for (const sub of topSubs ?? []) {
        const mission = sub.missions as { title: string } | null
        const feedback = ((sub.ai_feedback as unknown) as { narrative: string | null; highlights: string[] }[])?.[0] ?? null

        if (mission?.title) highlights.push(mission.title)
        if (feedback?.narrative) highlights.push(feedback.narrative)
      }

      teamHighlightsMap[team.id] = highlights.slice(0, 3)
    }

    // Compute duration
    const startedAt = event.started_at ? new Date(event.started_at) : null
    const endedAt = event.ended_at ? new Date(event.ended_at) : new Date()
    let gameDuration = 'an epic session'
    if (startedAt) {
      const diffMs = endedAt.getTime() - startedAt.getTime()
      const diffMins = Math.round(diffMs / 60000)
      gameDuration =
        diffMins >= 60
          ? `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`
          : `${diffMins} minutes`
    }

    // Count total players across all teams
    const { count: totalPlayers } = await supabase
      .from('team_members')
      .select('id', { count: 'exact', head: true })
      .in(
        'team_id',
        teams.map((t) => t.id)
      )

    const story = ((event.stories as unknown) as { title: string; content: string }[])?.[0] ?? null

    const winnerTeam = teams[0]?.name ?? 'Unknown'

    const narrationRequest: FinalNarrationRequest = {
      eventName: event.name,
      storyTitle: story?.title ?? event.name,
      storyContent: story?.content ?? '',
      winnerTeam,
      totalPlayers: totalPlayers ?? 0,
      gameDuration,
      teams: teams.map((team, idx) => ({
        name: team.name,
        finalScore: team.total_score,
        rank: idx + 1,
        missionsCompleted: team.missions_completed,
        topMoments: teamHighlightsMap[team.id] ?? [],
      })),
    }

    const narration = await generateFinalNarration(narrationRequest)

    // Save narration as broadcast event notification
    const { error: notifError } = await supabase.from('notifications').insert({
      user_id: null,
      team_id: null,
      event_id: eventId,
      type: 'final_narration',
      title: `${event.name} — The Adventure Concludes!`,
      message: narration.winnerAnnouncement,
      metadata: {
        narration,
        winner_team: winnerTeam,
      },
      is_read: false,
    })

    if (notifError) {
      console.error('Failed to save narration notification:', notifError.message)
    }

    return NextResponse.json({ data: narration, error: null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
