export interface NoteEffects {
  palm_mute: boolean;
  vibrato: boolean;
  hammer: boolean;
  slide: boolean;
  is_dead: boolean;
  harmonic: boolean;
  ghost_note: boolean;
  let_ring: boolean;
  staccato: boolean;
  bend: boolean;
}

export interface NoteEvent {
  time: number;
  duration: number;
  string: number; // 0=Low E, 5=High E
  fret: number;   // 0=open, 1-24
  articulation?: string;
  velocity: number;
  effects: NoteEffects;
  bend_value?: number;
  confidence?: number;
  p_correct?: number;
}

export interface BeatEvent {
  time: number;
  downbeat: boolean;
  beat_in_bar: number;
}

export interface ChordEvent {
  time: number;
  label: string;
  size: number;
}

export interface PlayabilityStats {
  chords: number;
  vetoed: number;
  revoiced: number;
  notes_restrung: number;
  dropped: number;
  unrepairable: number;
  decode_voicing_enum: number;
}

export interface ConsistencyStats {
  chord_groups: number;
  chord_occurrences: number;
  pattern_groups: number;
  pattern_occurrences: number;
  pinned: number;
}

export interface StrumConsensusStats {
  runs: number;
  strums_in_runs: number;
  notes_in_runs: number;
  filled: number;
  mode: string;
  in_run_share: number;
  core_share: number;
  messy_windows: number;
}

export interface HandPathStats {
  clusters: number;
}

export interface TranscriptionDocument {
  id: string;
  filename: string;
  duration_seconds: number;
  tempo: number;
  tuning_midi: number[];
  tuning_names: string[];
  tuning_offset?: number;
  tuning_warning?: string | null;
  capo: number;
  capo_suggested?: number;
  capo_confidence?: number;
  key: string;
  time_signature: [number, number];
  beats: BeatEvent[];
  confidence: number;
  polyphony_mean?: number;
  polyphony_max?: number;
  num_notes: number;
  processing_time_seconds?: number;
  model_arch?: string;
  events: NoteEvent[];
  hidden_events?: NoteEvent[];
  playability?: PlayabilityStats;
  consistency?: ConsistencyStats;
  strum_consensus?: StrumConsensusStats;
  handpath?: HandPathStats;
  alphatex: string;
  alignment?: [number, number][];
  chords: ChordEvent[];
}

export interface JobStatus {
  job_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  stage: string;
  progress: number;
  title?: string;
  error?: string;
  transcription_id?: string;
}
