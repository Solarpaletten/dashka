const winston = require('winston');
const config = require('../config');

// Custom format to handle objects properly
const formatObject = (param) => {
  if (typeof param === 'object' && param !== null) {
    return JSON.stringify(param, null, 2);
  }
  return param;
};

// Custom format to log structured data
const structuredFormat = winston.format((info) => {
  // Handle message
  if (typeof info.message === 'object') {
    info.message = JSON.stringify(info.message, null, 2);
  }
  
  // Handle meta data
  const { level, message, timestamp, ...meta } = info;
  
  // If there's additional metadata, append it
  if (Object.keys(meta).length > 0) {
    info.metadata = meta;
  }
  
  return info;
});

// Redact sensitive data
const redactFormat = winston.format((info) => {
  // Redact API keys
  if (info.message && typeof info.message === 'string') {
    info.message = info.message.replace(/sk-[a-zA-Z0-9_-]+/g, 'sk-***REDACTED***');
  }
  
  // Redact email addresses
  if (info.email) {
    info.email = info.email.replace(/(.{2}).*(@.*)/, '$1***$2');
  }
  
  return info;
});

// Create logger instance
const logger = winston.createLogger({
  level: config.server.env === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    redactFormat(),
    structuredFormat()
  ),
  defaultMeta: { 
    service: 'dashkabot-backend',
    environment: config.server.env
  },
  transports: [
    // Console transport with colors
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          let metaStr = '';
          if (Object.keys(meta).length > 0) {
            // Filter out default meta
            const { service, environment, ...otherMeta } = meta;
            if (Object.keys(otherMeta).length > 0) {
              metaStr = ` ${JSON.stringify(otherMeta)}`;
            }
          }
          return `${timestamp} [${level}]: ${message}${metaStr}`;
        })
      )
    }),
    
    // Error log file
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),
    
    // Combined log file
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ]
});

// Create logs directory if it doesn't exist
const fs = require('fs');
const path = require('path');
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Helper methods for structured logging
logger.logRequest = (method, path, statusCode, duration, meta = {}) => {
  logger.info('HTTP Request', {
    method,
    path,
    statusCode,
    duration: `${duration}ms`,
    ...meta
  });
};

logger.logError = (message, error, meta = {}) => {
  logger.error(message, {
    error: error.message,
    stack: error.stack,
    ...meta
  });
};

logger.logWebSocket = (event, clientId, meta = {}) => {
  logger.debug('WebSocket Event', {
    event,
    clientId,
    ...meta
  });
};

logger.logTranslation = (text, from, to, duration, cached = false) => {
  logger.info('Translation', {
    text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
    from,
    to,
    duration: `${duration}ms`,
    cached
  });
};

// Export logger
module.exports = logger;