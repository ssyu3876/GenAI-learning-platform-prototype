// Agent Dungeon sound: short Web Audio blips plus a procedural background loop.
//
// There are no audio files and no dependency, so nothing has to be shipped or hosted. One
// AudioContext is shared: the old code built (and closed) a context per blip, which is slow
// and runs into the browser's context limit on a long run.
//
// Everything here is a best-effort extra. If a browser blocks audio, or there is no sound
// device at all, the game must keep working, so every entry point swallows its errors.

type Mood = 'map' | 'battle' | 'boss';

/** One step of the loop per mood: tempo, root note, notes and how loud it sits. */
const MOODS: Record<Mood, { step: number; root: number; notes: number[]; gain: number }> = {
  // Open fifths to explore to, a faster pulse once a fight starts, a low tritone for a boss.
  map: { step: 0.54, root: 110, notes: [0, 7, 12, 7, 3, 10], gain: 0.55 },
  battle: { step: 0.32, root: 110, notes: [0, 3, 7, 10, 12, 10], gain: 0.75 },
  boss: { step: 0.26, root: 82.41, notes: [0, 1, 5, 6, 8, 11], gain: 0.95 },
};

/** The loop sits well under the blips so questions stay readable. */
const BGM_LEVEL = 0.08;
const LOOKAHEAD_MS = 120;
const SCHEDULE_AHEAD = 0.25;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;
let volume = 0.5;
let mood: Mood = 'map';
let playing = false;
let step = 0;
let nextNoteAt = 0;
let timer: number | null = null;
let onVisibility: (() => void) | null = null;

function context(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (ctx) return ctx;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = enabled ? volume : 0;
    master.connect(ctx.destination);
  } catch {
    ctx = null;
    master = null;
  }
  return ctx;
}

/** Called from a click so the browser lets the context start. */
export function primeAudio() {
  const ac = context();
  if (ac && ac.state === 'suspended' && enabled) void ac.resume();
}

export function setAudioSettings(next: { enabled: boolean; volume: number }) {
  enabled = next.enabled;
  volume = Math.min(1, Math.max(0, next.volume));
  if (master && ctx) {
    try {
      master.gain.setTargetAtTime(enabled ? volume : 0, ctx.currentTime, 0.02);
    } catch {
      master.gain.value = enabled ? volume : 0;
    }
  }
}

export function playBlip(frequency: number, duration = 120, type: OscillatorType = 'square') {
  if (!enabled) return;
  const ac = context();
  if (!ac || !master) return;
  try {
    if (ac.state === 'suspended') void ac.resume();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const at = ac.currentTime;
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.06, at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration / 1000);
    osc.connect(gain).connect(master);
    osc.start(at);
    osc.stop(at + duration / 1000 + 0.02);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  } catch {
    // Sound is a bonus; never break the game for it.
  }
}

/** A boss's confidence breaking: a rising three-note arpeggio. */
export function playBreak() {
  playBlip(520, 110, 'square');
  window.setTimeout(() => playBlip(880, 160, 'sine'), 80);
  window.setTimeout(() => playBlip(1320, 240, 'sine'), 200);
}

function voice(at: number, frequency: number, length: number, level: number) {
  const ac = ctx;
  if (!ac || !master) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'triangle';
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(level, at + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
  osc.connect(gain).connect(master);
  osc.start(at);
  osc.stop(at + length + 0.05);
  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };
}

/** Schedules a little ahead of the clock so the loop does not stutter on a busy frame. */
function schedule() {
  const ac = ctx;
  if (!ac || !playing || !enabled) return;
  if (nextNoteAt < ac.currentTime) nextNoteAt = ac.currentTime + 0.05;
  const conf = MOODS[mood];
  const horizon = ac.currentTime + SCHEDULE_AHEAD;
  while (nextNoteAt < horizon) {
    const semitones = conf.notes[step % conf.notes.length]!;
    voice(nextNoteAt, conf.root * 2 ** (semitones / 12), conf.step * 1.5, BGM_LEVEL * conf.gain);
    if (step % 4 === 0) {
      voice(nextNoteAt, conf.root / 2, conf.step * 3.4, BGM_LEVEL * conf.gain * 0.9);
    }
    step += 1;
    nextNoteAt += conf.step;
  }
}

function attachVisibility() {
  if (onVisibility) return;
  onVisibility = () => {
    const ac = ctx;
    if (!ac) return;
    if (document.hidden) {
      void ac.suspend();
    } else if (playing && enabled) {
      void ac.resume();
    }
  };
  document.addEventListener('visibilitychange', onVisibility);
}

/** Starts the loop, or switches it to another mood without restarting it. */
export function startBgm(next: Mood) {
  if (typeof window === 'undefined') return;
  const ac = context();
  if (!ac) return;
  const first = !playing;
  playing = true;
  mood = next;
  if (ac.state === 'suspended' && enabled) void ac.resume();
  if (!first) return;
  step = 0;
  nextNoteAt = ac.currentTime + 0.06;
  if (timer === null) timer = window.setInterval(schedule, LOOKAHEAD_MS);
  attachVisibility();
}

export function stopBgm() {
  playing = false;
  if (timer !== null) {
    window.clearInterval(timer);
    timer = null;
  }
  if (onVisibility) {
    document.removeEventListener('visibilitychange', onVisibility);
    onVisibility = null;
  }
}
