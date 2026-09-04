/**
 * Snapit Audio & Haptic Feedback Engine
 * Uses Web Audio API (Zero external MP3 dependencies) + Navigator Vibration API
 */

class SoundEngine {
  private audioCtx: AudioContext | null = null;
  private alertInterval: ReturnType<typeof setInterval> | null = null;
  private isBuzzerActive: boolean = false;
  private currentBuzzerOrderId: string | null = null;
  private playedDeliveredOrders: Set<string> = new Set();

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Play urgent incoming order delivery chime
   */
  public playIncomingOrderBeep() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Tone 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(880, now); // A5
      osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.15); // E6
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      // Tone 2
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1174.66, now + 0.12); // D6
      osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.35); // A6
      gain2.gain.setValueAtTime(0.4, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.45);

      // Haptic Vibration for Mobile Devices
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([250, 100, 250]);
      }
    } catch (e) {
      // Audio playback blocked before user interaction
    }
  }

  /**
   * Start looping incoming order buzzer
   * Deduplicates by orderId to prevent multiple overlapping audio loops.
   */
  public startIncomingOrderBuzzer(orderId?: string) {
    if (orderId && this.isBuzzerActive && this.currentBuzzerOrderId === orderId) {
      return; // Already buzzing for this exact order
    }

    this.stopIncomingOrderBuzzer();

    this.isBuzzerActive = true;
    this.currentBuzzerOrderId = orderId || 'pending-order';

    this.playIncomingOrderBeep();
    this.alertInterval = setInterval(() => {
      if (!this.isBuzzerActive) {
        this.stopIncomingOrderBuzzer();
        return;
      }
      this.playIncomingOrderBeep();
    }, 1200);
  }

  /**
   * Immediately stops incoming order notification buzzer
   */
  public stopIncomingOrderBuzzer() {
    this.isBuzzerActive = false;
    this.currentBuzzerOrderId = null;

    if (this.alertInterval) {
      clearInterval(this.alertInterval);
      this.alertInterval = null;
    }

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(0); // Cancel vibration
      } catch {}
    }
  }

  // Backward-compatible aliases
  public startIncomingOrderRingtone(orderId?: string) {
    this.startIncomingOrderBuzzer(orderId);
  }

  public stopIncomingOrderRingtone() {
    this.stopIncomingOrderBuzzer();
  }

  /**
   * Play positive confirmation chime (Order Accepted, Ready, Pickup)
   */
  public playSuccessChime() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      osc.frequency.setValueAtTime(1046.5, now + 0.3); // C6

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);

      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(100);
      }
    } catch {}
  }

  /**
   * Play celebratory cashout / delivery completed payout chime
   * Non-looping, single shot.
   */
  public playPayoutChime() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Coin shimmer 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(987.77, now); // B5
      osc1.frequency.exponentialRampToValueAtTime(1318.51, now + 0.15); // E6
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // Coin shimmer 2
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1567.98, now + 0.1); // G6
      osc2.frequency.exponentialRampToValueAtTime(2093.0, now + 0.35); // C7
      gain2.gain.setValueAtTime(0.35, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.5);

      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([100, 50, 150]);
      }
    } catch {}
  }

  /**
   * Play ONE short coin/success sound when transitioning to DELIVERED.
   * Guarantees buzzer is stopped, does not loop, and deduplicates so it plays exactly once per order.
   */
  public playDeliveredSound(orderId?: string) {
    // Stop any buzzer immediately
    this.stopIncomingOrderBuzzer();

    if (orderId) {
      if (this.playedDeliveredOrders.has(orderId)) {
        return; // Already played for this order
      }
      this.playedDeliveredOrders.add(orderId);
    }

    this.playPayoutChime();
  }
}

export const soundEngine = new SoundEngine();
