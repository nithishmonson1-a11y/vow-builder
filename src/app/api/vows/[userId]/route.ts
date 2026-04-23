import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { resolveUserFromRequest } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  const callerUserId = resolveUserFromRequest(request)
  if (!callerUserId || callerUserId !== params.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: couple } = await supabaseAdmin
    .from('couples')
    .select('*')
    .limit(1)
    .single()

  if (!couple) return NextResponse.json({ error: 'No couple found' }, { status: 404 })

  if (couple.current_phase !== 'sunday_reveal' && couple.current_phase !== 'complete') {
    return NextResponse.json({ locked: true })
  }

  const userId = params.userId as 'a' | 'b'

  const { data: contentRows } = await supabaseAdmin
    .from('generated_content')
    .select('*')
    .eq('couple_id', couple.id)
    .eq('user_id', userId)
    .eq('phase', 'sunday_reveal')
    .in('content_type', ['reading', 'draft'])

  const reading = contentRows?.find((r) => r.content_type === 'reading')?.content || null
  const draft = contentRows?.find((r) => r.content_type === 'draft')?.content || null

  return NextResponse.json({ locked: false, reading, draft })
}
