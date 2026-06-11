import type { TPlayerNameAndColour, TPlayer } from '../../../../types';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import GameFinishPlayerItem from '../GameFinishPlayerItem/GameFinishPlayerItem';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../../state/store';
import styles from './GameFinishedScreen.module.css';

type Props = {
  playerFinishOrder: TPlayerNameAndColour[];
};

const getPlayerScore = (player: TPlayer) => {
  const homeCount = player.tokens.filter((t) => t.hasTokenReachedHome).length;
  const unlockedCount = player.tokens.filter((t) => !t.isLocked && !t.hasTokenReachedHome).length;
  return homeCount * 100 + unlockedCount;
};

function GameFinishedScreen({ playerFinishOrder }: Props) {
  const { width, height } = useWindowSize();
  const { isGameOver, players } = useSelector((state: RootState) => state.players);
  const inactivePlayer = players.find((p) => p.missedTurns >= 3);

  const winner = isGameOver
    ? [...players]
        .filter((p) => p.missedTurns < 3)
        .sort((a, b) => getPlayerScore(b) - getPlayerScore(a))[0]
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
            {isGameOver && winner ? (
              <p className={styles.winnerDeclaration}>🏆 {winner.name} is the Winner! 🏆</p>
            ) : (
              playerFinishOrder.map((p, i) => (
                <GameFinishPlayerItem
                  colour={p.colour}
                  isLast={i === playerFinishOrder.length - 1}
                  name={p.name}
                  rank={i + 1}
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
