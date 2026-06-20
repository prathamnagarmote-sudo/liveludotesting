// ─── CONSTANTS & PATHS PORTED FROM NAKAMA ─────────────────────────────────────
const GENERAL_TOKEN_PATH = [
  { startCoords: { x: 6, y: 13 }, endCoords: { x: 6, y: 9 } },
  { startCoords: { x: 5, y: 8 }, endCoords: { x: 1, y: 8 } },
  { startCoords: { x: 0, y: 8 }, endCoords: { x: 0, y: 6 } },
  { startCoords: { x: 1, y: 6 }, endCoords: { x: 5, y: 6 } },
  { startCoords: { x: 6, y: 5 }, endCoords: { x: 6, y: 1 } },
  { startCoords: { x: 6, y: 0 }, endCoords: { x: 8, y: 0 } },
  { startCoords: { x: 8, y: 1 }, endCoords: { x: 8, y: 5 } },
  { startCoords: { x: 9, y: 6 }, endCoords: { x: 13, y: 6 } },
  { startCoords: { x: 14, y: 6 }, endCoords: { x: 14, y: 8 } },
  { startCoords: { x: 13, y: 8 }, endCoords: { x: 9, y: 8 } },
  { startCoords: { x: 8, y: 9 }, endCoords: { x: 8, y: 13 } },
  { startCoords: { x: 8, y: 14 }, endCoords: { x: 6, y: 14 } }
];

const TOKEN_HOME_ENTRY_PATH = {
  blue: { startCoords: { x: 7, y: 13 }, endCoords: { x: 7, y: 8 } },
  red: { startCoords: { x: 1, y: 7 }, endCoords: { x: 6, y: 7 } },
  green: { startCoords: { x: 7, y: 1 }, endCoords: { x: 7, y: 6 } },
  yellow: { startCoords: { x: 13, y: 7 }, endCoords: { x: 8, y: 7 } }
};

const TOKEN_START_COORDINATES = {
  blue: { x: 6, y: 13 },
  red: { x: 1, y: 6 },
  green: { x: 8, y: 1 },
  yellow: { x: 13, y: 8 }
};

const TOKEN_SAFE_COORDINATES = [
  { x: 6, y: 13 },
  { x: 1, y: 6 },
  { x: 8, y: 1 },
  { x: 13, y: 8 },
  { x: 8, y: 12 },
  { x: 2, y: 8 },
  { x: 6, y: 2 },
  { x: 12, y: 6 }
];

const TOKEN_LOCKED_COORDINATES = {
  blue: [{ x: 1.45, y: 10.55 }, { x: 3.55, y: 10.55 }, { x: 1.45, y: 12.65 }, { x: 3.55, y: 12.65 }],
  red: [{ x: 1.45, y: 1.5 }, { x: 3.55, y: 1.5 }, { x: 1.45, y: 3.6 }, { x: 3.55, y: 3.6 }],
  green: [{ x: 10.5, y: 1.5 }, { x: 12.6, y: 1.5 }, { x: 10.5, y: 3.6 }, { x: 12.6, y: 3.6 }],
  yellow: [{ x: 10.5, y: 10.55 }, { x: 12.6, y: 10.55 }, { x: 10.5, y: 12.65 }, { x: 12.6, y: 12.65 }]
};

const BOT_WEIGHTS = {
  UNLOCK_BONUS: 50000,
  CAPTURE_BASE: 60000,
  OPPONENT_PROGRESS_MULTIPLIER: 1000,
  HOME_ENTRY_BONUS: 20000,
  SAFE_TOKEN_MOVE_PENALTY: 10000,
  SAFE_POSITION_BONUS: 5000,
  GOAL_COMPLETION_BONUS: 150000,
  BASE_DISTANCE_PENALTY: 150,
  CROWDED_EXIT_BONUS: 10000,
  UNSAFE_STACKING_PENALTY: 65000,
  SAFE_HUNT_CRITICAL_RANGE_BONUS: 20000,
  SAFE_CHASE_BASE_BONUS: 15000,
  RISKY_CHASE_BASE_BONUS: 10000,
  RISKY_HUNT_CRITICAL_RANGE_BONUS: 15000,
  HIGH_INVESTMENT_ESCAPE_PRIORITY: 55000,
  LOW_INVESTMENT_ESCAPE_PRIORITY: 42000,
  ESCAPE_DISTANCE_MULTIPLIER: 5000,
  CRITICAL_ESCAPE_BONUS: 20000,
  SAFE_HAVEN_BONUS: 35000,
  UNSAFE_ESCAPE_PENALTY: 10000,
  SAFE_SPOT_ABANDONMENT_PENALTY: 100000,
  SAFE_SPOT_EXIT_PENALTY: 5000,
  STACK_SPLIT_BONUS: 2000,
  IMMINENT_CAPTURE_PENALTY: 120000,
};

const BOT_LOGIC_CONFIG = {
  UNLOCK_DICE_VALUE: 6,
  TOKENS_PER_PLAYER: 4,
  MAX_CHASE_LOOKAHEAD: 15,
  MAX_THREAT_LOOKAHEAD: 12,
  RISKY_HUNT_RANGE: 8,
  CRITICAL_COMBAT_RANGE: 6,
  HIGH_INVESTMENT_DIST: 25,
  ENDGAME_TOKEN_COUNT: 3,
  SAFETY_TOKEN_COUNT: 2,
  ENDGAME_SCORE_MULTIPLIER: 10,
  SAFETY_SCORE_MULTIPLIER: 2,
  DEFAULT_MULTIPLIER: 1,
  DANGER_ZONE_RANGE: 9,
};

// ─── ES6 COORDINATES HELPERS ──────────────────────────────────────────────────
function areCoordsEqual(c1, c2) {
  return c1 && c2 && c1.x === c2.x && c1.y === c2.y;
}

function findCoordIndex(arr, coord) {
  for (let i = 0; i < arr.length; i++) {
    if (areCoordsEqual(arr[i], coord)) return i;
  }
  return -1;
}

function getIntegersBetween(a, b) {
  if (a === b) return [a];
  let result = [];
  const start = Math.min(a, b) + 1;
  const end = Math.max(a, b);

  for (let i = start; i < end; i++) {
    result.push(i);
  }

  if (a > b) result = result.reverse();

  return [a, ...result, b];
}

function expandTokenPath(tokenPathsArr) {
  const expandedPath = [];
  for (let i = 0; i < tokenPathsArr.length; i++) {
    const path = tokenPathsArr[i];
    const isVertical = path.startCoords.x === path.endCoords.x;
    const staticCoordinateComponent = isVertical ? path.startCoords.x : path.startCoords.y;
    const variableStartCoordinate = isVertical ? path.startCoords.y : path.startCoords.x;
    const variableEndCoordinate = isVertical ? path.endCoords.y : path.endCoords.x;

    const variableCoordinates = getIntegersBetween(variableStartCoordinate, variableEndCoordinate);

    for (let j = 0; j < variableCoordinates.length; j++) {
      if (isVertical)
        expandedPath.push({
          x: staticCoordinateComponent,
          y: variableCoordinates[j]
        });
      else
        expandedPath.push({
          x: variableCoordinates[j],
          y: staticCoordinateComponent
        });
    }
  }

  return expandedPath;
}

