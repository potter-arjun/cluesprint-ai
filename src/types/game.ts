import type {
  User,
  Team,
  TeamMember,
  Mission,
  Submission,
  AIFeedback,
  Badge,
  Event,
  Story,
  Notification,
  PowerUp,
  BossBattle,
} from './database'

// ============================================================
// Compound / Joined Types
// ============================================================

export interface TeamWithScore extends Team {
  members: (TeamMember & { user: User })[]
  badge_count: number
  missions_completed: number
  rank?: number
}

export interface LeaderboardEntry {
  team_id: string
  team_name: string
  team_color: string
  total_score: number
  missions_completed: number
  rank: number
  badges: Badge[]
  is_current_team?: boolean
}

export interface SubmissionWithFeedback extends Submission {
  ai_feedback?: AIFeedback
  team?: Team
}

export interface MissionWithDetails extends Mission {
  story?: Story
  submissions_count: number
  my_team_submitted: boolean
  my_submission?: SubmissionWithFeedback
}

export interface EventWithDetails extends Event {
  story?: Story
  teams: TeamWithScore[]
  active_mission?: MissionWithDetails
  missions: Mission[]
  player_count: number
  my_team?: TeamWithScore
}

// ============================================================
// Game Session State
// ============================================================

export interface GameState {
  event: EventWithDetails
  currentMission: MissionWithDetails | null
  leaderboard: LeaderboardEntry[]
  notifications: Notification[]
  activePowerUps: PowerUp[]
  bossBattle: BossBattle | null
}

// ============================================================
// Scoring
// ============================================================

export interface ScoreBreakdown {
  base_points: number
  speed_bonus: number
  power_up_bonus: number
  total: number
}

// ============================================================
// Player / Profile
// ============================================================

export interface PlayerStats {
  total_score: number
  missions_completed: number
  events_played: number
  achievements_count: number
  level: number
  xp: number
  badges: Badge[]
}

// ============================================================
// UI / Display Helpers
// ============================================================

export interface TeamRankChange {
  team_id: string
  previous_rank: number
  current_rank: number
  delta: number
}

export interface MissionTimer {
  mission_id: string
  started_at: string
  time_limit_seconds: number
  elapsed_seconds: number
  remaining_seconds: number
  is_expired: boolean
}

export interface PowerUpActivation {
  power_up_id: string
  type: PowerUp['type']
  activated_at: string
  expires_at: string | null
  multiplier: number | null
}

export interface BossBattleResult {
  boss_battle_id: string
  winning_team_id: string | null
  winning_team_name: string | null
  all_team_scores: Array<{
    team_id: string
    team_name: string
    score: number
    rank: number
  }>
  completed_at: string
}

export interface EventSummary {
  event_id: string
  event_name: string
  company_name: string | null
  duration_minutes: number
  total_players: number
  total_teams: number
  total_missions: number
  winner_team: TeamWithScore | null
  top_players: Array<User & { score_in_event: number }>
  leaderboard: LeaderboardEntry[]
}
