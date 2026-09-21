import { io } from 'socket.io-client';

const rawSocketUrl = import.meta.env.VITE_SOCKET_URL;
const isProd = import.meta.env.PROD;
const SOCKET_URL = (rawSocketUrl && (!isProd || !rawSocketUrl.includes('localhost')))
  ? rawSocketUrl
  : (isProd ? window.location.origin : 'https://medi-ecru.vercel.app');

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
