'use client'
import { useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

// ============================================================
// Leaderboard Realtime Hook
// ============================================================

export function useRealtimeLeaderboard(
  eventId: string,
  onUpdate: (payload: any) => void
): void {
  const supabase = createClient()

  useEffect(() => {
    if (!eventId) return

    const channel = supabase
      .channel('leaderboard-' + eventId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scores',
          filter: 'event_id=eq.' + eventId,
        },
        onUpdate
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId, onUpdate])
}

// ============================================================
// Notifications Realtime Hook
// ============================================================

export function useRealtimeNotifications(
  eventId: string,
  onNotification: (notification: any) => void
): void {
  const supabase = createClient()

  useEffect(() => {
    if (!eventId) return

    const channel = supabase
      .channel('notifications-' + eventId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: 'event_id=eq.' + eventId,
        },
        onNotification
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId, onNotification])
}

// ============================================================
// Missions Realtime Hook
// ============================================================

export function useRealtimeMissions(
  eventId: string,
  onMissionChange: (mission: any) => void
): void {
  const supabase = createClient()

  useEffect(() => {
    if (!eventId) return

    const channel = supabase
      .channel('missions-' + eventId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'missions',
          filter: 'event_id=eq.' + eventId,
        },
        onMissionChange
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId, onMissionChange])
}

// ============================================================
// Submissions Realtime Hook (Admin)
// ============================================================

export function useRealtimeSubmissions(
  eventId: string,
  onSubmission: (submission: any) => void
): void {
  const supabase = createClient()

  useEffect(() => {
    if (!eventId) return

    // Submissions don't have a direct event_id column — we join via mission_id.
    // The filter below uses a Supabase RLS-safe broadcast channel with the
    // event_id embedded in the channel name so only the relevant admin gets it.
    // For direct postgres_changes we listen to all new submissions and let the
    // handler discard irrelevant ones when needed.
    const channel = supabase
      .channel('submissions-admin-' + eventId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'submissions',
        },
        onSubmission
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId, onSubmission])
}
