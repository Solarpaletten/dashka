require('dotenv').config();

module.exports = {
  server: {
    port: process.env.PORT || 8080,
    host: '0.0.0.0',
    env: process.env.NODE_ENV || 'development'
  },
  
  api: {
    url: process.env.API_URL || 'http://localhost:8080',
    wsUrl: process.env.WS_URL || 'ws://localhost:8080/ws'
  },
  
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    enabled: !!process.env.OPENAI_API_KEY
  },
  
  paths: {
    temp: process.env.TEMP_DIR || 'temp',
    tmp: process.env.TMP_DIR || 'tmp',
    uploads: process.env.UPLOAD_DIR || 'uploads',
    cache: process.env.CACHE_DIR || 'cache'
  },
  
  limits: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    cacheMaxSize: parseInt(process.env.CACHE_MAX_SIZE) || 1000
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
};