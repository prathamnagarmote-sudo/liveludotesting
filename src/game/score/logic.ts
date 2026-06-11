import type { TPlayer, TToken, TPlayerColour } from '../../types';
import { tokenPaths } from '../tokens/paths';
import { areCoordsEqual } from '../coords/logic';

/**
 * Calculates the total score for a single token based on its path progress.
 * Returns 0 if locked or returned home due to a kill.
 * Retains max value if token reaches its final home coordinate.
 */
export function getTokenProgress(token: TToken): number {
  if (token.isLocked && !token.hasTokenReachedHome) return 0;
  
  const tokenPath = tokenPaths[token.colour];
  const currentIndex = tokenPath.findIndex((c) => areCoordsEqual(c, token.coordinates));
  
  // If the token is not on the path (e.g. somehow invalid or start box), score is 0.
  // The very first spot on the board is index 0, but it counts as 0 progress according to rules until it moves?
  // Wait, "Rolling a 6 itself does not increase the score." 
  // If it's at index 0, it has taken 0 steps, so progress is 0. This matches perfectly.
  return Math.max(0, currentIndex);
}

/**
 * Calculates the total score for a player by summing the progress of all their tokens.
 */
export function getPlayerScore(player: TPlayer): number {
  if (!player || !player.tokens) return 0;
  return player.tokens.reduce((total, token) => total + getTokenProgress(token), 0);
}

export type TLeaderboardStanding = {
  rank: number;
  name: string;
  colour: TPlayerColour;
  score: number;
  isBot: boolean;
};

/**
 * Ranks all players based on their current score (highest to lowest).
 */
export function getLeaderboardStandings(players: TPlayer[]): TLeaderboardStanding[] {
  const standings = players.map(player => ({
    name: player.name,
    colour: player.colour,
    score: getPlayerScore(player),
    isBot: player.isBot,
  }));

  // Sort descending by score
  standings.sort((a, b) => b.score - a.score);

  // Assign ranks
  let currentRank = 1;
  return standings.map((standing, index) => {
    if (index > 0 && standing.score < standings[index - 1].score) {
      currentRank = index + 1;
    }
    return {
      ...standing,
      rank: currentRank,
    };
  });
}
