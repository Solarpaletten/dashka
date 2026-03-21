// feature/german/ConversationMode.tsx
// v1.2 — Full-screen conversation view
//
// Design:
//   • Split screen: top = speaker A (source), bottom = speaker B (translation)
//   • Large font (1.6x–2x)
//   • Minimal UI — only mic + direction + close
//   • Auto-scroll to latest text
//   • Red pulsing mic when recording

import React, { useEffect, useRef } from 'react'
import type { MicState, Direction } from '../../core/types/translator.types'
import { DIRECTION_CONFIG } from '../../core/types/translator.types'

interface Props {
  inputText:      string
  translatedText: string
  micState:       MicState
  direction:      Direction
  onToggleMic:    () => void
  onToggleDir:    () => void
  onClose:        () => void
}

const ConversationMode: React.FC<Props> = ({
  inputText,
  translatedText,
  micState,
  direction,
  onToggleMic,
  onToggleDir,
  onClose,
}) => {
  const cfg            = DIRECTION_CONFIG[direction]
  const isRecording    = micState === 'Recording'
  const isProcessing   = micState === 'Processing'
  const inputScrollRef = useRef<HTMLDivElement>(null)
  const transScrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to latest text
  useEffect(() => {
    inputScrollRef.current?.scrollTo({ top: 99999, behavior: 'smooth' })
  }, [inputText])

  useEffect(() => {
    transScrollRef.current?.scrollTo({ top: 99999, behavior: 'smooth' })
  }, [translatedText])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-950 select-none">

      {/* ── Top bar ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 shrink-0">
        <button
          onClick={onClose}
          className="text-white/40 hover:text-white/70 transition-colors text-sm flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Выход
        </button>

        <span className="text-white/50 text-xs font-medium tracking-widest uppercase">
          Conversation Mode
        </span>

        {/* Direction switch */}
        <button
          onClick={onToggleDir}
          disabled={isRecording || isProcessing}
          className="text-xs font-mono px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white/70 transition-all disabled:opacity-30"
        >
          {cfg.flag_from} ⇄ {cfg.flag_to}
        </button>
      </div>

      {/* ── Speaker A — Source ──────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden border-b-2 border-white/10">
        {/* Zone header */}
        <div className="shrink-0 px-5 pt-4 pb-2 flex items-center gap-2">
          <span className="text-2xl">{cfg.flag_from}</span>
          <span className="text-white/40 text-xs font-medium uppercase tracking-wider">
            {cfg.source}
          </span>
          {isRecording && (
            <span className="ml-auto flex items-center gap-1.5 text-red-400 text-xs">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Запись...
            </span>
          )}
          {isProcessing && (
            <span className="ml-auto text-yellow-400/70 text-xs animate-pulse">
              Обработка...
            </span>
          )}
        </div>

        {/* Source text */}
        <div
          ref={inputScrollRef}
          className="flex-1 overflow-y-auto px-5 pb-4"
        >
          <p
            className={`
              leading-relaxed transition-all
              ${inputText
                ? 'text-white'
                : 'text-white/15 italic'
              }
            `}
            style={{ fontSize: 'clamp(1.4rem, 3.5vw, 2rem)', lineHeight: 1.5 }}
          >
            {inputText || `Говорите по-${cfg.source === 'Русский' ? 'русски' : 'английски'}...`}
          </p>
        </div>
      </div>

      {/* ── Speaker B — Translation ─────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Zone header */}
        <div className="shrink-0 px-5 pt-4 pb-2 flex items-center gap-2">
          <span className="text-2xl">{cfg.flag_to}</span>
          <span className="text-white/40 text-xs font-medium uppercase tracking-wider">
            {cfg.target}
          </span>
        </div>

        {/* Translated text */}
        <div
          ref={transScrollRef}
          className="flex-1 overflow-y-auto px-5 pb-4"
        >
          <p
            className={`leading-relaxed transition-all ${translatedText ? 'text-yellow-300' : 'text-white/10 italic'}`}
            style={{ fontSize: 'clamp(1.4rem, 3.5vw, 2rem)', lineHeight: 1.5 }}
          >
            {translatedText || '...'}
          </p>
        </div>
      </div>

      {/* ── Bottom mic bar ───────────────────────────────────── */}
      <div className="shrink-0 flex justify-center items-center py-5 border-t border-white/10 bg-gray-950/80 backdrop-blur">
        <button
          onClick={onToggleMic}
          disabled={isProcessing}
          aria-label={isRecording ? 'Остановить Recording...' : 'Начать Processing...'}
          className={`
            relative w-20 h-20 rounded-full font-bold text-3xl
            transition-all duration-200 active:scale-95
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isRecording
              ? 'bg-red-600 shadow-[0_0_0_0_rgba(239,68,68,1)] animate-[mic-pulse_1.2s_ease-out_infinite]'
              : 'bg-white/10 hover:bg-white/20 border border-white/20'
            }
          `}
        >
          {isProcessing ? (
            <svg className="w-8 h-8 mx-auto animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
              <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          ) : isRecording ? (
            '⏹'
          ) : (
            '🎤'
          )}

          {/* Pulse rings when recording */}
          {isRecording && (
            <>
              <span className="absolute inset-0 rounded-full bg-red-500 opacity-30 animate-ping" />
              <span className="absolute -inset-2 rounded-full border border-red-500/30 animate-ping" style={{ animationDelay: '0.3s' }} />
            </>
          )}
        </button>

        <p className="absolute bottom-2 text-white/20 text-[11px] text-center w-full">
          {isRecording
            ? 'Нажмите ⏹ чтобы остановить'
            : isProcessing
              ?'Processing......'
            : 'Нажмите 🎤 чтобы начать'
          }
        </p>
      </div>
    </div>
  )
}

export default ConversationMode
