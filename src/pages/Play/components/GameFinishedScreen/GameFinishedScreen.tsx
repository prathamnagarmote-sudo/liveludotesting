import type { TPlayer } from '../../../../types';
import { AnimatePresence, motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../../state/store';
import { getLeaderboardStandings } from '../../../../game/score/logic';
import styles from './GameFinishedScreen.module.css';

import ResultSplashScreen from './ResultSplashScreen';
import LeaderboardScreen from './LeaderboardScreen';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

type Props = {
  players: TPlayer[];
};

function GameFinishedScreen({ players }: Props) {
  const { width, height } = useWindowSize();
  const { isGameOver } = useSelector((state: RootState) => state.players);
  const standings = getLeaderboardStandings(players);
  const inactivePlayer = players.find(p => p.missedTurns >= 3);
  const [showSplash, setShowSplash] = useState(true);

  // In local pass-and-play, if Player 1 (Red) wins, show "You Win!", else show "You Lose!"
  // If the game ended early (all missed turns), it's a loss.
  // Tie Handling: If original game was 2 players, and neither quit, and scores match.
  const isTie = players.length === 2 && standings.length === 2 && standings[0].score === standings[1].score;
  const isHumanWinner = standings[0] && !standings[0].isBot;
  const splashText = isGameOver ? 'GAME OVER!' : (isTie ? "It's a Tie!" : (isHumanWinner ? 'You Win!' : 'You Lose!'));

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
          <Link className={styles.closeBtn} to="/" title="Back to Lobby">
            ✕
          </Link>
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
