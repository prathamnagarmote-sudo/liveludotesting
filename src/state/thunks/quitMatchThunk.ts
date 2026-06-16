import type { AppDispatch, RootState } from '../store';
import { quitMatch } from '../slices/playersSlice';
import { changeTurnThunk } from './changeTurnThunk';
import type { useMoveAndCaptureToken } from '../../hooks/useMoveAndCaptureToken';
import type { TPlayerColour } from '../../types';

export function quitMatchThunk(
  colour: TPlayerColour,
  moveAndCapture: ReturnType<typeof useMoveAndCaptureToken>
) {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    const { currentPlayerColour } = getState().players;
    
    // Dispatch the synchronous quit reducer to remove them from sequence
    dispatch(quitMatch(colour));
    
    // If it was their turn, seamlessly transition to the next player
    if (currentPlayerColour === colour) {
      dispatch(changeTurnThunk(moveAndCapture));
    }
  };
}
