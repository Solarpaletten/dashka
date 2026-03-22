🎯 ПРАВИЛЬНОЕ ДОПОЛНЕНИЕ К ТЗ (КРАТКО)
D=>C (добавка)
IMPORTANT:

Swift files are NOT in web/.

They are located in:

dashka-chat/Dashka iOS/

(or similar iOS folder in the repo)

You MUST include Swift files in audit:
- TranslatorViewModel.swift
- SpeechSynthesizer.swift

Focus on iOS TTS not working.
🔥 КОНКРЕТНАЯ ЗАДАЧА ДЛЯ SWIFT

Добавь сразу:

TASK (iOS):

Investigate why TTS (AVSpeechSynthesizer) does not produce sound on iPhone.

Check:

1. AVAudioSession category (playAndRecord vs playback)
2. Switching audio session before/after speaking
3. isSpeaking state handling
4. Interaction with microphone (recording vs playback conflict)

Provide FIX — minimal changes only.

D=>C
Now Swift files are added.

Focus ONLY on iOS.

Problem:
TTS does not work correctly on iPhone.

Investigate:

1. AVAudioSession configuration
2. Interaction between recording (mic) and playback (TTS)
3. SpeechSynthesizer.swift
4. TranslatorViewModel.swift

Goal:
Fix TTS so that:
- sound is audible
- mic does not interfere
- no echo / no blocking

IMPORTANT:
- minimal changes only
- do NOT refactor architecture
🧠 ЧТО Я ОЖИДАЮ ОТ НЕГО

Он должен прийти к одному из этих:

1. AVAudioSession неправильно настроен
2. режим .playAndRecord блокирует звук
3. нет переключения playback ↔ record

👉 и дать 3–5 строк фикса