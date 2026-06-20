import { useDispatch } from 'react-redux';
import { deactivateAllTokens } from '../state/slices/playersSlice';
import { type TToken, type TCoordinate } from '../types';
import { useCaptureTokenInSameCoord } from './useCaptureTokenInSameCoord';
import { useMoveTokenForward } from './useMoveTokenForward';
import type { TMoveData } from '../types/tokens';
import { getAvailableSteps } from '../game/tokens/logic';
import { useCallback } from 'react';
import { playCrashSound, playVictorySound } from '../utils/audio';

export function useMoveAndCaptureToken() {
  const moveToken = useMoveTokenForward();
  const captureToken = useCaptureTokenInSameCoord();
  const dispatch = useDispatch();
  return useCallback(
    async (token: TToken, diceNumber: number, customPath?: TCoordinate[]): Promise<TMoveData | null> => {
      if (!customPath && getAvailableSteps(token) < diceNumber) {
        dispatch(deactivateAllTokens(token.colour));
        return null;
      }

      const { hasTokenReachedHome, lastTokenCoord, hasPlayerWon, moved } = await moveToken(
        diceNumber,
        token,
        customPath
      );
      if (!moved) return null;
      const isCaptured = await captureToken(token, lastTokenCoord);
      
      if (isCaptured) {
        playCrashSound();
      } else if (hasTokenReachedHome || hasPlayerWon) {
        playVictorySound();
      }

      return { isCaptured, hasTokenReachedHome, hasPlayerWon };
    },
    [captureToken, dispatch, moveToken]
  );
}
