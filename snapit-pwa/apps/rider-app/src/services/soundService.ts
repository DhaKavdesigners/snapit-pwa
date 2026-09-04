/**
 * Snapit Audio & Haptic Feedback Engine
 * Uses Web Audio API (Zero external MP3 dependencies) + Navigator Vibration API
 */

class SoundEngine {
  private audioCtx: AudioContext | null = null;
  private alertInterval: any = null;
  private isBuzzerActive: boolean = false;
  private currentBuzzerOrderId: string | null = null;
  private buzzerGain: GainNode | null = null;
  private handledOrders: Set<string> = new Set();
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
    if (!this.isBuzzerActive) return;

    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Master gain node for the buzzer to allow instantaneous mute on stop
      if (this.buzzerGain) {
        try {
          this.buzzerGain.disconnect();
        } catch {}
      }
      this.buzzerGain = ctx.createGain();
      this.buzzerGain.gain.setValueAtTime(1, now);
      this.buzzerGain.connect(ctx.destination);

      // Tone 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(880, now); // A5
      osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.15); // E6
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(this.buzzerGain);
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
      gain2.connect(this.buzzerGain);
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
  public startIncomingOrderBuzzer(orderId?: string | null) {
    const idKey = orderId ? String(orderId).trim() : 'pending-order';

    // If order was already handled (accepted or declined), NEVER buzz again
    if (orderId && this.handledOrders.has(idKey)) {
      return;
    }

    // If already delivered, NEVER buzz
    if (orderId && this.playedDeliveredOrders.has(idKey)) {
      return;
    }

    // If already buzzing for this exact order, avoid re-triggering loop
    if (this.isBuzzerActive && this.currentBuzzerOrderId === idKey) {
      return;
    }

    this.stopIncomingOrderBuzzer();

    this.isBuzzerActive = true;
    this.currentBuzzerOrderId = idKey;

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

    if (this.alertInterval !== null) {
      clearInterval(this.alertInterval);
      if (typeof window !== 'undefined') {
        window.clearInterval(this.alertInterval);
      }
      this.alertInterval = null;
    }

    if (this.buzzerGain) {
      try {
        const ctx = this.audioCtx;
        if (ctx) {
          this.buzzerGain.gain.cancelScheduledValues(ctx.currentTime);
          this.buzzerGain.gain.setValueAtTime(0, ctx.currentTime);
        }
        this.buzzerGain.disconnect();
      } catch {}
      this.buzzerGain = null;
    }

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(0); // Cancel vibration
      } catch {}
    }
  }

  /**
   * Mark an order as handled (Accepted or Declined).
   * Stops buzzer immediately and prevents this order from ever buzzing again.
   */
  public markOrderHandled(orderId?: string | null) {
    if (orderId) {
      this.handledOrders.add(String(orderId).trim());
    }
    this.stopIncomingOrderBuzzer();
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
    this.stopIncomingOrderBuzzer();
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
  public playDeliveredSound(orderId?: string | null, orderNumber?: string | null) {
    // Stop any buzzer immediately
    this.stopIncomingOrderBuzzer();

    const idKey = orderId ? String(orderId).trim() : null;
    const numKey = orderNumber ? String(orderNumber).trim() : null;

    if (idKey && this.playedDeliveredOrders.has(idKey)) return;
    if (numKey && this.playedDeliveredOrders.has(numKey)) return;

    if (idKey) this.playedDeliveredOrders.add(idKey);
    if (numKey) this.playedDeliveredOrders.add(numKey);

    this.playPayoutChime();
  }
}

const globalObj = typeof window !== 'undefined' ? window : (globalThis as any);
export const soundEngine: SoundEngine =
  globalObj.__SNAPIT_SOUND_ENGINE__ || (globalObj.__SNAPIT_SOUND_ENGINE__ = new SoundEngine());
