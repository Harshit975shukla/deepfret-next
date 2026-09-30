import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, CheckCircle2, AlertCircle, Award } from 'lucide-react';
import { NoteEvent } from '../types/transcription';

interface MicPitchEvaluatorProps {
  activeNote: NoteEvent | null;
  tuningMidi: number[];
}

export const MicPitchEvaluator: React.FC<MicPitchEvaluatorProps> = ({
  activeNote,
  tuningMidi
}) => {
  const [isListening, setIsListening] = useState(false);
  const [detectedPitch, setDetectedPitch] = useState<number | null>(null);
  const [detectedNoteName, setDetectedNoteName] = useState<string>('--');
  const [centsDiff, setCentsDiff] = useState<number>(0);
  const [score, setScore] = useState<number>(100);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  // Autocorrelation pitch detection algorithm for guitar
  const autoCorrelate = (buf: Float32Array, sampleRate: number): number => {
    let SIZE = buf.length;
    let rms = 0;
    for (let i = 0; i < SIZE; i++) {
      const val = buf[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.02) return -1; // Not loud enough

    let r1 = 0, r2 = SIZE - 1, thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) {
      if (Math.abs(buf[i]) < thres) { r1 = i; break; }
    }
    for (let i = 1; i < SIZE / 2; i++) {
      if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }
    }

    buf = buf.slice(r1, r2);
    SIZE = buf.length;

    const c = new Array(SIZE).fill(0);
    for (let i = 0; i < SIZE; i++) {
      for (let j = 0; j < SIZE - i; j++) {
        c[i] = c[i] + buf[j] * buf[j + i];
      }
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < SIZE; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }
    let T0 = maxpos;
    return sampleRate / T0;
  };

  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsListening(true);

      const buffer = new Float32Array(analyser.fftSize);
      const detectLoop = () => {
        analyser.getFloatTimeDomainData(buffer);
        const freq = autoCorrelate(buffer, ctx.sampleRate);
        if (freq > 60 && freq < 1200) {
          const midi = Math.round(12 * (Math.log(freq / 440) / Math.log(2)) + 69);
          setDetectedPitch(midi);
          const name = noteStrings[midi % 12];
          const oct = Math.floor(midi / 12) - 1;
          setDetectedNoteName(`${name}${oct}`);

          if (activeNote) {
            const targetMidi = tuningMidi[activeNote.string] + activeNote.fret;
            const diff = midi - targetMidi;
            setCentsDiff(diff);
            if (diff === 0) {
              setScore((s) => Math.min(100, s + 1));
            }
          }
        }
        animFrameRef.current = requestAnimationFrame(detectLoop);
      };
      detectLoop();
    } catch (e) {
      console.error('Microphone access denied:', e);
    }
  };

  const stopMic = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    if (audioCtxRef.current) audioCtxRef.current.close();
    setIsListening(false);
  };

  useEffect(() => {
    return () => stopMic();
  }, []);

  const targetMidi = activeNote ? tuningMidi[activeNote.string] + activeNote.fret : null;
  const isMatch = targetMidi !== null && detectedPitch === targetMidi;

  return (
    <div className="bg-paper border border-paper-border rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-purple-600" />
            <h3 className="font-serif font-bold text-base text-studio-900">
              Interactive Mic Practice Coach
            </h3>
          </div>
          <p className="text-xs text-studio-600">
            Play your physical guitar in front of your mic to get real-time pitch feedback.
          </p>
        </div>

        <button
          onClick={isListening ? stopMic : startMic}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
            isListening
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm'
          }`}
        >
          {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          <span>{isListening ? 'Stop Listening' : 'Enable Mic'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Detected Pitch Card */}
        <div className="bg-paper-dark/70 border border-paper-border rounded-xl p-3 text-center">
          <span className="text-[11px] font-mono text-studio-600 uppercase">You Played</span>
          <div className="text-2xl font-black font-mono text-studio-900 mt-1">
            {detectedNoteName}
          </div>
          <span className="text-[10px] text-studio-600 font-mono">
            {detectedPitch ? `MIDI ${detectedPitch}` : 'Listening...'}
          </span>
        </div>

        {/* Target Tab Note Card */}
        <div className="bg-paper-dark/70 border border-paper-border rounded-xl p-3 text-center">
          <span className="text-[11px] font-mono text-studio-600 uppercase">Target Tab Note</span>
          <div className="text-2xl font-black font-mono text-studio-900 mt-1">
            {activeNote ? `S${6 - activeNote.string} F${activeNote.fret}` : '--'}
          </div>
          <span className="text-[10px] text-studio-600 font-mono">
            {targetMidi ? `MIDI ${targetMidi}` : 'Play tab to see'}
          </span>
        </div>

        {/* Pitch Match Indicator */}
        <div
          className={`border rounded-xl p-3 flex flex-col items-center justify-center transition-all ${
            isMatch
              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-800'
              : 'bg-paper-dark/70 border-paper-border text-studio-700'
          }`}
        >
          {isMatch ? (
            <>
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mb-0.5" />
              <span className="text-xs font-bold text-emerald-700">Perfect Pitch Match!</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-6 h-6 text-studio-600 mb-0.5" />
              <span className="text-xs font-semibold text-studio-600">
                {isListening ? 'Play note on guitar' : 'Mic idle'}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
