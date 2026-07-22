import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

function getSocketBaseUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL || '';
  return apiUrl.replace(/\/api\/?$/, '');
}

export function connectSocket(): Socket {
  const token = localStorage.getItem('mes_token');

  if (socket) {
    socket.auth = { token };
    if (!socket.connected) socket.connect();
    return socket;
  }

  socket = io(getSocketBaseUrl(), {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}
