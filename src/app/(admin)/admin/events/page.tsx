import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Users, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default async function AdminEventsPage() {
  const supabase = await createClient()

  const { data: events } = await supabase
    .from('events')
    .select('id, name, description, status, theme, join_code, created_at')
    .order('created_at', { ascending: false })

  const eventList = (events ?? []) as {
    id: string; name: string; description: string | null; status: string
    theme: string | null; join_code: string | null; created_at: string
  }[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Events</h1>
          <p className="text-slate-400">{eventList.length} total events</p>
        </div>
        <Link href="/admin/events/new">
          <Button variant="cyber">
            <Plus className="w-4 h-4 mr-2" /> New Event
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {eventList.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center border border-slate-700/50">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-600" />
            <p className="text-slate-400 mb-4">No events yet. Create your first event to get started.</p>
            <Link href="/admin/events/new">
              <Button variant="cyber">
                <Plus className="w-4 h-4 mr-2" /> Create First Event
              </Button>
            </Link>
          </div>
        ) : (
          eventList.map(event => (
            <Link key={event.id} href={`/admin/events/${event.id}`}>
              <div className="glass-card rounded-xl p-5 border border-slate-700/50 hover:border-blue-500/30 transition-colors cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-semibold truncate">{event.name}</h3>
                      <Badge
                        variant={event.status === 'active' ? 'default' : event.status === 'completed' ? 'secondary' : 'outline'}
                        className="text-xs flex-shrink-0"
                      >
                        {event.status}
                      </Badge>
                    </div>
                    {event.description && (
                      <p className="text-slate-400 text-sm line-clamp-1">{event.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-slate-500 text-xs">
                      {event.theme && <span>Theme: {event.theme}</span>}
                      {event.join_code && <span>Code: <span className="text-blue-400 font-mono">{event.join_code}</span></span>}
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-500 flex-shrink-0">
                    {new Date(event.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
