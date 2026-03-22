recognition.onresult = (event: SpeechRecognitionEvent) => {
  const { sourceLang } = DIRECTION_CONFIG[state.direction]

  // 🔥 v1.5.11 — language guard + TTS filter (внутри цикла)
  const isWrongLanguage = (text: string) => {
    if (sourceLang === 'ru-RU') return /[a-zA-Z]/.test(text)
    if (sourceLang === 'en-US') return /[а-яА-Я]/.test(text)
    return false
  }

  const isLikelyTTS = (text: string) =>
    text.length < 20 && window.speechSynthesis.speaking

  let interim = ''
  let newFinalText = ''

  for (let i = event.resultIndex; i < event.results.length; i++) {
    const transcript = event.results[i][0].transcript

    // фильтры внутри цикла — оба работают корректно
    if (isLikelyTTS(transcript) || isWrongLanguage(transcript)) continue

    if (event.results[i].isFinal) {
      newFinalText += transcript
    } else {
      interim += transcript
    }
  }

  const cleanFinal = newFinalText.trim()
  const isNewFinal = cleanFinal && cleanFinal !== lastFinalRef.current

  if (isNewFinal) {
    lastFinalRef.current = cleanFinal
    finalTextRef.current = (finalTextRef.current + ' ' + cleanFinal).trim()
  }

  const display = (finalTextRef.current + (interim ? ' ' + interim.trim() : '')).trim()
  set({ inputText: display })

  if (isNewFinal && cleanFinal.length > 2) {
    const now = Date.now()
    if (now - lastTranslateTimeRef.current > 300) {
      bufferRef.current += (bufferRef.current ? ' ' : '') + cleanFinal
      translatePartial(cleanFinal)
      lastTranslateTimeRef.current = now
    }
  }
}