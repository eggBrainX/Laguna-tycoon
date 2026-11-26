import { MusicTrack } from './types';

class LagunaAudioEngine {
  private ctx: AudioContext | null = null;
  private musicTimer: number | null = null;
  private stepIdx = 0;
  private currentTrack: MusicTrack = 'akuatik';
  private isPlayingMusic = false;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.08,
    delay = 0,
    slideToFreq?: number
  ) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideToFreq) {
      osc.frequency.exponentialRampToValueAtTime(slideToFreq, t + duration);
    }
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  playSfx(
    kind: 'bubble' | 'buy' | 'hatch' | 'deal' | 'discovery' | 'magic' | 'cure' | 'error' | 'click',
    enabled: boolean
  ) {
    if (!enabled) return;
    switch (kind) {
      case 'click':
        this.playTone(540, 0.06, 'sine', 0.04, 0, 680);
        break;
      case 'bubble':
        this.playTone(360 + Math.random() * 140, 0.12, 'sine', 0.06, 0, 740);
        break;
      case 'buy':
        this.playTone(523.25, 0.09, 'triangle', 0.07, 0);
        this.playTone(659.25, 0.12, 'triangle', 0.07, 0.07);
        break;
      case 'hatch':
        this.playTone(440, 0.12, 'sine', 0.06, 0, 880);
        this.playTone(660, 0.14, 'sine', 0.06, 0.08, 1046);
        this.playTone(880, 0.16, 'sine', 0.05, 0.16);
        break;
      case 'deal':
        this.playTone(523.25, 0.10, 'triangle', 0.09, 0);
        this.playTone(659.25, 0.10, 'triangle', 0.09, 0.08);
        this.playTone(783.99, 0.12, 'triangle', 0.09, 0.16);
        this.playTone(1046.5, 0.25, 'triangle', 0.10, 0.24);
        break;
      case 'discovery':
        this.playTone(587.33, 0.12, 'sine', 0.08, 0);
        this.playTone(739.99, 0.12, 'sine', 0.08, 0.1);
        this.playTone(880, 0.22, 'triangle', 0.09, 0.2);
        this.playTone(1174.66, 0.35, 'sine', 0.09, 0.32);
        break;
      case 'magic':
        [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.5].forEach((f, i) => {
          this.playTone(f, 0.28, 'sine', 0.08, i * 0.08);
        });
        break;
      case 'cure':
        this.playTone(493.88, 0.12, 'sine', 0.07, 0);
        this.playTone(659.25, 0.18, 'sine', 0.08, 0.1);
        break;
      case 'error':
        this.playTone(220, 0.14, 'sawtooth', 0.05, 0, 170);
        break;
    }
  }

  startMusic(track: MusicTrack) {
    if (this.isPlayingMusic && this.currentTrack === track) return;
    this.stopMusic();
    this.currentTrack = track;
    this.isPlayingMusic = true;
    this.stepIdx = 0;

    const scales: Record<MusicTrack, { notes: number[]; tempoMs: number; wave: OscillatorType }> = {
      akuatik: {
        notes: [261.63, 329.63, 392.0, 493.88, 392.0, 329.63, 293.66, 392.0],
        tempoMs: 560,
        wave: 'sine',
      },
      samudra: {
        notes: [220.0, 261.63, 329.63, 392.0, 349.23, 293.66, 261.63, 246.94],
        tempoMs: 680,
        wave: 'sine',
      },
      ceria: {
        notes: [392.0, 440.0, 493.88, 587.33, 523.25, 493.88, 440.0, 392.0],
        tempoMs: 380,
        wave: 'triangle',
      },
      ajaib: {
        notes: [329.63, 415.3, 493.88, 659.25, 587.33, 493.88, 415.3, 392.0],
        tempoMs: 520,
        wave: 'sine',
      },
    };

    const cfg = scales[track];
    this.musicTimer = window.setInterval(() => {
      if (!this.isPlayingMusic) return;
      const note = cfg.notes[this.stepIdx % cfg.notes.length];
      this.playTone(note, cfg.tempoMs / 1000 * 1.1, cfg.wave, 0.028);
      this.stepIdx += 1;
    }, cfg.tempoMs);
  }

  stopMusic() {
    this.isPlayingMusic = false;
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

export const audioEngine = new LagunaAudioEngine();
