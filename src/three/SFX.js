// src/three/SFX.js
let ctx, comp, master;
let sizzle = null;

export async function resumeAudio() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!ctx) {
    ctx = new Ctx();

    // Master chain: compressor -> master gain -> destination
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.knee.value = 12;
    comp.ratio.value = 8;
    comp.attack.value = 0.003;
    comp.release.value = 0.25;

    master = ctx.createGain();
    master.gain.value = 1.15; // overall loudness

    comp.connect(master);
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") await ctx.resume();
  return ctx;
}

function noiseBuffer(c, seconds = 2) {
  const b = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

// Sizzle during fuse burn
export function startSizzle() {
  if (!ctx || sizzle) return;

  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  src.loop = true;

  const hp = ctx.createBiquadFilter();
  hp.type = "highpass"; hp.frequency.value = 800;

  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass"; lp.frequency.value = 4500;

  const g = ctx.createGain(); g.gain.value = 0;

  src.connect(hp); hp.connect(lp); lp.connect(g); g.connect(comp);

  const now = ctx.currentTime;
  g.gain.linearRampToValueAtTime(0.0, now);
  g.gain.linearRampToValueAtTime(0.22, now + 0.15);

  src.start();
  sizzle = { src, g };
}

export function stopSizzle() {
  if (!sizzle || !ctx) return;
  const now = ctx.currentTime;
  sizzle.g.gain.cancelScheduledValues(now);
  sizzle.g.gain.linearRampToValueAtTime(0.0, now + 0.12);
  try { sizzle.src.stop(now + 0.15); } catch {}
  sizzle = null;
}

// BIG boom: layered noise crack + bass drop + high crack
export function playBoom() {
  if (!ctx) return;
  const now = ctx.currentTime;

  // Noise crack
  const nSrc = ctx.createBufferSource();
  nSrc.buffer = noiseBuffer(ctx, 0.5);
  const nLP = ctx.createBiquadFilter(); nLP.type = "lowpass"; nLP.frequency.value = 1400;
  const nG  = ctx.createGain(); nG.gain.value = 1.0;
  nSrc.connect(nLP); nLP.connect(nG); nG.connect(comp);
  nG.gain.setValueAtTime(1.0, now);
  nG.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
  nSrc.start(now); nSrc.stop(now + 0.34);

  // Bass drop (punch)
  const osc = ctx.createOscillator();
  osc.type = "sine";
  const oG = ctx.createGain(); oG.gain.value = 1.0;
  osc.connect(oG); oG.connect(comp);
  osc.frequency.setValueAtTime(160, now);
  osc.frequency.exponentialRampToValueAtTime(45, now + 0.38);
  oG.gain.setValueAtTime(1.0, now);
  oG.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
  osc.start(now); osc.stop(now + 0.4);

  // High crack (presence)
  const osc2 = ctx.createOscillator();
  osc2.type = "triangle";
  const o2G = ctx.createGain(); o2G.gain.value = 0.35;
  osc2.connect(o2G); o2G.connect(comp);
  osc2.frequency.setValueAtTime(2300, now);
  osc2.frequency.exponentialRampToValueAtTime(650, now + 0.14);
  o2G.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
  osc2.start(now); osc2.stop(now + 0.15);
}
