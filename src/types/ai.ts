import type { MissionType } from './database'

// ============================================================
// Story Generation
// ============================================================

export interface StoryGenerationRequest {
  eventName: string
  companyName?: string
  numberOfTeams: number
  theme?: 'missing_ai' | 'rogue_innovation' | 'future_office' | 'custom'
  customTheme?: string
}

export interface StoryGenerationResponse {
  title: string
  content: string
  theme: string
  keyElements: string[]
  missionHints: string[]
  mood: string
}

// ============================================================
// Mission Generation
// ============================================================

export interface MissionGenerationRequest {
  storyContext: string
  storyTheme: string
  missionType: MissionType
  difficulty: 'easy' | 'medium' | 'hard'
  teamCount: number
  isBossBattle?: boolean
  previousMissions?: string[]
}

export interface MissionGenerationResponse {
  title: string
  description: string
  instructions: string
  type: MissionType
  evaluationCriteria: string
  hints: string[]
  estimatedMinutes: number
  points: number
}

// ============================================================
// Hints
// ============================================================

export interface HintRequest {
  missionTitle: string
  missionDescription: string
  teamProgress?: string
  hintNumber: number
  storyContext: string
}

export interface HintResponse {
  hint: string
  encouragement: string
}

// ============================================================
// Submission Evaluation
// ============================================================

export interface SubmissionEvaluationRequest {
  missionTitle: string
  missionDescription: string
  evaluationCriteria: string
  missionType: MissionType
  teamName: string
  textContent?: string
  imageUrls?: string[]
  submissionTime?: number
  timeLimitSeconds?: number
}

export interface AIScores {
  accuracy: number
  creativity: number
  teamwork: number
  speed: number
  presentation: number
  fun_factor: number
  total: number
}

export interface SubmissionEvaluationResponse {
  scores: AIScores
  feedback: string
  narrative: string
  highlights: string[]
}

// ============================================================
// Final Narration
// ============================================================

export interface FinalNarrationRequest {
  eventName: string
  storyTitle: string
  storyContent: string
  teams: Array<{
    name: string
    finalScore: number
    rank: number
    missionsCompleted: number
    topMoments: string[]
  }>
  winnerTeam: string
  totalPlayers: number
  gameDuration: string
}

export interface FinalNarrationResponse {
  overallNarration: string
  winnerAnnouncement: string
  teamNarratives: Array<{ teamName: string; narrative: string }>
  statsHighlights: string[]
  closingLine: string
}

// ============================================================
// Generic AI Service Helpers
// ============================================================

export interface AIServiceError {
  code: string
  message: string
  retryable: boolean
}

export type AIServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: AIServiceError }

export interface AIUsageMetrics {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  model: string
  latency_ms: number
}
