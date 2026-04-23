import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdminRequest } from '@/lib/utils'

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  }

  const { data: couple } = await supabaseAdmin
    .from('couples')
    .select('id')
    .limit(1)
    .single()

  if (!couple) return NextResponse.json({ error: 'No couple found' }, { status: 404 })

  // Delete all answers and generated content, reset phase
  await Promise.all([
    supabaseAdmin.from('answers').delete().eq('couple_id', couple.id),
    supabaseAdmin.from('generated_content').delete().eq('couple_id', couple.id),
  ])

  await supabaseAdmin
    .from('couples')
    .update({
      current_phase: 'not_started',
      phase_started_at: null,
      experiment_started_at: null,
    })
    .eq('id', couple.id)

  return NextResponse.json({ success: true, message: 'Experiment reset to not_started' })
}
