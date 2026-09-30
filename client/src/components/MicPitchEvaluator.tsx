import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, CheckCircle2, AlertCircle, Sparkles, Music, Activity } from 'lucide-react';
import { NoteEvent, ChordEvent } from '../types/transcription';

interface MicPitchEvaluatorProps {
  activeNote: NoteEvent | null;
  activeChord?: ChordEvent | null;
  tuningMidi: number[];
}

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// Chord templates for 12-tone chroma pattern matching
const CHORD_TEMPLATES: { name: string; intervals: number[] }[] = [
  { name: "", intervals: [0, 4, 7] },         // Major (e.g. G, C, D)
  { name: "m", intervals: [0, 3, 7] },        // Minor (e.g. Em, Am, Dm)
  { name: "7", intervals: [0, 4, 7, 10] },    // Dominant 7 (e.g. E7, A7, D7)
  { name: "m7", intervals: [0, 3, 7, 10] },   // Minor 7 (e.g. Em7, Am7)
  { name: "maj7", intervals: [0, 4, 7, 11] }, // Major 7 (e.g. Cmaj7, Gmaj7)
  { name: "sus4", intervals: [0, 5, 7] },     // Sus4 (e.g. Dsus4)
  { name: "sus2", intervals: [0, 2, 7] },     // Sus2 (e.g. Asus2)
  { name: "5", intervals: [0, 7] },           // Power chord (e.g. E5, A5)
];

