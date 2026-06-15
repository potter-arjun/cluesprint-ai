import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'
import { calculateSpeedScore } from '@/lib/game/scoring'

// GET /api/submissions?eventId=<id>
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json(
        { data: null, error: 'eventId query parameter is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const user = await getUser()

    if (!user) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (user.role === 'admin') {
      // Admins see all submissions for this event with team + feedback
      const { data: missions, error: missionsError } = await supabase
        .from('missions')
        .select('id')
        .eq('event_id', eventId)

      if (missionsError) {
        return NextResponse.json(
          { data: null, error: missionsError.message },
          { status: 500 }
        )
      }

      const missionIds = (missions ?? []).map((m) => m.id)

      if (missionIds.length === 0) {
        return NextResponse.json({ data: [], error: null })
      }

      const { data: submissions, error } = await supabase
        .from('submissions')
        .select('*, teams(*), ai_feedback(*)')
        .in('mission_id', missionIds)
        .order('submitted_at', { ascending: false })

      if (error) {
        return NextResponse.json(
          { data: null, error: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ data: submissions, error: null })
    }

    // Players see only their own team's submissions
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('team_id, teams!inner(event_id)')
      .eq('user_id', user.id)
      .eq('teams.event_id', eventId)
      .maybeSingle()

    if (membershipError || !membership) {
      return NextResponse.json({ data: [], error: null })
    }

    const teamId = membership.team_id

    const { data: submissions, error } = await supabase
      .from('submissions')
      .select('*, ai_feedback(*)')
      .eq('team_id', teamId)
      .order('submitted_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { data: null, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: submissions, error: null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}

// POST /api/submissions — authenticated player
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const user = await getUser()

    if (!user) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const contentType = request.headers.get('content-type') ?? ''
    let missionId: string
    let teamId: string
    let textContent: string | null = null
    let uploadedImageUrls: string[] = []

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      missionId = formData.get('mission_id') as string
      teamId = formData.get('team_id') as string
      textContent = (formData.get('text_content') as string) ?? null

      const files = formData.getAll('images') as File[]
      if (files.length > 0) {
        const uploadPromises = files.map(async (file, idx) => {
          const ext = file.name.split('.').pop() ?? 'bin'
          const path = `${teamId}/${missionId}/${crypto.randomUUID()}-${idx}.${ext}`
          const { error: uploadError } = await supabase.storage
            .from('submissions')
            .upload(path, file, { upsert: true, contentType: file.type })
          if (uploadError) throw new Error(uploadError.message)
          const { data: urlData } = supabase.storage
            .from('submissions')
            .getPublicUrl(path)
          return urlData.publicUrl
        })
        uploadedImageUrls = await Promise.all(uploadPromises)
      }
    } else {
      const body = await request.json()
      missionId = body.mission_id
      teamId = body.team_id
      textContent = body.text_content ?? null
      uploadedImageUrls = Array.isArray(body.image_urls) ? body.image_urls : []
    }

    if (!missionId || !teamId) {
      return NextResponse.json(
        { data: null, error: 'mission_id and team_id are required' },
        { status: 400 }
      )
    }

    // Validate team membership
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (membershipError || !membership) {
      return NextResponse.json(
        { data: null, error: 'You are not a member of this team' },
        { status: 403 }
      )
    }

    // Check mission is active
    const { data: mission, error: missionError } = await supabase
      .from('missions')
      .select('*')
      .eq('id', missionId)
      .single()

    if (missionError || !mission) {
      return NextResponse.json(
        { data: null, error: 'Mission not found' },
        { status: 404 }
      )
    }

    if (mission.status !== 'active') {
      return NextResponse.json(
        { data: null, error: `Mission is not active (current status: ${mission.status})` },
        { status: 409 }
      )
    }

    // Check team hasn't already submitted
    const { data: existingSubmission } = await supabase
      .from('submissions')
      .select('id')
      .eq('mission_id', missionId)
      .eq('team_id', teamId)
      .maybeSingle()

    if (existingSubmission) {
      return NextResponse.json(
        { data: null, error: 'Your team has already submitted for this mission' },
        { status: 409 }
      )
    }

    // Calculate submission time in seconds since mission started
    const submissionTimeSecs = mission.activated_at
      ? Math.floor(
          (Date.now() - new Date(mission.activated_at as string).getTime()) / 1000
        )
      : null

    const now = new Date().toISOString()

    // Insert submission
    const { data: submission, error: insertError } = await supabase
      .from('submissions')
      .insert({
        mission_id: missionId,
        team_id: teamId,
        event_id: mission.event_id,
        user_id: user.id,
        status: 'pending',
        content: textContent,
        media_urls: uploadedImageUrls,
        score: null,
        submitted_at: now,
        reviewed_at: null,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json(
        { data: null, error: insertError.message },
        { status: 500 }
      )
    }

    // Calculate speed bonus for score record
    const speedScore = submissionTimeSecs && mission.time_limit_seconds
      ? calculateSpeedScore(submissionTimeSecs, mission.time_limit_seconds)
      : 5

    const speedBonus = Math.round((speedScore / 10) * mission.points * 0.2)

    // Insert initial score record (base points + speed bonus; AI scoring updates later)
    const { error: scoreInsertError } = await supabase
      .from('scores')
      .insert({
        event_id: mission.event_id,
        team_id: teamId,
        user_id: user.id,
        mission_id: missionId,
        submission_id: submission.id,
        base_points: mission.points,
        speed_bonus: speedBonus,
        power_up_bonus: 0,
        total_points: mission.points + speedBonus,
        reason: `Submission for mission: ${mission.title}`,
      })

    if (scoreInsertError) {
      console.error('Failed to insert score record:', scoreInsertError.message)
    }

    // Check if this is the team's first submission in the event
    const { count: previousSubmissions } = await supabase
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .eq('team_id', teamId)
      .neq('id', submission.id)

    const isFirstSubmission = (previousSubmissions ?? 0) === 0

    // Fire-and-forget AI evaluation
    const evaluateUrl = new URL('/api/ai/evaluate', request.url).toString()
    fetch(evaluateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.INTERNAL_API_SECRET ?? 'dev-internal',
      },
      body: JSON.stringify({ submission_id: submission.id }),
    }).catch((evalErr) => {
      console.error('Failed to trigger AI evaluation:', evalErr)
    })

    // Check achievements based on speed alone (AI achievements checked post-evaluation)
    const preliminaryAchievements: string[] = []
    if (isFirstSubmission) {
      preliminaryAchievements.push('first_submission')
    }
    if (
      submissionTimeSecs &&
      mission.time_limit_seconds &&
      submissionTimeSecs < mission.time_limit_seconds * 0.2
    ) {
      preliminaryAchievements.push('speed_demon')
    }

    if (preliminaryAchievements.length > 0) {
      for (const achievementType of preliminaryAchievements) {
        const { data: badge } = await supabase
          .from('badges')
          .select('id')
          .eq('condition_type', achievementType)
          .maybeSingle()

        if (badge) {
          // Upsert to avoid duplicates
          await supabase.from('achievements').upsert(
            {
              user_id: user.id,
              badge_id: badge.id,
              event_id: mission.event_id,
            },
            { onConflict: 'user_id,badge_id,event_id', ignoreDuplicates: true }
          )
        }
      }
    }

    return NextResponse.json({ data: submission, error: null }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
