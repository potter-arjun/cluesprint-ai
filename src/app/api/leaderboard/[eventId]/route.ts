import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'
import type { LeaderboardEntry } from '@/types/game'
import type { LeaderboardRow } from '@/types/database'

interface RouteParams {
  params: Promise<{ eventId: string }>
}

// GET /api/leaderboard/[eventId]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { eventId } = await params
    const supabase = await createClient()
    const user = await getUser()

    if (!user) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Identify current user's team in this event
    const { data: membership } = await supabase
      .from('team_members')
      .select('team_id, teams!inner(event_id)')
      .eq('user_id', user.id)
      .eq('teams.event_id', eventId)
      .maybeSingle()

    const currentTeamId = membership?.team_id ?? null

    // Call the Supabase DB function for the ordered leaderboard
    const { data: rows, error: lbError } = await supabase.rpc(
      'get_event_leaderboard',
      { p_event_id: eventId }
    )

    if (lbError) {
      return NextResponse.json(
        { data: null, error: lbError.message },
        { status: 500 }
      )
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json({ data: [], error: null })
    }

    // Fetch badges for all teams on this leaderboard
    const teamIds = (rows as LeaderboardRow[]).map((r) => r.team_id)

    const { data: teamBadgesRaw, error: badgesError } = await supabase
      .from('team_badges')
      .select('team_id, badges(*)')
      .in('team_id', teamIds)
      .eq('event_id', eventId)

    if (badgesError) {
      console.error('Failed to fetch team badges:', badgesError.message)
    }

    // Build badge map keyed by team_id
    const badgesByTeam: Record<string, typeof teamBadgesRaw extends null ? never[] : NonNullable<typeof teamBadgesRaw>[0]['badges'][]> = {}
    for (const tb of teamBadgesRaw ?? []) {
      if (!badgesByTeam[tb.team_id]) badgesByTeam[tb.team_id] = []
      if (tb.badges) {
        badgesByTeam[tb.team_id].push(tb.badges as never)
      }
    }

    // Get last submission time per team (for tiebreaking display)
    const { data: lastSubmissions } = await supabase
      .from('submissions')
      .select('team_id, submitted_at')
      .in('team_id', teamIds)
      .order('submitted_at', { ascending: false })

    const lastSubmitByTeam: Record<string, string> = {}
    for (const sub of lastSubmissions ?? []) {
      if (!lastSubmitByTeam[sub.team_id]) {
        lastSubmitByTeam[sub.team_id] = sub.submitted_at
      }
    }

    // Build LeaderboardEntry array
    const leaderboard: (LeaderboardEntry & { last_submission_at: string | null })[] = (
      rows as LeaderboardRow[]
    ).map((row) => ({
      team_id: row.team_id,
      team_name: row.team_name,
      team_color: row.team_color,
      total_score: row.total_score,
      missions_completed: row.missions_completed,
      rank: row.rank,
      badges: (badgesByTeam[row.team_id] ?? []) as LeaderboardEntry['badges'],
      is_current_team: row.team_id === currentTeamId,
      last_submission_at: lastSubmitByTeam[row.team_id] ?? null,
    }))

    return NextResponse.json({ data: leaderboard, error: null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
