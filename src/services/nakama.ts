import { Client, Session } from '@heroiclabs/nakama-js';
import type { Socket } from '@heroiclabs/nakama-js';

const useSSL = import.meta.env.VITE_NAKAMA_SSL === 'true';
const client = new Client(
  import.meta.env.VITE_NAKAMA_KEY || "defaultkey",
  import.meta.env.VITE_NAKAMA_HOST || window.location.hostname || "127.0.0.1",
  import.meta.env.VITE_NAKAMA_PORT || "7350",
  useSSL
);

let session: Session | null = null;
let socket: Socket | null = null;

export const authenticate = async (userId: string, username?: string): Promise<Session> => {
  const nakamaId = userId.length < 6 ? `usr_${userId}` : userId;
  session = await client.authenticateCustom(nakamaId, true, username);
  
  if (username) {
    try {
      await client.updateAccount(session, { username });
    } catch (err) {
      console.warn("Failed to update username in Nakama:", err);
    }
  }

  if (!socket) {
    socket = client.createSocket(useSSL, false);
    await socket.connect(session, true);
  } else if (!(socket as any).socket || (socket as any).socket.readyState !== WebSocket.OPEN) {
    await socket.connect(session, true);
  }
  
  return session;
};

export const getNakamaSocket = (): Socket => {
  if (!socket) {
    throw new Error("Nakama socket not initialized. Please authenticate first.");
  }
  return socket;
};

export const getSession = (): Session | null => session;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect(false);
    socket = null;
  }
  session = null;
};
