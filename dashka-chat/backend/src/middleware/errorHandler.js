const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error('Error handler:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  const statusCode = err.statusCode || 500;
  
  res.status(statusCode).json({
    status: 'error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
}

module.exports = errorHandler;