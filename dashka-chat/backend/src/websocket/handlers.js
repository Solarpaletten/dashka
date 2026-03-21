const logger = require('../utils/logger');
const clientManager = require('./clientManager');
const { WebSocket } = require('ws');
const rooms = new Map();

function handleJoinRoom(ws, data, clientId) {
  const { room, username } = data;

  if (!rooms.has(room)) {
    rooms.set(room, []);
  }

  ws.room = room;
  ws.username = username;

  rooms.get(room).push({ ws, username, clientId });

  logger.info(`User ${username} joined room ${room}`);

  broadcastToRoom(room, {
    type: 'user_joined',
    username: username,
    participants: rooms.get(room).length
  }, ws);
}

function broadcastToRoom(roomCode, message, excludeWs = null) {
  const room = rooms.get(roomCode);
  if (!room) return;

  room.forEach(({ ws }) => {
    if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}

function handleSetRole(clientId, data) {
  const { role } = data;

  if (clientManager.setClientRole(clientId, role)) {
    const client = clientManager.getClient(clientId);
    client.ws.send(JSON.stringify({
      type: 'role_confirmed',
      role,
      timestamp: new Date().toISOString()
    }));
  }
}

function handleTranslation(ws, clientId, data) {
  logger.info(`Translation from ${clientId}`);

  const client = clientManager.getClient(clientId);
  const message = {
    ...data,
    sender_role: client?.role || 'unknown',
    sender_id: clientId,
    timestamp: new Date().toISOString()
  };

  // Broadcast в комнату
  if (ws.room) {
    broadcastToRoom(ws.room, {
      type: 'translation',
      username: ws.username,
      original: data.original,
      translation: data.translation,
      from: data.from,
      to: data.to,
      timestamp: new Date().toISOString()
    }, ws);  // ws передаётся как excludeWs - не отправляем себе
  } else {
    // Старая логика broadcast для всех
    clientManager.broadcastToOthers(clientId, message);
  }
}

function handleMessage(ws, clientId, data) {
  switch (data.type) {
    case 'join_room':
      handleJoinRoom(ws, data, clientId);
      break;
    case 'set_role':
      handleSetRole(clientId, data);
      break;
    case 'translation':
      handleTranslation(ws, clientId, data);
      break;
    default:
      clientManager.broadcastToOthers(clientId, {
        ...data,
        sender_id: clientId,
        timestamp: new Date().toISOString()
      });
  }
}

module.exports = {
  handleMessage,
  handleJoinRoom,
  handleSetRole,
  handleTranslation,
  broadcastToRoom
};