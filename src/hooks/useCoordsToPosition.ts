import { useStore } from 'react-redux';
import type { TCoordinate } from '../types';
import type { TTokenAlignmentData } from '../types';
import type { RootState } from '../state/store';
import { useCallback } from 'react';

export const useCoordsToPosition = (): ((
  coords: TCoordinate,
  tokenAlignmentData: TTokenAlignmentData,
  isLocked?: boolean
) => { x: string; y: string }) => {
  const store = useStore<RootState>();
  return useCallback(
    (coords: TCoordinate, tokenAlignmentData: TTokenAlignmentData, isLocked: boolean = false) => {
      const { boardTileSize, tokenHeight, tokenWidth } = store.getState().board;
      const { xOffset, yOffset } = tokenAlignmentData;
      const tileCenterX = coords.x * boardTileSize + boardTileSize / 2;
      const tileCenterY = coords.y * boardTileSize + boardTileSize / 2;
      const x = `${tileCenterX - tokenWidth / 2 + xOffset * boardTileSize}px`;
      const yOffsetFactor = isLocked ? 0.80 : 0.65;
      const y = `${tileCenterY - tokenHeight * yOffsetFactor + yOffset * boardTileSize}px`;
      return { x, y };
    },
    [store]
  );
};
