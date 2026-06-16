import { createAsyncThunk } from '@reduxjs/toolkit';
import { type RootState } from '../store';
import { setPlayerSequenceDirect, resetGameState } from '../slices/playersSlice';
import { clearDiceState, registerDice } from '../slices/diceSlice';
import { setGameStartTime } from '../slices/sessionSlice';

export const restartGameThunk = createAsyncThunk(
  'game/restartGame',
  async (_, { getState, dispatch }) => {
    const state = getState() as RootState;
    // Get active players (players who haven't quit)
    const activePlayers = state.players.players.filter(p => !p.hasQuit);
    const mappedSequence = activePlayers.map(p => p.colour);
    
    // We should only dispatch if we have active players
    if (activePlayers.length === 0) return;

    dispatch(resetGameState());
    dispatch(setPlayerSequenceDirect(mappedSequence));
    dispatch(setGameStartTime(Date.now()));

    // re-register dice for active players
    dispatch(clearDiceState());
    activePlayers.forEach((player) => {
      dispatch(registerDice(player.colour));
    });
  }
);
