// dashka-chat/web/src/feature/english/EnglishScreen.tsx
// v1.2 → v1.5 — Conversation Mode Upgrade
//
// New vs v1.1:
//   + DirectionToggle (RU⇄DE)
//   + ConversationMode full-screen
//   + MicState machine (Idle|Recording|Processing)
//   + Pulsing red mic during recording

import React from 'react'
import { useEnglishTranslator } from './useEnglishTranslator'
import DirectionToggle from './DirectionToggle'
import ConversationMode from './ConversationMode'
import SubtitleOverlay from './components/SubtitleOverlay'

const EnglishScreen: React.FC = () => {
  const {
    inputText,
    translatedText,
    isTranslating,
    micState,
    backendAwake,
    error,
    direction,
    conversationMode,
    overlayMode,
    directionConfig,
    wakeUp,
    translate,
    toggleMic,
    toggleDirection,
    toggleConversationMode,
    toggleOverlayMode,
    clear,
    setInputText,
    copyResult,
  } = useEnglishTranslator()

  const isRecording  = micState === 'Recording'
  const isProcessing = micState === 'Processing'
  const isBusy       = isTranslating || isProcessing

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      translate()
    }
  }

  // ── Conversation Mode — full-screen overlay ───────────────
  if (conversationMode) {
    return (
      <ConversationMode
        inputText={inputText}
        translatedText={translatedText}
        micState={micState}
        direction={direction}
        onToggleMic={toggleMic}
        onToggleDir={toggleDirection}
        onClose={toggleConversationMode}
      />
    )
  }
  

  // ── Normal Mode ───────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center px-4 py-6">
      {overlayMode && (
        <SubtitleOverlay
          sourceText={inputText}
          translatedText={translatedText}
          visible={true}
        />
      )}
      <div className="w-full max-w-xl flex flex-col gap-4">

        {/* ── Header ── */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold tracking-tight">
              🇺🇸 Dashka
            </h1>
            <p className="text-gray-400 text-xs mt-0.5">
              Conversation Translator · v1.2
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleConversationMode}
              title="Conversation Mode"
              className="text-xs px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white/60 transition-all"
            >
              💬 Conv
            </button>

            <button
              onClick={toggleOverlayMode}
              title="Subtitle Overlay"
              className="text-xs px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white/60 transition-all"
            >
              🎬 Sub
            </button>
            
            {/* Status dot */}
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${backendAwake ? 'bg-green-400' : 'bg-red-500'}`} />
              <span className="text-gray-400 text-xs">
                {backendAwake ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </header>

        {/* ── Wake Up Banner ── */}
        {!backendAwake && (
          <button
            onClick={wakeUp}
            className="w-full h-12 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-95
                       text-black font-semibold text-sm transition-all shadow-lg"
          >
            ☀️ Разбудить backend
          </button>
        )}

        {/* ── Error Banner ── */}
        {error && (
          <div className="w-full rounded-2xl bg-red-900/40 border border-red-700/50 px-4 py-3
                          text-red-300 text-sm flex items-center justify-between gap-3">
            <span>{error}</span>
            <button
              onClick={wakeUp}
              className="shrink-0 text-xs bg-red-700 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Direction Toggle ── */}
        <DirectionToggle
          direction={direction}
          onToggle={toggleDirection}
          disabled={isRecording || isProcessing}
        />

        {/* ── Input Block ── */}
        <div className="w-full rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <span className="text-gray-500 text-xs font-medium uppercase tracking-wider flex items-center gap-1.5">
              <span>{directionConfig.flag_from}</span>
              {directionConfig.source}
            </span>
            <button
              onClick={clear}
              className="text-gray-600 hover:text-gray-400 text-xs transition-colors"
            >
              очистить ✕
            </button>
          </div>
          <textarea
            className="w-full bg-transparent text-white text-base px-4 pb-4 pt-1
                       resize-none focus:outline-none placeholder-gray-600 min-h-[110px]"
            placeholder={`Говорите или пишите по-${directionConfig.source === 'Русский' ? 'русски' : 'английски'}...`}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={4}
          />
          <div className="px-4 pb-3 flex justify-end">
            <span className="text-gray-700 text-xs">{inputText.length} / 5000</span>
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex gap-3">
          {/* Translate button */}
          <button
            onClick={translate}
            disabled={isBusy || !inputText.trim()}
            className="flex-1 h-12 rounded-2xl bg-yellow-400 hover:bg-yellow-300
                       disabled:opacity-40 disabled:cursor-not-allowed
                       text-black font-bold text-sm
                       active:scale-95 transition-all duration-150 shadow-md"
          >
            {isBusy ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                {isProcessing ? 'Обработка...' : 'Переводим...'}
              </span>
            ) : (
              `🔄 → ${directionConfig.target}`
            )}
          </button>

          {/* Mic button — MicState machine */}
          <button
            onClick={toggleMic}
            disabled={isProcessing}
            className={`
              relative h-12 w-14 rounded-2xl font-bold text-lg
              active:scale-95 transition-all duration-150 shadow-md
              disabled:opacity-50 disabled:cursor-not-allowed

              ${isRecording
                ? 'bg-yellow-400 hover:bg-yellow-300 text-black'
                : 'bg-gray-800 hover:bg-gray-700 text-white' 
}
            `}

            title={isRecording ? 'Нажмите ещё раз чтобы остановить' : 'Начать запись'}
          >
            {isProcessing ? (
              <svg className="w-5 h-5 mx-auto animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            ) : isRecording ? (
              '⏹'
            ) : (
              '🎤'
            )}

            {/* Pulse rings */}
            {isRecording && (
              <span className="absolute inset-0 rounded-2xl bg-red-500 opacity-30 animate-ping pointer-events-none" />
            )}
          </button>
        </div>

        {/* Mic hint */}
        {isRecording && (
          <p className="text-center text-red-400/70 text-xs animate-pulse">
            🔴 Запись идёт... нажмите ⏹ чтобы остановить
          </p>
        )}

        {/* Ctrl+Enter hint */}
        {!isRecording && (
          <p className="text-center text-gray-700 text-xs">
            Ctrl + Enter — быстрый перевод
          </p>
        )}

        {/* ── Result Block ── */}
        <div className="w-full rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <span className="text-yellow-400 text-xs font-medium uppercase tracking-wider flex items-center gap-1.5">
              <span>{directionConfig.flag_to}</span>
              {directionConfig.target}
            </span>
            

            {translatedText && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    window.speechSynthesis.cancel()
                    const u = new SpeechSynthesisUtterance(translatedText)
                    u.lang = direction === 'RU_EN' ? 'en-US' : 'ru-RU'
                    window.speechSynthesis.speak(u)
                  }}
                  className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded-lg border border-gray-700"
                >
                  🔊
                </button>
                <button
                  onClick={copyResult}
                  className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded-lg border border-gray-700"
                >
                  📋 Копировать
                </button>
              </div>
            )}
          </div>


          <div
            className={`px-4 pb-4 pt-1 min-h-[100px] text-base whitespace-pre-wrap
                        ${translatedText ? 'text-white' : 'text-gray-600 italic'}`}
          >
            {translatedText || 'Translation will appear here...'}
          </div>
        </div>

        {/* ── Footer ── */}
        <footer className="text-center text-gray-700 text-xs pb-2">
          Dashka · v1.2 · Solar Team 🚀
        </footer>

      </div>
    </div>
  )
}

export default EnglishScreen
