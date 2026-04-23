import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { resolveUserFromRequest } from '@/lib/utils'

export async function POST(request: NextRequest) {
  const userId = resolveUserFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { questionNumber, questionText, answerText, audioUrl, inputMethod } = body

  if (!questionNumber || !questionText || !inputMethod) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: couple, error: coupleError } = await supabaseAdmin
    .from('couples')
    .select('id, current_phase')
    .limit(1)
    .single()

  if (coupleError || !couple) {
    return NextResponse.json({ error: 'No couple found' }, { status: 404 })
  }

  const { data, error } = await supabaseAdmin
    .from('answers')
    .upsert(
      {
        couple_id: couple.id,
        user_id: userId,
        phase: couple.current_phase,
        question_number: questionNumber,
        question_text: questionText,
        answer_text: answerText || null,
        audio_url: audioUrl || null,
        input_method: inputMethod,
      },
      { onConflict: 'couple_id,user_id,phase,question_number' },
    )
    .select()
    .single()

  if (error) {
    console.error('Answer upsert error:', error)
    return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 })
  }

  return NextResponse.json({ answer: data })
}
