import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdminRequest } from '@/lib/utils'
import { generateContentForPhase } from '@/lib/generation'
import { PHASE_ORDER, PHASE_QUESTION_COUNTS, PhaseName, getNextPhase } from '@/lib/types'

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  }

  const { data: couple } = await supabaseAdmin
    .from('couples')
    .select('*')
    .limit(1)
    .single()

  if (!couple) return NextResponse.json({ error: 'No couple found' }, { status: 404 })

  const phase = couple.current_phase as PhaseName

  if (phase === 'not_started') {
    return NextResponse.json({ error: 'Use /admin/start to begin' }, { status: 400 })
  }

  if (phase === 'sunday_reveal' || phase === 'complete') {
    return NextResponse.json({ error: 'Already at final phase' }, { status: 400 })
  }

  // For sunday_bridge_2 → sunday_reveal, use /admin/trigger-reveal
  if (phase === 'sunday_bridge_2') {
    return NextResponse.json(
      { error: 'Use /admin/trigger-reveal to advance from sunday_bridge_2' },
      { status: 400 },
    )
  }

  // Verify both users have answered all questions
  const expectedCount = PHASE_QUESTION_COUNTS[phase] ?? 0
  const [{ data: answersA }, { data: answersB }] = await Promise.all([
    supabaseAdmin
      .from('answers')
      .select('id')
      .eq('couple_id', couple.id)
      .eq('user_id', 'a')
      .eq('phase', phase),
    supabaseAdmin
      .from('answers')
      .select('id')
      .eq('couple_id', couple.id)
      .eq('user_id', 'b')
      .eq('phase', phase),
  ])

  const countA = answersA?.length || 0
  const countB = answersB?.length || 0

  if (countA < expectedCount || countB < expectedCount) {
    return NextResponse.json(
      {
        error: 'Not all answers submitted',
        details: { a: `${countA}/${expectedCount}`, b: `${countB}/${expectedCount}` },
      },
      { status: 400 },
    )
  }

  const nextPhase = getNextPhase(phase)
  if (!nextPhase) return NextResponse.json({ error: 'No next phase' }, { status: 400 })

  // Update phase
  const { error: updateError } = await supabaseAdmin
    .from('couples')
    .update({
      current_phase: nextPhase,
      phase_started_at: new Date().toISOString(),
    })
    .eq('id', couple.id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to advance phase' }, { status: 500 })
  }

  // Generate content for next phase for both users
  try {
    await Promise.all([
      generateContentForPhase(couple.id, nextPhase, 'a'),
      generateContentForPhase(couple.id, nextPhase, 'b'),
    ])
  } catch (err) {
    console.error('Content generation error after phase advance:', err)
    // Phase already advanced — content will lazy-generate when users open app
  }

  return NextResponse.json({ success: true, previousPhase: phase, newPhase: nextPhase })
}
