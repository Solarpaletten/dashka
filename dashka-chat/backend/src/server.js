const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const fs = require('fs');

// Config
const config = require('./config');
const corsOptions = require('./config/cors');

// Middleware
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimit');

// Routes
const setupRoutes = require('./routes');

// WebSocket
const { setupWebSocket } = require('./websocket');

// Utils
const logger = require('./utils/logger');
const { cleanupTempFiles } = require('./utils/fileCleanup');

class DashkaBotServer {
  constructor() {
    this.app = express();
    this.app.set('trust proxy', 1);
    this.server = http.createServer(this.app);
    
    this.setupMiddleware();
    this.createDirectories();
    setupRoutes(this.app);
    this.setupWebSocket();
    this.app.use(errorHandler);
    
    logger.info('DashkaBot Server initialized');
  }

  setupMiddleware() {
    // Security
    this.app.use(helmet());
    this.app.use(compression());
    
    // CORS
    this.app.use(cors(corsOptions));
    
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // Logging
    this.app.use(requestLogger);
    
    // Rate limiting
    this.app.use(apiLimiter);
    
    // Static files
    this.app.use('/audio', express.static(path.join(__dirname, '../tmp')));
  }

  setupWebSocket() {
    this.wss = setupWebSocket(this.server);
  }

  createDirectories() {
    const dirs = Object.values(config.paths);
    dirs.push('logs');
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.info(`Created directory: ${dir}`);
      }
    });
  }

  start() {
    this.server.listen(config.server.port, config.server.host, () => {
      logger.info(`Server started on ${config.server.host}:${config.server.port}`);
      logger.info(`Environment: ${config.server.env}`);
      logger.info(`API URL: ${config.api.url}`);
      logger.info(`WebSocket: ${config.api.wsUrl}`);
      logger.info(`OpenAI: ${config.openai.enabled ? 'Enabled' : 'Disabled'}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  shutdown() {
    logger.info('Shutting down server...');
    
    this.server.close(() => {
      logger.info('Server stopped');
      cleanupTempFiles();
      process.exit(0);
    });
  }
}

// Start server
if (require.main === module) {
  const server = new DashkaBotServer();
  server.start();
}

module.exports = DashkaBotServer;