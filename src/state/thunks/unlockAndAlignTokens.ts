import type { AppDispatch, RootState } from '../store';
import { unlockToken, changeVisualCoordsOfToken } from '../slices/playersSlice';
import { type TTokenColourAndId } from '../../types';
import { TOKEN_START_COORDINATES } from '../../game/tokens/constants';
import { applyAlignmentData } from '../../game/tokens/alignment';
import { tokensWithCoord } from '../../game/tokens/logic';

export function unlockAndAlignTokens({ colour, id }: TTokenColourAndId) {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(unlockToken({ colour, id }));
    const tokenStartCoord = TOKEN_START_COORDINATES[colour];
    dispatch(changeVisualCoordsOfToken({ colour, id, newCoords: tokenStartCoord }));
    const players = getState().players.players;
    const tokensInStartCoord = tokensWithCoord(tokenStartCoord, players);
    if (tokensInStartCoord.length !== 0) applyAlignmentData(tokensInStartCoord, dispatch);
  };
}
