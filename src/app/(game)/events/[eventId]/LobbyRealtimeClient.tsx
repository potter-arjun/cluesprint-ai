'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface LobbyRealtimeClientProps {
  eventId: string
}

export function LobbyRealtimeClient({ eventId }: LobbyRealtimeClientProps) {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('lobby-' + eventId)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'events',
        filter: `id=eq.${eventId}`,
      }, (payload) => {
        const event = payload.new as { status: string }
        if (event.status === 'active') {
          router.refresh()
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'team_members',
      }, () => {
        router.refresh()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [eventId, router, supabase])

  return null
}
