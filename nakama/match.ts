/// <reference types="nakama-runtime" />

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface TCoordinate {
  x: number;
  y: number;
}

type TPlayerColour = 'blue' | 'red' | 'green' | 'yellow';

interface TToken {
  id: number;
  colour: TPlayerColour;
  coordinates: TCoordinate;
  initialCoords: TCoordinate;
  isLocked: boolean;
  isActive: boolean;
  hasTokenReachedHome: boolean;
}

interface TPlayer {
  name: string;
  colour: TPlayerColour;
  isBot: boolean;
  numberOfConsecutiveSix: number;
  tokens: TToken[];
  id?: string;
  userId?: string;
  missedTurns: number;
  hasQuit: boolean;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const GENERAL_TOKEN_PATH = [
  { startCoords: { x: 6, y: 13 }, endCoords: { x: 6, y: 9 } },
  { startCoords: { x: 5, y: 8 }, endCoords: { x: 1, y: 8 } },
  { startCoords: { x: 0, y: 8 }, endCoords: { x: 0, y: 6 } },
  { startCoords: { x: 1, y: 6 }, endCoords: { x: 5, y: 6 } },
  { startCoords: { x: 6, y: 5 }, endCoords: { x: 6, y: 1 } },
  { startCoords: { x: 6, y: 0 }, endCoords: { x: 8, y: 0 } },
  { startCoords: { x: 8, y: 1 }, endCoords: { x: 8, y: 5 } },
  { startCoords: { x: 9, y: 6 }, endCoords: { x: 13, y: 6 } },
  { startCoords: { x: 14, y: 6 }, endCoords: { x: 14, y: 8 } },
  { startCoords: { x: 13, y: 8 }, endCoords: { x: 9, y: 8 } },
  { startCoords: { x: 8, y: 9 }, endCoords: { x: 8, y: 13 } },
  { startCoords: { x: 8, y: 14 }, endCoords: { x: 6, y: 14 } }
];

const TOKEN_HOME_ENTRY_PATH = {
  blue: { startCoords: { x: 7, y: 13 }, endCoords: { x: 7, y: 8 } },
  red: { startCoords: { x: 1, y: 7 }, endCoords: { x: 6, y: 7 } },
  green: { startCoords: { x: 7, y: 1 }, endCoords: { x: 7, y: 6 } },
  yellow: { startCoords: { x: 13, y: 7 }, endCoords: { x: 8, y: 7 } }
};

const TOKEN_START_COORDINATES: Record<TPlayerColour, TCoordinate> = {
  blue: { x: 6, y: 13 },
  red: { x: 1, y: 6 },
  green: { x: 8, y: 1 },
  yellow: { x: 13, y: 8 }
};

const TOKEN_SAFE_COORDINATES: TCoordinate[] = [
  { x: 6, y: 13 },
  { x: 1, y: 6 },
  { x: 8, y: 1 },
  { x: 13, y: 8 },
  { x: 8, y: 12 },
  { x: 2, y: 8 },
  { x: 6, y: 2 },
  { x: 12, y: 6 }
];

const TOKEN_LOCKED_COORDINATES = {
  blue: [{ x: 1.45, y: 10.55 }, { x: 3.55, y: 10.55 }, { x: 1.45, y: 12.65 }, { x: 3.55, y: 12.65 }],
  red: [{ x: 1.45, y: 1.5 }, { x: 3.55, y: 1.5 }, { x: 1.45, y: 3.6 }, { x: 3.55, y: 3.6 }],
  green: [{ x: 10.5, y: 1.5 }, { x: 12.6, y: 1.5 }, { x: 10.5, y: 3.6 }, { x: 12.6, y: 3.6 }],
  yellow: [{ x: 10.5, y: 10.55 }, { x: 12.6, y: 10.55 }, { x: 10.5, y: 12.65 }, { x: 12.6, y: 12.65 }]
};

// ─── ES5 ARRAY / OBJECT HELPERS ───────────────────────────────────────────────
function areCoordsEqual(c1: TCoordinate, c2: TCoordinate): boolean {
  return c1.x === c2.x && c1.y === c2.y;
}

function findCoordIndex(arr: TCoordinate[], coord: TCoordinate): number {
  for (let i = 0; i < arr.length; i++) {
    if (areCoordsEqual(arr[i], coord)) return i;
  }
  return -1;
}

function getIntegersBetween(a: number, b: number): number[] {
  if (a === b) return [a];
  let result = [];
  const start = Math.min(a, b) + 1;
  const end = Math.max(a, b);

  for (let i = start; i < end; i++) {
    result.push(i);
  }

  if (a > b) result = result.reverse();

  return [a, ...result, b];
}

function expandTokenPath(tokenPathsArr: any[]): TCoordinate[] {
  const expandedPath: TCoordinate[] = [];
  for (let i = 0; i < tokenPathsArr.length; i++) {
    const path = tokenPathsArr[i];
    const isVertical = path.startCoords.x === path.endCoords.x;
    const staticCoordinateComponent = isVertical ? path.startCoords.x : path.startCoords.y;
    const variableStartCoordinate = isVertical ? path.startCoords.y : path.startCoords.x;
    const variableEndCoordinate = isVertical ? path.endCoords.y : path.endCoords.x;

    const variableCoordinates = getIntegersBetween(variableStartCoordinate, variableEndCoordinate);

    for (let j = 0; j < variableCoordinates.length; j++) {
      if (isVertical)
        expandedPath.push({
          x: staticCoordinateComponent,
          y: variableCoordinates[j]
        });
      else
        expandedPath.push({
          x: variableCoordinates[j],
          y: staticCoordinateComponent
        });
    }
  }

  return expandedPath;
}

const expandedTokenHomeEntryPath = {
  blue: expandTokenPath([TOKEN_HOME_ENTRY_PATH.blue]),
  red: expandTokenPath([TOKEN_HOME_ENTRY_PATH.red]),
  green: expandTokenPath([TOKEN_HOME_ENTRY_PATH.green]),
  yellow: expandTokenPath([TOKEN_HOME_ENTRY_PATH.yellow])
};

function genBlueTokenPath() {
  const expandedGeneralTokenPathForBlue = expandTokenPath(GENERAL_TOKEN_PATH).slice(0, -1);
  return [...expandedGeneralTokenPathForBlue, ...expandedTokenHomeEntryPath.blue];
}

function genRedTokenPath() {
  const path = [...GENERAL_TOKEN_PATH.slice(3), ...GENERAL_TOKEN_PATH.slice(0, 3)];
  const expandedTokenPathForRed = expandTokenPath(path).slice(0, -1);
  return [...expandedTokenPathForRed, ...expandedTokenHomeEntryPath.red];
}

function genGreenTokenPath() {
  const path = [...GENERAL_TOKEN_PATH.slice(6), ...GENERAL_TOKEN_PATH.slice(0, 6)];
  const expandedTokenPathForGreen = expandTokenPath(path).slice(0, -1);
  return [...expandedTokenPathForGreen, ...expandedTokenHomeEntryPath.green];
}

function genYellowTokenPath() {
  const path = [...GENERAL_TOKEN_PATH.slice(9), ...GENERAL_TOKEN_PATH.slice(0, 9)];
  const expandedTokenPathForYellow = expandTokenPath(path).slice(0, -1);
  return [...expandedTokenPathForYellow, ...expandedTokenHomeEntryPath.yellow];
}

const tokenPaths: Record<TPlayerColour, TCoordinate[]> = {
  blue: genBlueTokenPath(),
  red: genRedTokenPath(),
  green: genGreenTokenPath(),
  yellow: genYellowTokenPath()
};

function isCoordInHomeEntryPathForColour(coord: TCoordinate, colour: TPlayerColour): boolean {
  const homePath = expandedTokenHomeEntryPath[colour];
  for (let i = 0; i < homePath.length; i++) {
    if (areCoordsEqual(coord, homePath[i])) return true;
  }
  return false;
}

function isCoordASafeSpot(coord: TCoordinate, colour?: TPlayerColour): boolean {
  for (let i = 0; i < TOKEN_SAFE_COORDINATES.length; i++) {
    if (areCoordsEqual(coord, TOKEN_SAFE_COORDINATES[i])) return true;
  }
  if (!colour) return false;
  return isCoordInHomeEntryPathForColour(coord, colour);
}

function getHomeCoordForColour(colour: TPlayerColour): TCoordinate {
  const path = tokenPaths[colour];
  return path[path.length - 1];
}

function getDistanceInTokenPath(
  colour: TPlayerColour,
  initialCoord: TCoordinate,
  targetCoord: TCoordinate
): number {
  const path = tokenPaths[colour];
  const initialIndex = findCoordIndex(path, initialCoord);
  const targetIndex = findCoordIndex(path, targetCoord);
  if (initialIndex === -1 || targetIndex === -1) return -1;
  return Math.abs(initialIndex - targetIndex);
}

function getAvailableSteps(token: TToken): number {
  return getDistanceInTokenPath(token.colour, token.coordinates, getHomeCoordForColour(token.colour));
}

function countTokensAtCoord(allTokens: TToken[], coord: TCoordinate, colour: TPlayerColour): number {
  let count = 0;
  for (let i = 0; i < allTokens.length; i++) {
    const t = allTokens[i];
    if (t.colour === colour && !t.isLocked && !t.hasTokenReachedHome && areCoordsEqual(t.coordinates, coord)) {
      count++;
    }
  }
  return count;
}

function isTokenMovable(token: TToken, diceNumber?: number, allTokens?: TToken[]): boolean {
  if (!diceNumber) return !token.isLocked && !token.hasTokenReachedHome;
  
  if (token.isLocked) {
    return diceNumber === 6;
  }
  
  if (token.hasTokenReachedHome || getAvailableSteps(token) < diceNumber) {
    return false;
  }

  if (allTokens) {
    const path = tokenPaths[token.colour];
    const currentCoordIndex = findCoordIndex(path, token.coordinates);
    if (currentCoordIndex !== -1) {
      for (let i = 1; i <= diceNumber; i++) {
        const stepIndex = currentCoordIndex + i;
        if (stepIndex >= path.length) break;
        const stepCoord = path[stepIndex];

        const opponentColours: TPlayerColour[] = [];
        const colours: TPlayerColour[] = ['blue', 'red', 'green', 'yellow'];
        for (let c = 0; c < colours.length; c++) {
          if (colours[c] !== token.colour) {
            opponentColours.push(colours[c]);
          }
        }

        for (let o = 0; o < opponentColours.length; o++) {
          const oppColour = opponentColours[o];
          if (!isCoordASafeSpot(stepCoord, oppColour)) {
            const blockCount = countTokensAtCoord(allTokens, stepCoord, oppColour);
            if (blockCount >= 2) {
              return false;
            }
          }
        }
      }
    }
  }

  return true;
}

function computeMoveResult(
  token: TToken,
  diceNumber: number,
  players: TPlayer[]
): { hasTokenReachedHome: boolean; isCaptured: boolean; hasPlayerWon: boolean; path: TCoordinate[] } {
  const { colour, coordinates, isLocked } = token;
  const path = tokenPaths[colour];
  
  if (isLocked) {
    if (diceNumber === 6) {
      const startCoord = TOKEN_START_COORDINATES[colour];
      return {
        hasTokenReachedHome: false,
        isCaptured: false,
        hasPlayerWon: false,
        path: [startCoord]
      };
    }
    return { hasTokenReachedHome: false, isCaptured: false, hasPlayerWon: false, path: [] };
  }

  const currentCoordIndex = findCoordIndex(path, coordinates);
  if (currentCoordIndex === -1) {
    return { hasTokenReachedHome: false, isCaptured: false, hasPlayerWon: false, path: [] };
  }

  const finalIndex = Math.min(currentCoordIndex + diceNumber, path.length - 1);
  const movePath: TCoordinate[] = [];
  for (let i = currentCoordIndex + 1; i <= finalIndex; i++) {
    movePath.push(path[i]);
  }

  const lastTokenCoord = path[finalIndex];
  const hasTokenReachedHome = areCoordsEqual(lastTokenCoord, path[path.length - 1]);
  
  let player: TPlayer | null = null;
  for (let p = 0; p < players.length; p++) {
    if (players[p].colour === colour) {
      player = players[p];
      break;
    }
  }

  let homeCount = 0;
  if (player && player.tokens) {
    for (let t = 0; t < player.tokens.length; t++) {
      if (player.tokens[t].hasTokenReachedHome) {
        homeCount++;
      }
    }
  }

  const hasPlayerWon = hasTokenReachedHome && !token.hasTokenReachedHome && homeCount === 3;

  // Capture check
  let isCaptured = false;
  const isSafe = isCoordASafeSpot(lastTokenCoord);
  if (!isSafe) {
    // Find if there is any opponent token on this cell
    for (let p = 0; p < players.length; p++) {
      const opp = players[p];
      if (opp.colour !== colour && opp.tokens) {
        for (let t = 0; t < opp.tokens.length; t++) {
          const oppT = opp.tokens[t];
          if (!oppT.isLocked && !oppT.hasTokenReachedHome && areCoordsEqual(oppT.coordinates, lastTokenCoord)) {
            isCaptured = true;
            break;
          }
        }
      }
      if (isCaptured) break;
    }
  }

  return { hasTokenReachedHome, isCaptured, hasPlayerWon, path: movePath };
}

// ─── INITIALIZATION HELPERS ──────────────────────────────────────────────────
function genInitialTokens(colour: TPlayerColour): TToken[] {
  const lockedCoords = TOKEN_LOCKED_COORDINATES[colour];
  const tokens: TToken[] = [];
  for (let i = 0; i < 4; i++) {
    tokens.push({
      id: i,
      colour: colour,
      coordinates: { x: lockedCoords[i].x, y: lockedCoords[i].y },
      initialCoords: { x: lockedCoords[i].x, y: lockedCoords[i].y },
      isLocked: true,
      isActive: false,
      hasTokenReachedHome: false
    });
  }
  return tokens;
}

// ─── NAKAMA STANDARD IMPLEMENTATION ───────────────────────────────────────────
function matchInit(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  params: {[key: string]: string}
): {state: nkruntime.MatchState, tickRate: number, label: string} {
  try {
    logger.info("Match Init with params: %v", params);
    
    const playersList = JSON.parse(params.players || '[]');
    const players: TPlayer[] = [];
    for (let i = 0; i < playersList.length; i++) {
      const p = playersList[i];
      const colour = (p.color || p.colour || 'blue') as TPlayerColour;
      players.push({
        name: p.name,
        colour: colour,
        isBot: !!p.isBot,
        numberOfConsecutiveSix: 0,
        tokens: genInitialTokens(colour),
        id: p.id || "",
        userId: p.userId || "",
        missedTurns: 0,
        hasQuit: false
      });
    }

    const playerSequence: TPlayerColour[] = [];
    for (let i = 0; i < players.length; i++) {
      playerSequence.push(players[i].colour);
    }

    const state = {
      roomId: ctx.matchId,
      players: players,
      playerSequence: playerSequence,
      currentTurnIndex: 0,
      diceNumber: -1,
      hasRolled: false,
      consecutiveSixes: 0,
      turnDeadlineMs: Date.now() + 15000,
      status: 'playing',
      
      tickCount: 0,
      emptyTicks: 0,
      botTakeoverTicks: {} as {[userId: string]: number},
      botRollTick: null as number | null,
      botMoveTick: null as number | null,
      noMovableTokensTimer: null as number | null
    };

    return {
      state,
      tickRate: 30,
      label: ""
    };
  } catch (e: any) {
    const errMsg = e?.message || e?.error || String(e);
    logger.error("Error in matchInit: %v", errMsg);
    throw e;
  }
}

function matchJoinAttempt(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: nkruntime.MatchState,
  presence: nkruntime.Presence,
  metadata: {[key: string]: any}
): {state: nkruntime.MatchState, accept: boolean, rejectMessage?: string} | null {
  const s = state as any;
  let playerExists = false;
  for (let i = 0; i < s.players.length; i++) {
    if (s.players[i].userId === presence.userId) {
      playerExists = true;
      break;
    }
  }
  if (playerExists) {
    return { state, accept: true };
  }
  return { state, accept: false, rejectMessage: "Not part of this match" };
}

function sendStateSync(dispatcher: nkruntime.MatchDispatcher, state: any, presence: nkruntime.Presence) {
  dispatcher.broadcastMessage(200, JSON.stringify({
    roomId: state.roomId,
    players: state.players,
    playerSequence: state.playerSequence,
    currentTurnColour: state.playerSequence[state.currentTurnIndex],
    diceNumber: state.diceNumber,
    hasRolled: state.hasRolled,
    consecutiveSixes: state.consecutiveSixes,
    turnDeadlineMs: state.turnDeadlineMs,
    status: state.status
  }), [presence]);
}

function matchJoin(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: nkruntime.MatchState,
  presences: nkruntime.Presence[]
): {state: nkruntime.MatchState} | null {
  const s = state as any;
  for (let p = 0; p < presences.length; p++) {
    const presence = presences[p];
    for (let i = 0; i < s.players.length; i++) {
      const player = s.players[i];
      if (player.userId === presence.userId) {
        player.id = presence.sessionId;
        player.isBot = false;
        if (player.name.indexOf(' (Bot)') !== -1) {
          player.name = player.name.replace(' (Bot)', '');
        }
        if (s.botTakeoverTicks[presence.userId]) {
          delete s.botTakeoverTicks[presence.userId];
        }
        sendStateSync(dispatcher, s, presence);
      }
    }
  }

  return { state };
}

function matchLeave(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: nkruntime.MatchState,
  presences: nkruntime.Presence[]
): {state: nkruntime.MatchState} | null {
  const s = state as any;
  for (let p = 0; p < presences.length; p++) {
    const presence = presences[p];
    for (let i = 0; i < s.players.length; i++) {
      const player = s.players[i];
      if (player.userId === presence.userId) {
        s.botTakeoverTicks[presence.userId] = tick + 120; // 4 seconds at 30Hz
      }
    }
  }
  return { state };
}

function nextTurn(state: any, dispatcher: nkruntime.MatchDispatcher) {
  state.currentTurnIndex = (state.currentTurnIndex + 1) % state.playerSequence.length;
  const nextColour = state.playerSequence[state.currentTurnIndex];
  
  state.diceNumber = -1;
  state.hasRolled = false;
  state.consecutiveSixes = 0;
  state.turnDeadlineMs = Date.now() + 15000;
  state.botRollTick = null;
  state.botMoveTick = null;
  state.noMovableTokensTimer = null;

  dispatcher.broadcastMessage(203, JSON.stringify({
    nextTurnColour: nextColour,
    deadlineMs: state.turnDeadlineMs
  }));
}

function resolvePostMoveTurnHandoff(
  state: any,
  dispatcher: nkruntime.MatchDispatcher,
  colour: TPlayerColour,
  diceNumber: number,
  hasTokenReachedHome: boolean,
  isCaptured: boolean
) {
  const getsAnotherTurn = (diceNumber === 6 && state.consecutiveSixes < 3) || isCaptured || hasTokenReachedHome;
  
  if (getsAnotherTurn) {
    state.diceNumber = -1;
    state.hasRolled = false;
    state.turnDeadlineMs = Date.now() + 15000;
    state.botRollTick = null;
    state.botMoveTick = null;
    state.noMovableTokensTimer = null;

    dispatcher.broadcastMessage(203, JSON.stringify({
      nextTurnColour: colour,
      deadlineMs: state.turnDeadlineMs
    }));
  } else {
    state.consecutiveSixes = 0;
    nextTurn(state, dispatcher);
  }
}

function executeRoll(state: any, dispatcher: nkruntime.MatchDispatcher, colour: TPlayerColour) {
  const roll = Math.floor(Math.random() * 6) + 1;
  state.diceNumber = roll;
  state.hasRolled = true;

  if (roll === 6) {
    state.consecutiveSixes++;
  } else {
    state.consecutiveSixes = 0;
  }

  let player: TPlayer | null = null;
  for (let i = 0; i < state.players.length; i++) {
    if (state.players[i].colour === colour) {
      player = state.players[i];
      break;
    }
  }

  const allTokens: TToken[] = [];
  for (let p = 0; p < state.players.length; p++) {
    const pl = state.players[p];
    if (pl.tokens) {
      for (let t = 0; t < pl.tokens.length; t++) {
        allTokens.push(pl.tokens[t]);
      }
    }
  }
  
  let hasMovableTokens = false;
  if (player && player.tokens) {
    if (state.consecutiveSixes === 3) {
      hasMovableTokens = false;
    } else {
      for (let t = 0; t < player.tokens.length; t++) {
        if (isTokenMovable(player.tokens[t], roll, allTokens)) {
          hasMovableTokens = true;
          break;
        }
      }
    }
  }

  dispatcher.broadcastMessage(201, JSON.stringify({
    roll: roll,
    colour: colour,
    hasMovableTokens: hasMovableTokens
  }));

  if (state.consecutiveSixes === 3) {
    state.consecutiveSixes = 0;
    state.noMovableTokensTimer = Date.now() + 1500;
  } else if (!hasMovableTokens) {
    state.noMovableTokensTimer = Date.now() + 1500;
  } else {
    state.turnDeadlineMs = Date.now() + 15000;
  }
}

function selectBestBotToken(player: TPlayer, roll: number, allTokens: TToken[]): TToken | null {
  const movableTokens: TToken[] = [];
  if (player.tokens) {
    for (let i = 0; i < player.tokens.length; i++) {
      if (isTokenMovable(player.tokens[i], roll, allTokens)) {
        movableTokens.push(player.tokens[i]);
      }
    }
  }
  if (movableTokens.length === 0) return null;

  // 1. Prioritize Capture moves
  for (let i = 0; i < movableTokens.length; i++) {
    const t = movableTokens[i];
    const result = computeMoveResult(t, roll, [player]);
    if (result.path.length > 0) {
      const dest = result.path[result.path.length - 1];
      let opponentExists = false;
      for (let k = 0; k < allTokens.length; k++) {
        const opp = allTokens[k];
        if (opp.colour !== player.colour && !opp.isLocked && !opp.hasTokenReachedHome && areCoordsEqual(opp.coordinates, dest)) {
          opponentExists = true;
          break;
        }
      }
      if (opponentExists && !isCoordASafeSpot(dest)) {
        return t;
      }
    }
  }

  // 2. Prioritize Reaching Home
  for (let i = 0; i < movableTokens.length; i++) {
    const t = movableTokens[i];
    const result = computeMoveResult(t, roll, [player]);
    if (result.hasTokenReachedHome) return t;
  }

  // 3. Prioritize Unlocking
  for (let i = 0; i < movableTokens.length; i++) {
    const t = movableTokens[i];
    if (t.isLocked && roll === 6) return t;
  }

  // 4. Default: Pick the token furthest along the path
  let bestToken = movableTokens[0];
  let maxPathIndex = -1;
  const path = tokenPaths[player.colour];
  
  for (let i = 0; i < movableTokens.length; i++) {
    const t = movableTokens[i];
    const idx = findCoordIndex(path, t.coordinates);
    if (idx > maxPathIndex) {
      maxPathIndex = idx;
      bestToken = t;
    }
  }

  return bestToken;
}

function executeMove(
  state: any,
  dispatcher: nkruntime.MatchDispatcher,
  colour: TPlayerColour,
  tokenId: number
) {
  let player: TPlayer | null = null;
  for (let i = 0; i < state.players.length; i++) {
    if (state.players[i].colour === colour) {
      player = state.players[i];
      break;
    }
  }
  if (!player || !player.tokens) return;

  let token: TToken | null = null;
  for (let i = 0; i < player.tokens.length; i++) {
    if (player.tokens[i].id === tokenId) {
      token = player.tokens[i];
      break;
    }
  }
  if (!token) return;

  const roll = state.diceNumber;
  const allTokens: TToken[] = [];
  for (let p = 0; p < state.players.length; p++) {
    const pl = state.players[p];
    if (pl.tokens) {
      for (let t = 0; t < pl.tokens.length; t++) {
        allTokens.push(pl.tokens[t]);
      }
    }
  }

  if (!isTokenMovable(token, roll, allTokens)) {
    return;
  }

  const { hasTokenReachedHome, isCaptured, hasPlayerWon, path } = computeMoveResult(token, roll, state.players);

  // Update token coordinates
  if (token.isLocked && roll === 6) {
    token.isLocked = false;
    token.coordinates = TOKEN_START_COORDINATES[colour];
  } else {
    token.coordinates = path[path.length - 1];
  }

  if (hasTokenReachedHome) {
    token.hasTokenReachedHome = true;
    token.coordinates = getHomeCoordForColour(colour);
  }

  let capturedTokenColour: string | undefined = undefined;
  let capturedTokenId: number | undefined = undefined;

  if (isCaptured) {
    const dest = token.coordinates;
    for (let k = 0; k < allTokens.length; k++) {
      const oppToken = allTokens[k];
      if (oppToken.colour !== colour && !oppToken.isLocked && !oppToken.hasTokenReachedHome && areCoordsEqual(oppToken.coordinates, dest)) {
        oppToken.isLocked = true;
        oppToken.coordinates = { x: oppToken.initialCoords.x, y: oppToken.initialCoords.y };
        capturedTokenColour = oppToken.colour;
        capturedTokenId = oppToken.id;
        break;
      }
    }
  }

  // Broadcast the move result
  dispatcher.broadcastMessage(202, JSON.stringify({
    colour: colour,
    id: tokenId,
    isUnlock: token.isLocked === false && roll === 6 && path.length === 1,
    path: path,
    hasTokenReachedHome: hasTokenReachedHome,
    isCaptured: isCaptured,
    hasPlayerWon: hasPlayerWon,
    capturedTokenColour: capturedTokenColour,
    capturedTokenId: capturedTokenId
  }));

  if (hasPlayerWon) {
    state.status = 'ended';
    state.winnerColour = colour;
    dispatcher.broadcastMessage(204, JSON.stringify({
      winnerColour: colour
    }));
    return;
  }

  resolvePostMoveTurnHandoff(state, dispatcher, colour, roll, hasTokenReachedHome, isCaptured);
}

function matchLoop(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: nkruntime.MatchState,
  messages: nkruntime.MatchMessage[]
): {state: nkruntime.MatchState} | null {
  const s = state as any;
  s.tickCount = tick;

  if (s.status === 'ended') {
    return null;
  }

  // 1. Bot takeover transition countdown
  for (const userId in s.botTakeoverTicks) {
    if (tick >= s.botTakeoverTicks[userId]) {
      let player: TPlayer | null = null;
      for (let i = 0; i < s.players.length; i++) {
        if (s.players[i].userId === userId) {
          player = s.players[i];
          break;
        }
      }
      if (player) {
        player.isBot = true;
        if (player.name.indexOf(' (Bot)') === -1) {
          player.name += ' (Bot)';
        }
        
        // Broadcast standard state sync with new bot state
        dispatcher.broadcastMessage(200, JSON.stringify({
          roomId: s.roomId,
          players: s.players,
          playerSequence: s.playerSequence,
          currentTurnColour: s.playerSequence[s.currentTurnIndex],
          diceNumber: s.diceNumber,
          hasRolled: s.hasRolled,
          consecutiveSixes: s.consecutiveSixes,
          turnDeadlineMs: s.turnDeadlineMs,
          status: s.status
        }));
      }
      delete s.botTakeoverTicks[userId];
    }
  }

  // 2. Turn Change Delay Handler (e.g. rolled a number with no moves)
  if (s.noMovableTokensTimer !== null) {
    if (Date.now() >= s.noMovableTokensTimer) {
      s.noMovableTokensTimer = null;
      nextTurn(s, dispatcher);
    }
    return { state };
  }

  // 3. Process turn deadlines (timeout)
  if (Date.now() >= s.turnDeadlineMs) {
    const currentColour = s.playerSequence[s.currentTurnIndex];
    let player: TPlayer | null = null;
    for (let i = 0; i < s.players.length; i++) {
      if (s.players[i].colour === currentColour) {
        player = s.players[i];
        break;
      }
    }
    
    if (player) {
      player.missedTurns = (player.missedTurns || 0) + 1;
      
      const allTokens: TToken[] = [];
      for (let p = 0; p < s.players.length; p++) {
        const pl = s.players[p];
        if (pl.tokens) {
          for (let t = 0; t < pl.tokens.length; t++) {
            allTokens.push(pl.tokens[t]);
          }
        }
      }

      if (!s.hasRolled) {
        executeRoll(s, dispatcher, currentColour);
        if (s.noMovableTokensTimer === null) {
          const bestToken = selectBestBotToken(player, s.diceNumber, allTokens);
          if (bestToken) {
            executeMove(s, dispatcher, currentColour, bestToken.id);
          } else {
            nextTurn(s, dispatcher);
          }
        }
      } else {
        const bestToken = selectBestBotToken(player, s.diceNumber, allTokens);
        if (bestToken) {
          executeMove(s, dispatcher, currentColour, bestToken.id);
        } else {
          nextTurn(s, dispatcher);
        }
      }
    } else {
      nextTurn(s, dispatcher);
    }
    return { state };
  }

  // 4. Client Inputs
  messages.forEach(message => {
    try {
      const opCode = message.opCode;
      const currentColour = s.playerSequence[s.currentTurnIndex];
      
      let currentPlayer: TPlayer | null = null;
      for (let i = 0; i < s.players.length; i++) {
        if (s.players[i].colour === currentColour) {
          currentPlayer = s.players[i];
          break;
        }
      }

      if (!currentPlayer || currentPlayer.id !== message.sender.sessionId) {
        return;
      }

      if (opCode === 100) { // INPUT_ROLL_DICE
        if (s.hasRolled) {
          dispatcher.broadcastMessage(205, JSON.stringify({ reason: "Already rolled" }), [message.sender]);
          return;
        }
        executeRoll(s, dispatcher, currentColour);
      } 
      else if (opCode === 101) { // INPUT_MOVE_TOKEN
        if (!s.hasRolled) {
          dispatcher.broadcastMessage(205, JSON.stringify({ reason: "Roll first" }), [message.sender]);
          return;
        }
        let data: any = {};
        try {
          data = JSON.parse(nk.binaryToString(message.data));
        } catch (e) {}

        const tokenId = typeof data.id === 'number' ? data.id : -1;
        if (tokenId === -1) return;

        const allTokens: TToken[] = [];
        for (let p = 0; p < s.players.length; p++) {
          const pl = s.players[p];
          if (pl.tokens) {
            for (let t = 0; t < pl.tokens.length; t++) {
              allTokens.push(pl.tokens[t]);
            }
          }
        }

        let token: TToken | null = null;
        for (let t = 0; t < currentPlayer.tokens.length; t++) {
          if (currentPlayer.tokens[t].id === tokenId) {
            token = currentPlayer.tokens[t];
            break;
          }
        }

        if (!token || !isTokenMovable(token, s.diceNumber, allTokens)) {
          dispatcher.broadcastMessage(205, JSON.stringify({ reason: "Invalid move" }), [message.sender]);
          return;
        }

        executeMove(s, dispatcher, currentColour, tokenId);
      }
      else if (opCode === 102) { // INPUT_PING / HEARTBEAT
        dispatcher.broadcastMessage(102, "", [message.sender]);
      }
    } catch (e) {
      logger.error("Error processing message in matchLoop: %v", e);
    }
  });

  // 5. Bot behavior
  const currentColour = s.playerSequence[s.currentTurnIndex];
  let currentPlayer: TPlayer | null = null;
  for (let i = 0; i < s.players.length; i++) {
    if (s.players[i].colour === currentColour) {
      currentPlayer = s.players[i];
      break;
    }
  }
  
  if (currentPlayer && currentPlayer.isBot && s.noMovableTokensTimer === null) {
    if (!s.hasRolled) {
      if (!s.botRollTick) {
        s.botRollTick = tick + 30; // 1 second think time at 30Hz
      } else if (tick >= s.botRollTick) {
        executeRoll(s, dispatcher, currentColour);
        s.botRollTick = null;
      }
    } else {
      if (!s.botMoveTick) {
        s.botMoveTick = tick + 30;
      } else if (tick >= s.botMoveTick) {
        const allTokens: TToken[] = [];
        for (let p = 0; p < s.players.length; p++) {
          const pl = s.players[p];
          if (pl.tokens) {
            for (let t = 0; t < pl.tokens.length; t++) {
              allTokens.push(pl.tokens[t]);
            }
          }
        }
        const bestToken = selectBestBotToken(currentPlayer, s.diceNumber, allTokens);
        if (bestToken) {
          executeMove(s, dispatcher, currentColour, bestToken.id);
        } else {
          nextTurn(s, dispatcher);
        }
        s.botMoveTick = null;
      }
    }
  } else {
    s.botRollTick = null;
    s.botMoveTick = null;
  }

  // 6. Clean empty match check
  let isMatchEmpty = true;
  for (let i = 0; i < s.players.length; i++) {
    const p = s.players[i];
    if (!p.isBot && !(p.userId in s.botTakeoverTicks)) {
      isMatchEmpty = false;
      break;
    }
  }

  if (isMatchEmpty) {
    s.emptyTicks++;
    if (s.emptyTicks > 300) {
      return null;
    }
  } else {
    s.emptyTicks = 0;
  }

  return { state };
}

function matchTerminate(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: nkruntime.MatchState,
  graceSeconds: number
): {state: nkruntime.MatchState} | null {
  return { state };
}

function matchSignal(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: nkruntime.MatchState,
  data: string
): {state: nkruntime.MatchState, data?: string} | null {
  return { state };
}
