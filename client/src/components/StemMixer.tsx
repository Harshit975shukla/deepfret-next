import React, { useState } from 'react';
import { Sliders, Volume2, VolumeX } from 'lucide-react';

export const StemMixer: React.FC = () => {
  const [stems, setStems] = useState({
    guitar: { vol: 85, mute: false },
    bass: { vol: 70, mute: false },
    drums: { vol: 75, mute: false },
    vocals: { vol: 80, mute: false },
  });

  const handleVol = (key: keyof typeof stems, val: number) => {
    setStems((prev) => ({
      ...prev,
      [key]: { ...prev[key], vol: val }
    }));
  };

  const toggleMute = (key: keyof typeof stems) => {
    setStems((prev) => ({
      ...prev,
      [key]: { ...prev[key], mute: !prev[key].mute }
    }));
  };

  return (
    <div className="bg-paper border border-paper-border rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between border-b border-paper-border pb-2">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-guitar-amber" />
          <h3 className="font-serif font-bold text-sm text-studio-900">4-Track Stem Mixer</h3>
        </div>
        <span className="text-[11px] text-studio-600 font-mono">Isolated with Demucs v4</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(Object.keys(stems) as Array<keyof typeof stems>).map((k) => {
          const stem = stems[k];
          return (
            <div key={k} className="bg-paper-light p-3 rounded-xl border border-paper-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold capitalize text-studio-800">{k}</span>
                <button
                  onClick={() => toggleMute(k)}
                  className={`p-1 rounded transition ${
                    stem.mute ? 'bg-red-100 text-red-600' : 'hover:bg-paper-dark text-studio-600'
                  }`}
                >
                  {stem.mute ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
              </div>

              <input
                type="range"
                min={0}
                max={100}
                value={stem.mute ? 0 : stem.vol}
                disabled={stem.mute}
                onChange={(e) => handleVol(k, parseInt(e.target.value))}
                className="w-full accent-guitar-amber h-1.5 bg-paper-dark rounded cursor-pointer"
              />

              <div className="text-[10px] text-right font-mono text-studio-600">
                {stem.mute ? 'MUTED' : `${stem.vol}%`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
