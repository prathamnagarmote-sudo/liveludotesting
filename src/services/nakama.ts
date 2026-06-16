import { Client, Session } from '@heroiclabs/nakama-js';
import type { Socket } from '@heroiclabs/nakama-js';

const useSSL = import.meta.env.VITE_NAKAMA_SSL === 'true' || import.meta.env.VITE_NAKAMA_USE_SSL === 'true';
const client = new Client(
  import.meta.env.VITE_NAKAMA_KEY || import.meta.env.VITE_NAKAMA_SERVER_KEY || "defaultkey",
  import.meta.env.VITE_NAKAMA_HOST || window.location.hostname || "127.0.0.1",
  import.meta.env.VITE_NAKAMA_PORT || "7350",
  useSSL
);

let session: Session | null = null;
// We keep ONE socket reference. Never replace it with a new object on reconnect —
// replacing it drops all onmatchdata / onmatchmakermatched handlers that callers
// have already installed on the old reference.
let socket: Socket | null = null;

const isSocketOpen = (): boolean => {
  if (!socket) return false;
  const ws = (socket as any).socket as WebSocket | undefined;
  return ws?.readyState === WebSocket.OPEN;
};

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
  } else if (!isSocketOpen()) {
    // Reconnect the SAME socket object so callers' handler references stay valid
    await socket.connect(session, true);
  }

  return session;
};

export const ensureSocketConnected = async (): Promise<Socket> => {
  if (!session) {
    throw new Error("Nakama session not initialized. Please authenticate first.");
  }
  if (!socket) {
    socket = client.createSocket(useSSL, false);
    await socket.connect(session, true);
  } else if (!isSocketOpen()) {
    // Reconnect on the same instance — preserves handler references
    await socket.connect(session, true);
  }
  return socket;
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
