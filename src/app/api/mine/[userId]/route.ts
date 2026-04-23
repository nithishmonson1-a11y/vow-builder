import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { resolveUserFromRequest } from '@/lib/utils'
import { PHASE_ORDER, PhaseName } from '@/lib/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  const callerUserId = resolveUserFromRequest(request)
  if (!callerUserId || callerUserId !== params.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: couple } = await supabaseAdmin
    .from('couples')
    .select('id')
    .limit(1)
    .single()

  if (!couple) return NextResponse.json({ error: 'No couple found' }, { status: 404 })

  const { data: answers, error } = await supabaseAdmin
    .from('answers')
    .select('*')
    .eq('couple_id', couple.id)
    .eq('user_id', params.userId)
    .order('phase')
    .order('question_number')

  if (error) return NextResponse.json({ error: 'Failed to load answers' }, { status: 500 })

  // Group by phase in canonical order
  const grouped: Record<string, typeof answers> = {}
  for (const phase of PHASE_ORDER) {
    const phaseAnswers = (answers || []).filter((a) => a.phase === phase)
    if (phaseAnswers.length > 0) {
      grouped[phase] = phaseAnswers
    }
  }

  return NextResponse.json({ grouped, all: answers || [] })
}
