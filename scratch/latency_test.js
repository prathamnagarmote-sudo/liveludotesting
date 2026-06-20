import WebSocket from 'ws';

const serverType = process.argv[2] || 'local';
const serverUrl = serverType === 'live'
  ? 'wss://liveludotesting.onrender.com/match/c7ec1fcd-8efe-4731-ae0e-bbd98f7a51d9'
  : 'ws://localhost:3001/match/c7ec1fcd-8efe-4731-ae0e-bbd98f7a51d9';

console.log(`[TEST] Starting latency simulation against ${serverType} server: ${serverUrl}`);

const matchId = 'c7ec1fcd-8efe-4731-ae0e-bbd98f7a51d9';
const allPlayers = [
  { id: 'player_a', userId: 'player_a_user', isBot: false, name: 'Player A', color: 'blue' },
  { id: 'player_b', userId: 'player_b_user', isBot: false, name: 'Player B', color: 'green' }
];

const wsA = new WebSocket(serverUrl);
const wsB = new WebSocket(serverUrl);

let driftA = 0;
let driftB = 0;
let rollsRecorded = [];
let currentRollIndex = 0;

// Setup Ping-Pong clock drift measurement helper
function setupHeartbeat(ws, name, setDrift) {
  let pingsCount = 0;
  
  const pingInterval = setInterval(() => {
    if (ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: 'ping', clientTimestamp: Date.now() }));
    pingsCount++;
    if (pingsCount >= 4) {
      clearInterval(pingInterval);
    }
  }, 500);

  ws.on('message', (data) => {
    const msg = JSON.parse(data);
    if (msg.type === 'pong') {
      const now = Date.now();
      const rtt = now - msg.clientTimestamp;
      const serverTimeEstimate = msg.clientTimestamp + rtt / 2;
      const calculatedDrift = serverTimeEstimate - msg.timestamp;
      setDrift(calculatedDrift);
    }
  });
}

function startTest() {
  console.log('[TEST] Both clients connected and calibrated. Starting 10 rolls...');
  triggerNextRoll();
}

function triggerNextRoll() {
  if (currentRollIndex >= 10) {
    printResultsTable();
    wsA.close();
    wsB.close();
    return;
  }

  currentRollIndex++;
  console.log(`[TEST] Executing Roll #${currentRollIndex}...`);
  
  // T0: Player A clicks the dice (now)
  const t0 = Date.now();
  
  setTimeout(() => {
    // T1: Player A sends the message
    const t1 = Date.now();
    wsA.send(JSON.stringify({
      type: 'roll_dice',
      clientT0: t0,
      clientT1: t1,
      senderDrift: driftA
    }));
  }, 10); // Simulated click-to-send network/event loop delay
}

let connectedCount = 0;
function onClientReady() {
  connectedCount++;
  if (connectedCount === 2) {
    // Wait for drift calibration to complete (2.5 seconds)
    console.log('[TEST] Calibrating clock drifts...');
    setTimeout(startTest, 2500);
  }
}

wsA.on('open', () => {
  wsA.send(JSON.stringify({
    type: 'join_match',
    matchId,
    playerId: 'player_a',
    name: 'Player A',
    avatarUrl: '',
    colour: 'blue',
    allPlayers
  }));
  setupHeartbeat(wsA, 'Client A', (d) => { driftA = d; });
  onClientReady();
});

wsB.on('open', () => {
  wsB.send(JSON.stringify({
    type: 'join_match',
    matchId,
    playerId: 'player_b',
    name: 'Player B',
    avatarUrl: '',
    colour: 'green',
    allPlayers
  }));
  setupHeartbeat(wsB, 'Client B', (d) => { driftB = d; });
  onClientReady();
});

// Client B listens to dice results to record T4 & T5
wsB.on('message', (data) => {
  const t4 = Date.now(); // T4: Socket received message
  const msg = JSON.parse(data);
  if (msg.type === 'dice_result') {
    // T5: Visual queue executes (decoupled, so it runs immediately on frame arrival)
    const t5 = Date.now();
    
    rollsRecorded.push({
      rollNum: currentRollIndex,
      t0: msg.clientT0,
      t1: msg.clientT1,
      t2: msg.serverT2,
      t3: msg.serverT3,
      t4: t4,
      t5: t5,
      senderDrift: msg.senderDrift,
      receiverDrift: driftB
    });

    // Schedule next roll after turn resolve buffer
    setTimeout(triggerNextRoll, 1000);
  }
});

function printResultsTable() {
  console.log(`\n=================== LATENCY RESULTS: ${serverType.toUpperCase()} SERVER ===================`);
  console.log('| Roll | T1-T0 (ms) | T2-T1 (Net A->S) | T3-T2 (Server CPU) | T4-T3 (Net S->B) | T5-T4 (Queue) |');
  console.log('|------|------------|------------------|--------------------|------------------|---------------|');
  
  rollsRecorded.forEach((r) => {
    const t1_t0 = r.t1 - r.t0;
    
    // Corrected client to server latency using drift calibration
    const t1_server = r.t1 - r.senderDrift;
    const t2_t1 = Math.max(0, Math.round(r.t2 - t1_server));
    
    const t3_t2 = r.t3 - r.t2;
    
    // Corrected server to client latency using drift calibration
    const t3_clientB = r.t3 + r.receiverDrift;
    const t4_t3 = Math.max(0, Math.round(r.t4 - t3_clientB));
    
    const t5_t4 = r.t5 - r.t4;
    
    console.log(`| #${String(r.rollNum).padEnd(2)} | ${String(t1_t0).padEnd(10)} | ${String(t2_t1).padEnd(16)} | ${String(t3_t2).padEnd(18)} | ${String(t4_t3).padEnd(16)} | ${String(t5_t4).padEnd(13)} |`);
  });
  console.log('=========================================================================\n');
}
