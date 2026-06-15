import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'

// GET /api/admin/stats — admin only
export async function GET(_request: NextRequest) {
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

    // Fetch active events owned by this admin
    const { data: activeEvents, error: eventsError } = await supabase
      .from('events')
      .select('id, name, started_at')
      .eq('admin_id', user.id)
      .eq('status', 'active')

    if (eventsError) {
      return NextResponse.json(
        { data: null, error: eventsError.message },
        { status: 500 }
      )
    }

    const activeEventIds = (activeEvents ?? []).map((e) => e.id)

    // Parallel fetches for stats
    const [
      teamsResult,
      playersResult,
      submissionsResult,
      scoresResult,
      recentSubmissionsResult,
    ] = await Promise.all([
      // Active teams
      activeEventIds.length > 0
        ? supabase
            .from('teams')
            .select('id', { count: 'exact', head: true })
            .in('event_id', activeEventIds)
            .eq('is_active', true)
        : Promise.resolve({ count: 0, error: null }),

      // Active players (distinct members of active teams)
      activeEventIds.length > 0
        ? supabase
            .from('team_members')
            .select('user_id', { count: 'exact', head: true })
            .in(
              'team_id',
              activeEventIds.length > 0
                ? (
                    await supabase
                      .from('teams')
                      .select('id')
                      .in('event_id', activeEventIds)
                      .eq('is_active', true)
                  ).data?.map((t) => t.id) ?? []
                : []
            )
        : Promise.resolve({ count: 0, error: null }),

      // Total submissions for active events
      activeEventIds.length > 0
        ? supabase
            .from('submissions')
            .select('id', { count: 'exact', head: true })
            .in(
              'mission_id',
              activeEventIds.length > 0
                ? (
                    await supabase
                      .from('missions')
                      .select('id')
                      .in('event_id', activeEventIds)
                  ).data?.map((m) => m.id) ?? []
                : []
            )
        : Promise.resolve({ count: 0, error: null }),

      // Scores for avg calculation
      activeEventIds.length > 0
        ? supabase
            .from('scores')
            .select('total_points')
            .in('event_id', activeEventIds)
        : Promise.resolve({ data: [], error: null }),

      // Recent submissions with team + mission
      activeEventIds.length > 0
        ? supabase
            .from('submissions')
            .select('*, teams(name, color), missions(title, event_id, points)')
            .in(
              'mission_id',
              (
                await supabase
                  .from('missions')
                  .select('id')
                  .in('event_id', activeEventIds)
              ).data?.map((m) => m.id) ?? []
            )
            .order('submitted_at', { ascending: false })
            .limit(10)
        : Promise.resolve({ data: [], error: null }),
    ])

    // Calculate completion rate: approved subs / total subs
    const totalSubmissions = submissionsResult.count ?? 0

    let approvedCount = 0
    if (activeEventIds.length > 0) {
      const { count } = await supabase
        .from('submissions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'approved')
        .in(
          'mission_id',
          (
            await supabase
              .from('missions')
              .select('id')
              .in('event_id', activeEventIds)
          ).data?.map((m) => m.id) ?? []
        )
      approvedCount = count ?? 0
    }

    const completionRate =
      totalSubmissions > 0
        ? Math.round((approvedCount / totalSubmissions) * 100)
        : 0

    // Average score across all score records
    const scores = (scoresResult.data ?? []) as { total_points: number }[]
    const avgScore =
      scores.length > 0
        ? Math.round(
            scores.reduce((sum, s) => sum + s.total_points, 0) / scores.length
          )
        : 0

    // Top 5 teams across all active events
    const { data: topTeams } = activeEventIds.length > 0
      ? await supabase
          .from('teams')
          .select('id, name, color, total_score, missions_completed, event_id, events(name)')
          .in('event_id', activeEventIds)
          .eq('is_active', true)
          .order('total_score', { ascending: false })
          .limit(5)
      : { data: [] }

    const stats = {
      activeEvents: activeEventIds.length,
      activePlayers: playersResult.count ?? 0,
      activeTeams: teamsResult.count ?? 0,
      totalSubmissions,
      avgScore,
      completionRate,
      recentSubmissions: recentSubmissionsResult.data ?? [],
      topTeams: topTeams ?? [],
    }

    return NextResponse.json({ data: stats, error: null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
