// TranslatorScreen.swift
// Dashka iOS v1.2 — Main SwiftUI View

import SwiftUI

struct TranslatorScreen: View {
    @StateObject private var vm = TranslatorViewModel()

    var body: some View {
        ZStack {
            Color(hex: "#111827").ignoresSafeArea()

            ScrollView {
                VStack(spacing: 16) {
                    HeaderView(vm: vm)
                    if !vm.backendAwake { WakeUpBanner(vm: vm) }
                    if let err = vm.errorMessage { ErrorBanner(message: err, vm: vm) }
                    DirectionToggleView(vm: vm)
                    InputBlock(vm: vm)
                    ActionButtons(vm: vm)
                    ResultBlock(vm: vm)
                    FooterView()
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 24)
            }
        }
    }
}

// MARK: - Header
private struct HeaderView: View {
    @ObservedObject var vm: TranslatorViewModel
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text("🇺🇸 Dashka").font(.title2.bold()).foregroundColor(.white)
                Text("Conversation Translator · v1.2").font(.caption).foregroundColor(.gray)
            }
            Spacer()
            Circle()
                .fill(vm.backendAwake ? Color.green : Color.red)
                .frame(width: 10, height: 10)
            Text(vm.backendAwake ? "Online" : "Offline")
                .font(.caption).foregroundColor(.gray)
        }
    }
}

// MARK: - Wake Up Banner
private struct WakeUpBanner: View {
    @ObservedObject var vm: TranslatorViewModel
    var body: some View {
        Button {
            Task { await vm.wakeUp() }
        } label: {
            Text("☀️ Разбудить backend")
                .font(.subheadline.bold())
                .frame(maxWidth: .infinity)
                .frame(height: 48)
                .background(Color.orange)
                .foregroundColor(.black)
                .cornerRadius(16)
        }
    }
}

// MARK: - Error Banner
private struct ErrorBanner: View {
    let message: String
    @ObservedObject var vm: TranslatorViewModel
    var body: some View {
        HStack {
            Text(message).font(.caption).foregroundColor(Color(hex: "#FCA5A5"))
            Spacer()
            Button("Retry") { Task { await vm.wakeUp() } }
                .font(.caption.bold())
                .padding(.horizontal, 10).padding(.vertical, 6)
                .background(Color(hex: "#7F1D1D"))
                .foregroundColor(.white)
                .cornerRadius(8)
        }
        .padding(12)
        .background(Color(hex: "#450A0A"))
        .cornerRadius(16)
    }
}

// MARK: - Direction Toggle
private struct DirectionToggleView: View {
    @ObservedObject var vm: TranslatorViewModel
    var body: some View {
        Button {
            vm.toggleDirection()
        } label: {
            HStack {
                HStack(spacing: 6) {
                    Text(vm.direction.sourceFlag).font(.title3)
                    Text(vm.direction.sourceName)
                        .font(.subheadline.bold()).foregroundColor(.white)
                }
                Spacer()
                VStack(spacing: 2) {
                    Image(systemName: vm.direction == .ruEn ? "arrow.right" : "arrow.left")
                        .foregroundColor(vm.direction == .ruEn ? .blue : .indigo)
                        .font(.system(size: 16, weight: .bold))
                    Text(vm.direction.label)
                        .font(.system(size: 10, design: .monospaced))
                        .foregroundColor(.white.opacity(0.3))
                }
                Spacer()
                HStack(spacing: 6) {
                    Text(vm.direction.targetName)
                        .font(.subheadline.bold()).foregroundColor(.white)
                    Text(vm.direction.targetFlag).font(.title3)
                }
            }
            .padding(.horizontal, 20).padding(.vertical, 12)
            .background(Color.white.opacity(0.05))
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.white.opacity(0.15)))
            .cornerRadius(16)
        }
        .disabled(vm.micState == .recording || vm.micState == .processing)
    }
}

// MARK: - Input Block
private struct InputBlock: View {
    @ObservedObject var vm: TranslatorViewModel
    @FocusState private var isFocused: Bool   // 👈 ДОБАВИТЬ (пункт 1 — управление клавиатурой)
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text(vm.direction.sourceFlag + " " + vm.direction.sourceName.uppercased())
                    .font(.caption).foregroundColor(.gray)
                Spacer()
                Button("очистить ✕") { vm.clear() }
                    .font(.caption).foregroundColor(.gray)
            }
            .padding(.horizontal, 16).padding(.top, 12).padding(.bottom, 4)

            TextEditor(text: $vm.inputText)
                .frame(minHeight: 110)
                .scrollContentBackground(.hidden)
                .background(Color.clear)
                .foregroundColor(.white)
                .font(.body)
                .padding(.horizontal, 12)
                .focused($isFocused)   // 👈 ДОБАВИТЬ (пункт 1 — управление клавиатурой)
                .onChange(of: vm.inputText) {
                vm.isFrozen = false   // 👈 ДОБАВИТЬ (пункт 4.4 — разморозка при вводе)
                isFocused = false
}

            HStack {
                Spacer()
                Text("\(vm.inputText.count) / 5000").font(.caption).foregroundColor(.gray)
            }
            .padding(.horizontal, 16).padding(.bottom, 12)
        }
        .background(Color(hex: "#111827").opacity(0.8))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color(hex: "#1F2937")))
        .cornerRadius(16)
    }
}

