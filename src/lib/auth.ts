import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { User, Team } from '@/types/database'

/**
 * Retrieve the currently authenticated user from the public.users table.
 * Returns null when no session exists or the profile row is missing.
 */
export async function getUser(): Promise<User | null> {
  const supabase = await createClient()

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !authUser) {
    return null
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (userError || !user) {
    return null
  }

  return user
}

/**
 * Require an authenticated session. Redirects to /login when unauthenticated.
 */
export async function requireAuth(): Promise<User> {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  return user
}

/**
 * Require an admin session. Redirects to /dashboard when the user is not an admin.
 */
export async function requireAdmin(): Promise<User> {
  const user = await requireAuth()

  if (user.role !== 'admin') {
    redirect('/dashboard')
  }

  return user
}

/**
 * Return the team the given user belongs to within the specified event, or null
 * when the user is not a member of any team in that event.
 */
export async function getUserTeamForEvent(
  userId: string,
  eventId: string
): Promise<{ team: Team | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('team_members')
    .select('teams(*)')
    .eq('user_id', userId)
    .eq('teams.event_id', eventId)
    .maybeSingle()

  if (error || !data) {
    return { team: null }
  }

  // data.teams is the joined Team row (or null when the event_id filter excluded it)
  const team = (data as { teams: Team | null }).teams

  return { team: team ?? null }
}
