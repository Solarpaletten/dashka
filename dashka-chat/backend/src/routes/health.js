// backend/src/routes/health.js
// v1.0.1 — P4 OPTIMIZATION: /health лёгкий для Render
//           /health/details — расширенный (отдельно)
const express = require('express');
const router  = express.Router();
const config  = require('../config');
const cache   = require('../utils/cache');
const { clientManager } = require('../websocket');

// ✅ Лёгкий health — только то, что нужно Render
router.get('/health', (_req, res) => {
  res.json({
    status:    'ok',
    version:   '1.0.1',
    timestamp: new Date().toISOString()
  });
});

// Расширенный health — для мониторинга/дебага, не для Render healthcheck
router.get('/health/details', (_req, res) => {
  res.json({
    status:             'healthy',
    version:            '1.0.1',
    service:            'DashkaBot Cloud Server',
    openai_configured:  config.openai.enabled,
    websocket_clients:  clientManager.getClientCount(),
    cache_size:         cache.getSize(),
    uptime:             Math.floor(process.uptime()),
    memory_mb:          Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    timestamp:          new Date().toISOString()
  });
});

router.get('/stats', (_req, res) => {
  res.json({
    status: 'success',
    stats: {
      cache_size:         cache.getSize(),
      websocket_clients:  clientManager.getClientCount(),
      uptime:             Math.floor(process.uptime()),
      memory_mb:          Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      version:            '1.0.1'
    }
  });
});

module.exports = router;
