import type { TPlayerColour, TPlayer, TCoordinate } from '../../types';
import type { TToken } from '../../types';
import { areCoordsEqual, getDistanceInTokenPath, getHomeCoordForColour, isCoordASafeSpot } from '../coords/logic';
import { tokenPaths } from './paths';

export function isAnyTokenActiveOfColour(colour: TPlayerColour, players: TPlayer[]): boolean {
  const player = players.find((p) => p.colour === colour);
  if (!player || !player.tokens) return false;
  return player.tokens.some((t) => t.isActive);
}

export function tokensWithCoord(coord: TCoordinate, players: TPlayer[]): TToken[] {
  const allTokens = players.flatMap((p) => p.tokens);
  return allTokens.filter((t) => areCoordsEqual(t.coordinates, coord));
}

export function tokensWithVisualCoord(coord: TCoordinate, players: TPlayer[]): TToken[] {
  const allTokens = players.flatMap((p) => p.tokens);
  return allTokens.filter((t) => areCoordsEqual(t.visualCoordinates, coord));
}

export function getAvailableSteps({ colour, coordinates }: TToken): number {
  return getDistanceInTokenPath(colour, coordinates, getHomeCoordForColour(colour));
}

export function isTokenMovable(token: TToken, diceNumber?: number, allTokens?: TToken[]): boolean {
  if (!diceNumber) return !token.isLocked && !token.hasTokenReachedHome;
  if (token.isLocked || token.hasTokenReachedHome || getAvailableSteps(token) < diceNumber) {
    return false;
  }

  if (allTokens) {
    const tokenPath = tokenPaths[token.colour];
    const currentCoordIndex = tokenPath.findIndex((c) => areCoordsEqual(token.coordinates, c));
    if (currentCoordIndex !== -1) {
      for (let i = 1; i <= diceNumber; i++) {
        const stepIndex = currentCoordIndex + i;
        if (stepIndex >= tokenPath.length) break;
        const stepCoord = tokenPath[stepIndex];

        const opponentColours = (['blue', 'red', 'green', 'yellow'] as TPlayerColour[]).filter(
          (c) => c !== token.colour
        );

        for (const oppColour of opponentColours) {
          if (!isCoordASafeSpot(stepCoord, oppColour)) {
            const tokensAtCoord = allTokens.filter(
              (t) =>
                t.colour === oppColour &&
                !t.isLocked &&
                !t.hasTokenReachedHome &&
                areCoordsEqual(t.coordinates, stepCoord)
            );
            if (tokensAtCoord.length >= 2) {
              return false;
            }
          }
        }
      }
    }
  }

  return true;
}

export function getTokenDOMId(colour: TPlayerColour, id: number): string {
  return `${colour}_${id}`;
}
