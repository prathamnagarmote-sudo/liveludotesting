import clsx from 'clsx';
import styles from './Dice.module.css';

type Props = {
  progressPercentage: number;
  phase: number;
  shouldShowTimer: boolean;
};

export default function DiceTimerBorder({ progressPercentage, phase, shouldShowTimer }: Props) {
  if (!shouldShowTimer) return null;

  return (
    <div className={clsx(styles.timerWrapper, styles[`phase${phase}`])}>
      <svg className={styles.timerSvg} preserveAspectRatio="none">
        <rect
          className={styles.timerRect}
          rx="calc(var(--board-tile-size) * 0.25 - 2px)"
          ry="calc(var(--board-tile-size) * 0.25 - 2px)"
          style={{
            x: '2px',
            y: '2px',
            width: 'calc(100% - 4px)',
            height: 'calc(100% - 4px)',
            rx: 'calc(var(--board-tile-size) * 0.25 - 2px)',
            ry: 'calc(var(--board-tile-size) * 0.25 - 2px)',
          }}
          pathLength="100"
          strokeDasharray="100"
          strokeDashoffset={100 - progressPercentage}
        />
      </svg>
    </div>
  );
}
