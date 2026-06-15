import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { EventControlPanel } from './EventControlPanel'
import type { Event, Mission, Team, TeamMember, User, Submission, AIFeedback } from '@/types/database'

type TeamWithMembers = Team & {
  team_members: (TeamMember & { users: Pick<User, 'id' | 'name' | 'email'> | null })[]
}
type SubmissionWithDetails = Submission & {
  teams: { name: string; color: string } | null
  missions: { title: string } | null
  ai_feedback: AIFeedback[] | null
}

export default async function AdminEventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (!event) notFound()

  const [{ data: teams }, { data: missions }, { data: submissions }] = await Promise.all([
    supabase
      .from('teams')
      .select('*, team_members(id, team_id, user_id, role, joined_at, users(id, name, email))')
      .eq('event_id', eventId),
    supabase
      .from('missions')
      .select('*')
      .eq('event_id', eventId)
      .order('order_index', { ascending: true }),
    supabase
      .from('submissions')
      .select('*, teams(name, color), missions(title), ai_feedback(*)')
      .eq('event_id', eventId)
      .order('submitted_at', { ascending: false }),
  ])

  return (
    <EventControlPanel
      event={event as Event}
      teams={(teams ?? []) as TeamWithMembers[]}
      missions={(missions ?? []) as Mission[]}
      submissions={(submissions ?? []) as SubmissionWithDetails[]}
    />
  )
}
