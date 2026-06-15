'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, X, Image, FileText, Video, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { formatScore } from '@/lib/utils'
import type { Submission, AIFeedback } from '@/types/database'

interface SubmissionWithDetails extends Submission {
  teams: { name: string; color: string } | null
  missions: { title: string } | null
  ai_feedback: AIFeedback[] | null
}

interface SubmissionReviewProps {
  submissions: SubmissionWithDetails[]
  onUpdate?: () => void
}

export function SubmissionReview({ submissions, onUpdate }: SubmissionReviewProps) {
  const [overrideNotes, setOverrideNotes] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)

  async function handleOverride(submissionId: string, status: 'approved' | 'rejected') {
    setSaving(submissionId)
    try {
      const res = await fetch(`/api/submissions/${submissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          override_notes: overrideNotes[submissionId],
        }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      toast.success(`Submission ${status}`)
      onUpdate?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setSaving(null)
    }
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>No submissions to review</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {submissions.map((sub, i) => {
        const feedback = sub.ai_feedback?.[0]
        const aiScore = feedback?.total_score ?? null

        return (
          <motion.div
            key={sub.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card rounded-xl p-5 border border-slate-700/50"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: sub.teams?.color ?? '#6366f1' }}
                  />
                  <p className="text-white font-semibold">{sub.teams?.name ?? 'Unknown Team'}</p>
                  <Badge
                    variant={
                      sub.status === 'approved' ? 'default'
                      : sub.status === 'rejected' ? 'destructive'
                      : 'secondary'
                    }
                    className="text-xs"
                  >
                    {sub.status}
                  </Badge>
                </div>
                <p className="text-slate-400 text-sm">Mission: {sub.missions?.title ?? '—'}</p>
              </div>
              {aiScore !== null && (
                <div className="text-right">
                  <p className="text-slate-400 text-xs">AI Score</p>
                  <p className="text-2xl font-black gradient-text">{formatScore(aiScore)}</p>
                </div>
              )}
            </div>

            {/* Content preview */}
            {sub.content && (
              <div className="bg-slate-800/40 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 mb-1 text-slate-400">
                  <FileText className="w-3 h-3" />
                  <span className="text-xs">Text Response</span>
                </div>
                <p className="text-slate-300 text-sm line-clamp-3">{sub.content}</p>
              </div>
            )}

            {sub.media_urls && sub.media_urls.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-4">
                {sub.media_urls.map((url, j) => (
                  <a
                    key={j}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2 py-1 bg-slate-700/50 rounded text-xs text-blue-400 hover:text-blue-300"
                  >
                    {url.includes('video') ? <Video className="w-3 h-3" /> : <Image className="w-3 h-3" />}
                    Media {j + 1}
                  </a>
                ))}
              </div>
            )}

            {/* AI Feedback summary */}
            {feedback && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: 'Creativity', val: feedback.creativity },
                  { label: 'Accuracy', val: feedback.accuracy },
                  { label: 'Teamwork', val: feedback.teamwork },
                ].map(({ label, val }) => val !== null && (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">{label}</span>
                      <span className="text-white">{val}/10</span>
                    </div>
                    <Progress value={val * 10} className="h-1" />
                  </div>
                ))}
              </div>
            )}

            {/* Override controls */}
            {sub.status === 'pending' || sub.status === 'reviewing' ? (
              <div className="space-y-2 pt-3 border-t border-slate-700/50">
                <Textarea
                  placeholder="Override notes (optional)..."
                  value={overrideNotes[sub.id] ?? ''}
                  onChange={e => setOverrideNotes(prev => ({ ...prev, [sub.id]: e.target.value }))}
                  className="resize-none text-sm"
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-red-500/30 text-red-400 hover:bg-red-600/10"
                    onClick={() => handleOverride(sub.id, 'rejected')}
                    disabled={saving === sub.id}
                  >
                    {saving === sub.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3 mr-1" />}
                    Reject
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-green-500/30 text-green-400 hover:bg-green-600/10"
                    onClick={() => handleOverride(sub.id, 'approved')}
                    disabled={saving === sub.id}
                  >
                    {saving === sub.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
                    Approve
                  </Button>
                </div>
              </div>
            ) : (
              <div className="pt-3 border-t border-slate-700/50">
                <p className="text-slate-500 text-xs">
                  Reviewed — {sub.status}
                  {sub.override_notes && `: "${sub.override_notes}"`}
                </p>
              </div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
