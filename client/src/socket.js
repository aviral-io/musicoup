import { io } from 'socket.io-client';

// Connect to port 4000 if running on Vite dev server (port 5173), otherwise current origin
const SERVER_URL = window.location.port === '5173'
  ? `http://${window.location.hostname}:4000`
  : window.location.origin;

export const socket = io(SERVER_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});

