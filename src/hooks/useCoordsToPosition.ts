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
      const { boardTileSize, tokenHeight, tokenWidth, boardSideLength } = store.getState().board;
      const { xOffset, yOffset } = tokenAlignmentData;

      if (isLocked) {
        // Use original linear math for locked tokens in paddocks
        const tileCenterX = coords.x * boardTileSize + boardTileSize / 2;
        const tileCenterY = coords.y * boardTileSize + boardTileSize / 2;
        const x = `${tileCenterX - tokenWidth / 2 + xOffset * boardTileSize}px`;
        const yOffsetFactor = 0.88;
        const y = `${tileCenterY - tokenHeight * yOffsetFactor + yOffset * boardTileSize}px`;
        return { x, y };
      }

      const logicalToVisual = (l: number): number => {
        if (l < 6) return l;
        if (l < 9) return l + 1;
        return l + 2;
      };

      const vx = logicalToVisual(coords.x);
      const vy = logicalToVisual(coords.y);

      const visualTileSize = 0.05883748 * boardSideLength;
      const tileCenterX = (vx + 0.5) * visualTileSize;
      const tileCenterY = (vy + 0.5) * visualTileSize;

      const x = `${tileCenterX - tokenWidth / 2 + xOffset * visualTileSize}px`;
      const yOffsetFactor = 0.88;
      const y = `${tileCenterY - tokenHeight * yOffsetFactor + yOffset * visualTileSize}px`;
      return { x, y };
    },
    [store]
  );
};
