import React from 'react';
import { X, Download, FileText, Music, FileCode, Check } from 'lucide-react';
import { getExportUrl } from '../services/api';
import { TranscriptionDocument } from '../types/transcription';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transcription: TranscriptionDocument;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  transcription,
}) => {
  if (!isOpen) return null;

  const handleDownload = (format: string) => {
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(transcription, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${transcription.filename || 'tab'}.json`;
      a.click();
    } else if (format === 'alphatex') {
      const blob = new Blob([transcription.alphatex], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${transcription.filename || 'tab'}.alphatex.txt`;
      a.click();
    } else {
      const url = getExportUrl(transcription.id, format);
      window.open(url, '_blank');
    }
  };

  const formats = [
    {
      id: 'gp5',
      name: 'Guitar Pro (.gp5)',
      desc: 'Industry standard for guitar players. Fully playable in Guitar Pro 5/6/7/8 and TuxGuitar.',
      icon: Music,
    },
    {
      id: 'midi',
      name: 'MPE Multi-Track MIDI (.mid)',
      desc: '6 isolated tracks (one per guitar string) with independent string pitch bends and velocity.',
      icon: FileCode,
    },
    {
      id: 'musicxml',
      name: 'MusicXML (.musicxml)',
      desc: 'Universal sheet music format supported by MuseScore, Sibelius, Dorico, and Finale.',
      icon: FileText,
    },
    {
      id: 'pdf',
      name: 'Printable Sheet PDF (.pdf)',
      desc: 'High-resolution tablature sheet ready for printing, offline practice, or gig folders.',
      icon: FileText,
    },
    {
      id: 'alphatex',
      name: 'AlphaTex Tablature (.txt)',
      desc: 'Plaintext AlphaTab format containing tuning, tempo, durations, and fretboard fingering.',
      icon: FileCode,
    },
    {
      id: 'json',
      name: 'DeepFret Raw Schema (.json)',
      desc: 'Full analysis document with all events, biomechanical scores, chords, and beats.',
      icon: FileCode,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-studio-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-paper border border-paper-border rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-5">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-paper-dark text-studio-600 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <h2 className="text-2xl font-serif font-black text-studio-900">Export Tablature</h2>
          <p className="text-xs text-studio-600">
            Download your transcribed guitar tab in professional notation and DAW formats.
          </p>
        </div>

        <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
          {formats.map((fmt) => {
            const Icon = fmt.icon;
            return (
              <div
                key={fmt.id}
                className="bg-paper-light border border-paper-border hover:border-guitar-amber rounded-2xl p-3.5 flex items-center justify-between gap-3 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-guitar-amber/15 text-guitar-amber flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-studio-900">{fmt.name}</h4>
                    <p className="text-[11px] text-studio-600 leading-tight mt-0.5">{fmt.desc}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleDownload(fmt.id)}
                  className="flex items-center gap-1 bg-studio-900 hover:bg-studio-800 text-paper text-xs font-semibold px-3 py-1.5 rounded-xl shadow-sm transition active:scale-95 cursor-pointer flex-shrink-0"
                >
                  <Download className="w-3.5 h-3.5 text-guitar-amber" />
                  <span>Download</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
