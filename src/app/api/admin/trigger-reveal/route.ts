import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdminRequest } from '@/lib/utils'
import { generateContentForPhase } from '@/lib/generation'
import { PHASE_QUESTION_COUNTS } from '@/lib/types'

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

  if (couple.current_phase !== 'sunday_bridge_2') {
    return NextResponse.json(
      { error: 'Can only trigger reveal from sunday_bridge_2 phase', current: couple.current_phase },
      { status: 400 },
    )
  }

  // Verify both users have answered Sunday bridge 2 questions
  const expectedCount = PHASE_QUESTION_COUNTS['sunday_bridge_2'] ?? 3
  const [{ data: answersA }, { data: answersB }] = await Promise.all([
    supabaseAdmin
      .from('answers')
      .select('id')
      .eq('couple_id', couple.id)
      .eq('user_id', 'a')
      .eq('phase', 'sunday_bridge_2'),
    supabaseAdmin
      .from('answers')
      .select('id')
      .eq('couple_id', couple.id)
      .eq('user_id', 'b')
      .eq('phase', 'sunday_bridge_2'),
  ])

  const countA = answersA?.length || 0
  const countB = answersB?.length || 0

  if (countA < expectedCount || countB < expectedCount) {
    return NextResponse.json(
      {
        error: 'Not all Sunday bridge 2 answers submitted',
        details: { a: `${countA}/${expectedCount}`, b: `${countB}/${expectedCount}` },
      },
      { status: 400 },
    )
  }

  // Advance phase
  const { error: updateError } = await supabaseAdmin
    .from('couples')
    .update({
      current_phase: 'sunday_reveal',
      phase_started_at: new Date().toISOString(),
    })
    .eq('id', couple.id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to advance to reveal' }, { status: 500 })
  }

  // Generate reading + draft for both users
  try {
    await Promise.all([
      generateContentForPhase(couple.id, 'sunday_reveal', 'a'),
      generateContentForPhase(couple.id, 'sunday_reveal', 'b'),
    ])
  } catch (err) {
    console.error('Sunday reveal generation error:', err)
  }

  return NextResponse.json({ success: true, phase: 'sunday_reveal' })
}
