import { useStore } from 'react-redux';
import type { TCoordinate } from '../types';
import type { TTokenAlignmentData } from '../types';
import type { RootState } from '../state/store';
import { useCallback } from 'react';

export const useCoordsToPosition = (): ((
  coords: TCoordinate,
  tokenAlignmentData: TTokenAlignmentData
) => { x: string; y: string }) => {
  const store = useStore<RootState>();
  return useCallback(
    (coords: TCoordinate, tokenAlignmentData: TTokenAlignmentData) => {
      const { boardTileSize, tokenHeight, tokenWidth } = store.getState().board;
      const { xOffset, yOffset } = tokenAlignmentData;

      const tileCenterX = (coords.x + 0.5) * boardTileSize;
      const tileCenterY = (coords.y + 0.5) * boardTileSize;

      const x = `${tileCenterX - tokenWidth / 2 + xOffset * boardTileSize}px`;
      const yOffsetFactor = 0.85;
      const y = `${tileCenterY - tokenHeight * yOffsetFactor + yOffset * boardTileSize}px`;
      return { x, y };
    },
    [store]
  );
};
