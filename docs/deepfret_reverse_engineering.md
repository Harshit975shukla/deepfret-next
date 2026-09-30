# DeepFret.com Reverse-Engineering & Technical Audit Report

## 1. Domain & Service Identity
* **URL**: `https://deepfret.com/`
* **Title**: "DeepFret — Guitar tab from any recording"
* **Tagline**: "Serious AI guitar transcription. Upload audio, get playable tab with every voice tracked to its string — measured on real recordings."
* **Theme & UI**: Warm cream/sepia paper styling (`#F1E9D6`), typography matching vintage guitar songbooks.

---

## 2. Reverse-Engineered Frontend Stack
* **Bundler & Framework**: Vite + React 18 / 19 SPA.
* **Routes Discovered**:
  * `/` (Landing page with interactive demo tour and upload trigger)
  * `/studio/:id` (Main interactive tab player & fretboard studio)
  * `/library` (User library of saved transcriptions)
  * `/pricing` (Subscription tiers and Paddle checkout)
  * `/account` (User profile and session management)
  * `/s/:token` (Public read-only shared tab link)
  * `/lab/neck` (Developer testing lab for 3D guitar neck)
  * `/lab/capture` (Direct microphone capture test)
* **3D Visualizer**:
  * Three.js (`assets/three-D-*.js`, 612 KB bundle).
  * GLTF 3D model: `/dev-models/mraz/scene.gltf`.
  * Animated camera curve: `lookCurve`.
  * Interactive 3-color note indicator system:
    * *Now*: Note strike indicator ball on string & fret.
    * *Coming*: Fret circle with curved trajectory arc from previous hand position.
    * *Hold*: Sustained note duration ring.
    * *Nut*: Open string indicator on headstock nut.
* **Tablature Rendering**:
  * Custom SVG-based renderer (`TabStaff-*.js`) that dynamically generates 6 guitar strings, note numbers, measure bars, chords, and animated playhead.
* **Audio Playback Engine**:
  * Web Audio API `AudioContext` with pitch-preserving time-stretching (`0.25x`, `0.5x`, `0.75x`, `1.0x`, `1.15x`).
  * A-B bar looping.
  * Audio stem selection:
    * `/sample/sample.mp3` (Full mix)
    * `/sample/sample.stem.mp3` (Isolated guitar stem)
    * `/sample/sample.transcribed.mp3` (Synthesized tab audio using MuseScore SoundFont)

---

## 3. Reverse-Engineered Backend Architecture
* **API Prefix**: `/api`
* **Endpoint Analysis**:
  * `GET /api/info`:
    ```json
    {
      "max_file_size_mb": 100,
      "max_duration_seconds": 600,
      "supported_formats": [".mp3", ".wav", ".flac", ".ogg", ".m4a", ".aac"],
      "model_arch": "cfg_3",
      "sample_rate": 22050,
      "accounts_enabled": true,
      "free_songs_per_month": 5,
      "pro_max_duration_sec": 1200,
      "pro_price_label": "$12.99/month",
      "trial_days": 7,
      "free_max_duration_sec": 600,
      "free_exports": 1,
      "render_version": "2026-09-06.musescore-steel.v4"
    }
    ```
  * `POST /api/transcribe`:
    * Request: `multipart/form-data` with `file`, `tuning` (e.g. `auto`, `standard`, `drop_d`), `tempo`, `separator` (`demucs`), `lead_rhythm` (boolean).
  * `POST /api/transcribe-youtube`:
    * Request: JSON `{ "url": "https://...", "tuning": null, "tempo": null, "separator": null, "lead_rhythm": false }`.
  * `GET /api/jobs/:id`:
    * Polls progress percentage and stage descriptions:
      * `downloading`
      * `separating_stems`
      * `estimating_pitch`
      * `mapping_frets`
      * `optimizing_playability`
      * `generating_alphatex`
      * `done`
  * `GET /api/transcriptions/:id`: Returns full transcription payload (`sample.json`).
  * `GET /api/transcriptions/:id/audio?kind=stem|full|transcribed`: Returns audio stream.
  * `POST /api/transcriptions/:id/export/:format`:
    * Formats: `gp5` (Guitar Pro), `midi` (MPE Multi-track), `musicxml`, `pdf`.

---

## 4. Reverse-Engineered Schema Details (`sample.json`)
The transcription document contains 33 top-level properties:
1. `duration_seconds`: Float (song length)
2. `tempo`: Integer (detected BPM)
3. `tuning_midi`: Array of 6 integers (e.g., `[40, 45, 50, 55, 59, 64]` for E-A-D-G-B-e)
4. `tuning_names`: Array of 6 pitch names (e.g., `["E", "A", "D", "G", "B", "E"]`)
5. `capo`: Integer fret offset (0 if no capo)
6. `capo_suggested`: Suggested capo position for simplified fingerings
7. `key`: Detected musical key (e.g., `"E minor"`)
8. `time_signature`: Array `[numerator, denominator]` (e.g. `[4, 4]`)
9. `beats`: Array of beat markers with `time`, `downbeat` (boolean), and `beat_in_bar`
10. `confidence`: Overall transcription model confidence score (0.0 - 1.0)
11. `events`: Array of note events containing:
    * `time`, `duration`, `string` (0-5), `fret` (0-24), `velocity` (0-127), `confidence`
    * `effects`: `{ palm_mute, vibrato, hammer, slide, is_dead, harmonic, ghost_note, let_ring, staccato, bend }`
    * `bend_value`: Pitch bend in semitones
12. `playability`: Stats on biomechanical filtering (`chords`, `vetoed`, `revoiced`, `notes_restrung`, `dropped`)
13. `strum_consensus`: Stats on strum merging (`runs`, `strums_in_runs`, `notes_in_runs`, `filled`)
14. `handpath`: `{ clusters: N }`
15. `alphatex`: Complete AlphaTab notation string ready for staff rendering
16. `chords`: Detected chord timestamps and names (e.g. `{ time: 20.89, label: "Em", size: 4 }`)
