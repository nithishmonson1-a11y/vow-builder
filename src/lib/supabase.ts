import { createClient } from '@supabase/supabase-js'

// Server-side admin client (never expose to browser)
// Fallbacks prevent crashes during Next.js build-time static analysis
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder',
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export const STORAGE_BUCKET = 'voice-recordings'
