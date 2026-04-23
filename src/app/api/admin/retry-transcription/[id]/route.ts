import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdminRequest, withRetry } from '@/lib/utils'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'placeholder' })

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  }

  const { data: answer, error } = await supabaseAdmin
    .from('answers')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !answer) {
    return NextResponse.json({ error: 'Answer not found' }, { status: 404 })
  }

  if (!answer.audio_url) {
    return NextResponse.json({ error: 'No audio URL for this answer' }, { status: 400 })
  }

  try {
    const transcript = await withRetry(async () => {
      const response = await fetch(answer.audio_url)
      if (!response.ok) throw new Error(`Audio fetch failed: ${response.status}`)

      const buffer = await response.arrayBuffer()
      const contentType = response.headers.get('content-type') || 'audio/webm'
      const ext = contentType.includes('mp4') || contentType.includes('m4a') ? 'm4a' : 'webm'

      const file = new File([buffer], `audio.${ext}`, { type: contentType })
      const result = await openai.audio.transcriptions.create({
        file,
        model: 'whisper-1',
        language: 'en',
      })
      return result.text
    })

    const { error: updateError } = await supabaseAdmin
      .from('answers')
      .update({ answer_text: transcript })
      .eq('id', params.id)

    if (updateError) throw updateError

    return NextResponse.json({ success: true, transcript })
  } catch (err) {
    console.error('Retry transcription error:', err)
    return NextResponse.json({ error: 'Transcription retry failed' }, { status: 500 })
  }
}
