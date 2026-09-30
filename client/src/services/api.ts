import { TranscriptionDocument, JobStatus } from '../types/transcription';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function fetchSystemInfo() {
  const res = await fetch(`${API_BASE}/api/info`);
  if (!res.ok) throw new Error('Failed to load system info');
  return res.json();
}

export async function uploadAudioFile(file: File, options: {
  tuning?: string;
  tempo?: number;
  separator?: string;
  leadRhythm?: boolean;
}): Promise<{ job_id: string }> {
  const formData = new FormData();
  formData.append('file', file);
  if (options.tuning) formData.append('tuning', options.tuning);
  if (options.tempo) formData.append('tempo', String(options.tempo));
  if (options.separator) formData.append('separator', options.separator);
  if (options.leadRhythm) formData.append('lead_rhythm', 'true');

  const res = await fetch(`${API_BASE}/api/transcribe`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Audio upload failed');
  return res.json();
}

export async function transcribeYouTube(url: string, options: {
  tuning?: string;
  tempo?: number;
  separator?: string;
  leadRhythm?: boolean;
}): Promise<{ job_id: string }> {
  const res = await fetch(`${API_BASE}/api/transcribe-youtube`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      tuning: options.tuning || 'auto',
      tempo: options.tempo || null,
      separator: options.separator || 'demucs_ht',
      lead_rhythm: options.leadRhythm || false,
    }),
  });
  if (!res.ok) throw new Error('YouTube transcription request failed');
  return res.json();
}

export async function pollJobStatus(jobId: string): Promise<JobStatus> {
  const res = await fetch(`${API_BASE}/api/jobs/${encodeURIComponent(jobId)}`);
  if (!res.ok) throw new Error('Failed to poll job status');
  return res.json();
}

export async function getTranscription(transcriptionId: string): Promise<TranscriptionDocument> {
  const res = await fetch(`${API_BASE}/api/transcriptions/${encodeURIComponent(transcriptionId)}`);
  if (!res.ok) throw new Error('Failed to fetch transcription document');
  return res.json();
}

export function getExportUrl(transcriptionId: string, format: string): string {
  return `${API_BASE}/api/transcriptions/${encodeURIComponent(transcriptionId)}/export/${format}`;
}
