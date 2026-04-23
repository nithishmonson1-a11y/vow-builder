import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdminRequest, getUserName } from '@/lib/utils'
import { PHASE_QUESTION_COUNTS, PhaseName } from '@/lib/types'

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  }

  const { data: couple, error } = await supabaseAdmin
    .from('couples')
    .select('*')
    .limit(1)
    .single()

  if (error || !couple) {
    return NextResponse.json({ error: 'No couple found — run /api/admin/seed first' }, { status: 404 })
  }

  const phase = couple.current_phase as PhaseName
  const expectedCount = PHASE_QUESTION_COUNTS[phase] ?? 0

  // Answer counts per user for current phase
  const { data: answersA } = await supabaseAdmin
    .from('answers')
    .select('id', { count: 'exact' })
    .eq('couple_id', couple.id)
    .eq('user_id', 'a')
    .eq('phase', phase)

  const { data: answersB } = await supabaseAdmin
    .from('answers')
    .select('id', { count: 'exact' })
    .eq('couple_id', couple.id)
    .eq('user_id', 'b')
    .eq('phase', phase)

  const countA = answersA?.length || 0
  const countB = answersB?.length || 0

  // Recent activity (last 20 rows from answers + generated_content)
  const { data: recentAnswers } = await supabaseAdmin
    .from('answers')
    .select('created_at, user_id, phase, question_number, input_method')
    .eq('couple_id', couple.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: recentGenerated } = await supabaseAdmin
    .from('generated_content')
    .select('created_at, user_id, phase, content_type')
    .eq('couple_id', couple.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const activity = [
    ...(recentAnswers || []).map((r) => ({
      type: 'answer',
      at: r.created_at,
      label: `${getUserName(r.user_id)} answered Q${r.question_number} in ${r.phase} (${r.input_method})`,
    })),
    ...(recentGenerated || []).map((r) => ({
      type: 'generated',
      at: r.created_at,
      label: `Generated ${r.content_type} for ${r.user_id ? getUserName(r.user_id) : 'both'} — ${r.phase}`,
    })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 20)

  // Generated content exists for current phase?
  const { data: generatedA } = await supabaseAdmin
    .from('generated_content')
    .select('content_type')
    .eq('couple_id', couple.id)
    .eq('user_id', 'a')
    .eq('phase', phase)

  const { data: generatedB } = await supabaseAdmin
    .from('generated_content')
    .select('content_type')
    .eq('couple_id', couple.id)
    .eq('user_id', 'b')
    .eq('phase', phase)

  return NextResponse.json({
    couple,
    phase,
    expectedCount,
    users: {
      a: { name: getUserName('a'), answered: countA, expected: expectedCount, done: countA >= expectedCount, generated: generatedA || [] },
      b: { name: getUserName('b'), answered: countB, expected: expectedCount, done: countB >= expectedCount, generated: generatedB || [] },
    },
    bothDone: countA >= expectedCount && countB >= expectedCount,
    activity,
  })
}
