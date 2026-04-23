'use client'

import { useState, useEffect, useCallback } from 'react'

interface UserStatus {
  name: string
  answered: number
  expected: number
  done: boolean
  generated: Array<{ content_type: string }>
}

interface StatusData {
  couple: { current_phase: string; phase_started_at: string | null }
  phase: string
  expectedCount: number
  users: { a: UserStatus; b: UserStatus }
  bothDone: boolean
  activity: Array<{ type: string; at: string; label: string }>
}

interface AdminPanelProps {
  adminToken: string
}

const PHASE_NEXT_LABEL: Record<string, string> = {
  not_started: 'Start experiment',
  thursday_foundation: 'Advance to Friday',
  friday_mirror: 'Advance to Saturday',
  saturday_bridge: 'Advance to Sunday morning',
  sunday_synthesis: 'Trigger Sunday reveal',
}

export function AdminPanel({ adminToken }: AdminPanelProps) {
  const [status, setStatus] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [message, setMessage] = useState('')
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  const adminHeaders = { 'x-admin-token': adminToken, 'Content-Type': 'application/json' }

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/status', { headers: { 'x-admin-token': adminToken } })
      if (res.ok) setStatus(await res.json())
    } finally {
      setLoading(false)
    }
  }, [adminToken])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 30_000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  const act = async (path: string, body?: Record<string, unknown>) => {
    setActing(true)
    setMessage('')
    try {
      const res = await fetch(path, { method: 'POST', headers: adminHeaders, body: body ? JSON.stringify(body) : undefined })
      const data = await res.json()
      if (res.ok) {
        setMessage('✓ ' + (data.message || `Done. Phase: ${data.phase || data.newPhase || '?'}`))
      } else {
        setMessage('✗ ' + (data.error || 'Error'))
      }
      await fetchStatus()
    } catch {
      setMessage('✗ Network error')
    } finally {
      setActing(false)
    }
  }

  const seed = () => act('/api/admin/seed')
  const start = () => act('/api/admin/start')
  const advance = () => act('/api/admin/advance')
  const triggerReveal = () => act('/api/admin/trigger-reveal')
  const regenerate = () => {
    if (confirm('Regenerate content for current phase? This deletes existing generated content.')) {
      act('/api/admin/regenerate')
    }
  }

  const restart = () => {
    if (confirm('Restart the experiment? This deletes ALL answers and generated content and resets to not_started.')) {
      act('/api/admin/restart')
    }
  }

  const previewPhase = async () => {
    if (!status) return
    setPreviewLoading(true)
    setPreview(null)
    try {
      const res = await fetch(`/api/admin/preview/${status.phase}`, { method: 'POST', headers: adminHeaders })
      setPreview(await res.json())
    } finally {
      setPreviewLoading(false)
    }
  }

  const phase = status?.couple.current_phase

  const primaryAction = () => {
    if (!phase) return seed()
    if (phase === 'not_started') return start()
    if (phase === 'sunday_synthesis') return triggerReveal()
    if (phase === 'sunday_reveal' || phase === 'complete') return
    return advance()
  }

  const primaryLabel = phase ? (PHASE_NEXT_LABEL[phase] || 'Advance') : 'Seed database'
  const canPrimary =
    phase === 'not_started' ||
    (status?.bothDone && phase !== 'sunday_reveal' && phase !== 'complete')

  if (loading) {
    return (
      <div className="min-h-dvh bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-cream">
      <nav className="px-6 py-4 border-b border-cream-mid flex items-center justify-between">
        <span className="font-display text-xl text-ink">Admin</span>
        <button onClick={fetchStatus} className="text-sm text-ink-light">Refresh</button>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-8 flex flex-col gap-8">
        {/* Status */}
        {status ? (
          <>
            {/* Phase */}
            <div className="card flex flex-col gap-2">
              <div className="phase-label">Current phase</div>
              <p className="font-display text-2xl text-ink">{phase}</p>
              {status.couple.phase_started_at && (
                <p className="text-xs text-ink-light">
                  Started {new Date(status.couple.phase_started_at).toLocaleString()}
                </p>
              )}
            </div>

            {/* User answer counts */}
            <div className="grid grid-cols-2 gap-4">
              {(['a', 'b'] as const).map((uid) => {
                const u = status.users[uid]
                return (
                  <div key={uid} className="card flex flex-col gap-1">
                    <p className="font-sans text-sm font-medium text-ink">{u.name}</p>
                    <p className={`text-2xl font-display ${u.done ? 'text-gold' : 'text-ink'}`}>
                      {u.answered} / {u.expected}
                    </p>
                    <p className="text-xs text-ink-light">
                      {u.done ? '✓ Done' : `${u.expected - u.answered} remaining`}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Primary action */}
            {phase !== 'sunday_reveal' && phase !== 'complete' && (
              <div className="flex flex-col gap-2">
                <button
                  onClick={primaryAction}
                  disabled={!canPrimary || acting}
                  className="btn-primary w-full py-4 text-base"
                >
                  {acting ? 'Working...' : primaryLabel}
                </button>
                {!canPrimary && phase !== 'not_started' && (
                  <p className="text-xs text-ink-light text-center">
                    Waiting for both partners to finish answering
                  </p>
                )}
              </div>
            )}

            {phase === 'sunday_reveal' && (
              <div className="card text-center">
                <p className="font-display text-xl text-gold">Sunday reveal is live.</p>
                <p className="text-sm text-ink-light mt-2">Both partners can now open their vows.</p>
              </div>
            )}

            {/* Message */}
            {message && (
              <div className={`text-sm p-3 ${message.startsWith('✓') ? 'bg-cream-dark text-ink' : 'bg-cream-dark text-terracotta'}`}>
                {message}
              </div>
            )}

            {/* Secondary actions */}
            <div className="flex flex-col gap-3">
              <p className="text-xs text-ink-light uppercase tracking-wide">Debug actions</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={previewPhase} disabled={previewLoading || acting} className="btn-ghost text-sm py-2">
                  {previewLoading ? 'Loading...' : 'Preview content'}
                </button>
                <button onClick={regenerate} disabled={acting} className="btn-ghost text-sm py-2">
                  Regenerate
                </button>
                <button onClick={seed} disabled={acting} className="btn-ghost text-sm py-2">
                  Seed (idempotent)
                </button>
                <button onClick={restart} disabled={acting} className="btn-ghost text-sm py-2 text-terracotta border-terracotta/30 hover:border-terracotta col-span-2">
                  Restart experiment
                </button>
              </div>
            </div>

            {/* Preview */}
            {preview && (
              <div className="flex flex-col gap-4">
                <p className="text-xs text-ink-light uppercase tracking-wide">Preview</p>
                <pre className="bg-cream-dark border border-cream-mid p-4 text-xs text-ink overflow-auto max-h-96 whitespace-pre-wrap">
                  {JSON.stringify(preview, null, 2)}
                </pre>
              </div>
            )}

            {/* Activity log */}
            {status.activity.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-ink-light uppercase tracking-wide">Recent activity</p>
                <div className="flex flex-col gap-2">
                  {status.activity.map((item, i) => (
                    <div key={i} className="flex gap-3 text-xs">
                      <span className="text-ink-light shrink-0">
                        {new Date(item.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-ink">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-ink-light">No couple found. Seed the database first.</p>
            <button onClick={seed} disabled={acting} className="btn-primary">
              {acting ? 'Seeding...' : 'Seed database'}
            </button>
            {message && <p className="text-sm text-ink-light">{message}</p>}
          </div>
        )}
      </main>
    </div>
  )
}
