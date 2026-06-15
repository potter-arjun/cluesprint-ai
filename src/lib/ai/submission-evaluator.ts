import { callAI, callAIWithImages, callWithRetry } from './gemini'
import type {
  SubmissionEvaluationRequest,
  SubmissionEvaluationResponse,
  AIScores,
} from '@/types/ai'

function calculateSpeedScore(
  submissionTime?: number,
  timeLimitSeconds?: number
): number {
  if (!submissionTime || !timeLimitSeconds || timeLimitSeconds <= 0) {
    return 5
  }
  const ratio = submissionTime / timeLimitSeconds
  if (ratio <= 0.25) return 10
  if (ratio <= 0.4) return 9
  if (ratio <= 0.55) return 8
  if (ratio <= 0.65) return 7
  if (ratio <= 0.75) return 6
  if (ratio <= 0.85) return 5
  if (ratio <= 0.95) return 4
  return 2
}

export async function evaluateSubmission(
  request: SubmissionEvaluationRequest
): Promise<SubmissionEvaluationResponse> {
  const speedScore = calculateSpeedScore(
    request.submissionTime,
    request.timeLimitSeconds
  )

  const systemPrompt = `You are an enthusiastic AI Game Master evaluating team submissions for a corporate adventure game. Be encouraging, specific, and entertaining in your feedback. Score each dimension 0-10 and provide fun narrative feedback that makes teams feel celebrated even if they didn't score perfectly.

Always respond with valid JSON matching this exact structure:
{
  "scores": {
    "accuracy": number (0-10),
    "creativity": number (0-10),
    "teamwork": number (0-10),
    "speed": number (0-10),
    "presentation": number (0-10),
    "fun_factor": number (0-10),
    "total": number (sum of all 6 scores, max 60)
  },
  "feedback": "string — 2-3 encouraging, specific sentences about the submission quality",
  "narrative": "string — 1 cinematic sentence describing this team's moment in the adventure",
  "highlights": ["array of 2-4 specific things this team did well"]
}

Scoring guide:
- accuracy (0-10): How well the submission meets the mission brief and evaluation criteria
- creativity (0-10): Originality, imagination, unexpected approaches
- teamwork (0-10): Evidence that multiple team members contributed and collaborated
- speed (0-10): Already calculated — use EXACTLY the value provided
- presentation (0-10): Quality, effort, clarity, and polish of the submission
- fun_factor (0-10): Entertainment value, humor, enthusiasm shown in the submission`

  const hasImages =
    Array.isArray(request.imageUrls) && request.imageUrls.length > 0
  const hasText =
    typeof request.textContent === 'string' && request.textContent.trim().length > 0

  const contextBlock = `Mission: ${request.missionTitle}
Team: ${request.teamName}
Mission Type: ${request.missionType}
Mission Description: ${request.missionDescription}
Evaluation Criteria: ${request.evaluationCriteria}
Speed Score (pre-calculated, use exactly): ${speedScore}/10`

  const submissionBlock = hasText
    ? `\n\nTeam's Text Submission:\n"${request.textContent}"`
    : ''

  const instructionBlock = `\n\nEvaluate this submission and provide scores for all 6 criteria. Remember to use speed = ${speedScore} exactly as provided.`

  const userPrompt = `${contextBlock}${submissionBlock}${
    hasImages ? `\n\nThe team submitted ${request.imageUrls!.length} image(s) — see attached.` : ''
  }${instructionBlock}`

  return callWithRetry(async () => {
    const raw = hasImages
      ? await callAIWithImages(systemPrompt, userPrompt, request.imageUrls as string[], { temperature: 0.7, maxTokens: 800 })
      : await callAI(systemPrompt, userPrompt, { temperature: 0.7, maxTokens: 800 })

    return parseEvaluationResponse(raw, speedScore)
  })
}

function parseEvaluationResponse(
  raw: string | null | undefined,
  speedScore: number
): SubmissionEvaluationResponse {
  if (!raw) {
    throw new Error('Gemini returned an empty response for submission evaluation.')
  }

  const parsed = JSON.parse(raw) as {
    scores?: {
      accuracy?: number
      creativity?: number
      teamwork?: number
      speed?: number
      presentation?: number
      fun_factor?: number
      total?: number
    }
    feedback?: string
    narrative?: string
    highlights?: unknown[]
  }

  const accuracy = clamp(parsed.scores?.accuracy ?? 5)
  const creativity = clamp(parsed.scores?.creativity ?? 5)
  const teamwork = clamp(parsed.scores?.teamwork ?? 5)
  const speed = speedScore
  const presentation = clamp(parsed.scores?.presentation ?? 5)
  const fun_factor = clamp(parsed.scores?.fun_factor ?? 5)
  const total = accuracy + creativity + teamwork + speed + presentation + fun_factor

  const scores: AIScores = {
    accuracy,
    creativity,
    teamwork,
    speed,
    presentation,
    fun_factor,
    total,
  }

  return {
    scores,
    feedback:
      parsed.feedback ??
      'Outstanding interpretation! The team found a truly innovative representation. The creativity shown here is exactly what this mission called for.',
    narrative: parsed.narrative ?? 'And so the team carved their legend into the annals of the adventure.',
    highlights: Array.isArray(parsed.highlights)
      ? (parsed.highlights as string[])
      : ['Submission received', 'Mission attempted'],
  }
}

function clamp(value: number, min = 0, max = 10): number {
  return Math.max(min, Math.min(max, Math.round(value)))
}
