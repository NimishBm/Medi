import { io } from 'socket.io-client';

const rawSocketUrl = import.meta.env.VITE_SOCKET_URL;
const isProd = import.meta.env.PROD;
// In production: use same origin (Vercel domain)
// In dev: use VITE_SOCKET_URL from .env, fallback to localhost:5000
const SOCKET_URL = (rawSocketUrl && (!isProd || !rawSocketUrl.includes('localhost')))
  ? rawSocketUrl
  : (isProd ? window.location.origin : 'http://localhost:5000');

let socket = null;

export const initSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
  }
  return socket;
};

export const getSocket = () => {
  return socket || initSocket();
};

export const closeSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Join socket rooms so the client receives targeted server emits.
 * Call once after authentication, e.g. in App.jsx or each page.
 *
 * @param {'doctor'|'patient'} role
 * @param {string} id  - the user's _id
 */
export const joinRooms = (role, id) => {
  const s = getSocket();
  if (role === 'doctor') {
    s.emit('join-queue', { doctorId: id });
    s.emit('join-doctor-notifications', { doctorId: id });
  } else if (role === 'patient') {
    s.emit('join-notifications', { userId: id });
  }
};
