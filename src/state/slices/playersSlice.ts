import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { genLockedTokens } from '../../game/tokens/factory';
import { ERRORS } from '../../utils/errors';
import { TOKEN_START_COORDINATES } from '../../game/tokens/constants';
import { isTokenMovable } from '../../game/tokens/logic';
import type {
  TPlayer,
  TPlayerColour,
  TPlayerNameAndColour,
  TCoordinate,
  TPlayerCount,
} from '../../types';
import type { TToken, TTokenColourAndId, TTokenAlignmentData } from '../../types';
import { playerSequences } from '../../game/players/constants';

type TPlayerState = {
  players: TPlayer[];
  currentPlayerColour: TPlayerColour | null;
  playerSequence: TPlayerColour[];
  isAnyTokenMoving: boolean;
  movingTokenColour: TPlayerColour | null;
  isGameEnded: boolean;
  isGameOver: boolean;
  playerFinishOrder: TPlayerNameAndColour[];
};

export const initialState: TPlayerState = {
  players: [],
  currentPlayerColour: null,
  playerSequence: [],
  isAnyTokenMoving: false,
  movingTokenColour: null,
  isGameEnded: false,
  isGameOver: false,
  playerFinishOrder: [],
};

export function getPlayer(state: TPlayerState, colour: TPlayerColour) {
  const playerIndex = state.players.findIndex((p) => p.colour === colour);
  const player = state.players[playerIndex];
  if (!player) throw new Error(ERRORS.playerDoesNotExist(colour));
  return player;
}

export function getToken(state: TPlayerState, colour: TPlayerColour, id: number): TToken {
  const player = getPlayer(state, colour);
  const token = player.tokens.find((t) => t.id === id);
  if (!token) throw new Error(ERRORS.tokenDoesNotExist(player.colour, id));
  return token;
}

