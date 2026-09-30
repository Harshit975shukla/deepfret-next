import uuid
import time
import asyncio
import shutil
from pathlib import Path
from typing import Dict, Any, Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from config import (
    UPLOAD_DIR, EXPORTS_DIR, STEMS_DIR, SAMPLE_RATE,
    MAX_FILE_SIZE_MB, MAX_DURATION_SECONDS, SUPPORTED_FORMATS,
    MODEL_ARCH, RENDER_VERSION
)
from models.schemas import (
    TranscriptionDocument, JobStatusResponse, NoteEvent, BeatEvent,
    ChordEvent, NoteEffects
)
from engine.audio_processor import AudioProcessor
from engine.transcriber import Transcriber
from engine.fret_allocator import FretAllocator
from engine.chord_detector import ChordDetector
from engine.beat_tracker import BeatTracker
from engine.alphatex_generator import AlphaTexGenerator
from exporters.gp5_exporter import GP5Exporter
from exporters.midi_exporter import MidiExporter
from exporters.musicxml_exporter import MusicXMLExporter
from exporters.pdf_exporter import PDFExporter

app = FastAPI(
    title="DeepFret Next API",
    description="State-of-the-Art AI Guitar Tab Transcription & Interactive Fretboard Studio",
    version="2.0.0"
)

# Enable CORS for local & production web apps
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory stores (In production, replace with Redis / Postgres)
jobs_db: Dict[str, Dict[str, Any]] = {}
transcriptions_db: Dict[str, TranscriptionDocument] = {}

audio_proc = AudioProcessor()
transcriber = Transcriber()
fret_alloc = FretAllocator()
chord_det = ChordDetector()
beat_trk = BeatTracker()

@app.get("/api/info")
def get_system_info():
    """
    Returns system metadata matching DeepFret.com specification.
    """
    return {
        "max_file_size_mb": MAX_FILE_SIZE_MB,
        "max_duration_seconds": MAX_DURATION_SECONDS,
        "supported_formats": SUPPORTED_FORMATS,
        "model_arch": MODEL_ARCH,
        "model_params": 48_500_000,
        "sample_rate": SAMPLE_RATE,
        "accounts_enabled": True,
        "anon_daily_song_limit": 5,
        "anon_preview_sec": 30,
        "render_version": RENDER_VERSION,
        "google_signin": True,
        "billing_enabled": True,
        "free_songs_per_month": 10,
        "pro_max_duration_sec": 1800,
        "pro_price_label": "$12.99/month",
        "trial_days": 7,
        "free_max_duration_sec": 600,
        "free_exports": 3
    }

def run_transcription_pipeline(job_id: str, file_path: Path, title: str):
    """
    Background worker pipeline executing all 5 DSP & ML stages.
    """
    try:
        t0 = time.time()
        job = jobs_db[job_id]

        # Stage 1: Audio Loading & Preprocessing
        job["stage"] = "loading_audio"
        job["progress"] = 0.15
        audio, duration = audio_proc.load_and_preprocess(file_path)

        # Stage 2: Stem Separation (Guitar Isolation)
        job["stage"] = "separating_stems"
        job["progress"] = 0.35
        guitar_path, backing_path = audio_proc.separate_guitar_stem(file_path, job_id)

        # Stage 3: Beat & Tempo Tracking
        job["stage"] = "tracking_beats"
        job["progress"] = 0.50
        tempo, beats, time_sig = beat_trk.track_beats(audio)

        # Stage 4: Neural Note Onsets & Pitch Detection
        job["stage"] = "estimating_pitch"
        job["progress"] = 0.65
        raw_notes = transcriber.predict(audio)

        # Stage 5: Fretboard Assignment & Biomechanical Optimization
        job["stage"] = "mapping_frets"
        job["progress"] = 0.80
        chord_slices, strum_stats = fret_alloc.run_strum_consensus(raw_notes)
        events, playability, handpath, consistency = fret_alloc.optimize_handpath_viterbi(chord_slices)

        # Stage 6: Chord Classification & AlphaTex Generation
        job["stage"] = "generating_alphatex"
        job["progress"] = 0.90
        chords = chord_det.detect_chords(events)
        alphatex = AlphaTexGenerator.generate(title=title, tempo=tempo, events=events, beats=beats)

        transcription_id = f"trans_{uuid.uuid4().hex[:10]}"
        proc_time = round(time.time() - t0, 3)

        doc = TranscriptionDocument(
            id=transcription_id,
            filename=file_path.name,
            duration_seconds=round(duration, 3),
            tempo=tempo,
            time_signature=time_sig,
            beats=beats,
            num_notes=len(events),
            processing_time_seconds=proc_time,
            events=events,
            playability=playability,
            consistency=consistency,
            strum_consensus=strum_stats,
            handpath=handpath,
            alphatex=alphatex,
            chords=chords
        )

        transcriptions_db[transcription_id] = doc
        job["stage"] = "done"
        job["progress"] = 1.0
        job["status"] = "completed"
        job["transcription_id"] = transcription_id

    except Exception as e:
        job = jobs_db[job_id]
        job["status"] = "failed"
        job["error"] = str(e)

