'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, CheckCircle2, ArrowRight, Bot, AlertCircle } from 'lucide-react'
import { SubmissionUploader } from '@/components/game/SubmissionUploader'
import { AIFeedbackCard } from '@/components/game/AIFeedbackCard'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { Mission, AIFeedback } from '@/types/database'

type Phase = 'loading' | 'form' | 'submitting' | 'evaluating' | 'feedback'

export default function SubmitPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.eventId as string
  const supabase = createClient()

  const [phase, setPhase] = useState<Phase>('loading')
  const [mission, setMission] = useState<Mission | null>(null)
  const [myTeamId, setMyTeamId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<AIFeedback | null>(null)
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Get team
      const { data: member } = await supabase
        .from('team_members')
        .select('team_id, teams!inner(event_id)')
        .eq('user_id', user.id)
        .filter('teams.event_id', 'eq', eventId)
        .single()

      if (member) setMyTeamId(member.team_id)

      // Get active mission
      const { data: activeMission } = await supabase
        .from('missions')
        .select('*')
        .eq('event_id', eventId)
        .eq('status', 'active')
        .single()

      if (!activeMission) {
        toast.error('No active mission found')
        router.push(`/events/${eventId}/mission`)
        return
      }

      setMission(activeMission)

      // Check if already submitted
      if (member) {
        const { data: existing } = await supabase
          .from('submissions')
          .select('id, ai_feedback(*)')
          .eq('mission_id', activeMission.id)
          .eq('team_id', member.team_id)
          .single()

        if (existing) {
          setAlreadySubmitted(true)
          if (existing.ai_feedback) {
            setFeedback(existing.ai_feedback as unknown as AIFeedback)
            setPhase('feedback')
          } else {
            setPhase('evaluating')
            pollForFeedback(existing.id)
          }
          return
        }
      }

      setPhase('form')
    }

    load()
  }, [eventId, router, supabase])

  async function pollForFeedback(submissionId: string) {
    let attempts = 0
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('ai_feedback')
        .select('*')
        .eq('submission_id', submissionId)
        .single()

      if (data || attempts > 30) {
        clearInterval(interval)
        if (data) {
          setFeedback(data as AIFeedback)
          setPhase('feedback')
        }
      }
      attempts++
    }, 2000)
  }

  async function handleSubmit(data: { text?: string; files?: File[] }) {
    if (!mission || !myTeamId) return
    setPhase('submitting')

    try {
      const formData = new FormData()
      formData.append('mission_id', mission.id)
      formData.append('team_id', myTeamId)
      formData.append('event_id', eventId)
      if (data.text) formData.append('text_content', data.text)
      if (data.files) {
        data.files.forEach(f => formData.append('images', f))
      }

      const res = await fetch('/api/submissions', { method: 'POST', body: formData })
      const json = await res.json()

      if (json.error) throw new Error(json.error)

      const submissionId = json.data?.id
      setPhase('evaluating')
      toast.success('Submitted! AI is evaluating your response...')

      if (submissionId) {
        pollForFeedback(submissionId)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Submission failed. Please try again.')
      setPhase('form')
    }
  }

  if (phase === 'loading') {
    return <LoadingSpinner variant="fullscreen" loadingText="Loading mission..." />
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white mb-1">Submit Response</h1>
        {mission && (
          <p className="text-slate-400">
            Mission: <span className="text-white font-medium">{mission.title}</span>
          </p>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* Form */}
        {phase === 'form' && mission && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Mission Brief */}
            <div className="glass-card p-4 rounded-xl mb-6 border border-slate-700/50">
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Mission Brief</p>
              <p className="text-slate-300 text-sm">{mission.description}</p>
            </div>

            {alreadySubmitted && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-600/10 border border-amber-500/20 mb-4">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <p className="text-amber-300 text-sm">Your team already submitted. You can view your evaluation below.</p>
              </div>
            )}

            <SubmissionUploader
              missionType={mission.type}
              onSubmit={handleSubmit}
              isSubmitting={false}
            />
          </motion.div>
        )}

        {/* Submitting */}
        {phase === 'submitting' && (
          <motion.div
            key="submitting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Loader2 className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
            <p className="text-white font-semibold text-xl">Submitting your response...</p>
          </motion.div>
        )}

        {/* Evaluating */}
        {phase === 'evaluating' && (
          <motion.div
            key="evaluating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-8 rounded-2xl text-center border border-blue-500/20"
          >
            <div className="w-16 h-16 rounded-full bg-blue-600/20 flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-white font-bold text-xl mb-2">AI is evaluating...</h2>
            <p className="text-slate-400 mb-4">The AI Game Master is reviewing your submission</p>
            <div className="flex items-center justify-center gap-1">
              {[0, 0.2, 0.4].map((delay, i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-blue-400 rounded-full"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, delay, repeat: Infinity }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Feedback */}
        {phase === 'feedback' && feedback && mission && (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">Evaluation Complete!</span>
            </div>

            <AIFeedbackCard feedback={feedback} missionTitle={mission.title} />

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => router.push(`/events/${eventId}/mission`)}
              >
                Back to Mission
              </Button>
              <Button
                variant="cyber"
                className="flex-1"
                onClick={() => router.push(`/events/${eventId}/leaderboard`)}
              >
                View Leaderboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
