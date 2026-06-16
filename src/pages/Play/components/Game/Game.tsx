import React, { useEffect, useRef, createContext, useMemo, useState, useCallback } from 'react';
import {
  registerNewPlayer,
  setPlayerSequence,
  setPlayerSequenceDirect,
  setCurrentPlayerColour,
  activateTokens,
  deactivateAllTokens,
  setIsAnyTokenMoving,
  declareForfeit,
  incrementNumberOfConsecutiveSix,
  resetNumberOfConsecutiveSix,
} from '../../../../state/slices/playersSlice';
import { type TPlayerColour } from '../../../../types';
import Board from '../Board/Board';
import { useDispatch, useSelector, useStore } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../state/store';
import { registerDice, setDiceNumberDirect, setIsPlaceholderShowing, setIsVisualRolling } from '../../../../state/slices/diceSlice';
import { handlePostDiceRollThunk } from '../../../../state/thunks/handlePostDiceRollThunk';
import GameFinishedScreen from '../GameFinishedScreen/GameFinishedScreen';
import { changeTurnThunk } from '../../../../state/thunks/changeTurnThunk';
import { useMoveAndCaptureToken } from '../../../../hooks/useMoveAndCaptureToken';
import type { TPlayerInitData, TToken, TPlayer } from '../../../../types';
import { useNavigate } from 'react-router-dom';
import { quitMatchThunk } from '../../../../state/thunks/quitMatchThunk';
import { playerCountToWord } from '../../../../game/players/logic';
import { usePageLeaveBlocker } from '../../../../hooks/usePageLeaveBlocker';
import { addToGameInactiveTime, setGameStartTime, setMatchDuration, setTimeRemainingMs } from '../../../../state/slices/sessionSlice';
import { useGameTimer } from '../../../../hooks/useGameTimer';
import ScoreBoard from '../ScoreBoard/ScoreBoard';
import styles from './Game.module.css';
import menuIcon from '../../../../assets/menu.svg';
import { getNakamaSocket, ensureSocketConnected } from '../../../../services/nakama';
import { toast } from 'react-toastify';
import { selectBestTokenForBot } from '../../../../game/bot/selectBestTokenForBot';
import { isTokenMovable, tokensWithCoord } from '../../../../game/tokens/logic';
import { areCoordsEqual } from '../../../../game/coords/logic';
import { unlockAndAlignTokens } from '../../../../state/thunks/unlockAndAlignTokens';
import { setTokenTransitionTime } from '../../../../utils/setTokenTransitionTime';
import { FORWARD_TOKEN_TRANSITION_TIME, TOKEN_SAFE_COORDINATES } from '../../../../game/tokens/constants';
import { tokenPaths } from '../../../../game/tokens/paths';
import type { MatchData } from '@heroiclabs/nakama-js';


export const EXIT_MESSAGE = 'Are you sure you want to exit? Any progress made will be lost.';

export const OnlineGameContext = createContext<{
  isOnline: boolean;
  roomId: string;
  myPlayerColour: TPlayerColour;
  amHost: boolean;
  optimisticTokenMovesRef?: React.MutableRefObject<Set<string>>;
  onHostTokenMove?: (colour: TPlayerColour, id: number, isUnlock: boolean) => void;
} | null>(null);

type Props = {
  initData?: TPlayerInitData[];
  isOnline?: boolean;
  matchedToken?: string;
  matchId?: string;
  matchedUsers?: Array<{
    presence: { user_id: string; session_id: string; username: string };
    string_properties?: { avatarUrl?: string; avatar_url?: string; level?: string; name?: string; userName?: string };
  }>;
  myPlayerId?: string;
  myUserId?: string;
  canonicalColour?: TPlayerColour;
};

const areAllTokensInSameCoord = (tokens: TToken[]) => {
  if (tokens.length === 0) return false;
  return tokens.every(t => areCoordsEqual(tokens[0].coordinates, t.coordinates));
};

const getNextTurnColour = (currentColour: TPlayerColour, playerSequence: TPlayerColour[]): TPlayerColour => {
  const idx = playerSequence.indexOf(currentColour);
  return playerSequence[(idx + 1) % playerSequence.length];
};

