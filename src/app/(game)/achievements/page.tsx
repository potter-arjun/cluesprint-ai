'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Star,
  Zap,
  Lock,
  CheckCircle,
  Flag,
  Shield,
  Bot,
  Camera,
  Users,
  Palette,
  Trophy,
  Loader2,
  Medal,
  Sparkles,
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ─── Helpers ──────────────────────────────────────────────────

function getLevelXP(level: number) {
  return level * 1000
}

function getLevelTitle(level: number) {
  if (level >= 20) return 'Legendary'
  if (level >= 15) return 'Master'
  if (level >= 10) return 'Expert'
  if (level >= 7) return 'Elite'
  if (level >= 5) return 'Veteran'
  if (level >= 3) return 'Skilled'
  return 'Rookie'
}

function getAchievementIcon(icon: string, size = 'w-6 h-6') {
  const map: Record<string, React.ReactNode> = {
    flag: <Flag className={size} />,
    star: <Star className={size} />,
    zap: <Zap className={size} />,
    palette: <Palette className={size} />,
    users: <Users className={size} />,
    bot: <Bot className={size} />,
    shield: <Shield className={size} />,
    camera: <Camera className={size} />,
    trophy: <Trophy className={size} />,
    medal: <Medal className={size} />,
  }
  return map[icon] ?? <Star className={size} />
}

function getRarityConfig(rarity: string) {
  switch (rarity) {
    case 'legendary':
      return {
        text: 'text-yellow-400',
        bg: 'bg-yellow-400/10',
        border: 'border-yellow-400/40',
        glow: '0 0 20px rgba(234,179,8,0.3)',
        label: 'Legendary',
        icon: 'text-yellow-400',
      }
    case 'epic':
      return {
        text: 'text-purple-400',
        bg: 'bg-purple-400/10',
        border: 'border-purple-400/40',
        glow: '0 0 20px rgba(168,85,247,0.3)',
        label: 'Epic',
        icon: 'text-purple-400',
      }
    case 'rare':
      return {
        text: 'text-blue-400',
        bg: 'bg-blue-400/10',
        border: 'border-blue-400/40',
        glow: '0 0 20px rgba(37,99,235,0.3)',
        label: 'Rare',
        icon: 'text-blue-400',
      }
    default:
      return {
        text: 'text-slate-300',
        bg: 'bg-slate-400/10',
        border: 'border-slate-500/30',
        glow: 'none',
        label: 'Common',
        icon: 'text-slate-400',
      }
  }
}

// ─── Types ────────────────────────────────────────────────────

interface AchievementItem {
  id: string
  badge_id: string
  name: string
  description: string
  icon: string
  rarity: string
  earned: boolean
  earned_at: string | null
  event_id: string | null
  // progress is optional client-side only
  progress?: number
}

type FilterTab = 'all' | 'earned' | 'locked'

// ─── Achievement Card ─────────────────────────────────────────