const expandedTokenHomeEntryPath = {
  blue: expandTokenPath([TOKEN_HOME_ENTRY_PATH.blue]),
  red: expandTokenPath([TOKEN_HOME_ENTRY_PATH.red]),
  green: expandTokenPath([TOKEN_HOME_ENTRY_PATH.green]),
  yellow: expandTokenPath([TOKEN_HOME_ENTRY_PATH.yellow])
};

function genBlueTokenPath() {
  const expandedGeneralTokenPathForBlue = expandTokenPath(GENERAL_TOKEN_PATH).slice(0, -1);
  return [...expandedGeneralTokenPathForBlue, ...expandedTokenHomeEntryPath.blue];
}

function genRedTokenPath() {
  const path = [...GENERAL_TOKEN_PATH.slice(3), ...GENERAL_TOKEN_PATH.slice(0, 3)];
  const expandedTokenPathForRed = expandTokenPath(path).slice(0, -1);
  return [...expandedTokenPathForRed, ...expandedTokenHomeEntryPath.red];
}

function genGreenTokenPath() {
  const path = [...GENERAL_TOKEN_PATH.slice(6), ...GENERAL_TOKEN_PATH.slice(0, 6)];
  const expandedTokenPathForGreen = expandTokenPath(path).slice(0, -1);
  return [...expandedTokenPathForGreen, ...expandedTokenHomeEntryPath.green];
}

function genYellowTokenPath() {
  const path = [...GENERAL_TOKEN_PATH.slice(9), ...GENERAL_TOKEN_PATH.slice(0, 9)];
  const expandedTokenPathForYellow = expandTokenPath(path).slice(0, -1);
  return [...expandedTokenPathForYellow, ...expandedTokenHomeEntryPath.yellow];
}

const tokenPaths = {
  blue: genBlueTokenPath(),
  red: genRedTokenPath(),
  green: genGreenTokenPath(),
  yellow: genYellowTokenPath()
};

function isCoordInHomeEntryPathForColour(coord, colour) {
  const homePath = expandedTokenHomeEntryPath[colour];
  for (let i = 0; i < homePath.length; i++) {
    if (areCoordsEqual(coord, homePath[i])) return true;
  }
  return false;
}

function isCoordASafeSpot(coord, colour) {
  for (let i = 0; i < TOKEN_SAFE_COORDINATES.length; i++) {
    if (areCoordsEqual(coord, TOKEN_SAFE_COORDINATES[i])) return true;
  }
  if (!colour) return false;
  return isCoordInHomeEntryPathForColour(coord, colour);
}

function getHomeCoordForColour(colour) {
  const path = tokenPaths[colour];
  return path[path.length - 1];
}

function getDistanceInTokenPath(colour, initialCoord, targetCoord) {
  const path = tokenPaths[colour];
  const initialIndex = findCoordIndex(path, initialCoord);
  const targetIndex = findCoordIndex(path, targetCoord);
  if (initialIndex === -1 || targetIndex === -1) return -1;
  return Math.abs(initialIndex - targetIndex);
}

function getAvailableSteps(token) {
  return getDistanceInTokenPath(token.colour, token.coordinates, getHomeCoordForColour(token.colour));
}

function countTokensAtCoord(allTokens, coord, colour) {
  let count = 0;
  for (let i = 0; i < allTokens.length; i++) {
    const t = allTokens[i];
    if (t.colour === colour && !t.isLocked && !t.hasTokenReachedHome && areCoordsEqual(t.coordinates, coord)) {
      count++;
    }
  }
  return count;
}

function isTokenMovable(token, diceNumber, allTokens) {
  if (!diceNumber) return !token.isLocked && !token.hasTokenReachedHome;
  
  if (token.isLocked) {
    return diceNumber === 6;
  }
  
  if (token.hasTokenReachedHome || getAvailableSteps(token) < diceNumber) {
    return false;
  }

  if (allTokens) {
    const path = tokenPaths[token.colour];
    const currentCoordIndex = findCoordIndex(path, token.coordinates);
    if (currentCoordIndex !== -1) {
      for (let i = 1; i <= diceNumber; i++) {
        const stepIndex = currentCoordIndex + i;
        if (stepIndex >= path.length) break;
        const stepCoord = path[stepIndex];

        const opponentColours = [];
        const colours = ['blue', 'red', 'green', 'yellow'];
        for (let c = 0; c < colours.length; c++) {
          if (colours[c] !== token.colour) {
            opponentColours.push(colours[c]);
          }
        }

        for (let o = 0; o < opponentColours.length; o++) {
          const oppColour = opponentColours[o];
          if (!isCoordASafeSpot(stepCoord, oppColour)) {
            const blockCount = countTokensAtCoord(allTokens, stepCoord, oppColour);
            if (blockCount >= 2) {
              return false;
            }
          }
        }
      }
    }
  }

  return true;
}

function computeMoveResult(token, diceNumber, players) {
  const { colour, coordinates, isLocked } = token;
  const path = tokenPaths[colour];
  
  if (isLocked) {
    if (diceNumber === 6) {
      const startCoord = TOKEN_START_COORDINATES[colour];
      return {
        hasTokenReachedHome: false,
        isCaptured: false,
        hasPlayerWon: false,
        path: [startCoord]
      };
    }
    return { hasTokenReachedHome: false, isCaptured: false, hasPlayerWon: false, path: [] };
  }

  const currentCoordIndex = findCoordIndex(path, coordinates);
  if (currentCoordIndex === -1) {
    return { hasTokenReachedHome: false, isCaptured: false, hasPlayerWon: false, path: [] };
  }

  const finalIndex = Math.min(currentCoordIndex + diceNumber, path.length - 1);
  const movePath = [];
  for (let i = currentCoordIndex + 1; i <= finalIndex; i++) {
    movePath.push(path[i]);
  }

  const lastTokenCoord = path[finalIndex];
  const hasTokenReachedHome = areCoordsEqual(lastTokenCoord, path[path.length - 1]);
  
  let player = null;
  for (let p = 0; p < players.length; p++) {
    if (players[p].colour === colour) {
      player = players[p];
      break;
    }
  }

  let homeCount = 0;
  if (player && player.tokens) {
    for (let t = 0; t < player.tokens.length; t++) {
      if (player.tokens[t].hasTokenReachedHome) {
        homeCount++;
      }
    }
  }

  const hasPlayerWon = hasTokenReachedHome && !token.hasTokenReachedHome && homeCount === 3;

  // Capture check
  let isCaptured = false;
  const isSafe = isCoordASafeSpot(lastTokenCoord);
  if (!isSafe) {
    // Find if there is any opponent token on this cell
    for (let p = 0; p < players.length; p++) {
      const opp = players[p];
      if (opp.colour !== colour && opp.tokens) {
        for (let t = 0; t < opp.tokens.length; t++) {
          const oppT = opp.tokens[t];
          if (!oppT.isLocked && !oppT.hasTokenReachedHome && areCoordsEqual(oppT.coordinates, lastTokenCoord)) {
            isCaptured = true;
            break;
          }
        }
      }
      if (isCaptured) break;
    }
  }

  return { hasTokenReachedHome, isCaptured, hasPlayerWon, path: movePath };
}