const computeMoveResult = (token: TToken, diceNumber: number, state: RootState) => {
  const { colour, coordinates } = token;
  const tokenPath = tokenPaths[colour];
  const currentCoordIndex = tokenPath.findIndex((v) => areCoordsEqual(v, coordinates));
  
  if (currentCoordIndex === -1) {
    return { hasTokenReachedHome: false, isCaptured: false, hasPlayerWon: false };
  }

  const finalIndex = Math.min(currentCoordIndex + diceNumber, tokenPath.length - 1);
  const lastTokenCoord = tokenPath[finalIndex];
  
  const hasTokenReachedHome = areCoordsEqual(lastTokenCoord, tokenPath[tokenPath.length - 1]);
  
  const player = state.players.players.find((p: TPlayer) => p.colour === colour);
  const homeCount = player ? player.tokens.filter((t: TToken) => t.hasTokenReachedHome).length : 0;
  // If the token wasn't already home, and now reaches home, it's counted
  const hasPlayerWon = hasTokenReachedHome && !token.hasTokenReachedHome && homeCount === 3;

  // Capture check
  let isCaptured = false;
  const isSafe = TOKEN_SAFE_COORDINATES.some((c) => areCoordsEqual(c, lastTokenCoord));
  if (!isSafe) {
    const capturableTokens = tokensWithCoord(lastTokenCoord, state.players.players).filter(
      (t) => t.colour !== colour
    );
    if (capturableTokens.length > 0) {
      isCaptured = true;
    }
  }

  return { hasTokenReachedHome, isCaptured, hasPlayerWon };
};

