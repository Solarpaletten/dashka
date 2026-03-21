// backend/src/services/unifiedTranslationService.js
// v1.0.2 — FIX: auto-detect source language, fix voice transcript bug
'use strict';

const OpenAI = require('openai');
const { transcribeAudio } = require('./whisperService');
const { speakText } = require('./textToSpeechService');
const logger = require('../utils/logger');

class UnifiedTranslationService {
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      logger.error('[UnifiedTranslationService] OPENAI_API_KEY не установлен.');
      this.openai = null;
    } else {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }

    this.supportedLanguages = {
      'EN': { name: 'English',    flag: '🇺🇸', code: 'en' },
      'RU': { name: 'Русский',    flag: '🇷🇺', code: 'ru' },
    };

    logger.info(`[UnifiedTranslationService] Инициализирован. OpenAI: ${this.openai ? 'OK' : 'DISABLED'}`);
  }

  _requireOpenAI() {
    if (!this.openai) {
      const err = new Error('OPENAI_API_KEY not configured');
      err.statusCode = 503;
      throw err;
    }
  }

  getSupportedLanguages() {
    return Object.entries(this.supportedLanguages).map(([code, cfg]) => ({
      code,
      name: cfg.name,
      flag: cfg.flag,
      nativeName: cfg.name
    }));
  }

  // Определяет язык текста через GPT
  async _detectLanguage(text) {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              `You are a language detection expert. ` +
              `Analyze the text and respond with ONLY the ISO language code from this list: ` +
              `EN, RU, DE, FR, ES, CS, PL, LT, LV, NO.\n` +
              `Examples:\n"Hello world" → EN\n"Привет мир" → RU\n"Guten Tag" → DE\n` +
              `Respond with ONLY the 2-letter code, nothing else.`
          },
          { role: 'user', content: text.substring(0, 500) }
        ],
        max_tokens: 5,
        temperature: 0.0
      });

      const code = response.choices[0]?.message?.content?.trim().toUpperCase();
      if (this.supportedLanguages[code]) return code;

      // fuzzy match
      for (const k of Object.keys(this.supportedLanguages)) {
        if (code && code.includes(k)) return k;
      }
      return null;
    } catch {
      return null;
    }
  }

  async translateText(text, fromLanguage, toLanguage) {
    this._requireOpenAI();

    const startTime = Date.now();

    const resolvedSource = fromLanguage || 'AUTO';

    if (!this.supportedLanguages[toLanguage]) {
      throw new Error(`Unsupported target language: ${toLanguage}`);
    }

    // same-language только если оба известны И совпадают
    if (fromLanguage && fromLanguage === toLanguage) {
      return {
        originalText: text,
        translatedText: text,
        fromLanguage: resolvedSource,
        toLanguage,
        processingTime: Date.now() - startTime,
        confidence: 1.0,
        provider: 'same-language'
      };
    }

    const fromName = resolvedSource !== 'AUTO'
      ? this.supportedLanguages[resolvedSource].name
      : 'the source language';
    const toName = this.supportedLanguages[toLanguage].name;

    logger.info(`[translate] ${resolvedSource} → ${toLanguage} | chars: ${text.length}`);

    try {
      const systemPrompt =
        `You are a professional translator. Translate the following text from ${fromName} to ${toName}.\n` +
        `RULES:\n- Provide ONLY the translation, no explanations\n` +
        `- Maintain the original tone and style\n- Keep formatting if any`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        max_tokens: Math.min(4000, text.length * 3),
        temperature: 0.3
      });

      const translatedText = response.choices[0]?.message?.content?.trim();
      if (!translatedText) throw new Error('Translation returned empty result');

      logger.info(`[translate] OK | ${resolvedSource}→${toLanguage} | ${Date.now() - startTime}ms`);

      return {
        originalText: text,
        translatedText,
        fromLanguage: resolvedSource,
        toLanguage,
        processingTime: Date.now() - startTime,
        confidence: 0.95,
        provider: 'openai-gpt4o-mini',
        usage: response.usage
      };

    } catch (error) {
      logger.error(`[translate] ERROR: ${error.message}`);
      throw new Error(`Translation failed: ${error.message}`);
    }
  }

  async translateVoice(audioFilePath, fromLanguage, toLanguage) {
    this._requireOpenAI();

    const startTime = Date.now();
    logger.info(`[voice] START ${fromLanguage} → ${toLanguage}`);

    try {
      // FIX: transcribeAudio возвращает объект {text, language, confidence}
      const transcriptResult = await transcribeAudio(
        audioFilePath,
        this.supportedLanguages[fromLanguage]?.code || 'ru'
      );

      // FIX: берём .text из объекта, не весь объект
      const transcriptText = typeof transcriptResult === 'string'
        ? transcriptResult
        : transcriptResult.text;

      logger.info(`[voice] Transcribed | chars: ${transcriptText?.length}`);

      if (!transcriptText) throw new Error('Transcription returned empty text');

      const translation = await this.translateText(transcriptText, fromLanguage, toLanguage);
      logger.info(`[voice] Translated | ${Date.now() - startTime}ms`);

      const audioPath = await speakText(
        translation.translatedText,
        this.supportedLanguages[toLanguage]?.code || 'de'
      );
      logger.info(`[voice] TTS done`);

      return {
        originalText: transcriptText,
        translatedText: translation.translatedText,
        originalAudio: audioFilePath,
        translatedAudio: audioPath,
        fromLanguage,
        toLanguage,
        processingTime: Date.now() - startTime,
        confidence: translation.confidence,
        provider: 'solar-voice-pipeline'
      };

    } catch (error) {
      logger.error(`[voice] ERROR: ${error.message}`);
      throw new Error(`Voice translation failed: ${error.message}`);
    }
  }

  async detectLanguage(text) {
    this._requireOpenAI();
    logger.info(`[detect] chars: ${text.length}`);
    const code = await this._detectLanguage(text);
    if (code) return { language: code, confidence: 0.95, provider: 'openai-detection' };
    return { language: 'EN', confidence: 0.5, provider: 'fallback' };
  }

  getStats() {
    return {
      supportedLanguages: Object.keys(this.supportedLanguages).length,
      features: ['text-translation', 'voice-translation', 'language-detection'],
      provider: 'SOLAR v2.0 + OpenAI',
      openaiEnabled: !!this.openai,
      status: this.openai ? 'ready' : 'disabled'
    };
  }
}

module.exports = { UnifiedTranslationService };
