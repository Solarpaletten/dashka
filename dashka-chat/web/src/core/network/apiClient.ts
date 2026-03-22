// core/network/apiClient.ts
// v1.5 — sourceLang parameter added, default EN
// API contract unchanged — snake_case, same endpoints

import type { TranslateResponse, HealthResponse } from '../types/translator.types'
const BASE_URL = import.meta.env.VITE_API_URL || 'https://dashka-api.onrender.com'

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    let message = `HTTP ${res.status}`
    try {
      const json = JSON.parse(text)
      if (json.message) message = json.message
    } catch { /* raw text */ }
    throw new Error(message)
  }
  return res.json() as Promise<T>
}

export const apiClient = {
  wakeUp: async (): Promise<HealthResponse> => {
    const res = await fetch(`${BASE_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(15_000)
    })
    return handleResponse<HealthResponse>(res)
  },

  // ── Text translate ─────────────────────────────────────────
  // 🔥 v1.5 — sourceLang передаётся для корректного EN→RU перевода
  translate: async (text: string, targetLang = 'EN', sourceLang?: string): Promise<TranslateResponse> => {
    const res = await fetch(`${BASE_URL}/translate`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        text:            text.trim(),
        target_language: targetLang,
        ...(sourceLang && { source_language: sourceLang }),
      }),
      signal: AbortSignal.timeout(30_000)
    })
    return handleResponse<TranslateResponse>(res)
  },

  // ── Voice translate ────────────────────────────────────────
  voiceTranslate: async (audioBlob: Blob, targetLang = 'EN'): Promise<TranslateResponse> => {
    const form = new FormData()
    form.append('audio', audioBlob, 'recording.wav')
    form.append('target_language', targetLang)
    const res = await fetch(`${BASE_URL}/voice-translate`, {
      method: 'POST',
      body:   form,
      signal: AbortSignal.timeout(60_000)
    })
    return handleResponse<TranslateResponse>(res)
  }
}
