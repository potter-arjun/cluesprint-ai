import { callAI, callWithRetry } from './gemini'
import type { FinalNarrationRequest, FinalNarrationResponse } from '@/types/ai'

function formatGameStats(request: FinalNarrationRequest): string {
  const totalMissions = request.teams.reduce(
    (sum, t) => sum + t.missionsCompleted,
    0
  )
  const highestScore = Math.max(...request.teams.map(t => t.finalScore))
  const avgScore = Math.round(
    request.teams.reduce((sum, t) => sum + t.finalScore, 0) /
      request.teams.length
  )
  const marginOfVictory =
    request.teams.length >= 2
      ? highestScore -
        [...request.teams].sort((a, b) => b.finalScore - a.finalScore)[1]
          .finalScore
      : 0

  return `Teams: ${request.teams.length}
Total Players: ${request.totalPlayers}
Total Missions Completed: ${totalMissions}
Winning Score: ${highestScore} points
Average Team Score: ${avgScore} points
Margin of Victory: ${marginOfVictory} points
Game Duration: ${request.gameDuration}`
}

function formatTeamSummaries(request: FinalNarrationRequest): string {
  return request.teams
    .map(
      t =>
        `- ${t.name}: Rank #${t.rank}, ${t.finalScore} pts, ${t.missionsCompleted} missions. Top moments: ${t.topMoments.join('; ')}`
    )
    .join('\n')
}

export async function generateFinalNarration(
  request: FinalNarrationRequest
): Promise<FinalNarrationResponse> {
  const systemPrompt = `You are a master storyteller creating the cinematic finale of an epic corporate adventure game. Channel the energy of the best movie endings — triumphant, emotional, and unforgettable. Every team should feel like a hero, every moment should feel legendary.

Always respond with valid JSON matching this exact structure:
{
  "overallNarration": "string — 2-3 paragraphs (separated by \\n\\n) narrating the full arc of the event, from the opening tension to the final resolution",
  "winnerAnnouncement": "string — one dramatic, cinematic sentence revealing the winning team with flair",
  "teamNarratives": [
    { "teamName": "string", "narrative": "string — 2-3 sentences personalizing this team's journey, referencing their specific moments" }
  ],
  "statsHighlights": ["array of 3-5 interesting, phrased-as-fun-facts stats from the game"],
  "closingLine": "string — a single memorable send-off line that feels like the last line of a great film"
}`

  const gameStats = formatGameStats(request)
  const teamSummaries = formatTeamSummaries(request)

  const userPrompt = `Create the epic cinematic finale narration for this corporate adventure game.

Event Name: ${request.eventName}
Story Title: ${request.storyTitle}
Story: ${request.storyContent}
Winner: ${request.winnerTeam}

Game Statistics:
${gameStats}

Team Summaries:
${teamSummaries}

Requirements:
- overallNarration should feel like the closing monologue of an adventure film — reference the story, acknowledge all teams, and bring the narrative to a satisfying conclusion (2-3 paragraphs)
- winnerAnnouncement should be theatrical and specific, naming the winner and their score with dramatic flair
- Each teamNarrative should feel personalized — reference their rank, missions, and top moments specifically. Even last-place teams should feel celebrated
- statsHighlights should be phrased as exciting facts ("An incredible X missions were completed!" not just "X missions")
- closingLine should be a lasting memory — something people quote at the office for weeks`

  return callWithRetry(async () => {
    const raw = await callAI(systemPrompt, userPrompt, { temperature: 0.88, maxTokens: 2000 })

    const parsed = JSON.parse(raw) as {
      overallNarration?: string
      winnerAnnouncement?: string
      teamNarratives?: Array<{ teamName?: string; narrative?: string }>
      statsHighlights?: unknown[]
      closingLine?: string
    }

    const rawNarratives = Array.isArray(parsed.teamNarratives)
      ? parsed.teamNarratives
      : []

    const teamNarratives = request.teams.map(team => {
      const found = rawNarratives.find(
        n => n.teamName?.toLowerCase() === team.name.toLowerCase()
      )
      return {
        teamName: team.name,
        narrative:
          found?.narrative ??
          `${team.name} brought tenacity and heart to every challenge, finishing with ${team.finalScore} points and ${team.missionsCompleted} missions completed. Their contribution made this adventure truly unforgettable.`,
      }
    })

    const totalMissions = request.teams.reduce(
      (sum, t) => sum + t.missionsCompleted,
      0
    )

    const fallbackStats = [
      `An incredible ${totalMissions} missions were conquered across all teams!`,
      `${request.totalPlayers} adventurers united to make this event legendary.`,
      `The winning team, ${request.winnerTeam}, outscored their rivals in a battle for the ages.`,
    ]

    return {
      overallNarration:
        parsed.overallNarration ??
        `The adventure of ${request.eventName} has reached its legendary conclusion.\n\nEvery team played their part in an unforgettable story. From the first clue to the final submission, the spirit of collaboration and creativity defined this day.\n\nAnd now, as the dust settles on this epic chapter, one truth remains: you were all heroes today.`,
      winnerAnnouncement:
        parsed.winnerAnnouncement ??
        `With an extraordinary performance that will echo through the halls of legend, ${request.winnerTeam} claims the championship!`,
      teamNarratives,
      statsHighlights: Array.isArray(parsed.statsHighlights)
        ? (parsed.statsHighlights as string[])
        : fallbackStats,
      closingLine:
        parsed.closingLine ??
        'The adventure ends — but the legend of what you built together today lasts forever.',
    } satisfies FinalNarrationResponse
  })
}
