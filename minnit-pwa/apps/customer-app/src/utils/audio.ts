/**
 * Web Audio sound engine for Minnit PWA.
 * Synthesizes tones natively using the Web Audio API without needing external MP3 files.
 */

/**
 * Synthesizes a soft, melancholic "apology" tone when a merchant cancels/rejects an order.
 * Uses a gentle descending minor phrase with warm acoustic filtering and an emotional sigh decay.
 * Guaranteed 100% offline and low-latency across iOS Safari, Android Chrome, and Desktop.
 */
export const playSadApologyTone = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // Warm biquad lowpass filter for gentle, non-abrasive sound
    const masterFilter = ctx.createBiquadFilter();
    masterFilter.type = 'lowpass';
    masterFilter.frequency.setValueAtTime(950, ctx.currentTime);

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.28, ctx.currentTime);

    masterFilter.connect(masterGain);
    masterGain.connect(ctx.destination);

    // Empathetic descending melody: A4 -> G4 -> E4 -> C4 (melancholic release)
    const notes = [
      { freq: 440.00, start: 0.00, dur: 0.38, vol: 0.22 }, // A4
      { freq: 392.00, start: 0.28, dur: 0.42, vol: 0.24 }, // G4
      { freq: 329.63, start: 0.62, dur: 0.50, vol: 0.26 }, // E4
      { freq: 261.63, start: 1.02, dur: 1.10, vol: 0.30 }, // C4 (resolving downward sigh)
    ];

    notes.forEach(({ freq, start, dur, vol }) => {
      const startTime = ctx.currentTime + start;
      const stopTime = startTime + dur;

      // Triangle oscillator for acoustic mellowness
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      // Subtle pitch bend downwards (sigh effect)
      osc.frequency.exponentialRampToValueAtTime(freq * 0.985, stopTime);

      // Deep warm sub-tone
      const subOsc = ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(freq / 2, startTime);

      const noteGain = ctx.createGain();
      noteGain.gain.setValueAtTime(0, startTime);
      noteGain.gain.linearRampToValueAtTime(vol, startTime + 0.05);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, stopTime);

      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0, startTime);
      subGain.gain.linearRampToValueAtTime(vol * 0.35, startTime + 0.08);
      subGain.gain.exponentialRampToValueAtTime(0.0001, stopTime);

      osc.connect(noteGain);
      noteGain.connect(masterFilter);

      subOsc.connect(subGain);
      subGain.connect(masterFilter);

      osc.start(startTime);
      osc.stop(stopTime);

      subOsc.start(startTime);
      subOsc.stop(stopTime);
    });

    // Cleanup AudioContext after playback
    setTimeout(() => {
      if (ctx.state !== 'closed') {
        ctx.close().catch(() => {});
      }
    }, 2600);
  } catch (err) {
    console.warn('Sad apology tone audio synthesis error:', err);
  }
};

/**
 * Joyful chime when an order is placed or delivered successfully.
 */
export const playSuccessChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    [
      { freq: 523.25, t: 0, dur: 0.20 },
      { freq: 659.25, t: 0.12, dur: 0.20 },
      { freq: 783.99, t: 0.24, dur: 0.25 },
      { freq: 1046.50, t: 0.38, dur: 0.65 },
    ].forEach(({ freq, t, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + t);
      gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + dur);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + dur);
    });

    setTimeout(() => {
      if (ctx.state !== 'closed') {
        ctx.close().catch(() => {});
      }
    }, 1500);
  } catch (err) {
    console.warn('Success chime audio synthesis error:', err);
  }
};
