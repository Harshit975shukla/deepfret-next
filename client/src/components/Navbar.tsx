import React from 'react';
import { Guitar, Sparkles, Folder, Settings, Upload, Disc3 } from 'lucide-react';

interface NavbarProps {
  currentTab: 'studio' | 'landing' | 'editor' | 'coach';
  onSelectTab: (tab: 'studio' | 'landing' | 'editor' | 'coach') => void;
  onOpenUpload: () => void;
  songTitle?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenUpload,
  songTitle = 'Sample Demo Song'
}) => {
  return (
    <header className="sticky top-0 z-50 bg-paper/95 backdrop-blur border-b border-paper-border px-4 py-2.5 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-6">
        <button
          onClick={() => onSelectTab('landing')}
          className="flex items-center gap-2 group text-left cursor-pointer"
        >
          <div className="w-9 h-9 rounded-full bg-guitar-amber flex items-center justify-center text-paper shadow-md group-hover:scale-105 transition-transform">
            <Guitar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold tracking-tight text-lg text-studio-900 leading-none">
              DeepFret <span className="text-xs bg-guitar-amber text-white font-mono px-1.5 py-0.5 rounded uppercase tracking-wider">Next</span>
            </div>
            <p className="text-[11px] text-studio-600 tracking-wide font-medium mt-0.5">AI Guitar Tab & 3D Fretboard</p>
          </div>
        </button>

        <nav className="hidden md:flex items-center gap-1 bg-paper-dark/50 p-1 rounded-lg border border-paper-border">
          <button
            onClick={() => onSelectTab('studio')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              currentTab === 'studio'
                ? 'bg-paper text-studio-900 shadow-sm'
                : 'text-studio-600 hover:text-studio-900'
            }`}
          >
            Studio & 3D Neck
          </button>
          <button
            onClick={() => onSelectTab('editor')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              currentTab === 'editor'
                ? 'bg-paper text-studio-900 shadow-sm'
                : 'text-studio-600 hover:text-studio-900'
            }`}
          >
            Tab Editor <span className="text-[9px] bg-emerald-600 text-white px-1 py-0.2 rounded ml-1">New</span>
          </button>
          <button
            onClick={() => onSelectTab('coach')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              currentTab === 'coach'
                ? 'bg-paper text-studio-900 shadow-sm'
                : 'text-studio-600 hover:text-studio-900'
            }`}
          >
            Mic Practice Coach <span className="text-[9px] bg-purple-600 text-white px-1 py-0.2 rounded ml-1">AI</span>
          </button>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {songTitle && (
          <div className="hidden lg:flex items-center gap-2 bg-paper-light border border-paper-border px-3 py-1 rounded-full text-xs font-mono text-studio-700">
            <Disc3 className="w-3.5 h-3.5 text-guitar-amber animate-spin" style={{ animationDuration: '6s' }} />
            <span className="truncate max-w-[200px]">{songTitle}</span>
          </div>
        )}

        <button
          onClick={onOpenUpload}
          className="flex items-center gap-1.5 bg-guitar-amber hover:bg-guitar-amber/90 active:scale-95 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-sm transition-all"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Transcribe Song</span>
        </button>
      </div>
    </header>
  );
};
