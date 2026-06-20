import { changeVisualCoordsOfToken, changeCoordsOfToken } from '../slices/playersSlice';
import { type TPlayerColour, type TCoordinate } from '../../types';
import type { AppDispatch, RootState } from '../store';
import { areCoordsEqual } from '../../game/coords/logic';
import { tokensWithVisualCoord } from '../../game/tokens/logic';
import { tokenPaths } from '../../game/tokens/paths';
import { applyAlignmentData } from '../../game/tokens/alignment';

export function updateTokenPositionAndAlignmentThunk({
  colour,
  id,
  newCoords,
  isVisualOnly = false,
}: {
  colour: TPlayerColour;
  id: number;
  newCoords: TCoordinate;
  isVisualOnly?: boolean;
}) {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(changeVisualCoordsOfToken({ colour, id, newCoords }));
    if (!isVisualOnly) {
      dispatch(changeCoordsOfToken({ colour, id, newCoords }));
    }
    const players = getState().players.players;
    const tokenPath = tokenPaths[colour];
    const currentCoordIndex = tokenPath.findIndex((c) => areCoordsEqual(c, newCoords));
    const previousCoord =
      currentCoordIndex === 0 ? { x: -1, y: -1 } : tokenPath[currentCoordIndex - 1];
    const tokensInCurrentCoord = tokensWithVisualCoord(newCoords, players);
    const tokensInPrevCoord = tokensWithVisualCoord(previousCoord, players);
    if (tokensInCurrentCoord.length !== 0) applyAlignmentData(tokensInCurrentCoord, dispatch);
    if (tokensInPrevCoord.length !== 0) applyAlignmentData(tokensInPrevCoord, dispatch);
  };
}
