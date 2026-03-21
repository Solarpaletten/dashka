// AudioRecorderService.swift
// Dashka iOS v1.2 — AVAudioRecorder wrapper

import Foundation
import AVFoundation
import Combine

final class AudioRecorderService: NSObject, ObservableObject {
    private var recorder: AVAudioRecorder?
    private var recordingURL: URL?

    var onFinished: ((URL?) -> Void)?

    func requestPermission() async -> Bool {
        await AVAudioApplication.requestRecordPermission()
    }

    func start(locale: String) throws -> URL {
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.playAndRecord, mode: .default, options: .defaultToSpeaker)
        try session.setActive(true)

        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent(UUID().uuidString + ".m4a")

        let settings: [String: Any] = [
            AVFormatIDKey:            Int(kAudioFormatMPEG4AAC),
            AVSampleRateKey:          16000,
            AVNumberOfChannelsKey:    1,
            AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
        ]

        recorder = try AVAudioRecorder(url: url, settings: settings)
        recorder?.delegate = self
        recorder?.record()
        recordingURL = url
        return url
    }

    func stop() {
        recorder?.stop()
    }

    func cancel() {
        recorder?.stop()
        if let url = recordingURL {
            try? FileManager.default.removeItem(at: url)
        }
        recordingURL = nil
    }
}

extension AudioRecorderService: AVAudioRecorderDelegate {
    func audioRecorderDidFinishRecording(_ recorder: AVAudioRecorder, successfully flag: Bool) {
        onFinished?(flag ? recordingURL : nil)
    }
}
