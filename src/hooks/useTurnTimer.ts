import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { type RootState } from '../state/store';
import { type TPlayerColour } from '../types';
import { changeTurnThunk } from '../state/thunks/changeTurnThunk';
import { useMoveAndCaptureToken } from './useMoveAndCaptureToken';
import { incrementMissedTurns } from '../state/slices/playersSlice';

const TOTAL_TURN_TIME_MS = 15000;

export function useTurnTimer(colour: TPlayerColour, isActiveContainer: boolean) {
  const dispatch = useDispatch<any>();
  const [timeLeftMs, setTimeLeftMs] = useState(TOTAL_TURN_TIME_MS);
  const { currentPlayerColour, isGameEnded } = useSelector(
    (state: RootState) => state.players
  );
  const moveAndCapture = useMoveAndCaptureToken();
  const requestRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number | undefined>(undefined);

  const isCurrentPlayer = currentPlayerColour === colour;
  const shouldRunTimer = isCurrentPlayer && !isGameEnded && isActiveContainer;

  useEffect(() => {
    if (!shouldRunTimer) {
      if (requestRef.current !== undefined) cancelAnimationFrame(requestRef.current);
      setTimeLeftMs(TOTAL_TURN_TIME_MS);
      startTimeRef.current = undefined;
      return;
    }

    const updateTimer = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const remaining = Math.max(0, TOTAL_TURN_TIME_MS - elapsed);
      
      setTimeLeftMs(remaining);

      if (remaining > 0) {
        requestRef.current = requestAnimationFrame(updateTimer);
      } else {
        // Time is up! Skip turn and increment missed turns
        dispatch(incrementMissedTurns(colour));
        dispatch(changeTurnThunk(moveAndCapture));
      }
    };

    requestRef.current = requestAnimationFrame(updateTimer);

    return () => {
      if (requestRef.current !== undefined) cancelAnimationFrame(requestRef.current);
    };
  }, [shouldRunTimer, dispatch, moveAndCapture]);

  const progressPercentage = (timeLeftMs / TOTAL_TURN_TIME_MS) * 100;
  
  let phase = 1; // Green
  if (timeLeftMs <= 10000 && timeLeftMs > 5000) phase = 2; // Yellow
  else if (timeLeftMs <= 5000) phase = 3; // Red

  const isCritical = timeLeftMs <= 3000 && timeLeftMs > 0;

  return {
    progressPercentage,
    phase,
    isCritical,
    shouldShowTimer: shouldRunTimer,
  };
}
