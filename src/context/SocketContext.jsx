import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { getStoredTokens } from '../api/client.js';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext({ socket: null, connected: false });
let sharedSocket = null;
let sharedSocketUserId = null;
let closeTimer = null;

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const providerSocketRef = useRef(null);

  useEffect(() => {
    if (!user) {
      providerSocketRef.current = null;
      setSocket(null);
      setConnected(false);
      return undefined;
    }

    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }

    const tokens = getStoredTokens();
    const userId = user._id || user.id;
    if (!sharedSocket || sharedSocketUserId !== userId) {
      sharedSocket?.close();
      sharedSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:4009', {
        auth: { token: tokens?.accessToken },
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
      });
      sharedSocketUserId = userId;
    }

    providerSocketRef.current = sharedSocket;
    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);
    sharedSocket.on('connect', handleConnect);
    sharedSocket.on('disconnect', handleDisconnect);
    setConnected(sharedSocket.connected);
    setSocket(sharedSocket);

    return () => {
      const activeSocket = providerSocketRef.current;
      activeSocket?.off('connect', handleConnect);
      activeSocket?.off('disconnect', handleDisconnect);
      setConnected(false);

      // React StrictMode remounts providers in development; delay close so the remount can reuse it.
      closeTimer = setTimeout(() => {
        if (sharedSocket === activeSocket) {
          sharedSocket?.close();
          sharedSocket = null;
          sharedSocketUserId = null;
        }
      }, 1000);
    };
  }, [user]);

  const value = useMemo(() => ({ socket, connected }), [socket, connected]);
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export const useSocket = () => useContext(SocketContext);