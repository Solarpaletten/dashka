const rateLimit = require('express-rate-limit');
const config = require('../config');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: config.server.env === 'development' ? 1000 : 100,
  message: {
    status: 'error',
    message: 'Слишком много запросов, попробуйте позже'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const translationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: config.server.env === 'development' ? 100 : 20,
  message: {
    status: 'error',
    message: 'Слишком много запросов перевода, подождите минуту'
  }
});

module.exports = {
  apiLimiter,
  translationLimiter
};