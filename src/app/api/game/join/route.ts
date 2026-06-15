import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth'

// POST /api/game/join — join an event by code without a full account
export async function POST(request: NextRequest) {
  try {
    const adminClient = createAdminClient()

    // Try cookie-based auth first, fall back to Bearer token (anonymous sign-in
    // sets the session client-side; the cookie may not arrive before this fetch fires)
    let userId: string | null = null

    const cookieUser = await getUser()
    if (cookieUser) {
      userId = cookieUser.id
    } else {
      const authHeader = request.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7)
        const { data: { user: tokenUser } } = await adminClient.auth.getUser(token)
        if (tokenUser) userId = tokenUser.id
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code, name } = await request.json() as { code: string; name: string }

    if (!code?.trim() || !name?.trim()) {
      return NextResponse.json({ error: 'name and code are required' }, { status: 400 })
    }

    // Use admin client for all queries so RLS doesn't block anonymous users
    const supabase = await createClient()

    // Find event by join code
    const { data: event, error: eventError } = await adminClient
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

    // Ensure the user profile exists (anonymous users may not have triggered the DB hook yet)
    await adminClient.from('users').upsert(
      { id: userId, name: name.trim(), role: 'player', email: '' } as never,
      { onConflict: 'id', ignoreDuplicates: false }
    )

    // Check if already on a team in this event
    const { data: existing } = await supabase
      .from('team_members')
      .select('team_id, teams!inner(event_id)')
      .eq('user_id', userId)
      .eq('teams.event_id', event.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ eventId: event.id })
    }

    // Get all teams with member counts
    const { data: teams } = await adminClient
      .from('teams')
      .select('id, team_members(count)')
      .eq('event_id', event.id)

    if (!teams || teams.length === 0) {
      return NextResponse.json(
        { error: 'No teams available yet. Ask the admin to create teams first.' },
        { status: 409 }
      )
    }

    const maxPerTeam = event.max_players_per_team ?? 5

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

    const { error: insertError } = await adminClient.from('team_members').insert({
      team_id: targetTeam.id,
      user_id: userId,
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
