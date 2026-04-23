import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { resolveUserFromRequest } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const userId = resolveUserFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: couple, error } = await supabaseAdmin
    .from('couples')
    .select('*')
    .limit(1)
    .single()

  if (error) return NextResponse.json({ error: 'No couple found' }, { status: 404 })

  return NextResponse.json({ couple, userId })
}
