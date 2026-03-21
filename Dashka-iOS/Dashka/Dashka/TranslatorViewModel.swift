// TranslatorViewModel.swift
// Dashka iOS v1.5 — MVVM ViewModel
// Live speech → partial text → debounce → translate

import Foundation
import UIKit
import Combine

@MainActor
final class TranslatorViewModel: ObservableObject {

    // MARK: - Published State
    @Published var inputText:      String   = ""
    @Published var translatedText: String   = ""
    @Published var direction:      Direction = .ruEn
    @Published var micState:       MicState  = .idle
    @Published var isTranslating:  Bool     = false
    @Published var backendAwake:   Bool     = false
    @Published var errorMessage:   String?  = nil
    @Published var isFrozen: Bool = false  // 👈 ДОБАВИТЬ (пункт 4.1 — состояние freeze результата)

    // MARK: - Services
    private let service  = TranslatorService.shared
    private let speech   = SpeechRecognitionService()  // ← v1.5 live speech
    private let recorder = AudioRecorderService()       // ← fallback для voice upload

    // MARK: - Combine
    private var cancellables = Set<AnyCancellable>()

    // MARK: - Init
    init() {
        Task { await wakeUp() }
        setupRealtimeTranslation()
        setupSpeechCallbacks()
    }

    // MARK: - Realtime translation (Combine debounce на inputText)
    private func setupRealtimeTranslation() {
        $inputText
            .debounce(for: .milliseconds(500), scheduler: RunLoop.main)
            .removeDuplicates()
            .sink { [weak self] text in
                guard let self else { return }
                let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
                 guard !trimmed.isEmpty, !self.isTranslating, !self.isFrozen else { return }  // 👈 ДОБАВИТЬ (пункт 4.3 — отключение авто-перевода при freeze)
                Task { await self.translatePartial(trimmed) }
            }
            .store(in: &cancellables)
    }

    // MARK: - Speech Recognition callbacks
    private func setupSpeechCallbacks() {
        // Каждый partial результат → inputText → Combine debounce → translatePartial
        speech.onPartial = { [weak self] text in
            Task { @MainActor in
                self?.inputText = text
            }
        }

        // Финальный результат → запускаем полный перевод
        speech.onFinal = { [weak self] text in
            Task { @MainActor in
                guard let self else { return }
                self.inputText = text
                self.micState  = .idle
            }
        } // 👈 ДОБАВИТЬ (пункт 6.1 — убираем финальный translate, работаем через partial)

        speech.onError = { [weak self] error in
            Task { @MainActor in
                guard let self else { return }
                // Не показываем no-speech как ошибку
                if !error.contains("1110") {
                    self.errorMessage = error
                }
                self.micState = .idle
            }
        }
    }

    // MARK: - Wake Up
    func wakeUp() async {
        errorMessage = nil
        do {
            _ = try await service.wakeUp()
            backendAwake = true
        } catch {
            backendAwake = false
            errorMessage = "Backend недоступен"
        }
    }

    // MARK: - Full translate (кнопка)
    func translate() async {
        let text = inputText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        isFrozen = true   // 👈 добавить (пункт 4.2)

        

        let target = direction.targetLanguage
        isTranslating = true
        errorMessage  = nil
        do {
            let res = try await service.translate(text: text, targetLanguage: target)
            translatedText = res.translated_text
            backendAwake   = true
        } catch {
            errorMessage = error.localizedDescription
        }
        isTranslating = false

if errorMessage != nil {
    isFrozen = false   // 👈 ДОБАВИТЬ (пункт 4.5 — разморозка при ошибке)
}

if errorMessage == nil {
    UIApplication.shared.sendAction(
        #selector(UIResponder.resignFirstResponder),
        to: nil,
        from: nil,
        for: nil
    )
} // 👈 ДОБАВИТЬ (пункт 5.1 — закрывать только при успешном переводе)

        
    
    }


    // MARK: - Partial translate (silent, no loading state)

    private func translatePartial(_ text: String) async {
    let target = direction.targetLanguage
    do {
        let res = try await service.translate(text: text, targetLanguage: target)
        let newText = res.translated_text
        guard !newText.isEmpty else { return }        // 👈 6.4
        guard newText != self.translatedText else { return } // 👈 6.3
        try? await Task.sleep(nanoseconds: 50_000_000)
        self.translatedText = newText                 // 👈 6.2 — всегда обновляем
    } catch { }
}


    // MARK: - Direction Toggle
    func toggleDirection() {
        direction.toggle()
        inputText      = ""
        translatedText = ""
        errorMessage   = nil
        speech.stop()
        if micState != .idle { micState = .idle }
    }

    // MARK: - Mic State Machine
    func toggleMic() async {
        switch micState {
        case .idle:
            await startLiveSpeech()
        case .recording:
            stopLiveSpeech()
        case .processing:
            break
        }
    }

    // MARK: - Live Speech (v1.5)
    private func startLiveSpeech() async {
        // 1. Проверяем разрешение
        let allowed = await speech.requestPermission()
        guard allowed else {
            errorMessage = "Нет доступа к распознаванию речи"
            return
        }

        // 2. Запускаем SFSpeechRecognizer
        do {
            try speech.start(locale: direction.sourceLang)
            micState     = .recording
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
            micState     = .idle
        }
    }

    private func stopLiveSpeech() {
        speech.stop()
        // onFinal callback сам переведёт и установит micState = .idle
        // Если нет финального — просто останавливаем
        if micState == .recording {
            micState = .idle
            }
    } // 👈 ДОБАВИТЬ (пункт 6.1 — не вызываем translate при остановке, partial уже всё сделал)
    

    // MARK: - Helpers
    func clear() {
        inputText      = ""
        translatedText = ""
        errorMessage   = nil
        speech.stop()
        micState = .idle
    }

    func copyResult() {
        UIPasteboard.general.string = translatedText
    }

    func speak() {
    guard !translatedText.isEmpty else { return }
    SpeechSynthesizer.shared.speak(text: translatedText)
    // 👈 ДОБАВИТЬ (voice — озвучка EN)
   }
}
