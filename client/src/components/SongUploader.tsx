import React, { useState } from 'react';
import { Upload, Youtube, X, Loader2, Music, CheckCircle2 } from 'lucide-react';
import { uploadAudioFile, transcribeYouTube, pollJobStatus, getTranscription } from '../services/api';
import { TranscriptionDocument } from '../types/transcription';

interface SongUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscriptionComplete: (doc: TranscriptionDocument) => void;
}

export const SongUploader: React.FC<SongUploaderProps> = ({
  isOpen,
  onClose,
  onTranscriptionComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'youtube'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [tuning, setTuning] = useState('auto');
  const [leadRhythm, setLeadRhythm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStage, setProgressStage] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartTranscription = async () => {
    setErrorMsg(null);
    setIsProcessing(true);
    setProgressStage('Initializing job...');
    setProgressPct(5);

    try {
      let jobId = '';
      if (activeTab === 'upload') {
        if (!file) {
          setErrorMsg('Please select an audio file');
          setIsProcessing(false);
          return;
        }
        const res = await uploadAudioFile(file, { tuning, leadRhythm });
        jobId = res.job_id;
      } else {
        if (!url.trim()) {
          setErrorMsg('Please enter a valid link');
          setIsProcessing(false);
          return;
        }
        const res = await transcribeYouTube(url, { tuning, leadRhythm });
        jobId = res.job_id;
      }

      // Poll job progress
      const pollInterval = setInterval(async () => {
        try {
          const status = await pollJobStatus(jobId);
          setProgressStage(status.stage.replace(/_/g, ' '));
          setProgressPct(Math.round(status.progress * 100));

          if (status.status === 'completed' && status.transcription_id) {
            clearInterval(pollInterval);
            const doc = await getTranscription(status.transcription_id);
            setIsProcessing(false);
            onTranscriptionComplete(doc);
            onClose();
          } else if (status.status === 'failed') {
            clearInterval(pollInterval);
            setIsProcessing(false);
            setErrorMsg(status.error || 'Transcription failed');
          }
        } catch {
          // Retry
        }
      }, 1000);
    } catch (err: unknown) {
      setIsProcessing(false);
      const message = err instanceof Error ? err.message : 'Upload failed. Check backend connection.';
      setErrorMsg(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-studio-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-paper border border-paper-border rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-5">
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-paper-dark text-studio-600 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <h2 className="text-2xl font-serif font-black text-studio-900">Transcribe New Song</h2>
          <p className="text-xs text-studio-600">
            Upload your recording or paste an online link to extract full guitar tablature.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-paper-dark rounded-xl border border-paper-border text-xs font-semibold">
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-2 rounded-lg flex items-center justify-center gap-2 transition ${
              activeTab === 'upload' ? 'bg-paper text-studio-900 shadow-sm' : 'text-studio-600'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Audio File</span>
          </button>
          <button
            onClick={() => setActiveTab('youtube')}
            className={`py-2 rounded-lg flex items-center justify-center gap-2 transition ${
              activeTab === 'youtube' ? 'bg-paper text-studio-900 shadow-sm' : 'text-studio-600'
            }`}
          >
            <Youtube className="w-4 h-4 text-red-600" />
            <span>YouTube / Video Link</span>
          </button>
        </div>

        {/* Upload Mode */}
        {activeTab === 'upload' ? (
          <div
            onClick={() => document.getElementById('audioFileInput')?.click()}
            className="border-2 border-dashed border-paper-border hover:border-guitar-amber rounded-2xl p-6 text-center bg-paper-light/50 cursor-pointer transition space-y-2"
          >
            <input
              id="audioFileInput"
              type="file"
              accept=".mp3,.wav,.flac,.ogg,.m4a,.aac"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
            />
            <div className="w-12 h-12 mx-auto rounded-full bg-guitar-amber/15 text-guitar-amber flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-studio-900">
                {file ? file.name : 'Click to drop audio file here'}
              </p>
              <p className="text-[11px] text-studio-600">Supports MP3, WAV, FLAC, M4A up to 100MB</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-xs font-bold text-studio-800">Video or Audio URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-paper-border bg-paper-light text-xs text-studio-900 focus:outline-none focus:border-guitar-amber"
            />
          </div>
        )}

        {/* Options */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="font-bold text-studio-800 block mb-1">Tuning</label>
            <select
              value={tuning}
              onChange={(e) => setTuning(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-paper-border bg-paper-light text-xs text-studio-800 outline-none"
            >
              <option value="auto">Auto-detect tuning</option>
              <option value="standard">Standard (E A D G B E)</option>
              <option value="drop_d">Drop D (D A D G B E)</option>
              <option value="dadgad">DADGAD</option>
              <option value="half_step_down">Half-Step Down (Eb)</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-studio-800 block mb-1">Guitar Tracks</label>
            <select
              value={leadRhythm ? 'split' : 'single'}
              onChange={(e) => setLeadRhythm(e.target.value === 'split')}
              className="w-full px-3 py-2 rounded-xl border border-paper-border bg-paper-light text-xs text-studio-800 outline-none"
            >
              <option value="single">Single Tab (All Guitars)</option>
              <option value="split">Lead & Rhythm Split</option>
            </select>
          </div>
        </div>

        {/* Progress or Errors */}
        {isProcessing && (
          <div className="space-y-2 bg-paper-dark p-3 rounded-xl border border-paper-border">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="capitalize font-bold text-guitar-amber flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {progressStage}...
              </span>
              <span>{progressPct}%</span>
            </div>
            <div className="w-full bg-paper-border rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-guitar-amber h-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-100 border border-red-300 text-red-700 text-xs rounded-xl">
            {errorMsg}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleStartTranscription}
          disabled={isProcessing}
          className="w-full py-3 rounded-2xl bg-studio-900 hover:bg-studio-800 disabled:opacity-50 text-paper font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-guitar-amber" />
              <span>Transcribing Neural Audio...</span>
            </>
          ) : (
            <>
              <Music className="w-4 h-4 text-guitar-amber" />
              <span>Begin AI Transcription</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
