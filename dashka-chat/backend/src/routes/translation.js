const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const cache = require('../utils/cache');
const { validateTranslation } = require('../middleware/validation');
const { translationLimiter } = require('../middleware/rateLimit');
const { UnifiedTranslationService } = require('../services/unifiedTranslationService');

const translationService = new UnifiedTranslationService();

router.post('/translate', 
  translationLimiter,
  validateTranslation,
  async (req, res, next) => {
    try {
      const startTime = Date.now();
      
      const { 
        text, 
        source_language,
        target_language = 'DE',
        fromLang,
        toLang,
        from,
        to
      } = req.body;

      // source_language НЕ имеет дефолта — если не передан, будет undefined
      // translateText сам определит язык через GPT
      const sourceCode = (source_language || fromLang || from || '').toUpperCase() || null;
      const targetCode = (target_language || toLang || to || 'DE').toUpperCase();

      // Кэш только если source известен
      if (sourceCode) {
        const cached = cache.get(text, sourceCode, targetCode);
        if (cached) {
          return res.json({
            ...cached,
            from_cache: true,
            processing_time: Date.now() - startTime
          });
        }
      }

      // Translate — если sourceCode null, сервис определит язык сам
      const result = await translationService.translateText(
        text.trim(), 
        sourceCode,
        targetCode
      );

      const response = {
        status: 'success',
        original_text: result.originalText,
        translated_text: result.translatedText,
        source_language: (result.fromLanguage || sourceCode || 'auto').toLowerCase(),
        target_language: targetCode.toLowerCase(),
        confidence: result.confidence,
        timestamp: new Date().toISOString(),
        processing_time: result.processingTime,
        provider: result.provider,
        from_cache: false
      };

      // Кэш сохраняем с реальным source
      if (result.fromLanguage) {
        cache.set(text, result.fromLanguage, targetCode, response);
      }

      res.json(response);

    } catch (error) {
      next(error);
    }
});

module.exports = router;
