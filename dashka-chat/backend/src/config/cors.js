// backend/src/config/cors.js
// v1.0.1 — P1 FIX: CORS origin '*' запрещён в production
const logger = require('../utils/logger');

const PRODUCTION_DEFAULT_ORIGIN = 'https://dashka.onrender.com';

function buildCorsOrigin() {
  const env = process.env.NODE_ENV || 'development';
  const envOrigin = process.env.CORS_ORIGIN;

  if (env !== 'production') {
    // Development: разрешаем всё
    return '*';
  }

  // Production: никогда не '*'
  if (!envOrigin || envOrigin === '*') {
    logger.warn(
      `[CORS] CORS_ORIGIN не задан или равен '*' в production. ` +
      `Используется безопасный дефолт: ${PRODUCTION_DEFAULT_ORIGIN}`
    );
    return PRODUCTION_DEFAULT_ORIGIN;
  }

  // Поддержка списка доменов через запятую: "https://a.com,https://b.com"
  const origins = envOrigin.split(',').map(o => o.trim()).filter(Boolean);
  if (origins.length === 1) return origins[0];

  logger.info(`[CORS] Разрешённые origins: ${origins.join(', ')}`);
  return origins;
}

const corsOptions = {
  origin: buildCorsOrigin(),
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

module.exports = corsOptions;
