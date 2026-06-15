export const SCORE_WEIGHTS = {
  ACCURACY: 1.5,
  CREATIVITY: 1.5,
  TEAMWORK: 1.0,
  SPEED: 0.8,
  PRESENTATION: 1.2,
  FUN_FACTOR: 1.0,
} as const

export interface RawScores {
  accuracy: number
  creativity: number
  teamwork: number
  speed: number
  presentation: number
  fun_factor: number
}

/**
 * Sum all dimension scores. Each dimension is rated 0–10.
 * Max total = 10 * 6 = 60.
 */
export function calculateTotalScore(scores: RawScores): number {
  return (
    scores.accuracy +
    scores.creativity +
    scores.teamwork +
    scores.speed +
    scores.presentation +
    scores.fun_factor
  )
}

/**
 * Calculate a speed sub-score (0–10) based on how quickly the team submitted
 * relative to the mission time limit.
 */
export function calculateSpeedScore(
  submissionTimeSeconds: number,
  timeLimitSeconds: number
): number {
  if (timeLimitSeconds <= 0) return 5
  const ratio = submissionTimeSeconds / timeLimitSeconds
  if (ratio < 0.2) return 10
  if (ratio < 0.4) return 8
  if (ratio < 0.6) return 6
  if (ratio < 0.8) return 4
  if (ratio < 1.0) return 2
  return 0
}

/**
 * Apply a power-up multiplier/bonus to a score.
 */
export function applyPowerUpBonus(score: number, powerUpType: string | null): number {
  if (!powerUpType) return score
  switch (powerUpType) {
    case 'double_points':
      return score * 2
    case 'mystery_bonus':
      return score + Math.floor(score * 0.25)
    default:
      return score
  }
}

/**
 * Scale a raw score (max 60) to the 50–100 range used for boss battles.
 */
export function calculateBossBattleScore(rawScore: number): number {
  return 50 + Math.round((rawScore / 60) * 50)
}

/**
 * Convert a final mission score into XP.
 * Boss battles award extra XP for the higher-stakes challenge.
 */
export function calculateXPFromScore(score: number, isBossBattle: boolean): number {
  const base = score * 10
  const bonus = isBossBattle ? Math.round(score * 5) : 0
  return base + bonus
}
