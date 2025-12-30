type Tone = { freq: number; duration: number; volume?: number };

const createOsc = (ctx: AudioContext, { freq, duration, volume = 0.18 }: Tone) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.value = volume;
  osc.connect(gain).connect(ctx.destination);
  const now = ctx.currentTime;
  const end = now + duration;
  osc.start(now);
  osc.stop(end);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
};

export class SoundManager {
  private ctx: AudioContext | null = null;

  private getContext() {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  playDamage() {
    const ctx = this.getContext();
    if (!ctx) return;
    createOsc(ctx, { freq: 120, duration: 0.16, volume: 0.22 });
  }

  playCard() {
    const ctx = this.getContext();
    if (!ctx) return;
    createOsc(ctx, { freq: 420, duration: 0.12, volume: 0.16 });
  }

  playTurn() {
    const ctx = this.getContext();
    if (!ctx) return;
    createOsc(ctx, { freq: 680, duration: 0.14, volume: 0.12 });
  }
}
