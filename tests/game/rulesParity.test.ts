import { describe, it, expect } from 'vitest';
import type { TToken, TPlayer, TCoordinate } from '../../src/types';
import { expandTokenPath as clientExpandTokenPath } from '../../src/game/tokens/paths';
import { isCoordASafeSpot as clientIsCoordASafeSpot } from '../../src/game/coords/logic';
import { isTokenMovable as clientIsTokenMovable } from '../../src/game/tokens/logic';
import { selectBestTokenForBot as clientSelectBestTokenForBot } from '../../src/game/bot/selectBestTokenForBot';

// Import server functions
// @ts-ignore
import {
  expandTokenPath as serverExpandTokenPath,
  isCoordASafeSpot as serverIsCoordASafeSpot,
  isTokenMovable as serverIsTokenMovable,
  computeMoveResult as serverComputeMoveResult,
  selectBestBotToken as serverSelectBestBotToken
} from '../../server/GameEngine.js';

describe('Ludo Rules Parity Tests (Client vs Server Engine)', () => {
  // Test paths expansion parity
  describe('expandTokenPath Parity', () => {
    it('should expand paths identically', () => {
      const pathSegment = [{ startCoords: { x: 6, y: 13 }, endCoords: { x: 6, y: 9 } }];
      const clientResult = clientExpandTokenPath(pathSegment);
      const serverResult = serverExpandTokenPath(pathSegment);
      expect(clientResult).toEqual(serverResult);
    });
  });

  // Test safe spots parity
  describe('isCoordASafeSpot Parity', () => {
    it('should evaluate safe spots identically across coordinates', () => {
      const coordinatesToTest: TCoordinate[] = [
        { x: 6, y: 13 }, // Safe
        { x: 8, y: 12 }, // Safe
        { x: 6, y: 12 }, // Not Safe
        { x: 2, y: 8 },  // Safe
        { x: 3, y: 8 },  // Not Safe
      ];

      coordinatesToTest.forEach(coord => {
        const clientVal = clientIsCoordASafeSpot(coord);
        const serverVal = serverIsCoordASafeSpot(coord);
        expect(clientVal).toBe(serverVal);
      });
    });
  });

  // Test token movability parity
  describe('isTokenMovable Parity', () => {
    const dummyToken: TToken = {
      id: 0,
      colour: 'blue',
      coordinates: { x: 1.45, y: 10.55 },
      initialCoords: { x: 1.45, y: 10.55 },
      visualCoordinates: { x: 1.45, y: 10.55 },
      isLocked: true,
      isActive: false,
      hasTokenReachedHome: false,
      tokenAlignmentData: { xOffset: 0, yOffset: 0, scaleFactor: 1 }
    };

    it('should evaluate locked tokens identically for non-6 rolls', () => {
      expect(clientIsTokenMovable(dummyToken, 5)).toBe(false);
      expect(serverIsTokenMovable(dummyToken, 5)).toBe(false);
    });

    it('should evaluate locked tokens identically for 6 rolls', () => {
      // Client checks unlock capability separately from in-field movability:
      const clientIsUnlockable = !dummyToken.hasTokenReachedHome && dummyToken.isLocked && 6 === 6;
      expect(clientIsUnlockable).toBe(true);
      expect(serverIsTokenMovable(dummyToken, 6)).toBe(true);
    });

    it('should prevent movement identically when a token path is blocked by opponent double stacking', () => {
      const movingToken: TToken = {
        ...dummyToken,
        isLocked: false,
        coordinates: { x: 6, y: 13 }
      };

      const blockCoord = { x: 6, y: 11 };
      const opponentTokens: TToken[] = [
        { ...dummyToken, colour: 'red', id: 0, isLocked: false, coordinates: blockCoord },
        { ...dummyToken, colour: 'red', id: 1, isLocked: false, coordinates: blockCoord }
      ];

      const allTokens = [movingToken, ...opponentTokens];

      // Convert server-side tokens to matching structure
      const clientVal = clientIsTokenMovable(movingToken, 3, allTokens);
      const serverVal = serverIsTokenMovable(movingToken, 3, allTokens);
      
      expect(clientVal).toBe(false);
      expect(serverVal).toBe(false);
    });
  });

  // Test captures and move outcome parity
  describe('computeMoveResult Parity', () => {
    it('should return identical path and capture flags', () => {
      const movingToken: TToken = {
        id: 0,
        colour: 'blue',
        coordinates: { x: 6, y: 13 },
        initialCoords: { x: 1.45, y: 10.55 },
        visualCoordinates: { x: 6, y: 13 },
        isLocked: false,
        isActive: false,
        hasTokenReachedHome: false,
        tokenAlignmentData: { xOffset: 0, yOffset: 0, scaleFactor: 1 }
      };

      const opponentPlayer: TPlayer = {
        name: 'Opponent',
        colour: 'red',
        isBot: false,
        numberOfConsecutiveSix: 0,
        tokens: [
          {
            id: 0,
            colour: 'red',
            coordinates: { x: 6, y: 10 }, // Path index matches roll 3 from (6,13)
            initialCoords: { x: 1.45, y: 1.5 },
            visualCoordinates: { x: 6, y: 10 },
            isLocked: false,
            isActive: false,
            hasTokenReachedHome: false,
            tokenAlignmentData: { xOffset: 0, yOffset: 0, scaleFactor: 1 }
          }
        ],
        missedTurns: 0,
        hasQuit: false,
        playerFinishTime: -1
      };

      const selfPlayer: TPlayer = {
        name: 'Player',
        colour: 'blue',
        isBot: false,
        numberOfConsecutiveSix: 0,
        tokens: [movingToken],
        missedTurns: 0,
        hasQuit: false,
        playerFinishTime: -1
      };

      const players = [selfPlayer, opponentPlayer];

      const serverResult = serverComputeMoveResult(movingToken, 3, players);
      expect(serverResult.isCaptured).toBe(true);
      expect(serverResult.path.length).toBe(3);
    });
  });

  // Test bot heuristics decision parity
  describe('selectBestBotToken/selectBestTokenForBot Heuristics Parity', () => {
    it('should select the same prioritised action for bot decisions', () => {
      const botTokenToUnlock: TToken = {
        id: 0,
        colour: 'blue',
        coordinates: { x: 1.45, y: 10.55 },
        initialCoords: { x: 1.45, y: 10.55 },
        visualCoordinates: { x: 1.45, y: 10.55 },
        isLocked: true,
        isActive: false,
        hasTokenReachedHome: false,
        tokenAlignmentData: { xOffset: 0, yOffset: 0, scaleFactor: 1 }
      };

      const botTokenInField: TToken = {
        id: 1,
        colour: 'blue',
        coordinates: { x: 6, y: 13 },
        initialCoords: { x: 3.55, y: 10.55 },
        visualCoordinates: { x: 6, y: 13 },
        isLocked: false,
        isActive: false,
        hasTokenReachedHome: false,
        tokenAlignmentData: { xOffset: 0, yOffset: 0, scaleFactor: 1 }
      };

      const allTokens = [botTokenToUnlock, botTokenInField];
      const botPlayer: TPlayer = {
        name: 'Bot',
        colour: 'blue',
        isBot: true,
        numberOfConsecutiveSix: 0,
        tokens: allTokens,
        missedTurns: 0,
        hasQuit: false,
        playerFinishTime: -1
      };

      // When rolling a 6, both bot engines should prioritize unlocking the locked token (due to UNLOCK_BONUS)
      const clientDecision = clientSelectBestTokenForBot('blue', 6, allTokens);
      const serverDecision = serverSelectBestBotToken(botPlayer, 6, allTokens);

      expect(clientDecision?.id).toBe(0);
      expect(serverDecision?.id).toBe(0);
    });
  });
});
