'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRealtimeMissions } from './useRealtime'
import type { MissionWithDetails } from '@/types/game'

// ============================================================
// Active Mission Hook — includes a live countdown timer
// ============================================================

export function useActiveMission(eventId: string) {
  const queryClient = useQueryClient()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

  const {
    data: mission,
    isLoading,
    error,
  } = useQuery<MissionWithDetails | null>({
    queryKey: ['active-mission', eventId],
    queryFn: async () => {
      const res = await fetch(`/api/events/${eventId}/missions/active`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? 'Failed to fetch active mission')
      }
      const { data } = await res.json()
      return data as MissionWithDetails | null
    },
    enabled: Boolean(eventId),
    staleTime: 5_000,
    refetchOnWindowFocus: true,
  })

  // Recalculate + tick the countdown whenever the active mission changes
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (
      !mission ||
      mission.status !== 'active' ||
      !mission.activated_at ||
      !mission.time_limit_seconds
    ) {
      setTimeRemaining(null)
      return
    }

    const computeRemaining = () => {
      const elapsedMs = Date.now() - new Date(mission.activated_at!).getTime()
      const elapsedSeconds = Math.floor(elapsedMs / 1000)
      const remaining = Math.max(0, mission.time_limit_seconds! - elapsedSeconds)
      return remaining
    }

    setTimeRemaining(computeRemaining())

    intervalRef.current = setInterval(() => {
      const remaining = computeRemaining()
      setTimeRemaining(remaining)
      if (remaining === 0 && intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
        // Refetch so the status update from the server is picked up
        queryClient.invalidateQueries({ queryKey: ['active-mission', eventId] })
      }
    }, 1_000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [mission, eventId, queryClient])

  // Re-fetch whenever the missions table changes for this event
  const handleMissionChange = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['active-mission', eventId] })
  }, [queryClient, eventId])

  useRealtimeMissions(eventId, handleMissionChange)

  return {
    mission: mission ?? null,
    isLoading,
    error: error as Error | null,
    timeRemaining,
  }
}

// ============================================================
// Submit Mission Hook
// ============================================================

export interface SubmitMissionPayload {
  missionId: string
  teamId: string
  textContent?: string
  files?: File[]
  submissionTimeSeconds: number
}

export interface SubmissionResult {
  submissionId: string
  score: number | null
  feedback: {
    accuracy: number
    creativity: number
    teamwork: number
    speed: number
    presentation: number
    fun_factor: number
    total_score: number
    feedback: string
    narrative: string
    highlights: string[]
  } | null
  achievements: string[]
}

export function useSubmitMission() {
  const queryClient = useQueryClient()

  const mutation = useMutation<SubmissionResult, Error, SubmitMissionPayload>({
    mutationFn: async (payload) => {
      const formData = new FormData()
      formData.append('mission_id', payload.missionId)
      formData.append('team_id', payload.teamId)
      formData.append('submission_time_seconds', String(payload.submissionTimeSeconds))

      if (payload.textContent) {
        formData.append('text_content', payload.textContent)
      }

      if (payload.files && payload.files.length > 0) {
        for (const file of payload.files) {
          formData.append('files', file)
        }
      }

      const res = await fetch('/api/submissions', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? 'Failed to submit mission')
      }

      const { data } = await res.json()
      return data as SubmissionResult
    },
    onSuccess: (_result, variables) => {
      // Invalidate related queries so the UI reflects the new submission
      queryClient.invalidateQueries({ queryKey: ['active-mission'] })
      queryClient.invalidateQueries({ queryKey: ['team', variables.teamId] })
    },
  })

  return {
    submit: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
    result: mutation.data ?? null,
    error: mutation.error,
    reset: mutation.reset,
  }
}
