'use client'

import { useState } from 'react'
import { VoiceRecorder } from './VoiceRecorder'

interface Question {
  number: number
  text: string
}

interface ExistingAnswer {
  answer_text: string | null
  audio_url: string | null
  input_method: 'voice' | 'text'
}

interface QuestionCardProps {
  question: Question
  existingAnswer?: ExistingAnswer
  phase: string
  userToken: string
  onSave: (data: {
    questionNumber: number
    questionText: string
    answerText: string
    audioUrl: string | null
    inputMethod: 'voice' | 'text'
  }) => Promise<void>
}

type InputMode = 'choose' | 'voice' | 'text'

export function QuestionCard({
  question,
  existingAnswer,
  phase,
  userToken,
  onSave,
}: QuestionCardProps) {
  const [mode, setMode] = useState<InputMode>(existingAnswer ? 'choose' : 'choose')
  const [textAnswer, setTextAnswer] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(!!existingAnswer)

  if (saved && existingAnswer) {
    return (
      <div className="flex flex-col gap-4 animate-fade-in">
        <div className="phase-label">Question {question.number}</div>
        <p className="question-text">{question.text}</p>
        <div className="card">
          <p className="text-sm text-ink-light uppercase tracking-wide mb-2">Your answer</p>
          <p className="text-ink leading-relaxed">
            {existingAnswer.answer_text || '(audio recorded)'}
          </p>
        </div>
      </div>
    )
  }

  const handleVoiceReady = async (transcript: string, audioUrl: string) => {
    setSaving(true)
    await onSave({
      questionNumber: question.number,
      questionText: question.text,
      answerText: transcript,
      audioUrl: audioUrl || null,
      inputMethod: 'voice',
    })
    setSaving(false)
    setSaved(true)
  }

  const handleTextSave = async () => {
    if (!textAnswer.trim()) return
    setSaving(true)
    await onSave({
      questionNumber: question.number,
      questionText: question.text,
      answerText: textAnswer.trim(),
      audioUrl: null,
      inputMethod: 'text',
    })
    setSaving(false)
    setSaved(true)
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="phase-label">Question {question.number}</div>
      <p className="question-text">{question.text}</p>

      {mode === 'choose' && (
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setMode('voice')}
            className="btn-primary w-full py-4 text-base"
          >
            Answer by voice
          </button>
          <button
            onClick={() => setMode('text')}
            className="btn-ghost w-full py-4"
          >
            Answer by typing
          </button>
        </div>
      )}

      {mode === 'voice' && (
        <div className="flex flex-col gap-4">
          <VoiceRecorder
            phase={phase}
            userToken={userToken}
            onReady={handleVoiceReady}
          />
          <button
            onClick={() => setMode('choose')}
            className="text-xs text-ink-light underline text-center"
          >
            Switch to typing instead
          </button>
        </div>
      )}

      {mode === 'text' && (
        <div className="flex flex-col gap-3">
          <textarea
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            placeholder="Write your answer here..."
            className="w-full bg-cream-dark border border-cream-mid p-4 text-ink
                       placeholder-ink-light/50 resize-none focus:outline-none
                       focus:border-ink-light min-h-[140px] text-base leading-relaxed"
            rows={5}
            autoFocus
          />
          <div className="flex gap-3">
            <button
              onClick={handleTextSave}
              disabled={!textAnswer.trim() || saving}
              className="btn-primary flex-1"
            >
              {saving ? 'Saving...' : 'Save answer'}
            </button>
            <button onClick={() => setMode('choose')} className="btn-ghost">
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
