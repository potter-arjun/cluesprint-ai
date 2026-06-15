import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Users,
  ChevronRight,
  Lock,
  Play,
  Shield,
  Clock,
  Unlock,
  BookOpen,
  Sparkles,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TeamLobbyClient } from './TeamLobbyClient'
import { LobbyRealtimeClient } from './LobbyRealtimeClient'
import type { EventStatus } from '@/types/database'

type Props = { params: Promise<{ eventId: string }> }

// ── explicit shape of the deeply-joined query result ──────────────────────────
interface TeamMemberRow {
  users: { id: string; name: string; avatar_url: string | null }
}
interface TeamRow {
  id: string
  name: string
  color: string
  total_score: number
  team_members: TeamMemberRow[]
}
interface StoryRow {
  id: string
  title: string
  content: string
  key_elements: string[]
}
interface EventRow {
  id: string
  name: string
  description: string | null
  status: EventStatus
  max_players_per_team: number
  duration_minutes: number
  scheduled_at: string | null
  started_at: string | null
  ended_at: string | null
  stories: StoryRow[]
  teams: TeamRow[]
}

const STATUS_CONFIG: Record<
  EventStatus,
  { label: string; color: string; dot: string }
> = {
  draft: {
    label: 'Waiting to Start',
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    dot: 'bg-amber-400',
  },
  active: {
    label: 'Game Active',
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    dot: 'bg-green-400',
  },
  paused: {
    label: 'Paused',
    color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    dot: 'bg-orange-400',
  },
  completed: {
    label: 'Completed',
    color: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    dot: 'bg-slate-400',
  },
}

