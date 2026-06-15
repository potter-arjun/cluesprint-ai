import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const PatchTeamSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
})

type RouteContext = { params: Promise<{ teamId: string }> }

export async function GET(_request: Request, { params }: RouteContext) {
  const { teamId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  }

  const { data: team, error } = await supabase
    .from('teams')
    .select(
      `
      *,
      team_members(
        *,
        users(id, name, email, avatar_url, level, xp, total_score)
      ),
      scores(
        id,
        base_points,
        speed_bonus,
        power_up_bonus,
        total_points,
        reason,
        created_at,
        mission_id
      )
    `
    )
    .eq('id', teamId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ data: null, error: 'Team not found' }, { status: 404 })
    }
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: team, error: null })
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { teamId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = PatchTeamSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ data: null, error: parsed.error.message }, { status: 400 })
  }

  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ data: null, error: 'No fields to update' }, { status: 400 })
  }

  // If renaming, ensure the new name is unique within the same event
  if (parsed.data.name) {
    const { data: existingTeam } = await supabase
      .from('teams')
      .select('id, event_id')
      .eq('id', teamId)
      .single()

    if (existingTeam) {
      const { data: duplicate } = await supabase
        .from('teams')
        .select('id')
        .eq('event_id', existingTeam.event_id)
        .ilike('name', parsed.data.name)
        .neq('id', teamId)
        .maybeSingle()

      if (duplicate) {
        return NextResponse.json(
          { data: null, error: 'A team with this name already exists in the event' },
          { status: 409 }
        )
      }
    }
  }

  const { data, error } = await supabase
    .from('teams')
    .update(parsed.data)
    .eq('id', teamId)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ data: null, error: 'Team not found' }, { status: 404 })
    }
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, error: null })
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { teamId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })
  }

  // Block deletion if the team has any submissions
  const { count: submissionCount, error: subCountError } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('team_id', teamId)

  if (subCountError) {
    return NextResponse.json({ data: null, error: subCountError.message }, { status: 500 })
  }

  if (submissionCount && submissionCount > 0) {
    return NextResponse.json(
      {
        data: null,
        error: 'Cannot delete a team that has submissions. Remove submissions first.',
      },
      { status: 409 }
    )
  }

  const { error } = await supabase.from('teams').delete().eq('id', teamId)

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: { id: teamId }, error: null })
}
