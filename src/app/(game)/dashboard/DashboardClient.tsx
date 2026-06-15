'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Trophy,
  Target,
  Calendar,
  Star,
  Zap,
  ArrowRight,
  Users,
  Play,
  Lock,
  Flag,
  Shield,
  Camera,
  Bot,
  Palette,
  Hash,
  Loader2,
  ChevronRight,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import AnimatedCounter from '@/components/shared/AnimatedCounter'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { User } from '@/types/database'
import { toast } from 'sonner'

// ─── Helpers ──────────────────────────────────────────────────

function getLevelXP(level: number) {
  return level * 1000
}

function getAchievementIcon(icon: string) {
  const icons: Record<string, React.ReactNode> = {
    flag: <Flag className="w-4 h-4" />,
    star: <Star className="w-4 h-4" />,
    zap: <Zap className="w-4 h-4" />,
    palette: <Palette className="w-4 h-4" />,
    users: <Users className="w-4 h-4" />,
    bot: <Bot className="w-4 h-4" />,
    shield: <Shield className="w-4 h-4" />,
    camera: <Camera className="w-4 h-4" />,
  }
  return icons[icon] ?? <Star className="w-4 h-4" />
}

function getRarityColor(rarity: string) {
  switch (rarity) {
    case 'legendary': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
    case 'epic': return 'text-purple-400 bg-purple-400/10 border-purple-400/30'
    case 'rare': return 'text-blue-400 bg-blue-400/10 border-blue-400/30'
    default: return 'text-slate-300 bg-slate-400/10 border-slate-400/30'
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'active': return 'bg-green-500/20 text-green-400 border-green-500/40'
    case 'paused': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
    case 'completed': return 'bg-slate-500/20 text-slate-400 border-slate-500/40'
    default: return 'bg-slate-500/20 text-slate-400 border-slate-500/40'
  }
}

// ─── Props ────────────────────────────────────────────────────

interface TeamWithEvent {
  team_id: string
  role: string
  teams: {
    id: string
    name: string
    color: string
    total_score: number
    missions_completed: number
    event_id: string
    events: {
      id: string
      name: string
      status: string
      started_at: string | null
      ended_at: string | null
    } | null
  } | null
}

interface AchievementWithBadge {
  id: string
  earned_at: string
  badges: {
    id: string
    name: string
    description: string
    icon: string
  } | null
}

interface AvailableEvent {
  id: string
  name: string
  status: string
  join_code: string | null
}

interface Stats {
  totalScore: number
  missionsCompleted: number
  eventsPlayed: number
  achievements: number
}

interface Props {
  user: User
  memberships: TeamWithEvent[]
  recentAchievements: AchievementWithBadge[]
  availableEvents: AvailableEvent[]
  stats: Stats
}

