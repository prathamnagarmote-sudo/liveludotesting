/// <reference types="nakama-runtime" />

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
  const size = rawSize ? parseInt(rawSize as string) : 4;

  matches.forEach(function(m) {
    const props = m.properties || {};
    const rawAvatarUrl = props.avatarurl || props.avatarUrl || '';
    const rawLevel = props.level || '';

    matchPlayers.push({
      id: m.presence.sessionId,
      userId: m.presence.userId,
      isBot: false,
      name: m.presence.username || ('Player ' + (matchPlayers.length + 1)),
      avatarUrl: rawAvatarUrl,
      level: rawLevel ? parseInt(rawLevel as string) : 1
    });
  });

  let botIndex = 0;
  while (matchPlayers.length < size) {
    const botProfile = REALISTIC_BOTS[botIndex % REALISTIC_BOTS.length];
    botIndex++;
    matchPlayers.push({
      id: 'bot_' + Math.random().toString(36).substring(7),
      isBot: true,
      userId: 'bot_' + Math.random().toString(36).substring(7),
      name: botProfile.name,
      avatarUrl: botProfile.avatarUrl,
      level: botProfile.level
    });
  }

  const colors = ['blue', 'green', 'red', 'yellow'];
  const finalPlayers = matchPlayers.map(function(p, idx) {
    return {
      id: p.id,
      userId: p.userId,
      isBot: p.isBot,
      name: p.name,
      avatarUrl: p.avatarUrl,
      level: p.level,
      color: colors[idx]
    };
  });

  try {
    const matchId = nk.matchCreate('ludo_match', { players: JSON.stringify(finalPlayers) });
    logger.info("Match created: %v", matchId);
    return matchId;
  } catch (e) {
    logger.error("Error creating match: %v", e);
    return;
  }
};

function InitModule(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, initializer: nkruntime.Initializer) {
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
  logger.info("Match registered successfully");

  initializer.registerMatchmakerMatched(matchmakerMatched);
  logger.info("Matchmaker matched callback registered successfully");
}
