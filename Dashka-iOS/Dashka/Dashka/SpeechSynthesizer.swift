// SpeechSynthesizer.swift
// Dashka iOS v1.6 task4 — TTS fix: switch AVAudioSession to playback before speak

import Foundation
import AVFoundation

final class SpeechSynthesizer {

    static let shared = SpeechSynthesizer()
    private let synthesizer = AVSpeechSynthesizer()

    private init() {
        // 🔥 v1.6 — не настраиваем сессию в init
        // Сессия переключается динамически: .record при mic, .playback при TTS
        print("🔊 SpeechSynthesizer initialized")
    }

    func speak(text: String, language: String = "en-US") {
        guard !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            print("🔇 SPEAK: empty text, skip")
            return
        }

        // 🔥 v1.6 task4 — переключаем сессию на playback перед TTS
        // Причина: mic использует .record, TTS нужен .playback
        let session = AVAudioSession.sharedInstance()
        do {
            try session.setCategory(.playback, mode: .spokenAudio, options: [.duckOthers])
            try session.setActive(true, options: .notifyOthersOnDeactivation)
            
            if session.category != .playback {
            try? session.overrideOutputAudioPort(.speaker)
        }

            print("🔊 Audio session → playback")
        } catch {
            print("❌ Audio session switch error:", error)
        }

        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = AVSpeechSynthesisVoice(language: language)
        utterance.rate = AVSpeechUtteranceDefaultSpeechRate * 0.9

        synthesizer.stopSpeaking(at: .immediate)

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
            self.synthesizer.speak(utterance)
            print("🔊 SPEAK:", text.prefix(50))
        }
    }

    func stop() {
        synthesizer.stopSpeaking(at: .immediate)
    }

    while SpeechSynthesizer.shared.isSpeaking {
    try? await Task.sleep(nanoseconds: 100_000_000)
}
}
