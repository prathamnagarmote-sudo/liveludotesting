import { useDispatch, useStore } from 'react-redux';
import {
  deactivateAllTokens,
  markTokenAsReachedHome,
  setIsAnyTokenMoving,
} from '../state/slices/playersSlice';
import { type TToken } from '../types';
import { ERRORS } from '../utils/errors';
import type { AppDispatch, RootState } from '../state/store';
import { areCoordsEqual } from '../game/coords/logic';
import { updateTokenPositionAndAlignmentThunk } from '../state/thunks/updateTokenPositionAndAlignmentThunk';
import { setTokenTransitionTime } from '../utils/setTokenTransitionTime';
import { useCallback } from 'react';
import { FORWARD_TOKEN_TRANSITION_TIME } from '../game/tokens/constants';
import { tokenPaths } from '../game/tokens/paths';
import { getTokenDOMId } from '../game/tokens/logic';
import type { TMoveTokenCompletionData } from '../types/tokens';
import { playEngineSound } from '../utils/audio';

// ─── Global Cancellation Mechanism ────────────────────────────────────────────
// Each call to moveTokenForward generates a unique animation ID.
// When the turn timer expires mid-animation, cancelActiveTokenAnimation() is
// called which marks the current animation as cancelled. The moveStep chain
// checks this flag on every step and stops immediately if cancelled,
// releasing isAnyTokenMoving so the next player can proceed.
let activeAnimationId = 0;
let cancelFn: (() => void) | null = null;
let captureAnimCancelFn: (() => void) | null = null;

export function registerCaptureCancelFn(fn: () => void) {
  captureAnimCancelFn = fn;
}

export function cancelActiveTokenAnimation() {
  if (captureAnimCancelFn) {
    captureAnimCancelFn();
    captureAnimCancelFn = null;
  }
  if (cancelFn) {
    cancelFn();
    cancelFn = null;
  }
}

export const useMoveTokenForward = () => {
  const dispatch = useDispatch<AppDispatch>();
  const store = useStore<RootState>();

  return useCallback(
    (diceNumber: number, token: TToken): Promise<TMoveTokenCompletionData> => {
      return new Promise((resolve) => {
        if (diceNumber < 0) throw new Error(ERRORS.numberOfStepsNegative());
        const { colour, id, coordinates, isLocked } = token;
        if (isLocked) throw new Error(ERRORS.lockedToken(colour, id));
        const tokenPath = tokenPaths[colour];
        const players = store.getState().players.players;
        dispatch(deactivateAllTokens(colour));
        setTokenTransitionTime(FORWARD_TOKEN_TRANSITION_TIME, token);
        dispatch(setIsAnyTokenMoving(true));

        // Assign a unique ID to this animation instance
        activeAnimationId++;
        const myAnimationId = activeAnimationId;
        let pendingTimeout: ReturnType<typeof setTimeout> | null = null;
        let isCancelled = false;

        // Register the cancel function for this animation
        cancelFn = () => {
          if (myAnimationId !== activeAnimationId) return; // stale cancel
          isCancelled = true;
          if (pendingTimeout !== null) {
            clearTimeout(pendingTimeout);
            pendingTimeout = null;
          }
          // Immediately release the moving lock so the next player's turn can start
          dispatch(setIsAnyTokenMoving(false));
          resolve({
            lastTokenCoord: tokenPath[i],
            hasTokenReachedHome: false,
            moved: false,
            hasPlayerWon: false,
          });
        };

        // Ensure the token DOM element exists — we use pure setTimeout-based stepping
        // which is 100% reliable on all devices including mobile where transitionend
        // can be delayed or dropped under CPU pressure.
        const tokenEl = document.getElementById(getTokenDOMId(colour, id));
        if (!tokenEl) throw new Error(ERRORS.tokenDoesNotExist(colour, id));

        const initialCoordinateIndex = tokenPath.findIndex((v) => areCoordsEqual(v, coordinates));
        let i = initialCoordinateIndex;
        let count = 0;

        const moveStep = () => {
          // If another animation started or this one was cancelled, abort immediately.
          if (isCancelled || myAnimationId !== activeAnimationId) return;

          i++;
          count++;
          dispatch(updateTokenPositionAndAlignmentThunk({ colour, id, newCoords: tokenPath[i] }));

          const hasTokenReachedHome = areCoordsEqual(tokenPath[i], tokenPath[tokenPath.length - 1]);

          if (count >= diceNumber || hasTokenReachedHome) {
            // Last step — wait for its CSS transition to finish then resolve
            pendingTimeout = setTimeout(() => {
              pendingTimeout = null;
              // Final cancelled check before resolving
              if (isCancelled || myAnimationId !== activeAnimationId) return;
              playEngineSound();
              const player = players.find((p) => p.colour === colour);
              if (!player) return;
              const hasPlayerWon =
                hasTokenReachedHome &&
                player.tokens.filter((t) => t.hasTokenReachedHome).length === 3;
              if (hasTokenReachedHome) dispatch(markTokenAsReachedHome({ colour, id }));
              dispatch(setIsAnyTokenMoving(false));
              cancelFn = null; // Clean up cancel reference
              resolve({
                lastTokenCoord: tokenPath[i],
                hasTokenReachedHome,
                moved: true,
                hasPlayerWon,
              });
            }, FORWARD_TOKEN_TRANSITION_TIME);
          } else {
            // More steps remain — schedule the next step after the current transition
            pendingTimeout = setTimeout(() => {
              pendingTimeout = null;
              if (isCancelled || myAnimationId !== activeAnimationId) return;
              playEngineSound();
              moveStep();
            }, FORWARD_TOKEN_TRANSITION_TIME);
          }
        };

        // Kick off the first step
        moveStep();
      });
    },
    [dispatch, store]
  );
};
