import { useEffect, useRef, useState, useContext } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { type RootState } from '../state/store';
import { type TPlayerColour } from '../types';
import { changeTurnThunk } from '../state/thunks/changeTurnThunk';
import { useMoveAndCaptureToken } from './useMoveAndCaptureToken';
import { incrementMissedTurns, deactivateTokensOfAllPlayers, setIsAnyTokenMoving } from '../state/slices/playersSlice';
import { OnlineGameContext } from '../pages/Play/components/Game/Game';
import { cancelActiveTokenAnimation } from './useMoveTokenForward';

const TOTAL_TURN_TIME_MS = 15000;

export function useTurnTimer(
  colour: TPlayerColour,
  isDiceRollAllowed: boolean,
  pathRef: React.RefObject<SVGPathElement | null>
) {
  const dispatch = useDispatch<any>();
  const store = useStore<RootState>();
  const onlineContext = useContext(OnlineGameContext);
  const { currentPlayerColour, isGameEnded, players, isAnyTokenMoving } = useSelector(
    (state: RootState) => state.players
  );
  const moveAndCapture = useMoveAndCaptureToken();
  const requestRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number | undefined>(undefined);
  const prevIsDiceRollAllowedRef = useRef<boolean>(isDiceRollAllowed);

  // States that only update on phase/status transitions to prevent excessive re-renders
  const [phase, setPhase] = useState(1);
  const [isCritical, setIsCritical] = useState(false);

  const phaseRef = useRef(1);
  const isCriticalRef = useRef(false);

  const player = players.find((p) => p.colour === colour);
  const isBot = player?.isBot;
  const isCurrentPlayer = currentPlayerColour === colour;
  const shouldRunTimer = isCurrentPlayer && !isGameEnded && !isBot && !isAnyTokenMoving;

  // Track the transition of isDiceRollAllowed from false to true to reset the timer
  useEffect(() => {
    if (shouldRunTimer) {
      if (!prevIsDiceRollAllowedRef.current && isDiceRollAllowed) {
        startTimeRef.current = undefined;
        // Reset path attributes immediately in DOM
        if (pathRef.current) {
          pathRef.current.setAttribute('stroke-dashoffset', '0');
          pathRef.current.setAttribute('stroke', '#32cd32');
        }
        setPhase(1);
        phaseRef.current = 1;
        setIsCritical(false);
        isCriticalRef.current = false;
      }
    }
    prevIsDiceRollAllowedRef.current = isDiceRollAllowed;
  }, [isDiceRollAllowed, shouldRunTimer, pathRef]);

  useEffect(() => {
    if (!shouldRunTimer) {
      if (requestRef.current !== undefined) cancelAnimationFrame(requestRef.current);
      startTimeRef.current = undefined;
      // Revert to initial hidden (337.792 offset) when timer stops/resets
      if (pathRef.current) {
        pathRef.current.setAttribute('stroke-dashoffset', '337.792');
        pathRef.current.setAttribute('stroke', '#32cd32');
      }
      setPhase(1);
      phaseRef.current = 1;
      setIsCritical(false);
      isCriticalRef.current = false;
      return;
    }

    const updateTimer = (timestamp: number) => {
      let MathRemaining = 0;
      if (onlineContext?.isOnline && onlineContext.turnDeadlineMs) {
        MathRemaining = Math.max(0, onlineContext.turnDeadlineMs - Date.now());
      } else {
        if (!startTimeRef.current) startTimeRef.current = timestamp;
        const elapsed = timestamp - startTimeRef.current;
        MathRemaining = Math.max(0, TOTAL_TURN_TIME_MS - elapsed);
      }
      
      // Direct DOM manipulation of the SVG path for ultra-smooth rendering
      if (pathRef.current) {
        const pct = MathRemaining / TOTAL_TURN_TIME_MS;
        const offset = 337.792 * (1 - pct);
        pathRef.current.setAttribute('stroke-dashoffset', offset.toString());

        let color = '#32cd32'; // Green
        if (MathRemaining <= 7500 && MathRemaining > 3750) {
          color = '#ff9800'; // Orange
        } else if (MathRemaining <= 3750) {
          color = '#ff4d4d'; // Red
        }
        pathRef.current.setAttribute('stroke', color);
      }

      // Check phase and critical transitions to update state only on boundaries
      let currentPhase = 1;
      if (MathRemaining <= 7500 && MathRemaining > 3750) currentPhase = 2;
      else if (MathRemaining <= 3750) currentPhase = 3;

      if (currentPhase !== phaseRef.current) {
        phaseRef.current = currentPhase;
        setPhase(currentPhase);
      }

      const currentCritical = MathRemaining <= 3750 && MathRemaining > 0;
      if (currentCritical !== isCriticalRef.current) {
        isCriticalRef.current = currentCritical;
        setIsCritical(currentCritical);
      }

      if (MathRemaining > 0) {
        requestRef.current = requestAnimationFrame(updateTimer);
      } else {
        // Time is up! Reset start time ref first to prevent re-entrant loops
        startTimeRef.current = undefined;
        if (requestRef.current !== undefined) {
          cancelAnimationFrame(requestRef.current);
          requestRef.current = undefined;
        }

        // Time is up! Cancel any in-flight token animation immediately so
        // isAnyTokenMoving is reset to false before we change the turn.
        // Without this, the hopping animation from the expired turn continues
        // into the next player's turn, blocking their timer and dice click.
        cancelActiveTokenAnimation();
        dispatch(setIsAnyTokenMoving(false));

        if (onlineContext?.isOnline) {
          // Under server-authoritative model, we let the server resolve timeouts
          return;
        }
        // Skip turn and increment missed turns
        dispatch(incrementMissedTurns(colour));
        if (false) {
        } else {
          // Offline: check local missed turns and handle game-over
          const freshState = store.getState();
          const missedCount = freshState.players.players.find(p => p.colour === colour)?.missedTurns ?? 0;
          if (missedCount >= 3) {
            // End the game locally
            dispatch({ type: 'players/endGameDueToTimeout' });
          } else {
            dispatch(deactivateTokensOfAllPlayers());
            dispatch(changeTurnThunk(moveAndCapture));
          }
        }
      }
    };

    requestRef.current = requestAnimationFrame(updateTimer);

    return () => {
      if (requestRef.current !== undefined) cancelAnimationFrame(requestRef.current);
    };
  }, [shouldRunTimer, dispatch, moveAndCapture, onlineContext, colour, store, pathRef]);

  return {
    phase,
    isCritical,
    shouldShowTimer: shouldRunTimer,
  };
}
