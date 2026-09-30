from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union

class NoteEffects(BaseModel):
    palm_mute: bool = False
    vibrato: bool = False
    hammer: bool = False
    slide: bool = False
    is_dead: bool = False
    harmonic: bool = False
    ghost_note: bool = False
    let_ring: bool = False
    staccato: bool = False
    bend: bool = False

class NoteEvent(BaseModel):
    time: float
    duration: float
    string: int = Field(..., ge=0, le=6, description="0=Low E, 5=High E")
    fret: int = Field(..., ge=0, le=24)
    articulation: str = "none"
    velocity: int = Field(100, ge=0, le=127)
    effects: NoteEffects = Field(default_factory=NoteEffects)
    bend_value: float = 0.0
    confidence: float = 0.95
    p_correct: float = 0.95
    origin: Optional[str] = None
    candidates: List[Any] = Field(default_factory=list)
    flag: bool = False
    reason: Optional[str] = None

class BeatEvent(BaseModel):
    time: float
    downbeat: bool = False
    beat_in_bar: int = 0

class ChordEvent(BaseModel):
    time: float
    label: str
    size: int = 4

class PlayabilityStats(BaseModel):
    chords: int = 0
    vetoed: int = 0
    revoiced: int = 0
    notes_restrung: int = 0
    dropped: int = 0
    unrepairable: int = 0
    decode_voicing_enum: int = 0

class ConsistencyStats(BaseModel):
    chord_groups: int = 0
    chord_occurrences: int = 0
    pattern_groups: int = 0
    pattern_occurrences: int = 0
    pinned: int = 0

class StrumConsensusStats(BaseModel):
    runs: int = 0
    strums_in_runs: int = 0
    notes_in_runs: int = 0
    filled: int = 0
    mode: str = "standard"
    in_run_share: float = 0.0
    core_share: float = 1.0
    messy_windows: int = 0

class HandPathStats(BaseModel):
    clusters: int = 0

class TranscriptionDocument(BaseModel):
    id: str
    filename: str
    duration_seconds: float
    tempo: int = 120
    tuning_midi: List[int] = Field(default_factory=lambda: [40, 45, 50, 55, 59, 64])
    tuning_names: List[str] = Field(default_factory=lambda: ["E", "A", "D", "G", "B", "E"])
    tuning_offset: int = 0
    tuning_warning: Optional[str] = None
    capo: int = 0
    capo_suggested: int = 0
    capo_confidence: float = 0.0
    key: str = "E minor"
    time_signature: List[int] = Field(default_factory=lambda: [4, 4])
    beats: List[BeatEvent] = Field(default_factory=list)
    confidence: float = 0.95
    polyphony_mean: float = 2.0
    polyphony_max: int = 6
    num_notes: int = 0
    processing_time_seconds: float = 0.0
    model_arch: str = "hybrid_demucs_v4+conformer_crnn_pp"
    events: List[NoteEvent] = Field(default_factory=list)
    hidden_events: List[NoteEvent] = Field(default_factory=list)
    playability: PlayabilityStats = Field(default_factory=PlayabilityStats)
    consistency: ConsistencyStats = Field(default_factory=ConsistencyStats)
    strum_consensus: StrumConsensusStats = Field(default_factory=StrumConsensusStats)
    handpath: HandPathStats = Field(default_factory=HandPathStats)
    regions: List[Any] = Field(default_factory=list)
    regions_meta: Dict[str, Any] = Field(default_factory=lambda: {"mode": "standard"})
    alphatex: str = ""
    alignment: List[List[float]] = Field(default_factory=list)
    chords: List[ChordEvent] = Field(default_factory=list)
    effects_policy: Dict[str, str] = Field(default_factory=lambda: {
        "palm_mute": "show",
        "is_dead": "show",
        "hammer": "show",
        "slide": "show",
        "bend": "show",
        "vibrato": "show",
        "harmonic": "show",
        "ghost_note": "show",
        "let_ring": "show",
        "staccato": "show"
    })
    stats: Dict[str, Any] = Field(default_factory=lambda: {
        "voices_used": 6,
        "techniques": {"dead_note": 0, "bend": 0, "slide": 0}
    })

class JobStatusResponse(BaseModel):
    job_id: str
    status: str # queued, processing, completed, failed
    stage: str  # downloading, separating_stems, estimating_pitch, mapping_frets, generating_alphatex, done
    progress: float = 0.0 # 0.0 to 1.0
    title: Optional[str] = None
    error: Optional[str] = None
    transcription_id: Optional[str] = None
