import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardClient } from './DashboardClient'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const user = await requireAuth()
  if (user.role === 'admin') redirect('/admin')
  const supabase = await createClient()

  // Active events user is participating in (via team_members -> teams -> events)
  const { data: memberships } = await supabase
    .from('team_members')
    .select(`
      team_id,
      role,
      teams (
        id,
        name,
        color,
        total_score,
        missions_completed,
        event_id,
        events (
          id,
          name,
          status,
          started_at,
          ended_at
        )
      )
    `)
    .eq('user_id', user.id)

  // Recent achievements (last 5)
  const { data: achievements } = await supabase
    .from('achievements')
    .select(`
      id,
      earned_at,
      badges (
        id,
        name,
        description,
        icon
      )
    `)
    .eq('user_id', user.id)
    .order('earned_at', { ascending: false })
    .limit(5)

  // Total score from scores table
  const { data: scoreData } = await supabase
    .from('scores')
    .select('total_points')
    .eq('user_id', user.id)

  const totalScore = scoreData?.reduce((sum, s) => sum + (s.total_points ?? 0), 0) ?? user.total_score

  // All active public events (for "Available Events")
  const { data: allActiveEvents } = await supabase
    .from('events')
    .select('id, name, status, max_teams, max_players_per_team, join_code, starts_at')
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(10)

  // Events user is already in
  const userEventIds = new Set(
    memberships
      ?.map((m) => (m.teams as { event_id?: string } | null)?.event_id)
      .filter(Boolean) as string[]
  )

  const availableEvents = allActiveEvents?.filter((e) => !userEventIds.has(e.id)) ?? []

  // Missions count from submissions
  const { count: missionsCount } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'approved')

  const { count: eventsPlayedCount } = await supabase
    .from('team_members')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { count: achievementsCount } = await supabase
    .from('achievements')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  return (
    <DashboardClient
      user={user}
      memberships={memberships ?? []}
      recentAchievements={achievements ?? []}
      availableEvents={availableEvents}
      stats={{
        totalScore,
        missionsCompleted: missionsCount ?? user.missions_completed,
        eventsPlayed: eventsPlayedCount ?? user.events_played,
        achievements: achievementsCount ?? 0,
      }}
    />
  )
}
