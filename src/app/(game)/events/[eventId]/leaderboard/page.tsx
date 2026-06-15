'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, Crown, Medal, Users, Zap, Target, Clock,
  Activity, Sparkles, ChevronRight,
} from 'lucide-react'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import type { LeaderboardEntry } from '@/types/game'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ScoreActivity {
  id: string
  teamName: string
  teamColor: string
  points: number
  missionName: string
  createdAt: string
}

// ---------------------------------------------------------------------------
// PodiumPlace — the 3-slot podium display
// ---------------------------------------------------------------------------

function PodiumPlace({
  entry,
  place,
  isCurrentTeam,
}: {
  entry: LeaderboardEntry
  place: 1 | 2 | 3
  isCurrentTeam: boolean
}) {
  const configs = {
    1: {
      platformH: 'h-36',
      avatarSize: 'w-24 h-24',
      avatarText: 'text-3xl',
      scoreText: 'text-3xl',
      platformColor: 'from-amber-500/30 to-yellow-600/20',
      border: 'border-amber-500/60',
      shadow: 'shadow-[0_0_30px_rgba(245,158,11,0.3)]',
      numColor: 'text-amber-400',
      Icon: Crown,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/20',
      order: 'order-2',
      delay: 0,
      numLabel: '#1',
    },
    2: {
      platformH: 'h-24',
      avatarSize: 'w-20 h-20',
      avatarText: 'text-2xl',
      scoreText: 'text-2xl',
      platformColor: 'from-slate-400/20 to-gray-500/10',
      border: 'border-slate-400/50',
      shadow: 'shadow-[0_0_20px_rgba(148,163,184,0.2)]',
      numColor: 'text-slate-300',
      Icon: Medal,
      iconColor: 'text-slate-300',
      iconBg: 'bg-slate-400/20',
      order: 'order-1',
      delay: 0.15,
      numLabel: '#2',
    },
    3: {
      platformH: 'h-16',
      avatarSize: 'w-16 h-16',
      avatarText: 'text-xl',
      scoreText: 'text-xl',
      platformColor: 'from-amber-700/20 to-orange-800/10',
      border: 'border-amber-700/50',
      shadow: 'shadow-[0_0_20px_rgba(180,83,9,0.2)]',
      numColor: 'text-amber-600',
      Icon: Medal,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-700/20',
      order: 'order-3',
      delay: 0.3,
      numLabel: '#3',
    },
  }

  const c = configs[place]
  const Icon = c.Icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: c.delay, type: 'spring', stiffness: 200 }}
      className={cn('flex flex-col items-center gap-3', c.order)}
    >
      {/* Avatar */}
      <div className="relative">
        <div
          className={cn(
            'rounded-full flex items-center justify-center font-black text-white border-4',
            c.avatarSize,
            c.avatarText,
            c.border,
            c.shadow,
            isCurrentTeam && 'ring-4 ring-blue-500 ring-offset-2 ring-offset-slate-900'
          )}
          style={{ backgroundColor: entry.team_color + '55' }}
        >
          {entry.team_name.charAt(0).toUpperCase()}
        </div>
        {/* Place badge */}
        <div
          className={cn(
            'absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center border-2',
            c.iconBg,
            c.border
          )}
        >
          <Icon className={cn('w-4 h-4', c.iconColor)} />
        </div>
        {isCurrentTeam && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
            You
          </div>
        )}
      </div>

      {/* Info */}
      <div className="text-center">
        <p className={cn('font-black text-lg leading-none mb-1', c.numColor)}>{c.numLabel}</p>
        <p className="text-white font-bold text-sm max-w-[90px] truncate">{entry.team_name}</p>
        <motion.p
          key={entry.total_score}
          initial={{ scale: 1.3, color: '#60A5FA' }}
          animate={{ scale: 1, color: '#FFFFFF' }}
          transition={{ duration: 0.4 }}
          className={cn('font-black tabular-nums mt-1', c.scoreText)}
        >
          {entry.total_score.toLocaleString()}
        </motion.p>
        <p className="text-slate-500 text-xs">{entry.missions_completed} missions</p>
      </div>

      {/* Platform */}
      <div
        className={cn(
          'w-28 rounded-t-2xl flex items-end justify-center pb-3 bg-gradient-to-t border border-b-0',
          c.platformH,
          c.platformColor,
          c.border
        )}
      >
        <span className={cn('font-black text-2xl', c.numColor)}>{place}</span>
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Activity item
// ---------------------------------------------------------------------------

