/**
 * Web Audio API synthesizer for merchant counter notifications.
 * Pure Web Audio implementation - zero external audio asset dependencies.
 */

class CounterAudioManager {
  private audioCtx: AudioContext | null = null;
  private alarmInterval: number | null = null;
  private isAlarmRunning: boolean = false;
  private isMuted: boolean = false;

  // Overdue audio management with 10s sound / 20s silence cycle
  private overdueOrders = new Set<string>();
  private overdueCycleTimeout: number | null = null;
  private overdueBeepInterval: number | null = null;
  private isCycleActive: boolean = false;
  private lastWarningPlayedAt: number = 0;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopPendingOrderAlarm();
      this.stopAllOverdueAlarms();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Continuous looping chime for incoming pending orders (PLACED)
   */
  public playPendingOrderAlarm(): void {
    if (this.isMuted || this.isAlarmRunning) return;
    this.isAlarmRunning = true;

    const playTone = () => {
      if (!this.isAlarmRunning || this.isMuted) return;
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Dual-tone high urgency ringer (E6 - G6)
      const freqs = [1318.51, 1567.98, 1760.00];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.12 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.4);
      });
    };

    // Initial chime
    playTone();
    // Repeat every 1.6 seconds
    this.alarmInterval = window.setInterval(playTone, 1600);
  }

  /**
   * Stops the looping pending order alarm
   */
  public stopPendingOrderAlarm(): void {
    this.isAlarmRunning = false;
    if (this.alarmInterval !== null) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
  }

  /**
   * Crisp confirmation chime on order acceptance
   */
  public playActionChime(): void {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5 major chord

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.45);
    });
  }

  /**
   * Upbeat chime when order is marked ready for rider pickup
   */
  public playReadyDispatchChime(): void {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(0, now + idx * 0.07);
      gain.gain.linearRampToValueAtTime(0.22, now + idx * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.4);
    });
  }

  /**
   * Slight warning sound when order is approaching prep time deadline
   */
  public playSlightWarningSound(): void {
    if (this.isMuted) return;
    const nowMs = Date.now();
    if (nowMs - this.lastWarningPlayedAt < 15000) return;
    this.lastWarningPlayedAt = nowMs;

    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [880, 1108.73].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.18);

      gain.gain.setValueAtTime(0, now + idx * 0.18);
      gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.18 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.18 + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.18);
      osc.stop(now + idx * 0.18 + 0.35);
    });
  }

  /**
   * Play a single pulse of the loud overdue alarm tone
   */
  private playOverdueTone(): void {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Rapid urgent double tone
    [987.77, 1318.51].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.15);

      gain.gain.setValueAtTime(0, now + idx * 0.15);
      gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.15 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.15);
      osc.stop(now + idx * 0.15 + 0.25);
    });
  }

  /**
   * Run the 10 seconds ON / 20 seconds OFF overdue audio cycle
   */
  private runOverdueDutyCycle(): void {
    if (this.overdueOrders.size === 0 || this.isMuted) {
      this.isCycleActive = false;
      return;
    }
    this.isCycleActive = true;

    // 1. Play sound repeatedly for 10 seconds
    this.playOverdueTone();
    this.overdueBeepInterval = window.setInterval(() => {
      if (this.overdueOrders.size > 0 && !this.isMuted) {
        this.playOverdueTone();
      }
    }, 1200);

    // 2. Stop playing after 10 seconds and pause for 20 seconds
    this.overdueCycleTimeout = window.setTimeout(() => {
      if (this.overdueBeepInterval !== null) {
        clearInterval(this.overdueBeepInterval);
        this.overdueBeepInterval = null;
      }

      // If overdue orders still exist, wait 20s silence then start next 10s sound burst
      if (this.overdueOrders.size > 0 && !this.isMuted) {
        this.overdueCycleTimeout = window.setTimeout(() => {
          this.runOverdueDutyCycle();
        }, 20000); // 20s gap
      } else {
        this.isCycleActive = false;
      }
    }, 10000); // 10s active sound
  }

  /**
   * Register an order as overdue (Starts 10s sound / 20s gap cycle if not running)
   */
  public registerOverdueOrder(orderId: string): void {
    this.overdueOrders.add(orderId);
    if (!this.isCycleActive && !this.isMuted) {
      this.runOverdueDutyCycle();
    }
  }

  /**
   * Unregister an order when marked ready for pickup
   * Only stops alarm if no other orders are overdue!
   */
  public unregisterOverdueOrder(orderId: string): void {
    this.overdueOrders.delete(orderId);
    if (this.overdueOrders.size === 0) {
      this.stopAllOverdueAlarms();
    }
  }

  /**
   * Hard stop for all overdue alarms
   */
  public stopAllOverdueAlarms(): void {
    this.overdueOrders.clear();
    this.isCycleActive = false;
    if (this.overdueBeepInterval !== null) {
      clearInterval(this.overdueBeepInterval);
      this.overdueBeepInterval = null;
    }
    if (this.overdueCycleTimeout !== null) {
      clearTimeout(this.overdueCycleTimeout);
      this.overdueCycleTimeout = null;
    }
  }

  // Alias for backward compatibility
  public playOverdueAlarm(orderId?: string): void {
    this.registerOverdueOrder(orderId || 'default');
  }

  public stopOverdueAlarm(orderId?: string): void {
    if (orderId) {
      this.unregisterOverdueOrder(orderId);
    } else {
      this.stopAllOverdueAlarms();
    }
  }

  /**
   * Low tone sound for order rejection / cancellation
   */
  public playCancelSound(): void {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.3);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }
}

export const counterAudio = new CounterAudioManager();
