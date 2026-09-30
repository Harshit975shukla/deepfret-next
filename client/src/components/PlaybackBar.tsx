import React from 'react';
import { Play, Pause, RotateCcw, RotateCw, Repeat, Volume2, Download, Gauge } from 'lucide-react';

interface PlaybackBarProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  loopActive: boolean;
  onToggleLoop: () => void;
  metronomeActive: boolean;
  onToggleMetronome: () => void;
  onOpenExport: () => void;
  audioMode: 'full' | 'guitar' | 'backing' | 'synth';
  onAudioModeChange: (mode: 'full' | 'guitar' | 'backing' | 'synth') => void;
}

export const PlaybackBar: React.FC<PlaybackBarProps> = ({
  isPlaying,
  onTogglePlay,
  currentTime,
  duration,
  onSeek,
  speed,
  onSpeedChange,
  loopActive,
  onToggleLoop,
  metronomeActive,
  onToggleMetronome,
  onOpenExport,
  audioMode,
  onAudioModeChange,
}) => {
  const speeds = [0.25, 0.5, 0.75, 1.0, 1.15];

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full bg-paper border border-paper-border rounded-2xl p-3.5 shadow-md flex flex-wrap items-center justify-between gap-4">
      {/* Playhead Slider & Time */}
      <div className="w-full flex items-center gap-3">
        <span className="text-xs font-mono font-semibold text-studio-600 w-10">
          {formatTime(currentTime)}
        </span>
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.05}
          value={currentTime}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="flex-1 accent-guitar-amber h-1.5 bg-paper-dark rounded-lg cursor-pointer"
        />
        <span className="text-xs font-mono font-semibold text-studio-600 w-10 text-right">
          {formatTime(duration)}
        </span>
      </div>

      {/* Primary Transport Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onSeek(Math.max(0, currentTime - 5))}
          title="Rewind 5s"
          className="p-2 rounded-xl bg-paper-light border border-paper-border hover:bg-paper-dark text-studio-700 transition"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onTogglePlay}
          className="p-3.5 rounded-2xl bg-studio-900 hover:bg-studio-800 active:scale-95 text-paper shadow-md transition-all flex items-center justify-center cursor-pointer"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-current text-guitar-amber" />
          ) : (
            <Play className="w-5 h-5 fill-current text-guitar-amber ml-0.5" />
          )}
        </button>

        <button
          onClick={() => onSeek(Math.min(duration, currentTime + 5))}
          title="Forward 5s"
          className="p-2 rounded-xl bg-paper-light border border-paper-border hover:bg-paper-dark text-studio-700 transition"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      {/* Speed Presets */}
      <div className="flex items-center gap-1 bg-paper-dark/60 p-1 rounded-xl border border-paper-border text-xs font-mono font-bold">
        <Gauge className="w-3.5 h-3.5 text-studio-600 ml-1.5 mr-0.5" />
        {speeds.map((s) => (
          <button
            key={s}
            onClick={() => onSpeedChange(s)}
            className={`px-2 py-1 rounded-lg transition-all ${
              speed === s
                ? 'bg-paper text-guitar-amber shadow-sm font-extrabold'
                : 'text-studio-600 hover:text-studio-900'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>

      {/* Practice Tools: Loop & Metronome */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleLoop}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
            loopActive
              ? 'bg-guitar-amber text-white border-guitar-amber shadow-sm'
              : 'bg-paper-light text-studio-700 border-paper-border hover:bg-paper-dark'
          }`}
        >
          <Repeat className="w-3.5 h-3.5" />
          <span>Loop Bars</span>
        </button>

        <button
          onClick={onToggleMetronome}
          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
            metronomeActive
              ? 'bg-studio-900 text-paper border-studio-900 shadow-sm'
              : 'bg-paper-light text-studio-700 border-paper-border hover:bg-paper-dark'
          }`}
        >
          Metronome
        </button>
      </div>

      {/* Stem Audio Source Switcher */}
      <div className="flex items-center gap-1 bg-paper-dark/60 p-1 rounded-xl border border-paper-border text-xs font-medium">
        <Volume2 className="w-3.5 h-3.5 text-studio-600 ml-1 mr-0.5" />
        {(['full', 'guitar', 'backing', 'synth'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => onAudioModeChange(mode)}
            className={`px-2.5 py-1 rounded-lg capitalize transition-all ${
              audioMode === mode
                ? 'bg-paper text-studio-900 font-bold shadow-sm'
                : 'text-studio-600 hover:text-studio-900'
            }`}
          >
            {mode === 'full' ? 'Original' : mode === 'guitar' ? 'Guitar Stem' : mode === 'backing' ? 'Backing Track' : 'Tab Synth'}
          </button>
        ))}
      </div>

      {/* Export Button */}
      <button
        onClick={onOpenExport}
        className="flex items-center gap-1.5 bg-studio-900 hover:bg-studio-800 text-paper px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer ml-auto"
      >
        <Download className="w-3.5 h-3.5 text-guitar-amber" />
        <span>Export Tab</span>
      </button>
    </div>
  );
};
