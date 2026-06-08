import type { TPlayerColour, TPlayerCount } from '../../types';

export const playerColours = {
  blue: '#1e88e5ff',
  red: '#e53935ff',
  green: '#43a047ff',
  yellow: '#fdd835ff',
};

export const MAX_PLAYER_NAME_LENGTH = 15;
export const playerSequences: Record<TPlayerCount, TPlayerColour[]> = {
  two: ['blue', 'green'],
  three: ['blue', 'red', 'green'],
  four: ['blue', 'red', 'green', 'yellow'],
};
