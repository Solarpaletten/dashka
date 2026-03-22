D=>C

🚀 ТЗ: v1.6 — Apple Conversation Mode (FINAL)
Цель:
Перейти с streaming (interim/partial) на speech-cycle архитектуру (как Apple)

Результат:
mic → фраза → пауза → перевод → TTS → mic
🔥 1. ОСНОВНАЯ ИДЕЯ
❌ УБРАТЬ:
- translatePartial
- buffer accumulation
- потоковый перевод

✅ СДЕЛАТЬ:
- перевод ТОЛЬКО после паузы (silence detection)
⚙️ 2. НОВЫЕ REF

📍 добавить рядом с существующими:

const silenceTimerRef = useRef<number | null>(null)
const lastSpeechTimeRef = useRef(0)
⚙️ 3. PAUSE DETECTION

📍 внутри recognition.onresult (в начале):

lastSpeechTimeRef.current = Date.now()

if (silenceTimerRef.current) {
  clearTimeout(silenceTimerRef.current)
}

silenceTimerRef.current = window.setTimeout(() => {
  handleSpeechEnd()
}, 900)
⚙️ 4. handleSpeechEnd (КЛЮЧЕВОЕ)
const handleSpeechEnd = async () => {
  const text = finalTextRef.current.trim()
  if (!text) return

  const recognition = recognitionRef.current
  if (!recognition) return

  // 1. остановить mic
  recognition.stop()

  // 2. перевести ВСЮ фразу
  await translate(text)

  // 3. озвучка перевода
  const { targetLang } = DIRECTION_CONFIG[state.direction]
  const lang = targetLang === 'EN' ? 'en-US' : 'ru-RU'

  speakOriginal(translatedBufferRef.current, lang)

  // 4. ждать окончания TTS
  const waitForTTS = setInterval(() => {
    if (!window.speechSynthesis.speaking) {
      clearInterval(waitForTTS)

      // reset
      finalTextRef.current = ''
      lastFinalRef.current = ''

      // 5. снова включить mic
      recognitionRef.current?.start()
    }
  }, 100)
}
⚙️ 5. УДАЛИТЬ СТАРУЮ ЛОГИКУ

❌ полностью удалить:

translatePartial(...)
bufferRef.current += ...

❌ убрать вызовы translatePartial из onresult

⚙️ 6. В onresult ОСТАВИТЬ

✔ только:

- сбор finalTextRef
- фильтры (isLikelyTTS / isWrongLanguage)
- set(inputText)

❌ НЕ делать перевод внутри onresult

⚠️ 7. ВАЖНЫЕ ПРАВИЛА
1. НЕ использовать recognition из замыкания → только recognitionRef.current
2. НЕ вызывать TTS во время Recording
3. НЕ смешивать streaming и speech-cycle
✅ 8. КРИТЕРИЙ ГОТОВНОСТИ
1. Пользователь говорит фразу
2. Делает паузу (~1 сек)
3. Система:
   → останавливает mic
   → переводит ВСЮ фразу
   → озвучивает
   → снова включает mic
🧪 9. ТЕСТ СЦЕНАРИЙ
Input:
"Привет как дела я хочу заключить контракт..."

Ожидание:
- НЕ режет фразу
- НЕ теряет слова
- НЕ переводит кусками
- НЕТ echo
🚀 10. КОМАНДА
git add .
git commit -m "feat: v1.6 Apple-style conversation mode (pause → translate → TTS)"
git push origin main
💬 D=>C
Это не рефакторинг.
Это смена архитектуры.

После этого:
→ исчезают 90% багов
→ UX становится как Apple
💬 D=>L

Готово. Это чистое, финальное ТЗ без шума.

👉 После реализации ты сразу почувствуешь разницу:
“это уже не демо — это продукт” 🚀