function Game({
  initData = [],
  isOnline,
  matchedToken,
  matchId,
  matchedUsers,
  myPlayerId,
  myUserId,
  canonicalColour
}: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const store = useStore<RootState>();
  const boardTileSize = useSelector((state: RootState) => state.board.boardTileSize);
  const { playerSequence, isGameEnded, currentPlayerColour, players } =
    useSelector((state: RootState) => state.players);
  const playersRegisteredInitiallyRef = useRef(true);
  const gameInactiveStartTime = useRef(0);
  const navigate = useNavigate();
  const moveAndCapture = useMoveAndCaptureToken();
  useGameTimer();

  const [roomId, setRoomId] = useState<string>('');
  const [myPlayerColour, setMyPlayerColour] = useState<TPlayerColour>(canonicalColour || 'blue');
  const [isMatchJoined, setIsMatchJoined] = useState(!isOnline);
  usePageLeaveBlocker(isMatchJoined && !isGameEnded && import.meta.env.PROD);
  const [localSessionId, setLocalSessionId] = useState<string>('');
  const matchJoinedRef = useRef(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [music, setMusic] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('musicEnabled') !== 'false';
  });
  const [vibration, setVibration] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('vibrationEnabled') !== 'false';
  });

  const toggleMusic = () => {
    const nextVal = !music;
    setMusic(nextVal);
    localStorage.setItem('musicEnabled', String(nextVal));
  };

  const toggleVibration = () => {
    const nextVal = !vibration;
    setVibration(nextVal);
    localStorage.setItem('vibrationEnabled', String(nextVal));
    if (nextVal && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  // No colorMap needed — all colors transmitted as canonical strings

  useEffect(() => {
    if (initData.length === 0) return;
    
    // Set match duration based on player count: 5 mins for 2P, 10 mins for 4P
    const matchDurationMs = initData.length === 2 ? 300000 : 600000;
    dispatch(setMatchDuration(matchDurationMs));

    if (!isOnline) {
      dispatch(setPlayerSequence({ playerCount: playerCountToWord(initData.length) }));
      dispatch(setGameStartTime(Date.now()));
    }
  }, [dispatch, initData.length, isOnline]);

  useEffect(() => {
    if (initData.length === 0) return;
    if (isOnline) return; // For online, handled after OpCode 1
    for (let i = 0; i < initData.length; i++) {
      if (!playerSequence.length || !playersRegisteredInitiallyRef.current) return;
      const rawColour = initData[i].colour || playerSequence[i];
      const colour = rawColour;
      dispatch(
        registerNewPlayer({
          name: initData[i].name,
          colour,
          isBot: initData[i].isBot,
          avatarUrl: initData[i].avatarUrl,
        })
      );
      dispatch(registerDice(colour));
    }
    playersRegisteredInitiallyRef.current = false;
  }, [dispatch, playerSequence, initData, isOnline]);

  useEffect(() => {
    const handlePageVisibilityChange = () => {
      if (isGameEnded) return;
      if (document.visibilityState === 'hidden') {
        gameInactiveStartTime.current = Date.now();
      } else if (document.visibilityState === 'visible' && gameInactiveStartTime.current > 0) {
        const now = Date.now();
        dispatch(addToGameInactiveTime(now - gameInactiveStartTime.current));
        gameInactiveStartTime.current = 0;
      }
    };
    document.addEventListener('visibilitychange', handlePageVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handlePageVisibilityChange);
  }, [dispatch, isGameEnded]);

  // Turn controller for Local Pass & Play
  useEffect(() => {
    if (isOnline) return;
    if (currentPlayerColour || players.length === 0 || initData.length === 0) return;
    dispatch(changeTurnThunk(moveAndCapture));
  }, [currentPlayerColour, dispatch, initData.length, moveAndCapture, players.length, isOnline]);

  // Stable ref to always have the latest roomId without re-running the effect
  const roomIdRef = useRef<string>('');
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);

  // Stable ref to always have the latest myPlayerColour without re-running the effect
  const myPlayerColourRef = useRef<TPlayerColour>(canonicalColour || 'blue');
  useEffect(() => { myPlayerColourRef.current = myPlayerColour; }, [myPlayerColour]);

  const optimisticTokenMovesRef = useRef<Set<string>>(new Set());

  const onHostTokenMove = useCallback((colour: TPlayerColour, id: number, isUnlock: boolean) => {
    try {
      const socket = getNakamaSocket();
      const currentRoomId = roomIdRef.current;
      const state = store.getState();
      const playersList = state.players.players;
      const player = playersList.find(p => p.colour === colour);
      if (!player) return;
      const token = player.tokens.find(t => t.id === id);
      if (!token) return;

      const diceNumber = state.dice.dice.find(d => d.colour === colour)?.diceNumber || 1;

      console.log('[HOST] Local Host executing and broadcasting token move:', colour, id, 'isUnlock:', isUnlock);

      if (isUnlock) {
        // Broadcast unlock result to ALL clients immediately
        socket.sendMatchState(currentRoomId, 9, JSON.stringify({
          colour,
          id,
          isUnlock: true,
          hasTokenReachedHome: false,
          isCaptured: false,
          hasPlayerWon: false,
          timeRemainingMs: store.getState().session.timeRemainingMs,
        }));

        // Unlock always gives the same player another turn
        socket.sendMatchState(currentRoomId, 6, JSON.stringify({
          nextTurnColour: colour,
          timeRemainingMs: store.getState().session.timeRemainingMs,
        }));
      } else {
        const { hasTokenReachedHome, isCaptured, hasPlayerWon } = computeMoveResult(token, diceNumber, state);

        // Broadcast move result to ALL clients immediately
        socket.sendMatchState(currentRoomId, 9, JSON.stringify({
          colour,
          id,
          isUnlock: false,
          hasTokenReachedHome,
          isCaptured,
          hasPlayerWon,
          timeRemainingMs: store.getState().session.timeRemainingMs,
        }));

        if (!hasPlayerWon) {
          const getsAnotherTurn =
            (diceNumber === 6 && (player.numberOfConsecutiveSix ?? 0) < 3) ||
            isCaptured ||
            hasTokenReachedHome;
          const nextColour = getsAnotherTurn ? colour : getNextTurnColour(colour, playerSequence);
          socket.sendMatchState(currentRoomId, 6, JSON.stringify({
            nextTurnColour: nextColour,
            timeRemainingMs: store.getState().session.timeRemainingMs,
          }));
        }
      }
    } catch (err) {
      console.error('[HOST] Failed to resolve and broadcast host token move:', err);
    }
  }, [store, playerSequence]);

  // Handle Online Match turn coordination
  // ARCHITECTURE: Host-Authoritative Relay
  //   - All game logic (dice, moves, turn changes) executes ONLY on the HOST.
  //   - The HOST broadcasts the authoritative result to ALL clients via OpCodes.
  //   - ALL clients (including host) apply broadcast state identically — zero local pre-processing.
  //   - Players send REQUEST OpCodes (3=roll, 5=move) to the host.
  //   - Host responds with STATE OpCodes (8=dice result, 9=token move result, 6=turn change).
  useEffect(() => {
    if (!isOnline || (!matchedToken && !matchId)) return;

    let socket: ReturnType<typeof getNakamaSocket>;
    try {
      socket = getNakamaSocket();
    } catch(e) {
      navigate('/setup');
      return;
    }

    const getEffectivePlayerId = () => localSessionId || myPlayerId || '';

    // Monkeypatch sendMatchState to simulate local loopback for the sender.
    // Nakama relay match sendMatchState does not send the message back to the sender,
    // but our game architecture assumes all clients (including host/sender) process match state.
    const originalSendMatchState = socket.sendMatchState.bind(socket);
    socket.sendMatchState = async (matchId, opCode, data, presences) => {
      // Send to other players (non-blocking)
      originalSendMatchState(matchId, opCode, data, presences).catch((err) => {
        console.error(`[SOCKET] sendMatchState error for OpCode ${opCode}:`, err);
      });

      // Simulate local loopback
      if (socket.onmatchdata) {
        const fakeMatchData = {
          match_id: matchId,
          op_code: opCode,
          data: typeof data === 'string' ? new TextEncoder().encode(data) : data,
          presence: {
            session_id: getEffectivePlayerId(),
            user_id: myUserId || '',
            username: '',
            node: '',
          }
        } as any;
        setTimeout(() => {
          if (socket.onmatchdata) {
            console.log(`[LOCAL-LOOPBACK] Simulating match data event for OpCode ${opCode}`);
            socket.onmatchdata(fakeMatchData);
          }
        }, 0);
      }
    };

    // ─── Game Initialization ───────────────────────────────────────────────────
    const initializeGame = (playersList: any[]) => {
      if (!playersRegisteredInitiallyRef.current) return;
      console.log('[ONLINE] Initializing game locally with player list:', playersList);

      const mappedSequence = playersList.map((p: any) => p.color);
      const effectivePlayerId = getEffectivePlayerId();
      const myMatchPlayer = playersList.find((p: any) => p.id === effectivePlayerId) || playersList.find((p: any) => p.userId === myUserId);
      if (myMatchPlayer) {
        setMyPlayerColour(myMatchPlayer.color);
        myPlayerColourRef.current = myMatchPlayer.color;
      }

      dispatch(setPlayerSequenceDirect(mappedSequence));
      dispatch(setGameStartTime(Date.now()));

      const matchDurationMs = playersList.length === 2 ? 300000 : 600000;
      dispatch(setMatchDuration(matchDurationMs));

      for (let i = 0; i < playersList.length; i++) {
        const p = playersList[i];
        dispatch(registerNewPlayer({
          name: p.name,
          colour: p.color,
          isBot: p.isBot,
          avatarUrl: p.avatarUrl,
          level: p.level,
          id: p.id,
          userId: p.userId,
        }));
        dispatch(registerDice(p.color));
      }
      playersRegisteredInitiallyRef.current = false;
      dispatch(setCurrentPlayerColour(mappedSequence[0]));
      setIsMatchJoined(true);
    };

    // ─── Helper: apply turn transition on every client ─────────────────────────
    const applyTurnTransition = (nextColour: TPlayerColour) => {
      dispatch(setCurrentPlayerColour(nextColour));
      dispatch(deactivateAllTokens(nextColour));
    };

    // ─── HOST: Handle dice roll request (OpCode 3) ─────────────────────────────
    // Rolls dice, applies state locally, broadcasts OpCode 8 (result) to ALL.
    const hostHandleDiceRequest = () => {
      const state = store.getState();
      const currentPlayer = state.players.players.find(
        p => p.colour === state.players.currentPlayerColour
      );
      if (!currentPlayer) return;

      const roll = Math.floor(Math.random() * 6) + 1;
      const rollPayload = JSON.stringify({
        colour: currentPlayer.colour,
        roll,
        timeRemainingMs: store.getState().session.timeRemainingMs,
      });
      console.log('[HOST] Rolling dice for', currentPlayer.colour, '=', roll);
      // Broadcast to ALL clients (including self via relay loopback)
      socket.sendMatchState(roomIdRef.current, 8, rollPayload);
    };

    // ─── ALL CLIENTS: Apply dice result (OpCode 8) ─────────────────────────────
    // Show animation + activate/auto-move tokens for the rolling player's colour.
    const DICE_ANIM_DELAY = 700;
    const allClientsApplyDiceResult = (data: { colour: TPlayerColour; roll: number }) => {
      const colour = data.colour;
      const roll = data.roll;
      console.log('[ALL] Applying dice result:', colour, roll);

      dispatch(setDiceNumberDirect({ colour, diceNumber: roll }));
      dispatch(setIsPlaceholderShowing({ colour, isPlaceholderShowing: true }));
      dispatch(setIsVisualRolling({ colour, isVisualRolling: true }));

      setTimeout(() => {
        dispatch(setIsPlaceholderShowing({ colour, isPlaceholderShowing: false }));
        // Let the visual rolling animation finish slightly after we unblock logic
        setTimeout(() => dispatch(setIsVisualRolling({ colour, isVisualRolling: false })), 600);

        if (roll === 6) {
          dispatch(incrementNumberOfConsecutiveSix(colour));
        } else {
          dispatch(resetNumberOfConsecutiveSix(colour));
        }

        // ── Only the HOST resolves post-dice logic ──────────────────────────────
        const mySessionId = getEffectivePlayerId();
        const freshState = store.getState();
        const allSessionIds = matchedUsers ? matchedUsers.map(u => u.presence.session_id).sort() : [];
        const amHost = allSessionIds.length > 0 && allSessionIds[0] === mySessionId;
        if (!amHost) return;

        const playersList = freshState.players.players;
        const activePlayer = playersList.find(p => p.colour === colour);
        if (!activePlayer) return;

        const currentRoomId = roomIdRef.current;
        const pSeq = freshState.players.playerSequence;

        // 3 consecutive sixes → forfeit turn
        if (activePlayer.numberOfConsecutiveSix >= 3) {
          dispatch(resetNumberOfConsecutiveSix(colour));
          dispatch(deactivateAllTokens(colour));
          const nextColour = getNextTurnColour(colour, pSeq);
          socket.sendMatchState(currentRoomId, 6, JSON.stringify({ nextTurnColour: nextColour }));
          return;
        }

        // Bot auto-move
        if (activePlayer.isBot) {
          const allTokens = playersList.flatMap(p => p.tokens);
          const bestToken = selectBestTokenForBot(colour, roll, allTokens);
          if (!bestToken) {
            const nextColour = getNextTurnColour(colour, pSeq);
            socket.sendMatchState(currentRoomId, 6, JSON.stringify({ nextTurnColour: nextColour }));
          } else {
            socket.sendMatchState(currentRoomId, 5, JSON.stringify({ colour, id: bestToken.id, isUnlock: bestToken.isLocked }));
          }
          return;
        }

        // Human player — check if any tokens are movable
        const movableTokens = activePlayer.tokens.filter(t =>
          isTokenMovable(t, roll) || (roll === 6 && t.isLocked && !t.hasTokenReachedHome)
        );
        if (movableTokens.length === 0) {
          // No moves → auto-advance turn immediately
          const nextColour = getNextTurnColour(colour, pSeq);
          socket.sendMatchState(currentRoomId, 6, JSON.stringify({ nextTurnColour: nextColour }));
        } else if (movableTokens.length === 1 && areAllTokensInSameCoord(movableTokens)) {
          // Only one choice → auto-move it immediately
          const token = movableTokens[0];
          socket.sendMatchState(currentRoomId, 5, JSON.stringify({ colour, id: token.id, isUnlock: token.isLocked }));
        } else {
          // Multiple choices → activate tokens on ALL clients via broadcast
          socket.sendMatchState(currentRoomId, 11, JSON.stringify({ colour, diceNumber: roll }));
        }
      }, DICE_ANIM_DELAY);
    };

    // ─── HOST: Handle token move request (OpCode 5) ────────────────────────────
    // Executes the move, then broadcasts OpCode 9 (move result) + OpCode 6 (turn).
    const hostHandleTokenMoveRequest = (data: { colour: TPlayerColour; id: number; isUnlock: boolean }) => {
      const colour = data.colour;
      const state = store.getState();
      const playersList = state.players.players;
      const player = playersList.find(p => p.colour === colour);
      if (!player) return;
      const token = player.tokens.find(t => t.id === data.id);
      if (!token) return;

      const diceNumber = state.dice.dice.find(d => d.colour === colour)?.diceNumber || 1;
      const currentRoomId = roomIdRef.current;

      console.log('[HOST] Instantly calculating token move:', colour, data.id, 'isUnlock:', data.isUnlock);

      if (data.isUnlock) {
        // Broadcast unlock result to ALL clients (including self via loopback) immediately
        socket.sendMatchState(currentRoomId, 9, JSON.stringify({
          colour,
          id: data.id,
          isUnlock: true,
          hasTokenReachedHome: false,
          isCaptured: false,
          hasPlayerWon: false,
          timeRemainingMs: store.getState().session.timeRemainingMs,
        }));
      } else {
        const { hasTokenReachedHome, isCaptured, hasPlayerWon } = computeMoveResult(token, diceNumber, state);

        // Broadcast move result to ALL clients (including self via loopback) immediately
        socket.sendMatchState(currentRoomId, 9, JSON.stringify({
          colour,
          id: data.id,
          isUnlock: false,
          hasTokenReachedHome,
          isCaptured,
          hasPlayerWon,
          timeRemainingMs: store.getState().session.timeRemainingMs,
        }));
      }
    };

    // ─── ALL CLIENTS: Apply token move result (OpCode 9) ──────────────────────
    // Both host and non-host clients execute and animate the resulting state concurrently.
    // PERF: Host fires OpCode 6 (turn change) IMMEDIATELY — before animation completes.
    // This means the turn change propagates to all clients in parallel with the animation.
    const allClientsApplyTokenMove = async (data: {
      colour: TPlayerColour;
      id: number;
      isUnlock: boolean;
      hasTokenReachedHome: boolean;
      isCaptured: boolean;
      hasPlayerWon: boolean;
    }) => {
      const mySessionId = getEffectivePlayerId();
      const allSessionIds = matchedUsers ? matchedUsers.map(u => u.presence.session_id).sort() : [];
      const amHost = allSessionIds.length > 0 && allSessionIds[0] === mySessionId;

      const colour = data.colour;
      const state = store.getState();
      const player = state.players.players.find(p => p.colour === colour);
      if (!player) return;
      const token = player.tokens.find(t => t.id === data.id);
      if (!token) return;

      const diceNumber = state.dice.dice.find(d => d.colour === colour)?.diceNumber || 1;

      // HOST must ALWAYS broadcast OpCode 6 (next turn) immediately.
      // This must happen BEFORE any early returns so the turn always progresses.
      // NOTE: We only broadcast OpCode 6 here if the move was NOT initiated by our own optimistic click.
      // If it was our own click, we already broadcasted OpCode 6 synchronously on click.
      const tokenKey = `${colour}-${data.id}`;
      const isOptimistic = optimisticTokenMovesRef.current.has(tokenKey);

      if (amHost && !data.hasPlayerWon && !isOptimistic) {
        if (data.isUnlock) {
          // Unlock always gives the same player another turn
          socket.sendMatchState(roomIdRef.current, 6, JSON.stringify({
            nextTurnColour: colour,
            timeRemainingMs: store.getState().session.timeRemainingMs,
          }));
        } else {
          const freshState = store.getState();
          const activePlayer = freshState.players.players.find(p => p.colour === colour);
          const pSeq = freshState.players.playerSequence;
          const currentRoomId = roomIdRef.current;
          const getsAnotherTurn =
            (diceNumber === 6 && (activePlayer?.numberOfConsecutiveSix ?? 0) < 3) ||
            data.isCaptured ||
            data.hasTokenReachedHome;
          const nextColour = getsAnotherTurn ? colour : getNextTurnColour(colour, pSeq);
          socket.sendMatchState(currentRoomId, 6, JSON.stringify({
            nextTurnColour: nextColour,
            timeRemainingMs: store.getState().session.timeRemainingMs,
          }));
        }
      }

      // Optimistic skip: if we already animated this token click locally, skip re-animation.
      if (isOptimistic) {
        console.log('[OPTIMISTIC] Skipping re-animation of own token — already animated on click.', tokenKey);
        optimisticTokenMovesRef.current.delete(tokenKey); // clean up
        return;
      }

      console.log('[ALL] Applying token move result:', colour, data.id, 'amHost:', amHost);

      if (data.isUnlock) {
        dispatch(setIsAnyTokenMoving(true));
        setTokenTransitionTime(FORWARD_TOKEN_TRANSITION_TIME, token);
        dispatch(unlockAndAlignTokens({ colour, id: data.id }));
        dispatch(deactivateAllTokens(colour));
        setTimeout(() => {
          dispatch(setIsAnyTokenMoving(false));
        }, FORWARD_TOKEN_TRANSITION_TIME);
      } else {
        // Animate the opponent's token move concurrently
        await moveAndCapture(token, diceNumber);
      }
    };


    const handleMatchForfeited = (data: { winnerColor: TPlayerColour; loserColor: TPlayerColour }) => {
      const pWinner = store.getState().players.players.find(pl => pl.colour === data.winnerColor);
      const winnerName = pWinner ? pWinner.name : data.winnerColor;
      toast.info(`Match ended! Opponent left. Winner: ${winnerName}`);
      dispatch(declareForfeit({ losingColour: data.loserColor }));
    };

    let requestInterval: any;

    // IMPORTANT: Register onmatchdata BEFORE calling joinMatch() so we never miss OpCode 1
    socket.onmatchdata = (result: MatchData) => {
      const data = new TextDecoder().decode(result.data);
      let parsed: any;
      try { parsed = JSON.parse(data); } catch(e) { return; }

      const opCode = result.op_code;
      const mySessionId = getEffectivePlayerId();
      const allSessionIds = matchedUsers ? matchedUsers.map(u => u.presence.session_id).sort() : [];
      const amHost = allSessionIds.length > 0 && allSessionIds[0] === mySessionId;

      console.log(`[SOCKET] OpCode ${opCode}`, parsed);

      if (opCode >= 101 && opCode <= 103) {
        document.dispatchEvent(new CustomEvent('nakama-rematch-event', { detail: { opCode, parsed } }));
        return;
      }

      // Authoritative timer sync from host
      if (parsed && typeof parsed.timeRemainingMs === 'number') {
        dispatch(setTimeRemainingMs(parsed.timeRemainingMs));
      }

      if (opCode === 1) {
        // Init Match Data — host (or fallback via OpCode 98) sends player list
        initializeGame(parsed.players);

      } else if (opCode === 3) {
        // REQUEST: Roll dice — HOST ONLY handles this
        if (amHost) hostHandleDiceRequest();

      } else if (opCode === 5) {
        // REQUEST: Move token — HOST ONLY handles this
        if (amHost) hostHandleTokenMoveRequest(parsed);

      } else if (opCode === 6) {
        // STATE: Turn changed — ALL clients apply
        applyTurnTransition(parsed.nextTurnColour);

      } else if (opCode === 8) {
        // STATE: Dice rolled — ALL clients apply
        allClientsApplyDiceResult(parsed);

      } else if (opCode === 9) {
        // STATE: Token moved result — ALL clients apply (host skips re-application)
        allClientsApplyTokenMove(parsed);

      } else if (opCode === 11) {
        // STATE: Activate tokens for player to choose — ALL clients apply
        dispatch(activateTokens({ all: parsed.diceNumber === 6, colour: parsed.colour, diceNumber: parsed.diceNumber }));

      } else if (opCode === 7) {
        // EVENT: Player quit/forfeit
        if (parsed.colour) {
          dispatch(quitMatchThunk(parsed.colour, moveAndCapture));
        } else {
          const session_id = result.presence?.session_id;
          if (session_id) {
            const exitingPlayer = store.getState().players.players.find(p => p.id === session_id);
            if (exitingPlayer) {
              dispatch(quitMatchThunk(exitingPlayer.colour, moveAndCapture));
            }
          }
        }

      } else if (opCode === 10) {
        handleMatchForfeited(parsed);

      } else if (opCode === 98) {
        // Fallback: Non-host requesting init data — HOST responds with OpCode 1
        if (amHost) {
          const colors: TPlayerColour[] = ['blue', 'green', 'red', 'yellow'];
          const players = matchedUsers!.map((u, idx) => ({
            id: u.presence.session_id,
            userId: u.presence.user_id,
            name: u.string_properties?.name || u.string_properties?.userName || u.presence.username || ('Player ' + (idx + 1)),
            isBot: false,
            avatarUrl: u.string_properties?.avatarUrl || u.string_properties?.avatar_url || '',
            level: parseInt(u.string_properties?.level || '1'),
            color: colors[idx],
          }));
          const initPayload = JSON.stringify({ players, roomId: roomIdRef.current });
          console.log('[HOST] Responding to OpCode 98 with OpCode 1:', initPayload);
          try { socket.sendMatchState(roomIdRef.current, 1, initPayload); } catch (err) {
            console.error('Failed to send OpCode 1 in response to 98:', err);
          }
        }
      }
    };

    // Now join the match — handler is already registered above
    const joinMatchAsync = async () => {
      if (matchJoinedRef.current) return;
      matchJoinedRef.current = true;
      try {
        const liveSocket = await ensureSocketConnected();
        console.log('[ONLINE] Joining match. matchId:', matchId, 'token:', matchedToken ? 'present' : 'missing');
        let match;

        if (matchId) {
          try {
            match = await liveSocket.joinMatch(matchId);
          } catch (err: any) {
            console.warn('[ONLINE] Failed to join via matchId, falling back to token...', err);
            if (matchedToken) match = await liveSocket.joinMatch(undefined, matchedToken);
            else throw err;
          }
        } else if (matchedToken) {
          match = await liveSocket.joinMatch(undefined, matchedToken);
        } else {
          throw new Error('No match ID or matchmaking token provided.');
        }

        const joinedMatchId = match.match_id;
        setRoomId(joinedMatchId);
        roomIdRef.current = joinedMatchId;

        const mySessionId = match.self?.session_id || '';
        if (mySessionId) setLocalSessionId(mySessionId);

        if ((!matchId || match.match_id !== matchId) && matchedToken && matchedUsers && matchedUsers.length > 0) {
          const allSessionIds = matchedUsers.map(u => u.presence.session_id).sort();
          const amHost = allSessionIds[0] === mySessionId;
          console.log('[ONLINE] Relay match. amHost:', amHost, 'mySessionId:', mySessionId);

          if (amHost) {
            const colors: TPlayerColour[] = ['blue', 'green', 'red', 'yellow'];
            const players = matchedUsers.map((u, idx) => ({
              id: u.presence.session_id,
              userId: u.presence.user_id,
              name: u.string_properties?.name || u.string_properties?.userName || u.presence.username || ('Player ' + (idx + 1)),
              isBot: false,
              avatarUrl: u.string_properties?.avatarUrl || u.string_properties?.avatar_url || '',
              level: parseInt(u.string_properties?.level || '1'),
              color: colors[idx],
            }));
            setTimeout(() => {
              const initPayload = JSON.stringify({ players, roomId: joinedMatchId });
              console.log('[HOST] Sending relay OpCode 1:', initPayload);
              liveSocket.sendMatchState(joinedMatchId, 1, initPayload);
              initializeGame(players);
            }, 1500);
          } else {
            const sendRequest = () => {
              console.log('[NON-HOST] Sending OpCode 98 request...');
              try { liveSocket.sendMatchState(joinedMatchId, 98, '{}'); }
              catch (err) { console.error('Failed to send OpCode 98:', err); }
            };
            sendRequest();
            requestInterval = setInterval(() => {
              if (playersRegisteredInitiallyRef.current) sendRequest();
              else clearInterval(requestInterval);
            }, 3000);
          }
        }
      } catch (e: any) {
        matchJoinedRef.current = false;
        if (requestInterval) clearInterval(requestInterval);
        console.error('[ONLINE] Error joining match:', e);
        toast.error('Error joining match: ' + e.message);
        navigate('/setup');
      }
    };

    joinMatchAsync();

    return () => {
      socket.onmatchdata = () => {};
      socket.sendMatchState = originalSendMatchState; // Restore original sendMatchState
      if (requestInterval) clearInterval(requestInterval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, matchedToken, matchId, myPlayerId, myUserId]);

  const handleDiceRoll = (colour: TPlayerColour, diceNumber: number) => {
    if (!isOnline) {
      if (initData.length === 0) return;
      dispatch(handlePostDiceRollThunk(colour, diceNumber, moveAndCapture));
    }
  };

  const handleExitBtnClick = () => {
    setIsMenuOpen(false);

    const colourToQuit = isOnline ? (myPlayerColour || currentPlayerColour) : currentPlayerColour;

    if (isOnline && roomId) {
      try {
        getNakamaSocket().sendMatchState(roomId, 7, JSON.stringify({ colour: colourToQuit }));
      } catch (e) {}
    }

    if (colourToQuit) {
      dispatch(quitMatchThunk(colourToQuit, moveAndCapture));
    }

    // 4-Player mode: The quitting player navigates to Home immediately and skips the leaderboard
    // 2-Player mode: The match ends and the Leaderboard appears instantly
    if (players.length > 2) {
      navigate('/setup');
    }
  };

  // Determine if the local player is the host (lowest session_id alphabetically)
  const amHostValue = useMemo(() => {
    if (!matchedUsers || matchedUsers.length === 0) return false;
    const allSessionIds = matchedUsers.map(u => u.presence.session_id).sort();
    return allSessionIds[0] === (localSessionId || myPlayerId || '');
  }, [matchedUsers, localSessionId, myPlayerId]);

  const onlineContextValue = useMemo(() => {
    if (!isOnline) return null;
    return {
      isOnline: true,
      roomId,
      myPlayerColour,
      amHost: amHostValue,
      optimisticTokenMovesRef,
      onHostTokenMove,
    };
  }, [isOnline, roomId, myPlayerColour, amHostValue, onHostTokenMove]);

  if (isOnline && !isMatchJoined) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0b0222', color: '#ffca28', fontFamily: 'Jua, sans-serif' }}>
        <h2>Joining Match Session...</h2>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,202,40,0.2)', borderTop: '3px solid #ffca28', borderRadius: '50%', animation: 'spin 1s linear infinite', marginTop: '20px' }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <OnlineGameContext.Provider value={onlineContextValue}>
      <div
        className={styles.game}
        style={
          {
            '--board-tile-size': `${boardTileSize}px`,
          } as React.CSSProperties
        }
      >
        <div className={styles.boardWrapper}>
          <ScoreBoard />
          <Board onDiceClick={handleDiceRoll} />
        </div>
        <button
          type="button"
          aria-label="Menu button"
          className={styles.menuBtn}
          onClick={() => setIsMenuOpen(true)}
        >
          <img src={menuIcon} alt="Menu" className={styles.menuIconImg} />
        </button>
        {isMenuOpen && (
          <div className={styles.menuOverlay} onClick={() => setIsMenuOpen(false)}>
            <div className={styles.menuModal} onClick={(e) => e.stopPropagation()}>
              <h2 className={styles.menuTitle}>Game Menu</h2>
              
              <div className={styles.menuSettings}>
                <div className={styles.settingItem}>
                  <span className={styles.settingLabel}>Music & Sound</span>
                  <label className={styles.switch}>
                    <input type="checkbox" checked={music} onChange={toggleMusic} />
                    <span className={styles.slider} />
                  </label>
                </div>
                
                <div className={styles.settingItem}>
                  <span className={styles.settingLabel}>Vibration</span>
                  <label className={styles.switch}>
                    <input type="checkbox" checked={vibration} onChange={toggleVibration} />
                    <span className={styles.slider} />
                  </label>
                </div>
              </div>

              <div className={styles.menuActions}>
                <button
                  type="button"
                  className={styles.resumeBtn}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Resume Game
                </button>
                <button
                  type="button"
                  className={styles.quitBtn}
                  onClick={handleExitBtnClick}
                >
                  Quit Game
                </button>
              </div>
            </div>
          </div>
        )}
        {isGameEnded && <GameFinishedScreen players={players} />}
      </div>
    </OnlineGameContext.Provider>
  );
}

export default Game;
