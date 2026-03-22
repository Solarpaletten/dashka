📋 ФИНАЛЬНОЕ ТЗ ДЛЯ CLAUDE (без риска сломать)
D=>C

ЗАДАЧА: PASSIVE AUDIT (NO CODE CHANGES)

❗ ВАЖНО:

НЕ менять код
НЕ предлагать рефакторинг
НЕ переписывать функции

ТОЛЬКО анализ

1. WEB (Translator)

Проверить:

useEnglishTranslator.ts
apiClient.ts
speech flow
Найти:
возможные race conditions
лишние вызовы translate
проблемы с recognitionRef
TTS lifecycle edge cases
потенциальные утечки state
2. FLOW VALIDATION

Подтвердить, что архитектура:

Speech → Silence → Translate → TTS → Delay → Restart mic

работает корректно и стабильно

3. SWIFT (ОЧЕНЬ ВАЖНО)

Сделать анализ:

👉 как перенести эту же архитектуру в iOS

Нужно:
описать mapping:
Web Speech API → AVAudioEngine
speechSynthesis → AVSpeechSynthesizer
pause detection (таймер)
restart logic
echo protection
4. OUTPUT

Claude должен вернуть:

1. Audit report (коротко, по делу)
2. Risk list (что может сломаться)
3. Swift plan (структура, не код)