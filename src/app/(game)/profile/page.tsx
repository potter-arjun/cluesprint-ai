import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { ProfileClient } from './ProfileClient'

export const metadata = { title: 'Profile' }

export default async function ProfilePage() {
  const user = await requireAuth()
  const supabase = await createClient()

  // Achievements with badge info
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

  // Fetch exact stats
  const { count: eventsPlayed } = await supabase
    .from('team_members')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { count: missionsCompleted } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'approved')

  const { data: scores } = await supabase
    .from('scores')
    .select('total_points')
    .eq('user_id', user.id)

  const totalScore = scores?.reduce((s, r) => s + (r.total_points ?? 0), 0) ?? user.total_score
  const avgScore = missionsCompleted && missionsCompleted > 0
    ? Math.round(totalScore / missionsCompleted)
    : 0

  const { count: badgesEarned } = await supabase
    .from('achievements')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  return (
    <ProfileClient
      user={user}
      achievements={achievements ?? []}
      stats={{
        eventsPlayed: eventsPlayed ?? user.events_played,
        missionsCompleted: missionsCompleted ?? user.missions_completed,
        totalScore,
        avgScore,
        totalXP: user.xp,
        currentLevel: user.level,
        achievements: badgesEarned ?? 0,
        badgesEarned: badgesEarned ?? 0,
      }}
    />
  )
}
