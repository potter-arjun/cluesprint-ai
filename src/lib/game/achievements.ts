import type { Submission, AIFeedback } from '@/types/database'

// ============================================================
// Achievement Type Constants
// ============================================================

export const ACHIEVEMENT_TYPES = {
  FIRST_SUBMISSION: 'first_submission',
  PERFECT_SCORE: 'perfect_score',
  SPEED_DEMON: 'speed_demon',
  CREATIVE_GENIUS: 'creative_genius',
  TEAM_PLAYER: 'team_player',
  AI_MASTER: 'ai_master',
  BOSS_SLAYER: 'boss_slayer',
  EXPLORER: 'explorer',
} as const

export type AchievementType = (typeof ACHIEVEMENT_TYPES)[keyof typeof ACHIEVEMENT_TYPES]

// ============================================================
// Achievement Metadata
// ============================================================

export const ACHIEVEMENT_DEFINITIONS: Record<
  string,
  { title: string; description: string; icon: string }
> = {
  [ACHIEVEMENT_TYPES.FIRST_SUBMISSION]: {
    title: 'First Strike',
    description: 'Submitted your very first mission. Every legend starts somewhere!',
    icon: 'flag',
  },
  [ACHIEVEMENT_TYPES.PERFECT_SCORE]: {
    title: 'Perfect 10',
    description: 'Achieved a perfect score of 60 on a single mission.',
    icon: 'star',
  },
  [ACHIEVEMENT_TYPES.SPEED_DEMON]: {
    title: 'Speed Demon',
    description: 'Submitted a mission in under 20% of the allotted time.',
    icon: 'zap',
  },
  [ACHIEVEMENT_TYPES.CREATIVE_GENIUS]: {
    title: 'Creative Genius',
    description: 'Scored 9 or higher in creativity on an AI-evaluated mission.',
    icon: 'palette',
  },
  [ACHIEVEMENT_TYPES.TEAM_PLAYER]: {
    title: 'Team Player',
    description: 'Scored 9 or higher in teamwork on a mission.',
    icon: 'users',
  },
  [ACHIEVEMENT_TYPES.AI_MASTER]: {
    title: 'AI Whisperer',
    description: 'Scored 9 or higher in accuracy on an AI-type mission.',
    icon: 'bot',
  },
  [ACHIEVEMENT_TYPES.BOSS_SLAYER]: {
    title: 'Boss Slayer',
    description: 'Successfully completed a Boss Battle mission.',
    icon: 'shield',
  },
  [ACHIEVEMENT_TYPES.EXPLORER]: {
    title: 'Explorer',
    description: 'Completed a discovery-type mission with a score of 7 or higher.',
    icon: 'camera',
  },
}

// ============================================================
// Achievement Evaluation
// ============================================================

export interface AIScores {
  accuracy: number
  creativity: number
  teamwork: number
  speed: number
  presentation: number
  fun_factor: number
  total_score: number
}

export interface CheckAchievementsParams {
  submission: Submission
  aiScores: AIScores
  isFirstSubmission: boolean
  submissionTimeSeconds: number
  timeLimitSeconds: number
  isBossBattle: boolean
  missionType: string
}

/**
 * Evaluate which achievements a player/team earned for this submission.
 * Returns an array of ACHIEVEMENT_TYPES values.
 */
export function checkForAchievements(params: CheckAchievementsParams): string[] {
  const {
    aiScores,
    isFirstSubmission,
    submissionTimeSeconds,
    timeLimitSeconds,
    isBossBattle,
    missionType,
  } = params

  const earned: string[] = []

  // First submission ever in this event
  if (isFirstSubmission) {
    earned.push(ACHIEVEMENT_TYPES.FIRST_SUBMISSION)
  }

  // Perfect score (all 6 dims totalling 60)
  if (aiScores.total_score >= 60) {
    earned.push(ACHIEVEMENT_TYPES.PERFECT_SCORE)
  }

  // Speed Demon: submitted in under 20% of the time limit
  if (timeLimitSeconds > 0 && submissionTimeSeconds < timeLimitSeconds * 0.2) {
    earned.push(ACHIEVEMENT_TYPES.SPEED_DEMON)
  }

  // Creative Genius: creativity score >= 9
  if (aiScores.creativity >= 9) {
    earned.push(ACHIEVEMENT_TYPES.CREATIVE_GENIUS)
  }

  // Team Player: teamwork score >= 9
  if (aiScores.teamwork >= 9) {
    earned.push(ACHIEVEMENT_TYPES.TEAM_PLAYER)
  }

  // AI Master: accuracy >= 9 on an AI mission
  if (missionType === 'ai' && aiScores.accuracy >= 9) {
    earned.push(ACHIEVEMENT_TYPES.AI_MASTER)
  }

  // Boss Slayer: completed a boss battle mission
  if (isBossBattle) {
    earned.push(ACHIEVEMENT_TYPES.BOSS_SLAYER)
  }

  // Explorer: discovery mission with total_score >= 42 (7 avg across 6 dims)
  if (missionType === 'discovery' && aiScores.total_score >= 42) {
    earned.push(ACHIEVEMENT_TYPES.EXPLORER)
  }

  return earned
}
