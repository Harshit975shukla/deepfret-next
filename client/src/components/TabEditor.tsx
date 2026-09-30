import React, { useState } from 'react';
import { NoteEvent } from '../types/transcription';
import { Edit3, Check, RotateCcw, ArrowUp, ArrowDown } from 'lucide-react';

interface TabEditorProps {
  events: NoteEvent[];
  onUpdateEvents: (newEvents: NoteEvent[]) => void;
  tuningMidi: number[];
}

export const TabEditor: React.FC<TabEditorProps> = ({
  events,
  onUpdateEvents,
  tuningMidi
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const selectedNote = selectedIdx !== null ? events[selectedIdx] : null;

  const handleFretChange = (newFret: number) => {
    if (selectedIdx === null || newFret < 0 || newFret > 24) return;
    const updated = [...events];
    updated[selectedIdx] = {
      ...updated[selectedIdx],
      fret: newFret
    };
    onUpdateEvents(updated);
  };

  const handleStringShift = (deltaString: number) => {
    if (selectedIdx === null || !selectedNote) return;
    const targetString = selectedNote.string + deltaString;
    if (targetString < 0 || targetString > 5) return;

    // Pitch conservation: keep pitch identical when shifting strings!
    const currentPitch = tuningMidi[selectedNote.string] + selectedNote.fret;
    const targetOpen = tuningMidi[targetString];
    const newFret = currentPitch - targetOpen;

    if (newFret >= 0 && newFret <= 22) {
      const updated = [...events];
      updated[selectedIdx] = {
        ...updated[selectedIdx],
        string: targetString,
        fret: newFret
      };
      onUpdateEvents(updated);
    }
  };

  const toggleEffect = (effectKey: keyof NoteEvent['effects']) => {
    if (selectedIdx === null || !selectedNote) return;
    const updated = [...events];
    updated[selectedIdx] = {
      ...updated[selectedIdx],
      effects: {
        ...updated[selectedIdx].effects,
        [effectKey]: !updated[selectedIdx].effects[effectKey]
      }
    };
    onUpdateEvents(updated);
  };

  return (
    <div className="bg-paper border border-paper-border rounded-2xl p-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-paper-border pb-3">
        <div className="flex items-center gap-2">
          <Edit3 className="w-4 h-4 text-guitar-amber" />
          <h3 className="font-serif font-bold text-base text-studio-900">Interactive Tab Note Editor</h3>
        </div>
        <span className="text-xs text-studio-600 font-mono">
          {events.length} Total Notes Transcribed
        </span>
      </div>

      {/* Note Grid Selection */}
      <div className="max-h-48 overflow-y-auto grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-1.5 p-2 bg-paper-light/50 rounded-xl border border-paper-border">
        {events.slice(0, 72).map((note, idx) => {
          const isSelected = selectedIdx === idx;
          return (
            <button
              key={idx}
              onClick={() => setSelectedIdx(idx)}
              className={`p-1.5 rounded-lg border text-center font-mono text-[11px] transition ${
                isSelected
                  ? 'bg-guitar-amber text-white border-guitar-amber font-bold shadow-sm'
                  : 'bg-paper text-studio-800 border-paper-border hover:bg-paper-dark'
              }`}
            >
              <div>S{6 - note.string}</div>
              <div className="font-extrabold text-xs">F{note.fret}</div>
            </button>
          );
        })}
      </div>

      {/* Edit Panel for Selected Note */}
      {selectedNote ? (
        <div className="bg-paper-dark p-4 rounded-xl border border-paper-border space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-studio-900">
              Note #{selectedIdx! + 1} at {selectedNote.time.toFixed(2)}s
            </span>
            <span className="text-studio-600">String {6 - selectedNote.string}, Fret {selectedNote.fret}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Fret Adjuster */}
            <div className="flex items-center gap-1.5 bg-paper p-1 rounded-lg border border-paper-border">
              <span className="text-xs font-bold px-2 text-studio-700">Fret:</span>
              <button
                onClick={() => handleFretChange(selectedNote.fret - 1)}
                className="w-7 h-7 bg-paper-dark hover:bg-paper-border rounded flex items-center justify-center font-mono font-bold"
              >
                -
              </button>
              <span className="w-8 text-center font-mono font-bold text-xs">{selectedNote.fret}</span>
              <button
                onClick={() => handleFretChange(selectedNote.fret + 1)}
                className="w-7 h-7 bg-paper-dark hover:bg-paper-border rounded flex items-center justify-center font-mono font-bold"
              >
                +
              </button>
            </div>

            {/* Shift to Adjacent String (Pitch-Conserved Voicing) */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleStringShift(-1)}
                disabled={selectedNote.string <= 0}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-paper border border-paper-border hover:bg-paper-light text-xs font-semibold disabled:opacity-40"
              >
                <ArrowDown className="w-3.5 h-3.5" />
                <span>Lower String</span>
              </button>

              <button
                onClick={() => handleStringShift(1)}
                disabled={selectedNote.string >= 5}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-paper border border-paper-border hover:bg-paper-light text-xs font-semibold disabled:opacity-40"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                <span>Higher String</span>
              </button>
            </div>

            {/* Techniques & Articulations */}
            <div className="flex items-center gap-1">
              {(['palm_mute', 'is_dead', 'slide', 'hammer', 'bend', 'vibrato'] as const).map((tech) => (
                <button
                  key={tech}
                  onClick={() => toggleEffect(tech)}
                  className={`px-2 py-1 rounded text-[11px] font-mono border transition ${
                    selectedNote.effects[tech]
                      ? 'bg-guitar-amber text-white border-guitar-amber font-bold'
                      : 'bg-paper text-studio-700 border-paper-border hover:bg-paper-light'
                  }`}
                >
                  {tech === 'is_dead' ? 'Dead (X)' : tech.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-studio-600 italic text-center py-2">
          Click any note in the grid above to edit its fret, shift strings with pitch conservation, or toggle guitar techniques.
        </p>
      )}
    </div>
  );
};
