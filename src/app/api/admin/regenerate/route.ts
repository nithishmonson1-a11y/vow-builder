import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdminRequest } from '@/lib/utils'
import { generateContentForPhase } from '@/lib/generation'
import { PhaseName } from '@/lib/types'

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

  if (phase === 'not_started' || phase === 'complete') {
    return NextResponse.json({ error: 'Nothing to regenerate in this phase' }, { status: 400 })
  }

  // Delete existing generated content for current phase
  await supabaseAdmin
    .from('generated_content')
    .delete()
    .eq('couple_id', couple.id)
    .eq('phase', phase)

  // Regenerate for both users
  try {
    await Promise.all([
      generateContentForPhase(couple.id, phase, 'a'),
      generateContentForPhase(couple.id, phase, 'b'),
    ])
  } catch (err) {
    console.error('Regeneration error:', err)
    return NextResponse.json({ error: 'Regeneration failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true, phase })
}
