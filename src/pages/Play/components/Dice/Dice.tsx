import dice1 from '../../../../assets/dice/1.svg';
import dice2 from '../../../../assets/dice/2.svg';
import dice3 from '../../../../assets/dice/3.svg';
import dice4 from '../../../../assets/dice/4.svg';
import dice5 from '../../../../assets/dice/5.svg';
import dice6 from '../../../../assets/dice/6.svg';
import { useCallback, useEffect, useMemo, useContext, useRef } from 'react';
import { type TPlayerColour } from '../../../../types';
import { useDispatch, useSelector } from 'react-redux';
import { OnlineGameContext } from '../Game/Game';
import { getNakamaSocket } from '../../../../services/nakama';
import type { AppDispatch, RootState } from '../../../../state/store';
import { rollDiceThunk } from '../../../../state/thunks/rollDiceThunk';
import { playerColours } from '../../../../game/players/constants';
import { isAnyTokenActiveOfColour } from '../../../../game/tokens/logic';
import { getPlayerScore } from '../../../../game/score/logic';
import TokenImage from '../../../../assets/token.svg?react';
import styles from './Dice.module.css';
import clsx from 'clsx';
import { playDiceRollSound } from '../../../../utils/audio';
import { useTurnTimer } from '../../../../hooks/useTurnTimer';

const woodStainColours: Record<TPlayerColour, string> = {
  red: 'url(#token-grad-red)',
  green: 'url(#token-grad-green)',
  blue: 'url(#token-grad-blue)',
  yellow: 'url(#token-grad-yellow)',
};

type Props = {
  colour: TPlayerColour;
  playerName: string;
  onDiceClick: (colour: TPlayerColour, diceNumber: number) => void;
  positionColour?: TPlayerColour;
};

