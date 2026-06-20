let socket: WebSocket | null = null;
let messageListeners: Array<(data: any) => void> = [];

export const getGameSocket = (): WebSocket | null => socket;

export const connectGameServer = (matchId: string): WebSocket => {
  if (socket) {
    console.log('[GameSocket] Socket already connected, reusing instance.');
    return socket;
  }

  const host = import.meta.env.VITE_GAME_SERVER_URL || 'ws://localhost:3001';
  const url = `${host}/match/${matchId}`;
  console.log('[GameSocket] Connecting to game server:', url);

  socket = new WebSocket(url);

  socket.onopen = () => {
    console.log('[GameSocket] Connection established successfully.');
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      messageListeners.forEach((listener) => listener(data));
    } catch (err) {
      console.error('[GameSocket] Failed to parse incoming WebSocket message:', err);
    }
  };

  socket.onerror = (err) => {
    console.error('[GameSocket] WebSocket connection error:', err);
  };

  socket.onclose = (event) => {
    console.warn('[GameSocket] WebSocket connection closed:', event);
    socket = null;
  };

  return socket;
};

export const disconnectGameServer = () => {
  if (socket) {
    socket.close();
    socket = null;
  }
  messageListeners = [];
};

export const sendGameMessage = (type: string, payload: Record<string, any> = {}) => {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.warn('[GameSocket] Cannot send message: WebSocket is not open.');
    return;
  }
  socket.send(JSON.stringify({ type, ...payload }));
};

export const addGameMessageListener = (listener: (data: any) => void) => {
  messageListeners.push(listener);
  return () => {
    messageListeners = messageListeners.filter((l) => l !== listener);
  };
};
