import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { decrementTimeRemaining } from '../state/slices/sessionSlice';
import { endGameDueToTimeout } from '../state/slices/playersSlice';
import type { AppDispatch, RootState } from '../state/store';

export function useGameTimer() {
  const dispatch = useDispatch<AppDispatch>();
  const timeRemainingMs = useSelector((state: RootState) => state.session.timeRemainingMs);
  const isGameEnded = useSelector((state: RootState) => state.players.isGameEnded);

  const matchDurationMs = useSelector((state: RootState) => state.session.matchDurationMs);

  useEffect(() => {
    if (isGameEnded || timeRemainingMs <= 0 || matchDurationMs === 0) return;

    const intervalId = setInterval(() => {
      dispatch(decrementTimeRemaining(1000));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [dispatch, isGameEnded, timeRemainingMs, matchDurationMs]);

  useEffect(() => {
    if (matchDurationMs > 0 && timeRemainingMs === 0 && !isGameEnded) {
      dispatch(endGameDueToTimeout());
    }
  }, [timeRemainingMs, isGameEnded, dispatch, matchDurationMs]);
}
