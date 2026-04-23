import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdminRequest } from '@/lib/utils'
import { previewContentForPhase } from '@/lib/generation'
import { PhaseName } from '@/lib/types'

export async function POST(
  request: NextRequest,
  { params }: { params: { phase: string } },
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  }

  const { data: couple } = await supabaseAdmin
    .from('couples')
    .select('id')
    .limit(1)
    .single()

  if (!couple) return NextResponse.json({ error: 'No couple found' }, { status: 404 })

  const phase = params.phase as PhaseName

  try {
    const [previewA, previewB] = await Promise.all([
      previewContentForPhase(couple.id, phase, 'a'),
      previewContentForPhase(couple.id, phase, 'b'),
    ])

    return NextResponse.json({ phase, a: previewA, b: previewB })
  } catch (err) {
    console.error('Preview error:', err)
    return NextResponse.json({ error: 'Preview generation failed' }, { status: 500 })
  }
}
