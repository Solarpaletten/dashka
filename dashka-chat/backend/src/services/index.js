// services/index.js
module.exports = {
    UnifiedTranslationService: require('./unifiedTranslationService').UnifiedTranslationService,
    whisperService: require('./whisperService').whisperService,
    ttsService: require('./textToSpeechService').ttsService
  };