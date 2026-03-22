//dashka-chat/web/src/feature/english/useEnglishTranslator.ts


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

  const bufferRef = useRef('') // 4 task
  const translatedBufferRef = useRef('')
  const lastTranslateTimeRef = useRef(0)
  const lastFinalRef = useRef('')
  const isPartialInFlightRef = useRef(false)  // 🔥 v1.2.3

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const mediaRecRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const set = useCallback((partial: Partial<TranslatorState>) =>
    setState(prev => ({ ...prev, ...partial })), [])

  // 🔥 v1.2.1 — TTS оригинала: cancel() только своей очереди, не трогает перевод
  const speakOriginal = useCallback((text: string, lang: string) => {
    if (!text.trim()) return

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = 0.95

    window.speechSynthesis.speak(utterance) // task3 fix TTS
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
    const { targetLang, sourceLangCode } = DIRECTION_CONFIG[state.direction]
    set({ isTranslating: true, error: null })
    try {

      const res = await apiClient.translate(text, targetLang, sourceLangCode)  // task2 fix sourceLangCode
      
      translatedBufferRef.current = res.translated_text

      set({
        translatedText: translatedBufferRef.current,
        backendAwake: true
      })

    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Ошибка перевода' })
    } finally {
      set({ isTranslating: false })
    }
  }, [state.direction])

  // direction в deps — пересоздаётся при смене направления
  const translatePartial = useCallback(async (text: string) => {
    if (!text.trim()) return
    if (isPartialInFlightRef.current) return  // 🔥 v1.2.3
    const { targetLang, sourceLangCode } = DIRECTION_CONFIG[state.direction]
    isPartialInFlightRef.current = true
    try {

      const res = await apiClient.translate(text, targetLang, sourceLangCode) // task2 fix sourceLangCode
      
      translatedBufferRef.current += (translatedBufferRef.current ? ' ' : '') + res.translated_text // 1 task

      set({ translatedText: translatedBufferRef.current }) 

      // 🔥 v1.2.4 — озвучиваем ПЕРЕВОД (targetLang), не оригинал
      
      const targetSpeechLang = targetLang === 'EN' ? 'en-US' : 'ru-RU'
      speakOriginal(res.translated_text, targetSpeechLang)
    } catch {
    } finally {
      isPartialInFlightRef.current = false
    }
  }, [state.direction])


  const toggleDirection = useCallback(() => {

    bufferRef.current = ''
    translatedBufferRef.current = ''
    lastTranslateTimeRef.current = 0
    lastFinalRef.current = ''

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

    if (micState === 'Idle') {  // 🔥 v1.5 task6 — reset only on fresh start
      bufferRef.current = ''
      lastTranslateTimeRef.current = 0
      lastFinalRef.current = ''   // 👈 ДОБАВИТЬ
    }

    if (micState === 'Recording') {
      recognitionRef.current?.stop()
      recognitionRef.current = null

      mediaRecRef.current?.stop()

      set({ micState: 'Idle' }) // 🔥 сразу Idle

      return
    }                                  // task5 toggleMic 


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
        // 🔥 v1.2.4 — читаем ТОЛЬКО новые результаты начиная с event.resultIndex
        // event.results содержит ВСЮ историю — перебирать с 0 = дубли
        let newFinalText = ''
        let interim = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            newFinalText += transcript + ' '
          } else {
            interim += transcript
          }
        }

        // UI: показываем весь накопленный финал + текущий interim
        const allFinal = Array.from(event.results)
          .filter(r => r.isFinal)
          .map(r => r[0].transcript)
          .join(' ')
        set({ inputText: (allFinal + ' ' + interim).trim() })

        // TTS + buffer: только НОВЫЙ финальный текст
        const cleanFinal = newFinalText.trim().toLowerCase()

        if (cleanFinal && cleanFinal !== lastFinalRef.current) {
          lastFinalRef.current = cleanFinal
        }

        // Перевод: отправляем буфер если достаточно текста и не в полёте
        const now = Date.now()

        if (
          newFinalText.trim().length > 2 &&
          now - lastTranslateTimeRef.current > 600
        ) {
          const newChunk = newFinalText.trim()

          bufferRef.current += (bufferRef.current ? ' ' : '') + newChunk // task2 add bufferRef.current +=

          if (newChunk) {
            translatePartial(newChunk)
          }

          lastTranslateTimeRef.current = now
        }

      } // 1 task length > 2 && 

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

  // task4 delete f (state.micState === 'Processing'

  const toggleConversationMode = useCallback(() => {

    setState(prev => ({
      ...prev,
      conversationMode: !prev.conversationMode,
    }))

  }, [])

  

  const clear = useCallback(() => {
    bufferRef.current = ''
    translatedBufferRef.current = '' 
    lastTranslateTimeRef.current = 0
    lastFinalRef.current = ''

    window.speechSynthesis.cancel()

    set({
      inputText: '',
      translatedText: '',
      error: null
    })
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
