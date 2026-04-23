import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdminRequest } from '@/lib/utils'

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  }

  // Idempotent: no-op if couple already exists
  const { data: existing } = await supabaseAdmin.from('couples').select('id').limit(1).single()

  if (existing) {
    return NextResponse.json({ message: 'Couple already seeded', couple: existing })
  }

  const { data, error } = await supabaseAdmin
    .from('couples')
    .insert({
      partner_a_id: 'a',
      partner_b_id: 'b',
      current_phase: 'not_started',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Seed failed', details: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Seeded', couple: data })
}
