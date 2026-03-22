🔥 ТЗ ДЛЯ CLAUDE (КРАТКО И ЧЁТКО)
🟡 1. UI — ЖЁЛТАЯ КНОПКА (ЕДИНЫЙ СТИЛЬ)
📍 Проблема:
кнопка mic и translate разного стиля
нет единообразия (не как Apple)
✅ ЗАДАЧА:

Сделать один стиль кнопок:

Primary Button (жёлтая):
- background: #FFD84D
- hover: #FFC700
- active: #FFB800
- border-radius: 12px
- height: одинаковая
- font-weight: 600
📍 Применить к:
→ English / → Русский
кнопка mic (start/stop)
⚠️ ВАЖНО:
НЕ менять логику
НЕ трогать обработчики
ТОЛЬКО стиль
🔊 2. TTS НЕ РАБОТАЕТ НА iPhone
📍 Симптом:
на desktop работает
на iPhone — нет звука
📍 Причина (ключевая):

👉 iOS Safari блокирует speechSynthesis без user gesture

✅ ЗАДАЧА:
2.1 Проверка перед speak

В speakOriginal:

if (!window.speechSynthesis) return
2.2 Добавить unlock TTS (КРИТИЧНО)

📍 при первом клике пользователя (toggleMic или translate):

const unlockTTS = () => {
  const utterance = new SpeechSynthesisUtterance(' ')
  utterance.volume = 0
  window.speechSynthesis.speak(utterance)
}

👉 вызвать ОДИН раз:

unlockTTS()
2.3 Убедиться что speak вызывается из user flow

❌ плохо:

setTimeout(() => speak())

✅ правильно:

await translate()
speak()
2.4 Проверить voice
const voice = speechSynthesis.getVoices().find(v => v.lang === lang)
utterance.voice = voice || null
2.5 iOS FIX (очень важно)

Перед speak:

speechSynthesis.cancel()
⚠️ ОГРАНИЧЕНИЯ
❌ НЕ трогать:
- recognition
- silence detection
- handleSpeechEnd
- core logic

✅ только:
- UI кнопки
- speakOriginal
🎯 ОЖИДАЕМЫЙ РЕЗУЛЬТАТ
✔ кнопки — единый стиль (как Apple)
✔ TTS работает на iPhone
✔ нет регрессии в переводе