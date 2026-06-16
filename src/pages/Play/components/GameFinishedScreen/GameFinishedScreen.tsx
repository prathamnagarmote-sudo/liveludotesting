import type { TPlayer } from '../../../../types';
import { AnimatePresence, motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../../state/store';
import { getLeaderboardStandings } from '../../../../game/score/logic';
import styles from './GameFinishedScreen.module.css';

import ResultSplashScreen from './ResultSplashScreen';
import LeaderboardScreen from './LeaderboardScreen';
import { useState, useEffect, useContext } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { OnlineGameContext } from '../Game/Game';

type Props = {
  players: TPlayer[];
};

function GameFinishedScreen({ players }: Props) {
  const { width, height } = useWindowSize();
  const { isGameOver } = useSelector((state: RootState) => state.players);
  const standings = getLeaderboardStandings(players);
  const inactivePlayer = players.find(p => p.missedTurns >= 3);
  const [showSplash, setShowSplash] = useState(true);

  const onlineContext = useContext(OnlineGameContext);

  // In local pass-and-play, if Player 1 (Red) wins, show "You Win!", else show "You Lose!"
  // If the game ended early (all missed turns), it's a loss.
  const isTie = standings.length >= 2 && standings[0].score === standings[1].score && !standings[0].hasQuit && !standings[1].hasQuit;
  
  let splashText = '';
  if (isGameOver) {
    splashText = 'GAME OVER!';
  } else {
    if (onlineContext) {
      // Online: check if the local player is rank 1 or tied for rank 1
      const isMyWin = standings[0].colour === onlineContext.myPlayerColour;
      const amITiedForFirst = isTie && (standings[0].colour === onlineContext.myPlayerColour || standings[1].colour === onlineContext.myPlayerColour);

      if (amITiedForFirst) {
        splashText = "It's a Tie!";
      } else {
        splashText = isMyWin ? 'You Win!' : 'You Lose!';
      }
    } else {
      // Local mode
      if (isTie) {
        splashText = "It's a Tie!";
      } else {
        const someoneQuit = standings.some(p => p.hasQuit);
        if (players.length === 2 && someoneQuit) {
          splashText = 'You Lose!';
        } else {
          const isHumanWinner = standings[0] && !standings[0].isBot;
          splashText = isHumanWinner ? 'You Win!' : 'You Lose!';
        }
      }
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      <motion.div className={styles.gameFinishedScreen}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={styles.gameFinishedBackdrop}
        />
        {!isGameOver && <Confetti width={width} height={height} style={{ zIndex: 220 }} />}
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
              <LeaderboardScreen standings={standings} isTie={isTie} />
              {isGameOver && inactivePlayer && (
                <div className={styles.gameOverSubtext}>
                  <p className={styles.inactiveReason}>{inactivePlayer.name} missed 3 chances to roll!</p>
                </div>
              )}
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default GameFinishedScreen;
