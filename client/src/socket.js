import { io } from 'socket.io-client';

// Use same host or fallback to port 4000
const SERVER_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:4000' 
  : window.location.origin;

export const socket = io(SERVER_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});
