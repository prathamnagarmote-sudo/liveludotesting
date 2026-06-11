import dice1 from '../../../../assets/dice/1.svg';
import dice2 from '../../../../assets/dice/2.svg';
import dice3 from '../../../../assets/dice/3.svg';
import dice4 from '../../../../assets/dice/4.svg';
import dice5 from '../../../../assets/dice/5.svg';
import dice6 from '../../../../assets/dice/6.svg';
import { useCallback, useEffect, useMemo } from 'react';
import { type TPlayerColour } from '../../../../types';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../state/store';
import { rollDiceThunk } from '../../../../state/thunks/rollDiceThunk';
import { playerColours } from '../../../../game/players/constants';
import { isAnyTokenActiveOfColour } from '../../../../game/tokens/logic';
import TokenImage from '../../../../assets/token.svg?react';
import styles from './Dice.module.css';
import clsx from 'clsx';
import { playDiceRollSound } from '../../../../utils/audio';
import { useTurnTimer } from '../../../../hooks/useTurnTimer';
import DiceTimerBorder from './DiceTimerBorder';

const woodStainColours: Record<TPlayerColour, string> = {
  red: '#ba2b20',
  green: '#26632f',
  blue: '#1b4b8f',
  yellow: '#c28b17',
};

type Props = {
  colour: TPlayerColour;
  playerName: string;
  onDiceClick: (colour: TPlayerColour, diceNumber: number) => void;
};

function Dice({ colour, onDiceClick, playerName }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const {
    isAnyTokenMoving,
    isGameEnded,
    currentPlayerColour: currentPlayer,
    players,
  } = useSelector((state: RootState) => state.players);
  const { diceNumber, isPlaceholderShowing } =
    useSelector((state: RootState) => state.dice.dice.find((d) => d.colour === colour)) ?? {};

  const anyTokenActive = useMemo(
    () => isAnyTokenActiveOfColour(colour, players),
    [colour, players]
  );
  const isBot = players.find((p) => p.colour === colour)?.isBot;
  const isCurrentPlayer = currentPlayer === colour;
  const isDiceDisabled =
    !isCurrentPlayer ||
    anyTokenActive ||
    isAnyTokenMoving ||
    isGameEnded ||
    isPlaceholderShowing ||
    isBot;

  const player = players.find((p) => p.colour === colour);
  const missedTurns = player?.missedTurns ?? 0;

  const { progressPercentage, phase, isCritical, shouldShowTimer } = useTurnTimer(colour, !isDiceDisabled);

  const handleDiceClick = useCallback(() => {
    if (isDiceDisabled) return;
    playDiceRollSound();
    dispatch(rollDiceThunk(colour, (diceNumber) => onDiceClick(colour, diceNumber)));
  }, [colour, dispatch, isDiceDisabled, onDiceClick]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.key.toLowerCase() !== 'd' || isDiceDisabled) return;
      handleDiceClick();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDiceClick, isDiceDisabled]);

  return (
    <div
      className={clsx(styles.diceContainer, styles[colour], {
        [styles.activeContainer]: !isDiceDisabled,
        [styles.criticalShake]: isCritical,
      })}
    >
      <DiceTimerBorder progressPercentage={progressPercentage} phase={phase} shouldShowTimer={shouldShowTimer} />
      <div className={clsx(styles.missDots, styles[colour])}>
        <span className={clsx(styles.dot, missedTurns >= 1 ? styles.missed : styles.active)} />
        <span className={clsx(styles.dot, missedTurns >= 2 ? styles.missed : styles.active)} />
        <span className={clsx(styles.dot, missedTurns >= 3 ? styles.missed : styles.active)} />
      </div>
      <div className={styles.playerInfo}>
        <TokenImage
          className={styles.miniToken}
          aria-hidden="true"
          style={
            {
              '--fill-colour': woodStainColours[colour],
            } as React.CSSProperties
          }
        />
        <span className={styles.playerName}>{playerName}</span>
      </div>
      <div className={styles.diceWrapper}>
        <button
          className={clsx(styles.dice, {
            [styles.active]: !isDiceDisabled,
            [styles.rolling]: isPlaceholderShowing,
          })}
          tabIndex={isDiceDisabled ? -1 : undefined}
          title={!isDiceDisabled ? 'Roll Dice (Press D)' : undefined}
          disabled={isDiceDisabled}
          style={{ '--player-colour': playerColours[colour] } as React.CSSProperties}
          type="button"
          onClick={handleDiceClick}
        >
          <div className={styles.scene}>
            <div
              className={clsx(styles.cube, {
                [styles.rollingCube]: isPlaceholderShowing,
                [styles.show1]: !isPlaceholderShowing && diceNumber === 1,
                [styles.show2]: !isPlaceholderShowing && diceNumber === 2,
                [styles.show3]: !isPlaceholderShowing && diceNumber === 3,
                [styles.show4]: !isPlaceholderShowing && diceNumber === 4,
                [styles.show5]: !isPlaceholderShowing && diceNumber === 5,
                [styles.show6]: !isPlaceholderShowing && diceNumber === 6,
              })}
            >
              <div className={clsx(styles.face, styles.front)}>
                <img src={dice1} alt="1" aria-hidden="true" />
              </div>
              <div className={clsx(styles.face, styles.back)}>
                <img src={dice6} alt="6" aria-hidden="true" />
              </div>
              <div className={clsx(styles.face, styles.right)}>
                <img src={dice3} alt="3" aria-hidden="true" />
              </div>
              <div className={clsx(styles.face, styles.left)}>
                <img src={dice4} alt="4" aria-hidden="true" />
              </div>
              <div className={clsx(styles.face, styles.top)}>
                <img src={dice2} alt="2" aria-hidden="true" />
              </div>
              <div className={clsx(styles.face, styles.bottom)}>
                <img src={dice5} alt="5" aria-hidden="true" />
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

export default Dice;
