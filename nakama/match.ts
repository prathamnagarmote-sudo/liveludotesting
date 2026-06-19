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
      noMovableTokensTimer: null as number | null,
      rematchAccepted: [] as TPlayerColour[],
      terminateAfterTicks: null as number | null,
      lastStateSyncTick: 0  // track when we last broadcast periodic STATE_SYNC
    };

    return {
      state,
      tickRate: 100,
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
    let matched = false;
    for (let i = 0; i < s.players.length; i++) {
      const player = s.players[i];
      logger.info("matchJoin: comparing player.userId=%v with presence.userId=%v", player.userId, presence.userId);
      if (player.userId === presence.userId) {
        player.id = presence.sessionId;
        player.isBot = false;
        if (player.name.indexOf(' (Bot)') !== -1) {
          player.name = player.name.replace(' (Bot)', '');
        }
        if (s.botTakeoverTicks[presence.userId]) {
          delete s.botTakeoverTicks[presence.userId];
        }
        logger.info("matchJoin: sending STATE_SYNC to presence userId=%v sessionId=%v", presence.userId, presence.sessionId);
        sendStateSync(dispatcher, s, presence);
        matched = true;
      }
    }
    if (!matched) {
      logger.warn("matchJoin: presence userId=%v did not match any player. Available userIds: %v",
        presence.userId, JSON.stringify(s.players.map(function(pl: any) { return pl.userId; })));
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
        s.botTakeoverTicks[presence.userId] = tick + 400; // 4 seconds at 100Hz
      }
    }
  }
  return { state };
}

