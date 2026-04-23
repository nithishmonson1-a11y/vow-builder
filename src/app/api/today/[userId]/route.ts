import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { resolveUserFromRequest } from '@/lib/utils'
import { generateContentForPhase } from '@/lib/generation'
import { PhaseName, QuestionsContent, PHASE_QUESTION_COUNTS } from '@/lib/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  const callerUserId = resolveUserFromRequest(request)
  if (!callerUserId || callerUserId !== params.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = params.userId as 'a' | 'b'

  const { data: couple, error: coupleError } = await supabaseAdmin
    .from('couples')
    .select('*')
    .limit(1)
    .single()

  if (coupleError || !couple) {
    return NextResponse.json({ error: 'No couple found' }, { status: 404 })
  }

  const phase = couple.current_phase as PhaseName

  if (phase === 'not_started') {
    return NextResponse.json({ phase, questions: null, answers: [] })
  }

  if (phase === 'sunday_reveal' || phase === 'complete') {
    return NextResponse.json({ phase, questions: null, answers: [] })
  }

  // Try to load existing generated content
  let { data: contentRow } = await supabaseAdmin
    .from('generated_content')
    .select('*')
    .eq('couple_id', couple.id)
    .eq('user_id', userId)
    .eq('phase', phase)
    .eq('content_type', 'questions')
    .limit(1)
    .single()

  // Lazy generation: generate if missing
  if (!contentRow) {
    try {
      await generateContentForPhase(couple.id, phase, userId)
      const { data } = await supabaseAdmin
        .from('generated_content')
        .select('*')
        .eq('couple_id', couple.id)
        .eq('user_id', userId)
        .eq('phase', phase)
        .eq('content_type', 'questions')
        .limit(1)
        .single()
      contentRow = data
    } catch (err) {
      console.error('Lazy generation failed:', err)
      return NextResponse.json({ error: 'Content generation failed' }, { status: 500 })
    }
  }

  const questions = (contentRow?.content as QuestionsContent)?.questions || []

  // Load existing answers for this phase
  const { data: answers } = await supabaseAdmin
    .from('answers')
    .select('*')
    .eq('couple_id', couple.id)
    .eq('user_id', userId)
    .eq('phase', phase)
    .order('question_number')

  const expectedCount = PHASE_QUESTION_COUNTS[phase] || 0
  const allAnswered = (answers?.length || 0) >= expectedCount

  return NextResponse.json({
    phase,
    phaseLabel: couple.current_phase,
    questions,
    answers: answers || [],
    allAnswered,
  })
}
