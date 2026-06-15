import { createClient } from '@/lib/supabase/server'
import { AnalyticsClient } from './AnalyticsClient'

async function getAnalyticsData() {
  const supabase = await createClient()

  const [
    { data: events },
    { data: submissionsByDay },
    { data: topTeams },
    { data: missionStats },
  ] = await Promise.all([
    supabase.from('events').select('id, name, status, created_at').order('created_at', { ascending: false }).limit(10),
    supabase.from('submissions').select('submitted_at, status').order('submitted_at', { ascending: true }),
    supabase.from('scores').select('team_id, total_points, teams(name, color)').order('total_points', { ascending: false }).limit(10),
    supabase.from('missions').select('type, status, points').limit(100),
  ])

  const submissionMap = new Map<string, number>()
  ;(submissionsByDay ?? []).forEach((s: { submitted_at: string }) => {
    const day = new Date(s.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    submissionMap.set(day, (submissionMap.get(day) ?? 0) + 1)
  })
  const submissionChart = Array.from(submissionMap.entries())
    .slice(-14)
    .map(([date, count]) => ({ date, count }))

  const typeMap = new Map<string, number>()
  ;(missionStats ?? []).forEach((m: { type: string }) => {
    typeMap.set(m.type, (typeMap.get(m.type) ?? 0) + 1)
  })
  const missionBreakdown = Array.from(typeMap.entries()).map(([type, count]) => ({ type, count }))

  return {
    events: (events ?? []) as { id: string; name: string; status: string }[],
    submissionChart,
    topTeams: topTeams ?? [],
    missionBreakdown,
  }
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData()
  return <AnalyticsClient {...data} />
}