function genInitialTokens(colour) {
  const lockedCoords = TOKEN_LOCKED_COORDINATES[colour];
  const tokens = [];
  for (let i = 0; i < 4; i++) {
    tokens.push({
      id: i,
      colour: colour,
      coordinates: { x: lockedCoords[i].x, y: lockedCoords[i].y },
      initialCoords: { x: lockedCoords[i].x, y: lockedCoords[i].y },
      isLocked: true,
      isActive: false,
      hasTokenReachedHome: false
    });
  }
  return tokens;
}

// ─── BOT HEURISTICS ──────────────────────────────────────────────────────────
function areTokensOnOverlappingPaths(token1, token2) {
  const coord1 = token1.coordinates;
  const coord2 = token2.coordinates;

  const tokenPath1 = tokenPaths[token1.colour];
  const tokenPath2 = tokenPaths[token2.colour];

  const tokenPath1CoordIndex = findCoordIndex(tokenPath1, coord1);
  const tokenPath2CoordIndex = findCoordIndex(tokenPath2, coord2);

  if (tokenPath1CoordIndex === -1 || tokenPath2CoordIndex === -1) return false;

  for (let i = tokenPath1CoordIndex; i < tokenPath1.length; i++) {
    if (areCoordsEqual(tokenPath1[i], coord2)) return true;
  }
  for (let i = tokenPath2CoordIndex; i < tokenPath2.length; i++) {
    if (areCoordsEqual(tokenPath2[i], coord1)) return true;
  }

  return false;
}

function getDistanceBetweenTokens(token1, token2) {
  const coord1 = token1.coordinates;
  const coord2 = token2.coordinates;
  if (!areTokensOnOverlappingPaths(token1, token2)) return -1;
  
  const expandedGeneralTokenPath = expandTokenPath(GENERAL_TOKEN_PATH).slice(0, -1);
  const index1 = findCoordIndex(expandedGeneralTokenPath, coord1);
  const index2 = findCoordIndex(expandedGeneralTokenPath, coord2);
  if (index1 === -1 || index2 === -1) return -1;
  const pathLength = expandedGeneralTokenPath.length;
  const forwardDistance = (index2 - index1 + pathLength) % pathLength;
  const backwardDistance = (index1 - index2 + pathLength) % pathLength;

  return Math.min(forwardDistance, backwardDistance);
}

function isTokenAhead(token1, token2) {
  if (areCoordsEqual(token1.coordinates, token2.coordinates)) return false;
  if (!areTokensOnOverlappingPaths(token1, token2)) return false;

  const token1Path = tokenPaths[token1.colour];
  const token2Path = tokenPaths[token2.colour];
  const token2CoordIndex = findCoordIndex(token2Path, token2.coordinates);
  const token1CoordIndex = findCoordIndex(token1Path, token1.coordinates);
  const minDist = getDistanceBetweenTokens(token1, token2);

  if (token2CoordIndex === -1 || token1CoordIndex === -1) return false;

  for (let i = token2CoordIndex; i < token2Path.length; i++) {
    if (i - token2CoordIndex > minDist) break;
    if (areCoordsEqual(token2Path[i], token1.coordinates)) return true;
  }
  for (let i = token1CoordIndex; i < token1Path.length; i++) {
    if (i - token1CoordIndex > minDist) break;
    if (areCoordsEqual(token1Path[i], token2.coordinates)) return false;
  }
  return false;
}

function getFinalCoord(token, diceNumber) {
  const tokenPath = tokenPaths[token.colour];
  const currentCoordIndex = findCoordIndex(tokenPath, token.coordinates);
  if (currentCoordIndex === -1) return null;
  const finalIndex = currentCoordIndex + diceNumber;
  if (finalIndex >= tokenPath.length) return null;
  return tokenPath[finalIndex];
}

