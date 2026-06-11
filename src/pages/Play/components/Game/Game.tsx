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
import { registerDice, setDiceNumberDirect, setIsPlaceholderShowing } from '../../../../state/slices/diceSlice';
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
import { getNakamaSocket } from '../../../../services/nakama';
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
  usePageLeaveBlocker(!isGameEnded && import.meta.env.PROD);
  useGameTimer();

  const [roomId, setRoomId] = useState<string>('');
  const [myPlayerColour, setMyPlayerColour] = useState<TPlayerColour>(canonicalColour || 'blue');
  const [isMatchJoined, setIsMatchJoined] = useState(!isOnline);
  const [localSessionId, setLocalSessionId] = useState<string>('');
  const matchJoinedRef = useRef(false);

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

  // Handle Online Match turn coordination
  useEffect(() => {
    if (!isOnline || !matchedToken) return;

    const effectivePlayerId = localSessionId || myPlayerId;

    let socket;
    try {
      socket = getNakamaSocket();
    } catch(e) {
      navigate('/setup');
      return;
    }

    const joinMatch = async () => {
      if (matchJoinedRef.current) return;
      matchJoinedRef.current = true;
      try {
        const match = await socket.joinMatch(matchedToken);
        setRoomId(match.match_id);
        if (match.self && match.self.session_id) {
          setLocalSessionId(match.self.session_id);
        }
      } catch (e: any) {
        matchJoinedRef.current = false;
        toast.error("Error joining match: " + e.message);
        navigate('/setup');
      }
    };

    const handleTurnUpdate = (data: { currentTurnIndex: number; currentPlayerId: string; currentPlayerColour: TPlayerColour }) => {
      const localColor = colorMap[data.currentPlayerColour] || data.currentPlayerColour;
      dispatch(setCurrentPlayerColour(localColor));
      dispatch(deactivateAllTokens(localColor));
    };

    const handleDiceRolled = (data: { playerId: string; playerUserId?: string; roll: number }) => {
      const state = store.getState();
      const currentPlayers = state.players.players; // fresh state
      const player = currentPlayers.find(p => p.id === data.playerId || (data.playerUserId && p.userId === data.playerUserId));
      
      const pColour = player ? player.colour : null;
      if (!pColour) return;

      const localColor = pColour;

      dispatch(setDiceNumberDirect({ colour: localColor, diceNumber: data.roll }));
      dispatch(setIsPlaceholderShowing({ colour: localColor, isPlaceholderShowing: true }));

      setTimeout(() => {
        dispatch(setIsPlaceholderShowing({ colour: localColor, isPlaceholderShowing: false }));

        if (data.roll === 6) {
          dispatch(incrementNumberOfConsecutiveSix(localColor));
        } else {
          dispatch(resetNumberOfConsecutiveSix(localColor));
        }

        const freshState = store.getState();
        const playersList = freshState.players.players;
        const activePlayer = playersList.find(p => p.colour === localColor);
        if (!activePlayer) return;

        const isHost = playersList.some(p => p.id === effectivePlayerId && !p.isBot); // simplified host check for bots
        const isBot = activePlayer.isBot;

        if (activePlayer.numberOfConsecutiveSix === 3) {
          dispatch(resetNumberOfConsecutiveSix(localColor));
          dispatch(deactivateAllTokens(localColor));
          if (localColor === myPlayerColour || (isBot && isHost)) {
            setTimeout(() => {
              const pSeq = freshState.players.playerSequence;
              const nextColour = getNextTurnColour(localColor, pSeq);
              socket.sendMatchState(roomId, 6, JSON.stringify({ nextTurnColour: colorMap[nextColour] }));
            }, 1500);
          }
          return;
        }

        if (localColor === myPlayerColour) {
          const movableTokens = activePlayer.tokens.filter(t =>
            isTokenMovable(t, data.roll) || (data.roll === 6 && t.isLocked && !t.hasTokenReachedHome)
          );
          if (movableTokens.length === 0) {
            setTimeout(() => {
              const pSeq = freshState.players.playerSequence;
              const nextColour = getNextTurnColour(localColor, pSeq);
              socket.sendMatchState(roomId, 6, JSON.stringify({ nextTurnColour: colorMap[nextColour] }));
            }, 1500);
          } else if (movableTokens.length === 1 && areAllTokensInSameCoord(movableTokens)) {
            const token = movableTokens[0];
            socket.sendMatchState(roomId, 4, JSON.stringify({ tokenId: token.id, isUnlock: token.isLocked }));
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
              socket.sendMatchState(roomId, 6, JSON.stringify({ nextTurnColour: colorMap[nextColour] }));
            }, 1500);
          } else {
            setTimeout(() => {
              socket.sendMatchState(roomId, 4, JSON.stringify({ tokenId: bestToken.id, isUnlock: bestToken.isLocked }));
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

      if (data.isUnlock) {
        dispatch(setIsAnyTokenMoving(true));
        setTokenTransitionTime(FORWARD_TOKEN_TRANSITION_TIME, token);
        dispatch(unlockAndAlignTokens({ colour: localColor, id: data.id }));
        dispatch(deactivateAllTokens(localColor));
        setTimeout(() => {
          dispatch(setIsAnyTokenMoving(false));

          const pSeq = store.getState().players.playerSequence;
          const activePlayer = store.getState().players.players.find(p => p.colour === localColor);
          const isBot = activePlayer?.isBot;
          const isHost = playersList.some(p => p.id === effectivePlayerId && !p.isBot);

          if (localColor === myPlayerColour || (isBot && isHost)) {
            const getsAnotherTurn = true;
            const nextColour = getsAnotherTurn ? localColor : getNextTurnColour(localColor, pSeq);
            socket.sendMatchState(roomId, 6, JSON.stringify({ nextTurnColour: colorMap[nextColour] }));
          }
        }, FORWARD_TOKEN_TRANSITION_TIME);
      } else {
        const moveData = await moveAndCapture(token, diceNumber);
        
        const freshState = store.getState();
        const pSeq = freshState.players.playerSequence;
        const activePlayer = freshState.players.players.find(p => p.colour === localColor);
        const isBot = activePlayer?.isBot;
        const isHost = playersList.some(p => p.id === effectivePlayerId && !p.isBot);

        if (localColor === myPlayerColour || (isBot && isHost)) {
          if (moveData) {
            const { hasTokenReachedHome, isCaptured, hasPlayerWon } = moveData;
            if (hasPlayerWon) return;

            const getsAnotherTurn = (diceNumber === 6 && activePlayer!.numberOfConsecutiveSix < 3) || isCaptured || hasTokenReachedHome;
            const nextColour = getsAnotherTurn ? localColor : getNextTurnColour(localColor, pSeq);
            socket.sendMatchState(roomId, 6, JSON.stringify({ nextTurnColour: colorMap[nextColour] }));
          } else {
            const nextColour = getNextTurnColour(localColor, pSeq);
            socket.sendMatchState(roomId, 6, JSON.stringify({ nextTurnColour: colorMap[nextColour] }));
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

    socket.onmatchdata = (result: MatchData) => {
      const data = new TextDecoder().decode(result.data);
      let parsed;
      try {
        parsed = JSON.parse(data);
      } catch(e) { return; }

      const opCode = result.op_code;

      if (opCode === 1) { // Init Match Data
        if (playersRegisteredInitiallyRef.current) {
          const playersList = parsed.players;
          const mappedSequence = playersList.map((p: any) => p.color);
          
          const myMatchPlayer = playersList.find((p: any) => p.userId === myUserId || p.id === effectivePlayerId);
          if (myMatchPlayer) setMyPlayerColour(myMatchPlayer.color);
          
          dispatch(setPlayerSequenceDirect(mappedSequence));
          dispatch(setGameStartTime(Date.now()));

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

        }
      } else if (opCode === 2) {
        handleTurnUpdate(parsed);
      } else if (opCode === 8) {
        handleDiceRolled(parsed);
      } else if (opCode === 5) {
        handleTokenMoved(parsed);
      } else if (opCode === 9) {
        handlePlayerDisconnected(parsed);
      } else if (opCode === 10) {
        handleMatchForfeited(parsed);
      }
    };

    joinMatch();

    return () => {
      socket.onmatchdata = () => {};
    };
  }, [isOnline, matchedToken, myPlayerId, myUserId, colorMap, dispatch, moveAndCapture, roomId, store, myPlayerColour, localSessionId]);

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
        <ScoreBoard />
        <Board onDiceClick={handleDiceRoll} />
        <button
          type="button"
          aria-label="Exit button"
          className={styles.exitBtn}
          onClick={handleExitBtnClick}
        >
          &times;
        </button>
        {isGameEnded && <GameFinishedScreen players={players} />}
      </div>
    </OnlineGameContext.Provider>
  );
}

export default Game;
