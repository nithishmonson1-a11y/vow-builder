import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdminRequest } from '@/lib/utils'
import { generateContentForPhase } from '@/lib/generation'

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

  if (couple.current_phase !== 'not_started') {
    return NextResponse.json({ error: 'Experiment already started', phase: couple.current_phase }, { status: 400 })
  }

  // Advance to thursday_foundation and generate hardcoded questions
  const { error: updateError } = await supabaseAdmin
    .from('couples')
    .update({
      current_phase: 'thursday_foundation',
      phase_started_at: new Date().toISOString(),
      experiment_started_at: new Date().toISOString(),
    })
    .eq('id', couple.id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to start experiment' }, { status: 500 })
  }

  // Generate Thursday questions (hardcoded) for both users
  await Promise.all([
    generateContentForPhase(couple.id, 'thursday_foundation', 'a'),
    generateContentForPhase(couple.id, 'thursday_foundation', 'b'),
  ])

  return NextResponse.json({ success: true, phase: 'thursday_foundation' })
}
