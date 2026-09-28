// Synthesized Broadcast Game Show & Afrobeats Rhythm Sound Engine (Web Audio API)
// Every method is wrapped in try/catch so audio restrictions can never block UI interactions.

class SoundEffectsEngine {
  private ctx: AudioContext | null = null;
  private beatIntervalId: number | null = null;
  public muted: boolean = false;

  private getContext(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public stopAfrobeatLoop() {
    if (this.beatIntervalId !== null) {
      window.clearInterval(this.beatIntervalId);
      this.beatIntervalId = null;
    }
  }

  public stopAfrobeatsLoop() {
    this.stopAfrobeatLoop();
  }

  // Subtle UI click sound for responsive button feedback
  public playSelect() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.045);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.055);
    } catch {
      // Ignore audio errors
    }
  }

  // Synthesizes an upbeat Afrobeats / Amapiano log-drum & melody loop for the Naija Song Game
  public startAfrobeatLoop(bpm = 112, seedIndex = 0) {
    try {
      this.stopAfrobeatLoop();
      const ctx = this.getContext();
      if (!ctx) return;

      const stepDurationMs = (60 / bpm / 4) * 1000; // 16th note steps
      let step = 0;

      const scales = [
        [261.63, 293.66, 329.63, 392.0, 440.0], // C major pentatonic
        [293.66, 329.63, 349.23, 440.0, 493.88], // D dorian
        [246.94, 293.66, 329.63, 369.99, 440.0], // B minor
        [220.0, 261.63, 293.66, 329.63, 392.0], // A minor pentatonic
      ];
      const scale = scales[seedIndex % scales.length];

      const playStep = () => {
        if (this.muted) return;
        try {
          const audioCtx = this.getContext();
          if (!audioCtx) return;

          const now = audioCtx.currentTime;
          const s = step % 16;

          // 1. Kick / Amapiano Log Drum on syncopated Afrobeats pattern (0, 3, 6, 10, 12)
          if ([0, 3, 6, 10, 12].includes(s)) {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            const baseFreq = s === 10 || s === 12 ? 92 : 68;
            osc.frequency.setValueAtTime(baseFreq * 1.8, now);
            osc.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.14);

            gain.gain.setValueAtTime(0.24, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.24);
          }

          // 2. Afrobeats Rimshot / Clave pattern (2, 6, 9, 14)
          if ([2, 6, 9, 14].includes(s)) {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(820, now);
            osc.frequency.exponentialRampToValueAtTime(320, now + 0.04);

            gain.gain.setValueAtTime(0.11, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.05);
          }

          // 3. Bright Marimba / Pluck Melody Hook
          if ([0, 2, 5, 7, 10, 13, 15].includes(s)) {
            const noteFreq = scale[(s + seedIndex) % scale.length] * 2;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(noteFreq, now);

            gain.gain.setValueAtTime(0.001, now);
            gain.gain.exponentialRampToValueAtTime(0.12, now + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.2);
          }

          step++;
        } catch {
          // Ignore step errors
        }
      };

      playStep();
      this.beatIntervalId = window.setInterval(playStep, stepDurationMs);
    } catch {
      // Ignore loop errors
    }
  }

  public startAfrobeatsLoop(bpm = 112, seedIndex = 0) {
    this.startAfrobeatLoop(bpm, seedIndex);
  }

  // Crisp game-show board flip & correct reveal chime
  public playRevealChime() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + idx * 0.055);

        gain.gain.setValueAtTime(0.001, now + idx * 0.055);
        gain.gain.exponentialRampToValueAtTime(0.16, now + idx * 0.055 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.055 + 0.38);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.055);
        osc.stop(now + idx * 0.055 + 0.4);
      });
    } catch {
      // Ignore audio errors
    }
  }

  public playReveal() {
    this.playRevealChime();
  }

  // Classic Survey Feud Strike Buzzer ("X")
  public playStrikeBuzzer() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const freqs = [110, 116.54];
      freqs.forEach((f) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, now);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.58);
      });
    } catch {
      // Ignore audio errors
    }
  }

  public playStrike() {
    this.playStrikeBuzzer();
  }

  // Hint reveal chime
  public playHintChime() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [659.25, 880];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0.001, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.14, now + i * 0.08 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.28);
      });
    } catch {
      // Ignore audio errors
    }
  }

  public playHintReveal() {
    this.playHintChime();
  }

  // Countdown clock tick
  public playTimerTick(urgent = false) {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(urgent ? 987.77 : 659.25, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // Ignore audio errors
    }
  }

  // Mechanical prize wheel peg click
  public playWheelPegClick(pitchFactor = 1) {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(420 * Math.max(0.5, pitchFactor), now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.035);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.038);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // Ignore audio errors
    }
  }

  public playWheelTick(progress = 0.5) {
    this.playWheelPegClick(1 + (1 - progress) * 0.4);
  }

  // Celebratory Grand Winner Fanfare
  public playWinnerFanfare() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const sequence = [
        { f: 523.25, t: 0, d: 0.12 },
        { f: 523.25, t: 0.14, d: 0.12 },
        { f: 523.25, t: 0.28, d: 0.12 },
        { f: 783.99, t: 0.42, d: 0.28 },
        { f: 659.25, t: 0.72, d: 0.22 },
        { f: 1046.5, t: 0.96, d: 0.65 },
      ];

      sequence.forEach(({ f, t, d }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + t);

        gain.gain.setValueAtTime(0.001, now + t);
        gain.gain.exponentialRampToValueAtTime(0.2, now + t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + t + d);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + t);
        osc.stop(now + t + d + 0.02);
      });
    } catch {
      // Ignore audio errors
    }
  }

  public playFanfare() {
    this.playWinnerFanfare();
  }

  // Studio Soundboard: Drumroll
  public playDrumroll() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const steps = 18;
      for (let i = 0; i < steps; i++) {
        const t = now + i * 0.045;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150 + (i / steps) * 90, t);
        gain.gain.setValueAtTime(0.05 + (i / steps) * 0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.042);
      }
    } catch {
      // Ignore audio errors
    }
  }
}

export const soundFX = new SoundEffectsEngine();
