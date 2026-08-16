/**
 * audio.ts — Web Audio API chimes for SnapIt Rider App
 *
 * Zero external audio files. All sounds synthesized via oscillators.
 * Sounds are designed to be heard over bike engine noise.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  // Resume context after user gesture (browser policy)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/** Creates a simple gain + oscillator chain with an envelope */
function playTone(
  frequency: number,
  duration: number,
  gain: number,
  type: OscillatorType = 'sine',
  startTime?: number,
): void {
  try {
    const ctx = getAudioContext();
    const t = startTime ?? ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, t);

    // ADSR envelope
    gainNode.gain.setValueAtTime(0, t);
    gainNode.gain.linearRampToValueAtTime(gain, t + 0.02);
    gainNode.gain.setValueAtTime(gain, t + duration - 0.05);
    gainNode.gain.linearRampToValueAtTime(0, t + duration);

    osc.start(t);
    osc.stop(t + duration);
  } catch {
    // Silently fail if AudioContext is unavailable (e.g., test env)
  }
}

/**
 * DISPATCH CHIME — Loud, distinct 3-note ascending arpeggio.
 * Triggered when an order transitions to READY_FOR_PICKUP.
 * Designed to be audible above ambient motorcycle engine noise.
 */
export function playDispatchChime(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Ascending arpeggio: G4 → B4 → D5 with triangle wave (cuts through noise)
    playTone(392.0, 0.18, 0.7, 'triangle', now + 0.00);
    playTone(493.9, 0.18, 0.7, 'triangle', now + 0.15);
    playTone(587.3, 0.30, 0.8, 'triangle', now + 0.30);

    // Sub-bass pulse for haptic feel on cheap phone speakers
    playTone(98.0, 0.10, 0.4, 'square', now + 0.00);
    playTone(98.0, 0.10, 0.4, 'square', now + 0.30);
  } catch {
    // Silently fail
  }
}

/**
 * DELIVERED CHIME — Crisp 0.5s success tone.
 * Triggered on successful 4-digit PIN handshake → order marked DELIVERED.
 * Subtle dopamine hit — pleasant but not disruptive.
 */
export function playDeliveredChime(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Rising two-note: E5 → G5 (success feel)
    playTone(659.3, 0.15, 0.5, 'sine', now + 0.00);
    playTone(783.9, 0.35, 0.45, 'sine', now + 0.12);
  } catch {
    // Silently fail
  }
}

/**
 * ONLINE TOGGLE CHIME — Soft confirmation when rider goes online.
 */
export function playOnlineChime(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    playTone(523.3, 0.12, 0.35, 'sine', now + 0.0);
    playTone(659.3, 0.15, 0.3, 'sine', now + 0.1);
  } catch {
    // Silently fail
  }
}

/**
 * ERROR PING — Short negative buzz for wrong PIN.
 */
export function playErrorPing(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    playTone(220.0, 0.18, 0.4, 'sawtooth', now);
  } catch {
    // Silently fail
  }
}

/** Call once on first user interaction to unlock AudioContext on iOS/Android */
export function unlockAudio(): void {
  try {
    getAudioContext();
  } catch {
    // Silently fail
  }
}
