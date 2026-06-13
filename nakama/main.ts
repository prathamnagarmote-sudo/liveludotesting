/// <reference types="nakama-runtime" />
import { matchInit, matchJoinAttempt, matchJoin, matchLeave, matchLoop, matchTerminate, matchSignal } from './match';

const REALISTIC_BOTS = [
  { name: 'ApexPhantom', avatarUrl: 'https://i.pravatar.cc/150?img=11', level: 3 },
  { name: 'GamerValkyrie', avatarUrl: 'https://i.pravatar.cc/150?img=12', level: 2 },
  { name: 'NexusVortex', avatarUrl: 'https://i.pravatar.cc/150?img=13', level: 4 },
  { name: 'FrostBite', avatarUrl: 'https://i.pravatar.cc/150?img=14', level: 1 },
  { name: 'SilentDagger', avatarUrl: 'https://i.pravatar.cc/150?img=15', level: 5 }
];

const matchmakerMatched: nkruntime.MatchmakerMatchedFunction = function(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  matches: nkruntime.MatchmakerResult[]
): string | void {
  logger.info("Matchmaker matched! %v", matches);
  
  const matchPlayers: any[] = [];
  const firstMatchProperties = matches[0].properties || {};
  const rawSize = firstMatchProperties.matchsize || firstMatchProperties.matchSize;
  const size = rawSize ? parseInt(rawSize) : 4;

  matches.forEach(m => {
    const props = m.properties || {};
    const rawAvatarUrl = props.avatarurl || props.avatarUrl || '';
    const rawLevel = props.level || '';

    matchPlayers.push({
      id: m.presence.sessionId,
      userId: m.presence.userId,
      isBot: false,
      name: m.presence.username || `Player ${matchPlayers.length + 1}`,
      avatarUrl: rawAvatarUrl,
      level: rawLevel ? parseInt(rawLevel) : 1
    });
  });

  // Inject bots if not full
  let botIndex = 0;
  while (matchPlayers.length < size) {
    const botProfile = REALISTIC_BOTS[botIndex % REALISTIC_BOTS.length];
    botIndex++;
    matchPlayers.push({
      id: `bot_${Math.random().toString(36).substring(7)}`,
      isBot: true,
      userId: `bot_${Math.random().toString(36).substring(7)}`,
      name: botProfile.name,
      avatarUrl: botProfile.avatarUrl,
      level: botProfile.level
    });
  }

  const colors = ['blue', 'green', 'red', 'yellow'];
  const finalPlayers = matchPlayers.map((p, idx) => 
    Object.assign({}, p, { color: colors[idx] })
  );

  try {
    const matchId = nk.matchCreate('ludo_match', { players: JSON.stringify(finalPlayers) });
    logger.info("Match created: %v", matchId);
    return matchId;
  } catch (e) {
    logger.error("Error creating match: %v", e);
    return "";
  }
};

const InitModule: nkruntime.InitModule = function(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, initializer: nkruntime.Initializer) {
  logger.info("Nakama Ludo Server Logic Initialized");
  
  initializer.registerMatch('ludo_match', {
    matchInit,
    matchJoinAttempt,
    matchJoin,
    matchLeave,
    matchLoop,
    matchTerminate,
    matchSignal
  });

  initializer.registerMatchmakerMatched(matchmakerMatched);
};

export default InitModule;
