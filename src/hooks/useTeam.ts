'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Team, TeamMember, User } from '@/types/database'

export interface TeamWithMembers extends Team {
  members: (TeamMember & { user: User })[]
}

// ============================================================
// Fetch a single team by ID with its members
// ============================================================

export function useTeam(teamId: string | null) {
  const supabase = createClient()

  return useQuery<TeamWithMembers | null>({
    queryKey: ['team', teamId],
    queryFn: async () => {
      if (!teamId) return null

      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single()

      if (teamError) throw new Error(teamError.message)
      if (!team) return null

      const { data: members, error: membersError } = await supabase
        .from('team_members')
        .select('*, user:users(*)')
        .eq('team_id', teamId)

      if (membersError) throw new Error(membersError.message)

      return {
        ...team,
        members: (members ?? []) as (TeamMember & { user: User })[],
      }
    },
    enabled: Boolean(teamId),
    staleTime: 30_000,
  })
}

// ============================================================
// Find the current user's team within a specific event
// ============================================================

export function useMyTeam(eventId: string, userId: string | null) {
  const supabase = createClient()

  return useQuery<TeamWithMembers | null>({
    queryKey: ['my-team', eventId, userId],
    queryFn: async () => {
      if (!userId || !eventId) return null

      // Find which team this user belongs to in the event
      const { data: membership, error: memberError } = await supabase
        .from('team_members')
        .select('team_id, team:teams!inner(event_id)')
        .eq('user_id', userId)
        .eq('team.event_id', eventId)
        .maybeSingle()

      if (memberError) throw new Error(memberError.message)
      if (!membership) return null

      const teamId = membership.team_id

      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single()

      if (teamError) throw new Error(teamError.message)
      if (!team) return null

      const { data: members, error: membersError } = await supabase
        .from('team_members')
        .select('*, user:users(*)')
        .eq('team_id', teamId)

      if (membersError) throw new Error(membersError.message)

      return {
        ...team,
        members: (members ?? []) as (TeamMember & { user: User })[],
      }
    },
    enabled: Boolean(eventId) && Boolean(userId),
    staleTime: 30_000,
  })
}