@app.post("/api/transcribe")
async def transcribe_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    tuning: Optional[str] = Form("auto"),
    tempo: Optional[int] = Form(None),
    separator: Optional[str] = Form("demucs_ht"),
    lead_rhythm: Optional[bool] = Form(False)
):
    job_id = f"job_{uuid.uuid4().hex[:12]}"
    dest_path = UPLOAD_DIR / f"{job_id}_{file.filename}"
    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    jobs_db[job_id] = {
        "job_id": job_id,
        "status": "processing",
        "stage": "downloading",
        "progress": 0.05,
        "title": file.filename,
        "error": None,
        "transcription_id": None
    }

    background_tasks.add_task(run_transcription_pipeline, job_id, dest_path, file.filename)
    return {"job_id": job_id, "status": "queued", "message": "Transcription started"}

class YouTubeTranscribeRequest(BaseModel):
    url: str
    tuning: Optional[str] = "auto"
    tempo: Optional[int] = None
    separator: Optional[str] = "demucs_ht"
    lead_rhythm: Optional[bool] = False

@app.post("/api/transcribe-youtube")
async def transcribe_youtube(
    req: YouTubeTranscribeRequest,
    background_tasks: BackgroundTasks
):
    job_id = f"job_{uuid.uuid4().hex[:12]}"
    jobs_db[job_id] = {
        "job_id": job_id,
        "status": "processing",
        "stage": "extracting_audio",
        "progress": 0.05,
        "title": "Online Video Audio",
        "error": None,
        "transcription_id": None
    }

    def fetch_and_run():
        import yt_dlp
        out_tmpl = str(UPLOAD_DIR / f"{job_id}_%(title)s.%(ext)s")
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': out_tmpl,
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
            'quiet': True
        }
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(req.url, download=True)
                downloaded_file = Path(ydl.prepare_filename(info)).with_suffix('.mp3')
                title = info.get('title', 'YouTube Video')
                jobs_db[job_id]["title"] = title
                run_transcription_pipeline(job_id, downloaded_file, title)
        except Exception as e:
            jobs_db[job_id]["status"] = "failed"
            jobs_db[job_id]["error"] = f"Failed to download audio: {e}"

    background_tasks.add_task(fetch_and_run)
    return {"job_id": job_id, "status": "queued"}

@app.get("/api/jobs/{job_id}", response_model=JobStatusResponse)
def get_job_status(job_id: str):
    if job_id not in jobs_db:
        raise HTTPException(status_code=404, detail="Job not found")
    return jobs_db[job_id]

@app.get("/api/transcriptions/{trans_id}")
def get_transcription(trans_id: str):
    if trans_id not in transcriptions_db:
        raise HTTPException(status_code=404, detail="Transcription not found")
    return transcriptions_db[trans_id]

@app.post("/api/transcriptions/{trans_id}/export/{export_format}")
def export_transcription(trans_id: str, export_format: str):
    if trans_id not in transcriptions_db:
        raise HTTPException(status_code=404, detail="Transcription not found")
    
    doc = transcriptions_db[trans_id]
    export_format = export_format.lower()
    out_file = EXPORTS_DIR / f"{doc.id}.{export_format}"

    if export_format == "gp5":
        GP5Exporter.export(doc.events, out_file, title=doc.filename, tempo=doc.tempo)
        return FileResponse(out_file, media_type="application/octet-stream", filename=f"{doc.filename}.gp5")
    elif export_format in ["mid", "midi"]:
        MidiExporter.export(doc.events, out_file, tempo=doc.tempo)
        return FileResponse(out_file, media_type="audio/midi", filename=f"{doc.filename}.mid")
    elif export_format in ["xml", "musicxml"]:
        MusicXMLExporter.export(doc.events, out_file, title=doc.filename, tempo=doc.tempo)
        return FileResponse(out_file, media_type="application/xml", filename=f"{doc.filename}.musicxml")
    elif export_format == "pdf":
        PDFExporter.export(doc.events, out_file, title=doc.filename, tempo=doc.tempo)
        return FileResponse(out_file, media_type="application/pdf", filename=f"{doc.filename}.pdf")
    elif export_format == "alphatex":
        return {"alphatex": doc.alphatex}
    elif export_format == "json":
        return doc
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported format: {export_format}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
