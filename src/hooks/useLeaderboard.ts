'use client'
import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRealtimeLeaderboard } from './useRealtime'
import type { LeaderboardEntry } from '@/types/game'

// ============================================================
// Fetch + subscribe to the live leaderboard for an event
// ============================================================

export function useLeaderboard(eventId: string) {
  const queryClient = useQueryClient()

  const {
    data: leaderboard,
    isLoading,
    error,
  } = useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboard', eventId],
    queryFn: async () => {
      const res = await fetch(`/api/events/${eventId}/leaderboard`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? 'Failed to fetch leaderboard')
      }
      const { data } = await res.json()
      return data as LeaderboardEntry[]
    },
    enabled: Boolean(eventId),
    staleTime: 10_000,
    refetchInterval: 60_000,
  })

  // When a score row changes for this event, invalidate the cached leaderboard
  // so it is re-fetched with fresh rankings.
  const handleScoreChange = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['leaderboard', eventId] })
  }, [queryClient, eventId])

  useRealtimeLeaderboard(eventId, handleScoreChange)

  return {
    leaderboard: leaderboard ?? [],
    isLoading,
    error: error as Error | null,
  }
}
