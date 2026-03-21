// backend/src/routes/voice.js
// v1.0.1 — P0 FIX: response contract → snake_case (web/iOS/Android compatible)
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const upload = require('../config/multer');
const logger = require('../utils/logger');
const { UnifiedTranslationService } = require('../services/unifiedTranslationService');

const translationService = new UnifiedTranslationService();

router.post('/voice-translate', upload.single('audio'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'Аудио файл не загружен'
      });
    }

    const {
      fromLang = 'RU',
      toLang = 'DE',
      source_language = 'RU',
      target_language = 'DE'
    } = req.body;

    const sourceCode = (fromLang || source_language).toUpperCase();
    const targetCode = (toLang || target_language).toUpperCase();

    logger.info(`Voice translation: ${sourceCode} → ${targetCode}`);

    const result = await translationService.translateVoice(
      req.file.path,
      sourceCode,
      targetCode
    );

    // ✅ P0 FIX: всегда snake_case (основной контракт)
    // + camelCase алиасы для обратной совместимости
    res.json({
      status: 'success',
      // snake_case — основные поля (web / iOS / Android читают эти)
      original_text: result.originalText,
      translated_text: result.translatedText,
      source_language: sourceCode.toLowerCase(),
      target_language: targetCode.toLowerCase(),
      audio_url: result.translatedAudio
        ? `/audio/${path.basename(result.translatedAudio)}`
        : null,
      processing_time: result.processingTime,
      confidence: result.confidence,
      provider: result.provider,
      // camelCase алиасы — backward compat
      originalText: result.originalText,
      translatedText: result.translatedText,
      audioUrl: result.translatedAudio
        ? `/audio/${path.basename(result.translatedAudio)}`
        : null
    });

    // Cleanup temp file
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
});

module.exports = router;
