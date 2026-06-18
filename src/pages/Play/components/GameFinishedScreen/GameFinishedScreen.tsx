import type { TPlayer } from '../../../../types';
import { AnimatePresence, motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../../state/store';
import { getLeaderboardStandings } from '../../../../game/score/logic';
import styles from './GameFinishedScreen.module.css';

import ResultSplashScreen from './ResultSplashScreen';
import LeaderboardScreen from './LeaderboardScreen';
import { useState, useEffect, useContext, useMemo, useRef } from 'react';
import Confetti from 'react-confetti';
import { useMeasure } from 'react-use';
import { OnlineGameContext } from '../Game/Game';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../../../state/store';
import { restartGameThunk } from '../../../../state/thunks/restartGameThunk';
import { getNakamaSocket } from '../../../../services/nakama';

type Props = {
  players: TPlayer[];
};

function GameFinishedScreen({ players }: Props) {
  const [ref, { width, height }] = useMeasure<HTMLDivElement>();
  const { isGameOver } = useSelector((state: RootState) => state.players);
  const standings = getLeaderboardStandings(players);
  const inactivePlayer = players.find(p => p.missedTurns >= 3);
  const [showSplash, setShowSplash] = useState(true);

  const onlineContext = useContext(OnlineGameContext);
  const dispatch = useDispatch<AppDispatch>();

  type RematchState = 'idle' | 'waiting_for_others' | 'popup_visible' | 'countdown';
  const [rematchState, setRematchState] = useState<RematchState>('idle');
  const [rematchMessage, setRematchMessage] = useState<string | null>(null);
  const [rematchTimer, setRematchTimer] = useState(15);
  const [countdownTimer, setCountdownTimer] = useState(3);
  const [, setAcceptedPlayers] = useState<string[]>([]);

  const activePlayers = useMemo(() => players.filter(p => !p.hasQuit && !p.isBot), [players]);
  const requiredAccepts = activePlayers.length;

  // In local pass-and-play, if Player 1 (Red) wins, show "You Win!", else show "You Lose!"
  // If the game ended early (all missed turns), it's a loss.
  const isTie = standings.length >= 2 && standings[0].score === standings[1].score && !standings[0].hasQuit && !standings[1].hasQuit;
  
  let splashText = '';
  if (isGameOver) {
    splashText = 'GAME OVER!';
  } else {
    const someoneQuit = standings.some(p => p.hasQuit);
    if (someoneQuit) {
      if (onlineContext) {
        const isMyWin = standings[0].colour === onlineContext.myPlayerColour;
        splashText = isMyWin ? 'You Win!' : 'You Lose!';
      } else {
        if (players.length === 2) {
          splashText = 'You Lose!';
        } else {
          const isHumanWinner = standings[0] && !standings[0].isBot;
          splashText = isHumanWinner ? 'You Win!' : 'You Lose!';
        }
      }
    } else {
      // If online, use the assigned colour. If offline, assume players[0] is the primary local user.
      const myColour = onlineContext ? onlineContext.myPlayerColour : players[0].colour;
      
      const isMyWin = standings[0].colour === myColour;
      const amITiedForFirst = isTie && (standings[0].colour === myColour || standings[1].colour === myColour);

      if (amITiedForFirst) {
        splashText = "It's a Tie!";
      } else {
        splashText = isMyWin ? 'You Win!' : 'You Lose!';
      }
    }
  }

  // Determine if local player is the winner for confetti effects
  let isLocalWinner = false;
  if (!isGameOver && standings.length > 0) {
    const myColour = onlineContext ? onlineContext.myPlayerColour : players[0].colour;
    if (isTie) {
       isLocalWinner = false;
    } else {
       isLocalWinner = standings[0].colour === myColour;
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const onlineContextRef = useRef(onlineContext);
  useEffect(() => {
    onlineContextRef.current = onlineContext;
  }, [onlineContext]);

  // Custom Event Listener for Nakama Rematch OpCodes
  useEffect(() => {
    const handleNakamaRematch = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { opCode, parsed } = customEvent.detail;
      const currentContext = onlineContextRef.current;
      
      if (opCode === 101) {
        if (currentContext && parsed.colour === currentContext.myPlayerColour) {
          return;
        }
        setRematchState('popup_visible');
        setRematchTimer(15);
        setAcceptedPlayers([parsed.colour]);
      } else if (opCode === 102) {
        setAcceptedPlayers(prev => {
          const next = prev.includes(parsed.colour) ? prev : [...prev, parsed.colour];
          if (next.length >= requiredAccepts) {
            setRematchState('countdown');
            setCountdownTimer(3);
          }
          return next;
        });
      } else if (opCode === 103) {
        if (currentContext && parsed.colour === currentContext.myPlayerColour) {
          return;
        }
        setRematchState('idle');
        setRematchMessage('Rematch request declined.');
      }
    };
    document.addEventListener('nakama-rematch-event', handleNakamaRematch);
    return () => document.removeEventListener('nakama-rematch-event', handleNakamaRematch);
  }, [requiredAccepts]);

  // 15-second timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (rematchState === 'popup_visible' || rematchState === 'waiting_for_others') {
      interval = setInterval(() => {
        setRematchTimer(prev => {
          if (prev <= 1) {
            setRematchState('idle');
            // Only show expired message if we were waiting for others
            if (rematchState === 'waiting_for_others') {
              setRematchMessage('Rematch request expired.');
            }
            return 15;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [rematchState]);

  // 3-2-1 countdown timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (rematchState === 'countdown') {
      interval = setInterval(() => {
        setCountdownTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            dispatch(restartGameThunk() as any);
            return 3;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [rematchState, dispatch]);

  // Clear message
  useEffect(() => {
    if (rematchMessage) {
      const t = setTimeout(() => setRematchMessage(null), 3000);
      return () => clearTimeout(t);
    }
  }, [rematchMessage]);

  const handleRequestRematch = () => {
    if (onlineContext) {
      getNakamaSocket()?.sendMatchState(onlineContext.roomId, 101, JSON.stringify({ colour: onlineContext.myPlayerColour }));
      setRematchState('waiting_for_others');
      setAcceptedPlayers([onlineContext.myPlayerColour]);
    } else {
      setRematchState('waiting_for_others');
      
      const hasBots = players.some(p => p.isBot);
      if (hasBots) {
        // Simulate bot accepting the rematch
        setTimeout(() => {
          setRematchState('countdown');
          setCountdownTimer(3);
        }, 1500);
      } else {
        // Human vs Human offline: Simply wait. 
        // As requested, the sender must never see the popup. 
        // Since this is a single screen, it will just wait until the 15s timer expires.
        setRematchState('waiting_for_others');
        setRematchTimer(15);
      }
    }
  };

  const handleAcceptRematch = () => {
    if (onlineContext) {
      getNakamaSocket()?.sendMatchState(onlineContext.roomId, 102, JSON.stringify({ colour: onlineContext.myPlayerColour }));
      setRematchState('waiting_for_others');
      setAcceptedPlayers(prev => {
        const next = prev.includes(onlineContext.myPlayerColour) ? prev : [...prev, onlineContext.myPlayerColour];
        if (next.length >= requiredAccepts) {
          setRematchState('countdown');
          setCountdownTimer(3);
        }
        return next;
      });
    } else {
      setRematchState('countdown');
      setCountdownTimer(3);
    }
  };

  const handleRejectRematch = () => {
    if (onlineContext) {
      getNakamaSocket()?.sendMatchState(onlineContext.roomId, 103, JSON.stringify({ colour: onlineContext.myPlayerColour }));
    }
    setRematchState('idle');
  };

  return (
    <AnimatePresence>
      <motion.div className={styles.gameFinishedScreen} ref={ref}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={styles.gameFinishedBackdrop}
        />
        {!isGameOver && isLocalWinner && rematchState === 'idle' && width > 0 && (
          <Confetti
            width={width}
            height={height}
            style={{ zIndex: 9999, position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
          />
        )}
        <motion.div
          className={styles.gameFinishedDialog}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >

          {showSplash ? (
            <ResultSplashScreen text={splashText} />
          ) : (
            <>
              <div style={{ 
                width: '100%', 
                height: '100%', 
                filter: rematchState === 'popup_visible' ? 'blur(8px)' : 'none',
                pointerEvents: rematchState === 'popup_visible' ? 'none' : 'auto',
                transition: 'filter 0.3s ease'
              }}>
                <LeaderboardScreen standings={standings} isTie={isTie} onRequestRematch={handleRequestRematch} />
                {isGameOver && inactivePlayer && (
                  <div className={styles.gameOverSubtext}>
                    <p className={styles.inactiveReason}>{inactivePlayer.name} missed 3 chances to roll!</p>
                  </div>
                )}
              </div>
              
              <AnimatePresence>
                {rematchMessage && (
                  <motion.div
                    className={styles.rematchOverlay}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ backgroundColor: 'transparent', pointerEvents: 'none' }}
                  >
                    <div className={styles.statusMessage}>{rematchMessage}</div>
                  </motion.div>
                )}

                {rematchState === 'waiting_for_others' && (
                  <motion.div
                    className={styles.rematchOverlay}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className={styles.statusMessage} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span>{onlineContext ? 'Waiting for opponent to respond...' : 'Waiting for players to accept...'}</span>
                      <span style={{ marginTop: '10px', fontSize: '1.5rem', color: '#FFD700', fontWeight: 'bold' }}>{rematchTimer} Seconds Remaining</span>
                    </div>
                  </motion.div>
                )}

                {rematchState === 'popup_visible' && (
                  <motion.div
                    className={styles.rematchOverlay}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className={styles.rematchPopup}>
                      <h2 className={styles.rematchTitle}>Rematch Request</h2>
                      <p className={styles.rematchText}>Do you want to play a rematch?</p>
                      <div className={styles.rematchTimer}>{rematchTimer} Seconds Remaining</div>
                      <div className={styles.rematchBtnGroup}>
                        <button className={styles.acceptBtn} onClick={handleAcceptRematch}>Accept</button>
                        <button className={styles.rejectBtn} onClick={handleRejectRematch}>Reject</button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {rematchState === 'countdown' && (
                  <motion.div
                    className={styles.rematchOverlay}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className={styles.countdownText}>{countdownTimer}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default GameFinishedScreen;
