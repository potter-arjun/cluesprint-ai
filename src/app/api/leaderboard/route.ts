import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const eventId = searchParams.get('eventId')

  if (!eventId) {
    return NextResponse.json({ data: null, error: 'eventId query param required' }, { status: 400 })
  }

  const { data, error } = await supabase.rpc('get_event_leaderboard', {
    p_event_id: eventId,
  })

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 })

  // Enrich with badges
  const enriched = await Promise.all(
    (data ?? []).map(async (entry: { team_id: string; team_name: string; team_color: string; total_score: number; missions_completed: number; rank: number }) => {
      const { data: badges } = await supabase
        .from('team_badges')
        .select('badges(*)')
        .eq('team_id', entry.team_id)
      return {
        ...entry,
        badges: badges?.map((b: { badges: unknown }) => b.badges) ?? [],
      }
    })
  )

  return NextResponse.json({ data: enriched, error: null })
}