export const MicPitchEvaluator: React.FC<MicPitchEvaluatorProps> = ({
  activeNote,
  activeChord,
  tuningMidi,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [mode, setMode] = useState<'chord' | 'single' | 'auto'>('auto');
  
  // Single note detection state
  const [detectedPitch, setDetectedPitch] = useState<number | null>(null);
  const [detectedNoteName, setDetectedNoteName] = useState<string>('--');
  
  // Chord detection state
  const [detectedChord, setDetectedChord] = useState<string>('--');
  const [chordConfidence, setChordConfidence] = useState<number>(0);
  const [chromaProfile, setChromaProfile] = useState<number[]>(new Array(12).fill(0));

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Time-domain Autocorrelation for single-note fundamental frequency
  const autoCorrelate = (buf: Float32Array, sampleRate: number): number => {
    const SIZE = buf.length;
    let rms = 0;
    for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.015) return -1; // Gate ambient background noise

    let r1 = 0, r2 = SIZE - 1, thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) {
      if (Math.abs(buf[i]) < thres) { r1 = i; break; }
    }
    for (let i = 1; i < SIZE / 2; i++) {
      if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }
    }

    buf = buf.slice(r1, r2);
    const nSize = buf.length;
    const c = new Array(nSize).fill(0);
    for (let i = 0; i < nSize; i++) {
      for (let j = 0; j < nSize - i; j++) {
        c[i] = c[i] + buf[j] * buf[j + i];
      }
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < nSize; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }
    return sampleRate / maxpos;
  };

  // 12-Tone Chromagram calculation from FFT spectrum for Polyphonic Chord Identification
  const calculateChromaAndChord = (
    freqData: Float32Array,
    sampleRate: number,
    fftSize: number
  ): { chord: string; confidence: number; chroma: number[] } => {
    const chroma = new Array(12).fill(0);
    const binHz = sampleRate / fftSize;

    // Guitar musical range: E2 (82 Hz) to B5 (~1000 Hz)
    const minBin = Math.floor(75 / binHz);
    const maxBin = Math.floor(1200 / binHz);

    let totalEnergy = 0;

    for (let b = minBin; b <= maxBin; b++) {
      const db = freqData[b];
      if (db > -60) {
        // Convert dB to linear magnitude power
        const mag = Math.pow(10, db / 20);
        const freq = b * binHz;
        const midi = 12 * Math.log2(freq / 440) + 69;
        const pitchClass = Math.round(midi) % 12;
        const validPc = (pitchClass + 12) % 12;
        chroma[validPc] += mag;
        totalEnergy += mag;
      }
    }

    if (totalEnergy < 0.05) {
      return { chord: '--', confidence: 0, chroma: new Array(12).fill(0) };
    }

    // Normalize chroma vector
    const maxChroma = Math.max(...chroma);
    const normChroma = maxChroma > 0 ? chroma.map((v) => v / maxChroma) : chroma;

    // Template matching across all 12 roots and standard chord shapes
    let bestChord = '--';
    let bestScore = -1;

    for (let root = 0; root < 12; root++) {
      const rootName = NOTE_NAMES[root];
      for (const tpl of CHORD_TEMPLATES) {
        // Construct binary ideal chord template vector
        const target = new Array(12).fill(0);
        tpl.intervals.forEach((interval) => {
          target[(root + interval) % 12] = 1;
        });

        // Compute cosine similarity between actual chroma and chord template
        let dot = 0;
        let magA = 0;
        let magB = 0;
        for (let i = 0; i < 12; i++) {
          dot += normChroma[i] * target[i];
          magA += normChroma[i] * normChroma[i];
          magB += target[i] * target[i];
        }

        const sim = (magA > 0 && magB > 0) ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;

        if (sim > bestScore) {
          bestScore = sim;
          bestChord = `${rootName}${tpl.name}`;
        }
      }
    }

    const conf = Math.max(0, Math.min(1, bestScore));
    return {
      chord: conf > 0.65 ? bestChord : '--',
      confidence: conf,
      chroma: normChroma,
    };
  };

  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 4096; // High frequency resolution for accurate bass notes
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsListening(true);

      const timeBuffer = new Float32Array(analyser.fftSize);
      const freqBuffer = new Float32Array(analyser.frequencyBinCount);

      const loop = () => {
        analyser.getFloatTimeDomainData(timeBuffer);
        analyser.getFloatFrequencyData(freqBuffer);

        // 1. Polyphonic Chord & Chromagram Recognition
        const chordResult = calculateChromaAndChord(freqBuffer, ctx.sampleRate, analyser.fftSize);
        setDetectedChord(chordResult.chord);
        setChordConfidence(chordResult.confidence);
        setChromaProfile(chordResult.chroma);

        // 2. Monophonic Single-Note Pitch Recognition
        const freq = autoCorrelate(timeBuffer, ctx.sampleRate);
        if (freq > 70 && freq < 1100) {
          const midi = Math.round(12 * Math.log2(freq / 440) + 69);
          setDetectedPitch(midi);
          const name = NOTE_NAMES[midi % 12];
          const oct = Math.floor(midi / 12) - 1;
          setDetectedNoteName(`${name}${oct}`);
        } else if (chordResult.chord === '--') {
          setDetectedNoteName('--');
          setDetectedPitch(null);
        }

        animFrameRef.current = requestAnimationFrame(loop);
      };
      loop();
    } catch (err) {
      console.error('Microphone access denied:', err);
    }
  };

  const stopMic = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    if (audioCtxRef.current) audioCtxRef.current.close();
    setIsListening(false);
    setDetectedNoteName('--');
    setDetectedChord('--');
    setChromaProfile(new Array(12).fill(0));
  };

  useEffect(() => {
    return () => stopMic();
  }, []);

  // Target comparison
  const targetMidi = activeNote ? tuningMidi[activeNote.string] + activeNote.fret : null;
  const isSingleNoteMatch = targetMidi !== null && detectedPitch === targetMidi;
  const isChordMatch = activeChord && detectedChord === activeChord.label;

  return (
    <div className="bg-paper border border-paper-border rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-purple-600" />
            <h3 className="font-serif font-bold text-base text-studio-900">
              Interactive Mic Practice Coach & Chord Detector
            </h3>
          </div>
          <p className="text-xs text-studio-600">
            Real-time acoustic analysis: identifies single plucked notes and full strummed guitar chords.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Selector */}
          <div className="flex items-center bg-paper-dark p-1 rounded-xl border border-paper-border text-xs font-semibold">
            <button
              onClick={() => setMode('auto')}
              className={`px-2.5 py-1 rounded-lg transition ${
                mode === 'auto' ? 'bg-paper text-studio-900 shadow-sm' : 'text-studio-600'
              }`}
            >
              Auto
            </button>
            <button
              onClick={() => setMode('chord')}
              className={`px-2.5 py-1 rounded-lg transition ${
                mode === 'chord' ? 'bg-paper text-studio-900 shadow-sm' : 'text-studio-600'
              }`}
            >
              Chords
            </button>
            <button
              onClick={() => setMode('single')}
              className={`px-2.5 py-1 rounded-lg transition ${
                mode === 'single' ? 'bg-paper text-studio-900 shadow-sm' : 'text-studio-600'
              }`}
            >
              Single Notes
            </button>
          </div>

          <button
            onClick={isListening ? stopMic : startMic}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              isListening
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
                : 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm'
            }`}
          >
            {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            <span>{isListening ? 'Stop Listening' : 'Enable Mic'}</span>
          </button>
        </div>
      </div>

      {/* Main Detection Feedback Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Detected Guitar Chord Card */}
        <div className="bg-paper-light border border-paper-border rounded-xl p-3.5 text-center shadow-xs">
          <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-studio-600 uppercase font-bold">
            <Music className="w-3 h-3 text-purple-600" />
            <span>Detected Chord</span>
          </div>
          <div className="text-3xl font-black font-mono text-studio-900 mt-1">
            {detectedChord !== '--' ? detectedChord : '--'}
          </div>
          <span className="text-[10px] text-studio-600 font-mono">
            {detectedChord !== '--'
              ? `Confidence: ${Math.round(chordConfidence * 100)}%`
              : isListening
              ? 'Strum any chord...'
              : 'Mic disabled'}
          </span>
        </div>

        {/* Detected Single Note Card */}
        <div className="bg-paper-light border border-paper-border rounded-xl p-3.5 text-center shadow-xs">
          <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-studio-600 uppercase font-bold">
            <Activity className="w-3 h-3 text-guitar-amber" />
            <span>Detected Note (Lead)</span>
          </div>
          <div className="text-3xl font-black font-mono text-studio-900 mt-1">
            {detectedNoteName}
          </div>
          <span className="text-[10px] text-studio-600 font-mono">
            {detectedPitch ? `MIDI ${detectedPitch}` : 'Pluck single string...'}
          </span>
        </div>

        {/* Tab Target Match Evaluation */}
        <div
          className={`border rounded-xl p-3.5 flex flex-col items-center justify-center transition-all shadow-xs ${
            isChordMatch || isSingleNoteMatch
              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-800'
              : 'bg-paper-light border-paper-border text-studio-700'
          }`}
        >
          {isChordMatch ? (
            <>
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mb-0.5" />
              <span className="text-xs font-bold text-emerald-800">Chord Match: {activeChord?.label}!</span>
              <span className="text-[10px] text-emerald-700 font-mono">Perfect chord shape</span>
            </>
          ) : isSingleNoteMatch ? (
            <>
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mb-0.5" />
              <span className="text-xs font-bold text-emerald-800">Note Match: S{6 - activeNote!.string} F{activeNote!.fret}!</span>
              <span className="text-[10px] text-emerald-700 font-mono">Accurate pitch</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-6 h-6 text-studio-600 mb-0.5" />
              <span className="text-xs font-semibold text-studio-700">
                {activeChord ? `Target Chord: ${activeChord.label}` : activeNote ? `Target: S${6 - activeNote.string} F${activeNote.fret}` : 'Awaiting song play'}
              </span>
              <span className="text-[10px] text-studio-600 font-mono">
                {isListening ? 'Play in sync with playhead' : 'Click "Enable Mic"'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Real-Time 12-Tone Chromagram Visualizer Bar */}
      <div className="bg-paper-dark/70 border border-paper-border rounded-xl p-3 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-studio-700 font-bold">
          <span>12-Tone Pitch Class Spectrum (Harmonic Energy)</span>
          <span>{detectedChord !== '--' ? `Detected: ${detectedChord}` : ''}</span>
        </div>

        <div className="grid grid-cols-12 gap-1 h-10 items-end">
          {NOTE_NAMES.map((name, idx) => {
            const val = chromaProfile[idx] || 0;
            const heightPct = Math.max(8, Math.min(100, Math.round(val * 100)));
            const isActiveInChord = detectedChord !== '--' && val > 0.45;

            return (
              <div key={name} className="flex flex-col items-center h-full justify-end">
                <div
                  className={`w-full rounded-t transition-all duration-75 ${
                    isActiveInChord
                      ? 'bg-purple-600'
                      : val > 0.3
                      ? 'bg-guitar-amber'
                      : 'bg-paper-border'
                  }`}
                  style={{ height: `${heightPct}%` }}
                />
                <span className={`text-[9px] font-mono mt-1 ${isActiveInChord ? 'font-bold text-purple-700' : 'text-studio-600'}`}>
                  {name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
