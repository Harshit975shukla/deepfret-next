import React, { useState } from 'react';
import { Play, Sparkles, Upload, Youtube, ArrowRight, CheckCircle2, ShieldCheck, Zap, Layers, Music, Sliders } from 'lucide-react';

interface HeroProps {
  onOpenUpload: () => void;
  onEnterStudio: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenUpload, onEnterStudio }) => {
  const [quickUrl, setQuickUrl] = useState('');

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Hero Headline */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-paper-dark border border-paper-border text-xs font-semibold text-studio-700">
          <Sparkles className="w-3.5 h-3.5 text-guitar-amber" />
          <span>Serious AI Guitar Transcription · Measured on Real Recordings</span>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-black tracking-tight text-studio-900 leading-[1.15]">
          Guitar tab from <span className="underline decoration-guitar-amber decoration-4 underline-offset-4">any</span> recording.
        </h1>

        <p className="text-base md:text-lg text-studio-700 leading-relaxed font-sans max-w-2xl mx-auto">
          Paste a YouTube link or drop an audio file. DeepFret finds every note, tracks it to its exact string and fret, and puts the song on an interactive 3D fretboard you can slow down, loop, and master.
        </p>

        {/* Quick Ingestion Bar */}
        <div className="pt-4 max-w-xl mx-auto">
          <div className="bg-paper-light border-2 border-paper-border rounded-2xl p-2 shadow-md flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 bg-paper rounded-xl border border-paper-border">
              <Youtube className="w-5 h-5 text-red-600 flex-shrink-0" />
              <input
                type="text"
                value={quickUrl}
                onChange={(e) => setQuickUrl(e.target.value)}
                placeholder="Paste YouTube, TikTok or Instagram link..."
                className="w-full bg-transparent py-2.5 text-xs text-studio-900 placeholder:text-studio-600 outline-none"
              />
            </div>
            <button
              onClick={onOpenUpload}
              className="bg-guitar-amber hover:bg-guitar-amber/90 active:scale-95 text-white font-bold text-xs px-5 py-3 rounded-xl flex items-center justify-center gap-2 shadow transition-all cursor-pointer"
            >
              <span>Transcribe</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-center gap-4 mt-2 text-[11px] text-studio-600 font-medium">
            <span>✓ No account required for demo</span>
            <span>•</span>
            <span>✓ Up to 95%+ note accuracy</span>
            <span>•</span>
            <span>✓ Stem separation included</span>
          </div>
        </div>

        {/* Call to action demo button */}
        <div className="pt-4 flex items-center justify-center gap-3">
          <button
            onClick={onEnterStudio}
            className="flex items-center gap-2 bg-studio-900 hover:bg-studio-800 text-paper font-semibold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current text-guitar-amber" />
            <span>Launch Interactive Demo Studio</span>
          </button>
        </div>
      </div>

      {/* 7-Step Feature Breakdown (DeepFret Core Showcase) */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-paper-light border border-paper-border p-6 rounded-2xl shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-guitar-amber/15 text-guitar-amber flex items-center justify-center font-bold">
            1
          </div>
          <h3 className="font-serif font-bold text-lg text-studio-900">Your Song & Stems</h3>
          <p className="text-xs text-studio-700 leading-relaxed">
            Drop MP3, WAV, FLAC, or paste video links. Demucs neural separation isolates the guitar stem from drums, bass, and vocals.
          </p>
        </div>

        <div className="bg-paper-light border border-paper-border p-6 rounded-2xl shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-guitar-amber/15 text-guitar-amber flex items-center justify-center font-bold">
            2
          </div>
          <h3 className="font-serif font-bold text-lg text-studio-900">Physical Playability</h3>
          <p className="text-xs text-studio-700 leading-relaxed">
            Unlike naive MIDI converters, our Viterbi algorithm enforces human hand-span limits (4 frets max) and minimizes longitudinal leaps.
          </p>
        </div>

        <div className="bg-paper-light border border-paper-border p-6 rounded-2xl shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-guitar-amber/15 text-guitar-amber flex items-center justify-center font-bold">
            3
          </div>
          <h3 className="font-serif font-bold text-lg text-studio-900">Interactive 3D Neck</h3>
          <p className="text-xs text-studio-700 leading-relaxed">
            See notes struck together as chord shapes. Three colors guide you: Active Strike, Next Fret Target with trajectory arc, and Sustained Ring.
          </p>
        </div>

        <div className="bg-paper-light border border-paper-border p-6 rounded-2xl shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-guitar-amber/15 text-guitar-amber flex items-center justify-center font-bold">
            4
          </div>
          <h3 className="font-serif font-bold text-lg text-studio-900">Practice & Slow-Down</h3>
          <p className="text-xs text-studio-700 leading-relaxed">
            Slow down from 100% to 25% with zero pitch shift. Select any bar region to create an infinite practice loop.
          </p>
        </div>

        <div className="bg-paper-light border border-paper-border p-6 rounded-2xl shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-guitar-amber/15 text-guitar-amber flex items-center justify-center font-bold">
            5
          </div>
          <h3 className="font-serif font-bold text-lg text-studio-900">Play-Along Backing Track</h3>
          <p className="text-xs text-studio-700 leading-relaxed">
            Remove the guitar from the original recording and step into the guitarist role with drums, bass, and vocals playing along.
          </p>
        </div>

        <div className="bg-paper-light border border-paper-border p-6 rounded-2xl shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-guitar-amber/15 text-guitar-amber flex items-center justify-center font-bold">
            6
          </div>
          <h3 className="font-serif font-bold text-lg text-studio-900">Pro Exports</h3>
          <p className="text-xs text-studio-700 leading-relaxed">
            Export directly to Guitar Pro (.gp5), MPE Multi-track MIDI (1 channel per string), MusicXML, Printable PDF, and AlphaTex.
          </p>
        </div>
      </div>
    </div>
  );
};
