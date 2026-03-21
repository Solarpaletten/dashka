import { useState, useCallback, useEffect, useRef } from 'react'
import { apiClient } from '../../core/network/apiClient'
import {
  type TranslatorState,
  DIRECTION_CONFIG,
} from '../../core/types/translator.types'


const INITIAL: TranslatorState = {
  inputText: '',
  translatedText: '',
  isTranslating: false,
  backendAwake: false,
  error: null,
  direction: 'RU_EN',
  micState: 'Idle',
  conversationMode: false,
  overlayMode: false,
}

export function useEnglishTranslator() {
  const [state, setState] = useState<TranslatorState>(INITIAL)

  const bufferRef = useRef('')
  const lastTranslateTimeRef = useRef(0)
  const lastFinalRef = useRef('')

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const mediaRecRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const set = useCallback((partial: Partial<TranslatorState>) =>
    setState(prev => ({ ...prev, ...partial })), [])

  // 🔥 v1.2.1 — TTS оригинала: cancel() только своей очереди, не трогает перевод
  const speakOriginal = useCallback((text: string, lang: string) => {
    if (!text.trim()) return

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel()
    }
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = 0.95
    window.speechSynthesis.speak(utterance)
  }, [])

  useEffect(() => { wakeUp() }, [])

  const wakeUp = useCallback(async () => {
    set({ error: null })
    try {
      await apiClient.wakeUp()
      set({ backendAwake: true })
    } catch {
      set({ backendAwake: false, error: 'Backend недоступен. Нажмите ☀️' })
    }
  }, [])

  const translate = useCallback(async (textOverride?: string) => {
    const text = (textOverride ?? state.inputText).trim()
    if (!text) return
    const { targetLang } = DIRECTION_CONFIG[state.direction]
    set({ isTranslating: true, error: null })
    try {
      const res = await apiClient.translate(text, targetLang)
      set({ translatedText: res.translated_text, backendAwake: true })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Ошибка перевода' })
    } finally {
      set({ isTranslating: false })
    }
  }, [state.direction])

  // direction в deps — пересоздаётся при смене направления
  const translatePartial = useCallback(async (text: string) => {
    if (!text.trim()) return
    const { targetLang } = DIRECTION_CONFIG[state.direction]
    try {
      const res = await apiClient.translate(text, targetLang)
      // 🔥 v1.2.1 — заменяем перевод, не копим "портянку"
      set({ translatedText: res.translated_text })
    } catch {
    }
  }, [state.direction])


  const toggleDirection = useCallback(() => {

    bufferRef.current = ''
    lastTranslateTimeRef.current = 0
    lastFinalRef.current = ''   // 👈 ДОБАВИТЬ

    setState(prev => ({
      ...prev,
      direction: prev.direction === 'RU_EN' ? 'EN_RU' : 'RU_EN',
      inputText: '',
      translatedText: '',
      error: null,
    }))
  }, [])

  const toggleMic = useCallback(async () => {
    const { micState, direction } = state

    if (micState !== 'Recording') {
      bufferRef.current = ''
      lastTranslateTimeRef.current = 0
      lastFinalRef.current = ''   // 👈 ДОБАВИТЬ
    }

    if (micState === 'Recording') {
      recognitionRef.current?.stop()
      mediaRecRef.current?.stop()
      set({ micState: 'Processing' })
      return
    }


    if (micState === 'Processing') return

    const { sourceLang } = DIRECTION_CONFIG[direction]

    const SpeechRecognitionClass: (new () => SpeechRecognition) | undefined =
      window.SpeechRecognition ?? window.webkitSpeechRecognition

    if (SpeechRecognitionClass) {
      const recognition = new SpeechRecognitionClass()
      recognition.lang = sourceLang
      recognition.continuous = true
      recognition.interimResults = true

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalText = ''
        let interim = ''

        for (let i = 0; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalText += transcript + ' '
          } else {
            interim += transcript
          }
        }

        const display = (finalText + interim).trim()
        set({ inputText: display })

        // 🔥 v1.2.1 — мгновенное воспроизведение оригинала (только finalText)
        const cleanFinal = finalText.trim().toLowerCase()

        if (cleanFinal && cleanFinal !== lastFinalRef.current) {
          const { sourceLang } = DIRECTION_CONFIG[state.direction]

          speakOriginal(finalText.trim(), sourceLang)

          bufferRef.current += ' ' + finalText
          lastFinalRef.current = cleanFinal
        }

        // 🔥 v1.2.1 — порог 8 символов / 600ms вместо 15 / 1000ms
        const now = Date.now()

        if (
          bufferRef.current.length > 8 &&
          now - lastTranslateTimeRef.current > 600
        ) {
          const textToTranslate = bufferRef.current.trim()

          translatePartial(textToTranslate)

          bufferRef.current = ''
          lastTranslateTimeRef.current = now
        }
      }

      recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
        if (e.error === 'no-speech') return
        set({ micState: 'Idle', error: `Ошибка микрофона: ${e.error}` })
      }

      recognitionRef.current = recognition
      recognition.start()
      set({ micState: 'Recording', error: null })

    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        audioChunksRef.current = []

        const recorder = new MediaRecorder(stream)
        recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data)

        recorder.onstop = async () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
          stream.getTracks().forEach(t => t.stop())
          set({ micState: 'Processing' })
          try {
            const res = await apiClient.voiceTranslate(blob)
            set({
              inputText: res.original_text,
              translatedText: res.translated_text,
              micState: 'Idle',
            })
          } catch (e) {
            set({
              error: e instanceof Error ? e.message : 'Ошибка голосового перевода',
              micState: 'Idle',
            })
          }
        }

        mediaRecRef.current = recorder
        recorder.start()
        set({ micState: 'Recording', error: null })

      } catch {
        set({ error: 'Нет доступа к микрофону', micState: 'Idle' })
      }
    }
  }, [state.micState, state.direction, state.inputText])

  useEffect(() => {
    if (state.micState === 'Processing' && recognitionRef.current) {
      translate(state.inputText).finally(() => set({ micState: 'Idle' }))
    }
  }, [state.micState])

  const toggleConversationMode = useCallback(() => {

    setState(prev => ({
      ...prev,
      conversationMode: !prev.conversationMode,
    }))

  }, [])

  const clear = useCallback(() => {
    bufferRef.current = ''
    lastTranslateTimeRef.current = 0
    lastFinalRef.current = ''
    window.speechSynthesis.cancel()  // 🔥 v1.2.1 — сброс аудио при clear
    set({ inputText: '', translatedText: '', error: null })
  }, [])

  const setInputText = useCallback((text: string) => {
    set({ inputText: text })
  }, [])

  const copyResult = useCallback(() => {
    if (state.translatedText)
      navigator.clipboard.writeText(state.translatedText).catch(() => { })
  }, [state.translatedText])

  const toggleOverlayMode = () => {
    setState(prev => ({
      ...prev,
      overlayMode: !prev.overlayMode,
    }))
  }

  return {
    ...state,
    isRecording: state.micState === 'Recording',
    wakeUp,
    translate: () => translate(),
    toggleMic,
    toggleDirection,
    toggleConversationMode,
    clear,
    setInputText,
    copyResult,
    overlayMode: state.overlayMode,
    toggleOverlayMode,
    directionConfig: DIRECTION_CONFIG[state.direction],
  }
}
