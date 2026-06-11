import { useSelector } from 'react-redux';
import type { RootState } from '../../../../state/store';
import styles from './ScoreBoard.module.css';

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function ScoreBoard() {
  const players = useSelector((state: RootState) => state.players.players);
  const timeRemainingMs = useSelector((state: RootState) => state.session.timeRemainingMs);

  if (players.length === 0) return null;

  return (
    <div className={styles.scoreBoard}>
      <div className={styles.timer}>{formatTime(timeRemainingMs)}</div>
    </div>
  );
}
