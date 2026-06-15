import { createClient } from '@/lib/supabase/server'
import { Target, Camera, Palette, Puzzle, Bot } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const TYPE_ICONS: Record<string, React.ElementType> = {
  discovery: Camera,
  creative: Palette,
  puzzle: Puzzle,
  ai: Bot,
}

export default async function AdminMissionsPage() {
  const supabase = await createClient()

  const { data: missions } = await supabase
    .from('missions')
    .select('id, title, type, status, points, time_limit_seconds, is_boss_battle, events(name)')
    .order('created_at', { ascending: false })
    .limit(100)

  const missionList = (missions ?? []) as {
    id: string; title: string; type: string; status: string; points: number
    time_limit_seconds: number | null; is_boss_battle: boolean
    events: { name: string } | null
  }[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">All Missions</h1>
        <p className="text-slate-400">{missionList.length} missions across all events</p>
      </div>

      <div className="space-y-2">
        {missionList.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center border border-slate-700/50">
            <Target className="w-12 h-12 mx-auto mb-4 text-slate-600" />
            <p className="text-slate-400">No missions yet. Create an event and use AI generation.</p>
          </div>
        ) : (
          missionList.map(mission => {
            const Icon = TYPE_ICONS[mission.type] ?? Target

            return (
              <div
                key={mission.id}
                className="glass-card p-4 rounded-xl border border-slate-700/50 flex items-center gap-4"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-700/50 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-white font-medium truncate">{mission.title}</p>
                    {mission.is_boss_battle && <Badge variant="destructive" className="text-xs">⚔️ Boss</Badge>}
                  </div>
                  <div className="flex items-center gap-3 text-slate-400 text-xs">
                    <span>{mission.events?.name ?? 'No event'}</span>
                    <span>{mission.points} pts</span>
                    {mission.time_limit_seconds && <span>{mission.time_limit_seconds / 60}min</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant="secondary" className="text-xs">{mission.type}</Badge>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    mission.status === 'active' ? 'bg-green-600/10 text-green-400 border border-green-500/20'
                    : mission.status === 'completed' ? 'bg-slate-600/10 text-slate-400 border border-slate-500/20'
                    : 'bg-amber-600/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {mission.status}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
