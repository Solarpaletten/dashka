const config = require('../config');
const logger = require('./logger');

class TranslationCache {
  constructor(maxSize = config.limits.cacheMaxSize) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  generateKey(text, sourceCode, targetCode) {
    return `${text.trim()}_${sourceCode}_${targetCode}`;
  }

  get(text, sourceCode, targetCode) {
    const key = this.generateKey(text, sourceCode, targetCode);
    if (this.cache.has(key)) {
      logger.debug(`Cache hit: ${key.substring(0, 50)}`);
      return this.cache.get(key);
    }
    return null;
  }

  set(text, sourceCode, targetCode, value) {
    const key = this.generateKey(text, sourceCode, targetCode);
    
    // Удаляем старые записи если кэш переполнен
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      logger.debug(`Cache eviction: ${firstKey.substring(0, 50)}`);
    }
    
    this.cache.set(key, value);
    logger.debug(`Cache set: ${key.substring(0, 50)}`);
  }

  clear() {
    this.cache.clear();
    logger.info('Cache cleared');
  }

  getSize() {
    return this.cache.size;
  }
}

module.exports = new TranslationCache();