import type { TPlayerColour, TCoordinate, TToken, TPlayer } from '../src/types';

export class GameEngine {
  matches: Map<string, any>;
  constructor();
  handleMessage(ws: any, matchId: string, message: any): void;
  handleJoinMatch(ws: any, matchId: string, message: any): void;
  handleStateSyncRequest(ws: any, matchId: string, message: any): void;
  handleRollDice(ws: any, matchId: string, message: any): void;
  handleMoveToken(ws: any, matchId: string, message: any): void;
  handleQuitGame(ws: any, matchId: string, message: any): void;
  handleDisconnect(ws: any, matchId: string): void;
  cleanupMatch(matchId: string): void;
  broadcast(matchId: string, messageObj: any): void;
  getAllTokens(state: any): TToken[];
  executeRoll(matchId: string, colour: string, forcedNumber?: number | null): void;
  executeMove(matchId: string, colour: string, tokenId: number): void;
  resolvePostMoveTurnHandoff(matchId: string, colour: string, diceNumber: number, hasTokenReachedHome: boolean, isCaptured: boolean): void;
  nextTurn(matchId: string): void;
  handleTurnTimeout(matchId: string): void;
  startTurnTimeoutTimer(matchId: string): void;
  processBotTurnIfNeeded(matchId: string): void;
  executeQuit(matchId: string, colour: string): void;
}

export function expandTokenPath(tokenPathsArr: any[]): TCoordinate[];
export function isCoordASafeSpot(coord: TCoordinate, colour?: TPlayerColour): boolean;
export function isTokenMovable(token: TToken, diceNumber?: number, allTokens?: TToken[]): boolean;
export function computeMoveResult(token: TToken, diceNumber: number, players: TPlayer[]): any;
export function selectBestBotToken(player: TPlayer, roll: number, allTokens: TToken[]): TToken | null;
