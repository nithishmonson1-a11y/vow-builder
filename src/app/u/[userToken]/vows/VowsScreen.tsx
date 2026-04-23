'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ReadingContent {
  observations: string[]
  explicit_bridge: string
  confidence_note: string
}

interface DraftContent {
  draft_text: string
  themes_used: string[]
  phrases_drawn_from_user: string[]
}

interface VowsScreenProps {
  userToken: string
  userId: 'a' | 'b'
  userName: string
}

export function VowsScreen({ userToken, userId, userName }: VowsScreenProps) {
  const [loading, setLoading] = useState(true)
  const [locked, setLocked] = useState(true)
  const [reading, setReading] = useState<ReadingContent | null>(null)
  const [draft, setDraft] = useState<DraftContent | null>(null)
  const [mode, setMode] = useState<'reading' | 'draft' | 'write'>('reading')
  const [freshText, setFreshText] = useState('')

  useEffect(() => {
    fetch(`/api/vows/${userId}`, { headers: { 'x-user-token': userToken } })
      .then((r) => r.json())
      .then((d) => {
        setLocked(d.locked)
        setReading(d.reading)
        setDraft(d.draft)
        setLoading(false)
      })
  }, [userId, userToken])

  if (loading) {
    return (
      <div className="min-h-dvh bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const NavBar = () => (
    <nav className="flex items-center justify-between px-6 pt-safe pt-4 pb-4 border-b border-cream-mid">
      <Link href={`/u/${userToken}`} className="text-sm text-ink-light">
        ← Today
      </Link>
      <span className="font-display text-lg text-ink">{userName}</span>
      <Link href={`/u/${userToken}/mine`} className="text-sm text-ink-light">
        Mine
      </Link>
    </nav>
  )

  if (locked) {
    return (
      <div className="min-h-dvh bg-cream flex flex-col">
        <NavBar />
        <main className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
          <div className="w-12 h-12 border border-cream-mid flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-light">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <p className="font-display text-2xl text-ink">Not yet.</p>
          <p className="text-ink-light text-sm leading-relaxed max-w-xs">
            This screen will open Sunday evening, after you&apos;ve finished writing for the week.
          </p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-cream flex flex-col">
      <NavBar />

      {/* Mode tabs */}
      <div className="flex border-b border-cream-mid px-6">
        {[
          { key: 'reading', label: 'Reading' },
          { key: 'draft', label: 'Draft vows' },
          { key: 'write', label: 'Write fresh' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setMode(key as typeof mode)}
            className={`px-4 py-3 text-sm transition-colors border-b-2 -mb-px mr-4 ${
              mode === key
                ? 'border-ink text-ink'
                : 'border-transparent text-ink-light hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <main className="flex-1 px-6 py-8 max-w-xl mx-auto w-full">
        {mode === 'reading' && reading && (
          <div className="flex flex-col gap-8 animate-fade-in">
            <div className="flex flex-col gap-2">
              <div className="phase-label">A reading, for you</div>
              <p className="text-xs text-ink-light">
                What the week of writing reveals about the person you&apos;re marrying.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {reading.observations.map((obs, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <span className="text-gold font-display text-xl mt-0.5 shrink-0">{i + 1}.</span>
                  <p className="text-ink leading-relaxed">{obs}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 pt-6 border-t border-cream-mid">
              <p className="phase-label">One thing to carry in tonight</p>
              <p className="text-ink leading-relaxed font-display text-xl">
                {reading.explicit_bridge}
              </p>
            </div>

            <div className="bg-cream-dark border border-cream-mid p-4">
              <p className="text-xs text-ink-light mb-1 uppercase tracking-wide">Confidence note</p>
              <p className="text-sm text-ink-light italic leading-relaxed">
                {reading.confidence_note}
              </p>
            </div>

            <button
              onClick={() => setMode('draft')}
              className="btn-primary w-full py-4"
            >
              Read your draft vows →
            </button>
          </div>
        )}

        {mode === 'draft' && draft && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex flex-col gap-2">
              <div className="phase-label">First draft</div>
              <p className="text-xs text-ink-light">
                Written in your voice, from the words you&apos;ve used this week.
              </p>
            </div>

            <div className="bg-cream-dark border border-cream-mid p-6">
              <p className="font-display text-lg leading-relaxed text-ink whitespace-pre-wrap">
                {draft.draft_text}
              </p>
            </div>

            {draft.themes_used.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-ink-light uppercase tracking-wide">Themes drawn from</p>
                <div className="flex flex-wrap gap-2">
                  {draft.themes_used.map((t, i) => (
                    <span key={i} className="text-xs bg-cream-mid px-2 py-1 text-ink-light">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setFreshText(draft.draft_text)
                  setMode('write')
                }}
                className="btn-primary flex-1 py-4"
              >
                Use this draft
              </button>
              <button
                onClick={() => {
                  const phrases = draft.phrases_drawn_from_user.join('\n\n')
                  setFreshText(phrases ? `// Key phrases from your week:\n${phrases}\n\n` : '')
                  setMode('write')
                }}
                className="btn-ghost"
              >
                Write fresh
              </button>
            </div>
          </div>
        )}

        {mode === 'write' && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div className="phase-label">Your vows</div>
            <textarea
              value={freshText}
              onChange={(e) => setFreshText(e.target.value)}
              placeholder="Write your vows here..."
              className="w-full bg-cream-dark border border-cream-mid p-4 text-ink font-display
                         text-lg leading-relaxed resize-none focus:outline-none
                         focus:border-ink-light min-h-[60vh]"
              rows={20}
              autoFocus
            />
            <p className="text-xs text-ink-light text-right">
              {freshText.split(/\s+/).filter(Boolean).length} words
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
