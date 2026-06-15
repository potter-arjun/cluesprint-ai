'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Bot, Lightbulb, Send, Users, Target, Loader2, ChevronRight, Crown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { MissionCard } from '@/components/game/MissionCard'
import { CountdownTimer } from '@/components/shared/CountdownTimer'
import { LeaderboardTable } from '@/components/game/LeaderboardTable'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import { toast } from 'sonner'
import type { Mission } from '@/types/database'

export default function MissionPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.eventId as string
  const supabase = createClient()

  const [mission, setMission] = useState<Mission | null>(null)
  const [myTeamId, setMyTeamId] = useState<string | null>(null)
  const [teamSubmitted, setTeamSubmitted] = useState(false)
  const [hints, setHints] = useState<string[]>([])
  const [loadingHint, setLoadingHint] = useState(false)
  const [showHints, setShowHints] = useState(false)
  const [loading, setLoading] = useState(true)
  const [missionStartedAt, setMissionStartedAt] = useState<number | null>(null)

  const { leaderboard } = useLeaderboard(eventId)

  useEffect(() => {
    async function loadMissionData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Get user's team
      const { data: member } = await supabase
        .from('team_members')
        .select('team_id, teams!inner(event_id)')
        .eq('user_id', user.id)
        .filter('teams.event_id', 'eq', eventId)
        .single()

      if (member) {
        setMyTeamId(member.team_id)
      }

      // Get active mission
      const { data: activeMission } = await supabase
        .from('missions')
        .select('*')
        .eq('event_id', eventId)
        .eq('status', 'active')
        .order('activated_at', { ascending: false })
        .limit(1)
        .single()

      if (activeMission) {
        setMission(activeMission)
        if (activeMission.activated_at) {
          setMissionStartedAt(new Date(activeMission.activated_at).getTime())
        }

        // Check if team already submitted
        if (member) {
          const { data: sub } = await supabase
            .from('submissions')
            .select('id')
            .eq('mission_id', activeMission.id)
            .eq('team_id', member.team_id)
            .single()

          if (sub) setTeamSubmitted(true)
        }
      }

      setLoading(false)
    }

    loadMissionData()
  }, [eventId, router, supabase])

  // Realtime: listen for mission changes
  useEffect(() => {
    const channel = supabase
      .channel('mission-updates-' + eventId)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'missions',
        filter: `event_id=eq.${eventId}`,
      }, (payload) => {
        const updated = payload.new as Mission
        if (updated.status === 'active') {
          setMission(updated)
          setTeamSubmitted(false)
          setHints([])
          toast.info(`New mission: ${updated.title}`)
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'events',
        filter: `id=eq.${eventId}`,
      }, (payload) => {
        const event = payload.new as { status: string; id: string }
        if (event.status === 'completed') {
          router.push(`/events/${eventId}/results`)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [eventId, router, supabase])

  async function requestHint() {
    if (!mission || !myTeamId) return
    setLoadingHint(true)
    try {
      const res = await fetch('/api/ai/get-hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          missionId: mission.id,
          teamId: myTeamId,
          hintNumber: hints.length + 1,
        }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setHints(prev => [...prev, json.data.hint])
      setShowHints(true)
      toast.success('AI hint received!')
    } catch {
      toast.error('Could not get hint. Try again.')
    } finally {
      setLoadingHint(false)
    }
  }

  const timeRemaining = mission?.time_limit_seconds && missionStartedAt
    ? Math.max(0, mission.time_limit_seconds - Math.floor((Date.now() - missionStartedAt) / 1000))
    : mission?.time_limit_seconds ?? null

  if (loading) {
    return <LoadingSpinner variant="fullscreen" loadingText="Loading mission..." />
  }

  if (!mission) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Target className="w-16 h-16 mx-auto mb-4 text-slate-600" />
        <h2 className="text-2xl font-bold text-white mb-2">No Active Mission</h2>
        <p className="text-slate-400 mb-6">Waiting for the Game Master to activate the next mission...</p>
        <div className="flex items-center justify-center gap-2 text-amber-400">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-sm">Standby</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main: Mission */}
        <div className="lg:col-span-2 space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <span>Event</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white">Active Mission</span>
            {mission.is_boss_battle && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-red-600/20 text-red-400 border border-red-500/30">
                ⚔️ Boss Battle
              </span>
            )}
          </div>

          {/* Mission Card */}
          <MissionCard mission={mission} isActive teamSubmitted={teamSubmitted} />

          {/* Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 rounded-xl"
          >
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-400" /> Mission Instructions
            </h3>
            <p className="text-slate-300 leading-relaxed">
              {mission.instructions ?? mission.description}
            </p>
            {mission.evaluation_criteria && (
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <p className="text-slate-400 text-sm uppercase tracking-wider mb-2">What AI will judge</p>
                <p className="text-slate-300 text-sm">{mission.evaluation_criteria}</p>
              </div>
            )}
          </motion.div>

          {/* Hints */}
          <div className="glass-card rounded-xl overflow-hidden">
            <button
              onClick={() => setShowHints(!showHints)}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
            >
              <span className="text-white font-medium flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                AI Hints {hints.length > 0 && `(${hints.length})`}
              </span>
              <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${showHints ? 'rotate-90' : ''}`} />
            </button>
            {showHints && (
              <div className="px-4 pb-4 space-y-3">
                {hints.map((hint, i) => (
                  <div key={i} className="bg-amber-600/10 border border-amber-500/20 rounded-lg p-3">
                    <p className="text-amber-300 text-xs font-bold mb-1">Hint #{i + 1}</p>
                    <p className="text-slate-300 text-sm">{hint}</p>
                  </div>
                ))}
                {hints.length < 3 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={requestHint}
                    disabled={loadingHint}
                    className="w-full border-amber-500/30 text-amber-400 hover:bg-amber-600/10"
                  >
                    {loadingHint ? (
                      <><Loader2 className="w-3 h-3 animate-spin mr-2" />Getting hint...</>
                    ) : (
                      <><Bot className="w-3 h-3 mr-2" />Request AI Hint</>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Submit CTA */}
          {!teamSubmitted ? (
            <Button
              variant="cyber"
              size="xl"
              className="w-full"
              onClick={() => router.push(`/events/${eventId}/submit`)}
            >
              <Send className="w-5 h-5 mr-2" />
              Submit Your Response
            </Button>
          ) : (
            <div className="glass-card p-4 rounded-xl text-center border border-green-500/30">
              <p className="text-green-400 font-bold flex items-center justify-center gap-2">
                ✓ Your team has submitted for this mission
              </p>
              <p className="text-slate-400 text-sm mt-1">Waiting for AI evaluation...</p>
            </div>
          )}
        </div>

        {/* Sidebar: Timer + Leaderboard */}
        <div className="space-y-6">
          {timeRemaining !== null && timeRemaining > 0 && (
            <div className="glass-card p-6 rounded-xl text-center">
              <p className="text-slate-400 text-sm mb-4">Time Remaining</p>
              <CountdownTimer
                totalSeconds={timeRemaining}
                size="lg"
                onExpire={() => toast.error("Time's up! Submit now!")}
              />
            </div>
          )}

          {leaderboard && leaderboard.length > 0 && (
            <div className="glass-card p-4 rounded-xl">
              <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" /> Leaderboard
              </h3>
              <LeaderboardTable
                entries={leaderboard.slice(0, 5)}
                currentTeamId={myTeamId ?? undefined}
                compact
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
