// SpeechSynthesizer.swift
// Dashka iOS — TTS EN only

import Foundation
import AVFoundation

final class SpeechSynthesizer {

    static let shared = SpeechSynthesizer()
    private let synthesizer = AVSpeechSynthesizer()
    private init() {}

    func speak(text: String) {
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = AVSpeechSynthesisVoice(language: "en-US") // 👈 только EN
        utterance.rate = 0.5
        utterance.pitchMultiplier = 1.0
        synthesizer.stopSpeaking(at: .immediate)
        synthesizer.speak(utterance)
    }

    func stop() {
        synthesizer.stopSpeaking(at: .immediate)
    }
}