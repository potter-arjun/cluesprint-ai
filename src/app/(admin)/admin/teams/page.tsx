import { createClient } from '@/lib/supabase/server'
import { Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default async function AdminTeamsPage() {
  const supabase = await createClient()

  const { data: teams } = await supabase
    .from('teams')
    .select('id, name, color, event_id, total_score, events(name), team_members(count)')
    .order('created_at', { ascending: false })
    .limit(100)

  const teamList = (teams ?? []) as {
    id: string; name: string; color: string | null; event_id: string; total_score: number
    events: { name: string } | null
    team_members: { count: number }[]
  }[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">All Teams</h1>
        <p className="text-slate-400">{teamList.length} teams across all events</p>
      </div>

      <div className="glass-card rounded-2xl border border-slate-700/50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50 bg-slate-800/30">
              <th className="text-left px-6 py-3 text-slate-400 text-xs uppercase tracking-wider font-medium">Team</th>
              <th className="text-left px-6 py-3 text-slate-400 text-xs uppercase tracking-wider font-medium">Event</th>
              <th className="text-left px-6 py-3 text-slate-400 text-xs uppercase tracking-wider font-medium">Members</th>
              <th className="text-left px-6 py-3 text-slate-400 text-xs uppercase tracking-wider font-medium">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {teamList.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  No teams yet
                </td>
              </tr>
            ) : (
              teamList.map(team => {
                const memberCount = team.team_members?.[0]?.count ?? 0

                return (
                  <tr key={team.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: team.color ?? '#6366f1' }}
                        />
                        <span className="text-white font-medium">{team.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-sm">{team.events?.name ?? '—'}</td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary" className="text-xs">
                        <Users className="w-3 h-3 mr-1" />{memberCount}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white font-mono font-bold">{team.total_score.toLocaleString()}</span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
