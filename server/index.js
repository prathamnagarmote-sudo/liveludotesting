import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { GameEngine } from './GameEngine.js';

const app = express();
app.use(cors());

// Serve basic diagnostic endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'ok', server: 'ludo-gameplay', timestamp: Date.now() });
});

const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

const gameEngine = new GameEngine();

wss.on('connection', (ws, req) => {
  // Parse matchId from URL path (e.g. /match/some-match-uuid)
  const urlPath = req.url || '';
  const matchIdMatch = urlPath.match(/^\/match\/([^/]+)/);
  
  if (!matchIdMatch) {
    console.warn('[SERVER] Connection rejected: invalid URL path:', urlPath);
    ws.close(4000, 'Invalid match connection path');
    return;
  }

  const matchId = matchIdMatch[1];
  console.log(`[SERVER] Client connected to match: ${matchId}`);

  ws.on('message', (message) => {
    try {
      const payload = JSON.parse(message.toString());
      gameEngine.handleMessage(ws, matchId, payload);
    } catch (err) {
      console.error('[SERVER] Failed to parse message from client:', err);
    }
  });

  ws.on('close', (code, reason) => {
    console.log(`[SERVER] Client disconnected from match: ${matchId}, code: ${code}`);
    gameEngine.handleDisconnect(ws, matchId);
  });

  ws.on('error', (err) => {
    console.error(`[SERVER] WebSocket error in match ${matchId}:`, err);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Authoritative WebSocket Game Server running on port ${PORT}`);
});
