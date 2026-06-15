'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { StoryIntro } from '@/components/game/StoryIntro'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import type { Story } from '@/types/database'

export default function StoryPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.eventId as string
  const supabase = createClient()

  const [story, setStory] = useState<Story | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStory() {
      const { data } = await supabase
        .from('stories')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      setStory(data)
      setLoading(false)

      if (!data) {
        router.push(`/events/${eventId}/mission`)
      }
    }

    loadStory()
  }, [eventId, router, supabase])

  if (loading) {
    return <LoadingSpinner variant="fullscreen" loadingText="Loading story..." />
  }

  if (!story) {
    return <LoadingSpinner variant="fullscreen" loadingText="Redirecting to missions..." />
  }

  return (
    <StoryIntro
      title={story.title}
      content={story.content}
      keyElements={story.key_elements ?? []}
      onComplete={() => router.push(`/events/${eventId}/mission`)}
    />
  )
}
