import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'

interface RouteParams {
  params: Promise<{ submissionId: string }>
}

// GET /api/submissions/[submissionId]
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { submissionId } = await params
    const supabase = await createClient()
    const user = await getUser()

    if (!user) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: submission, error } = await supabase
      .from('submissions')
      .select('*, ai_feedback(*), teams(*), missions(*)')
      .eq('id', submissionId)
      .single()

    if (error || !submission) {
      return NextResponse.json(
        { data: null, error: 'Submission not found' },
        { status: 404 }
      )
    }

    // Players can only view their own team's submissions
    if (user.role !== 'admin' && submission.user_id !== user.id) {
      // Check if user is in same team
      const { data: membership } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('team_id', submission.team_id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (!membership) {
        return NextResponse.json(
          { data: null, error: 'Forbidden' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({ data: submission, error: null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}

// PATCH /api/submissions/[submissionId] — admin score override
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { submissionId } = await params
    const supabase = await createClient()
    const user = await getUser()

    if (!user) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { data: null, error: 'Forbidden: admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      status,
      score_override,
      accuracy,
      creativity,
      teamwork,
      speed,
      presentation,
      fun_factor,
      feedback,
      narrative,
    } = body

    // Fetch existing submission with feedback
    const { data: submission, error: fetchError } = await supabase
      .from('submissions')
      .select('*, ai_feedback(*), missions(event_id, title)')
      .eq('id', submissionId)
      .single()

    if (fetchError || !submission) {
      return NextResponse.json(
        { data: null, error: 'Submission not found' },
        { status: 404 }
      )
    }

    const now = new Date().toISOString()

    // Compute new total if AI feedback scores are provided
    let newTotal: number | null = null
    if (
      accuracy !== undefined &&
      creativity !== undefined &&
      teamwork !== undefined &&
      speed !== undefined &&
      presentation !== undefined &&
      fun_factor !== undefined
    ) {
      newTotal =
        Number(accuracy) +
        Number(creativity) +
        Number(teamwork) +
        Number(speed) +
        Number(presentation) +
        Number(fun_factor)
    }

    const finalScore = score_override !== undefined ? Number(score_override) : (newTotal ?? submission.score)

    // Update AI feedback if exists and new scores provided
    if (submission.feedback_id && newTotal !== null) {
      const feedbackUpdate: Record<string, unknown> = {}
      if (accuracy !== undefined) feedbackUpdate.accuracy = Number(accuracy)
      if (creativity !== undefined) feedbackUpdate.creativity = Number(creativity)
      if (teamwork !== undefined) feedbackUpdate.teamwork = Number(teamwork)
      if (speed !== undefined) feedbackUpdate.speed = Number(speed)
      if (presentation !== undefined) feedbackUpdate.presentation = Number(presentation)
      if (fun_factor !== undefined) feedbackUpdate.fun_factor = Number(fun_factor)
      if (newTotal !== null) feedbackUpdate.total_score = newTotal
      if (feedback !== undefined) feedbackUpdate.feedback = feedback
      if (narrative !== undefined) feedbackUpdate.narrative = narrative

      await supabase
        .from('ai_feedback')
        .update(feedbackUpdate)
        .eq('id', submission.feedback_id)
    }

    // Update submission record
    const submissionUpdate: Record<string, unknown> = {
      updated_at: now,
      reviewed_at: now,
    }
    if (status !== undefined) submissionUpdate.status = status
    if (finalScore !== null) submissionUpdate.score = finalScore

    const { data: updated, error: updateError } = await supabase
      .from('submissions')
      .update(submissionUpdate)
      .eq('id', submissionId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { data: null, error: updateError.message },
        { status: 500 }
      )
    }

    // Recompute scores table entry
    if (finalScore !== null) {
      const { data: existingScore } = await supabase
        .from('scores')
        .select('id, base_points, speed_bonus, power_up_bonus')
        .eq('submission_id', submissionId)
        .maybeSingle()

      if (existingScore) {
        await supabase
          .from('scores')
          .update({ total_points: finalScore })
          .eq('id', existingScore.id)
      }

      // Update team aggregate score
      const { data: teamScores } = await supabase
        .from('scores')
        .select('total_points')
        .eq('team_id', submission.team_id)

      if (teamScores) {
        const aggregateScore = teamScores.reduce(
          (sum, s) => sum + s.total_points,
          0
        )
        await supabase
          .from('teams')
          .update({ total_score: aggregateScore, updated_at: now })
          .eq('id', submission.team_id)
      }
    }

    return NextResponse.json({ data: updated, error: null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
