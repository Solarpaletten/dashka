// Models.swift
// Dashka iOS v1.2 — Data models + Enums

import Foundation

// MARK: - Direction
enum Direction {
    case ruEn
    case enRu

    var targetLanguage: String {
        switch self {
        case .ruEn: return "EN"
        case .enRu: return "RU"
        }
    }

    var sourceLang: String {
        switch self {
        case .ruEn: return "ru-RU"
        case .enRu: return "en-US"
        }
    }

    var sourceFlag: String {
        switch self {
        case .ruEn: return "🇷🇺"
        case .enRu: return "🇺🇸"
        }
    }

    var targetFlag: String {
        switch self {
        case .ruEn: return "🇺🇸"
        case .enRu: return "🇷🇺"
        }
    }

    var sourceName: String {
        switch self {
        case .ruEn: return "Русский"
        case .enRu: return "English"
        }
    }

    var targetName: String {
        switch self {
        case .ruEn: return "English"
        case .enRu: return "Русский"
        }
    }

    var label: String {
        switch self {
        case .ruEn: return "RU→EN"
        case .enRu: return "EN→RU"
        }
    }

    mutating func toggle() {
        self = self == .ruEn ? .enRu : .ruEn
    }
}

// MARK: - MicState
enum MicState {
    case idle
    case recording
    case processing
}

// MARK: - API Request/Response
struct TranslateRequest: Encodable {
    let text: String
    let target_language: String
}

struct TranslateResponse: Decodable {
    let status: String
    let original_text: String
    let translated_text: String
    let source_language: String?
    let target_language: String?
    let confidence: Double?
    let provider: String?
}

struct HealthResponse: Decodable {
    let status: String
}
