const WebSocket = require('ws');
const logger = require('../utils/logger');

class ClientManager {
  constructor() {
    this.clients = new Map();
  }

  addClient(ws, request) {
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.clients.set(clientId, {
      ws,
      role: 'unknown',
      connected_at: new Date(),
      ip: request.socket.remoteAddress
    });

    logger.info(`WebSocket connected: ${clientId} (total: ${this.clients.size})`);
    return clientId;
  }

  removeClient(clientId) {
    if (this.clients.has(clientId)) {
      this.clients.delete(clientId);
      logger.info(`WebSocket disconnected: ${clientId} (remaining: ${this.clients.size})`);
    }
  }

  getClient(clientId) {
    return this.clients.get(clientId);
  }

  setClientRole(clientId, role) {
    if (this.clients.has(clientId)) {
      this.clients.get(clientId).role = role;
      logger.info(`Client ${clientId} role set to: ${role}`);
      return true;
    }
    return false;
  }

  broadcastToOthers(senderId, data) {
    let sentCount = 0;
    
    this.clients.forEach((client, clientId) => {
      if (clientId !== senderId && client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(JSON.stringify(data));
          sentCount++;
        } catch (error) {
          logger.error(`Failed to send to ${clientId}:`, error.message);
        }
      }
    });

    if (sentCount > 0) {
      logger.debug(`Broadcast sent to ${sentCount} clients`);
    }
    
    return sentCount;
  }

  getClientCount() {
    return this.clients.size;
  }

  getAllClients() {
    return Array.from(this.clients.entries()).map(([id, data]) => ({
      id,
      role: data.role,
      connected_at: data.connected_at
    }));
  }
}

module.exports = new ClientManager();