const reducers = {
  registerNewPlayer: (
    state: TPlayerState,
    action: PayloadAction<{
      name: string;
      colour: TPlayerColour;
      isBot: boolean;
      avatarUrl?: string;
      level?: number;
      id?: string;
      userId?: string;
    }>
  ) => {
    const player = state.players.find((p) => p.colour === action.payload.colour);
    if (player) throw new Error(ERRORS.playerAlreadyExists(action.payload.colour));
    state.players.push({
      name: action.payload.name,
      colour: action.payload.colour,
      isBot: action.payload.isBot,
      tokens: genLockedTokens(action.payload.colour),
      numberOfConsecutiveSix: 0,
      playerFinishTime: -1,
      avatarUrl: action.payload.avatarUrl,
      level: action.payload.level,
      id: action.payload.id,
      userId: action.payload.userId,
      missedTurns: 0,
      hasQuit: false,
    });
  },

  changeCoordsOfToken: (
    state: TPlayerState,
    action: PayloadAction<{
      colour: TPlayerColour;
      id: number;
      newCoords: TCoordinate;
    }>
  ) => {
    const token = getToken(state, action.payload.colour, action.payload.id);

    token.coordinates = action.payload.newCoords;
  },

  changeTurn: (state: TPlayerState) => {
    const { currentPlayerColour, playerSequence } = state;
    // Deactivate all tokens for all players on turn change
    state.players.forEach((p) => {
      p.tokens.forEach((t) => (t.isActive = false));
    });
    if (!currentPlayerColour) {
      state.currentPlayerColour = 'blue';
      return;
    }
    const currentPlayerIndex = playerSequence.indexOf(currentPlayerColour);
    const nextPlayerIndex =
      currentPlayerIndex === playerSequence.length - 1 ? 0 : currentPlayerIndex + 1;

    state.currentPlayerColour = playerSequence[nextPlayerIndex];
  },

  setPlayerSequence: (
    state: TPlayerState,
    action: PayloadAction<{ playerCount: TPlayerCount }>
  ) => {
    state.playerSequence = playerSequences[action.payload.playerCount];
  },

  activateTokens: (
    state: TPlayerState,
    action: PayloadAction<{ all: boolean; colour: TPlayerColour; diceNumber: number }>
  ) => {
    const player = getPlayer(state, action.payload.colour);
    const allTokens = state.players.flatMap((p) => p.tokens);
    if (action.payload.all) {
      return player.tokens.forEach((t) => {
        if (
          (!t.hasTokenReachedHome && t.isLocked) ||
          (!t.isLocked && isTokenMovable(t, action.payload.diceNumber, allTokens))
        )
          t.isActive = true;
      });
    }
    player.tokens.forEach((t) => {
      if (isTokenMovable(t, action.payload.diceNumber, allTokens)) t.isActive = true;
    });
  },

  deactivateAllTokens: (state: TPlayerState, action: PayloadAction<TPlayerColour>) => {
    const player = getPlayer(state, action.payload);
    player.tokens.forEach((t) => (t.isActive = false));
  },

  deactivateTokensOfAllPlayers: (state: TPlayerState) => {
    state.players.forEach((p) => {
      p.tokens.forEach((t) => (t.isActive = false));
    });
  },

  unlockToken: (state: TPlayerState, action: PayloadAction<TTokenColourAndId>) => {
    const token = getToken(state, action.payload.colour, action.payload.id);
    if (!token.isLocked)
      throw new Error(ERRORS.tokenAlreadyUnlocked(action.payload.colour, action.payload.id));
    token.isLocked = false;
    token.coordinates = TOKEN_START_COORDINATES[action.payload.colour];
  },
  lockToken: (state: TPlayerState, action: PayloadAction<TTokenColourAndId>) => {
    const token = getToken(state, action.payload.colour, action.payload.id);
    if (token.isLocked)
      throw new Error(ERRORS.tokenAlreadyLocked(action.payload.colour, action.payload.id));
    token.isLocked = true;
    token.coordinates = { ...token.initialCoords };
  },

  incrementNumberOfConsecutiveSix: (state: TPlayerState, action: PayloadAction<TPlayerColour>) => {
    const player = getPlayer(state, action.payload);
    player.numberOfConsecutiveSix++;
  },

  resetNumberOfConsecutiveSix: (state: TPlayerState, action: PayloadAction<TPlayerColour>) => {
    const player = getPlayer(state, action.payload);
    player.numberOfConsecutiveSix = 0;
  },

  incrementMissedTurns: (state: TPlayerState, action: PayloadAction<TPlayerColour>) => {
    const player = getPlayer(state, action.payload);
    player.missedTurns = (player.missedTurns || 0) + 1;
    // NOTE: We intentionally do NOT end the game here.
    // In offline (local) play, game-over from missed turns is triggered separately via changeTurnThunk.
    // In online play, the host broadcasts OpCode 10 (forfeit) when a player exceeds the limit,
    // so all clients receive the authoritative game-over signal simultaneously.
    // Automatically ending the game from this local reducer would cause race conditions.
  },

  resetGameState: (state: TPlayerState) => {
    state.isGameEnded = false;
    state.isGameOver = false;
    state.isAnyTokenMoving = false;
    state.playerFinishOrder = [];
    state.players.forEach((p) => {
      p.missedTurns = 0;
      p.numberOfConsecutiveSix = 0;
      p.playerFinishTime = -1;
      p.tokens = genLockedTokens(p.colour);
    });
  },

  setIsAnyTokenMoving: (
    state: TPlayerState,
    action: PayloadAction<boolean | { isMoving: boolean; colour?: TPlayerColour }>
  ) => {
    if (typeof action.payload === 'boolean') {
      state.isAnyTokenMoving = action.payload;
      if (!action.payload) state.movingTokenColour = null;
    } else {
      state.isAnyTokenMoving = action.payload.isMoving;
      state.movingTokenColour = action.payload.isMoving ? (action.payload.colour || null) : null;
    }
  },
  changeVisualCoordsOfToken: (
    state: TPlayerState,
    action: PayloadAction<{ colour: TPlayerColour; id: number; newCoords: TCoordinate }>
  ) => {
    const token = getToken(state, action.payload.colour, action.payload.id);
    token.visualCoordinates = action.payload.newCoords;
  },
  syncVisualCoordinates: (state: TPlayerState) => {
    state.players.forEach((p) => {
      p.tokens.forEach((t) => {
        t.visualCoordinates = { ...t.coordinates };
      });
    });
  },
  markTokenAsReachedHome: (state: TPlayerState, action: PayloadAction<TTokenColourAndId>) => {
    if (state.isGameEnded) return;
    const token = getToken(state, action.payload.colour, action.payload.id);
    token.hasTokenReachedHome = true;
    token.isLocked = true;
    const player = getPlayer(state, action.payload.colour);
    const hasPlayerWon = player.tokens.every((t) => t.hasTokenReachedHome);
    if (!hasPlayerWon) return;
    player.playerFinishTime = Date.now();
    state.playerSequence = state.playerSequence.filter((p) => p !== action.payload.colour);
    state.playerFinishOrder.push({ name: player.name, colour: action.payload.colour });
    if (state.playerSequence.length === 1) {
      state.playerFinishOrder.push({
        name: getPlayer(state, state.playerSequence[0]).name,
        colour: state.playerSequence[0],
      });
      state.isGameEnded = true;
    }
  },
  setTokenAlignmentData: (
    state: TPlayerState,
    action: PayloadAction<{
      colour: TPlayerColour;
      id: number;
      newAlignmentData: TTokenAlignmentData;
    }>
  ) => {
    const token = getToken(state, action.payload.colour, action.payload.id);
    token.tokenAlignmentData = action.payload.newAlignmentData;
  },
  setPlayerSequenceDirect: (
    state: TPlayerState,
    action: PayloadAction<TPlayerColour[]>
  ) => {
    state.playerSequence = action.payload;
  },
  convertPlayerToBot: (
    state: TPlayerState,
    action: PayloadAction<{ colour: TPlayerColour }>
  ) => {
    const player = state.players.find((p) => p.colour === action.payload.colour);
    if (player) {
      player.isBot = true;
      if (!player.name.includes('(Bot)')) {
        player.name += ' (Bot)';
      }
    }
  },
  setCurrentPlayerColour: (
    state: TPlayerState,
    action: PayloadAction<TPlayerColour>
  ) => {
    state.currentPlayerColour = action.payload;
  },
  declareForfeit: (
    state: TPlayerState,
    action: PayloadAction<{ losingColour: TPlayerColour }>
  ) => {
    if (state.isGameEnded) return;
    
    const losingPlayer = state.players.find((p) => p.colour === action.payload.losingColour);
    if (!losingPlayer) return;

    const remainingPlayers = state.players.filter(
      (p) => p.colour !== action.payload.losingColour && !state.playerFinishOrder.some((f) => f.colour === p.colour)
    );

    remainingPlayers.forEach((p) => {
      state.playerFinishOrder.push({ name: p.name, colour: p.colour });
    });

    state.playerFinishOrder.push({ name: losingPlayer.name, colour: losingPlayer.colour });

    state.isGameEnded = true;
  },
  endGameDueToTimeout: (state: TPlayerState) => {
    state.isGameEnded = true;
    // Note: We don't populate playerFinishOrder here because the UI will instead use 
    // getLeaderboardStandings() dynamically from the final state.
  },
  quitMatch: (state: TPlayerState, action: PayloadAction<TPlayerColour>) => {
    const player = getPlayer(state, action.payload);
    player.hasQuit = true;
    state.playerSequence = state.playerSequence.filter((p) => p !== action.payload);
    if (state.playerSequence.length === 1) {
      state.isGameEnded = true;
    } else if (state.playerSequence.length === 0) {
      state.isGameEnded = true;
    }
  },
  forceEndGameAsQuit: (state: TPlayerState, action: PayloadAction<TPlayerColour>) => {
    const player = getPlayer(state, action.payload);
    player.hasQuit = true;
    state.isGameEnded = true;
  },
  syncTokenStateDirect: (
    state: TPlayerState,
    action: PayloadAction<{
      colour: TPlayerColour;
      id: number;
      coordinates: TCoordinate;
      isLocked: boolean;
      hasTokenReachedHome: boolean;
    }>
  ) => {
    const token = getToken(state, action.payload.colour, action.payload.id);
    token.coordinates = action.payload.coordinates;
    token.isLocked = action.payload.isLocked;
    token.hasTokenReachedHome = action.payload.hasTokenReachedHome;
  },
  clearPlayersState: () => initialState,
};

const playersSlice = createSlice({
  name: 'players',
  initialState,
  reducers,
});

export const {
  registerNewPlayer,
  changeCoordsOfToken,
  setPlayerSequence,
  changeTurn,
  activateTokens,
  deactivateAllTokens,
  deactivateTokensOfAllPlayers,
  unlockToken,
  lockToken,
  incrementNumberOfConsecutiveSix,
  resetNumberOfConsecutiveSix,
  incrementMissedTurns,
  setIsAnyTokenMoving,
  resetGameState,
  markTokenAsReachedHome,
  setTokenAlignmentData,
  setPlayerSequenceDirect,
  convertPlayerToBot,
  setCurrentPlayerColour,
  declareForfeit,
  endGameDueToTimeout,
  quitMatch,
  forceEndGameAsQuit,
  clearPlayersState,
  changeVisualCoordsOfToken,
  syncVisualCoordinates,
  syncTokenStateDirect,
} = playersSlice.actions;

export default playersSlice.reducer;