function nextTurn(state: any, dispatcher: nkruntime.MatchDispatcher, animDuration: number = 0) {
  state.currentTurnIndex = (state.currentTurnIndex + 1) % state.playerSequence.length;
  const nextColour = state.playerSequence[state.currentTurnIndex];
  
  state.diceNumber = -1;
  state.hasRolled = false;
  state.consecutiveSixes = 0;
  state.turnDeadlineMs = Date.now() + 15000 + animDuration;
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
  isCaptured: boolean,
  animDuration: number = 0
) {
  const getsAnotherTurn = (diceNumber === 6 && state.consecutiveSixes < 3) || isCaptured || hasTokenReachedHome;
  
  if (getsAnotherTurn) {
    state.diceNumber = -1;
    state.hasRolled = false;
    state.turnDeadlineMs = Date.now() + 15000 + animDuration;
    state.botRollTick = null;
    state.botMoveTick = null;
    state.noMovableTokensTimer = null;

    dispatcher.broadcastMessage(203, JSON.stringify({
      nextTurnColour: colour,
      deadlineMs: state.turnDeadlineMs
    }));
  } else {
    state.consecutiveSixes = 0;
    nextTurn(state, dispatcher, animDuration);
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

const BOT_WEIGHTS = {
  UNLOCK_BONUS: 50000,
  CAPTURE_BASE: 60000,
  OPPONENT_PROGRESS_MULTIPLIER: 1000,
  HOME_ENTRY_BONUS: 20000,
  SAFE_TOKEN_MOVE_PENALTY: 10000,
  SAFE_POSITION_BONUS: 5000,
  GOAL_COMPLETION_BONUS: 150000,
  BASE_DISTANCE_PENALTY: 150,
  CROWDED_EXIT_BONUS: 10000,
  UNSAFE_STACKING_PENALTY: 65000,
  SAFE_HUNT_CRITICAL_RANGE_BONUS: 20000,
  SAFE_CHASE_BASE_BONUS: 15000,
  RISKY_CHASE_BASE_BONUS: 10000,
  RISKY_HUNT_CRITICAL_RANGE_BONUS: 15000,
  HIGH_INVESTMENT_ESCAPE_PRIORITY: 55000,
  LOW_INVESTMENT_ESCAPE_PRIORITY: 42000,
  ESCAPE_DISTANCE_MULTIPLIER: 5000,
  CRITICAL_ESCAPE_BONUS: 20000,
  SAFE_HAVEN_BONUS: 35000,
  UNSAFE_ESCAPE_PENALTY: 10000,
  SAFE_SPOT_ABANDONMENT_PENALTY: 100000,
  SAFE_SPOT_EXIT_PENALTY: 5000,
  STACK_SPLIT_BONUS: 2000,
  IMMINENT_CAPTURE_PENALTY: 120000,
};

const BOT_LOGIC_CONFIG = {
  UNLOCK_DICE_VALUE: 6,
  TOKENS_PER_PLAYER: 4,
  MAX_CHASE_LOOKAHEAD: 15,
  MAX_THREAT_LOOKAHEAD: 12,
  RISKY_HUNT_RANGE: 8,
  CRITICAL_COMBAT_RANGE: 6,
  HIGH_INVESTMENT_DIST: 25,
  ENDGAME_TOKEN_COUNT: 3,
  SAFETY_TOKEN_COUNT: 2,
  ENDGAME_SCORE_MULTIPLIER: 10,
  SAFETY_SCORE_MULTIPLIER: 2,
  DEFAULT_MULTIPLIER: 1,
  DANGER_ZONE_RANGE: 9,
};

function areTokensOnOverlappingPaths(token1: TToken, token2: TToken): boolean {
  const coord1 = token1.coordinates;
  const coord2 = token2.coordinates;

  const tokenPath1 = tokenPaths[token1.colour];
  const tokenPath2 = tokenPaths[token2.colour];

  const tokenPath1CoordIndex = findCoordIndex(tokenPath1, coord1);
  const tokenPath2CoordIndex = findCoordIndex(tokenPath2, coord2);

  if (tokenPath1CoordIndex === -1 || tokenPath2CoordIndex === -1) return false;

  for (let i = tokenPath1CoordIndex; i < tokenPath1.length; i++) {
    if (areCoordsEqual(tokenPath1[i], coord2)) return true;
  }
  for (let i = tokenPath2CoordIndex; i < tokenPath2.length; i++) {
    if (areCoordsEqual(tokenPath2[i], coord1)) return true;
  }

  return false;
}

function getDistanceBetweenTokens(token1: TToken, token2: TToken): number {
  const coord1 = token1.coordinates;
  const coord2 = token2.coordinates;
  if (!areTokensOnOverlappingPaths(token1, token2)) return -1;
  
  const expandedGeneralTokenPath = expandTokenPath(GENERAL_TOKEN_PATH).slice(0, -1);
  const index1 = findCoordIndex(expandedGeneralTokenPath, coord1);
  const index2 = findCoordIndex(expandedGeneralTokenPath, coord2);
  if (index1 === -1 || index2 === -1) return -1;
  const pathLength = expandedGeneralTokenPath.length;
  const forwardDistance = (index2 - index1 + pathLength) % pathLength;
  const backwardDistance = (index1 - index2 + pathLength) % pathLength;

  return Math.min(forwardDistance, backwardDistance);
}

function isTokenAhead(token1: TToken, token2: TToken): boolean {
  if (areCoordsEqual(token1.coordinates, token2.coordinates)) return false;
  if (!areTokensOnOverlappingPaths(token1, token2)) return false;

  const token1Path = tokenPaths[token1.colour];
  const token2Path = tokenPaths[token2.colour];
  const token2CoordIndex = findCoordIndex(token2Path, token2.coordinates);
  const token1CoordIndex = findCoordIndex(token1Path, token1.coordinates);
  const minDist = getDistanceBetweenTokens(token1, token2);

  if (token2CoordIndex === -1 || token1CoordIndex === -1) return false;

  for (let i = token2CoordIndex; i < token2Path.length; i++) {
    if (i - token2CoordIndex > minDist) break;
    if (areCoordsEqual(token2Path[i], token1.coordinates)) return true;
  }
  for (let i = token1CoordIndex; i < token1Path.length; i++) {
    if (i - token1CoordIndex > minDist) break;
    if (areCoordsEqual(token1Path[i], token2.coordinates)) return false;
  }
  return false;
}

function getFinalCoord(token: TToken, diceNumber: number): TCoordinate | null {
  const tokenPath = tokenPaths[token.colour];
  const currentCoordIndex = findCoordIndex(tokenPath, token.coordinates);
  if (currentCoordIndex === -1) return null;
  const finalIndex = currentCoordIndex + diceNumber;
  if (finalIndex >= tokenPath.length) return null;
  return tokenPath[finalIndex];
}

function selectBestBotToken(player: TPlayer, roll: number, allTokens: TToken[]): TToken | null {
  const botTokens: TToken[] = [];
  for (let i = 0; i < allTokens.length; i++) {
    if (allTokens[i].colour === player.colour) {
      botTokens.push(allTokens[i]);
    }
  }

  const movableBotTokens: TToken[] = [];
  for (let i = 0; i < botTokens.length; i++) {
    if (isTokenMovable(botTokens[i], roll, allTokens)) {
      movableBotTokens.push(botTokens[i]);
    }
  }
  if (movableBotTokens.length === 0) return null;

  const botTokenHomeCoord = getHomeCoordForColour(player.colour);
  const botTokenStartCoord = tokenPaths[player.colour][0];
  
  const expandedGeneralTokenPath = expandTokenPath(GENERAL_TOKEN_PATH).slice(0, -1);
  const activeOpponentTokens: TToken[] = [];
  for (let i = 0; i < allTokens.length; i++) {
    const t = allTokens[i];
    if (t.colour !== player.colour && isTokenMovable(t) && findCoordIndex(expandedGeneralTokenPath, t.coordinates) !== -1) {
      activeOpponentTokens.push(t);
    }
  }

  interface TokenScore {
    token: TToken;
    feasibilityScore: number;
  }
  
  const tokenScores: TokenScore[] = [];

  for (let idx = 0; idx < botTokens.length; idx++) {
    const token = botTokens[idx];
    let feasibilityScore = 0;
    let finalCoord: TCoordinate | null = null;

    const isUnlockable = token.isLocked && !token.hasTokenReachedHome && roll === BOT_LOGIC_CONFIG.UNLOCK_DICE_VALUE;
    if (isUnlockable) {
      feasibilityScore += BOT_WEIGHTS.UNLOCK_BONUS;
      finalCoord = tokenPaths[token.colour][0];
    } else {
      finalCoord = getFinalCoord(token, roll);
      if (!isTokenMovable(token, roll, allTokens)) {
        tokenScores.push({ token, feasibilityScore: -Infinity });
        continue;
      }
    }

    if (!finalCoord) {
      tokenScores.push({ token, feasibilityScore: -Infinity });
      continue;
    }

    const isFinalCoordSafe = isCoordASafeSpot(finalCoord, token.colour);
    const isCurrentCoordSafe = isCoordASafeSpot(token.coordinates, token.colour);
    
    let botTokensAtHome = 0;
    for (let i = 0; i < botTokens.length; i++) {
      if (botTokens[i].hasTokenReachedHome) botTokensAtHome++;
    }

    const endgameMultiplier = botTokensAtHome >= BOT_LOGIC_CONFIG.ENDGAME_TOKEN_COUNT ? BOT_LOGIC_CONFIG.ENDGAME_SCORE_MULTIPLIER : BOT_LOGIC_CONFIG.DEFAULT_MULTIPLIER;
    const safetyMultiplier = botTokensAtHome > BOT_LOGIC_CONFIG.SAFETY_TOKEN_COUNT ? BOT_LOGIC_CONFIG.SAFETY_SCORE_MULTIPLIER : BOT_LOGIC_CONFIG.DEFAULT_MULTIPLIER;

    // Capturable check
    for (let i = 0; i < allTokens.length; i++) {
      const t = allTokens[i];
      if (t.colour !== player.colour && areCoordsEqual(finalCoord, t.coordinates) && !isCoordASafeSpot(t.coordinates, t.colour)) {
        const distToEnd = getDistanceInTokenPath(t.colour, t.coordinates, getHomeCoordForColour(t.colour));
        const distTraveled = tokenPaths[t.colour].length - distToEnd;
        feasibilityScore += BOT_WEIGHTS.CAPTURE_BASE + distTraveled * BOT_WEIGHTS.OPPONENT_PROGRESS_MULTIPLIER;
      }
    }

    if (isFinalCoordSafe) feasibilityScore += BOT_WEIGHTS.SAFE_POSITION_BONUS;

    const isTokenAlreadyInHomeEntryPath = isCoordInHomeEntryPathForColour(token.coordinates, token.colour);
    const willTokenBeInHomeEntryPath = isCoordInHomeEntryPathForColour(finalCoord, token.colour);

    if (willTokenBeInHomeEntryPath && !isTokenAlreadyInHomeEntryPath) {
      feasibilityScore += BOT_WEIGHTS.HOME_ENTRY_BONUS;
    }

    if (isTokenAlreadyInHomeEntryPath) {
      feasibilityScore -= BOT_WEIGHTS.SAFE_TOKEN_MOVE_PENALTY;
    }

    if (token.isLocked) {
      tokenScores.push({ token, feasibilityScore });
      continue;
    }

    const distFromHome = getDistanceInTokenPath(token.colour, token.coordinates, botTokenHomeCoord);
    const distFromStart = getDistanceInTokenPath(token.colour, token.coordinates, botTokenStartCoord);
    
    let botTokensInCurrentCoord = 0;
    for (let i = 0; i < movableBotTokens.length; i++) {
      if (areCoordsEqual(movableBotTokens[i].coordinates, token.coordinates)) {
        botTokensInCurrentCoord++;
      }
    }

    const canTokenReachHome = distFromHome === roll;
    if (canTokenReachHome) feasibilityScore += BOT_WEIGHTS.GOAL_COMPLETION_BONUS;

    feasibilityScore -= distFromHome * BOT_WEIGHTS.BASE_DISTANCE_PENALTY * endgameMultiplier;

    let oppTokensAtCurrentCoord = 0;
    for (let i = 0; i < activeOpponentTokens.length; i++) {
      if (areCoordsEqual(activeOpponentTokens[i].coordinates, token.coordinates)) {
        oppTokensAtCurrentCoord++;
      }
    }

    const isCrowdedSafeSpotAndRolled6 = roll === BOT_LOGIC_CONFIG.UNLOCK_DICE_VALUE && isCurrentCoordSafe && oppTokensAtCurrentCoord > 0;
    if (isCrowdedSafeSpotAndRolled6) feasibilityScore += BOT_WEIGHTS.CROWDED_EXIT_BONUS;

    let botTokensInFinalCoord = 0;
    for (let i = 0; i < movableBotTokens.length; i++) {
      if (areCoordsEqual(movableBotTokens[i].coordinates, finalCoord)) {
        botTokensInFinalCoord++;
      }
    }
    if (botTokensInFinalCoord > 0 && !isFinalCoordSafe) {
      feasibilityScore -= BOT_WEIGHTS.UNSAFE_STACKING_PENALTY;
    }

    let isSafeLaunchHunter = false;
    let hasRefundedDistance = false;

    for (let i = 0; i < activeOpponentTokens.length; i++) {
      const oppToken = activeOpponentTokens[i];
      const isBotTokenAheadOfOppTokenInFuture = isTokenAhead({ ...token, coordinates: finalCoord }, oppToken);
      const futureDist = getDistanceBetweenTokens({ ...token, coordinates: finalCoord }, oppToken);
      const isBotTokenAheadOfOppTokenCurrently = isTokenAhead(token, oppToken);
      const currentDist = getDistanceBetweenTokens(token, oppToken);

      if (currentDist >= 1 && currentDist <= BOT_LOGIC_CONFIG.MAX_CHASE_LOOKAHEAD && !isBotTokenAheadOfOppTokenCurrently) {
        let isThreatenedFromBehind = false;
        for (let j = 0; j < activeOpponentTokens.length; j++) {
          const t = activeOpponentTokens[j];
          const dist = getDistanceBetweenTokens(token, t);
          const isOpponentBehind = isTokenAhead(token, t);
          if (isOpponentBehind && dist >= 1 && dist <= BOT_LOGIC_CONFIG.MAX_THREAT_LOOKAHEAD) {
            isThreatenedFromBehind = true;
            break;
          }
        }

        if (!isThreatenedFromBehind || isFinalCoordSafe) {
          if (currentDist <= BOT_LOGIC_CONFIG.CRITICAL_COMBAT_RANGE) {
            feasibilityScore += BOT_WEIGHTS.SAFE_HUNT_CRITICAL_RANGE_BONUS;
          }
          feasibilityScore += BOT_WEIGHTS.SAFE_CHASE_BASE_BONUS;
          if (!isThreatenedFromBehind) isSafeLaunchHunter = true;
        } else if (currentDist <= BOT_LOGIC_CONFIG.RISKY_HUNT_RANGE) {
          feasibilityScore += BOT_WEIGHTS.RISKY_CHASE_BASE_BONUS;
          if (currentDist <= BOT_LOGIC_CONFIG.CRITICAL_COMBAT_RANGE) {
            feasibilityScore += BOT_WEIGHTS.RISKY_HUNT_CRITICAL_RANGE_BONUS;
          }
        }
      }

      if (currentDist >= 1 && currentDist <= BOT_LOGIC_CONFIG.MAX_THREAT_LOOKAHEAD && isBotTokenAheadOfOppTokenCurrently && !isCurrentCoordSafe) {
        const distFromStartCurrent = tokenPaths[token.colour].length - distFromHome;
        if (distFromStartCurrent > BOT_LOGIC_CONFIG.HIGH_INVESTMENT_DIST) {
          feasibilityScore += BOT_WEIGHTS.HIGH_INVESTMENT_ESCAPE_PRIORITY;
        } else {
          feasibilityScore += BOT_WEIGHTS.LOW_INVESTMENT_ESCAPE_PRIORITY;
        }
      }

      if (futureDist >= 1 && futureDist <= BOT_LOGIC_CONFIG.MAX_THREAT_LOOKAHEAD && isBotTokenAheadOfOppTokenInFuture) {
        let threatsCount = 0;
        for (let j = 0; j < activeOpponentTokens.length; j++) {
          const t = activeOpponentTokens[j];
          const dist = getDistanceBetweenTokens({ ...token, coordinates: finalCoord }, t);
          const isOpponentBehind = isTokenAhead({ ...token, coordinates: finalCoord }, t);
          if (isOpponentBehind && dist >= 1 && dist <= BOT_LOGIC_CONFIG.DANGER_ZONE_RANGE) {
            threatsCount++;
          }
        }

        const isGoingIntoDanger = isBotTokenAheadOfOppTokenInFuture && !isBotTokenAheadOfOppTokenCurrently && !isFinalCoordSafe && threatsCount > 0;
        if (isGoingIntoDanger) {
          feasibilityScore -= BOT_WEIGHTS.IMMINENT_CAPTURE_PENALTY * threatsCount * Math.max(1, distFromStart / 2);
        }

        const isEscaping = isBotTokenAheadOfOppTokenCurrently && futureDist > currentDist && !isCurrentCoordSafe;
        if (isEscaping || (isFinalCoordSafe && isBotTokenAheadOfOppTokenCurrently && !isCurrentCoordSafe)) {
          if (isEscaping) {
            feasibilityScore += (futureDist - currentDist) * BOT_WEIGHTS.ESCAPE_DISTANCE_MULTIPLIER;
          }
          if (currentDist <= BOT_LOGIC_CONFIG.CRITICAL_COMBAT_RANGE) {
            if (isEscaping) feasibilityScore += BOT_WEIGHTS.CRITICAL_ESCAPE_BONUS;
            if (!hasRefundedDistance) {
              feasibilityScore += distFromHome * BOT_WEIGHTS.BASE_DISTANCE_PENALTY * endgameMultiplier;
              hasRefundedDistance = true;
            }
          }
          if (isFinalCoordSafe) feasibilityScore += BOT_WEIGHTS.SAFE_HAVEN_BONUS;
          else if (isEscaping) feasibilityScore -= BOT_WEIGHTS.UNSAFE_ESCAPE_PENALTY;
        } else {
          const isProtected = isFinalCoordSafe || willTokenBeInHomeEntryPath;
          if (!isProtected && isCurrentCoordSafe && !isGoingIntoDanger) {
            feasibilityScore -= BOT_WEIGHTS.SAFE_SPOT_ABANDONMENT_PENALTY * safetyMultiplier;
          }
        }
      }
    }

    if (isCurrentCoordSafe && !isSafeLaunchHunter && !isCrowdedSafeSpotAndRolled6) {
      feasibilityScore -= BOT_WEIGHTS.SAFE_SPOT_EXIT_PENALTY;
    } else if (botTokensInCurrentCoord > 1) {
      feasibilityScore += botTokensInCurrentCoord * BOT_WEIGHTS.STACK_SPLIT_BONUS;
    }

    tokenScores.push({ token, feasibilityScore });
  }

  let maxScore = -Infinity;
  for (let i = 0; i < tokenScores.length; i++) {
    if (tokenScores[i].feasibilityScore > maxScore) {
      maxScore = tokenScores[i].feasibilityScore;
    }
  }

  const bestTokens: TToken[] = [];
  for (let i = 0; i < tokenScores.length; i++) {
    if (tokenScores[i].feasibilityScore === maxScore) {
      bestTokens.push(tokenScores[i].token);
    }
  }

  if (bestTokens.length === 0) return null;
  const randIndex = Math.floor(Math.random() * bestTokens.length);
  return bestTokens[randIndex];
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
  const wasLocked = token.isLocked;

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
    isUnlock: wasLocked === true && roll === 6 && path.length === 1,
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
    state.terminateAfterTicks = state.tickCount + 2000; // 20 seconds at 100Hz
    state.rematchAccepted = [];
    dispatcher.broadcastMessage(204, JSON.stringify({
      winnerColour: colour
    }));
    return;
  }

  // Calculate animation duration
  let forwardDuration = 0;
  const isUnlock = wasLocked && roll === 6 && path.length === 1;
  if (isUnlock) {
    forwardDuration = 300;
  } else {
    forwardDuration = path.length * 300;
  }

  let captureDuration = 0;
  if (isCaptured && capturedTokenColour && typeof capturedTokenId === 'number') {
    const dest = token.coordinates;
    for (let k = 0; k < allTokens.length; k++) {
      const oppToken = allTokens[k];
      if (oppToken.colour === capturedTokenColour && oppToken.id === capturedTokenId) {
        const oppPath = tokenPaths[oppToken.colour as TPlayerColour];
        let oppIndex = -1;
        for (let i = 0; i < oppPath.length; i++) {
          if (areCoordsEqual(oppPath[i], dest)) {
            oppIndex = i;
            break;
          }
        }
        if (oppIndex !== -1) {
          captureDuration = oppIndex * 100;
        }
        break;
      }
    }
  }

  const animDuration = forwardDuration + captureDuration + 200; // 200ms safety buffer

  resolvePostMoveTurnHandoff(state, dispatcher, colour, roll, hasTokenReachedHome, isCaptured, animDuration);
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

  // ─── Periodic STATE_SYNC: broadcast full state every ~5 seconds (500 ticks @ 100Hz)
  // This guarantees clients get STATE_SYNC even if the initial matchJoin push was lost.
  if (tick - s.lastStateSyncTick >= 500) {
    s.lastStateSyncTick = tick;
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

  if (s.status === 'ended') {
    // Process rematch messages
    messages.forEach(message => {
      const opCode = message.opCode;
      if (opCode === 101 || opCode === 102 || opCode === 103) {
        // Relay rematch requests to other players
        const otherPlayers = s.players.filter((p: any) => p.id && p.id !== message.sender.sessionId && !p.isBot);
        const relayPresences: nkruntime.Presence[] = [];
        for (let i = 0; i < otherPlayers.length; i++) {
          relayPresences.push({
            sessionId: otherPlayers[i].id,
            userId: otherPlayers[i].userId,
            username: otherPlayers[i].name,
            node: ""
          });
        }
        if (relayPresences.length > 0) {
          dispatcher.broadcastMessage(opCode, message.data, relayPresences);
        }

        // Authoritative rematch processing
        let senderColour: TPlayerColour | null = null;
        for (let i = 0; i < s.players.length; i++) {
          if (s.players[i].id === message.sender.sessionId) {
            senderColour = s.players[i].colour;
            break;
          }
        }

        if (senderColour) {
          if (opCode === 101 || opCode === 102) {
            if (s.rematchAccepted.indexOf(senderColour) === -1) {
              s.rematchAccepted.push(senderColour);
            }

            // Check if all active human players accepted
            const activeHumanColours: TPlayerColour[] = [];
            for (let i = 0; i < s.players.length; i++) {
              if (!s.players[i].isBot && !s.players[i].hasQuit) {
                activeHumanColours.push(s.players[i].colour);
              }
            }

            let allAccepted = true;
            for (let i = 0; i < activeHumanColours.length; i++) {
              if (s.rematchAccepted.indexOf(activeHumanColours[i]) === -1) {
                allAccepted = false;
                break;
              }
            }

            if (allAccepted && activeHumanColours.length > 0) {
              // RESET THE GAME STATE ON SERVER FOR REMATCH!
              s.status = 'playing';
              s.diceNumber = -1;
              s.hasRolled = false;
              s.consecutiveSixes = 0;
              s.currentTurnIndex = 0;
              s.turnDeadlineMs = Date.now() + 15000;
              s.botRollTick = null;
              s.botMoveTick = null;
              s.noMovableTokensTimer = null;
              s.rematchAccepted = [];
              s.terminateAfterTicks = null;

              // Reset players' tokens and missed turns
              for (let i = 0; i < s.players.length; i++) {
                s.players[i].missedTurns = 0;
                s.players[i].numberOfConsecutiveSix = 0;
                s.players[i].tokens = genInitialTokens(s.players[i].colour);
              }

              // Broadcast STATE_SYNC (OpCode 200) to reset all clients
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
          } else if (opCode === 103) {
            // Declined: terminate early
            s.terminateAfterTicks = tick;
          }
        }
      }
    });

    if (s.terminateAfterTicks !== null && tick >= s.terminateAfterTicks) {
      return null;
    }
    return { state: s };
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
      
      if (player.missedTurns >= 3) {
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

      // Allow quit at any time, even if it's not the player's turn
      if (opCode === 7) { // INPUT_QUIT_GAME
        let senderColour: TPlayerColour | null = null;
        for (let i = 0; i < s.players.length; i++) {
          if (s.players[i].id === message.sender.sessionId) {
            senderColour = s.players[i].colour;
            break;
          }
        }
        if (senderColour) {
          // Mark as quit
          let quitPlayer: TPlayer | null = null;
          for (let i = 0; i < s.players.length; i++) {
            if (s.players[i].colour === senderColour) {
              quitPlayer = s.players[i];
              quitPlayer.hasQuit = true;
              break;
            }
          }
          
          // Remove from playerSequence
          const newSequence: TPlayerColour[] = [];
          for (let i = 0; i < s.playerSequence.length; i++) {
            if (s.playerSequence[i] !== senderColour) {
              newSequence.push(s.playerSequence[i]);
            }
          }
          s.playerSequence = newSequence;

          // Adjust currentTurnIndex if needed
          if (s.playerSequence.length > 0) {
            s.currentTurnIndex = s.currentTurnIndex % s.playerSequence.length;
          }

          // Check if match should end (e.g. only 1 player left)
          let activeHumanCount = 0;
          let winnerColour: TPlayerColour = s.playerSequence[0];
          for (let i = 0; i < s.players.length; i++) {
            if (!s.players[i].isBot && !s.players[i].hasQuit) {
              activeHumanCount++;
              winnerColour = s.players[i].colour;
            }
          }

          if (activeHumanCount <= 1 || s.playerSequence.length <= 1) {
            s.status = 'ended';
            s.winnerColour = winnerColour;
            s.terminateAfterTicks = tick + 2000;
            s.rematchAccepted = [];
            dispatcher.broadcastMessage(204, JSON.stringify({
              winnerColour: winnerColour
            }));
          } else {
            // Broadcast state sync to notify others
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

            // If it was the quitting player's turn, change turn
            const turnColour = s.playerSequence[s.currentTurnIndex];
            if (turnColour === senderColour) {
              nextTurn(s, dispatcher);
            }
          }
        }
        return;
      }

      const currentColour = s.playerSequence[s.currentTurnIndex];
      let currentPlayer: TPlayer | null = null;
      for (let i = 0; i < s.players.length; i++) {
        if (s.players[i].colour === currentColour) {
          currentPlayer = s.players[i];
          break;
        }
      }

      if (opCode === 199) { // REQUEST_STATE_SYNC — any player can request their current game state
        // Update the player's sessionId in case of reconnect
        for (let i = 0; i < s.players.length; i++) {
          if (s.players[i].userId === message.sender.userId) {
            s.players[i].id = message.sender.sessionId;
            s.players[i].isBot = false;
            if (s.botTakeoverTicks[message.sender.userId]) {
              delete s.botTakeoverTicks[message.sender.userId];
            }
          }
        }
        logger.info("REQUEST_STATE_SYNC from userId=%v sessionId=%v", message.sender.userId, message.sender.sessionId);
        sendStateSync(dispatcher, s, message.sender);
        return;
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
        s.botRollTick = tick + 40; // 400ms think time at 100Hz
      } else if (tick >= s.botRollTick) {
        executeRoll(s, dispatcher, currentColour);
        s.botRollTick = null;
      }
    } else {
      if (!s.botMoveTick) {
        s.botMoveTick = tick + 40; // 400ms think time at 100Hz
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
    if (s.emptyTicks > 1000) {
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
