'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { EventForm } from '@/components/admin/EventForm'
import { toast } from 'sonner'

export default function NewEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(data: Record<string, unknown>) {
    setLoading(true)
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (json.error) throw new Error(typeof json.error === 'string' ? json.error : JSON.stringify(json.error))
      toast.success('Event created!')
      window.location.href = `/admin/events/${json.data.id}`
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create event')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Events
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Create New Event</h1>
        <p className="text-slate-400 mt-1">Configure your AI-powered office adventure</p>
      </div>

      <div className="glass-card p-6 rounded-2xl border border-slate-700/50">
        <EventForm
          onSubmit={handleSubmit}
          isLoading={loading}
          submitLabel="Create Event"
        />
      </div>
    </div>
  )
}
