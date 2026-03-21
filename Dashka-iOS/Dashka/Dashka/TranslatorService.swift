// TranslatorService.swift
// Dashka iOS v1.2 — Network layer

import Foundation

enum TranslatorError: LocalizedError {
    case invalidURL
    case networkError(String)
    case decodingError(String)
    case serverError(Int)
    case emptyResponse

    var errorDescription: String? {
        switch self {
        case .invalidURL:          return "Неверный URL"
        case .networkError(let m): return "Сеть: \(m)"
        case .decodingError(let m):return "Декодирование: \(m)"
        case .serverError(let c):  return "Сервер вернул \(c)"
        case .emptyResponse:       return "Пустой ответ"
        }
    }
}

final class TranslatorService {
    static let shared = TranslatorService()

    private let baseURL = "https://dashka-api.onrender.com"
    private let session: URLSession

    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest  = 30
        config.timeoutIntervalForResource = 60
        self.session = URLSession(configuration: config)
    }

    // MARK: - Health / Wake Up
    func wakeUp() async throws -> HealthResponse {
        guard let url = URL(string: "\(baseURL)/health") else {
            throw TranslatorError.invalidURL
        }
        let (data, response) = try await session.data(from: url)
        try validateResponse(response)
        return try decode(HealthResponse.self, from: data)
    }

    // MARK: - Text translate
    // ⚠️ НЕ передаём source_language — backend определяет сам
    func translate(text: String, targetLanguage: String) async throws -> TranslateResponse {
        guard let url = URL(string: "\(baseURL)/translate") else {
            throw TranslatorError.invalidURL
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 30

        let body = TranslateRequest(text: text, target_language: targetLanguage)
        request.httpBody = try JSONEncoder().encode(body)

        let (data, response) = try await session.data(for: request)
        try validateResponse(response)
        return try decode(TranslateResponse.self, from: data)
    }

    // MARK: - Voice translate
    func translateVoice(audioURL: URL, targetLanguage: String) async throws -> TranslateResponse {
        guard let url = URL(string: "\(baseURL)/voice-translate") else {
            throw TranslatorError.invalidURL
        }
        let boundary = UUID().uuidString
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 60

        var body = Data()
        // audio file
        let audioData = try Data(contentsOf: audioURL)
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"audio\"; filename=\"recording.m4a\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: audio/m4a\r\n\r\n".data(using: .utf8)!)
        body.append(audioData)
        body.append("\r\n".data(using: .utf8)!)
        // target_language field
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"target_language\"\r\n\r\n".data(using: .utf8)!)
        body.append(targetLanguage.data(using: .utf8)!)
        body.append("\r\n".data(using: .utf8)!)
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        request.httpBody = body

        let (data, response) = try await session.data(for: request)
        try validateResponse(response)
        return try decode(TranslateResponse.self, from: data)
    }

    // MARK: - Helpers
    private func validateResponse(_ response: URLResponse) throws {
        guard let http = response as? HTTPURLResponse else { return }
        guard (200..<300).contains(http.statusCode) else {
            throw TranslatorError.serverError(http.statusCode)
        }
    }

    private func decode<T: Decodable>(_ type: T.Type, from data: Data) throws -> T {
        do {
            return try JSONDecoder().decode(type, from: data)
        } catch {
            throw TranslatorError.decodingError(error.localizedDescription)
        }
    }
}
