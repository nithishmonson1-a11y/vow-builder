'use client'

import { useState, useEffect, useCallback } from 'react'
import { QuestionCard } from '@/components/QuestionCard'
import Link from 'next/link'

interface Question {
  number: number
  text: string
}

interface Answer {
  id: string
  question_number: number
  question_text: string
  answer_text: string | null
  audio_url: string | null
  input_method: 'voice' | 'text'
}

interface TodayData {
  phase: string
  phaseLabel: string
  questions: Question[]
  answers: Answer[]
  allAnswered: boolean
}

interface TodayScreenProps {
  userToken: string
  userId: 'a' | 'b'
  userName: string
}

const PHASE_DESCRIPTIONS: Record<string, string> = {
  thursday_foundation: 'Start here. These questions are the same for both of you.',
  friday_mirror: 'These questions were written just for you, based on what you wrote last night.',
  saturday_bridge: 'These questions are informed by the full picture of the week so far.',
  sunday_synthesis: 'You\'re ready to start finding your words. Almost there.',
}

export function TodayScreen({ userToken, userId, userName }: TodayScreenProps) {
  const [data, setData] = useState<TodayData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [localAnswers, setLocalAnswers] = useState<Map<number, Answer>>(new Map())

  const fetchToday = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/today/${userId}`, {
        headers: { 'x-user-token': userToken },
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error || `Server error ${res.status}`)
        return
      }
      const json = await res.json()
      setData(json)

      // Build local answer map from existing answers
      const answerMap = new Map<number, Answer>()
      for (const answer of json.answers || []) {
        answerMap.set(answer.question_number, answer)
      }
      setLocalAnswers(answerMap)

      // Set current question to first unanswered
      const firstUnanswered = (json.questions || []).findIndex(
        (q: Question) => !answerMap.has(q.number),
      )
      setCurrentQuestionIdx(firstUnanswered === -1 ? 0 : firstUnanswered)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [userId, userToken])

  useEffect(() => {
    fetchToday()
  }, [fetchToday])

  const handleSave = async (saveData: {
    questionNumber: number
    questionText: string
    answerText: string
    audioUrl: string | null
    inputMethod: 'voice' | 'text'
  }) => {
    const res = await fetch('/api/answers', {
      method: 'POST',
      headers: { 'x-user-token': userToken, 'Content-Type': 'application/json' },
      body: JSON.stringify(saveData),
    })

    if (!res.ok) throw new Error('Failed to save answer')

    const { answer } = await res.json()
    setLocalAnswers((prev) => new Map(prev).set(saveData.questionNumber, answer))

    // Auto-advance to next unanswered question
    if (data?.questions) {
      const nextUnanswered = data.questions.findIndex(
        (q) => q.number !== saveData.questionNumber && !localAnswers.has(q.number),
      )
      if (nextUnanswered !== -1) {
        setTimeout(() => setCurrentQuestionIdx(nextUnanswered), 600)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-dvh bg-cream flex flex-col items-center justify-center px-6 gap-4 text-center">
        <p className="font-display text-2xl text-ink">Something went wrong</p>
        <p className="text-ink-light text-sm max-w-xs">{error}</p>
        <button onClick={fetchToday} className="btn-ghost mt-2">Try again</button>
      </div>
    )
  }

  const phase = data?.phase

  return (
    <div className="min-h-dvh bg-cream flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 pt-safe pt-4 pb-4 border-b border-cream-mid">
        <span className="font-display text-lg text-ink">{userName}</span>
        <div className="flex gap-4">
          <Link
            href={`/u/${userToken}/mine`}
            className="text-sm text-ink-light hover:text-ink transition-colors"
          >
            Mine
          </Link>
          <Link
            href={`/u/${userToken}/vows`}
            className="text-sm text-ink-light hover:text-ink transition-colors"
          >
            Vows
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center px-6 py-10 max-w-xl mx-auto w-full">
        {/* Not started */}
        {phase === 'not_started' && (
          <div className="flex flex-col gap-6 text-center mt-12 animate-fade-in">
            <p className="font-display text-3xl text-ink">Not yet begun.</p>
            <p className="text-ink-light leading-relaxed">
              The experiment hasn&apos;t started yet. Come back when you get the signal.
            </p>
          </div>
        )}

        {/* Sunday reveal or complete */}
        {(phase === 'sunday_reveal' || phase === 'complete') && (
          <div className="flex flex-col gap-6 text-center mt-12 animate-fade-in">
            <p className="font-display text-3xl text-ink">Tonight is the night.</p>
            <p className="text-ink-light leading-relaxed">
              Your reading and draft vows are ready.
            </p>
            <Link
              href={`/u/${userToken}/vows`}
              className="btn-primary text-center py-4 text-base mt-4"
            >
              Open your vows
            </Link>
          </div>
        )}

        {/* Active phase with questions */}
        {phase && !['not_started', 'sunday_reveal', 'complete'].includes(phase) && data && (
          <div className="w-full flex flex-col gap-8">
            {/* Phase header */}
            <div className="flex flex-col gap-2">
              <div className="phase-label">{data.phaseLabel || phase}</div>
              {PHASE_DESCRIPTIONS[phase] && (
                <p className="text-sm text-ink-light leading-relaxed">
                  {PHASE_DESCRIPTIONS[phase]}
                </p>
              )}
            </div>

            {/* All answered */}
            {data.questions.every((q) => localAnswers.has(q.number)) ? (
              <div className="flex flex-col gap-4 text-center py-8 animate-fade-in">
                <p className="font-display text-2xl text-ink">All done for now.</p>
                <p className="text-ink-light leading-relaxed">
                  I&apos;ll let you know when there&apos;s more.
                </p>
                <Link
                  href={`/u/${userToken}/mine`}
                  className="text-sm text-ink-light underline mt-4"
                >
                  Review your answers
                </Link>
              </div>
            ) : (
              /* Show current question */
              <>
                {/* Question selector dots */}
                {data.questions.length > 1 && (
                  <div className="flex justify-center gap-2">
                    {data.questions.map((q, i) => (
                      <button
                        key={q.number}
                        onClick={() => setCurrentQuestionIdx(i)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          i === currentQuestionIdx
                            ? 'bg-ink w-6'
                            : localAnswers.has(q.number)
                            ? 'bg-gold'
                            : 'bg-cream-mid'
                        }`}
                        aria-label={`Question ${q.number}`}
                      />
                    ))}
                  </div>
                )}

                <QuestionCard
                  key={data.questions[currentQuestionIdx]?.number}
                  question={data.questions[currentQuestionIdx]}
                  existingAnswer={
                    localAnswers.has(data.questions[currentQuestionIdx]?.number)
                      ? localAnswers.get(data.questions[currentQuestionIdx]?.number)
                      : undefined
                  }
                  phase={phase}
                  userToken={userToken}
                  onSave={handleSave}
                />
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
