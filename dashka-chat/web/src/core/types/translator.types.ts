// core/types/translator.types.ts
// v1.2 — Conversation Mode Upgrade
// ⚠️ API contract FROZEN — только UI/state расширения 
// Direction = 'RU_EN' | 'EN_RU'

// ── Direction ────────────────────────────────────────────────
export type Direction = 'RU_EN' | 'EN_RU' 

export const DIRECTION_CONFIG: Record<Direction, {
  source: string
  target: string
  label: string
  sourceLang: string   // for SpeechRecognition.lang
  targetLang: string   // for /translate target_language
  flag_from: string
  flag_to: string
}> = {
  RU_EN: {
    source: 'Русский',
    target: 'English',
    label: 'RU → EN',
    sourceLang: 'ru-RU',
    sourceLangCode: 'RU',
    targetLang: 'EN',
    flag_from: '🇷🇺',
    flag_to: '🇺🇸',
  },
  EN_RU: {
    source: 'English',
    target: 'Русский',
    label: 'EN → RU',
    sourceLang: 'en-US',
    sourceLangCode: 'EN',
    targetLang: 'RU',
    flag_from: '🇺🇸',
    flag_to: '🇷🇺',
  },  
}

// ── Mic State Machine ────────────────────────────────────────
export type MicState = 'Idle' | 'Recording' | 'Processing'

// ── Full Translator State ─────────────────────────────────────
export interface TranslatorState {
  // Core
  inputText:      string
  translatedText: string
  isTranslating:  boolean
  backendAwake:   boolean
  error:          string | null
  // v1.2
  direction:      Direction
  micState:       MicState
  conversationMode: boolean
  overlayMode:    boolean
}

// ── API types (FROZEN) ────────────────────────────────────────
export interface TranslateResponse {
  status:           'success' | 'error'
  original_text:    string
  translated_text:  string
  source_language:  string
  target_language:  string
  confidence:       number
  processing_time:  number
  from_cache:       boolean
}

export interface HealthResponse {
  status: string
  uptime?: number
}
