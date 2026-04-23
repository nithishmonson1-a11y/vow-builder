import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { resolveUserFromRequest } from '@/lib/utils'
import { withRetry } from '@/lib/utils'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: NextRequest) {
  const userId = resolveUserFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { audioUrl } = await request.json()
  if (!audioUrl) return NextResponse.json({ error: 'No audio URL' }, { status: 400 })

  try {
    const transcript = await withRetry(async () => {
      // Fetch audio from Supabase Storage
      const response = await fetch(audioUrl)
      if (!response.ok) throw new Error(`Failed to fetch audio: ${response.status}`)

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

    return NextResponse.json({ transcript })
  } catch (err) {
    console.error('Transcription error:', err)
    return NextResponse.json(
      { error: 'Transcription failed', transcript: null },
      { status: 500 },
    )
  }
}
