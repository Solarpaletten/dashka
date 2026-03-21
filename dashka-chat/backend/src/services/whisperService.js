// backend/src/services/whisperService.js
// v1.0.1 — P3 HYGIENE: console.log → logger, нет текстов пользователя в логах
'use strict';

const fs   = require('fs');
const path = require('path');
const OpenAI = require('openai');
const logger = require('../utils/logger');

class WhisperService {
  constructor(apiKey) {
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Распознаёт речь из аудиофайла через Whisper API.
   * @param {string} audioFilePath
   * @param {string} [language='auto']
   */
  async transcribeAudio(audioFilePath, language = 'auto') {
    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`Audio file not found: ${path.basename(audioFilePath)}`);
    }

    // ✅ P3: только имя файла (без полного пути), нет текста пользователя
    logger.info(`[whisper] Transcribing | file: ${path.basename(audioFilePath)} | lang: ${language}`);

    const langMap = {
      'fr-CH': 'fr', 'fr-FR': 'fr', 'fr-CA': 'fr',
      'ru-RU': 'ru', 'ru': 'ru',
      'de-DE': 'de', 'de-AT': 'de',
      'en-US': 'en', 'en-GB': 'en'
    };
    const whisperLang = langMap[language] || (language === 'auto' ? undefined : language);

    try {
      const transcription = await this.openai.audio.transcriptions.create({
        file:            fs.createReadStream(audioFilePath),
        model:           'whisper-1',
        language:        whisperLang,
        response_format: 'json',
        temperature:     0.2
      });

      const text         = transcription.text?.trim() || '';
      const detectedLang = transcription.language || whisperLang || 'auto';

      // ✅ P3: только длина, не сам текст
      logger.info(`[whisper] OK | lang: ${detectedLang} | chars: ${text.length}`);

      return {
        text,
        language:   detectedLang,
        confidence: transcription.confidence || 0.95,
        provider:   'openai-whisper-1'
      };

    } catch (error) {
      logger.error(`[whisper] ERROR: ${error.message}`);
      throw error;
    }
  }

  async transcribeText(inputText) {
    if (!inputText) throw new Error('Input text is empty');
    return {
      text:       inputText.trim(),
      language:   'text',
      confidence: 1.0,
      provider:   'text-input'
    };
  }
}

// ✅ Module-level helper (используется unifiedTranslationService через require)
let _instance = null;

function transcribeAudio(audioFilePath, language = 'auto') {
  if (!_instance) {
    if (!process.env.OPENAI_API_KEY) {
      const err = new Error('OPENAI_API_KEY not configured');
      err.statusCode = 503;
      throw err;
    }
    _instance = new WhisperService(process.env.OPENAI_API_KEY);
  }
  return _instance.transcribeAudio(audioFilePath, language);
}

module.exports = WhisperService;
module.exports.transcribeAudio = transcribeAudio;
