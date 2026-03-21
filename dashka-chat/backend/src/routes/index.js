const express = require('express');
const healthRoutes = require('./health');
const translationRoutes = require('./translation');
const voiceRoutes = require('./voice');
const languagesRoutes = require('./languages');

function setupRoutes(app) {
  // Health & stats
  app.use('/', healthRoutes);
  
  // Translation
  app.use('/', translationRoutes);
  
  // Voice
  app.use('/', voiceRoutes);
  
  // Languages
  app.use('/', languagesRoutes);
  
  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      name: 'Dashka API Server',
      version: '3.0.0',
      status: 'running',
      endpoints: [
        '/health',
        '/translate', 
        '/voice-translate',
        '/detect-language',
        '/languages',
        '/stats'
      ],
      websocket: 'wss://dashka.onrender.com/ws'
    });
  });
  
  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      status: 'error',
      message: 'Endpoint не найден',
      available_endpoints: ['/health', '/translate', '/voice-translate', '/languages', '/stats']
    });
  });
}

module.exports = setupRoutes;