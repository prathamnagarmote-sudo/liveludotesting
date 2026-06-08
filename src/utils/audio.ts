let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playEngineSound() {
  try {
    const ctx = getAudioContext();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc1.type = 'sawtooth';
    osc2.type = 'triangle';

    const now = ctx.currentTime;

    // Pitch sweep: F1 engine revving up
    osc1.frequency.setValueAtTime(90, now);
    osc1.frequency.exponentialRampToValueAtTime(350, now + 0.2);
    osc2.frequency.setValueAtTime(92, now);
    osc2.frequency.exponentialRampToValueAtTime(352, now + 0.2);

    // Filter to emulate low throttle tone
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(700, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.2);

    // Quick volume envelope
    gainNode.gain.setValueAtTime(0.08, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.21);
    osc2.stop(now + 0.21);
  } catch (e) {
    console.error('Audio error:', e);
  }
}

export function playCrashSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // 1. Screech (Noise)
    const bufferSize = ctx.sampleRate * 0.25;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = buffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1200, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(700, now + 0.25);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.06, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    noiseNode.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    // 2. Impact (Low rumble)
    const osc = ctx.createOscillator();
    const impactGain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(30, now + 0.3);

    impactGain.gain.setValueAtTime(0.12, now);
    impactGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(impactGain);
    impactGain.connect(ctx.destination);

    noiseNode.start(now);
    osc.start(now);
    osc.stop(now + 0.31);
  } catch (e) {
    console.error('Audio error:', e);
  }
}

export function playDiceRollSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Turbo spool
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.25);

    gainNode.gain.setValueAtTime(0.04, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);

    // Blow-off valve (hiss) starting at spool end
    setTimeout(() => {
      try {
        const hissCtx = getAudioContext();
        const hissNow = hissCtx.currentTime;
        const size = hissCtx.sampleRate * 0.15;
        const hissBuf = hissCtx.createBuffer(1, size, hissCtx.sampleRate);
        const hissData = hissBuf.getChannelData(0);
        for (let i = 0; i < size; i++) {
          hissData[i] = Math.random() * 2 - 1;
        }
        const hissSource = hissCtx.createBufferSource();
        hissSource.buffer = hissBuf;

        const hissFilter = hissCtx.createBiquadFilter();
        hissFilter.type = 'highpass';
        hissFilter.frequency.setValueAtTime(2000, hissNow);

        const hissGain = hissCtx.createGain();
        hissGain.gain.setValueAtTime(0.05, hissNow);
        hissGain.gain.exponentialRampToValueAtTime(0.001, hissNow + 0.15);

        hissSource.connect(hissFilter);
        hissFilter.connect(hissGain);
        hissGain.connect(hissCtx.destination);

        hissSource.start(hissNow);
      } catch {}
    }, 250);
  } catch (e) {
    console.error('Audio error:', e);
  }
}

export function playVictorySound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const playNote = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.08, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    };

    playNote(523.25, now, 0.1);       // C5
    playNote(659.25, now + 0.12, 0.1);  // E5
    playNote(783.99, now + 0.24, 0.1);  // G5
    playNote(1046.50, now + 0.36, 0.4); // C6
  } catch (e) {
    console.error('Audio error:', e);
  }
}
