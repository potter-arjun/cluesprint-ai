import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'

// GET /api/profile — current user profile with stats
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const user = await getUser()

    if (!user) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch profile row
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { data: null, error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Total score across all events (from scores table)
    const { data: scoreRows } = await supabase
      .from('scores')
      .select('total_points')
      .eq('user_id', user.id)

    const totalScore = (scoreRows ?? []).reduce(
      (sum, s) => sum + (s.total_points ?? 0),
      0
    )

    // Count distinct events participated in
    const { data: eventMemberships } = await supabase
      .from('team_members')
      .select('teams!inner(event_id)')
      .eq('user_id', user.id)

    const distinctEventIds = new Set(
      (eventMemberships ?? []).map(
        (m) => (m.teams as { event_id: string }).event_id
      )
    )

    // Missions completed (approved submissions)
    const { count: missionsCompleted } = await supabase
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'approved')

    // Achievements count
    const { count: achievementsCount } = await supabase
      .from('achievements')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // Fetch user's badges via achievements
    const { data: achievements } = await supabase
      .from('achievements')
      .select('badges(*), earned_at, event_id')
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false })

    const badges = (achievements ?? [])
      .map((a) => ({
        ...(a.badges as object),
        earned_at: a.earned_at,
        event_id: a.event_id,
      }))
      .filter(Boolean)

    const stats = {
      total_score: totalScore,
      events_played: distinctEventIds.size,
      missions_completed: missionsCompleted ?? 0,
      achievements_count: achievementsCount ?? 0,
      level: profile.level,
      xp: profile.xp,
      badges,
    }

    return NextResponse.json({ data: { ...profile, stats }, error: null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}

// PATCH /api/profile — update name and/or avatar_url
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const user = await getUser()

    if (!user) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, avatar_url } = body

    if (name === undefined && avatar_url === undefined) {
      return NextResponse.json(
        { data: null, error: 'At least one of name or avatar_url is required' },
        { status: 400 }
      )
    }

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 1) {
        return NextResponse.json(
          { data: null, error: 'name must be a non-empty string' },
          { status: 400 }
        )
      }
      updatePayload.name = name.trim()
    }

    if (avatar_url !== undefined) {
      if (typeof avatar_url !== 'string' && avatar_url !== null) {
        return NextResponse.json(
          { data: null, error: 'avatar_url must be a string or null' },
          { status: 400 }
        )
      }
      updatePayload.avatar_url = avatar_url
    }

    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update(updatePayload)
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { data: null, error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: updated, error: null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