function selectBestBotToken(player, roll, allTokens) {
  const botTokens = [];
  for (let i = 0; i < allTokens.length; i++) {
    if (allTokens[i].colour === player.colour) {
      botTokens.push(allTokens[i]);
    }
  }

  const movableBotTokens = [];
  for (let i = 0; i < botTokens.length; i++) {
    if (isTokenMovable(botTokens[i], roll, allTokens)) {
      movableBotTokens.push(botTokens[i]);
    }
  }
  if (movableBotTokens.length === 0) return null;

  const botTokenHomeCoord = getHomeCoordForColour(player.colour);
  const botTokenStartCoord = tokenPaths[player.colour][0];
  
  const expandedGeneralTokenPath = expandTokenPath(GENERAL_TOKEN_PATH).slice(0, -1);
  const activeOpponentTokens = [];
  for (let i = 0; i < allTokens.length; i++) {
    const t = allTokens[i];
    if (t.colour !== player.colour && isTokenMovable(t) && findCoordIndex(expandedGeneralTokenPath, t.coordinates) !== -1) {
      activeOpponentTokens.push(t);
    }
  }

  const tokenScores = [];

  for (let idx = 0; idx < botTokens.length; idx++) {
    const token = botTokens[idx];
    let feasibilityScore = 0;
    let finalCoord = null;

    const isUnlockable = token.isLocked && !token.hasTokenReachedHome && roll === BOT_LOGIC_CONFIG.UNLOCK_DICE_VALUE;
    if (isUnlockable) {
      feasibilityScore += BOT_WEIGHTS.UNLOCK_BONUS;
      finalCoord = tokenPaths[token.colour][0];
    } else {
      finalCoord = getFinalCoord(token, roll);
      if (!isTokenMovable(token, roll, allTokens)) {
        tokenScores.push({ token, feasibilityScore: -Infinity });
        continue;
      }
    }

    if (!finalCoord) {
      tokenScores.push({ token, feasibilityScore: -Infinity });
      continue;
    }

    const isFinalCoordSafe = isCoordASafeSpot(finalCoord, token.colour);
    const isCurrentCoordSafe = isCoordASafeSpot(token.coordinates, token.colour);
    
    let botTokensAtHome = 0;
    for (let i = 0; i < botTokens.length; i++) {
      if (botTokens[i].hasTokenReachedHome) botTokensAtHome++;
    }

    const endgameMultiplier = botTokensAtHome >= BOT_LOGIC_CONFIG.ENDGAME_TOKEN_COUNT ? BOT_LOGIC_CONFIG.ENDGAME_SCORE_MULTIPLIER : BOT_LOGIC_CONFIG.DEFAULT_MULTIPLIER;
    const safetyMultiplier = botTokensAtHome > BOT_LOGIC_CONFIG.SAFETY_TOKEN_COUNT ? BOT_LOGIC_CONFIG.SAFETY_SCORE_MULTIPLIER : BOT_LOGIC_CONFIG.DEFAULT_MULTIPLIER;

    // Capturable check
    for (let i = 0; i < allTokens.length; i++) {
      const t = allTokens[i];
      if (t.colour !== player.colour && areCoordsEqual(finalCoord, t.coordinates) && !isCoordASafeSpot(t.coordinates, t.colour)) {
        const distToEnd = getDistanceInTokenPath(t.colour, t.coordinates, getHomeCoordForColour(t.colour));
        const distTraveled = tokenPaths[t.colour].length - distToEnd;
        feasibilityScore += BOT_WEIGHTS.CAPTURE_BASE + distTraveled * BOT_WEIGHTS.OPPONENT_PROGRESS_MULTIPLIER;
      }
    }

    if (isFinalCoordSafe) feasibilityScore += BOT_WEIGHTS.SAFE_POSITION_BONUS;

    const isTokenAlreadyInHomeEntryPath = isCoordInHomeEntryPathForColour(token.coordinates, token.colour);
    const willTokenBeInHomeEntryPath = isCoordInHomeEntryPathForColour(finalCoord, token.colour);

    if (willTokenBeInHomeEntryPath && !isTokenAlreadyInHomeEntryPath) {
      feasibilityScore += BOT_WEIGHTS.HOME_ENTRY_BONUS;
    }

    if (isTokenAlreadyInHomeEntryPath) {
      feasibilityScore -= BOT_WEIGHTS.SAFE_TOKEN_MOVE_PENALTY;
    }

    if (token.isLocked) {
      tokenScores.push({ token, feasibilityScore });
      continue;
    }

    const distFromHome = getDistanceInTokenPath(token.colour, token.coordinates, botTokenHomeCoord);
    const distFromStart = getDistanceInTokenPath(token.colour, token.coordinates, botTokenStartCoord);
    
    let botTokensInCurrentCoord = 0;
    for (let i = 0; i < movableBotTokens.length; i++) {
      if (areCoordsEqual(movableBotTokens[i].coordinates, token.coordinates)) {
        botTokensInCurrentCoord++;
      }
    }

    const canTokenReachHome = distFromHome === roll;
    if (canTokenReachHome) feasibilityScore += BOT_WEIGHTS.GOAL_COMPLETION_BONUS;

    feasibilityScore -= distFromHome * BOT_WEIGHTS.BASE_DISTANCE_PENALTY * endgameMultiplier;

    let oppTokensAtCurrentCoord = 0;
    for (let i = 0; i < activeOpponentTokens.length; i++) {
      if (areCoordsEqual(activeOpponentTokens[i].coordinates, token.coordinates)) {
        oppTokensAtCurrentCoord++;
      }
    }

    const isCrowdedSafeSpotAndRolled6 = roll === BOT_LOGIC_CONFIG.UNLOCK_DICE_VALUE && isCurrentCoordSafe && oppTokensAtCurrentCoord > 0;
    if (isCrowdedSafeSpotAndRolled6) feasibilityScore += BOT_WEIGHTS.CROWDED_EXIT_BONUS;

    let botTokensInFinalCoord = 0;
    for (let i = 0; i < movableBotTokens.length; i++) {
      if (areCoordsEqual(movableBotTokens[i].coordinates, finalCoord)) {
        botTokensInFinalCoord++;
      }
    }
    if (botTokensInFinalCoord > 0 && !isFinalCoordSafe) {
      feasibilityScore -= BOT_WEIGHTS.UNSAFE_STACKING_PENALTY;
    }

    let isSafeLaunchHunter = false;
    let hasRefundedDistance = false;

    for (let i = 0; i < activeOpponentTokens.length; i++) {
      const oppToken = activeOpponentTokens[i];
      const isBotTokenAheadOfOppTokenInFuture = isTokenAhead({ ...token, coordinates: finalCoord }, oppToken);
      const futureDist = getDistanceBetweenTokens({ ...token, coordinates: finalCoord }, oppToken);
      const isBotTokenAheadOfOppTokenCurrently = isTokenAhead(token, oppToken);
      const currentDist = getDistanceBetweenTokens(token, oppToken);

      if (currentDist >= 1 && currentDist <= BOT_LOGIC_CONFIG.MAX_CHASE_LOOKAHEAD && !isBotTokenAheadOfOppTokenCurrently) {
        let isThreatenedFromBehind = false;
        for (let j = 0; j < activeOpponentTokens.length; j++) {
          const t = activeOpponentTokens[j];
          const dist = getDistanceBetweenTokens(token, t);
          const isOpponentBehind = isTokenAhead(token, t);
          if (isOpponentBehind && dist >= 1 && dist <= BOT_LOGIC_CONFIG.MAX_THREAT_LOOKAHEAD) {
            isThreatenedFromBehind = true;
            break;
          }
        }

        if (!isThreatenedFromBehind || isFinalCoordSafe) {
          if (currentDist <= BOT_LOGIC_CONFIG.CRITICAL_COMBAT_RANGE) {
            feasibilityScore += BOT_WEIGHTS.SAFE_HUNT_CRITICAL_RANGE_BONUS;
          }
          feasibilityScore += BOT_WEIGHTS.SAFE_CHASE_BASE_BONUS;
          if (!isThreatenedFromBehind) isSafeLaunchHunter = true;
        } else if (currentDist <= BOT_LOGIC_CONFIG.RISKY_HUNT_RANGE) {
          feasibilityScore += BOT_WEIGHTS.RISKY_CHASE_BASE_BONUS;
          if (currentDist <= BOT_LOGIC_CONFIG.CRITICAL_COMBAT_RANGE) {
            feasibilityScore += BOT_WEIGHTS.RISKY_HUNT_CRITICAL_RANGE_BONUS;
          }
        }
      }

      if (currentDist >= 1 && currentDist <= BOT_LOGIC_CONFIG.MAX_THREAT_LOOKAHEAD && isBotTokenAheadOfOppTokenCurrently && !isCurrentCoordSafe) {
        const distFromStartCurrent = tokenPaths[token.colour].length - distFromHome;
        if (distFromStartCurrent > BOT_LOGIC_CONFIG.HIGH_INVESTMENT_DIST) {
          feasibilityScore += BOT_WEIGHTS.HIGH_INVESTMENT_ESCAPE_PRIORITY;
        } else {
          feasibilityScore += BOT_WEIGHTS.LOW_INVESTMENT_ESCAPE_PRIORITY;
        }
      }

      if (futureDist >= 1 && futureDist <= BOT_LOGIC_CONFIG.MAX_THREAT_LOOKAHEAD && isBotTokenAheadOfOppTokenInFuture) {
        let threatsCount = 0;
        for (let j = 0; j < activeOpponentTokens.length; j++) {
          const t = activeOpponentTokens[j];
          const dist = getDistanceBetweenTokens({ ...token, coordinates: finalCoord }, t);
          const isOpponentBehind = isTokenAhead({ ...token, coordinates: finalCoord }, t);
          if (isOpponentBehind && dist >= 1 && dist <= BOT_LOGIC_CONFIG.DANGER_ZONE_RANGE) {
            threatsCount++;
          }
        }

        const isGoingIntoDanger = isBotTokenAheadOfOppTokenInFuture && !isBotTokenAheadOfOppTokenCurrently && !isFinalCoordSafe && threatsCount > 0;
        if (isGoingIntoDanger) {
          feasibilityScore -= BOT_WEIGHTS.IMMINENT_CAPTURE_PENALTY * threatsCount * Math.max(1, distFromStart / 2);
        }

        const isEscaping = isBotTokenAheadOfOppTokenCurrently && futureDist > currentDist && !isCurrentCoordSafe;
        if (isEscaping || (isFinalCoordSafe && isBotTokenAheadOfOppTokenCurrently && !isCurrentCoordSafe)) {
          if (isEscaping) {
            feasibilityScore += (futureDist - currentDist) * BOT_WEIGHTS.ESCAPE_DISTANCE_MULTIPLIER;
          }
          if (currentDist <= BOT_LOGIC_CONFIG.CRITICAL_COMBAT_RANGE) {
            if (isEscaping) feasibilityScore += BOT_WEIGHTS.CRITICAL_ESCAPE_BONUS;
            if (!hasRefundedDistance) {
              feasibilityScore += distFromHome * BOT_WEIGHTS.BASE_DISTANCE_PENALTY * endgameMultiplier;
              hasRefundedDistance = true;
            }
          }
          if (isFinalCoordSafe) feasibilityScore += BOT_WEIGHTS.SAFE_HAVEN_BONUS;
          else if (isEscaping) feasibilityScore -= BOT_WEIGHTS.UNSAFE_ESCAPE_PENALTY;
        } else {
          const isProtected = isFinalCoordSafe || willTokenBeInHomeEntryPath;
          if (!isProtected && isCurrentCoordSafe && !isGoingIntoDanger) {
            feasibilityScore -= BOT_WEIGHTS.SAFE_SPOT_ABANDONMENT_PENALTY * safetyMultiplier;
          }
        }
      }
    }

    if (isCurrentCoordSafe && !isSafeLaunchHunter && !isCrowdedSafeSpotAndRolled6) {
      feasibilityScore -= BOT_WEIGHTS.SAFE_SPOT_EXIT_PENALTY;
    } else if (botTokensInCurrentCoord > 1) {
      feasibilityScore += botTokensInCurrentCoord * BOT_WEIGHTS.STACK_SPLIT_BONUS;
    }

    tokenScores.push({ token, feasibilityScore });
  }

  let maxScore = -Infinity;
  for (let i = 0; i < tokenScores.length; i++) {
    if (tokenScores[i].feasibilityScore > maxScore) {
      maxScore = tokenScores[i].feasibilityScore;
    }
  }

  const bestTokens = [];
  for (let i = 0; i < tokenScores.length; i++) {
    if (tokenScores[i].feasibilityScore === maxScore) {
      bestTokens.push(tokenScores[i].token);
    }
  }

  if (bestTokens.length === 0) return null;
  const randIndex = Math.floor(Math.random() * bestTokens.length);
  return bestTokens[randIndex];
}

