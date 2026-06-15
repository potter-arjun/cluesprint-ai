'use client'

import { motion } from 'framer-motion'
import { Camera, Palette, Puzzle, Bot, Clock, Star, CheckCircle2, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Mission } from '@/types/database'

interface MissionCardProps {
  mission: Mission
  isActive?: boolean
  isCompleted?: boolean
  onClick?: () => void
  teamSubmitted?: boolean
  compact?: boolean
}

const TYPE_CONFIG = {
  discovery: { icon: Camera, label: 'Discovery', color: '#06B6D4', bg: 'bg-cyan-600/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  creative: { icon: Palette, label: 'Creative', color: '#7C3AED', bg: 'bg-violet-600/20', text: 'text-violet-400', border: 'border-violet-500/30' },
  puzzle: { icon: Puzzle, label: 'Puzzle', color: '#2563EB', bg: 'bg-blue-600/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  ai: { icon: Bot, label: 'AI Mission', color: '#10B981', bg: 'bg-emerald-600/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
}

export function MissionCard({ mission, isActive, isCompleted, onClick, teamSubmitted, compact = false }: MissionCardProps) {
  const typeConfig = TYPE_CONFIG[mission.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.puzzle
  const TypeIcon = typeConfig.icon

  return (
    <motion.div
      whileHover={onClick ? { y: -2, scale: 1.01 } : undefined}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={cn(
        'glass-card rounded-xl border transition-all',
        compact ? 'p-3' : 'p-5',
        onClick && 'cursor-pointer',
        isActive && 'border-blue-500/40 shadow-[0_0_20px_rgba(37,99,235,0.15)] animate-[glow_2s_ease-in-out_infinite_alternate]',
        isCompleted && 'opacity-60',
        !isActive && !isCompleted && 'border-slate-700/50'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', typeConfig.bg)}>
            <TypeIcon className={cn('w-4 h-4', typeConfig.text)} />
          </div>
          <div className="min-w-0">
            <p className={cn('font-semibold text-white truncate', compact ? 'text-sm' : 'text-base')}>
              {mission.title}
            </p>
            {!compact && (
              <Badge className={cn('text-xs mt-0.5', typeConfig.bg, typeConfig.text, typeConfig.border)}>
                {typeConfig.label}
              </Badge>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="flex-shrink-0 flex flex-col items-end gap-1">
          {isActive && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-xs font-bold">ACTIVE</span>
            </div>
          )}
          {isCompleted && (
            <CheckCircle2 className="w-4 h-4 text-slate-500" />
          )}
          {!isActive && !isCompleted && (
            <span className="text-amber-400 text-xs font-medium">UPCOMING</span>
          )}
        </div>
      </div>

      {/* Description */}
      {!compact && (
        <p className="text-slate-400 text-sm leading-relaxed mb-3 line-clamp-2">
          {mission.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 text-amber-400">
          <Star className="w-3 h-3" />
          <span className="text-xs font-bold">{mission.points} pts</span>
        </div>

        {mission.time_limit_seconds && (
          <div className="flex items-center gap-1 text-slate-400">
            <Clock className="w-3 h-3" />
            <span className="text-xs">{Math.floor(mission.time_limit_seconds / 60)}m</span>
          </div>
        )}

        {mission.is_boss_battle && (
          <Badge className="text-xs bg-red-600/20 text-red-400 border-red-500/30">⚔️ Boss Battle</Badge>
        )}

        {teamSubmitted && (
          <Badge className="text-xs bg-green-600/20 text-green-400 border-green-500/30 ml-auto">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Submitted
          </Badge>
        )}
      </div>
    </motion.div>
  )
}
