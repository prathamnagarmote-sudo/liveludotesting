import type { TPlayer } from '../../../../types';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import GameFinishPlayerItem from '../GameFinishPlayerItem/GameFinishPlayerItem';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../../state/store';
import { getLeaderboardStandings } from '../../../../game/score/logic';
import styles from './GameFinishedScreen.module.css';

type Props = {
  players: TPlayer[];
};

function GameFinishedScreen({ players }: Props) {
  const { width, height } = useWindowSize();
  const { isGameOver } = useSelector((state: RootState) => state.players);
  const inactivePlayer = players.find((p) => p.missedTurns >= 3);
  const standings = getLeaderboardStandings(players);

  const winnerStanding = isGameOver
    ? standings.find((s) => {
        const p = players.find((player) => player.colour === s.colour);
        return p && p.missedTurns < 3;
      })
    : null;

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
        {!isGameOver && <Confetti width={width} height={height} style={{ zIndex: 20 }} />}
        <motion.div
          className={styles.gameFinishedDialog}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <span className={`${styles.gameFinishedText} ${isGameOver ? styles.gameOverText : ''}`}>
            {isGameOver ? 'GAME OVER!' : 'GAME FINISHED!'}
          </span>
          {isGameOver && inactivePlayer && (
            <div className={styles.gameOverSubtext}>
              <p className={styles.inactiveReason}>{inactivePlayer.name} missed 3 chances to roll!</p>
            </div>
          )}
          <section className={styles.gameResult}>
            {isGameOver && winnerStanding ? (
              <p className={styles.winnerDeclaration}>🏆 {winnerStanding.name} is the Winner! 🏆</p>
            ) : (
              standings.map((p, i) => (
                <GameFinishPlayerItem
                  colour={p.colour}
                  isLast={i === standings.length - 1}
                  name={p.name}
                  rank={p.rank}
                  score={p.score}
                  key={i}
                />
              ))
            )}
          </section>
          <Link className={styles.playAgainBtn} to="/setup">
            Play Again!
          </Link>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default GameFinishedScreen;
