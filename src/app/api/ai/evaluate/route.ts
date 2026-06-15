import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'
import { evaluateSubmission } from '@/lib/ai/submission-evaluator'
import { checkForAchievements } from '@/lib/game/achievements'
import type { Submission } from '@/types/database'

// ---------------------------------------------------------------------------
// Local query-result interfaces (Supabase joined queries return untyped rows)
// ---------------------------------------------------------------------------

interface SubmissionRow {
  id: string
  mission_id: string
  team_id: string
  user_id: string
  content: string | null
  media_urls: string[]
  status: string
  submitted_at: string
  reviewed_at: string | null
  submission_time_seconds: number | null
  created_at: string
  missions: {
    title: string
    description: string
    evaluation_criteria: string | null
    type: string
    time_limit_seconds: number | null
    event_id: string
    is_boss_battle: boolean
  } | null
  teams: { name: string } | null
}

interface ScoreRow {
  id: string
  speed_bonus: number
  power_up_bonus: number
  total_points: number
}

// POST /api/ai/evaluate — called internally after submission
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Allow both authenticated user calls and internal server-to-server calls.
    // Internal calls include a service header or anonymous session is fine because
    // this endpoint processes data from already-validated submission records.
    const user = await getUser()
    if (!user) {
      const internalSecret = request.headers.get('x-internal-secret')
      const expectedSecret = process.env.INTERNAL_API_SECRET ?? 'dev-internal'
      if (internalSecret !== expectedSecret) {
        return NextResponse.json(
          { data: null, error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    const body = await request.json()
    const { submission_id } = body

    if (!submission_id) {
      return NextResponse.json(
        { data: null, error: 'submission_id is required' },
        { status: 400 }
      )
    }

    // Fetch submission with mission details
    const { data: submission, error: fetchError } = (await supabase
      .from('submissions')
      .select('*, missions(*), teams(name)')
      .eq('id', submission_id)
      .single()) as unknown as { data: SubmissionRow | null; error: unknown }

    if (fetchError || !submission) {
      return NextResponse.json(
        { data: null, error: 'Submission not found' },
        { status: 404 }
      )
    }

    const mission = submission.missions

    if (!mission) {
      return NextResponse.json(
        { data: null, error: 'Associated mission not found' },
        { status: 404 }
      )
    }

    const teamName = submission.teams?.name ?? 'Unknown Team'

    // Build evaluation request
    const evalResult = await evaluateSubmission({
      missionTitle: mission.title,
      missionDescription: mission.description,
      evaluationCriteria: mission.evaluation_criteria ?? '',
      missionType: mission.type as 'discovery' | 'creative' | 'puzzle' | 'ai',
      teamName,
      textContent: submission.content ?? undefined,
      imageUrls: submission.media_urls ?? [],
      submissionTime: undefined,
      timeLimitSeconds: mission.time_limit_seconds ?? undefined,
    })

    const now = new Date().toISOString()

    // Upsert AI feedback record
    const { data: feedback, error: feedbackError } = await supabase
      .from('ai_feedback')
      .upsert(
        {
          submission_id,
          accuracy: evalResult.scores.accuracy,
          creativity: evalResult.scores.creativity,
          teamwork: evalResult.scores.teamwork,
          speed: evalResult.scores.speed,
          presentation: evalResult.scores.presentation,
          fun_factor: evalResult.scores.fun_factor,
          total_score: evalResult.scores.total,
          feedback: evalResult.feedback,
          narrative: evalResult.narrative,
          highlights: evalResult.highlights,
        },
        { onConflict: 'submission_id' }
      )
      .select()
      .single()

    if (feedbackError) {
      return NextResponse.json(
        { data: null, error: feedbackError.message },
        { status: 500 }
      )
    }

    // Update submission with score and feedback_id
    await supabase
      .from('submissions')
      .update({
        score: evalResult.scores.total,
        feedback_id: feedback.id,
        status: 'approved',
        reviewed_at: now,
        updated_at: now,
      } as any)
      .eq('id', submission_id)

    // Update scores table — recalculate total_points with AI score
    const { data: scoreRecord } = (await supabase
      .from('scores')
      .select('id, speed_bonus, power_up_bonus')
      .eq('submission_id', submission_id)
      .maybeSingle()) as unknown as { data: ScoreRow | null }

    if (scoreRecord) {
      const totalPoints =
        evalResult.scores.total +
        (scoreRecord.speed_bonus ?? 0) +
        (scoreRecord.power_up_bonus ?? 0)

      await supabase
        .from('scores')
        .update({ total_points: totalPoints, base_points: evalResult.scores.total } as any)
        .eq('id', scoreRecord.id)
    }

    // Recalculate and update team.total_score
    const { data: teamScores } = await supabase
      .from('scores')
      .select('total_points')
      .eq('team_id', submission.team_id)

    if (teamScores) {
      const aggregateScore = teamScores.reduce(
        (sum, s) => sum + ((s as unknown as ScoreRow).total_points ?? 0),
        0
      )

      const { data: currentTeam } = await supabase
        .from('teams')
        .select('missions_completed')
        .eq('id', submission.team_id)
        .single()

      await supabase
        .from('teams')
        .update({
          total_score: aggregateScore,
          missions_completed: (currentTeam?.missions_completed ?? 0) + 1,
          updated_at: now,
        })
        .eq('id', submission.team_id)
    }

    // Check and unlock achievements based on AI scores
    const { count: previousSubmissions } = await supabase
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .eq('team_id', submission.team_id)
      .eq('status', 'approved')
      .neq('id', submission_id)

    const earnedTypes = checkForAchievements({
      submission: {
        id: submission.id,
        mission_id: submission.mission_id,
        team_id: submission.team_id,
        content: submission.content,
        media_urls: submission.media_urls ?? [],
        status: 'approved',
        override_notes: null,
        override_score: null,
        submitted_at: submission.submitted_at,
        reviewed_at: now,
      } as Submission,
      aiScores: {
        accuracy: evalResult.scores.accuracy,
        creativity: evalResult.scores.creativity,
        teamwork: evalResult.scores.teamwork,
        speed: evalResult.scores.speed,
        presentation: evalResult.scores.presentation,
        fun_factor: evalResult.scores.fun_factor,
        total_score: evalResult.scores.total,
      },
      isFirstSubmission: (previousSubmissions ?? 0) === 0,
      submissionTimeSeconds: submission.submission_time_seconds ?? 0,
      timeLimitSeconds: mission.time_limit_seconds ?? 0,
      isBossBattle: mission.is_boss_battle,
      missionType: mission.type,
    })

    // Upsert earned achievements for submitting user
    for (const achievementType of earnedTypes) {
      const { data: badge } = await supabase
        .from('badges')
        .select('id')
        .eq('condition_type', achievementType)
        .maybeSingle()

      if (badge) {
        await supabase.from('achievements').upsert(
          {
            user_id: submission.user_id,
            badge_id: badge.id,
            event_id: mission.event_id,
          } as any,
          { onConflict: 'user_id,badge_id,event_id', ignoreDuplicates: true }
        )

        // Also notify the team
        await supabase.from('notifications').insert({
          user_id: submission.user_id,
          team_id: submission.team_id,
          event_id: mission.event_id,
          type: 'achievement_unlocked',
          title: 'Achievement Unlocked!',
          message: `You unlocked: ${achievementType.replace(/_/g, ' ')}`,
          metadata: { badge_id: badge.id, achievement_type: achievementType },
          is_read: false,
        } as any)
      }
    }

    return NextResponse.json({ data: feedback, error: null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