function ActivityItem({ activity, index }: { activity: ScoreActivity; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07 }}
      className="flex items-center gap-3 py-2"
    >
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
        style={{ backgroundColor: activity.teamColor }}
      >
        {activity.teamName.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-slate-300 text-sm">
          <span className="text-white font-semibold">{activity.teamName}</span>
          {' '}scored on {activity.missionName}
        </span>
      </div>
      <span className="text-emerald-400 font-bold text-sm flex-shrink-0">
        +{activity.points}
      </span>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function LeaderboardPage() {
  const params = useParams()
  const eventId = params.eventId as string

  const [currentTeamId, setCurrentTeamId] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [secondsAgo, setSecondsAgo] = useState(0)
  const [activeFilter, setActiveFilter] = useState<'overall' | 'mission' | 'creativity'>('overall')
  const [eventName, setEventName] = useState('')
  const [recentActivity, setRecentActivity] = useState<ScoreActivity[]>([])

  const supabase = createClient()
  const { leaderboard, isLoading } = useLeaderboard(eventId)

  // Load user + event info
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: member } = await supabase
          .from('team_members')
          .select('team_id, teams!inner(event_id)')
          .eq('user_id', user.id)
          .filter('teams.event_id', 'eq', eventId)
          .single()

        if (member) setCurrentTeamId(member.team_id)
      }

      const { data: event } = await supabase
        .from('events')
        .select('name')
        .eq('id', eventId)
        .single()

      if (event) setEventName(event.name)

      // Recent scoring activity
      const { data: scores } = await supabase
        .from('scores')
        .select('id, total_points, reason, created_at, teams(name, color), missions(title)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .limit(5)

      if (scores) {
        setRecentActivity(
          scores.map((s: {
            id: string
            total_points: number
            reason: string | null
            created_at: string
            teams: { name: string; color: string } | null
            missions: { title: string } | null
          }) => ({
            id: s.id,
            teamName: s.teams?.name ?? 'Unknown',
            teamColor: s.teams?.color ?? '#2563EB',
            points: s.total_points,
            missionName: s.missions?.title ?? s.reason ?? 'Mission',
            createdAt: s.created_at,
          }))
        )
      }
    }
    load()
  }, [eventId, supabase])

  // Track last-updated
  useEffect(() => {
    setLastUpdated(new Date())
  }, [leaderboard])

  // Tick seconds-ago counter
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [lastUpdated])

  // Derived data
  const top3 = leaderboard.slice(0, 3)
  const rest = leaderboard.slice(3)
  const myEntry = leaderboard.find(e => e.team_id === currentTeamId)
  const myRank = myEntry?.rank ?? null
  const isMyTeamInTop5 = myRank !== null && myRank <= 5

  // Filtered view (mock — same data, would differ in real API)
  const displayEntries = leaderboard

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* ------------------------------------------------------------------ */}
      {/* HEADER                                                              */}
      {/* ------------------------------------------------------------------ */}
      <motion.div
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        {/* Breadcrumb */}
        <div className="flex items-center justify-center gap-1.5 text-slate-500 text-sm mb-4">
          <Link href="/dashboard" className="hover:text-slate-300 transition-colors">Dashboard</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href={`/events/${eventId}`} className="hover:text-slate-300 transition-colors">Event</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-300">Leaderboard</span>
        </div>

        <div className="flex items-center justify-center gap-4 mb-3">
          <Trophy className="w-10 h-10 text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]" />
          <h1 className="text-5xl font-black gradient-text">Live Leaderboard</h1>
          <Trophy className="w-10 h-10 text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]" />
        </div>

        {eventName && (
          <p className="text-slate-400 text-lg mb-4">{eventName}</p>
        )}

        <div className="flex items-center justify-center gap-4 flex-wrap">
          {/* LIVE badge */}
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-4 py-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-400 font-bold text-sm tracking-widest uppercase">Live</span>
          </div>

          {/* Last updated */}
          <div className="flex items-center gap-1.5 text-slate-500 text-sm">
            <Clock className="w-3.5 h-3.5" />
            <span>Updated {secondsAgo}s ago</span>
          </div>

          {/* Team count */}
          <div className="flex items-center gap-1.5 text-slate-500 text-sm">
            <Users className="w-3.5 h-3.5" />
            <span>{leaderboard.length} teams</span>
          </div>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex flex-col items-center gap-4 py-24">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 animate-pulse">Loading live rankings...</p>
        </div>
      ) : (
        <>
          {/* ---------------------------------------------------------------- */}
          {/* PODIUM                                                           */}
          {/* ---------------------------------------------------------------- */}
          {top3.length >= 3 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-12"
            >
              <p className="text-center text-slate-500 text-xs uppercase tracking-widest mb-8 flex items-center justify-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Top Teams
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </p>

              {/* Outer glow background */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-radial from-amber-500/5 via-transparent to-transparent rounded-3xl pointer-events-none" />

                <div className="flex items-end justify-center gap-6 sm:gap-10 relative z-10">
                  {/* Reorder: 2nd, 1st, 3rd */}
                  {[top3[1], top3[0], top3[2]].map((entry, i) => {
                    const place = (i === 0 ? 2 : i === 1 ? 1 : 3) as 1 | 2 | 3
                    return (
                      <PodiumPlace
                        key={entry.team_id}
                        entry={entry}
                        place={place}
                        isCurrentTeam={entry.team_id === currentTeamId}
                      />
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* FILTER TABS                                                      */}
          {/* ---------------------------------------------------------------- */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mb-6"
          >
            <Tabs
              value={activeFilter}
              onValueChange={(v) => setActiveFilter(v as typeof activeFilter)}
            >
              <TabsList className="bg-slate-800/60 border border-slate-700/50 p-1 rounded-xl">
                <TabsTrigger
                  value="overall"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg text-slate-400"
                >
                  <Trophy className="w-3.5 h-3.5 mr-1.5" />
                  Overall
                </TabsTrigger>
                <TabsTrigger
                  value="mission"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg text-slate-400"
                >
                  <Target className="w-3.5 h-3.5 mr-1.5" />
                  By Mission
                </TabsTrigger>
                <TabsTrigger
                  value="creativity"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg text-slate-400"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  By Creativity
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </motion.div>

          {/* ---------------------------------------------------------------- */}
          {/* FULL LEADERBOARD TABLE                                           */}
          {/* ---------------------------------------------------------------- */}
          {displayEntries.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-8"
            >
              <h2 className="text-slate-400 text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Full Rankings
              </h2>

              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {displayEntries.map((entry, index) => {
                    const isMe = entry.team_id === currentTeamId
                    return (
                      <motion.div
                        key={entry.team_id}
                        layout
                        layoutId={`rank-row-${entry.team_id}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{
                          delay: index * 0.04,
                          layout: { type: 'spring', stiffness: 200, damping: 25 },
                        }}
                        className={cn(
                          'flex items-center gap-4 p-4 rounded-xl border transition-all',
                          isMe
                            ? 'bg-blue-600/10 border-blue-500/40 shadow-[0_0_20px_rgba(37,99,235,0.1)]'
                            : 'bg-slate-800/40 border-slate-700/40 hover:border-slate-600/50 hover:bg-slate-800/60'
                        )}
                      >
                        {/* Rank */}
                        <div className="w-10 flex-shrink-0 text-center">
                          {entry.rank === 1 ? (
                            <Crown className="w-5 h-5 text-amber-400 mx-auto" />
                          ) : entry.rank === 2 ? (
                            <Medal className="w-5 h-5 text-slate-300 mx-auto" />
                          ) : entry.rank === 3 ? (
                            <Medal className="w-5 h-5 text-amber-600 mx-auto" />
                          ) : (
                            <span className="text-slate-500 font-bold text-sm">{entry.rank}</span>
                          )}
                        </div>

                        {/* Avatar */}
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-base"
                          style={{ backgroundColor: entry.team_color }}
                        >
                          {entry.team_name.charAt(0).toUpperCase()}
                        </div>

                        {/* Name + details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white truncate">{entry.team_name}</span>
                            {isMe && (
                              <Badge className="text-xs bg-blue-600/30 text-blue-300 border-blue-500/30 py-0">
                                Your Team
                              </Badge>
                            )}
                          </div>
                          <p className="text-slate-500 text-xs">
                            {entry.missions_completed} missions
                            {entry.badges?.length > 0 && ` · ${entry.badges.length} badges`}
                          </p>
                        </div>

                        {/* Badges */}
                        {entry.badges && entry.badges.length > 0 && (
                          <div className="hidden sm:flex items-center gap-1">
                            {entry.badges.slice(0, 3).map((_, i) => (
                              <div
                                key={i}
                                className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/30"
                              />
                            ))}
                            {entry.badges.length > 3 && (
                              <span className="text-slate-500 text-xs ml-1">+{entry.badges.length - 3}</span>
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
                            className="text-xl font-black tabular-nums"
                          >
                            {entry.total_score.toLocaleString()}
                          </motion.p>
                          <p className="text-slate-500 text-xs">pts</p>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            <div className="text-center py-20 text-slate-500">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p className="font-medium">No scores yet.</p>
              <p className="text-sm mt-1">Missions are in progress. Check back soon!</p>
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* MY TEAM (if outside top 5)                                       */}
          {/* ---------------------------------------------------------------- */}
          <AnimatePresence>
            {myEntry && !isMyTeamInTop5 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-8 glass-card rounded-2xl p-5 border border-blue-500/30 shadow-[0_0_30px_rgba(37,99,235,0.08)]"
              >
                <p className="text-xs text-blue-400 uppercase tracking-widest font-bold mb-3 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  Your Team
                </p>
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                    style={{ backgroundColor: myEntry.team_color }}
                  >
                    {myEntry.team_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold">{myEntry.team_name}</p>
                    <p className="text-slate-400 text-sm">Rank #{myEntry.rank}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-white">{myEntry.total_score.toLocaleString()}</p>
                    <p className="text-slate-500 text-xs">pts</p>
                  </div>
                  {myRank && myRank > 1 && leaderboard[myRank - 2] && (
                    <div className="text-right flex-shrink-0 pl-4 border-l border-slate-700">
                      <p className="text-slate-400 text-xs whitespace-nowrap">Gap to #{myRank - 1}</p>
                      <p className="text-amber-400 font-bold">
                        +{(leaderboard[myRank - 2].total_score - myEntry.total_score).toLocaleString()} pts
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ---------------------------------------------------------------- */}
          {/* ACTIVITY FEED                                                    */}
          {/* ---------------------------------------------------------------- */}
          {recentActivity.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="glass-card rounded-2xl p-5 border border-slate-700/40"
            >
              <h3 className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                Recent Activity
              </h3>
              <div className="divide-y divide-slate-700/40">
                {recentActivity.map((activity, i) => (
                  <ActivityItem key={activity.id} activity={activity} index={i} />
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}
