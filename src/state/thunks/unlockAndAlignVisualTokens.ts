import type { AppDispatch, RootState } from '../store';
import { changeVisualCoordsOfToken } from '../slices/playersSlice';
import { type TTokenColourAndId } from '../../types';
import { TOKEN_START_COORDINATES } from '../../game/tokens/constants';
import { applyAlignmentData } from '../../game/tokens/alignment';
import { tokensWithVisualCoord } from '../../game/tokens/logic';

export function unlockAndAlignVisualTokens({ colour, id }: TTokenColourAndId) {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    const tokenStartCoord = TOKEN_START_COORDINATES[colour];
    dispatch(changeVisualCoordsOfToken({ colour, id, newCoords: tokenStartCoord }));
    const players = getState().players.players;
    const tokensInStartCoord = tokensWithVisualCoord(tokenStartCoord, players);
    if (tokensInStartCoord.length !== 0) applyAlignmentData(tokensInStartCoord, dispatch);
  };
}
