const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Missing auth token'));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      return next();
    } catch (error) {
      return next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const { id, role } = socket.user;
    if (role === 'EXECUTIVE') socket.join('executives');
    if (role === 'MANAGER') socket.join(`manager:${id}`);
    if (role === 'OPERATOR') socket.join(`operator:${id}`);
  });

  console.log('Socket.io initialized');
  return io;
}

function emitToManager(managerId, event, payload) {
  if (!io || !managerId) return;
  io.to(`manager:${managerId}`).emit(event, payload);
}

function emitToOperator(operatorId, event, payload) {
  if (!io || !operatorId) return;
  io.to(`operator:${operatorId}`).emit(event, payload);
}

function emitToExecutives(event, payload) {
  if (!io) return;
  io.to('executives').emit(event, payload);
}

module.exports = { initSocket, emitToManager, emitToOperator, emitToExecutives };
