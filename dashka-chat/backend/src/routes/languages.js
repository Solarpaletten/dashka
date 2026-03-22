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


module.exports = router;