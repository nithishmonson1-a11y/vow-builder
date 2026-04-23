import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, STORAGE_BUCKET } from '@/lib/supabase'
import { resolveUserFromRequest } from '@/lib/utils'

export async function POST(request: NextRequest) {
  const userId = resolveUserFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('audio') as File | null
  const phase = formData.get('phase') as string | null

  if (!file) return NextResponse.json({ error: 'No audio file' }, { status: 400 })

  const ext = file.type.includes('mp4') ? 'm4a' : 'webm'
  const timestamp = Date.now()
  const path = `${userId}/${phase || 'unknown'}/${timestamp}.${ext}`

  const buffer = await file.arrayBuffer()

  const { data, error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    console.error('Storage upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  const { data: urlData } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(data.path)

  return NextResponse.json({ url: urlData.publicUrl, path: data.path })
}
