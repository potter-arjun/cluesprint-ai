import { callAI, callWithRetry } from './gemini'
import type { HintRequest, HintResponse } from '@/types/ai'

const HINT_LEVEL_INSTRUCTIONS: Record<
  number,
  { specificity: string; example: string }
> = {
  1: {
    specificity:
      'vague and thematic — poetic, story-flavored, gives a general direction without referencing the mission directly',
    example:
      '"The answer lies where light meets shadow, where the past and present converge in your daily workspace."',
  },
  2: {
    specificity:
      'moderately specific — references the mission type or general area, still leaves discovery to the team',
    example:
      '"Focus your attention on the tools your team uses every morning. Something there holds the key."',
  },
  3: {
    specificity:
      'very specific — nearly tells the team exactly what to do or where to look, only one short leap from the answer',
    example:
      '"Walk to the break room and look at the bulletin board above the coffee machine. Your answer is pinned there."',
  },
}

export async function generateHint(request: HintRequest): Promise<HintResponse> {
  const hintLevel = Math.min(Math.max(1, request.hintNumber), 3)
  const levelInstruction = HINT_LEVEL_INSTRUCTIONS[hintLevel]

  const systemPrompt = `You are the AI Game Master of an immersive corporate adventure game. You speak in a theatrical, encouraging style — part wizard, part coach, always in character. When teams ask for hints, you guide them without robbing them of the thrill of discovery.

Always respond with valid JSON matching this exact structure:
{
  "hint": "string — the hint itself, in Game Master voice, staying in character",
  "encouragement": "string — a single energizing line to motivate the team to keep going"
}`

  const progressContext = request.teamProgress
    ? `\nThe team has shared this progress so far: "${request.teamProgress}"`
    : ''

  const userPrompt = `A team is stuck on a mission and needs Hint #${hintLevel}.

Story Context: ${request.storyContext}
Mission Title: ${request.missionTitle}
Mission Description: ${request.missionDescription}${progressContext}

Hint Level ${hintLevel} of 3 — be ${levelInstruction.specificity}.
Example style: ${levelInstruction.example}

The hint must:
- Stay fully in character as the dramatic Game Master
- Reference the story context naturally without breaking immersion
- Be exactly at the specificity level described for hint #${hintLevel}
- Not exceed 3 sentences
- The encouragement line should be punchy and team-spirit focused (1 sentence)`

  return callWithRetry(async () => {
    const raw = await callAI(systemPrompt, userPrompt, { temperature: 0.8, maxTokens: 300 })

    const parsed = JSON.parse(raw) as {
      hint?: string
      encouragement?: string
    }

    const fallbackHints: Record<number, string> = {
      1: 'The path forward is closer than you think — look with fresh eyes at what surrounds you.',
      2: 'Your mission and the story are intertwined. Let the narrative guide your feet.',
      3: 'You are nearly there. Trust the clues already in your hands and take the next logical step.',
    }

    return {
      hint: parsed.hint ?? fallbackHints[hintLevel],
      encouragement:
        parsed.encouragement ??
        "You've got this — the adventure favors the bold!",
    } satisfies HintResponse
  })
}