function AchievementCard({ item, index }: { item: AchievementItem; index: number }) {
  const rarity = getRarityConfig(item.rarity)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      whileHover={item.earned ? { y: -4, boxShadow: rarity.glow } : undefined}
      className={cn(
        'glass-card p-5 rounded-xl border flex flex-col gap-3 relative overflow-hidden transition-all duration-300',
        item.earned ? rarity.border : 'border-slate-700/40 opacity-60',
        item.earned ? 'bg-slate-800/60' : 'bg-slate-800/30'
      )}
      style={item.earned ? { boxShadow: `${rarity.glow}` } : undefined}
    >
      {/* Lock overlay for locked items */}
      {!item.earned && (
        <div className="absolute inset-0 rounded-xl flex items-center justify-center pointer-events-none">
          <div className="absolute top-3 right-3">
            <Lock className="w-4 h-4 text-slate-600" />
          </div>
        </div>
      )}

      {/* Earned badge */}
      {item.earned && (
        <div className="absolute top-3 right-3">
          <CheckCircle className="w-4 h-4 text-green-400" />
        </div>
      )}

      {/* Icon */}
      <div
        className={cn(
          'w-14 h-14 rounded-xl flex items-center justify-center border',
          item.earned ? `${rarity.bg} ${rarity.border}` : 'bg-slate-700/30 border-slate-700/40'
        )}
      >
        <div className={cn(item.earned ? rarity.icon : 'text-slate-600')}>
          {getAchievementIcon(item.icon, 'w-7 h-7')}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1">
        <div className="flex items-start gap-2 mb-1">
          <h3 className={cn('font-bold text-sm leading-tight', item.earned ? 'text-white' : 'text-slate-500')}>
            {item.name}
          </h3>
        </div>
        <p className={cn('text-xs leading-relaxed', item.earned ? 'text-slate-400' : 'text-slate-600')}>
          {item.description}
        </p>
      </div>

      {/* Rarity badge */}
      <div className="flex items-center justify-between">
        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full border', rarity.bg, rarity.border, rarity.text)}>
          {rarity.label}
        </span>
        {item.earned && item.earned_at && (
          <span className="text-xs text-slate-500">
            {new Date(item.earned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        )}
        {!item.earned && item.progress !== undefined && (
          <span className="text-xs text-slate-500">{item.progress}%</span>
        )}
      </div>

      {/* Progress bar for in-progress */}
      {!item.earned && item.progress !== undefined && item.progress > 0 && (
        <div>
          <Progress value={item.progress} className="h-1.5 bg-slate-700" />
        </div>
      )}
    </motion.div>
  )
}

// ─── Badge Hover Card ─────────────────────────────────────────

function BadgeChip({ item }: { item: AchievementItem }) {
  const rarity = getRarityConfig(item.rarity)
  return (
    <motion.div
      whileHover={{ scale: 1.08, y: -2 }}
      className={cn(
        'group relative flex flex-col items-center gap-2 p-4 rounded-xl border cursor-default transition-all duration-200',
        rarity.bg, rarity.border
      )}
      style={{ boxShadow: rarity.glow }}
    >
      <div className={cn('w-10 h-10 flex items-center justify-center', rarity.icon)}>
        {getAchievementIcon(item.icon, 'w-6 h-6')}
      </div>
      <p className={cn('text-xs font-bold text-center leading-tight', rarity.text)}>{item.name}</p>

      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
        <p className="font-semibold text-white mb-1">{item.name}</p>
        <p className="leading-relaxed">{item.description}</p>
        {item.earned_at && (
          <p className="text-slate-500 mt-1.5">
            Earned {new Date(item.earned_at).toLocaleDateString()}
          </p>
        )}
      </div>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────

export default function AchievementsPage() {
  const [loading, setLoading] = useState(true)
  const [earned, setEarned] = useState<AchievementItem[]>([])
  const [locked, setLocked] = useState<AchievementItem[]>([])
  const [userLevel, setUserLevel] = useState(1)
  const [userXP, setUserXP] = useState(0)
  const [activeTab, setActiveTab] = useState<FilterTab>('all')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/achievements')
        const json = await res.json()
        if (json.error) throw new Error(json.error)

        // The existing /api/achievements returns an array directly
        const data: Array<{
          id: string
          earned_at: string
          event_id: string | null
          badges: {
            id: string
            name: string
            description: string
            icon_url: string
            rarity: string
          } | null
        }> = json.data ?? []

        const earnedItems: AchievementItem[] = data.map((a) => ({
          id: a.id,
          badge_id: a.badges?.id ?? a.id,
          name: a.badges?.name ?? 'Achievement',
          description: a.badges?.description ?? '',
          icon: a.badges?.icon_url ?? 'star',
          rarity: a.badges?.rarity ?? 'common',
          earned: true,
          earned_at: a.earned_at,
          event_id: a.event_id,
        }))

        setEarned(earnedItems)

        // Fetch user profile for XP / level
        const profileRes = await fetch('/api/profile')
        const profileJson = await profileRes.json()
        if (profileJson.data) {
          setUserLevel(profileJson.data.level ?? 1)
          setUserXP(profileJson.data.xp ?? 0)
        }

        // Build some locked placeholder achievements from ACHIEVEMENT_DEFINITIONS
        const { ACHIEVEMENT_DEFINITIONS } = await import('@/lib/game/achievements')
        const earnedNames = new Set(earnedItems.map((e) => e.name))
        const lockedItems: AchievementItem[] = Object.entries(ACHIEVEMENT_DEFINITIONS)
          .filter(([, def]) => !earnedNames.has(def.title))
          .map(([key, def]) => ({
            id: `locked_${key}`,
            badge_id: key,
            name: def.title,
            description: def.description,
            icon: def.icon,
            rarity: 'common',
            earned: false,
            earned_at: null,
            event_id: null,
          }))
        setLocked(lockedItems)
      } catch (err) {
        toast.error('Failed to load achievements')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const xpNeeded = getLevelXP(userLevel)
  const xpPercent = Math.min((userXP / xpNeeded) * 100, 100)
  const levelTitle = getLevelTitle(userLevel)

  const allItems = [...earned, ...locked]

  const filtered = activeTab === 'earned'
    ? earned
    : activeTab === 'locked'
    ? locked
    : allItems

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: allItems.length },
    { key: 'earned', label: 'Earned', count: earned.length },
    { key: 'locked', label: 'Locked', count: locked.length },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-yellow-400" />
            Your Achievements
          </h1>
          <p className="text-slate-400 mt-1">
            Level {userLevel} {levelTitle}
            <span className="mx-2 text-slate-600">•</span>
            <span className="text-blue-400 font-semibold">{userXP.toLocaleString()} XP</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-white font-bold text-lg">{earned.length}</p>
            <p className="text-slate-500 text-xs">Unlocked</p>
          </div>
          <div className="w-px h-8 bg-slate-700" />
          <div className="text-right">
            <p className="text-white font-bold text-lg">{allItems.length}</p>
            <p className="text-slate-500 text-xs">Total</p>
          </div>
        </div>
      </motion.div>

      {/* XP Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-5 rounded-xl border border-blue-500/20"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="text-white font-semibold text-sm">Level {userLevel} Progress</span>
          </div>
          <span className="text-slate-400 text-sm">
            {userXP.toLocaleString()} / {xpNeeded.toLocaleString()} XP
          </span>
        </div>
        <Progress value={xpPercent} className="h-3 bg-slate-700" />
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          <span>Level {userLevel}</span>
          <span>{Math.round(xpPercent)}% to Level {userLevel + 1}</span>
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex gap-2 bg-slate-800/50 p-1.5 rounded-xl border border-slate-700/50 w-fit"
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              activeTab === tab.key
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            )}
          >
            {tab.label}
            <span className={cn(
              'text-xs px-1.5 py-0.5 rounded-full',
              activeTab === tab.key ? 'bg-blue-500/40 text-blue-100' : 'bg-slate-700 text-slate-400'
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </motion.div>

      {/* Achievements Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-12 rounded-xl border border-slate-700/50 text-center"
        >
          <Trophy className="w-12 h-12 mx-auto mb-3 text-slate-600 opacity-60" />
          <p className="text-slate-400 font-medium">No achievements here yet</p>
          <p className="text-slate-500 text-sm mt-1">
            {activeTab === 'earned'
              ? 'Complete missions to earn achievements'
              : 'All achievements are unlocked!'}
          </p>
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filtered.map((item, i) => (
              <AchievementCard key={item.id} item={item} index={i} />
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Earned Badges Section */}
      {!loading && earned.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="pt-4 border-t border-slate-700/50"
        >
          <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
            <Medal className="w-5 h-5 text-yellow-400" />
            Earned Badges
            <Badge variant="secondary" className="ml-1 text-xs">{earned.length}</Badge>
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {earned.map((item) => (
              <BadgeChip key={`badge-${item.id}`} item={item} />
            ))}
          </div>
        </motion.section>
      )}
    </div>
  )
}
