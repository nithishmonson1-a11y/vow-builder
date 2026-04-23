'use client'

import { useRef, useState } from 'react'

interface AudioPlayerProps {
  url: string
  label?: string
}

export function AudioPlayer({ url, label = 'Listen to recording' }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
    } else {
      audio.play()
    }
  }

  return (
    <div className="flex items-center gap-3 mt-2">
      <audio
        ref={audioRef}
        src={url}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setProgress(0) }}
        onTimeUpdate={() => {
          const audio = audioRef.current
          if (audio && audio.duration) {
            setProgress(audio.currentTime / audio.duration)
          }
        }}
      />
      <button
        onClick={toggle}
        className="w-8 h-8 flex items-center justify-center border border-ink-light text-ink-light hover:bg-cream-dark transition-colors shrink-0"
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing ? (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <rect x="1" y="1" width="4" height="10" />
            <rect x="7" y="1" width="4" height="10" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <polygon points="2,1 11,6 2,11" />
          </svg>
        )}
      </button>
      <div className="flex-1">
        <div className="text-xs text-ink-light mb-1">{label}</div>
        <div className="h-0.5 bg-cream-mid rounded-full overflow-hidden">
          <div
            className="h-full bg-gold transition-all"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
