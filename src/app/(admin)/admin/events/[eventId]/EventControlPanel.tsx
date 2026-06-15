'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Play, Square, Bot, Users, Target, FileCheck, Copy, ArrowLeft, Loader2, Zap, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MissionGenerator } from '@/components/admin/MissionGenerator'
import { SubmissionReview } from '@/components/admin/SubmissionReview'
import { TeamManager } from '@/components/admin/TeamManager'
import { toast } from 'sonner'
import type { Event, Mission, Team, TeamMember, User, Submission } from '@/types/database'

type TeamWithMembers = Team & {
  team_members: (TeamMember & { users: Pick<User, 'id' | 'name' | 'email'> | null })[]
}

interface EventControlPanelProps {
  event: Event
  teams: TeamWithMembers[]
  missions: Mission[]
  submissions: (Submission & { teams: { name: string; color: string } | null; missions: { title: string } | null; ai_feedback: unknown[] | null })[]
}

export function EventControlPanel({ event, teams, missions, submissions }: EventControlPanelProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function startEvent() {
    setLoading('start')
    try {
      const res = await fetch(`/api/events/${event.id}/start`, { method: 'POST' })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      toast.success('Event started! Players can now join.')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start event')
    } finally {
      setLoading(null)
    }
  }

  async function endEvent() {
    if (!confirm('End this event? This will lock all submissions and generate final narration.')) return
    setLoading('end')
    try {
      const res = await fetch(`/api/events/${event.id}/end`, { method: 'POST' })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      toast.success('Event completed!')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to end event')
    } finally {
      setLoading(null)
    }
  }

  async function generateStory() {
    setLoading('story')
    try {
      const res = await fetch('/api/ai/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: event.name,
          numberOfTeams: event.max_teams ?? 4,
          event_id: event.id,
          theme: event.theme,
        }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      toast.success('Story generated!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setLoading(null)
    }
  }

  async function activateMission(missionId: string) {
    setLoading('mission-' + missionId)
    try {
      const res = await fetch(`/api/missions/${missionId}/activate`, { method: 'POST' })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      toast.success('Mission activated!')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to activate')
    } finally {
      setLoading(null)
    }
  }

  const statusColor: Record<string, string> = {
    draft: 'border-slate-500/30 text-slate-400',
    paused: 'border-amber-500/30 text-amber-400',
    active: 'border-green-500/30 text-green-400',
    completed: 'border-blue-500/30 text-blue-400',
  }
  const statusClass = statusColor[event.status] ?? 'border-slate-500/30 text-slate-400'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() => router.push('/admin/events')}
            className="flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-2 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" /> Events
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-white">{event.name}</h1>
            <span className={`text-xs px-2 py-1 rounded-full border font-medium ${statusClass}`}>
              {event.status}
            </span>
          </div>
          {event.join_code && (
            <div className="flex items-center gap-3 mt-2">
              <span className="font-mono text-lg font-bold text-blue-400">{event.join_code}</span>
              <button
                onClick={() => { navigator.clipboard.writeText(event.join_code!); toast.success('Code copied!') }}
                className="flex items-center gap-1 text-slate-400 hover:text-white text-xs transition-colors"
                title="Copy code"
              >
                <Copy className="w-3 h-3" />
                Code
              </button>
              <button
                onClick={() => {
                  const url = `${window.location.origin}/join?code=${event.join_code}`
                  navigator.clipboard.writeText(url)
                  toast.success('Join link copied!')
                }}
                className="flex items-center gap-1 text-slate-400 hover:text-white text-xs transition-colors"
                title="Copy join link"
              >
                <Copy className="w-3 h-3" />
                Join Link
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {event.status === 'draft' && (
            <Button variant="outline" size="sm" onClick={generateStory} disabled={loading === 'story'}>
              {loading === 'story' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bot className="w-3 h-3 mr-1" />}
              Generate Story
            </Button>
          )}
          {event.status === 'draft' && (
            <Button variant="cyber" size="sm" onClick={startEvent} disabled={loading === 'start'}>
              {loading === 'start' ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Play className="w-4 h-4 mr-1" />}
              Start Event
            </Button>
          )}
          {event.status === 'active' && (
            <Button
              variant="outline"
              size="sm"
              className="border-red-500/30 text-red-400 hover:bg-red-600/10"
              onClick={endEvent}
              disabled={loading === 'end'}
            >
              {loading === 'end' ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Square className="w-4 h-4 mr-1" />}
              End Event
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => router.refresh()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Teams', value: teams.length, icon: Users, color: 'text-blue-400' },
          { label: 'Players', value: teams.reduce((sum, t) => sum + t.team_members.length, 0), icon: Users, color: 'text-cyan-400' },
          { label: 'Missions', value: missions.length, icon: Target, color: 'text-purple-400' },
          { label: 'Submissions', value: submissions.length, icon: FileCheck, color: 'text-green-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card p-4 rounded-xl border border-slate-700/50">
            <Icon className={`w-5 h-5 ${color} mb-2`} />
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-slate-400 text-xs">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="missions">
        <TabsList className="bg-slate-800/50">
          <TabsTrigger value="missions">Missions</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="generate">AI Generate</TabsTrigger>
        </TabsList>

        {/* Missions */}
        <TabsContent value="missions" className="mt-4">
          <div className="space-y-2">
            {missions.length === 0 ? (
              <div className="text-center py-8 text-slate-500 glass-card rounded-xl border border-slate-700/50">
                <Target className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>No missions yet. Use AI Generate to create them.</p>
              </div>
            ) : (
              missions.map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass-card p-4 rounded-xl border border-slate-700/50 flex items-center gap-4"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center text-slate-400 font-bold text-sm flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium truncate">{m.title}</p>
                      {m.is_boss_battle && <Badge variant="destructive" className="text-xs">⚔️ Boss</Badge>}
                      <Badge variant="secondary" className="text-xs">{m.type}</Badge>
                    </div>
                    <p className="text-slate-400 text-xs">{m.points} pts · {m.time_limit_seconds ? `${m.time_limit_seconds / 60}min` : 'No limit'}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      m.status === 'active' ? 'bg-green-600/10 text-green-400'
                      : m.status === 'completed' ? 'bg-slate-600/10 text-slate-400'
                      : 'bg-amber-600/10 text-amber-400'
                    }`}>
                      {m.status}
                    </span>
                    {event.status === 'active' && m.status === 'upcoming' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => activateMission(m.id)}
                        disabled={loading === 'mission-' + m.id}
                      >
                        {loading === 'mission-' + m.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3 mr-1" />}
                        Activate
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>

        {/* Teams */}
        <TabsContent value="teams" className="mt-4">
          <TeamManager
            eventId={event.id}
            teams={teams}
            onRefresh={() => router.refresh()}
          />
        </TabsContent>

        {/* Submissions */}
        <TabsContent value="submissions" className="mt-4">
          <SubmissionReview
            submissions={submissions as never}
            onUpdate={() => router.refresh()}
          />
        </TabsContent>

        {/* Generate */}
        <TabsContent value="generate" className="mt-4">
          <MissionGenerator
            eventId={event.id}
            theme={event.theme ?? 'Corporate Adventure'}
            onMissionsCreated={() => router.refresh()}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
