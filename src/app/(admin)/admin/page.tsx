import { createClient } from '@/lib/supabase/server'
import { Users, Trophy, Target, Activity, TrendingUp, Zap } from 'lucide-react'
import AnimatedCounter from '@/components/shared/AnimatedCounter'

async function getStats() {
  const supabase = await createClient()

  const [events, teams, submissions, users] = await Promise.all([
    supabase.from('events').select('id, status', { count: 'exact' }),
    supabase.from('teams').select('id', { count: 'exact' }),
    supabase.from('submissions').select('id', { count: 'exact' }),
    supabase.from('users').select('id', { count: 'exact' }),
  ])

  const activeEvents = events.data?.filter((e: { status: string }) => e.status === 'active').length ?? 0

  return {
    totalEvents: events.count ?? 0,
    activeEvents,
    totalTeams: teams.count ?? 0,
    totalSubmissions: submissions.count ?? 0,
    totalUsers: users.count ?? 0,
  }
}

async function getRecentEvents() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('events')
    .select('id, name, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  return (data ?? []) as { id: string; name: string; status: string; created_at: string }[]
}

export default async function AdminDashboard() {
  const [stats, recentEvents] = await Promise.all([getStats(), getRecentEvents()])

  const statCards = [
    { label: 'Total Events', value: stats.totalEvents, icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-600/10 border-yellow-500/20' },
    { label: 'Active Events', value: stats.activeEvents, icon: Activity, color: 'text-green-400', bg: 'bg-green-600/10 border-green-500/20' },
    { label: 'Teams', value: stats.totalTeams, icon: Users, color: 'text-blue-400', bg: 'bg-blue-600/10 border-blue-500/20' },
    { label: 'Submissions', value: stats.totalSubmissions, icon: Target, color: 'text-purple-400', bg: 'bg-purple-600/10 border-purple-500/20' },
    { label: 'Players', value: stats.totalUsers, icon: Zap, color: 'text-cyan-400', bg: 'bg-cyan-600/10 border-cyan-500/20' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white mb-1">Dashboard</h1>
        <p className="text-slate-400">ClueSprint AI — Game Master Console</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`glass-card p-5 rounded-2xl border ${bg}`}>
            <Icon className={`w-6 h-6 ${color} mb-3`} />
            <AnimatedCounter value={value} className={`text-3xl font-black ${color}`} />
            <p className="text-slate-400 text-sm mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl border border-slate-700/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
          <h2 className="text-white font-bold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" /> Recent Events
          </h2>
          <a href="/admin/events" className="text-blue-400 text-sm hover:underline">View all</a>
        </div>
        <div className="divide-y divide-slate-700/30">
          {recentEvents.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-500">No events yet</div>
          ) : (
            recentEvents.map(event => (
              <a
                key={event.id}
                href={`/admin/events/${event.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-slate-800/20 transition-colors"
              >
                <span className="text-slate-300">{event.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                  event.status === 'active' ? 'bg-green-600/10 border-green-500/30 text-green-400'
                  : event.status === 'completed' ? 'bg-slate-600/10 border-slate-500/30 text-slate-400'
                  : 'bg-amber-600/10 border-amber-500/30 text-amber-400'
                }`}>
                  {event.status}
                </span>
              </a>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