// ─── GAME ENGINE CLASS ────────────────────────────────────────────────────────
export class GameEngine {
  constructor() {
    this.matches = new Map(); // roomId -> matchState
  }

  getAllTokens(state) {
    const all = [];
    state.players.forEach(p => {
      if (p.tokens) all.push(...p.tokens);
    });
    return all;
  }

  broadcast(matchId, messageObj) {
    const state = this.matches.get(matchId);
    if (!state) return;

    state.sequenceNumber++;
    const payload = {
      ...messageObj,
      sequenceNumber: state.sequenceNumber,
      timestamp: Date.now()
    };

    const serialized = JSON.stringify(payload);
    state.clients.forEach(ws => {
      if (ws.readyState === 1) { // OPEN
        ws.send(serialized);
      }
    });
  }

  handleMessage(ws, matchId, message) {
    const startTime = Date.now();
    const { type } = message;

    if (type === 'join_match') {
      this.handleJoinMatch(ws, matchId, message);
    } else if (type === 'roll_dice') {
      this.handleRollDice(ws, matchId, message);
    } else if (type === 'move_token') {
      this.handleMoveToken(ws, matchId, message);
    } else if (type === 'quit_game') {
      this.handleQuitGame(ws, matchId, message);
    } else if (type === 'ping') {
      ws.send(JSON.stringify({ 
        type: 'pong', 
        clientTimestamp: message.clientTimestamp, 
        timestamp: Date.now() 
      }));
    } else if (type === 'request_state_sync') {
      this.handleStateSyncRequest(ws, matchId, message);
    } else if (type === 'request_rematch') {
      this.handleRequestRematch(ws, matchId, message);
    } else if (type === 'accept_rematch') {
      this.handleAcceptRematch(ws, matchId, message);
    } else if (type === 'decline_rematch') {
      this.handleDeclineRematch(ws, matchId, message);
    }

    const duration = Date.now() - startTime;
    if (type !== 'ping') {
      console.log(`[LATENCY] Server processing time for "${type}": ${duration}ms`);
    }
  }

  handleJoinMatch(ws, matchId, message) {
    const { playerId, name, avatarUrl, colour, allPlayers } = message;

    let state = this.matches.get(matchId);

    if (!state) {
      console.log(`[GameEngine] Creating new match: ${matchId}`);
      const initialPlayers = allPlayers.map(p => ({
        name: p.name,
        colour: p.color || p.colour,
        isBot: !!p.isBot,
        numberOfConsecutiveSix: 0,
        tokens: genInitialTokens(p.color || p.colour),
        id: p.id,
        userId: p.userId || p.id,
        missedTurns: 0,
        hasQuit: false
      }));

      const playerSequence = initialPlayers.map(p => p.colour);

      state = {
        roomId: matchId,
        players: initialPlayers,
        playerSequence: playerSequence,
        currentTurnIndex: 0,
        diceNumber: -1,
        hasRolled: false,
        consecutiveSixes: 0,
        turnDeadlineMs: 0,
        status: 'waiting',
        sequenceNumber: 0,
        clients: new Map(),
        botRollTimer: null,
        botMoveTimer: null,
        turnTimeoutTimer: null,
        noMovableTokensTimer: null,
        keepTurn: matchId === 'c7ec1fcd-8efe-4731-ae0e-bbd98f7a51d9'
      };

      this.matches.set(matchId, state);
    }

    // Map this client WebSocket to their color
    state.clients.set(colour, ws);
    console.log(`[GameEngine] Player ${name} (${colour}) joined match: ${matchId}`);

    if (state.status !== 'waiting') {
      console.log(`[GameEngine] Reconnecting player ${colour} to running match.`);
      
      if (state.reconnectTimers && state.reconnectTimers[colour]) {
        clearTimeout(state.reconnectTimers[colour]);
        delete state.reconnectTimers[colour];
      }

      // Update connection ID for the player
      const playerObj = state.players.find(p => p.colour === colour);
      if (playerObj) {
        playerObj.id = playerId;
        playerObj.isBot = false;
        if (playerObj.name.includes(' (Bot)')) {
          playerObj.name = playerObj.name.replace(' (Bot)', '');
        }
        playerObj.missedTurns = 0;
      }

      // Send state sync only to the reconnected client
      state.sequenceNumber++;
      ws.send(JSON.stringify({
        type: 'state_sync',
        sequenceNumber: state.sequenceNumber,
        timestamp: Date.now(),
        roomId: state.roomId,
        players: state.players,
        playerSequence: state.playerSequence,
        currentTurnColour: state.playerSequence[state.currentTurnIndex],
        diceNumber: state.diceNumber,
        hasRolled: state.hasRolled,
        consecutiveSixes: state.consecutiveSixes,
        turnDeadlineMs: state.turnDeadlineMs,
        status: state.status
      }));

      // Broadcast update to other players about reconnect
      this.broadcast(matchId, {
        type: 'state_sync',
        roomId: state.roomId,
        players: state.players,
        playerSequence: state.playerSequence,
        currentTurnColour: state.playerSequence[state.currentTurnIndex],
        diceNumber: state.diceNumber,
        hasRolled: state.hasRolled,
        consecutiveSixes: state.consecutiveSixes,
        turnDeadlineMs: state.turnDeadlineMs,
        status: state.status
      });
      return;
    }

    // Check if all human players have connected
    const totalHumanPlayers = state.players.filter(p => !p.isBot);
    const connectedHumanPlayers = state.players.filter(p => !p.isBot && state.clients.has(p.colour));

    if (connectedHumanPlayers.length === totalHumanPlayers.length) {
      console.log(`[GameEngine] All human players connected. Starting match: ${matchId}`);
      state.status = 'playing';
      state.turnDeadlineMs = Date.now() + 15000;
      
      this.broadcast(matchId, {
        type: 'state_sync',
        roomId: state.roomId,
        players: state.players,
        playerSequence: state.playerSequence,
        currentTurnColour: state.playerSequence[state.currentTurnIndex],
        diceNumber: state.diceNumber,
        hasRolled: state.hasRolled,
        consecutiveSixes: state.consecutiveSixes,
        turnDeadlineMs: state.turnDeadlineMs,
        status: state.status
      });

      this.startTurnTimeoutTimer(matchId);
      this.processBotTurnIfNeeded(matchId);
    }
  }

