const logger = require('../utils/logger');

function requestLogger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.logRequest(req.method, req.path, res.statusCode, duration, {
      ip: req.ip
    });
  });
  
  next();
}
module.exports = requestLogger;