'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AudioPlayer } from '@/components/AudioPlayer'
import { PHASE_LABELS, PhaseName } from '@/lib/types'

interface Answer {
  id: string
  phase: string
  question_number: number
  question_text: string
  answer_text: string | null
  audio_url: string | null
  input_method: 'voice' | 'text'
}

interface MineScreenProps {
  userToken: string
  userId: 'a' | 'b'
  userName: string
}

export function MineScreen({ userToken, userId, userName }: MineScreenProps) {
  const [grouped, setGrouped] = useState<Record<string, Answer[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/mine/${userId}`, { headers: { 'x-user-token': userToken } })
      .then((r) => r.json())
      .then((d) => {
        setGrouped(d.grouped || {})
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

  const phases = Object.keys(grouped)

  return (
    <div className="min-h-dvh bg-cream flex flex-col">
      <nav className="flex items-center justify-between px-6 pt-safe pt-4 pb-4 border-b border-cream-mid">
        <Link href={`/u/${userToken}`} className="text-sm text-ink-light">
          ← Today
        </Link>
        <span className="font-display text-lg text-ink">{userName}</span>
        <Link href={`/u/${userToken}/vows`} className="text-sm text-ink-light">
          Vows
        </Link>
      </nav>

      <main className="flex-1 px-6 py-8 max-w-xl mx-auto w-full">
        {phases.length === 0 ? (
          <div className="flex flex-col items-center gap-4 mt-16 text-center">
            <p className="font-display text-2xl text-ink-light">Nothing yet.</p>
            <p className="text-ink-light text-sm">Your answers will appear here.</p>
            <Link href={`/u/${userToken}`} className="btn-primary mt-4">
              Go to today
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {phases.map((phase) => (
              <div key={phase} className="flex flex-col gap-4">
                <div className="phase-label">{PHASE_LABELS[phase as PhaseName] || phase}</div>
                <div className="flex flex-col gap-6">
                  {grouped[phase].map((answer) => (
                    <div key={answer.id} className="flex flex-col gap-2 pb-6 border-b border-cream-mid last:border-0">
                      <p className="text-sm text-ink-light">Q{answer.question_number}: {answer.question_text}</p>
                      {answer.answer_text && (
                        <p className="text-ink leading-relaxed">{answer.answer_text}</p>
                      )}
                      {answer.audio_url && (
                        <AudioPlayer url={answer.audio_url} label="Original recording" />
                      )}
                      {!answer.answer_text && !answer.audio_url && (
                        <p className="text-ink-light italic text-sm">No content saved</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