  handleStateSyncRequest(ws, matchId, message) {
    const state = this.matches.get(matchId);
    if (!state) return;

    state.sequenceNumber++;
    ws.send(JSON.stringify({
      type: 'state_sync',
      sequenceNumber: state.sequenceNumber,
      timestamp: Date.now(),
      roomId: state.roomId,
      players: state.players,
      playerSequence: state.playerSequence,
      currentTurnColour: state.playerSequence[state.currentTurnIndex],
      diceNumber: state.diceNumber,
      hasRolled: state.hasRolled,
      consecutiveSixes: state.consecutiveSixes,
      turnDeadlineMs: state.turnDeadlineMs,
      status: state.status
    }));
  }

  handleRollDice(ws, matchId, message) {
    const t2 = Date.now();
    const state = this.matches.get(matchId);
    if (!state || state.status !== 'playing') return;

    const currentColour = state.playerSequence[state.currentTurnIndex];
    const clientSocket = state.clients.get(currentColour);

    if (clientSocket !== ws) {
      ws.send(JSON.stringify({ type: 'action_rejected', reason: 'Not your turn to roll' }));
      return;
    }

    if (state.hasRolled) {
      ws.send(JSON.stringify({ type: 'action_rejected', reason: 'Already rolled' }));
      return;
    }

    // Force number check for testing
    let forcedRoll = null;
    if (typeof message.forcedRoll === 'number' && message.forcedRoll >= 1 && message.forcedRoll <= 6) {
      forcedRoll = message.forcedRoll;
    }

    const clientT0 = message.clientT0 || null;
    const clientT1 = message.clientT1 || null;
    const senderDrift = message.senderDrift || 0;

    this.executeRoll(matchId, currentColour, forcedRoll, t2, clientT0, clientT1, senderDrift);
  }

  executeRoll(matchId, colour, forcedNumber = null, t2 = null, clientT0 = null, clientT1 = null, senderDrift = 0) {
    const state = this.matches.get(matchId);
    if (!state || state.status !== 'playing') return;

    clearTimeout(state.turnTimeoutTimer);

    const roll = forcedNumber !== null ? forcedNumber : Math.floor(Math.random() * 6) + 1;
    state.diceNumber = roll;
    state.hasRolled = true;

    if (roll === 6) {
      state.consecutiveSixes++;
    } else {
      state.consecutiveSixes = 0;
    }

    const player = state.players.find(p => p.colour === colour);
    if (player) {
      player.numberOfConsecutiveSix = state.consecutiveSixes;
    }

    const allTokens = this.getAllTokens(state);
    let hasMovableTokens = false;

    if (player && player.tokens) {
      if (state.consecutiveSixes === 3) {
        hasMovableTokens = false;
      } else {
        for (let t = 0; t < player.tokens.length; t++) {
          if (isTokenMovable(player.tokens[t], roll, allTokens)) {
            hasMovableTokens = true;
            break;
          }
        }
      }
    }

    // Reset consecutive sixes count on player if it hits 3
    if (state.consecutiveSixes === 3) {
      state.consecutiveSixes = 0;
      if (player) player.numberOfConsecutiveSix = 0;
    }

    const t3 = Date.now();
    this.broadcast(matchId, {
      type: 'dice_result',
      colour: colour,
      roll: roll,
      hasMovableTokens: hasMovableTokens,
      clientT0: clientT0,
      clientT1: clientT1,
      senderDrift: senderDrift,
      serverT2: t2,
      serverT3: t3
    });

    if (!hasMovableTokens) {
      // Wait for rolling animation (500ms) then pass turn
      state.noMovableTokensTimer = setTimeout(() => {
        state.noMovableTokensTimer = null;
        this.nextTurn(matchId);
      }, 500);
    } else {
      // 15 seconds to move token
      state.turnDeadlineMs = Date.now() + 15000;
      this.startTurnTimeoutTimer(matchId);
    }
  }

  handleMoveToken(ws, matchId, message) {
    const state = this.matches.get(matchId);
    if (!state || state.status !== 'playing') return;

    const currentColour = state.playerSequence[state.currentTurnIndex];
    const clientSocket = state.clients.get(currentColour);

    if (clientSocket !== ws) {
      ws.send(JSON.stringify({ type: 'action_rejected', reason: 'Not your turn to move' }));
      return;
    }

    if (!state.hasRolled) {
      ws.send(JSON.stringify({ type: 'action_rejected', reason: 'Roll dice first' }));
      return;
    }

    const tokenId = message.tokenId;
    const player = state.players.find(p => p.colour === currentColour);
    if (!player) return;

    const token = player.tokens.find(t => t.id === tokenId);
    if (!token) {
      ws.send(JSON.stringify({ type: 'action_rejected', reason: 'Invalid token' }));
      return;
    }

    const allTokens = this.getAllTokens(state);
    if (!isTokenMovable(token, state.diceNumber, allTokens)) {
      ws.send(JSON.stringify({ type: 'action_rejected', reason: 'Token cannot move' }));
      return;
    }

    this.executeMove(matchId, currentColour, tokenId);
  }

