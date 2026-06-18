import { describe, it, expect } from 'vitest';
import playersReducer, {
  changeCoordsOfToken,
  lockToken,
  unlockToken,
  markTokenAsReachedHome,
  initialState,
  getToken,
} from '../src/state/slices/playersSlice';
import { cloneDeep } from 'lodash-es';
import { DUMMY_PLAYERS } from './fixtures/players.dummy';

describe('Client-Side Prediction and Server Reconciliation Tests', () => {
  it('should optimistically simulate unlocking a token locally', () => {
    const initState = cloneDeep(initialState);
    initState.players = cloneDeep(DUMMY_PLAYERS);
    
    const token = getToken(initState, 'blue', 0);
    expect(token.isLocked).toBe(true);

    // Client prediction: unlock the token
    const newState = playersReducer(initState, unlockToken({ colour: 'blue', id: 0 }));
    const updatedToken = getToken(newState, 'blue', 0);
    
    expect(updatedToken.isLocked).toBe(false);
  });

  it('should reconcile local state with authoritative server state sync', () => {
    const initState = cloneDeep(initialState);
    initState.players = cloneDeep(DUMMY_PLAYERS);

    // Scenario: Client optimistically moved a token to { x: 5, y: 5 }
    let testState = playersReducer(
      initState,
      changeCoordsOfToken({ colour: 'blue', id: 0, newCoords: { x: 5, y: 5 } })
    );

    let token = getToken(testState, 'blue', 0);
    expect(token.coordinates).toEqual({ x: 5, y: 5 });

    // Server authoritative update (OpCode 200 state sync) sends the actual coordinate { x: 6, y: 2 }
    const serverSyncPayload = {
      players: [
        {
          colour: 'blue',
          tokens: [
            { id: 0, coordinates: { x: 6, y: 2 }, isLocked: false, hasTokenReachedHome: false },
          ],
        },
      ],
    };

    // Client processes reconciliation by applying server-sent coordinates
    serverSyncPayload.players.forEach((p) => {
      p.tokens.forEach((t) => {
        testState = playersReducer(
          testState,
          changeCoordsOfToken({ colour: p.colour as any, id: t.id, newCoords: t.coordinates })
        );
      });
    });

    const reconciledToken = getToken(testState, 'blue', 0);
    expect(reconciledToken.coordinates).toEqual({ x: 6, y: 2 });
  });

  it('should handle authoritative token capture reconciliation', () => {
    const initState = cloneDeep(initialState);
    initState.players = cloneDeep(DUMMY_PLAYERS);

    // Scenario: Token was active but server notifies it was captured (sent back to base / locked)
    const token = getToken(initState, 'blue', 0);
    const unlockedState = playersReducer(initState, unlockToken({ colour: 'blue', id: 0 }));
    
    // Check it is unlocked
    expect(getToken(unlockedState, 'blue', 0).isLocked).toBe(false);

    // Reconcile capture: Lock token back and reset coordinates
    const capturedState = playersReducer(unlockedState, lockToken({ colour: 'blue', id: 0 }));
    const reconciledToken = getToken(capturedState, 'blue', 0);

    expect(reconciledToken.isLocked).toBe(true);
    expect(reconciledToken.coordinates).toEqual(token.initialCoords);
  });

  it('should handle authoritative home reach reconciliation', () => {
    const initState = cloneDeep(initialState);
    initState.players = cloneDeep(DUMMY_PLAYERS);

    const unlockedState = playersReducer(initState, unlockToken({ colour: 'blue', id: 0 }));

    // Reconcile reach home
    const reachedHomeState = playersReducer(
      unlockedState,
      markTokenAsReachedHome({ colour: 'blue', id: 0 })
    );

    const reconciledToken = getToken(reachedHomeState, 'blue', 0);
    expect(reconciledToken.hasTokenReachedHome).toBe(true);
    expect(reconciledToken.isLocked).toBe(true);
  });
});
