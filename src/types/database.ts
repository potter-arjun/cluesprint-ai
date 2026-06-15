// ============================================================
// Enum / Union Types
// ============================================================

export type UserRole = 'admin' | 'player'
export type EventStatus = 'draft' | 'active' | 'paused' | 'completed'
export type MissionType = 'discovery' | 'creative' | 'puzzle' | 'ai'
export type MissionStatus = 'upcoming' | 'active' | 'completed'
export type SubmissionStatus = 'pending' | 'reviewing' | 'approved' | 'rejected'
export type PowerUpType = 'double_points' | 'speed_boost' | 'hint_reveal' | 'mystery_bonus'

// ============================================================
// Table Interfaces (matches DB schema after migrations 001 + 002)
// ============================================================

export interface User {
  id: string
  email: string
  name: string
  avatar_url: string | null
  role: UserRole
  xp: number
  level: number
  total_score: number
  events_played: number
  missions_completed: number
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  name: string
  description: string | null
  theme: string | null
  venue: string | null
  status: EventStatus
  admin_id: string | null
  max_teams: number
  max_players_per_team: number
  join_code: string | null
  starts_at: string | null
  ends_at: string | null
  started_at: string | null
  ended_at: string | null
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Story {
  id: string
  event_id: string
  title: string
  content: string
  theme: string
  key_elements: string[]
  ai_generated: boolean
  created_at: string
}

export interface Team {
  id: string
  event_id: string
  name: string
  color: string
  avatar_url: string | null
  total_score: number
  missions_completed: number
  created_at: string
  updated_at: string
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  role: string
  joined_at: string
}

export interface Mission {
  id: string
  event_id: string
  story_id: string | null
  title: string
  description: string
  instructions: string | null
  type: MissionType
  status: MissionStatus
  order_index: number
  points: number
  time_limit_seconds: number | null
  is_boss_battle: boolean
  evaluation_criteria: string | null
  hints: string[]
  activated_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface Submission {
  id: string
  mission_id: string
  team_id: string
  content: string | null
  media_urls: string[]
  status: SubmissionStatus
  score: number | null
  feedback_id: string | null
  override_notes: string | null
  override_score: number | null
  submitted_at: string
  reviewed_at: string | null
  updated_at: string
  event_id?: string
}

export interface AIFeedback {
  id: string
  submission_id: string
  accuracy: number
  creativity: number
  teamwork: number
  speed: number
  presentation: number
  fun_factor: number
  total_score: number
  feedback: string
  narrative: string | null
  highlights: string[]
  created_at: string
}

export interface Score {
  id: string
  team_id: string
  user_id: string | null
  event_id: string
  mission_id: string | null
  submission_id: string | null
  base_points: number
  speed_bonus: number
  power_up_bonus: number
  total_points: number
  reason: string | null
  created_at: string
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  color: string
  criteria: Record<string, unknown>
  condition_type: string | null
  created_at: string
}

export interface TeamBadge {
  id: string
  team_id: string
  badge_id: string
  earned_at: string
}

export interface Achievement {
  id: string
  user_id: string
  badge_id: string
  event_id: string | null
  earned_at: string
}

export interface PowerUp {
  id: string
  event_id: string
  type: PowerUpType
  team_id: string | null
  is_active: boolean
  activated_at: string | null
  expires_at: string | null
  created_at: string
}

export interface Notification {
  id: string
  event_id: string
  user_id: string | null
  team_id: string | null
  type: string
  title: string
  message: string
  metadata: Record<string, unknown>
  is_read: boolean
  created_at: string
}

export interface BossBattle {
  id: string
  event_id: string
  mission_id: string | null
  status: string
  starts_at: string | null
  ends_at: string | null
  created_at: string
}

export interface LeaderboardSnapshot {
  id: string
  event_id: string
  team_id: string
  rank: number
  score: number
  missions_completed: number
  snapshot_at: string
}

export interface AuditLog {
  id: string
  user_id: string | null
  action: string
  resource_type: string | null
  resource_id: string | null
  details: Record<string, unknown>
  ip_address: string | null
  created_at: string
}

// ============================================================
// Supporting Row Types
// ============================================================

export interface LeaderboardRow {
  team_id: string
  team_name: string
  team_color: string
  total_score: number
  missions_completed: number
  rank: number
}

// ============================================================
// Supabase Database Type
//
// Each table entry needs:
//   - Relationships: []  (required by the JS client type system)
//   - Row/Insert/Update intersected with Record<string,unknown>
//     so the types satisfy the GenericTable constraint
//     (TypeScript interfaces don't implicitly have an index sig)
// ============================================================

type R<T> = T & Record<string, unknown>

export type Database = {
  public: {
    Tables: {
      users: {
        Row: R<User>
        Insert: R<Partial<User> & Pick<User, 'email'>>
        Update: R<Partial<User>>
        Relationships: []
      }
      events: {
        Row: R<Event>
        Insert: R<Partial<Event> & Pick<Event, 'name'>>
        Update: R<Partial<Event>>
        Relationships: []
      }
      stories: {
        Row: R<Story>
        Insert: R<Omit<Story, 'created_at'>>
        Update: R<Partial<Story>>
        Relationships: [
          { foreignKeyName: 'stories_event_id_fkey'; columns: ['event_id']; referencedRelation: 'events'; referencedColumns: ['id'] }
        ]
      }
      teams: {
        Row: R<Team>
        Insert: R<Partial<Team> & Pick<Team, 'name' | 'event_id'>>
        Update: R<Partial<Team>>
        Relationships: [
          { foreignKeyName: 'teams_event_id_fkey'; columns: ['event_id']; referencedRelation: 'events'; referencedColumns: ['id'] }
        ]
      }
      team_members: {
        Row: R<TeamMember>
        Insert: R<Omit<TeamMember, 'id' | 'joined_at'>>
        Update: R<Partial<TeamMember>>
        Relationships: [
          { foreignKeyName: 'team_members_team_id_fkey'; columns: ['team_id']; referencedRelation: 'teams'; referencedColumns: ['id'] },
          { foreignKeyName: 'team_members_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] }
        ]
      }
      missions: {
        Row: R<Mission>
        Insert: R<Partial<Mission> & Pick<Mission, 'title' | 'event_id' | 'type'>>
        Update: R<Partial<Mission>>
        Relationships: [
          { foreignKeyName: 'missions_event_id_fkey'; columns: ['event_id']; referencedRelation: 'events'; referencedColumns: ['id'] },
          { foreignKeyName: 'missions_story_id_fkey'; columns: ['story_id']; referencedRelation: 'stories'; referencedColumns: ['id'] }
        ]
      }
      submissions: {
        Row: R<Submission>
        Insert: R<Partial<Submission> & Pick<Submission, 'mission_id' | 'team_id'>>
        Update: R<Partial<Submission>>
        Relationships: [
          { foreignKeyName: 'submissions_mission_id_fkey'; columns: ['mission_id']; referencedRelation: 'missions'; referencedColumns: ['id'] },
          { foreignKeyName: 'submissions_team_id_fkey'; columns: ['team_id']; referencedRelation: 'teams'; referencedColumns: ['id'] }
        ]
      }
      ai_feedback: {
        Row: R<AIFeedback>
        Insert: R<Omit<AIFeedback, 'id' | 'created_at'>>
        Update: R<Partial<AIFeedback>>
        Relationships: [
          { foreignKeyName: 'ai_feedback_submission_id_fkey'; columns: ['submission_id']; referencedRelation: 'submissions'; referencedColumns: ['id'] }
        ]
      }
      scores: {
        Row: R<Score>
        Insert: R<Omit<Score, 'id' | 'created_at'>>
        Update: R<Partial<Score>>
        Relationships: [
          { foreignKeyName: 'scores_team_id_fkey'; columns: ['team_id']; referencedRelation: 'teams'; referencedColumns: ['id'] },
          { foreignKeyName: 'scores_event_id_fkey'; columns: ['event_id']; referencedRelation: 'events'; referencedColumns: ['id'] },
          { foreignKeyName: 'scores_mission_id_fkey'; columns: ['mission_id']; referencedRelation: 'missions'; referencedColumns: ['id'] },
          { foreignKeyName: 'scores_submission_id_fkey'; columns: ['submission_id']; referencedRelation: 'submissions'; referencedColumns: ['id'] }
        ]
      }
      badges: {
        Row: R<Badge>
        Insert: R<Omit<Badge, 'id' | 'created_at'>>
        Update: R<Partial<Badge>>
        Relationships: []
      }
      team_badges: {
        Row: R<TeamBadge>
        Insert: R<Omit<TeamBadge, 'id' | 'earned_at'>>
        Update: R<Partial<TeamBadge>>
        Relationships: [
          { foreignKeyName: 'team_badges_team_id_fkey'; columns: ['team_id']; referencedRelation: 'teams'; referencedColumns: ['id'] },
          { foreignKeyName: 'team_badges_badge_id_fkey'; columns: ['badge_id']; referencedRelation: 'badges'; referencedColumns: ['id'] }
        ]
      }
      achievements: {
        Row: R<Achievement>
        Insert: R<Omit<Achievement, 'id' | 'earned_at'>>
        Update: R<Partial<Achievement>>
        Relationships: [
          { foreignKeyName: 'achievements_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] },
          { foreignKeyName: 'achievements_badge_id_fkey'; columns: ['badge_id']; referencedRelation: 'badges'; referencedColumns: ['id'] },
          { foreignKeyName: 'achievements_event_id_fkey'; columns: ['event_id']; referencedRelation: 'events'; referencedColumns: ['id'] }
        ]
      }
      power_ups: {
        Row: R<PowerUp>
        Insert: R<Omit<PowerUp, 'id' | 'created_at'>>
        Update: R<Partial<PowerUp>>
        Relationships: [
          { foreignKeyName: 'power_ups_event_id_fkey'; columns: ['event_id']; referencedRelation: 'events'; referencedColumns: ['id'] },
          { foreignKeyName: 'power_ups_team_id_fkey'; columns: ['team_id']; referencedRelation: 'teams'; referencedColumns: ['id'] }
        ]
      }
      notifications: {
        Row: R<Notification>
        Insert: R<Omit<Notification, 'id' | 'created_at'>>
        Update: R<Partial<Notification>>
        Relationships: [
          { foreignKeyName: 'notifications_event_id_fkey'; columns: ['event_id']; referencedRelation: 'events'; referencedColumns: ['id'] },
          { foreignKeyName: 'notifications_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] },
          { foreignKeyName: 'notifications_team_id_fkey'; columns: ['team_id']; referencedRelation: 'teams'; referencedColumns: ['id'] }
        ]
      }
      boss_battles: {
        Row: R<BossBattle>
        Insert: R<Omit<BossBattle, 'id' | 'created_at'>>
        Update: R<Partial<BossBattle>>
        Relationships: [
          { foreignKeyName: 'boss_battles_event_id_fkey'; columns: ['event_id']; referencedRelation: 'events'; referencedColumns: ['id'] },
          { foreignKeyName: 'boss_battles_mission_id_fkey'; columns: ['mission_id']; referencedRelation: 'missions'; referencedColumns: ['id'] }
        ]
      }
      leaderboard_snapshots: {
        Row: R<LeaderboardSnapshot>
        Insert: R<Omit<LeaderboardSnapshot, 'id' | 'snapshot_at'>>
        Update: R<Partial<LeaderboardSnapshot>>
        Relationships: [
          { foreignKeyName: 'leaderboard_snapshots_event_id_fkey'; columns: ['event_id']; referencedRelation: 'events'; referencedColumns: ['id'] },
          { foreignKeyName: 'leaderboard_snapshots_team_id_fkey'; columns: ['team_id']; referencedRelation: 'teams'; referencedColumns: ['id'] }
        ]
      }
      audit_logs: {
        Row: R<AuditLog>
        Insert: R<Omit<AuditLog, 'id' | 'created_at'>>
        Update: R<Partial<AuditLog>>
        Relationships: [
          { foreignKeyName: 'audit_logs_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_event_leaderboard: {
        Args: Record<string, unknown> & { p_event_id: string }
        Returns: LeaderboardRow[]
      }
      calculate_team_score: {
        Args: Record<string, unknown> & { p_team_id: string; p_event_id: string }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