  executeMove(matchId, colour, tokenId) {
    const state = this.matches.get(matchId);
    if (!state || state.status !== 'playing') return;

    clearTimeout(state.turnTimeoutTimer);

    const player = state.players.find(p => p.colour === colour);
    if (!player) return;

    const token = player.tokens.find(t => t.id === tokenId);
    if (!token) return;

    const roll = state.diceNumber;
    const wasLocked = token.isLocked;
    const allTokens = this.getAllTokens(state);

    const { hasTokenReachedHome, isCaptured, hasPlayerWon, path } = computeMoveResult(token, roll, state.players);

    // Update token coordinates authoritatively
    if (token.isLocked && roll === 6) {
      token.isLocked = false;
      token.coordinates = TOKEN_START_COORDINATES[colour];
    } else {
      token.coordinates = path[path.length - 1];
    }

    if (hasTokenReachedHome) {
      token.hasTokenReachedHome = true;
      token.isLocked = true;
      token.coordinates = getHomeCoordForColour(colour);
    }

    let capturedTokenColour;
    let capturedTokenId;

    if (isCaptured) {
      const dest = token.coordinates;
      for (let k = 0; k < allTokens.length; k++) {
        const oppToken = allTokens[k];
        if (oppToken.colour !== colour && !oppToken.isLocked && !oppToken.hasTokenReachedHome && areCoordsEqual(oppToken.coordinates, dest)) {
          oppToken.isLocked = true;
          oppToken.coordinates = { ...oppToken.initialCoords };
          capturedTokenColour = oppToken.colour;
          capturedTokenId = oppToken.id;
          break;
        }
      }
    }

    // Reset missed turns since they made a valid move
    player.missedTurns = 0;

    this.broadcast(matchId, {
      type: 'token_moved',
      colour: colour,
      id: tokenId,
      isUnlock: wasLocked && roll === 6 && path.length === 1,
      path: path,
      hasTokenReachedHome: hasTokenReachedHome,
      isCaptured: isCaptured,
      hasPlayerWon: hasPlayerWon,
      capturedTokenColour: capturedTokenColour,
      capturedTokenId: capturedTokenId
    });

    if (hasPlayerWon) {
      state.status = 'ended';
      this.broadcast(matchId, {
        type: 'match_end',
        winnerColour: colour
      });
      state.cleanupTimer = setTimeout(() => {
        this.cleanupMatch(matchId);
      }, 20000);
      return;
    }

    // Calculate animation durations to delay turn change
    const isUnlock = wasLocked && roll === 6 && path.length === 1;
    const forwardDuration = isUnlock ? 300 : path.length * 300;
    
    let captureDuration = 0;
    if (isCaptured && capturedTokenColour && typeof capturedTokenId === 'number') {
      const dest = token.coordinates;
      const oppPath = tokenPaths[capturedTokenColour];
      const oppIndex = findCoordIndex(oppPath, dest);
      if (oppIndex !== -1) {
        captureDuration = oppIndex * 100;
      }
    }

    const totalAnimationTime = forwardDuration + captureDuration + 50; // 50ms buffer

    // Post-move delay
    setTimeout(() => {
      this.resolvePostMoveTurnHandoff(matchId, colour, roll, hasTokenReachedHome, isCaptured);
    }, totalAnimationTime);
  }

  resolvePostMoveTurnHandoff(matchId, colour, diceNumber, hasTokenReachedHome, isCaptured) {
    const state = this.matches.get(matchId);
    if (!state || state.status !== 'playing') return;

    // Consecutive 6s reset check
    const getsAnotherTurn = (diceNumber === 6 && state.consecutiveSixes > 0 && state.consecutiveSixes < 3) || isCaptured || hasTokenReachedHome;

    if (getsAnotherTurn) {
      state.diceNumber = -1;
      state.hasRolled = false;
      state.turnDeadlineMs = Date.now() + 15000;
      
      this.broadcast(matchId, {
        type: 'turn_changed',
        nextTurnColour: colour,
        deadlineMs: state.turnDeadlineMs
      });

      this.startTurnTimeoutTimer(matchId);
      this.processBotTurnIfNeeded(matchId);
    } else {
      state.consecutiveSixes = 0;
      const player = state.players.find(p => p.colour === colour);
      if (player) player.numberOfConsecutiveSix = 0;
      this.nextTurn(matchId);
    }
  }

  nextTurn(matchId) {
    const state = this.matches.get(matchId);
    if (!state || state.status !== 'playing') return;

    if (!state.keepTurn) {
      state.currentTurnIndex = (state.currentTurnIndex + 1) % state.playerSequence.length;
    }
    const nextColour = state.playerSequence[state.currentTurnIndex];

    state.diceNumber = -1;
    state.hasRolled = false;
    state.consecutiveSixes = 0;
    state.turnDeadlineMs = Date.now() + 15000;

    this.broadcast(matchId, {
      type: 'turn_changed',
      nextTurnColour: nextColour,
      deadlineMs: state.turnDeadlineMs
    });

    this.startTurnTimeoutTimer(matchId);
    this.processBotTurnIfNeeded(matchId);
  }

  handleTurnTimeout(matchId) {
    const state = this.matches.get(matchId);
    if (!state || state.status !== 'playing') return;

    const currentColour = state.playerSequence[state.currentTurnIndex];
    const player = state.players.find(p => p.colour === currentColour);
    if (!player) return;

    player.missedTurns++;
    console.log(`[GameEngine] Player ${player.name} missed turn ${player.missedTurns}`);

    if (player.missedTurns >= 3) {
      console.log(`[GameEngine] Player ${player.name} missed 3 turns. Converting to bot.`);
      player.isBot = true;
      if (!player.name.includes(' (Bot)')) {
        player.name += ' (Bot)';
      }
      
      this.broadcast(matchId, {
        type: 'state_sync',
        roomId: state.roomId,
        players: state.players,
        playerSequence: state.playerSequence,
        currentTurnColour: state.playerSequence[state.currentTurnIndex],
        diceNumber: state.diceNumber,
        hasRolled: state.hasRolled,
        consecutiveSixes: state.consecutiveSixes,
        turnDeadlineMs: state.turnDeadlineMs,
        status: state.status
      });
    }

    // Force automatic turn execution
    const allTokens = this.getAllTokens(state);

    if (!state.hasRolled) {
      this.executeRoll(matchId, currentColour);
    }

    if (state.noMovableTokensTimer === null) {
      const bestToken = selectBestBotToken(player, state.diceNumber, allTokens);
      if (bestToken) {
        this.executeMove(matchId, currentColour, bestToken.id);
      } else {
        this.nextTurn(matchId);
      }
    }
  }

  startTurnTimeoutTimer(matchId) {
    const state = this.matches.get(matchId);
    if (!state || state.status !== 'playing') return;

    clearTimeout(state.turnTimeoutTimer);
    const delay = Math.max(0, state.turnDeadlineMs - Date.now());

    state.turnTimeoutTimer = setTimeout(() => {
      this.handleTurnTimeout(matchId);
    }, delay);
  }

  processBotTurnIfNeeded(matchId) {
    const state = this.matches.get(matchId);
    if (!state || state.status !== 'playing') return;

    clearTimeout(state.botRollTimer);
    clearTimeout(state.botMoveTimer);

    const currentColour = state.playerSequence[state.currentTurnIndex];
    const player = state.players.find(p => p.colour === currentColour);

    if (player && player.isBot) {
      // 300ms delay to make it feel human but snappy
      state.botRollTimer = setTimeout(() => {
        if (state.status !== 'playing' || state.playerSequence[state.currentTurnIndex] !== currentColour) return;

        this.executeRoll(matchId, currentColour);

        if (state.noMovableTokensTimer === null) {
          // Bot has movable tokens
          state.botMoveTimer = setTimeout(() => {
            if (state.status !== 'playing' || state.playerSequence[state.currentTurnIndex] !== currentColour) return;

            const bestToken = selectBestBotToken(player, state.diceNumber, this.getAllTokens(state));
            if (bestToken) {
              this.executeMove(matchId, currentColour, bestToken.id);
            } else {
              this.nextTurn(matchId);
            }
          }, 300);
        }
      }, 300);
    }
  }