export default async function EventLobbyPage({ params }: Props) {
  const { eventId } = await params
  const user = await requireAuth()

  const supabase = await createClient()

  const { data: rawEvent } = await supabase
    .from('events')
    .select(`
      *,
      stories(*),
      teams(
        *,
        team_members(
          *,
          users(id, name, avatar_url, email)
        )
      )
    `)
    .eq('id', eventId)
    .single()

  if (!rawEvent) redirect('/dashboard')

  // Cast to our explicit type so TypeScript is happy
  const event = rawEvent as unknown as EventRow

  if (event.status === 'active') redirect(`/events/${eventId}/mission`)
  if (event.status === 'completed') redirect(`/events/${eventId}/results`)

  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = (userProfile as { role: string } | null)?.role === 'admin'

  const myTeam = event.teams?.find((team) =>
    team.team_members?.some((m) => m.users?.id === user.id)
  )

  const story = event.stories?.[0] ?? null
  const storyTeaser = story
    ? story.content.split(/\s+/).slice(0, 50).join(' ') + '...'
    : null

  const statusConfig = STATUS_CONFIG[event.status] ?? STATUS_CONFIG.draft

  const totalPlayers =
    event.teams?.reduce((acc, t) => acc + (t.team_members?.length ?? 0), 0) ??
    0

  return (
    <>
      {/* Realtime client: watches for event status → 'active' and redirects */}
      <LobbyRealtimeClient eventId={eventId} />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* ── Breadcrumb ── */}
        <div className="flex items-center gap-2 text-slate-400 text-sm mb-6">
          <Link href="/dashboard" className="hover:text-white transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-white">Event Lobby</span>
        </div>

        {/* ── Event Header ── */}
        <div className="mb-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-4xl md:text-5xl font-black text-white mb-3 leading-tight">
                {event.name}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge
                  className={`${statusConfig.color} flex items-center gap-1.5 border`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot} animate-pulse`}
                  />
                  {statusConfig.label}
                </Badge>

                {event.teams && (
                  <span className="text-slate-400 text-sm flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    {event.teams.length} team
                    {event.teams.length !== 1 ? 's' : ''}
                  </span>
                )}

                {event.duration_minutes > 0 && (
                  <span className="text-slate-400 text-sm flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {event.duration_minutes} min game
                  </span>
                )}
              </div>

              {event.description && (
                <p className="text-slate-400 mt-4 max-w-2xl leading-relaxed">
                  {event.description}
                </p>
              )}
            </div>

            {/* Admin controls */}
            {isAdmin && (
              <div className="flex gap-2 flex-shrink-0">
                <Link href={`/admin/events/${eventId}`}>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Shield className="w-4 h-4" />
                    Manage Event
                  </Button>
                </Link>

                {event.status === 'draft' && (
                  <form action={`/api/events/${eventId}/start`} method="POST">
                    <Button
                      variant="cyber"
                      size="sm"
                      type="submit"
                      className="gap-1.5"
                    >
                      <Play className="w-4 h-4" />
                      Start Game
                    </Button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Story Teaser ── */}
        {story && (
          <div className="glass-card rounded-2xl border border-blue-500/20 mb-8 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500" />
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
                    <BookOpen className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-blue-400 font-bold text-xs uppercase tracking-widest">
                      Mission Brief
                    </p>
                    <p className="text-white font-semibold text-sm">
                      The Adventure Awaits...
                    </p>
                  </div>
                </div>

                {story.key_elements && story.key_elements.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    {story.key_elements.slice(0, 3).map((el: string) => (
                      <Badge
                        key={el}
                        className="text-xs bg-cyan-600/20 text-cyan-300 border border-cyan-500/30"
                      >
                        {el}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-start gap-3">
                {event.status === 'draft' ? (
                  <Lock className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <Unlock className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg mb-1.5">
                    {story.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {storyTeaser}
                  </p>
                </div>
              </div>

              {event.status !== 'draft' ? (
                <div className="mt-4">
                  <Link href={`/events/${eventId}/story`}>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <BookOpen className="w-4 h-4" />
                      View Full Story
                    </Button>
                  </Link>
                </div>
              ) : (
                <p className="text-slate-500 text-xs mt-4 flex items-center gap-1.5">
                  <Lock className="w-3 h-3" />
                  Full story revealed when game starts
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Teams Grid ── */}
        <div className="mb-8">
          <h2 className="text-white font-bold text-xl mb-5 flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            Teams
            <span className="text-slate-500 font-normal text-base">
              ({event.teams?.length ?? 0})
            </span>
          </h2>

          {event.teams && event.teams.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {event.teams.map((team) => {
                const isMyTeam = team.id === myTeam?.id
                const memberCount = team.team_members?.length ?? 0
                const maxPlayers = event.max_players_per_team ?? 5
                const isFull = memberCount >= maxPlayers
                const canJoin =
                  !myTeam && !isFull && event.status === 'draft'
                const fillPct = Math.min(
                  100,
                  Math.round((memberCount / maxPlayers) * 100)
                )

                return (
                  <div
                    key={team.id}
                    className={`glass-card rounded-xl overflow-hidden border transition-all duration-300 ${
                      isMyTeam
                        ? 'border-blue-500/60 shadow-[0_0_20px_rgba(37,99,235,0.2)]'
                        : 'border-slate-700/50 hover:border-slate-600/70'
                    }`}
                  >
                    {/* Team color bar */}
                    <div
                      className="h-1.5 w-full"
                      style={{ backgroundColor: team.color }}
                    />

                    <div className="p-4">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-black text-base flex-shrink-0"
                            style={{ backgroundColor: team.color }}
                          >
                            {team.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-white truncate">
                            {team.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {isMyTeam && (
                            <Badge className="text-xs bg-blue-600/20 text-blue-400 border border-blue-500/30">
                              Your Team
                            </Badge>
                          )}
                          {isFull && !isMyTeam && (
                            <Badge className="text-xs bg-slate-700/50 text-slate-400 border border-slate-600/30">
                              Full
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Member avatars */}
                      <div className="flex items-center gap-1 mb-3">
                        <div className="flex -space-x-1.5">
                          {team.team_members?.slice(0, 3).map((member) => (
                            <div
                              key={member.users?.id}
                              className="w-7 h-7 rounded-full border-2 border-slate-800 flex items-center justify-center text-xs text-white font-semibold"
                              title={member.users?.name}
                              style={{ backgroundColor: team.color + '88' }}
                            >
                              {member.users?.name?.charAt(0)?.toUpperCase() ??
                                '?'}
                            </div>
                          ))}
                          {memberCount > 3 && (
                            <div className="w-7 h-7 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center text-xs text-slate-400 font-medium">
                              +{memberCount - 3}
                            </div>
                          )}
                        </div>
                        <span className="text-slate-500 text-xs ml-auto">
                          {memberCount}/{maxPlayers}
                        </span>
                      </div>

                      {/* Capacity progress bar */}
                      <div className="w-full bg-slate-700/60 rounded-full h-1 mb-3">
                        <div
                          className="h-1 rounded-full transition-all duration-500"
                          style={{
                            width: `${fillPct}%`,
                            backgroundColor: team.color,
                            opacity: 0.8,
                          }}
                        />
                      </div>

                      {/* Score (non-draft games) */}
                      {event.status !== 'draft' && (
                        <div className="flex items-center gap-1 mb-3">
                          <Star className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-amber-400 text-sm font-bold">
                            {team.total_score ?? 0} pts
                          </span>
                        </div>
                      )}

                      {/* Join button */}
                      {canJoin && (
                        <TeamLobbyClient
                          teamId={team.id}
                          eventId={eventId}
                          action="join"
                        />
                      )}

                      {isMyTeam && event.status === 'draft' && (
                        <div className="flex items-center gap-1.5 text-blue-400 text-xs font-medium mt-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                          Ready to play
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="glass-card rounded-xl border border-slate-700/50 p-10 text-center">
              <Users className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <p className="text-slate-500">
                No teams created yet. The game master will set up teams.
              </p>
            </div>
          )}
        </div>

        {/* ── Waiting State (non-admin) ── */}
        {event.status === 'draft' && !isAdmin && (
          <div className="glass-card p-8 rounded-2xl text-center border border-amber-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-900/5 via-transparent to-amber-900/5 pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="relative w-4 h-4">
                  <div className="w-4 h-4 rounded-full bg-amber-400 animate-ping absolute" />
                  <div className="w-4 h-4 rounded-full bg-amber-400 relative" />
                </div>
                <span className="text-amber-400 font-bold text-lg">
                  Waiting for the Game Master
                </span>
              </div>
              <p className="text-slate-400 mb-2 max-w-md mx-auto">
                The game master will start the adventure soon. Get your team
                ready — the mission brief appears the moment we begin.
              </p>
              {myTeam ? (
                <p className="text-slate-500 text-sm">
                  You&apos;re in:{' '}
                  <span className="text-white font-semibold">{myTeam.name}</span>
                </p>
              ) : (
                <p className="text-amber-500 text-sm font-medium mt-1">
                  Join a team above before the game starts!
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Admin: Game-ready launch panel ── */}
        {event.status === 'draft' && isAdmin && (
          <div className="glass-card p-6 rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-white font-bold text-lg mb-1">
                  Ready to launch the adventure?
                </h3>
                <p className="text-slate-400 text-sm">
                  {event.teams?.length ?? 0} team
                  {(event.teams?.length ?? 0) !== 1 ? 's' : ''} registered
                  {' • '}
                  {totalPlayers} player
                  {totalPlayers !== 1 ? 's' : ''} total
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/events/${eventId}`}>
                  <Button variant="outline" className="gap-1.5">
                    <Shield className="w-4 h-4" />
                    Manage
                  </Button>
                </Link>
                <form action={`/api/events/${eventId}/start`} method="POST">
                  <Button
                    variant="cyber"
                    size="lg"
                    type="submit"
                    className="gap-2 px-8"
                  >
                    <Play className="w-5 h-5" />
                    Start Game Now
                  </Button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
