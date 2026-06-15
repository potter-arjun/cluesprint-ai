'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import { Trophy, Star, Zap, Share2, Download, RefreshCw, Crown, Loader2, Bot } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { AITypingEffect } from '@/components/shared/AITypingEffect'
import { LeaderboardTable } from '@/components/game/LeaderboardTable'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import type { LeaderboardEntry } from '@/types/game'

// Confetti particle
function ConfettiParticle({ delay, x }: { delay: number; x: number }) {
  const colors = ['#2563EB', '#7C3AED', '#06B6D4', '#F59E0B', '#10B981', '#EF4444']
  const color = colors[Math.floor(Math.abs(Math.sin(delay * 100)) * colors.length)]

  return (
    <motion.div
      className="absolute top-0 rounded-full pointer-events-none"
      style={{ left: `${x}%`, width: 8, height: 8, backgroundColor: color }}
      initial={{ y: -20, opacity: 1, rotate: 0 }}
      animate={{
        y: '100vh',
        opacity: [1, 1, 0],
        rotate: 360 * 3,
        x: [0, Math.sin(delay * 5) * 60],
      }}
      transition={{ duration: 3 + Math.abs(Math.sin(delay * 7)) * 2, delay, ease: 'linear' }}
    />
  )
}

function Confetti({ active }: { active: boolean }) {
  if (!active) return null
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: 60 }).map((_, i) => (
        <ConfettiParticle key={i} delay={i * 0.05} x={(i * 17 + 7) % 100} />
      ))}
    </div>
  )
}

interface TeamNarrative {
  teamName: string
  narrative: string
}

interface FinalData {
  overallNarration: string
  winnerAnnouncement: string
  teamNarratives: TeamNarrative[]
  statsHighlights: string[]
  closingLine: string
}

