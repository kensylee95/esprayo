/* ─────────────────────────────────────────────
   🎧 AUDIO CONTEXT
──────────────────────────────────────────── */

export function createAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  return new (
    window.AudioContext ||
    (
      window as unknown as Window & {
        webkitAudioContext: typeof AudioContext;
      }
    ).webkitAudioContext
  )();
}

/* ─────────────────────────────────────────────
   🎵 BASE TONE ENGINE (unchanged)
──────────────────────────────────────────── */

export function playTone(
  ctx: AudioContext,
  type: OscillatorType,
  freqStart: number,
  freqEnd: number,
  gainStart: number,
  duration: number,
  startOffset = 0,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  const t = ctx.currentTime + startOffset;

  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, t);
  osc.frequency.exponentialRampToValueAtTime(freqEnd, t + duration);

  gain.gain.setValueAtTime(gainStart, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

  osc.start(t);
  osc.stop(t + duration);
}
/* ─────────────────────────────────────────────
   💸 CASH / BANKNOTE NOISE ENGINE (LUXURY BASE)
──────────────────────────────────────────── */

function createNoiseBuffer(ctx: AudioContext, duration = 0.25) {
  const sampleRate = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    const t = i / data.length;
    const envelope = Math.sin(Math.PI * t);
    data[i] = (Math.random() * 2 - 1) * envelope * 0.35;
  }

  return buffer;
}

export function playRoomBurstSound(ctx: AudioContext) {
  playTone(ctx, "sine", 660, 880, 0.12, 0.12);
}

export function playNumber1Sound(ctx: AudioContext) {
  [523, 659, 784, 1047].forEach((freq, i) => {
    playTone(ctx, "triangle", freq, freq, 0.25, 0.3, i * 0.08);
  });
}

export function playRivalrySound(ctx: AudioContext) {
  [400, 500].forEach((freq, i) => {
    playTone(ctx, "square", freq, freq, 0.08, 0.1, i * 0.12);
  });
}

/* ─────────────────────────────────────────────
   👑 ODOGWU CASH SOUND (SIGNATURE / LEGENDARY)
──────────────────────────────────────────── */

export function playCashOdogwu(ctx: AudioContext) {
  const now = ctx.currentTime;

  /* ── 1. DEEP AUTHORITY BASS HIT ── */
  playTone(ctx, "sine", 90, 45, 0.18, 0.18, 0);

  /* ── 2. SECONDARY “DROP” IMPACT (Afro rhythm feel) ── */
  playTone(ctx, "triangle", 220, 110, 0.08, 0.12, 0.02);

  /* ── 3. GOLD LUXURY SHIMMER ── */
  playTone(ctx, "sine", 2400, 1600, 0.06, 0.1, 0.03);

  playTone(ctx, "triangle", 1800, 1200, 0.05, 0.14, 0.05);

  /* ── 4. BANKNOTE RUSTLE (controlled luxury noise) ── */
  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(ctx, 0.25);

  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.setValueAtTime(1600, now);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.35, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

  const panner = ctx.createStereoPanner();
  panner.pan.value = Math.random() * 0.4 - 0.2;

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(panner);
  panner.connect(ctx.destination);

  noise.start(now);
  noise.stop(now + 0.25);

  /* ── 5. FINAL “CROWN” HARMONIC (signature identity) ── */
  playTone(
    ctx,
    "sine",
    3136, // high bell-like harmonic
    2093,
    0.04,
    0.18,
    0.06,
  );
}
