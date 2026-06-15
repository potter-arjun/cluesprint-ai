'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Crown, Medal, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { LeaderboardEntry } from '@/types/game'

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  currentTeamId?: string
  compact?: boolean
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
        <Crown className="w-4 h-4 text-amber-400" />
      </div>
    )
  }
  if (rank === 2) {
    return (
      <div className="w-8 h-8 rounded-full bg-slate-400/20 border border-slate-400/30 flex items-center justify-center">
        <Medal className="w-4 h-4 text-slate-300" />
      </div>
    )
  }
  if (rank === 3) {
    return (
      <div className="w-8 h-8 rounded-full bg-amber-700/20 border border-amber-700/30 flex items-center justify-center">
        <Medal className="w-4 h-4 text-amber-700" />
      </div>
    )
  }
  return (
    <div className="w-8 h-8 flex items-center justify-center">
      <span className="text-slate-500 font-bold text-sm">{rank}</span>
    </div>
  )
}

export function LeaderboardTable({ entries, currentTeamId, compact = false }: LeaderboardTableProps) {
  if (!entries || entries.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p>No teams on the leaderboard yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {entries.map((entry, index) => {
          const isCurrentTeam = entry.team_id === currentTeamId
          return (
            <motion.div
              key={entry.team_id}
              layout
              layoutId={`lb-${entry.team_id}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, layout: { duration: 0.4, type: 'spring', stiffness: 200 } }}
              className={cn(
                'flex items-center gap-3 rounded-xl border transition-all',
                compact ? 'p-3' : 'p-4',
                isCurrentTeam
                  ? 'bg-blue-600/10 border-blue-500/40 shadow-[0_0_15px_rgba(37,99,235,0.1)]'
                  : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600/50 hover:bg-slate-800/60'
              )}
            >
              <RankBadge rank={entry.rank} />

              {/* Team avatar */}
              <div
                className={cn(
                  'rounded-full flex items-center justify-center text-white font-bold flex-shrink-0',
                  compact ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base'
                )}
                style={{ backgroundColor: entry.team_color }}
              >
                {entry.team_name.charAt(0).toUpperCase()}
              </div>

              {/* Team name */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn('font-semibold text-white truncate', compact ? 'text-sm' : 'text-base')}>
                    {entry.team_name}
                  </span>
                  {isCurrentTeam && (
                    <Badge className="text-xs bg-blue-600/30 text-blue-300 border-blue-500/30 py-0">
                      You
                    </Badge>
                  )}
                </div>
                {!compact && (
                  <p className="text-slate-500 text-xs">{entry.missions_completed} missions completed</p>
                )}
              </div>

              {/* Badges */}
              {!compact && entry.badges && entry.badges.length > 0 && (
                <div className="hidden sm:flex items-center gap-1">
                  {entry.badges.slice(0, 3).map((_, i) => (
                    <div key={i} className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/30" />
                  ))}
                  {entry.badges.length > 3 && (
                    <span className="text-slate-500 text-xs">+{entry.badges.length - 3}</span>
                  )}
                </div>
              )}

              {/* Score */}
              <div className="text-right flex-shrink-0">
                <motion.p
                  key={entry.total_score}
                  initial={{ scale: 1.3, color: '#60A5FA' }}
                  animate={{ scale: 1, color: '#FFFFFF' }}
                  transition={{ duration: 0.4 }}
                  className={cn('font-bold tabular-nums', compact ? 'text-lg' : 'text-xl')}
                >
                  {entry.total_score.toLocaleString()}
                </motion.p>
                {!compact && <p className="text-slate-500 text-xs">pts</p>}
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
