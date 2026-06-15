import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'

// GET /api/achievements?userId=<id>  (userId defaults to current user)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryUserId = searchParams.get('userId')

    const supabase = await createClient()
    const user = await getUser()

    if (!user) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Non-admins can only view their own achievements
    const targetUserId = queryUserId ?? user.id
    if (targetUserId !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { data: null, error: 'Forbidden: cannot view another user\'s achievements' },
        { status: 403 }
      )
    }

    const { data: achievements, error } = await supabase
      .from('achievements')
      .select('*, badges(*), events(name)')
      .eq('user_id', targetUserId)
      .order('earned_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { data: null, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: achievements, error: null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