// MARK: - Action Buttons
private struct ActionButtons: View {
    @ObservedObject var vm: TranslatorViewModel
    private var isBusy: Bool { vm.isTranslating || vm.micState == .processing }

    var body: some View {
        HStack(spacing: 12) {
            // Translate button
            Button {                           // 👈 ДОБАВИТЬ (пункт 2 — скрытие клавиатуры при переводе)
    UIApplication.shared.sendAction(
        #selector(UIResponder.resignFirstResponder),
        to: nil,
        from: nil,
        for: nil
    )
    Task { await vm.translate() }
}
            label: {
                Group {
                    if isBusy {
                        ProgressView().tint(.black)
                    } else {
                        Text("🔄 → \(vm.direction.targetName)")
                            .font(.subheadline.bold())
                    }
                }
                .frame(maxWidth: .infinity)
                .frame(height: 48)
                .background(isBusy || vm.inputText.isEmpty ? Color.yellow.opacity(0.4) : Color.yellow)
                .foregroundColor(.black)
                .cornerRadius(16)
            }
            .disabled(isBusy || vm.inputText.isEmpty)

            // Mic button
            Button {
                Task { await vm.toggleMic() }
            } label: {
                ZStack {
                    RoundedRectangle(cornerRadius: 16)
                        .fill(vm.micState == .recording ? Color.red : Color(hex: "#1F2937"))
                        .frame(width: 56, height: 48)

                    if vm.micState == .processing {
                        ProgressView().tint(.white)
                    } else if vm.micState == .recording {
                        Text("⏹").font(.title3)
                    } else {
                        Text("🎤").font(.title3)
                    }
                }
                .overlay(
                    vm.micState == .recording
                    ? RoundedRectangle(cornerRadius: 16)
                        .stroke(Color.red.opacity(0.5), lineWidth: 2)
                        .scaleEffect(1.1)
                        .opacity(0.7)
                    : nil
                )
            }
            .disabled(vm.micState == .processing)
        }
    }
}

// MARK: - Result Block
private struct ResultBlock: View {
    @ObservedObject var vm: TranslatorViewModel
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text(vm.direction.targetFlag + " " + vm.direction.targetName.uppercased())
                    .font(.caption).foregroundColor(Color.yellow)
                Spacer()

if !vm.translatedText.isEmpty {
    HStack(spacing: 8) {

        Button {
            vm.speak()
        } label: {
            Text("🔊")
                .font(.caption)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color(hex: "#1F2937"))
                .foregroundColor(.white)
                .cornerRadius(8)
        }

        Button {
            vm.copyResult()
        } label: {
            Text(vm.didCopy ? "✅" : "📋 Копировать")
                .font(.caption)
                .padding(.horizontal, 10)
                .padding(.vertical, 4)
                .background(Color(hex: "#1F2937"))
                .foregroundColor(.white)
                .cornerRadius(8)
        }
    }
}
}  // ← закрытие внешнего HStack
        .padding(.horizontal, 16).padding(.top, 12).padding(.bottom, 4)


            Text(vm.translatedText.isEmpty ? "Перевод появится здесь..." : vm.translatedText)
                .font(.body)
                .foregroundColor(vm.translatedText.isEmpty ? .gray.opacity(0.3) : .white) // 👈 пункт 5.4
                .italic(vm.translatedText.isEmpty)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 16)
                .padding(.bottom, 16)
                .transition(.opacity.combined(with: .scale)) // 👈 пункт 5.3
                

        }
        .frame(minHeight: 100, alignment: .topLeading)
        .background(Color(hex: "#111827").opacity(0.8))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color(hex: "#1F2937")))
        .cornerRadius(16)
        .animation(.easeInOut(duration: 0.2), value: vm.translatedText) // 👈 5.2
        .id(vm.isFrozen) // 👈 5.5
    }
}

// MARK: - Footer
private struct FooterView: View {
    var body: some View {
        Text("Dashka · v1.2 · Solar Team 🚀")
            .font(.caption2).foregroundColor(.gray.opacity(0.5))
    }
}

// MARK: - Color Extension
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r = Double((int >> 16) & 0xFF) / 255
        let g = Double((int >> 08) & 0xFF) / 255
        let b = Double((int >> 00) & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }
}


