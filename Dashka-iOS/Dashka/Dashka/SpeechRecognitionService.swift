// SpeechRecognitionService.swift
// Dashka iOS v1.5.3 — ignore "canceled" error on manual stop

import Foundation
import Speech
import AVFoundation

final class SpeechRecognitionService: NSObject {

    var onPartial: ((String) -> Void)?
    var onFinal:   ((String) -> Void)?
    var onError:   ((String) -> Void)?

    private var recognizer:      SFSpeechRecognizer?
    private var recognitionTask: SFSpeechRecognitionTask?
    private var recognitionReq:  SFSpeechAudioBufferRecognitionRequest?
    private let audioEngine      = AVAudioEngine()
    private var tapInstalled     = false
    private var isStarting       = false
    private var manuallyStopped  = false  // ← флаг ручной остановки

    func requestPermission() async -> Bool {
        await withCheckedContinuation { cont in
            SFSpeechRecognizer.requestAuthorization { status in
                cont.resume(returning: status == .authorized)
            }
        }
    }

    func start(locale: String) throws {
        guard !isStarting else { return }
        isStarting      = true
        manuallyStopped = false
        defer { isStarting = false }

        stopInternal(deactivateSession: true)
        Thread.sleep(forTimeInterval: 0.15)

        recognizer = SFSpeechRecognizer(locale: Locale(identifier: locale))
            ?? SFSpeechRecognizer(locale: Locale(identifier: "ru-RU"))

        guard let recognizer, recognizer.isAvailable else {
            throw SpeechError.recognizerUnavailable
        }

        let audioSession = AVAudioSession.sharedInstance()
        try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
        try audioSession.setActive(true, options: .notifyOthersOnDeactivation)

        recognitionReq = SFSpeechAudioBufferRecognitionRequest()
        guard let recognitionReq else { throw SpeechError.requestFailed }
        recognitionReq.shouldReportPartialResults  = true
        recognitionReq.requiresOnDeviceRecognition = false

        let inputNode = audioEngine.inputNode
        let format    = inputNode.outputFormat(forBus: 0)
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: format) { [weak self] buffer, _ in
            self?.recognitionReq?.append(buffer)
        }
        tapInstalled = true

        audioEngine.prepare()
        try audioEngine.start()

        recognitionTask = recognizer.recognitionTask(with: recognitionReq) { [weak self] result, error in
            guard let self else { return }

            if let result {
                let text = result.bestTranscription.formattedString
                DispatchQueue.main.async { self.onPartial?(text) }
                if result.isFinal {
                    DispatchQueue.main.async { self.onFinal?(text) }
                    self.stopInternal(deactivateSession: true)
                }
            }

            if let error {
                let nsError = error as NSError

                // Коды которые НЕ являются реальными ошибками:
                // 1110 = no-speech
                // 203  = session ended normally
                // 216  = restart race condition
                // 301  = recognition request was canceled (ручная остановка)
                let ignoredCodes = [1110, 203, 216, 301]

                // Также игнорируем если мы сами остановили
                if ignoredCodes.contains(nsError.code) || self.manuallyStopped {
                    return
                }

                // Проверяем текст ошибки — "canceled" тоже игнорируем
                let errorDesc = error.localizedDescription.lowercased()
                if errorDesc.contains("cancel") || errorDesc.contains("stopped") {
                    return
                }

                DispatchQueue.main.async { self.onError?(error.localizedDescription) }
                self.stopInternal(deactivateSession: true)
            }
        }
    }

    func stop() {
        manuallyStopped = true  // ← отмечаем что остановка ручная
        stopInternal(deactivateSession: true)
    }

    private func stopInternal(deactivateSession: Bool) {
        if audioEngine.isRunning {
            audioEngine.stop()
        }
        if tapInstalled {
            audioEngine.inputNode.removeTap(onBus: 0)
            tapInstalled = false
        }
        recognitionReq?.endAudio()
        recognitionTask?.cancel()
        recognitionReq  = nil
        recognitionTask = nil

        if deactivateSession {
            try? AVAudioSession.sharedInstance().setActive(
                false, options: .notifyOthersOnDeactivation
            )
        }
    }
}

enum SpeechError: LocalizedError {
    case recognizerUnavailable
    case requestFailed
    var errorDescription: String? {
        switch self {
        case .recognizerUnavailable: return "Speech recognizer недоступен"
        case .requestFailed:         return "Не удалось создать запрос"
        }
    }
}
