'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import { Sword, Timer, Users, AlertTriangle, CheckCircle2, Loader2, Flame } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { CountdownTimer } from '@/components/shared/CountdownTimer'
import { AIFeedbackCard } from '@/components/game/AIFeedbackCard'
import { SubmissionUploader } from '@/components/game/SubmissionUploader'
import { toast } from 'sonner'
import type { Mission, AIFeedback } from '@/types/database'

function BossBattleCountdown({ onComplete }: { onComplete: () => void }) {
  const [count, setCount] = useState(5)
  const [phase, setPhase] = useState<'countdown' | 'reveal'>('countdown')

  useEffect(() => {
    if (count > 0) {
      const timer = setTimeout(() => setCount(c => c - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setPhase('reveal')
      setTimeout(onComplete, 2000)
    }
  }, [count, onComplete])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-radial from-red-900/30 via-slate-900 to-slate-900" />
      <div className="absolute inset-0 cyber-grid opacity-20" />

      <AnimatePresence mode="wait">
        {phase === 'countdown' ? (
          <motion.div
            key={count}
            initial={{ scale: 2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center relative z-10"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="text-[12rem] font-black text-red-500 leading-none neon-text-blue"
              style={{ textShadow: '0 0 40px rgba(239, 68, 68, 0.8), 0 0 80px rgba(239, 68, 68, 0.5)' }}
            >
              {count}
            </motion.div>
            <p className="text-red-400 text-2xl font-bold tracking-widest uppercase">
              BOSS BATTLE INCOMING
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="reveal"
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="text-center relative z-10"
          >
            <div className="flex items-center gap-4 justify-center mb-4">
              <Flame className="w-16 h-16 text-orange-500 animate-pulse" />
              <h1
                className="text-7xl font-black"
                style={{
                  background: 'linear-gradient(135deg, #FF4444, #FF8800, #FF4444)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: 'none',
                  filter: 'drop-shadow(0 0 20px rgba(255,68,68,0.8))',
                }}
              >
                BOSS BATTLE
              </h1>
              <Flame className="w-16 h-16 text-orange-500 animate-pulse" />
            </div>
            <p className="text-orange-300 text-xl font-bold tracking-widest">FINAL CHALLENGE BEGINS</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function BossBattlePage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.eventId as string
  const supabase = createClient()

  const [showCountdown, setShowCountdown] = useState(true)
  const [bossMission, setBossMission] = useState<Mission | null>(null)
  const [myTeamId, setMyTeamId] = useState<string | null>(null)
  const [submittedTeams, setSubmittedTeams] = useState(0)
  const [totalTeams, setTotalTeams] = useState(0)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<AIFeedback | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadBattleData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get team
      const { data: member } = await supabase
        .from('team_members')
        .select('team_id, teams!inner(event_id)')
        .eq('user_id', user.id)
        .filter('teams.event_id', 'eq', eventId)
        .single()

      if (member) {
        setMyTeamId(member.team_id)
        // Check if already submitted
        const { data: sub } = await supabase
          .from('submissions')
          .select('id, ai_feedback(*)')
          .eq('team_id', member.team_id)
          .eq('missions.is_boss_battle', true)
          .maybeSingle()
        if (sub) {
          setHasSubmitted(true)
          if (sub.ai_feedback) setFeedback(sub.ai_feedback as unknown as AIFeedback)
        }
      }

      // Get boss battle mission
      const { data: mission } = await supabase
        .from('missions')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_boss_battle', true)
        .eq('status', 'active')
        .single()

      setBossMission(mission)

      // Get team counts
      const { count: teamCount } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)

      setTotalTeams(teamCount ?? 0)

      // Count submissions for boss battle
      if (mission) {
        const { count: subCount } = await supabase
          .from('submissions')
          .select('*', { count: 'exact', head: true })
          .eq('mission_id', mission.id)

        setSubmittedTeams(subCount ?? 0)
      }

      setLoading(false)
    }

    loadBattleData()
  }, [eventId, supabase])

  // Realtime subscription for submission count
  useEffect(() => {
    if (!bossMission) return
    const channel = supabase
      .channel('boss-battle-' + eventId)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'submissions',
        filter: `mission_id=eq.${bossMission.id}`,
      }, () => {
        setSubmittedTeams(prev => prev + 1)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [bossMission, eventId, supabase])

  async function handleSubmit(data: { text?: string; files?: File[] }) {
    if (!bossMission || !myTeamId) return
    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('missionId', bossMission.id)
      formData.append('teamId', myTeamId)
      if (data.text) formData.append('content', data.text)
      if (data.files) {
        data.files.forEach(f => formData.append('files', f))
      }

      const res = await fetch('/api/submissions', { method: 'POST', body: formData })
      const json = await res.json()

      if (json.error) throw new Error(json.error)

      setHasSubmitted(true)
      toast.success('Boss Battle submission received! AI is evaluating...')

      // Poll for feedback
      const submissionId = json.data.id
      let attempts = 0
      const pollInterval = setInterval(async () => {
        const { data: fbData } = await supabase
          .from('ai_feedback')
          .select('*')
          .eq('submission_id', submissionId)
          .single()

        if (fbData || attempts > 20) {
          clearInterval(pollInterval)
          if (fbData) setFeedback(fbData as AIFeedback)
        }
        attempts++
      }, 2000)
    } catch (err) {
      toast.error('Submission failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (showCountdown) {
    return <BossBattleCountdown onComplete={() => setShowCountdown(false)} />
  }

  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden">
      {/* Danger background */}
      <div className="absolute inset-0 bg-gradient-to-b from-red-900/15 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none" />

      <div className="max-w-3xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-red-600/20 border border-red-500/50 rounded-full px-4 py-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
            <span className="text-red-400 font-bold text-sm uppercase tracking-widest">Final Challenge</span>
          </div>
          <h1
            className="text-5xl font-black mb-2"
            style={{
              background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 20px rgba(255,107,107,0.4))',
            }}
          >
            ⚔️ BOSS BATTLE
          </h1>
          <p className="text-slate-400">This round can change everything. Give it everything you've got.</p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-red-500" />
          </div>
        ) : bossMission ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Mission Card */}
            <div className="glass-card p-6 border border-red-500/30 rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.1)]">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="text-red-400 text-xs font-bold uppercase tracking-wider">Boss Battle Mission</span>
                  <h2 className="text-2xl font-bold text-white mt-1">{bossMission.title}</h2>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-yellow-400">{bossMission.points}</div>
                  <div className="text-xs text-slate-400">max points</div>
                </div>
              </div>

              <p className="text-slate-300 leading-relaxed mb-4">{bossMission.description}</p>

              {bossMission.instructions && (
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Instructions</p>
                  <p className="text-slate-300 text-sm">{bossMission.instructions}</p>
                </div>
              )}

              {bossMission.time_limit_seconds && (
                <div className="mt-4 flex justify-center">
                  <CountdownTimer
                    totalSeconds={bossMission.time_limit_seconds}
                    size="lg"
                    onExpire={() => toast.error('Time is up! Submit now!')}
                  />
                </div>
              )}
            </div>

            {/* Team Progress */}
            <div className="glass-card p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-slate-400">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">Teams submitted</span>
                </div>
                <span className="font-bold text-white">{submittedTeams} / {totalTeams}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <motion.div
                  className="bg-red-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: totalTeams > 0 ? `${(submittedTeams / totalTeams) * 100}%` : '0%' }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Submission / Feedback Area */}
            {hasSubmitted && !feedback && (
              <div className="glass-card p-8 rounded-xl text-center">
                <Loader2 className="w-10 h-10 animate-spin text-red-400 mx-auto mb-4" />
                <p className="text-white font-semibold">Submission received!</p>
                <p className="text-slate-400 text-sm mt-1">AI Game Master is evaluating your boss battle performance...</p>
              </div>
            )}

            {feedback && (
              <div className="space-y-4">
                <AIFeedbackCard feedback={feedback} missionTitle={bossMission.title} />
                <Button
                  variant="cyber"
                  size="lg"
                  className="w-full"
                  onClick={() => router.push(`/events/${eventId}/results`)}
                >
                  🏆 View Final Results
                </Button>
              </div>
            )}

            {!hasSubmitted && (
              <div className="glass-card p-6 rounded-xl">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <Sword className="w-5 h-5 text-red-400" />
                  Your Submission
                </h3>
                <SubmissionUploader
                  missionType={bossMission.type}
                  onSubmit={handleSubmit}
                  isSubmitting={isSubmitting}
                />
              </div>
            )}
          </motion.div>
        ) : (
          <div className="text-center py-20 text-slate-500">
            <Sword className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Boss Battle hasn't started yet. Stand by...</p>
          </div>
        )}
      </div>
    </div>
  )
}
