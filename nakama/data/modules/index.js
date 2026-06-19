var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
/// <reference types="nakama-runtime" />
// ─── CONSTANTS ────────────────────────────────────────────────────────────────
var GENERAL_TOKEN_PATH = [
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
var TOKEN_HOME_ENTRY_PATH = {
    blue: { startCoords: { x: 7, y: 13 }, endCoords: { x: 7, y: 8 } },
    red: { startCoords: { x: 1, y: 7 }, endCoords: { x: 6, y: 7 } },
    green: { startCoords: { x: 7, y: 1 }, endCoords: { x: 7, y: 6 } },
    yellow: { startCoords: { x: 13, y: 7 }, endCoords: { x: 8, y: 7 } }
};
var TOKEN_START_COORDINATES = {
    blue: { x: 6, y: 13 },
    red: { x: 1, y: 6 },
    green: { x: 8, y: 1 },
    yellow: { x: 13, y: 8 }
};
var TOKEN_SAFE_COORDINATES = [
    { x: 6, y: 13 },
    { x: 1, y: 6 },
    { x: 8, y: 1 },
    { x: 13, y: 8 },
    { x: 8, y: 12 },
    { x: 2, y: 8 },
    { x: 6, y: 2 },
    { x: 12, y: 6 }
];
var TOKEN_LOCKED_COORDINATES = {
    blue: [{ x: 1.45, y: 10.55 }, { x: 3.55, y: 10.55 }, { x: 1.45, y: 12.65 }, { x: 3.55, y: 12.65 }],
    red: [{ x: 1.45, y: 1.5 }, { x: 3.55, y: 1.5 }, { x: 1.45, y: 3.6 }, { x: 3.55, y: 3.6 }],
    green: [{ x: 10.5, y: 1.5 }, { x: 12.6, y: 1.5 }, { x: 10.5, y: 3.6 }, { x: 12.6, y: 3.6 }],
    yellow: [{ x: 10.5, y: 10.55 }, { x: 12.6, y: 10.55 }, { x: 10.5, y: 12.65 }, { x: 12.6, y: 12.65 }]
};
// ─── ES5 ARRAY / OBJECT HELPERS ───────────────────────────────────────────────
function areCoordsEqual(c1, c2) {
    return c1.x === c2.x && c1.y === c2.y;
}
function findCoordIndex(arr, coord) {
    for (var i = 0; i < arr.length; i++) {
        if (areCoordsEqual(arr[i], coord))
            return i;
    }
    return -1;
}
function getIntegersBetween(a, b) {
    if (a === b)
        return [a];
    var result = [];
    var start = Math.min(a, b) + 1;
    var end = Math.max(a, b);
    for (var i = start; i < end; i++) {
        result.push(i);
    }
    if (a > b)
        result = result.reverse();
    return __spreadArray(__spreadArray([a], result, true), [b], false);
}
function expandTokenPath(tokenPathsArr) {
    var expandedPath = [];
    for (var i = 0; i < tokenPathsArr.length; i++) {
        var path = tokenPathsArr[i];
        var isVertical = path.startCoords.x === path.endCoords.x;
        var staticCoordinateComponent = isVertical ? path.startCoords.x : path.startCoords.y;
        var variableStartCoordinate = isVertical ? path.startCoords.y : path.startCoords.x;
        var variableEndCoordinate = isVertical ? path.endCoords.y : path.endCoords.x;
        var variableCoordinates = getIntegersBetween(variableStartCoordinate, variableEndCoordinate);
        for (var j = 0; j < variableCoordinates.length; j++) {
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
var expandedTokenHomeEntryPath = {
    blue: expandTokenPath([TOKEN_HOME_ENTRY_PATH.blue]),
    red: expandTokenPath([TOKEN_HOME_ENTRY_PATH.red]),
    green: expandTokenPath([TOKEN_HOME_ENTRY_PATH.green]),
    yellow: expandTokenPath([TOKEN_HOME_ENTRY_PATH.yellow])
};
function genBlueTokenPath() {
    var expandedGeneralTokenPathForBlue = expandTokenPath(GENERAL_TOKEN_PATH).slice(0, -1);
    return __spreadArray(__spreadArray([], expandedGeneralTokenPathForBlue, true), expandedTokenHomeEntryPath.blue, true);
}
function genRedTokenPath() {
    var path = __spreadArray(__spreadArray([], GENERAL_TOKEN_PATH.slice(3), true), GENERAL_TOKEN_PATH.slice(0, 3), true);
    var expandedTokenPathForRed = expandTokenPath(path).slice(0, -1);
    return __spreadArray(__spreadArray([], expandedTokenPathForRed, true), expandedTokenHomeEntryPath.red, true);
}
function genGreenTokenPath() {
    var path = __spreadArray(__spreadArray([], GENERAL_TOKEN_PATH.slice(6), true), GENERAL_TOKEN_PATH.slice(0, 6), true);
    var expandedTokenPathForGreen = expandTokenPath(path).slice(0, -1);
    return __spreadArray(__spreadArray([], expandedTokenPathForGreen, true), expandedTokenHomeEntryPath.green, true);
}
function genYellowTokenPath() {
    var path = __spreadArray(__spreadArray([], GENERAL_TOKEN_PATH.slice(9), true), GENERAL_TOKEN_PATH.slice(0, 9), true);
    var expandedTokenPathForYellow = expandTokenPath(path).slice(0, -1);
    return __spreadArray(__spreadArray([], expandedTokenPathForYellow, true), expandedTokenHomeEntryPath.yellow, true);
}
var tokenPaths = {
    blue: genBlueTokenPath(),
    red: genRedTokenPath(),
    green: genGreenTokenPath(),
    yellow: genYellowTokenPath()
};
function isCoordInHomeEntryPathForColour(coord, colour) {
    var homePath = expandedTokenHomeEntryPath[colour];
    for (var i = 0; i < homePath.length; i++) {
        if (areCoordsEqual(coord, homePath[i]))
            return true;
    }
    return false;
}
function isCoordASafeSpot(coord, colour) {
    for (var i = 0; i < TOKEN_SAFE_COORDINATES.length; i++) {
        if (areCoordsEqual(coord, TOKEN_SAFE_COORDINATES[i]))
            return true;
    }
    if (!colour)
        return false;
    return isCoordInHomeEntryPathForColour(coord, colour);
}
function getHomeCoordForColour(colour) {
    var path = tokenPaths[colour];
    return path[path.length - 1];
}
function getDistanceInTokenPath(colour, initialCoord, targetCoord) {
    var path = tokenPaths[colour];
    var initialIndex = findCoordIndex(path, initialCoord);
    var targetIndex = findCoordIndex(path, targetCoord);
    if (initialIndex === -1 || targetIndex === -1)
        return -1;
    return Math.abs(initialIndex - targetIndex);
}
function getAvailableSteps(token) {
    return getDistanceInTokenPath(token.colour, token.coordinates, getHomeCoordForColour(token.colour));
}
function countTokensAtCoord(allTokens, coord, colour) {
    var count = 0;
    for (var i = 0; i < allTokens.length; i++) {
        var t = allTokens[i];
        if (t.colour === colour && !t.isLocked && !t.hasTokenReachedHome && areCoordsEqual(t.coordinates, coord)) {
            count++;
        }
    }
    return count;
}
function isTokenMovable(token, diceNumber, allTokens) {
    if (!diceNumber)
        return !token.isLocked && !token.hasTokenReachedHome;
    if (token.isLocked) {
        return diceNumber === 6;
    }
    if (token.hasTokenReachedHome || getAvailableSteps(token) < diceNumber) {
        return false;
    }
    if (allTokens) {
        var path = tokenPaths[token.colour];
        var currentCoordIndex = findCoordIndex(path, token.coordinates);
        if (currentCoordIndex !== -1) {
            for (var i = 1; i <= diceNumber; i++) {
                var stepIndex = currentCoordIndex + i;
                if (stepIndex >= path.length)
                    break;
                var stepCoord = path[stepIndex];
                var opponentColours = [];
                var colours = ['blue', 'red', 'green', 'yellow'];
                for (var c = 0; c < colours.length; c++) {
                    if (colours[c] !== token.colour) {
                        opponentColours.push(colours[c]);
                    }
                }
                for (var o = 0; o < opponentColours.length; o++) {
                    var oppColour = opponentColours[o];
                    if (!isCoordASafeSpot(stepCoord, oppColour)) {
                        var blockCount = countTokensAtCoord(allTokens, stepCoord, oppColour);
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
    var colour = token.colour, coordinates = token.coordinates, isLocked = token.isLocked;
    var path = tokenPaths[colour];
    if (isLocked) {
        if (diceNumber === 6) {
            var startCoord = TOKEN_START_COORDINATES[colour];
            return {
                hasTokenReachedHome: false,
                isCaptured: false,
                hasPlayerWon: false,
                path: [startCoord]
            };
        }
        return { hasTokenReachedHome: false, isCaptured: false, hasPlayerWon: false, path: [] };
    }
    var currentCoordIndex = findCoordIndex(path, coordinates);
    if (currentCoordIndex === -1) {
        return { hasTokenReachedHome: false, isCaptured: false, hasPlayerWon: false, path: [] };
    }
    var finalIndex = Math.min(currentCoordIndex + diceNumber, path.length - 1);
    var movePath = [];
    for (var i = currentCoordIndex + 1; i <= finalIndex; i++) {
        movePath.push(path[i]);
    }
    var lastTokenCoord = path[finalIndex];
    var hasTokenReachedHome = areCoordsEqual(lastTokenCoord, path[path.length - 1]);
    var player = null;
    for (var p = 0; p < players.length; p++) {
        if (players[p].colour === colour) {
            player = players[p];
            break;
        }
    }
    var homeCount = 0;
    if (player && player.tokens) {
        for (var t = 0; t < player.tokens.length; t++) {
            if (player.tokens[t].hasTokenReachedHome) {
                homeCount++;
            }
        }
    }
    var hasPlayerWon = hasTokenReachedHome && !token.hasTokenReachedHome && homeCount === 3;
    // Capture check
    var isCaptured = false;
    var isSafe = isCoordASafeSpot(lastTokenCoord);
    if (!isSafe) {
        // Find if there is any opponent token on this cell
        for (var p = 0; p < players.length; p++) {
            var opp = players[p];
            if (opp.colour !== colour && opp.tokens) {
                for (var t = 0; t < opp.tokens.length; t++) {
                    var oppT = opp.tokens[t];
                    if (!oppT.isLocked && !oppT.hasTokenReachedHome && areCoordsEqual(oppT.coordinates, lastTokenCoord)) {
                        isCaptured = true;
                        break;
                    }
                }
            }
            if (isCaptured)
                break;
        }
    }
    return { hasTokenReachedHome: hasTokenReachedHome, isCaptured: isCaptured, hasPlayerWon: hasPlayerWon, path: movePath };
}
// ─── INITIALIZATION HELPERS ──────────────────────────────────────────────────
function genInitialTokens(colour) {
    var lockedCoords = TOKEN_LOCKED_COORDINATES[colour];
    var tokens = [];
    for (var i = 0; i < 4; i++) {
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
// ─── NAKAMA STANDARD IMPLEMENTATION ───────────────────────────────────────────
function matchInit(ctx, logger, nk, params) {
    try {
        logger.info("Match Init with params: %v", params);
        var playersList = JSON.parse(params.players || '[]');
        var players = [];
        for (var i = 0; i < playersList.length; i++) {
            var p = playersList[i];
            var colour = (p.color || p.colour || 'blue');
            players.push({
                name: p.name,
                colour: colour,
                isBot: !!p.isBot,
                numberOfConsecutiveSix: 0,
                tokens: genInitialTokens(colour),
                id: p.id || "",
                userId: p.userId || "",
                missedTurns: 0,
                hasQuit: false
            });
        }
        var playerSequence = [];
        for (var i = 0; i < players.length; i++) {
            playerSequence.push(players[i].colour);
        }
        var state = {
            roomId: ctx.matchId,
            players: players,
            playerSequence: playerSequence,
            currentTurnIndex: 0,
            diceNumber: -1,
            hasRolled: false,
            consecutiveSixes: 0,
            turnDeadlineMs: Date.now() + 15000,
            status: 'playing',
            tickCount: 0,
            emptyTicks: 0,
            botTakeoverTicks: {},
            botRollTick: null,
            botMoveTick: null,
            noMovableTokensTimer: null,
            rematchAccepted: [],
            terminateAfterTicks: null,
            lastStateSyncTick: 0 // track when we last broadcast periodic STATE_SYNC
        };
        return {
            state: state,
            tickRate: 30,
            label: ""
        };
    }
    catch (e) {
        var errMsg = (e === null || e === void 0 ? void 0 : e.message) || (e === null || e === void 0 ? void 0 : e.error) || String(e);
        logger.error("Error in matchInit: %v", errMsg);
        throw e;
    }
}
function matchJoinAttempt(ctx, logger, nk, dispatcher, tick, state, presence, metadata) {
    var s = state;
    var playerExists = false;
    for (var i = 0; i < s.players.length; i++) {
        if (s.players[i].userId === presence.userId) {
            playerExists = true;
            break;
        }
    }
    if (playerExists) {
        return { state: state, accept: true };
    }
    return { state: state, accept: false, rejectMessage: "Not part of this match" };
}
function sendStateSync(dispatcher, state, presence) {
    dispatcher.broadcastMessage(200, JSON.stringify({
        roomId: state.roomId,
        players: state.players,
        playerSequence: state.playerSequence,
        currentTurnColour: state.playerSequence[state.currentTurnIndex],
        diceNumber: state.diceNumber,
        hasRolled: state.hasRolled,
        consecutiveSixes: state.consecutiveSixes,
        turnDeadlineMs: state.turnDeadlineMs,
        status: state.status
    }), [presence]);
}
function matchJoin(ctx, logger, nk, dispatcher, tick, state, presences) {
    var s = state;
    for (var p = 0; p < presences.length; p++) {
        var presence = presences[p];
        var matched = false;
        for (var i = 0; i < s.players.length; i++) {
            var player = s.players[i];
            logger.info("matchJoin: comparing player.userId=%v with presence.userId=%v", player.userId, presence.userId);
            if (player.userId === presence.userId) {
                player.id = presence.sessionId;
                player.isBot = false;
                if (player.name.indexOf(' (Bot)') !== -1) {
                    player.name = player.name.replace(' (Bot)', '');
                }
                if (s.botTakeoverTicks[presence.userId]) {
                    delete s.botTakeoverTicks[presence.userId];
                }
                logger.info("matchJoin: sending STATE_SYNC to presence userId=%v sessionId=%v", presence.userId, presence.sessionId);
                sendStateSync(dispatcher, s, presence);
                matched = true;
            }
        }
        if (!matched) {
            logger.warn("matchJoin: presence userId=%v did not match any player. Available userIds: %v", presence.userId, JSON.stringify(s.players.map(function (pl) { return pl.userId; })));
        }
    }
    return { state: state };
}
function matchLeave(ctx, logger, nk, dispatcher, tick, state, presences) {
    var s = state;
    for (var p = 0; p < presences.length; p++) {
        var presence = presences[p];
        for (var i = 0; i < s.players.length; i++) {
            var player = s.players[i];
            if (player.userId === presence.userId) {
                s.botTakeoverTicks[presence.userId] = tick + 120; // 4 seconds at 30Hz
            }
        }
    }
    return { state: state };
}
function nextTurn(state, dispatcher) {
    state.currentTurnIndex = (state.currentTurnIndex + 1) % state.playerSequence.length;
    var nextColour = state.playerSequence[state.currentTurnIndex];
    state.diceNumber = -1;
    state.hasRolled = false;
    state.consecutiveSixes = 0;
    state.turnDeadlineMs = Date.now() + 15000;
    state.botRollTick = null;
    state.botMoveTick = null;
    state.noMovableTokensTimer = null;
    dispatcher.broadcastMessage(203, JSON.stringify({
        nextTurnColour: nextColour,
        deadlineMs: state.turnDeadlineMs
    }));
}
function resolvePostMoveTurnHandoff(state, dispatcher, colour, diceNumber, hasTokenReachedHome, isCaptured) {
    var getsAnotherTurn = (diceNumber === 6 && state.consecutiveSixes < 3) || isCaptured || hasTokenReachedHome;
    if (getsAnotherTurn) {
        state.diceNumber = -1;
        state.hasRolled = false;
        state.turnDeadlineMs = Date.now() + 15000;
        state.botRollTick = null;
        state.botMoveTick = null;
        state.noMovableTokensTimer = null;
        dispatcher.broadcastMessage(203, JSON.stringify({
            nextTurnColour: colour,
            deadlineMs: state.turnDeadlineMs
        }));
    }
    else {
        state.consecutiveSixes = 0;
        nextTurn(state, dispatcher);
    }
}
function executeRoll(state, dispatcher, colour) {
    var roll = Math.floor(Math.random() * 6) + 1;
    state.diceNumber = roll;
    state.hasRolled = true;
    if (roll === 6) {
        state.consecutiveSixes++;
    }
    else {
        state.consecutiveSixes = 0;
    }
    var player = null;
    for (var i = 0; i < state.players.length; i++) {
        if (state.players[i].colour === colour) {
            player = state.players[i];
            break;
        }
    }
    var allTokens = [];
    for (var p = 0; p < state.players.length; p++) {
        var pl = state.players[p];
        if (pl.tokens) {
            for (var t = 0; t < pl.tokens.length; t++) {
                allTokens.push(pl.tokens[t]);
            }
        }
    }
    var hasMovableTokens = false;
    if (player && player.tokens) {
        if (state.consecutiveSixes === 3) {
            hasMovableTokens = false;
        }
        else {
            for (var t = 0; t < player.tokens.length; t++) {
                if (isTokenMovable(player.tokens[t], roll, allTokens)) {
                    hasMovableTokens = true;
                    break;
                }
            }
        }
    }
    dispatcher.broadcastMessage(201, JSON.stringify({
        roll: roll,
        colour: colour,
        hasMovableTokens: hasMovableTokens
    }));
    if (state.consecutiveSixes === 3) {
        state.consecutiveSixes = 0;
        state.noMovableTokensTimer = Date.now() + 1500;
    }
    else if (!hasMovableTokens) {
        state.noMovableTokensTimer = Date.now() + 1500;
    }
    else {
        state.turnDeadlineMs = Date.now() + 15000;
    }
}
var BOT_WEIGHTS = {
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
var BOT_LOGIC_CONFIG = {
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
function areTokensOnOverlappingPaths(token1, token2) {
    var coord1 = token1.coordinates;
    var coord2 = token2.coordinates;
    var tokenPath1 = tokenPaths[token1.colour];
    var tokenPath2 = tokenPaths[token2.colour];
    var tokenPath1CoordIndex = findCoordIndex(tokenPath1, coord1);
    var tokenPath2CoordIndex = findCoordIndex(tokenPath2, coord2);
    if (tokenPath1CoordIndex === -1 || tokenPath2CoordIndex === -1)
        return false;
    for (var i = tokenPath1CoordIndex; i < tokenPath1.length; i++) {
        if (areCoordsEqual(tokenPath1[i], coord2))
            return true;
    }
    for (var i = tokenPath2CoordIndex; i < tokenPath2.length; i++) {
        if (areCoordsEqual(tokenPath2[i], coord1))
            return true;
    }
    return false;
}
function getDistanceBetweenTokens(token1, token2) {
    var coord1 = token1.coordinates;
    var coord2 = token2.coordinates;
    if (!areTokensOnOverlappingPaths(token1, token2))
        return -1;
    var expandedGeneralTokenPath = expandTokenPath(GENERAL_TOKEN_PATH).slice(0, -1);
    var index1 = findCoordIndex(expandedGeneralTokenPath, coord1);
    var index2 = findCoordIndex(expandedGeneralTokenPath, coord2);
    if (index1 === -1 || index2 === -1)
        return -1;
    var pathLength = expandedGeneralTokenPath.length;
    var forwardDistance = (index2 - index1 + pathLength) % pathLength;
    var backwardDistance = (index1 - index2 + pathLength) % pathLength;
    return Math.min(forwardDistance, backwardDistance);
}
function isTokenAhead(token1, token2) {
    if (areCoordsEqual(token1.coordinates, token2.coordinates))
        return false;
    if (!areTokensOnOverlappingPaths(token1, token2))
        return false;
    var token1Path = tokenPaths[token1.colour];
    var token2Path = tokenPaths[token2.colour];
    var token2CoordIndex = findCoordIndex(token2Path, token2.coordinates);
    var token1CoordIndex = findCoordIndex(token1Path, token1.coordinates);
    var minDist = getDistanceBetweenTokens(token1, token2);
    if (token2CoordIndex === -1 || token1CoordIndex === -1)
        return false;
    for (var i = token2CoordIndex; i < token2Path.length; i++) {
        if (i - token2CoordIndex > minDist)
            break;
        if (areCoordsEqual(token2Path[i], token1.coordinates))
            return true;
    }
    for (var i = token1CoordIndex; i < token1Path.length; i++) {
        if (i - token1CoordIndex > minDist)
            break;
        if (areCoordsEqual(token1Path[i], token2.coordinates))
            return false;
    }
    return false;
}
function getFinalCoord(token, diceNumber) {
    var tokenPath = tokenPaths[token.colour];
    var currentCoordIndex = findCoordIndex(tokenPath, token.coordinates);
    if (currentCoordIndex === -1)
        return null;
    var finalIndex = currentCoordIndex + diceNumber;
    if (finalIndex >= tokenPath.length)
        return null;
    return tokenPath[finalIndex];
}
function selectBestBotToken(player, roll, allTokens) {
    var botTokens = [];
    for (var i = 0; i < allTokens.length; i++) {
        if (allTokens[i].colour === player.colour) {
            botTokens.push(allTokens[i]);
        }
    }
    var movableBotTokens = [];
    for (var i = 0; i < botTokens.length; i++) {
        if (isTokenMovable(botTokens[i], roll, allTokens)) {
            movableBotTokens.push(botTokens[i]);
        }
    }
    if (movableBotTokens.length === 0)
        return null;
    var botTokenHomeCoord = getHomeCoordForColour(player.colour);
    var botTokenStartCoord = tokenPaths[player.colour][0];
    var expandedGeneralTokenPath = expandTokenPath(GENERAL_TOKEN_PATH).slice(0, -1);
    var activeOpponentTokens = [];
    for (var i = 0; i < allTokens.length; i++) {
        var t = allTokens[i];
        if (t.colour !== player.colour && isTokenMovable(t) && findCoordIndex(expandedGeneralTokenPath, t.coordinates) !== -1) {
            activeOpponentTokens.push(t);
        }
    }
    var tokenScores = [];
    for (var idx = 0; idx < botTokens.length; idx++) {
        var token = botTokens[idx];
        var feasibilityScore = 0;
        var finalCoord = null;
        var isUnlockable = token.isLocked && !token.hasTokenReachedHome && roll === BOT_LOGIC_CONFIG.UNLOCK_DICE_VALUE;
        if (isUnlockable) {
            feasibilityScore += BOT_WEIGHTS.UNLOCK_BONUS;
            finalCoord = tokenPaths[token.colour][0];
        }
        else {
            finalCoord = getFinalCoord(token, roll);
            if (!isTokenMovable(token, roll, allTokens)) {
                tokenScores.push({ token: token, feasibilityScore: -Infinity });
                continue;
            }
        }
        if (!finalCoord) {
            tokenScores.push({ token: token, feasibilityScore: -Infinity });
            continue;
        }
        var isFinalCoordSafe = isCoordASafeSpot(finalCoord, token.colour);
        var isCurrentCoordSafe = isCoordASafeSpot(token.coordinates, token.colour);
        var botTokensAtHome = 0;
        for (var i = 0; i < botTokens.length; i++) {
            if (botTokens[i].hasTokenReachedHome)
                botTokensAtHome++;
        }
        var endgameMultiplier = botTokensAtHome >= BOT_LOGIC_CONFIG.ENDGAME_TOKEN_COUNT ? BOT_LOGIC_CONFIG.ENDGAME_SCORE_MULTIPLIER : BOT_LOGIC_CONFIG.DEFAULT_MULTIPLIER;
        var safetyMultiplier = botTokensAtHome > BOT_LOGIC_CONFIG.SAFETY_TOKEN_COUNT ? BOT_LOGIC_CONFIG.SAFETY_SCORE_MULTIPLIER : BOT_LOGIC_CONFIG.DEFAULT_MULTIPLIER;
        // Capturable check
        for (var i = 0; i < allTokens.length; i++) {
            var t = allTokens[i];
            if (t.colour !== player.colour && areCoordsEqual(finalCoord, t.coordinates) && !isCoordASafeSpot(t.coordinates, t.colour)) {
                var distToEnd = getDistanceInTokenPath(t.colour, t.coordinates, getHomeCoordForColour(t.colour));
                var distTraveled = tokenPaths[t.colour].length - distToEnd;
                feasibilityScore += BOT_WEIGHTS.CAPTURE_BASE + distTraveled * BOT_WEIGHTS.OPPONENT_PROGRESS_MULTIPLIER;
            }
        }
        if (isFinalCoordSafe)
            feasibilityScore += BOT_WEIGHTS.SAFE_POSITION_BONUS;
        var isTokenAlreadyInHomeEntryPath = isCoordInHomeEntryPathForColour(token.coordinates, token.colour);
        var willTokenBeInHomeEntryPath = isCoordInHomeEntryPathForColour(finalCoord, token.colour);
        if (willTokenBeInHomeEntryPath && !isTokenAlreadyInHomeEntryPath) {
            feasibilityScore += BOT_WEIGHTS.HOME_ENTRY_BONUS;
        }
        if (isTokenAlreadyInHomeEntryPath) {
            feasibilityScore -= BOT_WEIGHTS.SAFE_TOKEN_MOVE_PENALTY;
        }
        if (token.isLocked) {
            tokenScores.push({ token: token, feasibilityScore: feasibilityScore });
            continue;
        }
        var distFromHome = getDistanceInTokenPath(token.colour, token.coordinates, botTokenHomeCoord);
        var distFromStart = getDistanceInTokenPath(token.colour, token.coordinates, botTokenStartCoord);
        var botTokensInCurrentCoord = 0;
        for (var i = 0; i < movableBotTokens.length; i++) {
            if (areCoordsEqual(movableBotTokens[i].coordinates, token.coordinates)) {
                botTokensInCurrentCoord++;
            }
        }
        var canTokenReachHome = distFromHome === roll;
        if (canTokenReachHome)
            feasibilityScore += BOT_WEIGHTS.GOAL_COMPLETION_BONUS;
        feasibilityScore -= distFromHome * BOT_WEIGHTS.BASE_DISTANCE_PENALTY * endgameMultiplier;
        var oppTokensAtCurrentCoord = 0;
        for (var i = 0; i < activeOpponentTokens.length; i++) {
            if (areCoordsEqual(activeOpponentTokens[i].coordinates, token.coordinates)) {
                oppTokensAtCurrentCoord++;
            }
        }
        var isCrowdedSafeSpotAndRolled6 = roll === BOT_LOGIC_CONFIG.UNLOCK_DICE_VALUE && isCurrentCoordSafe && oppTokensAtCurrentCoord > 0;
        if (isCrowdedSafeSpotAndRolled6)
            feasibilityScore += BOT_WEIGHTS.CROWDED_EXIT_BONUS;
        var botTokensInFinalCoord = 0;
        for (var i = 0; i < movableBotTokens.length; i++) {
            if (areCoordsEqual(movableBotTokens[i].coordinates, finalCoord)) {
                botTokensInFinalCoord++;
            }
        }
        if (botTokensInFinalCoord > 0 && !isFinalCoordSafe) {
            feasibilityScore -= BOT_WEIGHTS.UNSAFE_STACKING_PENALTY;
        }
        var isSafeLaunchHunter = false;
        var hasRefundedDistance = false;
        for (var i = 0; i < activeOpponentTokens.length; i++) {
            var oppToken = activeOpponentTokens[i];
            var isBotTokenAheadOfOppTokenInFuture = isTokenAhead(__assign(__assign({}, token), { coordinates: finalCoord }), oppToken);
            var futureDist = getDistanceBetweenTokens(__assign(__assign({}, token), { coordinates: finalCoord }), oppToken);
            var isBotTokenAheadOfOppTokenCurrently = isTokenAhead(token, oppToken);
            var currentDist = getDistanceBetweenTokens(token, oppToken);
            if (currentDist >= 1 && currentDist <= BOT_LOGIC_CONFIG.MAX_CHASE_LOOKAHEAD && !isBotTokenAheadOfOppTokenCurrently) {
                var isThreatenedFromBehind = false;
                for (var j = 0; j < activeOpponentTokens.length; j++) {
                    var t = activeOpponentTokens[j];
                    var dist = getDistanceBetweenTokens(token, t);
                    var isOpponentBehind = isTokenAhead(token, t);
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
                    if (!isThreatenedFromBehind)
                        isSafeLaunchHunter = true;
                }
                else if (currentDist <= BOT_LOGIC_CONFIG.RISKY_HUNT_RANGE) {
                    feasibilityScore += BOT_WEIGHTS.RISKY_CHASE_BASE_BONUS;
                    if (currentDist <= BOT_LOGIC_CONFIG.CRITICAL_COMBAT_RANGE) {
                        feasibilityScore += BOT_WEIGHTS.RISKY_HUNT_CRITICAL_RANGE_BONUS;
                    }
                }
            }
            if (currentDist >= 1 && currentDist <= BOT_LOGIC_CONFIG.MAX_THREAT_LOOKAHEAD && isBotTokenAheadOfOppTokenCurrently && !isCurrentCoordSafe) {
                var distFromStartCurrent = tokenPaths[token.colour].length - distFromHome;
                if (distFromStartCurrent > BOT_LOGIC_CONFIG.HIGH_INVESTMENT_DIST) {
                    feasibilityScore += BOT_WEIGHTS.HIGH_INVESTMENT_ESCAPE_PRIORITY;
                }
                else {
                    feasibilityScore += BOT_WEIGHTS.LOW_INVESTMENT_ESCAPE_PRIORITY;
                }
            }
            if (futureDist >= 1 && futureDist <= BOT_LOGIC_CONFIG.MAX_THREAT_LOOKAHEAD && isBotTokenAheadOfOppTokenInFuture) {
                var threatsCount = 0;
                for (var j = 0; j < activeOpponentTokens.length; j++) {
                    var t = activeOpponentTokens[j];
                    var dist = getDistanceBetweenTokens(__assign(__assign({}, token), { coordinates: finalCoord }), t);
                    var isOpponentBehind = isTokenAhead(__assign(__assign({}, token), { coordinates: finalCoord }), t);
                    if (isOpponentBehind && dist >= 1 && dist <= BOT_LOGIC_CONFIG.DANGER_ZONE_RANGE) {
                        threatsCount++;
                    }
                }
                var isGoingIntoDanger = isBotTokenAheadOfOppTokenInFuture && !isBotTokenAheadOfOppTokenCurrently && !isFinalCoordSafe && threatsCount > 0;
                if (isGoingIntoDanger) {
                    feasibilityScore -= BOT_WEIGHTS.IMMINENT_CAPTURE_PENALTY * threatsCount * Math.max(1, distFromStart / 2);
                }
                var isEscaping = isBotTokenAheadOfOppTokenCurrently && futureDist > currentDist && !isCurrentCoordSafe;
                if (isEscaping || (isFinalCoordSafe && isBotTokenAheadOfOppTokenCurrently && !isCurrentCoordSafe)) {
                    if (isEscaping) {
                        feasibilityScore += (futureDist - currentDist) * BOT_WEIGHTS.ESCAPE_DISTANCE_MULTIPLIER;
                    }
                    if (currentDist <= BOT_LOGIC_CONFIG.CRITICAL_COMBAT_RANGE) {
                        if (isEscaping)
                            feasibilityScore += BOT_WEIGHTS.CRITICAL_ESCAPE_BONUS;
                        if (!hasRefundedDistance) {
                            feasibilityScore += distFromHome * BOT_WEIGHTS.BASE_DISTANCE_PENALTY * endgameMultiplier;
                            hasRefundedDistance = true;
                        }
                    }
                    if (isFinalCoordSafe)
                        feasibilityScore += BOT_WEIGHTS.SAFE_HAVEN_BONUS;
                    else if (isEscaping)
                        feasibilityScore -= BOT_WEIGHTS.UNSAFE_ESCAPE_PENALTY;
                }
                else {
                    var isProtected = isFinalCoordSafe || willTokenBeInHomeEntryPath;
                    if (!isProtected && isCurrentCoordSafe && !isGoingIntoDanger) {
                        feasibilityScore -= BOT_WEIGHTS.SAFE_SPOT_ABANDONMENT_PENALTY * safetyMultiplier;
                    }
                }
            }
        }
        if (isCurrentCoordSafe && !isSafeLaunchHunter && !isCrowdedSafeSpotAndRolled6) {
            feasibilityScore -= BOT_WEIGHTS.SAFE_SPOT_EXIT_PENALTY;
        }
        else if (botTokensInCurrentCoord > 1) {
            feasibilityScore += botTokensInCurrentCoord * BOT_WEIGHTS.STACK_SPLIT_BONUS;
        }
        tokenScores.push({ token: token, feasibilityScore: feasibilityScore });
    }
    var maxScore = -Infinity;
    for (var i = 0; i < tokenScores.length; i++) {
        if (tokenScores[i].feasibilityScore > maxScore) {
            maxScore = tokenScores[i].feasibilityScore;
        }
    }
    var bestTokens = [];
    for (var i = 0; i < tokenScores.length; i++) {
        if (tokenScores[i].feasibilityScore === maxScore) {
            bestTokens.push(tokenScores[i].token);
        }
    }
    if (bestTokens.length === 0)
        return null;
    var randIndex = Math.floor(Math.random() * bestTokens.length);
    return bestTokens[randIndex];
}
function executeMove(state, dispatcher, colour, tokenId) {
    var player = null;
    for (var i = 0; i < state.players.length; i++) {
        if (state.players[i].colour === colour) {
            player = state.players[i];
            break;
        }
    }
    if (!player || !player.tokens)
        return;
    var token = null;
    for (var i = 0; i < player.tokens.length; i++) {
        if (player.tokens[i].id === tokenId) {
            token = player.tokens[i];
            break;
        }
    }
    if (!token)
        return;
    var roll = state.diceNumber;
    var allTokens = [];
    for (var p = 0; p < state.players.length; p++) {
        var pl = state.players[p];
        if (pl.tokens) {
            for (var t = 0; t < pl.tokens.length; t++) {
                allTokens.push(pl.tokens[t]);
            }
        }
    }
    if (!isTokenMovable(token, roll, allTokens)) {
        return;
    }
    var _a = computeMoveResult(token, roll, state.players), hasTokenReachedHome = _a.hasTokenReachedHome, isCaptured = _a.isCaptured, hasPlayerWon = _a.hasPlayerWon, path = _a.path;
    // Update token coordinates
    if (token.isLocked && roll === 6) {
        token.isLocked = false;
        token.coordinates = TOKEN_START_COORDINATES[colour];
    }
    else {
        token.coordinates = path[path.length - 1];
    }
    if (hasTokenReachedHome) {
        token.hasTokenReachedHome = true;
        token.coordinates = getHomeCoordForColour(colour);
    }
    var capturedTokenColour = undefined;
    var capturedTokenId = undefined;
    if (isCaptured) {
        var dest = token.coordinates;
        for (var k = 0; k < allTokens.length; k++) {
            var oppToken = allTokens[k];
            if (oppToken.colour !== colour && !oppToken.isLocked && !oppToken.hasTokenReachedHome && areCoordsEqual(oppToken.coordinates, dest)) {
                oppToken.isLocked = true;
                oppToken.coordinates = { x: oppToken.initialCoords.x, y: oppToken.initialCoords.y };
                capturedTokenColour = oppToken.colour;
                capturedTokenId = oppToken.id;
                break;
            }
        }
    }
    // Broadcast the move result
    dispatcher.broadcastMessage(202, JSON.stringify({
        colour: colour,
        id: tokenId,
        isUnlock: token.isLocked === false && roll === 6 && path.length === 1,
        path: path,
        hasTokenReachedHome: hasTokenReachedHome,
        isCaptured: isCaptured,
        hasPlayerWon: hasPlayerWon,
        capturedTokenColour: capturedTokenColour,
        capturedTokenId: capturedTokenId
    }));
    if (hasPlayerWon) {
        state.status = 'ended';
        state.winnerColour = colour;
        state.terminateAfterTicks = state.tickCount + 600; // 20 seconds at 30Hz
        state.rematchAccepted = [];
        dispatcher.broadcastMessage(204, JSON.stringify({
            winnerColour: colour
        }));
        return;
    }
    resolvePostMoveTurnHandoff(state, dispatcher, colour, roll, hasTokenReachedHome, isCaptured);
}
function matchLoop(ctx, logger, nk, dispatcher, tick, state, messages) {
    var s = state;
    s.tickCount = tick;
    // ─── Periodic STATE_SYNC: broadcast full state every ~5 seconds (150 ticks @ 30Hz)
    // This guarantees clients get STATE_SYNC even if the initial matchJoin push was lost.
    if (tick - s.lastStateSyncTick >= 150) {
        s.lastStateSyncTick = tick;
        dispatcher.broadcastMessage(200, JSON.stringify({
            roomId: s.roomId,
            players: s.players,
            playerSequence: s.playerSequence,
            currentTurnColour: s.playerSequence[s.currentTurnIndex],
            diceNumber: s.diceNumber,
            hasRolled: s.hasRolled,
            consecutiveSixes: s.consecutiveSixes,
            turnDeadlineMs: s.turnDeadlineMs,
            status: s.status
        }));
    }
    if (s.status === 'ended') {
        // Process rematch messages
        messages.forEach(function (message) {
            var opCode = message.opCode;
            if (opCode === 101 || opCode === 102 || opCode === 103) {
                // Relay rematch requests to other players
                var otherPlayers = s.players.filter(function (p) { return p.id && p.id !== message.sender.sessionId && !p.isBot; });
                var relayPresences = [];
                for (var i = 0; i < otherPlayers.length; i++) {
                    relayPresences.push({
                        sessionId: otherPlayers[i].id,
                        userId: otherPlayers[i].userId,
                        username: otherPlayers[i].name,
                        node: ""
                    });
                }
                if (relayPresences.length > 0) {
                    dispatcher.broadcastMessage(opCode, message.data, relayPresences);
                }
                // Authoritative rematch processing
                var senderColour = null;
                for (var i = 0; i < s.players.length; i++) {
                    if (s.players[i].id === message.sender.sessionId) {
                        senderColour = s.players[i].colour;
                        break;
                    }
                }
                if (senderColour) {
                    if (opCode === 101 || opCode === 102) {
                        if (s.rematchAccepted.indexOf(senderColour) === -1) {
                            s.rematchAccepted.push(senderColour);
                        }
                        // Check if all active human players accepted
                        var activeHumanColours = [];
                        for (var i = 0; i < s.players.length; i++) {
                            if (!s.players[i].isBot && !s.players[i].hasQuit) {
                                activeHumanColours.push(s.players[i].colour);
                            }
                        }
                        var allAccepted = true;
                        for (var i = 0; i < activeHumanColours.length; i++) {
                            if (s.rematchAccepted.indexOf(activeHumanColours[i]) === -1) {
                                allAccepted = false;
                                break;
                            }
                        }
                        if (allAccepted && activeHumanColours.length > 0) {
                            // RESET THE GAME STATE ON SERVER FOR REMATCH!
                            s.status = 'playing';
                            s.diceNumber = -1;
                            s.hasRolled = false;
                            s.consecutiveSixes = 0;
                            s.currentTurnIndex = 0;
                            s.turnDeadlineMs = Date.now() + 15000;
                            s.botRollTick = null;
                            s.botMoveTick = null;
                            s.noMovableTokensTimer = null;
                            s.rematchAccepted = [];
                            s.terminateAfterTicks = null;
                            // Reset players' tokens and missed turns
                            for (var i = 0; i < s.players.length; i++) {
                                s.players[i].missedTurns = 0;
                                s.players[i].numberOfConsecutiveSix = 0;
                                s.players[i].tokens = genInitialTokens(s.players[i].colour);
                            }
                            // Broadcast STATE_SYNC (OpCode 200) to reset all clients
                            dispatcher.broadcastMessage(200, JSON.stringify({
                                roomId: s.roomId,
                                players: s.players,
                                playerSequence: s.playerSequence,
                                currentTurnColour: s.playerSequence[s.currentTurnIndex],
                                diceNumber: s.diceNumber,
                                hasRolled: s.hasRolled,
                                consecutiveSixes: s.consecutiveSixes,
                                turnDeadlineMs: s.turnDeadlineMs,
                                status: s.status
                            }));
                        }
                    }
                    else if (opCode === 103) {
                        // Declined: terminate early
                        s.terminateAfterTicks = tick;
                    }
                }
            }
        });
        if (s.terminateAfterTicks !== null && tick >= s.terminateAfterTicks) {
            return null;
        }
        return { state: s };
    }
    // 1. Bot takeover transition countdown
    for (var userId in s.botTakeoverTicks) {
        if (tick >= s.botTakeoverTicks[userId]) {
            var player = null;
            for (var i = 0; i < s.players.length; i++) {
                if (s.players[i].userId === userId) {
                    player = s.players[i];
                    break;
                }
            }
            if (player) {
                player.isBot = true;
                if (player.name.indexOf(' (Bot)') === -1) {
                    player.name += ' (Bot)';
                }
                // Broadcast standard state sync with new bot state
                dispatcher.broadcastMessage(200, JSON.stringify({
                    roomId: s.roomId,
                    players: s.players,
                    playerSequence: s.playerSequence,
                    currentTurnColour: s.playerSequence[s.currentTurnIndex],
                    diceNumber: s.diceNumber,
                    hasRolled: s.hasRolled,
                    consecutiveSixes: s.consecutiveSixes,
                    turnDeadlineMs: s.turnDeadlineMs,
                    status: s.status
                }));
            }
            delete s.botTakeoverTicks[userId];
        }
    }
    // 2. Turn Change Delay Handler (e.g. rolled a number with no moves)
    if (s.noMovableTokensTimer !== null) {
        if (Date.now() >= s.noMovableTokensTimer) {
            s.noMovableTokensTimer = null;
            nextTurn(s, dispatcher);
        }
        return { state: state };
    }
    // 3. Process turn deadlines (timeout)
    if (Date.now() >= s.turnDeadlineMs) {
        var currentColour_1 = s.playerSequence[s.currentTurnIndex];
        var player = null;
        for (var i = 0; i < s.players.length; i++) {
            if (s.players[i].colour === currentColour_1) {
                player = s.players[i];
                break;
            }
        }
        if (player) {
            player.missedTurns = (player.missedTurns || 0) + 1;
            if (player.missedTurns >= 3) {
                player.isBot = true;
                if (player.name.indexOf(' (Bot)') === -1) {
                    player.name += ' (Bot)';
                }
                // Broadcast standard state sync with new bot state
                dispatcher.broadcastMessage(200, JSON.stringify({
                    roomId: s.roomId,
                    players: s.players,
                    playerSequence: s.playerSequence,
                    currentTurnColour: s.playerSequence[s.currentTurnIndex],
                    diceNumber: s.diceNumber,
                    hasRolled: s.hasRolled,
                    consecutiveSixes: s.consecutiveSixes,
                    turnDeadlineMs: s.turnDeadlineMs,
                    status: s.status
                }));
            }
            var allTokens = [];
            for (var p = 0; p < s.players.length; p++) {
                var pl = s.players[p];
                if (pl.tokens) {
                    for (var t = 0; t < pl.tokens.length; t++) {
                        allTokens.push(pl.tokens[t]);
                    }
                }
            }
            if (!s.hasRolled) {
                executeRoll(s, dispatcher, currentColour_1);
                if (s.noMovableTokensTimer === null) {
                    var bestToken = selectBestBotToken(player, s.diceNumber, allTokens);
                    if (bestToken) {
                        executeMove(s, dispatcher, currentColour_1, bestToken.id);
                    }
                    else {
                        nextTurn(s, dispatcher);
                    }
                }
            }
            else {
                var bestToken = selectBestBotToken(player, s.diceNumber, allTokens);
                if (bestToken) {
                    executeMove(s, dispatcher, currentColour_1, bestToken.id);
                }
                else {
                    nextTurn(s, dispatcher);
                }
            }
        }
        else {
            nextTurn(s, dispatcher);
        }
        return { state: state };
    }
    // 4. Client Inputs
    messages.forEach(function (message) {
        try {
            var opCode = message.opCode;
            // Allow quit at any time, even if it's not the player's turn
            if (opCode === 7) { // INPUT_QUIT_GAME
                var senderColour = null;
                for (var i = 0; i < s.players.length; i++) {
                    if (s.players[i].id === message.sender.sessionId) {
                        senderColour = s.players[i].colour;
                        break;
                    }
                }
                if (senderColour) {
                    // Mark as quit
                    var quitPlayer = null;
                    for (var i = 0; i < s.players.length; i++) {
                        if (s.players[i].colour === senderColour) {
                            quitPlayer = s.players[i];
                            quitPlayer.hasQuit = true;
                            break;
                        }
                    }
                    // Remove from playerSequence
                    var newSequence = [];
                    for (var i = 0; i < s.playerSequence.length; i++) {
                        if (s.playerSequence[i] !== senderColour) {
                            newSequence.push(s.playerSequence[i]);
                        }
                    }
                    s.playerSequence = newSequence;
                    // Adjust currentTurnIndex if needed
                    if (s.playerSequence.length > 0) {
                        s.currentTurnIndex = s.currentTurnIndex % s.playerSequence.length;
                    }
                    // Check if match should end (e.g. only 1 player left)
                    var activeHumanCount = 0;
                    var winnerColour = s.playerSequence[0];
                    for (var i = 0; i < s.players.length; i++) {
                        if (!s.players[i].isBot && !s.players[i].hasQuit) {
                            activeHumanCount++;
                            winnerColour = s.players[i].colour;
                        }
                    }
                    if (activeHumanCount <= 1 || s.playerSequence.length <= 1) {
                        s.status = 'ended';
                        s.winnerColour = winnerColour;
                        s.terminateAfterTicks = tick + 600;
                        s.rematchAccepted = [];
                        dispatcher.broadcastMessage(204, JSON.stringify({
                            winnerColour: winnerColour
                        }));
                    }
                    else {
                        // Broadcast state sync to notify others
                        dispatcher.broadcastMessage(200, JSON.stringify({
                            roomId: s.roomId,
                            players: s.players,
                            playerSequence: s.playerSequence,
                            currentTurnColour: s.playerSequence[s.currentTurnIndex],
                            diceNumber: s.diceNumber,
                            hasRolled: s.hasRolled,
                            consecutiveSixes: s.consecutiveSixes,
                            turnDeadlineMs: s.turnDeadlineMs,
                            status: s.status
                        }));
                        // If it was the quitting player's turn, change turn
                        var turnColour = s.playerSequence[s.currentTurnIndex];
                        if (turnColour === senderColour) {
                            nextTurn(s, dispatcher);
                        }
                    }
                }
                return;
            }
            var currentColour_2 = s.playerSequence[s.currentTurnIndex];
            var currentPlayer_1 = null;
            for (var i = 0; i < s.players.length; i++) {
                if (s.players[i].colour === currentColour_2) {
                    currentPlayer_1 = s.players[i];
                    break;
                }
            }
            if (opCode === 199) { // REQUEST_STATE_SYNC — any player can request their current game state
                // Update the player's sessionId in case of reconnect
                for (var i = 0; i < s.players.length; i++) {
                    if (s.players[i].userId === message.sender.userId) {
                        s.players[i].id = message.sender.sessionId;
                        s.players[i].isBot = false;
                        if (s.botTakeoverTicks[message.sender.userId]) {
                            delete s.botTakeoverTicks[message.sender.userId];
                        }
                    }
                }
                logger.info("REQUEST_STATE_SYNC from userId=%v sessionId=%v", message.sender.userId, message.sender.sessionId);
                sendStateSync(dispatcher, s, message.sender);
                return;
            }
            if (!currentPlayer_1 || currentPlayer_1.id !== message.sender.sessionId) {
                return;
            }
            if (opCode === 100) { // INPUT_ROLL_DICE
                if (s.hasRolled) {
                    dispatcher.broadcastMessage(205, JSON.stringify({ reason: "Already rolled" }), [message.sender]);
                    return;
                }
                executeRoll(s, dispatcher, currentColour_2);
            }
            else if (opCode === 101) { // INPUT_MOVE_TOKEN
                if (!s.hasRolled) {
                    dispatcher.broadcastMessage(205, JSON.stringify({ reason: "Roll first" }), [message.sender]);
                    return;
                }
                var data = {};
                try {
                    data = JSON.parse(nk.binaryToString(message.data));
                }
                catch (e) { }
                var tokenId = typeof data.id === 'number' ? data.id : -1;
                if (tokenId === -1)
                    return;
                var allTokens = [];
                for (var p = 0; p < s.players.length; p++) {
                    var pl = s.players[p];
                    if (pl.tokens) {
                        for (var t = 0; t < pl.tokens.length; t++) {
                            allTokens.push(pl.tokens[t]);
                        }
                    }
                }
                var token = null;
                for (var t = 0; t < currentPlayer_1.tokens.length; t++) {
                    if (currentPlayer_1.tokens[t].id === tokenId) {
                        token = currentPlayer_1.tokens[t];
                        break;
                    }
                }
                if (!token || !isTokenMovable(token, s.diceNumber, allTokens)) {
                    dispatcher.broadcastMessage(205, JSON.stringify({ reason: "Invalid move" }), [message.sender]);
                    return;
                }
                executeMove(s, dispatcher, currentColour_2, tokenId);
            }
            else if (opCode === 102) { // INPUT_PING / HEARTBEAT
                dispatcher.broadcastMessage(102, "", [message.sender]);
            }
        }
        catch (e) {
            logger.error("Error processing message in matchLoop: %v", e);
        }
    });
    // 5. Bot behavior
    var currentColour = s.playerSequence[s.currentTurnIndex];
    var currentPlayer = null;
    for (var i = 0; i < s.players.length; i++) {
        if (s.players[i].colour === currentColour) {
            currentPlayer = s.players[i];
            break;
        }
    }
    if (currentPlayer && currentPlayer.isBot && s.noMovableTokensTimer === null) {
        if (!s.hasRolled) {
            if (!s.botRollTick) {
                s.botRollTick = tick + 30; // 1 second think time at 30Hz
            }
            else if (tick >= s.botRollTick) {
                executeRoll(s, dispatcher, currentColour);
                s.botRollTick = null;
            }
        }
        else {
            if (!s.botMoveTick) {
                s.botMoveTick = tick + 30;
            }
            else if (tick >= s.botMoveTick) {
                var allTokens = [];
                for (var p = 0; p < s.players.length; p++) {
                    var pl = s.players[p];
                    if (pl.tokens) {
                        for (var t = 0; t < pl.tokens.length; t++) {
                            allTokens.push(pl.tokens[t]);
                        }
                    }
                }
                var bestToken = selectBestBotToken(currentPlayer, s.diceNumber, allTokens);
                if (bestToken) {
                    executeMove(s, dispatcher, currentColour, bestToken.id);
                }
                else {
                    nextTurn(s, dispatcher);
                }
                s.botMoveTick = null;
            }
        }
    }
    else {
        s.botRollTick = null;
        s.botMoveTick = null;
    }
    // 6. Clean empty match check
    var isMatchEmpty = true;
    for (var i = 0; i < s.players.length; i++) {
        var p = s.players[i];
        if (!p.isBot && !(p.userId in s.botTakeoverTicks)) {
            isMatchEmpty = false;
            break;
        }
    }
    if (isMatchEmpty) {
        s.emptyTicks++;
        if (s.emptyTicks > 300) {
            return null;
        }
    }
    else {
        s.emptyTicks = 0;
    }
    return { state: state };
}
function matchTerminate(ctx, logger, nk, dispatcher, tick, state, graceSeconds) {
    return { state: state };
}
function matchSignal(ctx, logger, nk, dispatcher, tick, state, data) {
    return { state: state };
}
/// <reference types="nakama-runtime" />
var REALISTIC_BOTS = [
    { name: 'ApexPhantom', avatarUrl: 'https://i.pravatar.cc/150?img=11', level: 3 },
    { name: 'GamerValkyrie', avatarUrl: 'https://i.pravatar.cc/150?img=12', level: 2 },
    { name: 'NexusVortex', avatarUrl: 'https://i.pravatar.cc/150?img=13', level: 4 },
    { name: 'FrostBite', avatarUrl: 'https://i.pravatar.cc/150?img=14', level: 1 },
    { name: 'SilentDagger', avatarUrl: 'https://i.pravatar.cc/150?img=15', level: 5 }
];
var matchmakerMatched = function (ctx, logger, nk, matches) {
    try {
        logger.info("=== MATCHMAKER MATCHED CALLED === matched count: %v", matches.length);
        var matchPlayers_1 = [];
        // Always use the number of matched users as size (2 for 1v1)
        var size = 2;
        logger.info("Building player list from %v real players, target size: %v", matches.length, size);
        matches.forEach(function (m, idx) {
            var props = m.properties || {};
            // Log every field of the presence to debug userId issues
            logger.info("Player[%v]: sessionId=%v, userId=%v, username=%v", idx, m.presence.sessionId, m.presence.userId, m.presence.username);
            var rawAvatarUrl = props.avatarurl || props.avatarUrl || props.avatar_url || '';
            matchPlayers_1.push({
                id: m.presence.sessionId,
                userId: m.presence.userId,
                isBot: false,
                name: m.presence.username || ('Player ' + (matchPlayers_1.length + 1)),
                avatarUrl: rawAvatarUrl,
                level: 1
            });
        });
        // Fill remaining slots with bots if needed
        var botIndex = 0;
        while (matchPlayers_1.length < size) {
            var botProfile = REALISTIC_BOTS[botIndex % REALISTIC_BOTS.length];
            botIndex++;
            matchPlayers_1.push({
                id: 'bot_' + Math.random().toString(36).substring(7),
                isBot: true,
                userId: 'bot_' + Math.random().toString(36).substring(7),
                name: botProfile.name,
                avatarUrl: botProfile.avatarUrl,
                level: botProfile.level
            });
        }
        var colors_1 = ['blue', 'green', 'red', 'yellow'];
        var finalPlayers = matchPlayers_1.map(function (p, idx) {
            return {
                id: p.id,
                userId: p.userId,
                isBot: p.isBot,
                name: p.name,
                avatarUrl: p.avatarUrl,
                level: p.level,
                color: colors_1[idx]
            };
        });
        logger.info("Final players for match: %v", JSON.stringify(finalPlayers));
        var matchId = nk.matchCreate('ludo_match', { players: JSON.stringify(finalPlayers) });
        logger.info("=== MATCH CREATED SUCCESSFULLY: %v ===", matchId);
        return matchId;
    }
    catch (e) {
        var errMsg = (e === null || e === void 0 ? void 0 : e.message) || (e === null || e === void 0 ? void 0 : e.error) || JSON.stringify(e) || String(e);
        logger.error("=== ERROR in matchmakerMatched: %v ===", errMsg);
        try {
            var activeUserId = (matches && matches[0] && matches[0].presence && matches[0].presence.userId) || "00000000-0000-0000-0000-000000000000";
            nk.storageWrite([{
                    collection: "debug",
                    key: "matchmaker_error",
                    userId: activeUserId,
                    value: { error: errMsg, timestamp: Date.now() },
                    permissionRead: 2,
                    permissionWrite: 0
                }]);
        }
        catch (writeErr) { }
        return; // returning void causes Nakama to send relay token to clients — do NOT do this
    }
};
function ludoPing(ctx, logger, nk, payload) {
    logger.info("ludo_ping called");
    return JSON.stringify({ status: "ok", module: "ludo_match", version: "v6", timestamp: Date.now() });
}
function InitModule(ctx, logger, nk, initializer) {
    logger.info("Nakama Ludo Server Logic Initialized v6");
    // Diagnostic RPC — call via: GET /v2/rpc/ludo_ping?http_key=defaultkey
    initializer.registerRpc('ludo_ping', ludoPing);
    logger.info("Diagnostic RPC 'ludo_ping' registered");
    initializer.registerMatch('ludo_match', {
        matchInit: matchInit,
        matchJoinAttempt: matchJoinAttempt,
        matchJoin: matchJoin,
        matchLeave: matchLeave,
        matchLoop: matchLoop,
        matchTerminate: matchTerminate,
        matchSignal: matchSignal
    });
    logger.info("Match registered successfully");
    initializer.registerMatchmakerMatched(matchmakerMatched);
    logger.info("Matchmaker matched callback registered successfully");
}
// @ts-ignore
if (typeof exports !== 'undefined') {
    // @ts-ignore
    exports.InitModule = InitModule;
}
