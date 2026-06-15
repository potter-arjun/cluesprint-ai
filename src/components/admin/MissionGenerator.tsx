'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Loader2, Trash2, CheckCircle2, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface GeneratedMission {
  title: string
  description: string
  type: string
  points: number
  time_limit_seconds: number
  is_boss_battle: boolean
}

interface MissionGeneratorProps {
  eventId: string
  theme: string
  onMissionsCreated?: () => void
}

export function MissionGenerator({ eventId, theme, onMissionsCreated }: MissionGeneratorProps) {
  const [count, setCount] = useState(5)
  const [difficulty, setDifficulty] = useState('medium')
  const [focus, setFocus] = useState('')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [missions, setMissions] = useState<GeneratedMission[]>([])

  async function generate() {
    setGenerating(true)
    setMissions([])
    try {
      const res = await fetch('/api/ai/generate-missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, storyTheme: theme, count }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setMissions(json.data ?? [])
      toast.success(`${json.data?.length ?? 0} missions generated!`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  function removeMission(i: number) {
    setMissions(prev => prev.filter((_, idx) => idx !== i))
  }

  async function saveAll() {
    setSaving(true)
    try {
      const res = await fetch('/api/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, missions }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      toast.success(`${missions.length} missions saved!`)
      setMissions([])
      onMissionsCreated?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="glass-card p-6 rounded-2xl border border-purple-500/20 space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center">
          <Bot className="w-4 h-4 text-purple-400" />
        </div>
        <h3 className="text-white font-bold">AI Mission Generator</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Label>Mission Count</Label>
          <Input
            type="number"
            min={1}
            max={20}
            value={count}
            onChange={e => setCount(Number(e.target.value))}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Difficulty</Label>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
              <SelectItem value="expert">Expert</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Focus Area (optional)</Label>
          <Input
            placeholder="e.g. teamwork, creativity"
            value={focus}
            onChange={e => setFocus(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      <Button
        variant="cyber"
        onClick={generate}
        disabled={generating}
        className="w-full"
      >
        {generating ? (
          <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating with AI...</>
        ) : (
          <><Wand2 className="w-4 h-4 mr-2" />Generate {count} Missions</>
        )}
      </Button>

      <AnimatePresence>
        {missions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-slate-400 text-sm">{missions.length} missions ready</p>
              <Button variant="cyber" size="sm" onClick={saveAll} disabled={saving}>
                {saving ? (
                  <><Loader2 className="w-3 h-3 animate-spin mr-1" />Saving...</>
                ) : (
                  <><CheckCircle2 className="w-3 h-3 mr-1" />Save All to Event</>
                )}
              </Button>
            </div>

            {missions.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 p-3 bg-slate-800/40 rounded-xl border border-slate-700/50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-white font-medium text-sm truncate">{m.title}</p>
                    <Badge variant={m.is_boss_battle ? 'destructive' : 'secondary'} className="text-xs">
                      {m.is_boss_battle ? '⚔️ Boss' : m.type}
                    </Badge>
                    <Badge variant="outline" className="text-xs">{m.points} pts</Badge>
                  </div>
                  <p className="text-slate-400 text-xs line-clamp-2">{m.description}</p>
                </div>
                <button
                  onClick={() => removeMission(i)}
                  className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
