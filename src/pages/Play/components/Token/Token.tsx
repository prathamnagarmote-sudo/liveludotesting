import React, { useCallback, useEffect, useRef, useState, useContext } from 'react';
import { deactivateAllTokens, setIsAnyTokenMoving } from '../../../../state/slices/playersSlice';
import { type TPlayerColour, type TTokenClickData } from '../../../../types';
import { type TToken } from '../../../../types';
import { useDispatch, useSelector } from 'react-redux';
import { OnlineGameContext } from '../Game/Game';
import { getNakamaSocket } from '../../../../services/nakama';
import type { AppDispatch, RootState } from '../../../../state/store';
import TokenImage from '../../../../assets/token.svg?react';
import { useCoordsToPosition } from '../../../../hooks/useCoordsToPosition';
import { setTokenTransitionTime } from '../../../../utils/setTokenTransitionTime';
import { useMoveAndCaptureToken } from '../../../../hooks/useMoveAndCaptureToken';
import { unlockAndAlignTokens } from '../../../../state/thunks/unlockAndAlignTokens';
import { FORWARD_TOKEN_TRANSITION_TIME } from '../../../../game/tokens/constants';
import { changeTurnThunk } from '../../../../state/thunks/changeTurnThunk';
import styles from './Token.module.css';
import clsx from 'clsx';
import { getTokenDOMId } from '../../../../game/tokens/logic';

const woodStainColours: Record<TPlayerColour, string> = {
  red: 'url(#token-grad-red)',
  green: 'url(#token-grad-green)',
  blue: 'url(#token-grad-blue)',
  yellow: 'url(#token-grad-yellow)',
};

type Props = {
  colour: TPlayerColour;
  id: number;
  tokenClickData: TTokenClickData | null;
};



function Token({ colour, id, tokenClickData }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const { tokenHeight, tokenWidth } = useSelector((state: RootState) => state.board);
  const token = useSelector((state: RootState) =>
    state.players.players.find((p) => p.colour === colour)?.tokens.find((t) => t.id === id)
  ) as TToken;
  const numberOfConsecutiveSix = useSelector((state: RootState) =>
    state.players.players.find((p) => p.colour === colour)?.numberOfConsecutiveSix ?? 0
  );
  const tokenClickDataRef = useRef(tokenClickData);
  const [isCurrentlyFocused, setIsCurrentlyFocused] = useState(false);
  const tokenElRef = useRef<HTMLButtonElement | null>(null);

  const { coordinates, isActive, isLocked, tokenAlignmentData } = token;

  const { scaleFactor } = tokenAlignmentData;
  const getPosition = useCoordsToPosition();
  const { x, y } = getPosition(coordinates, tokenAlignmentData);
  const diceNumber = useSelector((state: RootState) =>
    state.dice.dice.find((d) => d.colour === colour)
  )?.diceNumber;
  const moveAndCapture = useMoveAndCaptureToken();

  const onlineContext = useContext(OnlineGameContext);

  const unlock = () => {
    dispatch(setIsAnyTokenMoving(true));
    setTokenTransitionTime(FORWARD_TOKEN_TRANSITION_TIME, token);
    dispatch(unlockAndAlignTokens({ colour, id }));
    dispatch(deactivateAllTokens(colour));
    setTimeout(() => {
      dispatch(setIsAnyTokenMoving(false));
    }, FORWARD_TOKEN_TRANSITION_TIME);
  };

  const executeTokenMove = useCallback(async () => {
    if (!isActive || diceNumber === -1 || !diceNumber) return;

    const moveData = await moveAndCapture(token, diceNumber);
    if (!moveData) return;
    const { hasTokenReachedHome, isCaptured, hasPlayerWon } = moveData;
    if (hasPlayerWon) return dispatch(changeTurnThunk(moveAndCapture));
    if ((diceNumber !== 6 || numberOfConsecutiveSix >= 3) && !isCaptured && !hasTokenReachedHome) {
      return dispatch(changeTurnThunk(moveAndCapture));
    }
  }, [diceNumber, dispatch, isActive, moveAndCapture, numberOfConsecutiveSix, token]);

  useEffect(() => {
    const prevClickData = tokenClickDataRef.current;
    const newTokenClickData = tokenClickData;

    if (!newTokenClickData || prevClickData?.timestamp === newTokenClickData.timestamp) return;
    tokenClickDataRef.current = newTokenClickData;

    if (newTokenClickData.colour === colour && newTokenClickData.id === id) {
      if (onlineContext?.isOnline) {
        // Online mode: ONLY send OpCode 5 (move request) to the host.
        // The host executes all game logic (move, capture, turn) and broadcasts
        // authoritative results via OpCode 9 (move result) + OpCode 6 (turn change).
        // Do NOT call moveAndCapture locally — that causes double moves.
        if (isActive && diceNumber !== -1 && diceNumber) {
          getNakamaSocket().sendMatchState(onlineContext.roomId, 5, JSON.stringify({
            colour,
            id,
            isUnlock: isLocked,
          }));
        }
      } else {
        executeTokenMove();
      }
    }
  }, [colour, executeTokenMove, id, tokenClickData, onlineContext, isLocked, isActive, diceNumber]);

  const handleTokenClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
    tokenElRef.current?.blur?.();
    if (onlineContext?.isOnline) {
      // Online mode: ONLY send OpCode 5 (move request) to the host.
      // The useEffect above already handles sending OpCode 5 when tokenClickData changes,
      // but this direct click handler ensures we also cover direct click events.
      if (isActive && diceNumber !== -1 && diceNumber) {
        getNakamaSocket().sendMatchState(onlineContext.roomId, 5, JSON.stringify({
          colour,
          id,
          isUnlock: isLocked,
        }));
      }
    } else {
      if (isLocked && isActive && diceNumber !== -1 && diceNumber) unlock();
      executeTokenMove();
    }
  };

  return (
    <button
      id={getTokenDOMId(colour, id)}
      className={styles.token}
      tabIndex={isActive ? undefined : -1}
      onFocus={() => setIsCurrentlyFocused(true)}
      onBlur={() => setIsCurrentlyFocused(false)}
      disabled={!isActive}
      ref={tokenElRef}
      onClick={handleTokenClick}
      style={
        {
          '--token-height': `${tokenHeight}px`,
          '--token-width': `${tokenWidth}px`,
          '--fill-colour': woodStainColours[colour],
          transform: `translate3d(${x}, ${y}, 12px) scale(${scaleFactor})`,
        } as React.CSSProperties
      }
    >
      <span
        key={`${coordinates.x}-${coordinates.y}`}
        className={clsx(styles.bouncer, {
          [styles.active]: isActive && !isCurrentlyFocused,
          [styles.hopper]: !isActive,
        })}
      >
        <TokenImage
          className={styles.svg}
          aria-hidden="true"
        />
      </span>
    </button>
  );
}

export default React.memo(Token);

