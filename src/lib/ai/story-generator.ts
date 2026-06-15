import { callAI, callWithRetry } from './gemini'
import type { StoryGenerationRequest, StoryGenerationResponse } from '@/types/ai'

const STORY_THEMES: Record<string, { name: string; premise: string }> = {
  missing_ai: {
    name: 'The Missing AI',
    premise:
      'The office AI system has mysteriously vanished, taking critical company data with it. Teams must follow the digital breadcrumbs left behind, uncovering a trail of clues scattered across the office to restore order before a catastrophic system failure occurs.',
  },
  rogue_innovation: {
    name: 'Rogue Innovation',
    premise:
      'A rogue prototype AI has been secretly running experiments throughout the building, reprogramming office devices and hiding evidence of its agenda. Teams must outsmart the rogue AI by solving its puzzles and disabling its network before it rewrites the company\'s future.',
  },
  future_office: {
    name: 'Office of the Future',
    premise:
      'A time anomaly has transported everyone to the Office of 2075, where AI assistants are everywhere but something has gone terribly wrong with the timeline. Teams must work together to restore the correct future by uncovering artifacts and solving temporal mysteries hidden around the building.',
  },
}

export async function generateStory(
  request: StoryGenerationRequest
): Promise<StoryGenerationResponse> {
  const theme =
    request.theme && request.theme !== 'custom'
      ? STORY_THEMES[request.theme]
      : null

  const themeContext = theme
    ? `Theme: "${theme.name}" — ${theme.premise}`
    : request.customTheme
    ? `Custom Theme: ${request.customTheme}`
    : `Theme: Choose an exciting corporate AI adventure theme.`

  const systemPrompt = `You are an AI Game Master creating immersive corporate adventure stories for team-building events. Your stories should be exciting, professional, inclusive, and set up the perfect adventure for office teams.

Always respond with valid JSON matching this exact structure:
{
  "title": "string — compelling story title",
  "content": "string — exactly 3 paragraphs (150-200 words total) separated by \\n\\n",
  "theme": "string — the theme name",
  "keyElements": ["array of 5-8 specific narrative elements teams will encounter"],
  "missionHints": ["array of 3-5 subtle hints about upcoming mission types"],
  "mood": "string — one word describing the emotional tone (e.g. thrilling, mysterious, comedic, epic)"
}`

  const userPrompt = `Create a compelling adventure story for a corporate team-building game with these details:

Event Name: ${request.eventName}
Company Name: ${request.companyName ?? 'the company'}
Number of Teams: ${request.numberOfTeams}
${themeContext}

Requirements:
- The story must be exactly 3 paragraphs, 150-200 words total
- Set the scene vividly in a recognizable office environment
- Reference the number of teams as rival groups working toward the same goal
- Include 5-8 keyElements (specific items, places, or concepts teams will encounter)
- Include 3-5 missionHints that foreshadow the types of challenges ahead without revealing specifics
- The mood should match the theme and feel cinematic`

  return callWithRetry(async () => {
    const raw = await callAI(systemPrompt, userPrompt, { temperature: 0.85, maxTokens: 1024 })

    const parsed = JSON.parse(raw) as {
      title?: string
      content?: string
      theme?: string
      keyElements?: unknown[]
      missionHints?: unknown[]
      mood?: string
    }

    return {
      title: parsed.title ?? `${request.eventName} — The Adventure Begins`,
      content: parsed.content ?? '',
      theme:
        parsed.theme ??
        (theme ? theme.name : request.customTheme ?? 'Corporate Adventure'),
      keyElements: Array.isArray(parsed.keyElements)
        ? (parsed.keyElements as string[])
        : [],
      missionHints: Array.isArray(parsed.missionHints)
        ? (parsed.missionHints as string[])
        : [],
      mood: parsed.mood ?? 'thrilling',
    } satisfies StoryGenerationResponse
  })
}
