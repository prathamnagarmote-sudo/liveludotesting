/// <reference types="nakama-runtime" />

function matchInit(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  params: {[key: string]: string}
): {state: nkruntime.MatchState, tickRate: number, label: string} {
  logger.info("Match Init with params: %v", params);
  
  const players = JSON.parse(params.players || '[]');
  
  const state: any = {
    roomId: ctx.matchId,
    players: players,
    currentTurnIndex: 0,
    diceValue: null,
    status: 'playing',
    emptyTicks: 0,
    tickCount: 0,
    botTakeoverTicks: {} as {[userId: string]: number}
  };

  return {
    state,
    tickRate: 10,
    label: ""
  };
}

function matchJoinAttempt(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: nkruntime.MatchState,
  presence: nkruntime.Presence,
  metadata: {[key: string]: any}
): {state: nkruntime.MatchState, accept: boolean, rejectMessage?: string} | null {
  const player = state.players.find((p: any) => p.userId === presence.userId);
  if (player) {
    return { state, accept: true };
  }
  return { state, accept: false, rejectMessage: "Not part of this match" };
}

function matchJoin(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: nkruntime.MatchState,
  presences: nkruntime.Presence[]
): {state: nkruntime.MatchState} | null {
  presences.forEach(presence => {
    const player = state.players.find((p: any) => p.userId === presence.userId);
    if (player) {
      player.id = presence.sessionId;
      player.isBot = false;
      if (player.name.includes(' (Bot)')) {
        player.name = player.name.replace(' (Bot)', '');
      }
      if (state.botTakeoverTicks[presence.userId]) {
        delete state.botTakeoverTicks[presence.userId];
      }
      
      dispatcher.broadcastMessage(1, JSON.stringify({
        roomId: state.roomId,
        players: state.players,
        currentTurnIndex: state.currentTurnIndex,
        diceValue: state.diceValue,
        status: state.status
      }), [presence]);
      
      const currentPlayer = state.players[state.currentTurnIndex];
      dispatcher.broadcastMessage(2, JSON.stringify({
        currentTurnIndex: state.currentTurnIndex,
        currentPlayerId: currentPlayer.id,
        currentPlayerColour: currentPlayer.color
      }), [presence]);
    }
  });

  return { state };
}

function matchLeave(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: nkruntime.MatchState,
  presences: nkruntime.Presence[]
): {state: nkruntime.MatchState} | null {
  presences.forEach(presence => {
    const playerIndex = state.players.findIndex((p: any) => p.userId === presence.userId);
    if (playerIndex !== -1) {
      state.botTakeoverTicks[presence.userId] = tick + 40;
    }
  });
  return { state };
}

function processTurn(state: any, dispatcher: nkruntime.MatchDispatcher) {
  const currentPlayer = state.players[state.currentTurnIndex];
  dispatcher.broadcastMessage(2, JSON.stringify({
    currentTurnIndex: state.currentTurnIndex,
    currentPlayerId: currentPlayer.id,
    currentPlayerColour: currentPlayer.color
  }));
}

function executeRoll(state: any, dispatcher: nkruntime.MatchDispatcher, playerId: string) {
  const roll = Math.floor(Math.random() * 6) + 1;
  state.diceValue = roll;
  const player = state.players.find((p: any) => p.id === playerId);
  dispatcher.broadcastMessage(8, JSON.stringify({
    playerId,
    playerUserId: player ? player.userId : undefined,
    roll
  }));
}

function matchLoop(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: nkruntime.MatchState,
  messages: nkruntime.MatchMessage[]
): {state: nkruntime.MatchState} | null {
  state.tickCount = tick;

  for (const userId in state.botTakeoverTicks) {
    if (tick >= state.botTakeoverTicks[userId]) {
      const playerIndex = state.players.findIndex((p: any) => p.userId === userId);
      if (playerIndex !== -1) {
        const player = state.players[playerIndex];
        
        if (state.players.length === 2) {
          const opponent = state.players.find((p: any) => p.userId !== userId);
          if (opponent) {
            dispatcher.broadcastMessage(10, JSON.stringify({ winnerColor: opponent.color, loserColor: player.color }));
            return null;
          }
        }
        
        player.isBot = true;
        if (!player.name.includes(' (Bot)')) {
          player.name += ' (Bot)';
        }
        
        dispatcher.broadcastMessage(9, JSON.stringify({ 
          colour: player.color,
          playerId: player.id,
          userId: player.userId
        }));
        
        if (state.currentTurnIndex === playerIndex) {
          processTurn(state, dispatcher);
        }
      }
      delete state.botTakeoverTicks[userId];
    }
  }

  messages.forEach(function(message) {
    try {
      const data = JSON.parse(nk.binaryToString(message.data));
      const opCode = message.opCode;
      
      const currentPlayer = state.players[state.currentTurnIndex];

      if (opCode === 3) {
        if (currentPlayer.id !== message.sender.sessionId && !currentPlayer.isBot) {
          return;
        }
        executeRoll(state, dispatcher, currentPlayer.id);
      } 
      else if (opCode === 4) {
        dispatcher.broadcastMessage(5, JSON.stringify({
          colour: currentPlayer.color,
          id: data.tokenId,
          isUnlock: data.isUnlock
        }));
      }
      else if (opCode === 6) {
        const nextIndex = state.players.findIndex((p: any) => p.color === data.nextTurnColour);
        if (nextIndex !== -1) {
          state.currentTurnIndex = nextIndex;
          processTurn(state, dispatcher);
        }
      }
      else if (opCode === 7) {
        const playerIndex = state.players.findIndex((p: any) => p.id === message.sender.sessionId);
        if (playerIndex !== -1) {
          const player = state.players[playerIndex];
          if (state.players.length === 2) {
            const opponent = state.players.find((p: any) => p.id !== message.sender.sessionId);
            if (opponent) {
              dispatcher.broadcastMessage(10, JSON.stringify({ winnerColor: opponent.color, loserColor: player.color }));
              return;
            }
          }
          player.isBot = true;
          if (!player.name.includes(' (Bot)')) {
            player.name += ' (Bot)';
          }
          dispatcher.broadcastMessage(9, JSON.stringify({
            colour: player.color,
            playerId: player.id,
            userId: player.userId
          }));
          if (state.currentTurnIndex === playerIndex) {
            processTurn(state, dispatcher);
          }
        }
      }
    } catch (e) {
      logger.error("Error processing message: %v", e);
    }
  });

  const currentPlayer = state.players[state.currentTurnIndex];
  if (currentPlayer.isBot) {
    if (!state.botRollTick) {
      state.botRollTick = tick + 15;
    } else if (tick >= state.botRollTick) {
      executeRoll(state, dispatcher, currentPlayer.id);
      state.botRollTick = null;
    }
  } else {
    state.botRollTick = null;
  }

  let isMatchEmpty = true;
  for (let i = 0; i < state.players.length; i++) {
    const p = state.players[i];
    if (!p.isBot && !(p.userId in state.botTakeoverTicks)) {
      isMatchEmpty = false;
      break;
    }
  }

  if (isMatchEmpty) {
    state.emptyTicks++;
    if (state.emptyTicks > 100) {
      return null;
    }
  } else {
    state.emptyTicks = 0;
  }

  return { state };
}

function matchTerminate(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: nkruntime.MatchState,
  graceSeconds: number
): {state: nkruntime.MatchState} | null {
  return { state };
}

function matchSignal(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: nkruntime.MatchState,
  data: string
): {state: nkruntime.MatchState, data?: string} | null {
  return { state };
}
