import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type TSessionState = {
  gameStartTime: number;
  gameInactiveTime: number;
  matchDurationMs: number;
  timeRemainingMs: number;
};

export const initialState: TSessionState = {
  gameInactiveTime: 0,
  gameStartTime: 0,
  matchDurationMs: 0,
  timeRemainingMs: 0,
};

const reducers = {
  setGameStartTime: (state: TSessionState, action: PayloadAction<number>) => {
    state.gameStartTime = action.payload;
  },
  addToGameInactiveTime: (state: TSessionState, action: PayloadAction<number>) => {
    state.gameInactiveTime += action.payload;
  },
  setMatchDuration: (state: TSessionState, action: PayloadAction<number>) => {
    state.matchDurationMs = action.payload;
    state.timeRemainingMs = action.payload;
  },
  decrementTimeRemaining: (state: TSessionState, action: PayloadAction<number>) => {
    state.timeRemainingMs = Math.max(0, state.timeRemainingMs - action.payload);
  },
  setTimeRemainingMs: (state: TSessionState, action: PayloadAction<number>) => {
    state.timeRemainingMs = action.payload;
  },
  clearSessionState: () => initialState,
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers,
});

export const { 
  setGameStartTime, 
  addToGameInactiveTime, 
  setMatchDuration,
  decrementTimeRemaining,
  setTimeRemainingMs,
  clearSessionState 
} = sessionSlice.actions;

export default sessionSlice.reducer;
