// SpeechSynthesizer.swift
// Dashka iOS — TTS EN only

import Foundation
import AVFoundation



final class SpeechSynthesizer {

    static let shared = SpeechSynthesizer()
    private let synthesizer = AVSpeechSynthesizer()
    


private init() {
    do {
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.playback, mode: .spokenAudio, options: [.duckOthers])
        try session.setActive(true)
        try session.overrideOutputAudioPort(.speaker) // 👈 форсируем динамик
        print("🔊 Audio session READY")
    } catch {
        print("❌ Audio session error:", error)
    }
}

    func speak(text: String) {
    let utterance = AVSpeechUtterance(string: text)
    utterance.voice = AVSpeechSynthesisVoice(language: "en-US")
    utterance.rate = 0.5

    synthesizer.stopSpeaking(at: .immediate)

    DispatchQueue.main.async {
        self.synthesizer.speak(utterance)
    }
}

    func stop() {
        synthesizer.stopSpeaking(at: .immediate)
    }
}