'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { saveRecordingLocally, deleteLocalRecording } from '@/lib/indexeddb'

const MAX_SECONDS = 90

type RecordingState = 'idle' | 'recording' | 'recorded' | 'uploading' | 'transcribing' | 'ready' | 'error'

interface VoiceRecorderProps {
  phase: string
  onReady: (transcript: string, audioUrl: string) => void
  userToken: string
}

function getSupportedMimeType(): string {
  const types = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']
  return types.find((t) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) || 'audio/webm'
}

export function VoiceRecorder({ phase, onReady, userToken }: VoiceRecorderProps) {
  const [state, setState] = useState<RecordingState>('idle')
  const [secondsLeft, setSecondsLeft] = useState(MAX_SECONDS)
  const [transcript, setTranscript] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [editingTranscript, setEditingTranscript] = useState(false)
  const [error, setError] = useState('')
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'local'>('synced')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const localKeyRef = useRef<string>('')

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  const startRecording = useCallback(async () => {
    setError('')
    setTranscript('')
    setAudioUrl('')
    setSecondsLeft(MAX_SECONDS)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = getSupportedMimeType()
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)

      chunksRef.current = []
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' })
        const key = `recording-${Date.now()}`
        localKeyRef.current = key

        // Save locally first
        await saveRecordingLocally(key, blob)
        setState('recorded')

        // Upload in background
        uploadAudio(blob, mimeType, key)
      }

      mediaRecorder.start(1000)
      mediaRecorderRef.current = mediaRecorder
      setState('recording')

      // Countdown timer
      timerRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            stopRecording()
            return 0
          }
          return s - 1
        })
      }, 1000)
    } catch (err) {
      setError('Could not access microphone. Please allow microphone access and try again.')
      setState('error')
    }
  }, [])

  const stopRecording = useCallback(() => {
    stopTimer()
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }, [stopTimer])

  const uploadAudio = async (blob: Blob, mimeType: string, localKey: string) => {
    setState('uploading')
    setSyncStatus('syncing')

    try {
      const formData = new FormData()
      const ext = mimeType.includes('mp4') ? 'm4a' : 'webm'
      formData.append('audio', blob, `recording.${ext}`)
      formData.append('phase', phase)

      const uploadRes = await fetch('/api/upload-audio', {
        method: 'POST',
        headers: { 'x-user-token': userToken },
        body: formData,
      })

      if (!uploadRes.ok) throw new Error('Upload failed')

      const { url } = await uploadRes.json()
      setAudioUrl(url)
      setSyncStatus('synced')

      // Now transcribe
      setState('transcribing')
      await transcribeAudio(url, localKey)
    } catch (err) {
      console.error('Upload error:', err)
      setSyncStatus('local')
      setState('ready') // Allow saving with placeholder
      setTranscript('(audio recorded — transcript pending)')
    }
  }

  const transcribeAudio = async (url: string, localKey: string) => {
    try {
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'x-user-token': userToken, 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioUrl: url }),
      })

      const data = await res.json()
      if (data.transcript) {
        setTranscript(data.transcript)
        // Clean up local copy since we have the URL
        await deleteLocalRecording(localKey)
      } else {
        setTranscript('(audio recorded — transcript pending)')
      }
      setState('ready')
    } catch (err) {
      setTranscript('(audio recorded — transcript pending)')
      setState('ready')
    }
  }

  const reset = useCallback(() => {
    stopTimer()
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    setState('idle')
    setTranscript('')
    setAudioUrl('')
    setSecondsLeft(MAX_SECONDS)
    setSyncStatus('synced')
  }, [stopTimer])

  useEffect(() => () => stopTimer(), [stopTimer])

  return (
    <div className="flex flex-col gap-4">
      {/* Recording button */}
      {(state === 'idle' || state === 'error') && (
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={startRecording}
            className="w-24 h-24 rounded-full bg-ink text-cream flex items-center justify-center
                       hover:bg-ink-mid active:scale-95 transition-all shadow-lg"
            aria-label="Start recording"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1a4 4 0 0 1 4 4v7a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v7a2 2 0 0 0 4 0V5a2 2 0 0 0-2-2zm-7 8a7 7 0 0 0 14 0h2a9 9 0 0 1-8 8.94V22h-2v-2.06A9 9 0 0 1 3 11h2z" />
            </svg>
          </button>
          <p className="text-sm text-ink-light">Tap to record your answer</p>
          {error && <p className="text-sm text-terracotta text-center max-w-xs">{error}</p>}
        </div>
      )}

      {state === 'recording' && (
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={stopRecording}
            className="w-24 h-24 rounded-full bg-terracotta text-cream flex items-center justify-center
                       animate-pulse-slow active:scale-95 transition-all shadow-lg"
            aria-label="Stop recording"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <rect x="4" y="4" width="16" height="16" rx="2" />
            </svg>
          </button>
          <p className="text-sm text-ink-light">
            Recording... {secondsLeft}s remaining
          </p>
          <div className="w-48 h-1 bg-cream-mid rounded-full overflow-hidden">
            <div
              className="h-full bg-terracotta transition-all"
              style={{ width: `${((MAX_SECONDS - secondsLeft) / MAX_SECONDS) * 100}%` }}
            />
          </div>
        </div>
      )}

      {(state === 'uploading' || state === 'transcribing') && (
        <div className="flex flex-col items-center gap-3">
          <div className="w-24 h-24 rounded-full bg-cream-mid flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm text-ink-light">
            {state === 'uploading' ? 'Saving recording...' : 'Transcribing...'}
          </p>
        </div>
      )}

      {state === 'ready' && (
        <div className="flex flex-col gap-3 animate-fade-in">
          {syncStatus === 'local' && (
            <p className="text-xs text-gold">Saved locally, syncing...</p>
          )}

          {editingTranscript ? (
            <div className="flex flex-col gap-2">
              <label className="text-xs text-ink-light uppercase tracking-wide">Edit transcript</label>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                className="w-full bg-cream-dark border border-cream-mid p-3 text-sm text-ink
                           resize-none focus:outline-none focus:border-ink-light min-h-[100px]"
                rows={4}
              />
              <button
                onClick={() => setEditingTranscript(false)}
                className="text-xs text-ink-light underline self-start"
              >
                Done editing
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-ink leading-relaxed">{transcript}</p>
                <button
                  onClick={() => setEditingTranscript(true)}
                  className="text-xs text-ink-light underline shrink-0"
                >
                  Edit
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => onReady(transcript, audioUrl)}
              className="btn-primary flex-1"
            >
              Save answer
            </button>
            <button onClick={reset} className="btn-ghost">
              Re-record
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
