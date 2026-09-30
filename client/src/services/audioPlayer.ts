import { NoteEvent } from '../types/transcription';

export class GuitarAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private startTime: number = 0;
  private pauseTime: number = 0;
  private speed: number = 1.0;
  private metronomeEnabled: boolean = false;
  private loopRange: [number, number] | null = null;
  private events: NoteEvent[] = [];
  private tuningMidi: number[] = [40, 45, 50, 55, 59, 64]; // E A D G B E
  private scheduledSources: OscillatorNode[] = [];

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setEvents(events: NoteEvent[], tuningMidi: number[]) {
    this.events = events;
    this.tuningMidi = tuningMidi;
  }

  public setSpeed(speed: number) {
    this.speed = Math.max(0.25, Math.min(1.5, speed));
  }

  public setLoop(range: [number, number] | null) {
    this.loopRange = range;
  }

  public setMetronome(enabled: boolean) {
    this.metronomeEnabled = enabled;
  }

  public play(fromSec: number = 0) {
    this.initContext();
    if (!this.ctx) return;

    this.isPlaying = true;
    this.startTime = this.ctx.currentTime - (fromSec / this.speed);
    this.pauseTime = fromSec;
  }

  public pause() {
    if (this.ctx && this.isPlaying) {
      this.pauseTime = (this.ctx.currentTime - this.startTime) * this.speed;
      this.isPlaying = false;
      this.stopScheduledNotes();
    }
  }

  public seek(toSec: number) {
    this.pauseTime = toSec;
    if (this.ctx && this.isPlaying) {
      this.startTime = this.ctx.currentTime - (toSec / this.speed);
    }
  }

  public getCurrentTime(): number {
    if (!this.ctx || !this.isPlaying) return this.pauseTime;
    const current = (this.ctx.currentTime - this.startTime) * this.speed;

    // Loop check
    if (this.loopRange) {
      const [loopStart, loopEnd] = this.loopRange;
      if (current >= loopEnd) {
        this.seek(loopStart);
        return loopStart;
      }
    }
    return current;
  }

  public playPluckedString(stringIdx: number, fret: number, duration: number = 0.5, velocity: number = 100) {
    this.initContext();
    if (!this.ctx) return;

    const midiPitch = this.tuningMidi[stringIdx] + fret;
    const freq = 440 * Math.pow(2, (midiPitch - 69) / 12);

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Guitar-like harmonic timbre (triangle + lowpass filter decay)
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 4, now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(100, freq * 0.8), now + duration);

    const baseGain = (velocity / 127) * 0.3;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(baseGain, now + 0.005); // Rapid pluck attack
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration); // Natural string ring decay

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  public playMetronomeTick(high: boolean = false) {
    this.initContext();
    if (!this.ctx || !this.metronomeEnabled) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(high ? 1600 : 800, now);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  private stopScheduledNotes() {
    this.scheduledSources.forEach(s => {
      try { s.stop(); } catch {}
    });
    this.scheduledSources = [];
  }
}
