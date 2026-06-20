import React, { useEffect, useRef, createContext, useMemo, useState, useCallback } from 'react';
import {
  registerNewPlayer,
  setPlayerSequence,
  setPlayerSequenceDirect,
  setCurrentPlayerColour,
  activateTokens,
  deactivateAllTokens,
  deactivateTokensOfAllPlayers,
  setIsAnyTokenMoving,
  declareForfeit,
  incrementNumberOfConsecutiveSix,
  resetNumberOfConsecutiveSix,
  lockToken,
  unlockToken,
  changeCoordsOfToken,
  markTokenAsReachedHome,
  convertPlayerToBot,
  quitMatch,
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
import type { TPlayerInitData, TCoordinate } from '../../../../types';
import { useNavigate } from 'react-router-dom';
import { quitMatchThunk } from '../../../../state/thunks/quitMatchThunk';
import { playerCountToWord } from '../../../../game/players/logic';
import { usePageLeaveBlocker } from '../../../../hooks/usePageLeaveBlocker';
import { addToGameInactiveTime, setGameStartTime, setMatchDuration } from '../../../../state/slices/sessionSlice';
import { useGameTimer } from '../../../../hooks/useGameTimer';
import ScoreBoard from '../ScoreBoard/ScoreBoard';
import styles from './Game.module.css';
import menuIcon from '../../../../assets/menu.svg';
import { connectGameServer, disconnectGameServer, sendGameMessage, addGameMessageListener } from '../../../../services/socket';
import { toast } from 'react-toastify';
import { unlockAndAlignTokens } from '../../../../state/thunks/unlockAndAlignTokens';
import { setTokenTransitionTime } from '../../../../utils/setTokenTransitionTime';
import { FORWARD_TOKEN_TRANSITION_TIME } from '../../../../game/tokens/constants';



export const EXIT_MESSAGE = 'Are you sure you want to exit? Any progress made will be lost.';

export const OnlineGameContext = createContext<{
  isOnline: boolean;
  roomId: string;
  myPlayerColour: TPlayerColour;
  amHost: boolean;
  optimisticTokenMovesRef?: React.MutableRefObject<Set<string>>;
  onTokenMove?: (colour: TPlayerColour, id: number, isUnlock: boolean) => void;
  diceRollStartTimestampRef?: React.MutableRefObject<number>;
  turnDeadlineMs?: number;
} | null>(null);

type Props = {
  initData?: TPlayerInitData[];
  isOnline?: boolean;
  matchedToken?: string;
  matchId?: string;
  matchedUsers?: Array<{
    presence: { user_id: string; session_id: string; username: string };
    string_properties?: { avatarurl?: string; avatarUrl?: string; avatar_url?: string; level?: string; name?: string; userName?: string };
  }>;
  myPlayerId?: string;
  myUserId?: string;
  canonicalColour?: TPlayerColour;
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
  const [turnDeadlineMs, setTurnDeadlineMs] = useState<number>(Date.now() + 15000);
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

  // Match start timeout handler to prevent hanging on "Joining Match Session..."
  useEffect(() => {
    if (!isOnline || isMatchJoined) return;

    const timeoutId = setTimeout(() => {
      if (!isMatchJoined) {
        console.error('[ONLINE] Match start timeout. No STATE_SYNC received from server.');
        toast.error('Match start timeout: Could not sync with game loop.');
        navigate('/setup');
      }
    }, 12000); // 12 seconds timeout

    return () => clearTimeout(timeoutId);
  }, [isOnline, isMatchJoined, navigate]);

  const diceRollStartTimestampRef = useRef<number>(0);

  const onTokenMove = useCallback((_colour: TPlayerColour, id: number, _isUnlock: boolean) => {
    try {
      console.log('[CLIENT] Sending token move input to game server:', _colour, id);
      sendGameMessage('move_token', {
        matchId: roomIdRef.current,
        playerId: myPlayerId,
        tokenId: id
      });
    } catch (err) {
      console.error('[CLIENT] Failed to send token move input:', err);
      toast.error("Failed to sync token move with server.");
    }
  }, [myPlayerId]);

  // Handle Online Match turn coordination
  // ARCHITECTURE: Host-Authoritative Relay
  //   - All game logic (dice, moves, turn changes) executes ONLY on the HOST.
  //   - The HOST broadcasts the authoritative result to ALL clients via OpCodes.
  //   - ALL clients (including host) apply broadcast state identically — zero local pre-processing.
  //   - Players send REQUEST OpCodes (3=roll, 5=move) to the host.
  //   - Host responds with STATE OpCodes (8=dice result, 9=token move result, 6=turn change)
  useEffect(() => {
    if (!isOnline || (!matchedToken && !matchId)) return;

    // Connect to custom game server WebSocket
    const ws = connectGameServer(matchId!);

    // Get current user profile from localStorage
    const storedUser = localStorage.getItem('ludo_user');
    const currentUser = storedUser ? JSON.parse(storedUser) : null;

    // Deterministically map matched users to color sequence (sorted alphabetically by user ID)
    const sortedUsers = [...(matchedUsers || [])].sort((a, b) => 
      a.presence.user_id.localeCompare(b.presence.user_id)
    );
    const colors: TPlayerColour[] = ['blue', 'green', 'red', 'yellow'];
    const mappedPlayers = sortedUsers.map((m, idx) => {
      const props = m.string_properties || {};
      const name = props.name || props.userName || m.presence.username || `Player ${idx + 1}`;
      return {
        id: m.presence.session_id,
        userId: m.presence.user_id,
        isBot: false,
        name: name,
        avatarUrl: props.avatarurl || props.avatarUrl || props.avatar_url || '',
        level: 1,
        color: colors[idx]
      };
    });

    // Fill remaining slots with bots to hit target size of 2
    const size = 2;
    const botProfiles = [
      { name: 'ApexPhantom', avatarUrl: 'https://i.pravatar.cc/150?img=11' },
      { name: 'GamerValkyrie', avatarUrl: 'https://i.pravatar.cc/150?img=12' }
    ];
    while (mappedPlayers.length < size) {
      mappedPlayers.push({
        id: 'bot_' + Math.random().toString(36).substring(7),
        userId: 'bot_' + Math.random().toString(36).substring(7),
        isBot: true,
        name: botProfiles[mappedPlayers.length % botProfiles.length].name,
        avatarUrl: botProfiles[mappedPlayers.length % botProfiles.length].avatarUrl,
        level: 1,
        color: colors[mappedPlayers.length]
      });
    }

    const myMatchPlayer = mappedPlayers.find(p => p.id === myPlayerId || p.userId === myUserId);
    const initialColour = myMatchPlayer ? myMatchPlayer.color : 'blue';
    setMyPlayerColour(initialColour);
    myPlayerColourRef.current = initialColour;
    setRoomId(matchId!);

    const joinMessage = {
      matchId,
      playerId: myPlayerId,
      name: currentUser?.userName || 'Player',
      avatarUrl: currentUser?.avatar_url || '',
      colour: initialColour,
      allPlayers: mappedPlayers
    };

    const sendJoinMessage = () => {
      try {
        console.log('[ONLINE] Sending join_match to game server...', joinMessage);
        sendGameMessage('join_match', joinMessage);
      } catch (err) {
        console.error('[ONLINE] Failed to send join_match message:', err);
      }
    };

    if (ws.readyState === WebSocket.OPEN) {
      sendJoinMessage();
    } else {
      ws.addEventListener('open', sendJoinMessage);
    }

    let latestProcessedSeq = 0;
    let pendingStateSync: any = null;

    // ─── Game Initialization ───────────────────────────────────────────────────
    const initializeGame = (playersList: any[]) => {
      if (!playersRegisteredInitiallyRef.current) return;
      console.log('[ONLINE] Initializing game locally with player list:', playersList);

      const mappedSequence = playersList.map((p: any) => p.colour || p.color);
      dispatch(setPlayerSequenceDirect(mappedSequence));
      dispatch(setGameStartTime(Date.now()));

      const matchDurationMs = playersList.length === 2 ? 300000 : 600000;
      dispatch(setMatchDuration(matchDurationMs));

      for (let i = 0; i < playersList.length; i++) {
        const p = playersList[i];
        const col = p.colour || p.color;
        dispatch(registerNewPlayer({
          name: p.name,
          colour: col,
          isBot: p.isBot,
          avatarUrl: p.avatarUrl,
          level: p.level,
          id: p.id,
          userId: p.userId,
        }));
        dispatch(registerDice(col));
      }
      playersRegisteredInitiallyRef.current = false;
      dispatch(setCurrentPlayerColour(mappedSequence[0]));
      setIsMatchJoined(true);
    };

    // ─── Helper: stop all visual dice rolling states ──────────────────────────
    const stopAllDiceAnimations = () => {
      const colours: TPlayerColour[] = ['blue', 'green', 'red', 'yellow'];
      colours.forEach(c => {
        try {
          dispatch(setIsPlaceholderShowing({ colour: c, isPlaceholderShowing: false }));
          dispatch(setIsVisualRolling({ colour: c, isVisualRolling: false }));
        } catch (e) {}
      });
    };

    // ─── Helper: apply turn transition on every client ─────────────────────────
    const applyTurnTransition = (nextColour: TPlayerColour) => {
      stopAllDiceAnimations();
      dispatch(deactivateTokensOfAllPlayers());
      dispatch(setCurrentPlayerColour(nextColour));
    };

    // ─── ALL CLIENTS: Apply dice result ──────────────────────────────────────────
    const allClientsApplyDiceResult = (data: { colour: TPlayerColour; roll: number; hasMovableTokens?: boolean }, onComplete?: () => void) => {
      const colour = data.colour;
      const roll = data.roll;

      dispatch(setDiceNumberDirect({ colour, diceNumber: roll }));

      let remainingDelay = 0;
      if (colour === myPlayerColourRef.current) {
        const elapsed = Date.now() - diceRollStartTimestampRef.current;
        remainingDelay = Math.max(0, 300 - elapsed);
      } else {
        dispatch(setIsPlaceholderShowing({ colour, isPlaceholderShowing: true }));
        dispatch(setIsVisualRolling({ colour, isVisualRolling: true }));
        remainingDelay = 300;
      }

      const applyResult = () => {
        dispatch(setIsPlaceholderShowing({ colour, isPlaceholderShowing: false }));
        dispatch(setIsVisualRolling({ colour, isVisualRolling: false }));

        if (roll === 6) {
          dispatch(incrementNumberOfConsecutiveSix(colour));
          const freshState = store.getState();
          const playerObj = freshState.players.players.find(p => p.colour === colour);
          if (playerObj && playerObj.numberOfConsecutiveSix >= 3) {
            dispatch(resetNumberOfConsecutiveSix(colour));
          }
        } else {
          dispatch(resetNumberOfConsecutiveSix(colour));
        }

        // Activate tokens locally ONLY for the active local player so they can click.
        if (data.hasMovableTokens && colour === myPlayerColourRef.current) {
          dispatch(activateTokens({ all: roll === 6, colour, diceNumber: roll }));
        }
        
        onComplete?.();
      };

      if (remainingDelay <= 0) {
        applyResult();
      } else {
        setTimeout(applyResult, remainingDelay);
      }
    };

    // ─── ALL CLIENTS: Apply token move result ────────────────────────────────────
    const allClientsApplyTokenMove = async (data: {
      colour: TPlayerColour;
      id: number;
      isUnlock: boolean;
      path: TCoordinate[];
      hasTokenReachedHome: boolean;
      isCaptured: boolean;
      hasPlayerWon: boolean;
      capturedTokenColour?: string;
      capturedTokenId?: number;
    }) => {
      const colour = data.colour;
      const state = store.getState();
      const player = state.players.players.find(p => p.colour === colour);
      if (!player) return;
      const token = player.tokens.find(t => t.id === data.id);
      if (!token) return;

      console.log('[ALL] Applying token move result:', colour, data.id);

      if (data.isUnlock) {
        dispatch(setIsAnyTokenMoving(true));
        setTokenTransitionTime(FORWARD_TOKEN_TRANSITION_TIME, token);
        dispatch(unlockAndAlignTokens({ colour, id: data.id }));
        dispatch(deactivateAllTokens(colour));
        await new Promise<void>((resolve) => {
          setTimeout(() => {
            dispatch(setIsAnyTokenMoving(false));
            resolve();
          }, FORWARD_TOKEN_TRANSITION_TIME);
        });
      } else {
        // Pass exact server-provided path coordinates
        await moveAndCapture(token, data.path.length, data.path);
      }

      // Authoritative reconciliation for captures
      if (data.isCaptured && data.capturedTokenColour && typeof data.capturedTokenId === 'number') {
        try {
          dispatch(lockToken({ colour: data.capturedTokenColour as TPlayerColour, id: data.capturedTokenId }));
        } catch (e) {}
      }

      // Authoritative reconciliation for reaching home
      if (data.hasTokenReachedHome) {
        try {
          dispatch(markTokenAsReachedHome({ colour, id: data.id }));
        } catch (e) {}
      }
    };

    const applyStateSync = (parsedState: any) => {
      stopAllDiceAnimations();
      if (playersRegisteredInitiallyRef.current) {
        initializeGame(parsedState.players);
      } else {
        parsedState.players.forEach((p: any) => {
          if (p.isBot) {
            dispatch(convertPlayerToBot({ colour: p.colour }));
          }
          if (p.hasQuit) {
            const localPlayer = store.getState().players.players.find(lp => lp.colour === p.colour);
            if (localPlayer && !localPlayer.hasQuit) {
              dispatch(quitMatch(p.colour));
            }
          }
          p.tokens.forEach((t: any) => {
            dispatch(changeCoordsOfToken({ colour: p.colour, id: t.id, newCoords: t.coordinates }));
            if (t.isLocked) {
              try { dispatch(lockToken({ colour: p.colour, id: t.id })); } catch(e) {}
            } else {
              try { dispatch(unlockToken({ colour: p.colour, id: t.id })); } catch(e) {}
            }
            if (t.hasTokenReachedHome) {
              try { dispatch(markTokenAsReachedHome({ colour: p.colour, id: t.id })); } catch(e) {}
            }
          });
        });
        dispatch(setPlayerSequenceDirect(parsedState.playerSequence));
        dispatch(setCurrentPlayerColour(parsedState.currentTurnColour));
      }

      setTurnDeadlineMs(parsedState.turnDeadlineMs);

      if (parsedState.diceNumber !== -1) {
        dispatch(setDiceNumberDirect({ colour: parsedState.currentTurnColour, diceNumber: parsedState.diceNumber }));
      }
    };

    const handleIncomingMessage = async (msg: any) => {
      const { type, sequenceNumber } = msg;

      if (sequenceNumber && sequenceNumber <= latestProcessedSeq) {
        console.warn('[ONLINE] Ignoring stale message with seq:', sequenceNumber, 'current latest:', latestProcessedSeq);
        return;
      }
      if (sequenceNumber) {
        latestProcessedSeq = sequenceNumber;
      }

      console.log(`[ONLINE] Processing event "${type}" seq ${sequenceNumber}`, msg);

      if (type === 'state_sync') {
        const isAnimationInProgress = store.getState().players.isAnyTokenMoving || 
                                      store.getState().dice.dice.some(d => d.isVisualRolling);
        if (isAnimationInProgress) {
          console.log('[ONLINE] Animation in progress. Buffering state_sync:', sequenceNumber);
          pendingStateSync = msg;
        } else {
          applyStateSync(msg);
        }
      } else if (type === 'dice_result') {
        await new Promise<void>((resolve) => {
          allClientsApplyDiceResult(msg, resolve);
        });

        // Apply buffered state sync if animation finished and not moving tokens
        if (pendingStateSync && !store.getState().players.isAnyTokenMoving) {
          console.log('[ONLINE] Dice animation finished. Applying buffered state_sync:', pendingStateSync.sequenceNumber);
          applyStateSync(pendingStateSync);
          pendingStateSync = null;
        }
      } else if (type === 'token_moved') {
        await allClientsApplyTokenMove(msg);

        // Apply buffered state sync if animation finished
        if (pendingStateSync) {
          console.log('[ONLINE] Token animation finished. Applying buffered state_sync:', pendingStateSync.sequenceNumber);
          applyStateSync(pendingStateSync);
          pendingStateSync = null;
        }
      } else if (type === 'turn_changed') {
        setTurnDeadlineMs(msg.deadlineMs);
        applyTurnTransition(msg.nextTurnColour);
      } else if (type === 'match_end') {
        toast.success(`Match ended! Winner: ${msg.winnerColour}`);
        stopAllDiceAnimations();
        dispatch(declareForfeit({ losingColour: msg.winnerColour === 'blue' ? 'green' : 'blue' }));
      } else if (type === 'action_rejected') {
        console.warn("[ONLINE] Action rejected by server:", msg.reason);
        toast.error(`Invalid action: ${msg.reason}`);
        stopAllDiceAnimations();
      }
    };

    const unsubscribe = addGameMessageListener(handleIncomingMessage);

    return () => {
      unsubscribe();
      ws.removeEventListener('open', sendJoinMessage);
      disconnectGameServer();
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
        sendGameMessage('quit_game', { matchId: roomId, playerId: myPlayerId });
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

  const amHostValue = useMemo(() => {
    if (!matchedUsers || matchedUsers.length === 0) return false;
    const allSessionIds = matchedUsers.map(u => u.presence.session_id).sort();
    return allSessionIds[0] === (myPlayerId || '');
  }, [matchedUsers, myPlayerId]);

  const onlineContextValue = useMemo(() => {
    if (!isOnline) return null;
    return {
      isOnline: true,
      roomId,
      myPlayerColour,
      amHost: amHostValue,
      onTokenMove,
      diceRollStartTimestampRef,
      turnDeadlineMs,
    };
  }, [isOnline, roomId, myPlayerColour, amHostValue, onTokenMove, turnDeadlineMs]);

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
          <button
            type="button"
            aria-label="Menu button"
            className={styles.menuBtn}
            onClick={() => setIsMenuOpen(true)}
          >
            <img src={menuIcon} alt="Menu" className={styles.menuIconImg} />
          </button>
        </div>
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
