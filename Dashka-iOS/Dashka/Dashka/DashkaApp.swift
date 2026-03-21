// DashkaApp.swift
// Entry point

import SwiftUI

@main
struct DashkaApp: App {
    var body: some Scene {
        WindowGroup {
            TranslatorScreen()
                .preferredColorScheme(.dark)
        }
    }
}