export default function ResultsPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.eventId as string
  const supabase = createClient()

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [finalData, setFinalData] = useState<FinalData | null>(null)
  const [loadingNarration, setLoadingNarration] = useState(true)
  const [showConfetti, setShowConfetti] = useState(false)
  const [narrationComplete, setNarrationComplete] = useState(false)
  const [winnerRevealed, setWinnerRevealed] = useState(false)
  const [myTeamId, setMyTeamId] = useState<string | null>(null)
  const [eventName, setEventName] = useState('')

  useEffect(() => {
    async function loadResults() {
      // Load leaderboard
      const res = await fetch(`/api/leaderboard/${eventId}`)
      const json = await res.json()
      if (json.data) setLeaderboard(json.data)

      // Load event
      const { data: event } = await supabase
        .from('events')
        .select('name')
        .eq('id', eventId)
        .single()
      if (event) setEventName(event.name)

      // Get my team
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: member } = await supabase
          .from('team_members')
          .select('team_id, teams!inner(event_id)')
          .eq('user_id', user.id)
          .filter('teams.event_id', 'eq', eventId)
          .single()
        if (member) setMyTeamId(member.team_id)
      }

      // Get or generate final narration
      const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('event_id', eventId)
        .eq('type', 'final_narration')
        .order('created_at', { ascending: false })
        .limit(1)

      if (notifications && notifications.length > 0 && notifications[0].data) {
        setFinalData(notifications[0].data as FinalData)
        setLoadingNarration(false)
      } else {
        // Generate narration
        try {
          const narrationRes = await fetch('/api/ai/final-narration', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventId }),
          })
          const narrationJson = await narrationRes.json()
          if (narrationJson.data) {
            setFinalData(narrationJson.data)
          }
        } catch {
          setFinalData({
            overallNarration: `An epic adventure has reached its conclusion! Teams competed with incredible creativity, teamwork, and determination throughout ${eventName || 'this event'}.`,
            winnerAnnouncement: json.data?.[0] ? `${json.data[0].team_name} has claimed victory!` : 'The champions have been crowned!',
            teamNarratives: [],
            statsHighlights: ['Amazing performances across all teams', 'Creativity was off the charts'],
            closingLine: 'Until the next adventure, well played everyone! 🎉',
          })
        } finally {
          setLoadingNarration(false)
        }
      }
    }

    loadResults()
  }, [eventId, supabase, eventName])

  const handleNarrationComplete = useCallback(() => {
    setNarrationComplete(true)
    setTimeout(() => {
      setWinnerRevealed(true)
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 4000)
    }, 500)
  }, [])

  const winner = leaderboard[0]
  const topThree = leaderboard.slice(0, 3)

  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden">
      <Confetti active={showConfetti} />

      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-yellow-900/10 via-slate-900 to-purple-900/10 pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="text-center mb-12"
        >
          <motion.h1
            className="text-7xl md:text-8xl font-black mb-4"
            style={{
              background: 'linear-gradient(135deg, #F59E0B, #FBBF24, #F59E0B)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 30px rgba(245,158,11,0.5))',
            }}
          >
            🏆 GAME OVER
          </motion.h1>
          <p className="text-slate-400 text-xl">{eventName}</p>
        </motion.div>

        {/* AI Narration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 rounded-2xl mb-10 border border-yellow-500/20"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
              <Bot className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-white font-semibold">AI Game Master</p>
              <p className="text-slate-400 text-sm">Final Report</p>
            </div>
          </div>

          {loadingNarration ? (
            <div className="flex items-center gap-3 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
              <span>Generating epic finale...</span>
            </div>
          ) : finalData ? (
            <AITypingEffect
              text={finalData.overallNarration}
              speed={25}
              onComplete={handleNarrationComplete}
              className="text-slate-300 text-lg leading-relaxed"
            />
          ) : null}
        </motion.div>

        {/* Winner Announcement */}
        <AnimatePresence>
          {winnerRevealed && winner && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 150 }}
              className="text-center mb-12"
            >
              <div className="inline-block">
                <motion.div
                  animate={{ rotate: [0, -5, 5, -5, 5, 0] }}
                  transition={{ duration: 0.5 }}
                  className="text-8xl mb-4"
                >
                  🎉
                </motion.div>
                <p className="text-yellow-400 text-xl font-bold uppercase tracking-widest mb-2">Champions</p>
                <h2
                  className="text-5xl font-black"
                  style={{
                    background: 'linear-gradient(135deg, #F59E0B, #FCD34D)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 0 20px rgba(245,158,11,0.6))',
                  }}
                >
                  {winner.team_name}
                </h2>
                <p className="text-3xl font-bold text-white mt-2">{winner.total_score.toLocaleString()} pts</p>
                {finalData && (
                  <p className="text-slate-300 mt-4 text-lg italic">"{finalData.winnerAnnouncement}"</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Podium */}
        {narrationComplete && topThree.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h3 className="text-center text-slate-400 uppercase tracking-widest text-sm mb-6">Final Standings</h3>
            <div className="flex items-end justify-center gap-4">
              {[topThree[1], topThree[0], topThree[2]].map((team, i) => {
                const rank = i === 1 ? 1 : i === 0 ? 2 : 3
                const heights = ['h-24', 'h-32', 'h-16']
                const colors = ['from-slate-400/20', 'from-yellow-500/20', 'from-amber-700/20']
                const borders = ['border-slate-400/50', 'border-yellow-500/50', 'border-amber-700/50']
                const textColors = ['text-slate-300', 'text-yellow-400', 'text-amber-600']
                const medals = ['🥈', '🥇', '🥉']
                const isMe = team.team_id === myTeamId
                return (
                  <div key={team.team_id} className="flex flex-col items-center gap-2">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center border-2 text-white font-bold text-xl ${borders[i]} ${isMe ? 'ring-4 ring-blue-500' : ''}`}
                      style={{ backgroundColor: team.team_color + '44' }}
                    >
                      {team.team_name.charAt(0)}
                    </div>
                    <div className="text-center">
                      <p className={textColors[i]}>{medals[i]}</p>
                      <p className="text-white font-semibold text-sm">{team.team_name}</p>
                      <p className="text-white font-bold">{team.total_score.toLocaleString()}</p>
                    </div>
                    <div className={`w-20 rounded-t-lg flex items-end justify-center pb-2 bg-gradient-to-t ${colors[i]} border border-b-0 ${borders[i]} ${heights[rank - 1]}`}>
                      <span className={textColors[i] + ' font-bold'}>{rank}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Full Leaderboard */}
        {narrationComplete && leaderboard.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-12"
          >
            <h3 className="text-slate-400 uppercase tracking-widest text-sm mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4" /> Complete Results
            </h3>
            <LeaderboardTable entries={leaderboard} currentTeamId={myTeamId ?? undefined} />
          </motion.div>
        )}

        {/* Stats Highlights */}
        {narrationComplete && finalData?.statsHighlights && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-6 rounded-xl mb-8 border border-cyan-500/20"
          >
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" /> Game Highlights
            </h3>
            <ul className="space-y-2">
              {finalData.statsHighlights.map((highlight, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-300">
                  <Star className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                  {highlight}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Closing line */}
        {finalData?.closingLine && narrationComplete && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-slate-300 text-xl italic mb-8"
          >
            "{finalData.closingLine}"
          </motion.p>
        )}

        {/* Action Buttons */}
        {narrationComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-3 justify-center"
          >
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href)
                toast.success('Results link copied!')
              }}
            >
              <Share2 className="w-4 h-4 mr-2" /> Share Results
            </Button>
            <Button variant="cyber" onClick={() => router.push('/dashboard')}>
              <RefreshCw className="w-4 h-4 mr-2" /> Play Again
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
