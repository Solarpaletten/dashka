const express = require('express');
const router = express.Router();
const { UnifiedTranslationService } = require('../services/unifiedTranslationService');

const translationService = new UnifiedTranslationService();

router.get('/languages', (req, res) => {
  const languages = translationService.getSupportedLanguages();
  res.json({
    status: 'success',
    count: languages.length,
    languages,
    service: 'UnifiedTranslationService'
  });
});

router.post('/detect-language', async (req, res, next) => {
  try {
    const { text, target_language } = req.body;

    const result = await translationService.translate({
      text,
      targetLang: target_language
    })

    if (!text) {
      return res.status(400).json({
        status: 'error',
        message: 'Текст не указан'
      });
    }

    // const result = await translationService.detectLanguage(text);
    res.json({
      status: 'success',
      detected_language: result.language,
      confidence: result.confidence,
      provider: result.provider
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;