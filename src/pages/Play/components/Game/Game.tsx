import React, { useEffect, useRef, createContext, useMemo, useState } from 'react';
import {
  registerNewPlayer,
  setPlayerSequence,
  setPlayerSequenceDirect,
  convertPlayerToBot,
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
import type { TPlayerInitData, TToken } from '../../../../types';
import { useNavigate } from 'react-router-dom';
import { playerCountToWord } from '../../../../game/players/logic';
import { usePageLeaveBlocker } from '../../../../hooks/usePageLeaveBlocker';
import { addToGameInactiveTime, setGameStartTime, setMatchDuration } from '../../../../state/slices/sessionSlice';
import { useGameTimer } from '../../../../hooks/useGameTimer';
import ScoreBoard from '../ScoreBoard/ScoreBoard';
import styles from './Game.module.css';
import menuIcon from '../../../../assets/menu.svg';
import { getNakamaSocket, ensureSocketConnected } from '../../../../services/nakama';
import { toast } from 'react-toastify';
import { selectBestTokenForBot } from '../../../../game/bot/selectBestTokenForBot';
import { isTokenMovable } from '../../../../game/tokens/logic';
import { areCoordsEqual } from '../../../../game/coords/logic';
import { unlockAndAlignTokens } from '../../../../state/thunks/unlockAndAlignTokens';
import { setTokenTransitionTime } from '../../../../utils/setTokenTransitionTime';
import { FORWARD_TOKEN_TRANSITION_TIME } from '../../../../game/tokens/constants';
import type { MatchData } from '@heroiclabs/nakama-js';


export const EXIT_MESSAGE = 'Are you sure you want to exit? Any progress made will be lost.';

export const OnlineGameContext = createContext<{
  isOnline: boolean;
  roomId: string;
  myPlayerColour: TPlayerColour;
} | null>(null);

type Props = {
  initData?: TPlayerInitData[];
  isOnline?: boolean;
  matchedToken?: string;
  matchId?: string;
  matchedUsers?: Array<{
    presence: { user_id: string; session_id: string; username: string };
    string_properties?: { avatarUrl?: string; avatar_url?: string; level?: string };
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

  const colorMap = useMemo(() => {
    return {
      blue: 'blue' as TPlayerColour,
      red: 'red' as TPlayerColour,
      green: 'green' as TPlayerColour,
      yellow: 'yellow' as TPlayerColour,
    };
  }, []);

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

  // Handle Online Match turn coordination
  // NOTE: roomId and myPlayerColour are intentionally excluded from deps to avoid resetting
  // the socket listener every time they change. Instead we use refs for latest values.
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

    const initializeGame = (playersList: any[]) => {
      if (!playersRegisteredInitiallyRef.current) return;
      console.log("Initializing game locally with player list:", playersList);
      
      const mappedSequence = playersList.map((p: any) => p.color);
      const effectivePlayerId = getEffectivePlayerId();
      const myMatchPlayer = playersList.find((p: any) => p.userId === myUserId || p.id === effectivePlayerId);
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
        dispatch(
          registerNewPlayer({
            name: p.name,
            colour: p.color,
            isBot: p.isBot,
            avatarUrl: p.avatarUrl,
            level: p.level,
            id: p.id,
            userId: p.userId
          })
        );
        dispatch(registerDice(p.color));
      }
      playersRegisteredInitiallyRef.current = false;
      setIsMatchJoined(true);
    };

    const handleTurnUpdate = (data: { currentTurnIndex: number; currentPlayerId: string; currentPlayerColour: TPlayerColour }) => {
      const localColor = colorMap[data.currentPlayerColour] || data.currentPlayerColour;
      dispatch(setCurrentPlayerColour(localColor));
      dispatch(deactivateAllTokens(localColor));
    };

    const handleDiceRolled = (data: { playerId: string; playerUserId?: string; roll: number }) => {
      const state = store.getState();
      const currentPlayers = state.players.players;
      const player = currentPlayers.find(p => p.id === data.playerId || (data.playerUserId && p.userId === data.playerUserId));
      
      const pColour = player ? player.colour : null;
      if (!pColour) return;
      const localColor = pColour;

      dispatch(setDiceNumberDirect({ colour: localColor, diceNumber: data.roll }));
      dispatch(setIsPlaceholderShowing({ colour: localColor, isPlaceholderShowing: true }));
      dispatch(setIsVisualRolling({ colour: localColor, isVisualRolling: true }));

      setTimeout(() => {
        dispatch(setIsPlaceholderShowing({ colour: localColor, isPlaceholderShowing: false }));
        setTimeout(() => {
          dispatch(setIsVisualRolling({ colour: localColor, isVisualRolling: false }));
        }, 700);

        if (data.roll === 6) {
          dispatch(incrementNumberOfConsecutiveSix(localColor));
        } else {
          dispatch(resetNumberOfConsecutiveSix(localColor));
        }

        const freshState = store.getState();
        const playersList = freshState.players.players;
        const activePlayer = playersList.find(p => p.colour === localColor);
        if (!activePlayer) return;

        const effectivePlayerId = getEffectivePlayerId();
        const isHost = playersList.some(p => p.id === effectivePlayerId && !p.isBot);
        const isBot = activePlayer.isBot;
        const currentRoomId = roomIdRef.current;
        const currentMyColour = myPlayerColourRef.current;

        if (activePlayer.numberOfConsecutiveSix === 3) {
          dispatch(resetNumberOfConsecutiveSix(localColor));
          dispatch(deactivateAllTokens(localColor));
          if (localColor === currentMyColour || (isBot && isHost)) {
            setTimeout(() => {
              const pSeq = freshState.players.playerSequence;
              const nextColour = getNextTurnColour(localColor, pSeq);
              socket.sendMatchState(currentRoomId, 6, JSON.stringify({ nextTurnColour: colorMap[nextColour] }));
            }, 1500);
          }
          return;
        }

        if (localColor === currentMyColour) {
          const movableTokens = activePlayer.tokens.filter(t =>
            isTokenMovable(t, data.roll) || (data.roll === 6 && t.isLocked && !t.hasTokenReachedHome)
          );
          if (movableTokens.length === 0) {
            setTimeout(() => {
              const pSeq = freshState.players.playerSequence;
              const nextColour = getNextTurnColour(localColor, pSeq);
              socket.sendMatchState(currentRoomId, 6, JSON.stringify({ nextTurnColour: colorMap[nextColour] }));
            }, 1500);
          } else if (movableTokens.length === 1 && areAllTokensInSameCoord(movableTokens)) {
            const token = movableTokens[0];
            socket.sendMatchState(currentRoomId, 4, JSON.stringify({ tokenId: token.id, isUnlock: token.isLocked }));
          } else {
            dispatch(activateTokens({ all: data.roll === 6, colour: localColor, diceNumber: data.roll }));
          }
        } else if (isBot && isHost) {
          const allTokens = playersList.flatMap(p => p.tokens);
          const bestToken = selectBestTokenForBot(localColor, data.roll, allTokens);

          if (!bestToken) {
            setTimeout(() => {
              const pSeq = freshState.players.playerSequence;
              const nextColour = getNextTurnColour(localColor, pSeq);
              socket.sendMatchState(currentRoomId, 6, JSON.stringify({ nextTurnColour: colorMap[nextColour] }));
            }, 1500);
          } else {
            setTimeout(() => {
              socket.sendMatchState(currentRoomId, 4, JSON.stringify({ tokenId: bestToken.id, isUnlock: bestToken.isLocked }));
            }, 1500);
          }
        }
      }, 400);
    };

    const handleTokenMoved = async (data: { colour: TPlayerColour; id: number; isUnlock: boolean }) => {
      const localColor = colorMap[data.colour] || data.colour;
      const state = store.getState();
      const playersList = state.players.players;
      const player = playersList.find(p => p.colour === localColor);
      if (!player) return;
      const token = player.tokens.find(t => t.id === data.id);
      if (!token) return;

      const diceNumber = state.dice.dice.find(d => d.colour === localColor)?.diceNumber || 1;
      const effectivePlayerId = getEffectivePlayerId();
      const currentRoomId = roomIdRef.current;
      const currentMyColour = myPlayerColourRef.current;

      if (data.isUnlock) {
        dispatch(setIsAnyTokenMoving(true));
        setTokenTransitionTime(FORWARD_TOKEN_TRANSITION_TIME, token);
        dispatch(unlockAndAlignTokens({ colour: localColor, id: data.id }));
        dispatch(deactivateAllTokens(localColor));
        setTimeout(() => {
          dispatch(setIsAnyTokenMoving(false));

          const activePlayer = store.getState().players.players.find(p => p.colour === localColor);
          const isBot = activePlayer?.isBot;
          const isHost = playersList.some(p => p.id === effectivePlayerId && !p.isBot);

          if (localColor === currentMyColour || (isBot && isHost)) {
            const nextColour = localColor; // unlock always gives another turn
            socket.sendMatchState(currentRoomId, 6, JSON.stringify({ nextTurnColour: colorMap[nextColour] }));
          }
        }, FORWARD_TOKEN_TRANSITION_TIME);
      } else {
        const moveData = await moveAndCapture(token, diceNumber);
        
        const freshState = store.getState();
        const pSeq = freshState.players.playerSequence;
        const activePlayer = freshState.players.players.find(p => p.colour === localColor);
        const isBot = activePlayer?.isBot;
        const isHost = playersList.some(p => p.id === effectivePlayerId && !p.isBot);

        if (localColor === currentMyColour || (isBot && isHost)) {
          if (moveData) {
            const { hasTokenReachedHome, isCaptured, hasPlayerWon } = moveData;
            if (hasPlayerWon) return;

            const getsAnotherTurn = (diceNumber === 6 && activePlayer!.numberOfConsecutiveSix < 3) || isCaptured || hasTokenReachedHome;
            const nextColour = getsAnotherTurn ? localColor : getNextTurnColour(localColor, pSeq);
            socket.sendMatchState(currentRoomId, 6, JSON.stringify({ nextTurnColour: colorMap[nextColour] }));
          } else {
            const nextColour = getNextTurnColour(localColor, pSeq);
            socket.sendMatchState(currentRoomId, 6, JSON.stringify({ nextTurnColour: colorMap[nextColour] }));
          }
        }
      }
    };

    const handlePlayerDisconnected = (data: { colour: TPlayerColour; playerId: string }) => {
      const localColor = colorMap[data.colour] || data.colour;
      const state = store.getState();
      const p = state.players.players.find(pl => pl.colour === localColor);
      const name = p ? p.name : localColor;
      toast.info(`${name} has disconnected. Bot taking over!`);
      dispatch(convertPlayerToBot({ colour: localColor }));
    };

    const handleMatchForfeited = (data: { winnerColor: TPlayerColour; loserColor: TPlayerColour }) => {
      const localWinnerColor = colorMap[data.winnerColor] || data.winnerColor;
      const localLoserColor = colorMap[data.loserColor] || data.loserColor;
      const pWinner = store.getState().players.players.find(pl => pl.colour === localWinnerColor);
      const winnerName = pWinner ? pWinner.name : localWinnerColor;
      toast.info(`Match ended! Opponent left. Winner: ${winnerName}`);
      dispatch(declareForfeit({ losingColour: localLoserColor }));
    };

    let requestInterval: any;

    // IMPORTANT: Register onmatchdata BEFORE calling joinMatch() so we never miss OpCode 1
    socket.onmatchdata = (result: MatchData) => {
      const data = new TextDecoder().decode(result.data);
      let parsed;
      try {
        parsed = JSON.parse(data);
      } catch(e) { return; }

      const opCode = result.op_code;

      if (opCode === 1) { // Init Match Data — server sends player list, starts game
        initializeGame(parsed.players);
      } else if (opCode === 2) {
        handleTurnUpdate(parsed);
      } else if (opCode === 3) {
        // Dice roll request — in relay matches, the host handles this (server doesn't run)
        // Check if I'm the "host" (lowest session_id alphabetically)
        if (matchedUsers && matchedUsers.length > 0) {
          const mySessionId = localSessionId || myPlayerId || '';
          const allSessionIds = matchedUsers.map(u => u.presence.session_id).sort();
          const amHost = allSessionIds[0] === mySessionId;
          if (amHost) {
            const currentRoomId = roomIdRef.current;
            const state = store.getState();
            const currentPlayer = state.players.players.find(
              p => p.colour === state.players.currentPlayerColour
            );
            if (currentPlayer) {
              const roll = Math.floor(Math.random() * 6) + 1;
              const rollPayload = JSON.stringify({
                playerId: currentPlayer.id,
                playerUserId: currentPlayer.userId,
                roll
              });
              socket.sendMatchState(currentRoomId, 8, rollPayload);
            }
          }
        }
      } else if (opCode === 8) {
        handleDiceRolled(parsed);
      } else if (opCode === 5) {
        handleTokenMoved(parsed);
      } else if (opCode === 9) {
        handlePlayerDisconnected(parsed);
      } else if (opCode === 10) {
        handleMatchForfeited(parsed);
      } else if (opCode === 98) {
        // Request Init Data (Relay Match fallback)
        // If I am the host and have the players list, send it to the requesting player
        const mySessionId = localSessionId || myPlayerId || '';
        if (matchedUsers && matchedUsers.length > 0) {
          const allSessionIds = matchedUsers.map(u => u.presence.session_id).sort();
          const amHost = allSessionIds[0] === mySessionId;
          if (amHost) {
            const colors: TPlayerColour[] = ['blue', 'green', 'red', 'yellow'];
            const players = matchedUsers.map((u, idx) => ({
              id: u.presence.session_id,
              userId: u.presence.user_id,
              name: u.presence.username || ('Player ' + (idx + 1)),
              isBot: false,
              avatarUrl: u.string_properties?.avatarUrl || u.string_properties?.avatar_url || '',
              level: parseInt(u.string_properties?.level || '1'),
              color: colors[idx]
            }));
            const initPayload = JSON.stringify({ players, roomId: roomIdRef.current });
            console.log("Host responding to OpCode 98 request with relay OpCode 1:", initPayload);
            try {
              socket.sendMatchState(roomIdRef.current, 1, initPayload);
            } catch (err) {
              console.error("Failed to send OpCode 1 payload response:", err);
            }
          }
        }
      }
    };

    // Now join the match — handler is already registered above
    const joinMatchAsync = async () => {
      if (matchJoinedRef.current) return;
      matchJoinedRef.current = true;
      try {
        // Ensure socket is alive before joining (it may have briefly dropped during React navigation)
        const liveSocket = await ensureSocketConnected();
        console.log("Attempting to join match. matchId:", matchId, "matchedToken:", matchedToken ? 'present' : 'missing');
        let match;

        if (matchId) {
          // Authoritative match — join via match_id
          console.log("Joining via matchId:", matchId);
          try {
            match = await liveSocket.joinMatch(matchId);
          } catch (err: any) {
            console.warn("Failed to join authoritative match via matchId. Falling back to relay token...", err);
            if (matchedToken) {
              match = await liveSocket.joinMatch(undefined, matchedToken);
            } else {
              throw err;
            }
          }
        } else if (matchedToken) {
          // Relay match — join via token (when server's matchmakerMatched returns void)
          console.log("Joining via relay token");
          match = await liveSocket.joinMatch(undefined, matchedToken);
        } else {
          throw new Error("No match ID or matchmaking token provided.");
        }

        const joinedMatchId = match.match_id;
        setRoomId(joinedMatchId);
        roomIdRef.current = joinedMatchId;

        const mySessionId = match.self?.session_id || '';
        if (mySessionId) setLocalSessionId(mySessionId);

        // --- Relay match host initialization ---
        // When server fails to create authoritative match, we get a relay match.
        // The "host" (first session_id alphabetically) must send OpCode 1 to
        // initialize game state for all players, mimicking server behavior.
        if ((!matchId || match.match_id !== matchId) && matchedToken && matchedUsers && matchedUsers.length > 0) {
          const allSessionIds = matchedUsers.map(u => u.presence.session_id).sort();
          const amHost = allSessionIds[0] === mySessionId;
          console.log("Relay match. amHost:", amHost, "mySessionId:", mySessionId);

          if (amHost) {
            const colors: TPlayerColour[] = ['blue', 'green', 'red', 'yellow'];
            const players = matchedUsers.map((u, idx) => ({
              id: u.presence.session_id,
              userId: u.presence.user_id,
              name: u.presence.username || ('Player ' + (idx + 1)),
              isBot: false,
              avatarUrl: u.string_properties?.avatarUrl || u.string_properties?.avatar_url || '',
              level: parseInt(u.string_properties?.level || '1'),
              color: colors[idx]
            }));

            // Wait 1.5s to ensure both clients have joined and registered their handlers
            setTimeout(() => {
              const initPayload = JSON.stringify({ players, roomId: joinedMatchId });
              console.log("Host sending relay OpCode 1:", initPayload);
              liveSocket.sendMatchState(joinedMatchId, 1, initPayload);
              initializeGame(players);
            }, 1500);
          } else {
            // Non-host sends a request immediately after joining
            const sendRequest = () => {
              console.log("Non-host sending OpCode 98 request to initialize match...");
              try {
                liveSocket.sendMatchState(joinedMatchId, 98, "{}");
              } catch (err) {
                console.error("Failed to send OpCode 98 request:", err);
              }
            };
            
            // Send request immediately
            sendRequest();
            
            // Also try again after 3 seconds if we still haven't joined
            requestInterval = setInterval(() => {
              if (playersRegisteredInitiallyRef.current) {
                sendRequest();
              } else {
                if (requestInterval) clearInterval(requestInterval);
              }
            }, 3000);
          }
        }
      } catch (e: any) {
        matchJoinedRef.current = false;
        if (requestInterval) clearInterval(requestInterval);
        console.error("Error joining match:", e);
        toast.error("Error joining match: " + e.message);
        navigate('/setup');
      }
    };

    joinMatchAsync();

    return () => {
      socket.onmatchdata = () => {};
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
    if (isOnline && roomId) {
      try {
        getNakamaSocket().sendMatchState(roomId, 7, "{}");
      } catch (e) {}
    }
    navigate('/setup');
  };

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
    <OnlineGameContext.Provider value={isOnline ? { isOnline: true, roomId, myPlayerColour } : null}>
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
                  onClick={() => {
                    if (window.confirm(EXIT_MESSAGE)) {
                      handleExitBtnClick();
                    }
                  }}
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
