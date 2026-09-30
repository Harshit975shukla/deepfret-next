# DeepFret Next — REST API Specification

This document provides the complete OpenAPI / REST specification for the **DeepFret Next** backend.

---

## Base URL
* Local: `http://localhost:8000/api`
* Production: `https://api.yourdomain.com/api`

---

## 1. System Metadata

### `GET /api/info`
Returns backend configuration, supported file constraints, active AI model parameters, and subscription tiers.

**Response:**
```json
{
  "max_file_size_mb": 100,
  "max_duration_seconds": 600,
  "supported_formats": [".mp3", ".wav", ".flac", ".ogg", ".m4a", ".aac"],
  "model_arch": "hybrid_demucs_v4+conformer_guitar_v2",
  "sample_rate": 22050,
  "accounts_enabled": true,
  "free_songs_per_month": 5,
  "pro_max_duration_sec": 1200,
  "pro_price_label": "$12.99/month",
  "render_version": "deepfret-next-v1.0"
}
```

---

## 2. Transcription Pipeline

### `POST /api/transcribe`
Upload a raw audio file for processing.

**Headers:**
`Content-Type: multipart/form-data`

**Parameters:**
* `file`: Audio file binary (MP3, WAV, FLAC, M4A, AAC, OGG).
* `tuning` *(optional, string)*: `auto` (default), `standard`, `drop_d`, `dadgad`, `half_step_down`, `open_d`, `open_g`.
* `tempo` *(optional, integer)*: Manual BPM override (e.g. `120`). If omitted, automatic beat-tracking is used.
* `separator` *(optional, string)*: `demucs_ht` (default), `spleeter`, or `none`.
* `lead_rhythm` *(optional, boolean)*: Set `true` to split guitar tracks into Lead and Rhythm tabs.

**Response (202 Accepted):**
```json
{
  "job_id": "job_9b3e18a7c4f",
  "status": "queued",
  "stage": "downloading",
  "progress": 0.05,
  "message": "Audio file uploaded successfully"
}
```

---

### `POST /api/transcribe-youtube`
Ingest and transcribe audio directly from an online video link.

**Headers:**
`Content-Type: application/json`

**Body:**
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "tuning": "auto",
  "tempo": null,
  "separator": "demucs_ht",
  "lead_rhythm": false
}
```

**Response (202 Accepted):**
```json
{
  "job_id": "job_c7a1024fb9e",
  "status": "queued",
  "stage": "extracting_audio",
  "progress": 0.1
}
```

---

### `GET /api/jobs/{job_id}`
Poll the execution status of a transcription job.

**Response:**
```json
{
  "job_id": "job_9b3e18a7c4f",
  "status": "processing",
  "stage": "mapping_frets",
  "progress": 0.72,
  "title": "Neon (Live Acoustic)",
  "error": null,
  "transcription_id": "trans_5a7c29"
}
```

**Job Stages:**
1. `downloading` / `extracting_audio`
2. `separating_stems` (Demucs guitar stem isolation)
3. `estimating_pitch` (Neural onsets & frame activations)
4. `mapping_frets` (Viterbi hand-path & playability optimization)
5. `generating_alphatex` (AlphaTab compilation)
6. `done`

---

### `GET /api/transcriptions/{id}`
Retrieve the full transcription document containing note events, beats, tuning, chords, and AlphaTex tablature.

**Response:**
Returns complete `TranscriptionDocument` schema (refer to `server/models/schemas.py`).

---

## 3. Audio Stems

### `GET /api/transcriptions/{id}/audio?kind={kind}`
Stream isolated audio stems for synchronized playback.

**Query Parameters:**
* `kind`:
  * `full`: Original complete audio mix.
  * `stem`: Isolated acoustic / electric guitar audio.
  * `backing`: Instrumental backing track with guitar removed (play-along mode).
  * `transcribed`: Synthesized steel-string guitar soundfont audio.

---

## 4. Export Formats

### `POST /api/transcriptions/{id}/export/{format}`
Compile and download the tablature in the requested format.

**Path Parameters:**
* `format`:
  * `gp5`: Guitar Pro 5 format (`.gp5`).
  * `midi`: MPE 6-Channel MIDI (`.mid`).
  * `musicxml`: Sheet music standard (`.musicxml`).
  * `pdf`: Printable score & tablature sheet (`.pdf`).
  * `alphatex`: Plain AlphaTex text (`.txt`).
  * `json`: Full raw analysis payload (`.json`).

**Response:**
Binary file stream with `Content-Disposition: attachment; filename="song_name.{format}"`.