  handleQuitGame(ws, matchId, message) {
    const state = this.matches.get(matchId);
    if (!state) return;

    const { playerId } = message;
    const player = state.players.find(p => p.id === playerId || p.userId === playerId);
    if (!player) return;

    console.log(`[GameEngine] Player ${player.name} (${player.colour}) requested exit/quit.`);
    this.executeQuit(matchId, player.colour);
  }

  executeQuit(matchId, colour) {
    const state = this.matches.get(matchId);
    if (!state || state.status !== 'playing') return;

    const player = state.players.find(p => p.colour === colour);
    if (!player) return;

    player.hasQuit = true;
    state.playerSequence = state.playerSequence.filter(col => col !== colour);

    // If only 1 player remains, end match
    const activeHumans = state.players.filter(p => !p.isBot && !p.hasQuit);
    
    if (activeHumans.length <= 1 || state.playerSequence.length <= 1) {
      state.status = 'ended';
      const winner = state.playerSequence[0] || colour;
      this.broadcast(matchId, {
        type: 'match_end',
        winnerColour: winner
      });
      state.cleanupTimer = setTimeout(() => {
        this.cleanupMatch(matchId);
      }, 20000);
    } else {
      // Sync remaining players
      this.broadcast(matchId, {
        type: 'state_sync',
        roomId: state.roomId,
        players: state.players,
        playerSequence: state.playerSequence,
        currentTurnColour: state.playerSequence[state.currentTurnIndex % state.playerSequence.length],
        diceNumber: state.diceNumber,
        hasRolled: state.hasRolled,
        consecutiveSixes: state.consecutiveSixes,
        turnDeadlineMs: state.turnDeadlineMs,
        status: state.status
      });

      // If it was the quitting player's turn, advance turn
      const currentColour = state.playerSequence[state.currentTurnIndex % (state.playerSequence.length + 1)];
      if (currentColour === colour) {
        state.currentTurnIndex = state.currentTurnIndex % state.playerSequence.length;
        this.nextTurn(matchId);
      }
    }
  }

  handleRequestRematch(ws, matchId, message) {
    const state = this.matches.get(matchId);
    if (!state || state.status !== 'ended') return;
    const { colour } = message;
    this.broadcast(matchId, {
      type: 'rematch_requested',
      colour
    });
  }

  handleAcceptRematch(ws, matchId, message) {
    const state = this.matches.get(matchId);
    if (!state || state.status !== 'ended') return;
    const { colour } = message;

    if (!state.rematchAccepted) state.rematchAccepted = [];
    if (!state.rematchAccepted.includes(colour)) {
      state.rematchAccepted.push(colour);
    }

    this.broadcast(matchId, {
      type: 'rematch_accepted',
      colour
    });

    const activeHumanColours = state.players.filter(p => !p.isBot && !p.hasQuit).map(p => p.colour);
    const allAccepted = activeHumanColours.every(col => state.rematchAccepted.includes(col));

    if (allAccepted && activeHumanColours.length > 0) {
      if (state.cleanupTimer) {
        clearTimeout(state.cleanupTimer);
        delete state.cleanupTimer;
      }

      state.status = 'playing';
      state.diceNumber = -1;
      state.hasRolled = false;
      state.consecutiveSixes = 0;
      state.currentTurnIndex = 0;
      state.turnDeadlineMs = Date.now() + 15000;
      state.botRollTimer = null;
      state.botMoveTimer = null;
      state.noMovableTokensTimer = null;
      state.rematchAccepted = [];

      state.players.forEach(p => {
        p.missedTurns = 0;
        p.numberOfConsecutiveSix = 0;
        p.tokens = genInitialTokens(p.colour);
      });

      this.broadcast(matchId, {
        type: 'state_sync',
        roomId: state.roomId,
        players: state.players,
        playerSequence: state.playerSequence,
        currentTurnColour: state.playerSequence[state.currentTurnIndex],
        diceNumber: state.diceNumber,
        hasRolled: state.hasRolled,
        consecutiveSixes: state.consecutiveSixes,
        turnDeadlineMs: state.turnDeadlineMs,
        status: state.status
      });

      this.startTurnTimeoutTimer(matchId);
      this.processBotTurnIfNeeded(matchId);
    }
  }

  handleDeclineRematch(ws, matchId, message) {
    const state = this.matches.get(matchId);
    if (!state || state.status !== 'ended') return;
    const { colour } = message;

    this.broadcast(matchId, {
      type: 'rematch_declined',
      colour
    });

    this.cleanupMatch(matchId);
  }

  handleDisconnect(ws, matchId) {
    const state = this.matches.get(matchId);
    if (!state || state.status !== 'playing') return;

    // Find colour connected to this websocket
    let disconnectedColour;
    state.clients.forEach((clientWs, col) => {
      if (clientWs === ws) {
        disconnectedColour = col;
      }
    });

    if (disconnectedColour) {
      console.log(`[GameEngine] Player ${disconnectedColour} disconnected from match ${matchId}.`);
      state.clients.delete(disconnectedColour);

      // Start a 10 seconds grace timer for reconnection. If they fail, convert them to bot
      clearTimeout(state.reconnectTimers?.[disconnectedColour]);
      if (!state.reconnectTimers) state.reconnectTimers = {};

      state.reconnectTimers[disconnectedColour] = setTimeout(() => {
        const player = state.players.find(p => p.colour === disconnectedColour);
        if (player && !state.clients.has(disconnectedColour) && !player.isBot && !player.hasQuit) {
          console.log(`[GameEngine] Grace period expired for ${disconnectedColour}. Converting to bot.`);
          player.isBot = true;
          if (!player.name.includes(' (Bot)')) {
            player.name += ' (Bot)';
          }

          this.broadcast(matchId, {
            type: 'state_sync',
            roomId: state.roomId,
            players: state.players,
            playerSequence: state.playerSequence,
            currentTurnColour: state.playerSequence[state.currentTurnIndex],
            diceNumber: state.diceNumber,
            hasRolled: state.hasRolled,
            consecutiveSixes: state.consecutiveSixes,
            turnDeadlineMs: state.turnDeadlineMs,
            status: state.status
          });

          this.processBotTurnIfNeeded(matchId);
        }
      }, 10000); // 10 seconds grace period
    }
  }

  cleanupMatch(matchId) {
    const state = this.matches.get(matchId);
    if (!state) return;

    clearTimeout(state.turnTimeoutTimer);
    clearTimeout(state.botRollTimer);
    clearTimeout(state.botMoveTimer);
    clearTimeout(state.noMovableTokensTimer);
    if (state.cleanupTimer) {
      clearTimeout(state.cleanupTimer);
    }
    
    if (state.reconnectTimers) {
      Object.values(state.reconnectTimers).forEach(timer => clearTimeout(timer));
    }

    state.clients.clear();
    this.matches.delete(matchId);
    console.log(`[GameEngine] Cleaned up match: ${matchId}`);
  }
}

export {
  areCoordsEqual,
  findCoordIndex,
  getIntegersBetween,
  expandTokenPath,
  isCoordInHomeEntryPathForColour,
  isCoordASafeSpot,
  getHomeCoordForColour,
  getDistanceInTokenPath,
  getAvailableSteps,
  countTokensAtCoord,
  isTokenMovable,
  computeMoveResult,
  genInitialTokens,
  areTokensOnOverlappingPaths,
  getDistanceBetweenTokens,
  isTokenAhead,
  getFinalCoord,
  selectBestBotToken
};
