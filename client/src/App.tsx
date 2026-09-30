import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ThreeFretboard } from './components/ThreeFretboard';
import { TabStaff } from './components/TabStaff';
import { PlaybackBar } from './components/PlaybackBar';
import { SongUploader } from './components/SongUploader';
import { TabEditor } from './components/TabEditor';
import { MicPitchEvaluator } from './components/MicPitchEvaluator';
import { StemMixer } from './components/StemMixer';
import { PlayabilityStatsView } from './components/PlayabilityStatsView';
import { ExportModal } from './components/ExportModal';
import { SAMPLE_SONG } from './data/sampleSong';
import { GuitarAudioEngine } from './services/audioPlayer';
import { TranscriptionDocument, NoteEvent } from './types/transcription';
import { Music, Clock, Key, Disc, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'studio' | 'landing' | 'editor' | 'coach'>('studio');
  const [transcription, setTranscription] = useState<TranscriptionDocument>(SAMPLE_SONG);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1.0);
  const [loopActive, setLoopActive] = useState<boolean>(false);
  const [metronomeActive, setMetronomeActive] = useState<boolean>(false);
  const [audioMode, setAudioMode] = useState<'full' | 'guitar' | 'backing' | 'synth'>('synth');
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  const audioEngineRef = useRef<GuitarAudioEngine | null>(null);

  // Initialize Web Audio Engine
  useEffect(() => {
    audioEngineRef.current = new GuitarAudioEngine();
    audioEngineRef.current.setEvents(transcription.events, transcription.tuning_midi);
  }, []);

  // Update events when transcription changes
  useEffect(() => {
    if (audioEngineRef.current) {
      audioEngineRef.current.setEvents(transcription.events, transcription.tuning_midi);
    }
  }, [transcription]);

  // Master Playback Loop
  useEffect(() => {
    let animId: number;
    const tick = () => {
      if (audioEngineRef.current && isPlaying) {
        const time = audioEngineRef.current.getCurrentTime();
        setCurrentTime(time);

        // Check if playback ended
        if (time >= transcription.duration_seconds && !loopActive) {
          setIsPlaying(false);
          audioEngineRef.current.pause();
        }
      }
      animId = requestAnimationFrame(tick);
    };

    if (isPlaying) {
      animId = requestAnimationFrame(tick);
    }

    return () => cancelAnimationFrame(animId);
  }, [isPlaying, transcription.duration_seconds, loopActive]);

  // Handle Play/Pause
  const handleTogglePlay = () => {
    if (!audioEngineRef.current) return;
    if (isPlaying) {
      audioEngineRef.current.pause();
      setIsPlaying(false);
    } else {
      if (currentTime >= transcription.duration_seconds) {
        handleSeek(0);
      }
      audioEngineRef.current.play(currentTime);
      setIsPlaying(true);
    }
  };

  const handleSeek = (seconds: number) => {
    setCurrentTime(seconds);
    if (audioEngineRef.current) {
      audioEngineRef.current.seek(seconds);
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    if (audioEngineRef.current) {
      audioEngineRef.current.setSpeed(newSpeed);
    }
  };

  const loopRange: [number, number] | null = loopActive ? [0, Math.min(15, transcription.duration_seconds)] : null;

  const handleToggleLoop = () => {
    const next = !loopActive;
    setLoopActive(next);
    if (audioEngineRef.current) {
      audioEngineRef.current.setLoop(next ? [0, Math.min(15, transcription.duration_seconds)] : null);
    }
  };

  const handleToggleMetronome = () => {
    const next = !metronomeActive;
    setMetronomeActive(next);
    if (audioEngineRef.current) {
      audioEngineRef.current.setMetronome(next);
    }
  };

  // Find currently active note and chord for mic coach
  const activeNote = transcription.events.find(
    (e) => currentTime >= e.time && currentTime < e.time + Math.max(0.15, e.duration)
  ) || null;

  const activeChord = transcription.chords.find(
    (c) => Math.abs(currentTime - c.time) < 1.5
  ) || null;

  const handleUpdateEvents = (newEvents: NoteEvent[]) => {
    setTranscription((prev) => ({
      ...prev,
      events: newEvents,
      num_notes: newEvents.length,
    }));
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col selection:bg-guitar-amber selection:text-white">
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenUpload={() => setIsUploadOpen(true)}
        songTitle={transcription.filename || 'First Light (Demo)'}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
        {currentTab === 'landing' ? (
          <Hero
            onOpenUpload={() => setIsUploadOpen(true)}
            onEnterStudio={() => setCurrentTab('studio')}
          />
        ) : (
          <div className="space-y-6">
            {/* Song Metadata Header */}
            <div className="bg-paper-light border border-paper-border rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-serif font-black text-studio-900">
                    {transcription.filename || 'First Light · Demo Song'}
                  </h1>
                  <span className="text-[10px] bg-guitar-amber text-white font-mono px-2 py-0.5 rounded-full font-bold">
                    {transcription.confidence ? `${Math.round(transcription.confidence * 100)}% Accuracy` : 'Verified'}
                  </span>
                </div>
                <p className="text-xs text-studio-600 mt-0.5">
                  Multi-voice acoustic guitar transcription tracked to physical frets and strings.
                </p>
              </div>

              {/* Key stats badges */}
              <div className="flex items-center gap-3 text-xs font-mono">
                <div className="bg-paper px-3 py-1.5 rounded-xl border border-paper-border flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-guitar-amber" />
                  <span><strong>{transcription.tempo}</strong> BPM</span>
                </div>
                <div className="bg-paper px-3 py-1.5 rounded-xl border border-paper-border flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-guitar-amber" />
                  <span><strong>{transcription.key}</strong></span>
                </div>
                <div className="bg-paper px-3 py-1.5 rounded-xl border border-paper-border flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-guitar-amber" />
                  <span>Capo: <strong>{transcription.capo === 0 ? 'None' : `Fret ${transcription.capo}`}</strong></span>
                </div>
              </div>
            </div>

            {/* 3D Guitar Neck Visualizer */}
            <ThreeFretboard
              events={transcription.events}
              currentTime={currentTime}
              tuningNames={transcription.tuning_names}
            />

            {/* SVG Tab Staff */}
            <TabStaff
              events={transcription.events}
              beats={transcription.beats}
              chords={transcription.chords}
              currentTime={currentTime}
              duration={transcription.duration_seconds}
              onSeek={handleSeek}
              loopRange={loopRange}
            />

            {/* Transport & Playback Bar */}
            <PlaybackBar
              isPlaying={isPlaying}
              onTogglePlay={handleTogglePlay}
              currentTime={currentTime}
              duration={transcription.duration_seconds}
              onSeek={handleSeek}
              speed={speed}
              onSpeedChange={handleSpeedChange}
              loopActive={loopActive}
              onToggleLoop={handleToggleLoop}
              metronomeActive={metronomeActive}
              onToggleMetronome={handleToggleMetronome}
              onOpenExport={() => setIsExportOpen(true)}
              audioMode={audioMode}
              onAudioModeChange={setAudioMode}
            />

            {/* Sub-Views: Editor or Practice Coach */}
            {currentTab === 'editor' && (
              <TabEditor
                events={transcription.events}
                onUpdateEvents={handleUpdateEvents}
                tuningMidi={transcription.tuning_midi}
              />
            )}

            {currentTab === 'coach' && (
              <MicPitchEvaluator
                activeNote={activeNote}
                activeChord={activeChord}
                tuningMidi={transcription.tuning_midi}
              />
            )}

            {/* Stem Mixer & Playability Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <StemMixer />
              <PlayabilityStatsView
                playability={transcription.playability}
                consistency={transcription.consistency}
                strum={transcription.strum_consensus}
                handpath={transcription.handpath}
                modelArch={transcription.model_arch}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-paper-border py-6 px-4 text-center text-xs text-studio-600 bg-paper-dark/30 mt-auto">
        <p>
          DeepFret Next · Created by <a href="https://github.com/Harshit975shukla" target="_blank" rel="noreferrer" className="text-studio-900 font-bold hover:underline">Harshit Shukla</a> · Open-Source AI Guitar Tab Engine
        </p>
      </footer>

      {/* Upload Modal */}
      <SongUploader
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onTranscriptionComplete={(doc) => {
          setTranscription(doc);
          setCurrentTab('studio');
          handleSeek(0);
        }}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        transcription={transcription}
      />
    </div>
  );
};
