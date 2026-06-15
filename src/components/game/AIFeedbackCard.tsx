'use client'

import { motion } from 'framer-motion'
import { Brain, Sparkles, Users, Timer, Award, Smile, TrendingUp, Bot } from 'lucide-react'
import { AITypingEffect } from '@/components/shared/AITypingEffect'
import { cn } from '@/lib/utils'
import type { AIFeedback } from '@/types/database'

interface AIFeedbackCardProps {
  feedback: AIFeedback
  missionTitle: string
}

const SCORE_DIMENSIONS = [
  { key: 'accuracy' as const, label: 'Accuracy', icon: Brain, color: '#2563EB', bg: 'bg-blue-600' },
  { key: 'creativity' as const, label: 'Creativity', icon: Sparkles, color: '#7C3AED', bg: 'bg-violet-600' },
  { key: 'teamwork' as const, label: 'Teamwork', icon: Users, color: '#059669', bg: 'bg-emerald-600' },
  { key: 'speed' as const, label: 'Speed', icon: Timer, color: '#D97706', bg: 'bg-amber-600' },
  { key: 'presentation' as const, label: 'Presentation', icon: Award, color: '#DB2777', bg: 'bg-pink-600' },
  { key: 'fun_factor' as const, label: 'Fun Factor', icon: Smile, color: '#06B6D4', bg: 'bg-cyan-600' },
]

function ScoreBar({
  label,
  score,
  icon: Icon,
  color,
  bg,
  delay,
}: {
  label: string
  score: number
  icon: React.ElementType
  color: string
  bg: string
  delay: number
}) {
  const pct = (score / 10) * 100

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="flex items-center gap-3"
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: color + '20' }}
      >
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-slate-400 text-xs font-medium">{label}</span>
          <span className="text-white text-xs font-bold">{score}/10</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-1.5">
          <motion.div
            className={cn('h-1.5 rounded-full', bg)}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ delay: delay + 0.1, duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      </div>
    </motion.div>
  )
}

export function AIFeedbackCard({ feedback, missionTitle }: AIFeedbackCardProps) {
  const scoreGrade =
    feedback.total_score >= 50
      ? 'S'
      : feedback.total_score >= 40
      ? 'A'
      : feedback.total_score >= 30
      ? 'B'
      : feedback.total_score >= 20
      ? 'C'
      : 'D'

  const gradeColor: Record<string, string> = {
    S: '#F59E0B',
    A: '#10B981',
    B: '#2563EB',
    C: '#D97706',
    D: '#EF4444',
  }
  const gradeHex = gradeColor[scoreGrade]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl overflow-hidden border border-blue-500/20 shadow-[0_0_30px_rgba(37,99,235,0.1)]"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900/40 to-violet-900/40 px-6 py-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
            <Bot className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-white font-bold">AI Game Master Evaluation</p>
            <p className="text-slate-400 text-sm">{missionTitle}</p>
          </div>
          <div className="ml-auto text-center">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-black"
              style={{
                backgroundColor: gradeHex + '20',
                border: `2px solid ${gradeHex}40`,
                color: gradeHex,
              }}
            >
              {scoreGrade}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Score Bars */}
        <div className="space-y-3">
          {SCORE_DIMENSIONS.map((dim, i) => (
            <ScoreBar
              key={dim.key}
              label={dim.label}
              score={feedback[dim.key] as number}
              icon={dim.icon}
              color={dim.color}
              bg={dim.bg}
              delay={i * 0.08}
            />
          ))}
        </div>

        {/* Total Score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, type: 'spring' }}
          className="text-center py-4 border-t border-slate-700/50"
        >
          <p className="text-slate-400 text-sm mb-1 flex items-center justify-center gap-1">
            <TrendingUp className="w-4 h-4" /> Total Score
          </p>
          <div
            className="text-6xl font-black"
            style={{
              background: `linear-gradient(135deg, ${gradeHex}, ${gradeHex}aa)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {feedback.total_score}
          </div>
          <p className="text-slate-500 text-sm">out of 60 points</p>
        </motion.div>

        {/* AI Feedback Text */}
        {feedback.feedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"
          >
            <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">AI Feedback</p>
            <AITypingEffect
              text={feedback.feedback}
              speed={20}
              className="text-slate-300 text-sm leading-relaxed"
            />
          </motion.div>
        )}

        {/* Narrative */}
        {feedback.narrative && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="text-center text-slate-400 text-sm italic"
          >
            &ldquo;{feedback.narrative}&rdquo;
          </motion.p>
        )}

        {/* Highlights */}
        {feedback.highlights && feedback.highlights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8 }}
            className="space-y-2"
          >
            <p className="text-slate-400 text-xs uppercase tracking-wider">Highlights</p>
            <ul className="space-y-1">
              {feedback.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                  {h}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default AIFeedbackCard
