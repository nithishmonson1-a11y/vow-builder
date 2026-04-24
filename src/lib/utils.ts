import { NextRequest } from 'next/server'
import { UserId } from './types'

// Resolve user token to user ID — used by API routes
export function resolveUserFromRequest(request: NextRequest): UserId | null {
  const token =
    request.headers.get('x-user-token') ||
    request.nextUrl.searchParams.get('token')

  if (!token) return null

  if (token === process.env.USER_A_TOKEN) return 'a'
  if (token === process.env.USER_B_TOKEN) return 'b'
  return null
}

// Validate admin token in API routes
export function isAdminRequest(request: NextRequest): boolean {
  const token =
    request.headers.get('x-admin-token') ||
    request.nextUrl.searchParams.get('adminToken')
  return token === process.env.ADMIN_TOKEN
}

export function getUserName(userId: UserId): string {
  if (userId === 'a') return process.env.USER_A_NAME || 'Partner A'
  return process.env.USER_B_NAME || 'Partner B'
}

export function getPartner(userId: UserId): UserId {
  return userId === 'a' ? 'b' : 'a'
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delays = [1000, 4000, 16000],
): Promise<T> {
  let lastErr: unknown
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (i < maxRetries) {
        await sleep(delays[i] ?? 16000)
      }
    }
  }
  throw lastErr
}

export function formatPhaseLabel(phase: string): string {
  const labels: Record<string, string> = {
    not_started: 'Not Started',
    thursday_foundation: 'Thursday — Foundation',
    friday_mirror: 'Friday — Mirror',
    saturday_bridge: 'Saturday — Bridge',
    sunday_bridge_2: 'Sunday Morning — Bridge',
    sunday_reveal: 'Sunday Evening — Reveal',
    complete: 'Complete',
  }
  return labels[phase] || phase
}
