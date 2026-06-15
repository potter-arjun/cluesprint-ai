import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth'

// POST /api/game/join — join an event by code without a full account
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code, name } = await request.json() as { code: string; name: string }

    if (!code?.trim() || !name?.trim()) {
      return NextResponse.json({ error: 'name and code are required' }, { status: 400 })
    }

    // Find event by join code
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, name, status, max_players_per_team, max_teams')
      .eq('join_code', code.trim().toUpperCase())
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Invalid join code — event not found' }, { status: 404 })
    }

    if (event.status === 'completed') {
      return NextResponse.json({ error: 'This event has already ended' }, { status: 409 })
    }

    // Update the anonymous user's display name
    const adminClient = createAdminClient()
    await adminClient
      .from('users')
      .update({ name: name.trim() })
      .eq('id', user.id)

    // Check if already on a team in this event
    const { data: existing } = await supabase
      .from('team_members')
      .select('team_id, teams!inner(event_id)')
      .eq('user_id', user.id)
      .eq('teams.event_id', event.id)
      .maybeSingle()

    if (existing) {
      // Already joined — just return the event
      return NextResponse.json({ eventId: event.id })
    }

    // Get all teams for this event with member counts
    const { data: teams } = await supabase
      .from('teams')
      .select('id, team_members(count)')
      .eq('event_id', event.id)

    if (!teams || teams.length === 0) {
      return NextResponse.json({ error: 'No teams available in this event yet. Ask the admin to create teams.' }, { status: 409 })
    }

    const maxPerTeam = event.max_players_per_team ?? 5

    // Find team with fewest members that isn't full
    const available = teams
      .map(t => ({
        id: t.id,
        count: (t.team_members as { count: number }[])?.[0]?.count ?? 0,
      }))
      .filter(t => t.count < maxPerTeam)
      .sort((a, b) => a.count - b.count)

    if (available.length === 0) {
      return NextResponse.json({ error: 'All teams are full' }, { status: 409 })
    }

    const targetTeam = available[0]

    // Add user to team using service role to bypass RLS
    const { error: insertError } = await adminClient.from('team_members').insert({
      team_id: targetTeam.id,
      user_id: user.id,
      role: targetTeam.count === 0 ? 'captain' : 'member',
    })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ eventId: event.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
