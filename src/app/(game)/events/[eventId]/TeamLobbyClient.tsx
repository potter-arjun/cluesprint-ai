'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface TeamLobbyClientProps {
  teamId: string
  eventId: string
  action: 'join' | 'leave'
}

export function TeamLobbyClient({ teamId, eventId, action }: TeamLobbyClientProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleJoin() {
    setLoading(true)
    try {
      const res = await fetch(`/api/teams/${teamId}/join`, { method: 'POST' })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      toast.success('Joined team successfully!')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to join team')
    } finally {
      setLoading(false)
    }
  }

  async function handleLeave() {
    setLoading(true)
    try {
      const res = await fetch(`/api/teams/${teamId}/leave`, { method: 'POST' })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      toast.success('Left team')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to leave team')
    } finally {
      setLoading(false)
    }
  }

  if (action === 'join') {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={handleJoin}
        disabled={loading}
      >
        {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <UserPlus className="w-3 h-3 mr-1" />}
        Join Team
      </Button>
    )
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleLeave} disabled={loading}>
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Leave'}
    </Button>
  )
}