// ─── Stat Card ────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  glowClass,
  delay,
}: {
  label: string
  value: number
  icon: React.ElementType
  color: string
  glowClass: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={cn('glass-card p-5 rounded-xl border transition-all duration-300 hover:-translate-y-1', glowClass)}
      style={{ borderColor: color + '33' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: color + '20', border: `1px solid ${color}40` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <TrendingUp className="w-4 h-4 text-slate-600" />
      </div>
      <div className="text-3xl font-black text-white mb-1">
        <AnimatedCounter value={value} className="" />
      </div>
      <p className="text-slate-400 text-sm font-medium">{label}</p>
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────

export function DashboardClient({ user, memberships, recentAchievements, availableEvents, stats }: Props) {
  const router = useRouter()
  const [joinCode, setJoinCode] = useState('')
  const [joiningEvent, setJoiningEvent] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const xpNeeded = getLevelXP(user.level)
  const xpPercent = Math.min((user.xp / xpNeeded) * 100, 100)

  const activeEvents = memberships.filter(
    (m) => m.teams?.events?.status === 'active' || m.teams?.events?.status === 'paused'
  )

  async function handleJoinEvent() {
    if (!joinCode.trim() || joinCode.trim().length < 4) {
      toast.error('Please enter a valid event code')
      return
    }
    setJoiningEvent(true)
    try {
      const supabase = createClient()
      const { data: events, error } = await supabase
        .from('events')
        .select('id, name, status')
        .eq('join_code', joinCode.trim().toUpperCase())
        .in('status', ['active', 'paused'])
        .limit(1)

      if (error) throw error
      if (!events || events.length === 0) {
        toast.error('No active event found with that code')
        return
      }
      router.push(`/events/${events[0].id}`)
    } catch {
      toast.error('Failed to find event. Please try again.')
    } finally {
      setJoiningEvent(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">

      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-6"
      >
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white border-2 border-blue-500/40 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
            >
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.name} className="w-full h-full rounded-2xl object-cover" />
              ) : (
                user.name?.charAt(0)?.toUpperCase() ?? 'P'
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-slate-900" />
          </div>

          <div>
            <p className="text-slate-400 text-sm font-medium">Welcome back,</p>
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              {user.name || 'Player'}!
            </h1>
          </div>
        </div>

        {/* Level + XP bar */}
        <div className="glass-card px-5 py-4 rounded-xl border border-blue-500/20 min-w-[240px]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div
                className="px-2.5 py-1 rounded-lg text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, #2563EB22, #7C3AED22)', color: '#93c5fd', border: '1px solid #2563EB44' }}
              >
                Level {user.level}
              </div>
              <span className="text-slate-400 text-xs capitalize">{user.role}</span>
            </div>
            <span className="text-slate-400 text-xs">{user.xp.toLocaleString()} XP</span>
          </div>
          <Progress value={xpPercent} className="h-2 bg-slate-700" />
          <p className="text-slate-500 text-xs mt-1.5">
            {(xpNeeded - user.xp).toLocaleString()} XP to Level {user.level + 1}
          </p>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Score" value={stats.totalScore} icon={Trophy} color="#2563EB" glowClass="hover:glow-blue" delay={0.05} />
        <StatCard label="Missions Completed" value={stats.missionsCompleted} icon={Target} color="#7C3AED" glowClass="hover:glow-purple" delay={0.1} />
        <StatCard label="Events Played" value={stats.eventsPlayed} icon={Calendar} color="#06B6D4" glowClass="hover:glow-cyan" delay={0.15} />
        <StatCard label="Achievements" value={stats.achievements} icon={Star} color="#F59E0B" glowClass="" delay={0.2} />
      </div>

      {/* Active Events */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Play className="w-5 h-5 text-green-400" />
            Your Active Events
          </h2>
          {activeEvents.length > 0 && (
            <span className="text-xs text-slate-400">{activeEvents.length} active</span>
          )}
        </div>

        {activeEvents.length === 0 ? (
          <div className="glass-card p-8 rounded-xl border border-slate-700/50 text-center">
            <Calendar className="w-10 h-10 mx-auto mb-3 text-slate-600" />
            <p className="text-slate-400 font-medium">No active events yet</p>
            <p className="text-slate-500 text-sm mt-1">Join an event below or use a join code</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeEvents.map((membership, i) => {
              const team = membership.teams
              const event = team?.events
              if (!team || !event) return null
              const missionProgress = Math.min(
                ((team.missions_completed) / Math.max(team.missions_completed + 2, 1)) * 100,
                100
              )
              return (
                <motion.div
                  key={membership.team_id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.07 }}
                  className="glass-card p-5 rounded-xl border border-slate-700/50 hover:border-blue-500/40 transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-white font-bold text-base leading-tight group-hover:text-blue-300 transition-colors">
                        {event.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span
                          className={cn('text-xs font-semibold px-2 py-0.5 rounded-full border', getStatusColor(event.status))}
                        >
                          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </span>
                        {membership.role === 'captain' && (
                          <span className="text-xs text-yellow-400 font-semibold">Captain</span>
                        )}
                      </div>
                    </div>
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-sm border"
                      style={{ backgroundColor: team.color + '33', borderColor: team.color + '66' }}
                    >
                      {team.name.charAt(0)}
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        {team.name}
                      </span>
                      <span className="text-white font-bold">{team.total_score.toLocaleString()} pts</span>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                        <span>Mission Progress</span>
                        <span>{team.missions_completed} completed</span>
                      </div>
                      <Progress value={missionProgress} className="h-1.5 bg-slate-700" />
                    </div>
                  </div>

                  <Link href={`/events/${event.id}/mission`}>
                    <Button size="sm" className="w-full group-hover:shadow-lg transition-all" style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
                      <Play className="w-3.5 h-3.5 mr-1.5" />
                      Continue Playing
                      <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Button>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.section>

      {/* Join Event */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6 rounded-xl border border-cyan-500/20"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <Hash className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Join with Code</h2>
            <p className="text-slate-400 text-sm">Enter the event code from your organizer</p>
          </div>
        </div>
        <div className="flex gap-3 max-w-md">
          <Input
            ref={inputRef}
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 8))}
            onKeyDown={(e) => e.key === 'Enter' && handleJoinEvent()}
            placeholder="e.g. GAME42"
            className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 font-mono text-lg tracking-widest uppercase focus:border-cyan-500/50 focus:ring-cyan-500/20"
            maxLength={8}
          />
          <Button
            onClick={handleJoinEvent}
            disabled={joiningEvent || joinCode.length < 4}
            className="px-6 whitespace-nowrap"
            style={{ background: 'linear-gradient(135deg, #06B6D4, #2563EB)' }}
          >
            {joiningEvent ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <>Join Event <ArrowRight className="w-4 h-4 ml-1.5" /></>
            )}
          </Button>
        </div>
      </motion.section>

      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              Recent Achievements
            </h2>
            <Link href="/achievements" className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {recentAchievements.map((ach) => (
              <motion.div
                key={ach.id}
                whileHover={{ scale: 1.05 }}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium cursor-default',
                  getRarityColor('common')
                )}
                title={ach.badges?.description}
              >
                {getAchievementIcon(ach.badges?.icon ?? 'star')}
                {ach.badges?.name ?? 'Achievement'}
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Available Events */}
      {availableEvents.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-purple-400" />
              Available Events
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {availableEvents.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                className="glass-card p-5 rounded-xl border border-slate-700/50 hover:border-purple-500/40 transition-all duration-300 group flex flex-col gap-4"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <h3 className="text-white font-bold text-base leading-tight group-hover:text-purple-300 transition-colors">
                      {event.name}
                    </h3>
                    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ml-2', getStatusColor(event.status))}>
                      {event.status}
                    </span>
                  </div>
                  {null}
                </div>
                <Link href={`/events/${event.id}`}>
                  <Button size="sm" variant="outline" className="w-full border-purple-500/30 text-purple-300 hover:bg-purple-500/10 hover:text-purple-200">
                    View &amp; Join
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}
    </div>
  )
}