function Dice({ colour, onDiceClick, playerName, positionColour }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const onlineContext = useContext(OnlineGameContext);
  const {
    isAnyTokenMoving,
    isGameEnded,
    currentPlayerColour: currentPlayer,
    players,
  } = useSelector((state: RootState) => state.players);
  const { diceNumber, isPlaceholderShowing } =
    useSelector((state: RootState) => state.dice.dice.find((d) => d.colour === colour)) ?? {};

  // Find if any player's dice is currently rolling
  const rollingPlayer = useSelector((state: RootState) =>
    state.dice.dice.find((d) => d.isVisualRolling)?.colour
  );

  const anyTokenActive = useMemo(
    () => isAnyTokenActiveOfColour(colour, players),
    [colour, players]
  );
  const playerObj = players.find((p) => p.colour === colour);
  const isBot = players.find((p) => p.colour === colour)?.isBot;
  const isCurrentPlayer = currentPlayer === colour;
  const isVisualCurrentPlayer = (rollingPlayer || currentPlayer) === colour;
  const isMyTurn = onlineContext?.isOnline ? colour === onlineContext.myPlayerColour : true;
  const isDiceDisabled =
    !isCurrentPlayer ||
    !isMyTurn ||
    anyTokenActive ||
    isAnyTokenMoving ||
    isGameEnded ||
    isPlaceholderShowing ||
    isBot;

  const timerPathRef = useRef<SVGPathElement>(null);
  const isDiceRollAllowed = !anyTokenActive && !isAnyTokenMoving && !isPlaceholderShowing;
  const { phase, isCritical, shouldShowTimer } = useTurnTimer(colour, isDiceRollAllowed, timerPathRef);

  const handleDiceClick = useCallback(() => {
    if (isDiceDisabled) return;
    playDiceRollSound();
    if (onlineContext?.isOnline) {
      if (onlineContext.amHost) {
        // Host: generate the roll and broadcast OpCode 8 directly.
        // All clients (including host itself via relay loopback) apply the result.
        // Do NOT call rollDiceThunk — wait for OpCode 8 loopback to apply state.
        const roll = Math.floor(Math.random() * 6) + 1;
        getNakamaSocket().sendMatchState(onlineContext.roomId, 8, JSON.stringify({
          colour,
          roll,
        }));
      } else {
        // Non-host: ask the host to roll for the current player
        getNakamaSocket().sendMatchState(onlineContext.roomId, 3, '{}');
      }
    } else {
      dispatch(rollDiceThunk(colour, (diceNumber) => onDiceClick(colour, diceNumber)));
    }
  }, [colour, dispatch, isDiceDisabled, onDiceClick, onlineContext]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.key.toLowerCase() !== 'd' || isDiceDisabled) return;
      handleDiceClick();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDiceClick, isDiceDisabled]);

  const missedTurns = playerObj?.missedTurns ?? 0;
  const avatarUrl = playerObj?.avatarUrl;
  const hasAvatar = !!avatarUrl;

  const actualPosition = positionColour || colour;
  const isLeftOriented = actualPosition === 'red' || actualPosition === 'blue';

  const timerColor = phase === 1 ? '#32cd32' : phase === 2 ? '#ff9800' : '#ff4d4d';
  const showRollArrow = isCurrentPlayer && !anyTokenActive && !isAnyTokenMoving && !isGameEnded && !isPlaceholderShowing;

  const avatarContent = (
    <div className={styles.avatarContainerWrapper}>
      <div className={clsx(styles.avatarFrameWrapper, styles[colour])}>
        {hasAvatar ? (
          <img
            src={avatarUrl}
            className={styles.playerAvatar}
            alt={playerName}
            draggable={false}
          />
        ) : (
          <TokenImage
            className={clsx(styles.emptyAvatar, styles.miniToken)}
            aria-hidden="true"
            style={
              {
                '--fill-colour': woodStainColours[colour],
              } as React.CSSProperties
            }
          />
        )}
      </div>
      <svg 
        className={styles.avatarTimerSvg}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Background white border track */}
        <path
          d="M 50 2.25 L 72 2.25 A 25.75 25.75 0 0 1 97.75 28 L 97.75 72 A 25.75 25.75 0 0 1 72 97.75 L 28 97.75 A 25.75 25.75 0 0 1 2.25 72 L 2.25 28 A 25.75 25.75 0 0 1 28 2.25 Z"
          fill="none"
          stroke="#ffffff"
          strokeWidth={shouldShowTimer ? "7.5" : "4.5"}
          style={{ transition: 'stroke-width 0.3s ease' }}
        />
        {/* Active timer colored border line */}
        {shouldShowTimer && (
          <path
            ref={timerPathRef}
            d="M 50 2.25 L 72 2.25 A 25.75 25.75 0 0 1 97.75 28 L 97.75 72 A 25.75 25.75 0 0 1 72 97.75 L 28 97.75 A 25.75 25.75 0 0 1 2.25 72 L 2.25 28 A 25.75 25.75 0 0 1 28 2.25 Z"
            fill="none"
            stroke={timerColor}
            strokeWidth="7.5"
            strokeLinecap="round"
            strokeDasharray="337.792"
            strokeDashoffset="0"
            style={{ transition: 'stroke 0.3s ease' }}
          />
        )}
      </svg>
    </div>
  );

  const nameAndScoreContent = (
    <div className={styles.nameAndScoreWrapper}>
      <div className={styles.playerNameRow}>
        <span className={styles.playerName}>{playerName.replace(' (Bot)', '')}</span>
        {onlineContext?.isOnline && colour === onlineContext.myPlayerColour && (
          <span className={styles.badgeYou}>YOU</span>
        )}
        {isBot && (
          <span className={styles.badgeBot}>BOT</span>
        )}
      </div>
      <div className={styles.playerScore}>
        {(() => {
          const score = getPlayerScore(players.find((p) => p.colour === colour)!);
          return score >= 100 ? String(score) : String(score).padStart(2, '0');
        })()}
      </div>
    </div>
  );

  const diceContent = (
    <div className={clsx(styles.diceFrameContainer, styles[colour], { [styles.activeFrame]: isVisualCurrentPlayer })}>
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

  const lifelinesContent = (
    <div className={styles.lifelinesRow}>
      <div className={clsx(styles.lifelineDot, missedTurns >= 3 ? styles.lost : styles.active)} />
      <div className={clsx(styles.lifelineDot, missedTurns >= 2 ? styles.lost : styles.active)} />
      <div className={clsx(styles.lifelineDot, missedTurns >= 1 ? styles.lost : styles.active)} />
    </div>
  );

  return (
    <div
      className={clsx(
        styles.diceContainer,
        styles[positionColour || colour],
        styles[`phase${phase}`],
        isLeftOriented ? styles.leftOriented : styles.rightOriented,
        {
          [styles.activeContainer]: !isDiceDisabled,
          [styles.criticalShake]: isCritical,
        }
      )}
    >
      <svg className={styles.lShapeBg} viewBox="0 0 200 120" preserveAspectRatio="none">
        {isLeftOriented ? (
          <path
            d="M 12 0 H 188 A 12 12 0 0 1 200 12 V 76 A 12 12 0 0 1 188 88 H 112 A 12 12 0 0 0 100 100 V 108 A 12 12 0 0 1 88 120 H 12 A 12 12 0 0 1 0 108 V 12 A 12 12 0 0 1 12 0 Z"
            className={styles.lShapePath}
          />
        ) : (
          <path
            d="M 12 0 H 188 A 12 12 0 0 1 200 12 V 108 A 12 12 0 0 1 188 120 H 112 A 12 12 0 0 1 100 108 V 100 A 12 12 0 0 0 88 88 H 12 A 12 12 0 0 1 0 76 V 12 A 12 12 0 0 1 12 0 Z"
            className={styles.lShapePath}
          />
        )}
      </svg>


      
      {isLeftOriented ? (
        <>
          <div className={styles.profileColumn}>
            {avatarContent}
            {nameAndScoreContent}
          </div>
          <div className={styles.diceColumn}>
            {diceContent}
            {lifelinesContent}
          </div>
        </>
      ) : (
        <>
          <div className={styles.diceColumn}>
            {diceContent}
            {lifelinesContent}
          </div>
          <div className={styles.profileColumn}>
            {avatarContent}
            {nameAndScoreContent}
          </div>
        </>
      )}
      {showRollArrow && (
        <div className={styles.woodenArrowWrapper}>
          <svg
            className={styles.woodenArrow}
            viewBox="0 0 40 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="brightWoodGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FFF2D4" />
                <stop offset="35%" stopColor="#FFC87A" />
                <stop offset="70%" stopColor="#FF9F43" />
                <stop offset="100%" stopColor="#D35400" />
              </linearGradient>
              <filter id="dropShadow" x="-10%" y="-10%" width="130%" height="130%">
                <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.6" />
              </filter>
            </defs>
            <g filter="url(#dropShadow)">
              {/* 3D Extrusion Side */}
              <path
                d="M 20 8 L 36 26 H 28 V 56 H 12 V 26 H 4 Z"
                fill="#933A00"
              />
              {/* Main Arrow Face */}
              <path
                d="M 20 4 L 35 23 H 27 V 53 H 13 V 23 H 5 Z"
                fill="url(#brightWoodGrad)"
                stroke="#6E2200"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              {/* Grain lines */}
              <path d="M 15 30 L 15 48" stroke="#B25300" strokeWidth="1" strokeLinecap="round" />
              <path d="M 25 32 L 25 45" stroke="#B25300" strokeWidth="1" strokeLinecap="round" />
              <path d="M 20 28 L 20 50" stroke="#B25300" strokeWidth="1" strokeLinecap="round" />
              <path d="M 20 6 L 31 21 H 25 V 51 H 15 V 21 H 9 Z" stroke="#FFFFFF" strokeOpacity="0.75" strokeWidth="1.2" strokeLinejoin="round" />
            </g>
          </svg>
        </div>
      )}
    </div>
  );
}

export default Dice;

