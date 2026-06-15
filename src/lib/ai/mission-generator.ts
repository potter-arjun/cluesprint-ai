import { callAI, callWithRetry } from './gemini'
import type {
  MissionGenerationRequest,
  MissionGenerationResponse,
} from '@/types/ai'
import type { MissionType } from '@/types/database'

const MISSION_TYPE_CONSTRAINTS: Record<
  MissionType,
  { submissionFormat: string; challengeDescription: string }
> = {
  discovery: {
    submissionFormat: 'photo submission — teams photograph a found physical item or location',
    challengeDescription:
      'Teams must physically explore the office to find a specific item, location, or arrangement. The challenge should require observation and teamwork to locate something hiding in plain sight.',
  },
  creative: {
    submissionFormat: 'photo or short video submission — teams capture their performance or creation',
    challengeDescription:
      'Teams must create something original or perform a challenge together. This could be a group pose, a miniature scene, a drawn diagram, a short skit, or an improvised presentation.',
  },
  puzzle: {
    submissionFormat: 'text answer submission — teams type their solved answer',
    challengeDescription:
      'Teams must solve a riddle, logic puzzle, word puzzle, or cipher. The answer should be a specific word, phrase, or number that can be verified objectively.',
  },
  ai: {
    submissionFormat: 'text submission — teams paste or describe their AI-assisted result',
    challengeDescription:
      'Teams must use an AI tool (ChatGPT, image generators, AI writing tools) to accomplish a creative or analytical task. The challenge should be fun, verifiable, and push teams to explore AI capabilities.',
  },
}

const DIFFICULTY_MODIFIERS = {
  easy: { pointRange: '20-35', timeRange: '5-10', complexity: 'straightforward and accessible' },
  medium: { pointRange: '35-60', timeRange: '10-18', complexity: 'moderately challenging with a creative twist' },
  hard: { pointRange: '60-90', timeRange: '15-25', complexity: 'complex and multi-step, requiring real teamwork' },
}

export async function generateMission(
  request: MissionGenerationRequest
): Promise<MissionGenerationResponse> {
  const typeConstraints = MISSION_TYPE_CONSTRAINTS[request.missionType]
  const difficultyMods = DIFFICULTY_MODIFIERS[request.difficulty]
  const isBoss = request.isBossBattle ?? false

  const systemPrompt = `You are an AI Game Master designing exciting team missions for a corporate adventure game. Each mission should feel alive, thematic, and perfectly calibrated for office environments.

Always respond with valid JSON matching this exact structure:
{
  "title": "string — punchy mission title (max 8 words)",
  "description": "string — 2-3 sentence immersive mission brief written in Game Master voice",
  "instructions": "string — clear step-by-step instructions for the team (2-4 sentences)",
  "type": "string — must be exactly: ${request.missionType}",
  "evaluationCriteria": "string — what makes a great submission for this mission (1-2 sentences)",
  "hints": ["array of exactly 3 hints, each progressively more specific"],
  "estimatedMinutes": number,
  "points": number
}`

  const previousContext =
    request.previousMissions && request.previousMissions.length > 0
      ? `\nAvoid repeating these previous mission concepts: ${request.previousMissions.join(', ')}`
      : ''

  const bossContext = isBoss
    ? `\nThis is an EPIC BOSS BATTLE mission — the climactic challenge that decides final rankings. Make it dramatic, exciting, and worth 50-100 points. It should require all team members and feel like a grand finale. The time limit should be 15-20 minutes.`
    : ''

  const userPrompt = `Create a ${request.difficulty} difficulty ${request.missionType.toUpperCase()} mission for a corporate adventure game.

Story Context: ${request.storyContext}
Story Theme: ${request.storyTheme}
Number of Teams: ${request.teamCount}
Mission Type: ${request.missionType}
Difficulty: ${request.difficulty} — make it ${difficultyMods.complexity}
Challenge Type: ${typeConstraints.challengeDescription}
Submission Format: ${typeConstraints.submissionFormat}
Point Range: ${isBoss ? '50-100' : difficultyMods.pointRange} points
Estimated Time: ${isBoss ? '15-20' : difficultyMods.timeRange} minutes${previousContext}${bossContext}

Ensure the mission:
- Ties directly into the story theme and context
- Can realistically be done inside or immediately around an office building
- Is inclusive and accessible for all fitness/ability levels
- Has exactly 3 hints (vague → specific → near-giveaway)`

  return callWithRetry(async () => {
    const raw = await callAI(systemPrompt, userPrompt, { temperature: 0.9, maxTokens: 800 })

    const parsed = JSON.parse(raw) as {
      title?: string
      description?: string
      instructions?: string
      type?: string
      evaluationCriteria?: string
      hints?: unknown[]
      estimatedMinutes?: number
      points?: number
    }

    const pointFallback = isBoss ? 75 : parseInt(difficultyMods.pointRange.split('-')[0], 10)
    const timeFallback = parseInt(difficultyMods.timeRange.split('-')[0], 10)

    return {
      title: parsed.title ?? 'Mystery Mission',
      description: parsed.description ?? '',
      instructions: parsed.instructions ?? '',
      type: request.missionType,
      evaluationCriteria: parsed.evaluationCriteria ?? '',
      hints: Array.isArray(parsed.hints) ? (parsed.hints as string[]) : [],
      estimatedMinutes:
        typeof parsed.estimatedMinutes === 'number'
          ? parsed.estimatedMinutes
          : timeFallback,
      points:
        typeof parsed.points === 'number' ? parsed.points : pointFallback,
    } satisfies MissionGenerationResponse
  })
}

export async function generateMissionSet(
  storyContext: string,
  storyTheme: string,
  count: number,
  teamCount: number
): Promise<MissionGenerationResponse[]> {
  const blueprint: Array<{ type: MissionType; difficulty: 'easy' | 'medium' | 'hard' }> = [
    { type: 'discovery', difficulty: 'easy' },
    { type: 'creative', difficulty: 'easy' },
    { type: 'puzzle', difficulty: 'medium' },
    { type: 'discovery', difficulty: 'medium' },
    { type: 'creative', difficulty: 'hard' },
    { type: 'ai', difficulty: 'hard' },
  ]

  const pattern: Array<{ type: MissionType; difficulty: 'easy' | 'medium' | 'hard' }> = []
  for (let i = 0; i < count; i++) {
    pattern.push(blueprint[i % blueprint.length])
  }

  const completedTitles: string[] = []

  const results = await Promise.all(
    pattern.map(async (spec, index) => {
      const request: MissionGenerationRequest = {
        storyContext,
        storyTheme,
        missionType: spec.type,
        difficulty: spec.difficulty,
        teamCount,
        isBossBattle: index === count - 1 && count > 3,
        previousMissions: [...completedTitles],
      }

      const mission = await generateMission(request)
      completedTitles.push(mission.title)
      return mission
    })
  )

  return results
}
