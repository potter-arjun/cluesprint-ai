'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, UserMinus, Plus, Loader2, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { getTeamColor } from '@/lib/utils'
import type { Team, TeamMember, User } from '@/types/database'

interface TeamWithMembers extends Team {
  team_members: (TeamMember & { users: Pick<User, 'id' | 'name' | 'email'> | null })[]
}

interface TeamManagerProps {
  eventId: string
  teams: TeamWithMembers[]
  onRefresh?: () => void
}

export function TeamManager({ eventId, teams, onRefresh }: TeamManagerProps) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [newTeamName, setNewTeamName] = useState('')
  const [creating, setCreating] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [addEmail, setAddEmail] = useState<Record<string, string>>({})
  const [adding, setAdding] = useState<string | null>(null)

  async function createTeam() {
    if (!newTeamName.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTeamName.trim(), event_id: eventId }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      toast.success(`Team "${newTeamName}" created`)
      setNewTeamName('')
      onRefresh?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create team')
    } finally {
      setCreating(false)
    }
  }

  async function addMember(teamId: string) {
    const email = addEmail[teamId]?.trim()
    if (!email) return
    setAdding(teamId)
    try {
      const res = await fetch(`/api/teams/${teamId}/add-member`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      toast.success(`${email} added to team`)
      setAddEmail(prev => ({ ...prev, [teamId]: '' }))
      onRefresh?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add member')
    } finally {
      setAdding(null)
    }
  }

  async function removeMember(teamId: string, userId: string) {
    setRemoving(userId)
    try {
      const res = await fetch(`/api/teams/${teamId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      toast.success('Member removed')
      onRefresh?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove member')
    } finally {
      setRemoving(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Create team */}
      <div className="glass-card p-4 rounded-xl border border-slate-700/50">
        <Label className="text-slate-400 text-xs uppercase tracking-wider mb-2 block">Create New Team</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Team name..."
            value={newTeamName}
            onChange={e => setNewTeamName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createTeam()}
          />
          <Button variant="cyber" onClick={createTeam} disabled={creating || !newTeamName.trim()}>
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Teams list */}
      {teams.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No teams yet</p>
        </div>
      ) : (
        teams.map((team, i) => (
          <motion.div
            key={team.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card rounded-xl border border-slate-700/50 overflow-hidden"
          >
            <button
              onClick={() => setExpanded(expanded === team.id ? null : team.id)}
              className="w-full p-4 flex items-center gap-3 hover:bg-slate-800/20 transition-colors"
            >
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: team.color ?? getTeamColor(i) }}
              />
              <span className="text-white font-semibold flex-1 text-left">{team.name}</span>
              <Badge variant="secondary" className="text-xs">
                <Users className="w-3 h-3 mr-1" />
                {team.team_members.length}
              </Badge>
              {expanded === team.id
                ? <ChevronDown className="w-4 h-4 text-slate-400" />
                : <ChevronRight className="w-4 h-4 text-slate-400" />
              }
            </button>

            {expanded === team.id && (
              <div className="px-4 pb-4 border-t border-slate-700/30 space-y-3">
                {/* Member list */}
                {team.team_members.length === 0 ? (
                  <p className="text-slate-500 text-sm py-2">No members yet</p>
                ) : (
                  <div className="space-y-2 mt-3">
                    {team.team_members.map(member => (
                      <div key={member.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-300 text-sm">{member.users?.name ?? 'Unknown'}</p>
                          <p className="text-slate-500 text-xs">{member.users?.email ?? ''}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {member.role === 'captain' && (
                            <Badge variant="outline" className="text-xs">Captain</Badge>
                          )}
                          <button
                            onClick={() => removeMember(team.id, member.user_id)}
                            disabled={removing === member.user_id}
                            className="text-slate-500 hover:text-red-400 transition-colors"
                          >
                            {removing === member.user_id
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <UserMinus className="w-3 h-3" />
                            }
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add member by email */}
                <div className="flex gap-2 pt-2 border-t border-slate-700/20">
                  <Input
                    placeholder="Add member by email..."
                    value={addEmail[team.id] ?? ''}
                    onChange={e => setAddEmail(prev => ({ ...prev, [team.id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && addMember(team.id)}
                    className="text-sm h-8"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addMember(team.id)}
                    disabled={adding === team.id || !addEmail[team.id]?.trim()}
                    className="h-8 px-3"
                  >
                    {adding === team.id
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <Plus className="w-3 h-3" />
                    }
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        ))
      )}
    </div>
  )
}
