# DeepFret Next 🎸⚡
> **Next-Generation AI Guitar Tab Transcription, Interactive 3D Fretboard Studio, and Learning Platform**

[![GitHub Stars](https://img.shields.io/github/stars/Harshit975shukla/deepfret-next?style=social)](https://github.com/Harshit975shukla/deepfret-next)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11%2B-brightgreen.svg)](https://www.python.org/)
[![React 19](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-3D%20Fretboard-black.svg)](https://threejs.org/)

---

## 📖 Overview

**DeepFret Next** is a state-of-the-art open-source recreation and major enhancement of [deepfret.com](https://deepfret.com/). It converts real acoustic and electric guitar audio recordings (or YouTube / TikTok / Instagram links) into playable, mathematically optimized guitar tablature, complete with per-string voice tracking, interactive 3D neck animations, backing-track stem isolation, and direct export to Guitar Pro, MIDI, and MusicXML.

---

## 🔍 In-Depth DeepFret Reverse-Engineering Analysis

Through inspection of `deepfret.com`'s live production payloads, bundles, and metadata, we determined the exact inner workings of the original system:

### 1. The Core Problems It Solves
1. **The Inverse Guitar Problem (Ambiguity)**: Unlike a piano where Middle C ($C_4 = 261.63\text{ Hz}$) has exactly one key, on a standard guitar $C_4$ can be played on:
   - String 1 (High E), Fret 8
   - String 2 (B), Fret 13
   - String 3 (G), Fret 17
   - String 4 (D), Fret 22
   A naive pitch detector has no way of knowing *which* fret was played.
2. **Physical Human Biomechanics**: A human hand has 4 fretting fingers with a maximum span of 4–5 frets in standard positions. Neural nets that predict frets independently often generate unplayable fingerings (e.g., Fret 2 on string 6 and Fret 12 on string 5 simultaneously).
3. **Polyphonic Audio Clutter**: When drums, vocals, and bass are present, fundamental frequency ($f_0$) tracking fails without source isolation.

### 2. DeepFret's Reverse-Engineered Architecture
* **Frontend**: React 18 SPA bundled with Vite, styled with a warm acoustic paper aesthetic (`#F1E9D6`), Three.js 3D neck animation, custom SVG tablature rendering, and Web Audio API playhead engine.
* **Audio Processing Engine**:
  - Sample Rate: $22,050\text{ Hz}$ (standard for Music Information Retrieval).
  - Stem Separation: Demucs / Hybrid Demucs isolating guitar tracks from vocals, drums, and bass.
  - Multi-track splitting: Optional separation into Lead vs. Rhythm guitar parts.
* **Neural Transcription Model**:
  - Identified in production headers: `model_arch: "kong_crnn_pp+mdl_v3"`.
  - Convolutional Recurrent Neural Network (CRNN) with multi-head outputs: onset detection, frame activation, string classification, and velocity.
* **Post-Processing & Optimization Pipeline**:
  - `playability`: Biomechanical hand span constraints; filters unplayable fingerings, re-voices chords, restrings impossible jumps.
  - `handpath`: Viterbi dynamic programming clustering fretboard hand positions to minimize longitudinal movement along the guitar neck.
  - `strum_consensus`: Detects strum envelopes and aggregates microsecond note offsets (arpeggiation) into unified chord voicings.
  - `consistency`: Pattern matching across recurring musical motifs to ensure identical riffs are played in identical fretboard positions.
* **Export Engine**:
  - Guitar Pro (`.gp5` / `.gpx`)
  - Multi-track MIDI (Type 1, 1 channel per string for independent pitch bends)
  - MusicXML
  - PDF printable sheets
  - AlphaTex notation for AlphaTab rendering

---

## 🚀 How We Mimic and Make It BETTER

While `deepfret.com` is a strong platform, **DeepFret Next** fixes its limitations and introduces next-generation innovations:

| Feature | Original DeepFret.com | DeepFret Next (Our Version) |
|---|---|---|
| **Audio Model** | Fixed CRNN (`kong_crnn_pp+mdl_v3`) | **Multi-Model Ensemble**: Hybrid Demucs v4 + SOTA Conformer / Transformer / BasicPitch2 + Microtonal pitch bend estimator |
| **Client-Side Inference** | ❌ Server-only (requires GPU queue) | ✅ **Dual Mode**: Cloud GPU worker OR In-Browser **WebGPU / ONNX Runtime** for 100% free, private, instant transcription |
| **Tab Editing** | ❌ Read-only practice player | ✅ **Full Interactive Tab Editor**: Drag frets, revoice chords, transpose keys with real-time playability re-scoring |
| **3D Neck Visualization** | Static 3D neck with 3 indicator colors | ✅ **Photorealistic 3D Neck** (Acoustic, Stratocaster, Les Paul) + **Biomechanical Hand/Finger Avatar** showing exact finger positions (Index, Middle, Ring, Pinky) |
| **Microphone Practice Coach** | ❌ None | ✅ **Live Audio Mic Feedback**: Evaluates user playing real guitar via browser mic, scoring pitch & timing accuracy in real-time |
| **Supported Instruments** | 6-String Guitar only | ✅ **Multi-Instrument**: 6-String, 7-String, 4/5-String Bass, Ukulele, Banjo |
| **Export Formats** | GP5, MIDI, MusicXML, PDF | ✅ GP5/GPX, MIDI (MPE Channel-Per-String), MusicXML, SVG, PDF, AlphaTex, JSON, ASCII Tab |
| **Audio Stem Playback** | Pre-rendered MP3 stems | ✅ **Interactive Web Audio 4-Channel Stem Mixer** (Guitar, Bass, Drums, Vocals) with independent volume/mute/solo |

---

## 📂 Repository Structure

```tree
deepfret-next/
├── README.md                          # Project documentation and roadmap
├── ARCHITECTURE.md                    # Deep dive into algorithms and math
├── docker-compose.yml                 # Local full-stack development orchestration
├── docs/                              # Detailed reverse engineering & specs
│   ├── deepfret_reverse_engineering.md# Full audit of deepfret.com
│   ├── api_specification.md           # OpenAPI / REST endpoint spec
│   ├── algorithms_and_heuristics.md   # Biomechanical playability & Viterbi algorithms
│   └── deployment_guide.md            # Cloud GPU deployment (AWS, GCP, RunPod, Modal)
├── server/                            # Python FastAPI Backend
│   ├── main.py                        # FastAPI application entrypoint
│   ├── config.py                      # Server settings and audio paths
│   ├── requirements.txt               # PyTorch, Librosa, Demucs, PyGuitarPro, Mido
│   ├── Dockerfile                     # Production container with FFmpeg
│   ├── models/
│   │   └── schemas.py                 # Pydantic models matching reverse-engineered JSON
│   ├── engine/
│   │   ├── audio_processor.py         # Stem separation & audio normalization
│   │   ├── transcriber.py             # Neural note onset & string detection
│   │   ├── fret_allocator.py          # Biomechanical playability & Viterbi handpath
│   │   ├── chord_detector.py          # Polyphonic chord analysis
│   │   ├── beat_tracker.py            # Tempo, downbeats, bar alignment
│   │   └── alphatex_generator.py      # AlphaTab format builder
│   └── exporters/
│       ├── gp5_exporter.py            # Guitar Pro 5 writer
│       ├── midi_exporter.py           # 6-channel per-string MIDI writer
│       ├── musicxml_exporter.py       # Standard MusicXML generator
│       └── pdf_exporter.py            # PDF sheet generator
└── client/                            # React 19 + TypeScript + Three.js Frontend
    ├── package.json                   # Vite, Tailwind, Three.js, Lucide
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx                    # Studio and Landing views
    │   ├── types/transcription.ts     # Complete TypeScript data model
    │   ├── services/
    │   │   ├── api.ts                 # FastAPI client
    │   │   └── audioPlayer.ts         # Multi-stem Web Audio engine
    │   ├── data/
    │   │   └── sampleSong.ts          # Embedded sample song tab
    │   └── components/
    │       ├── Navbar.tsx             # Header with Studio navigation
    │       ├── Hero.tsx               # Landing hero with quick links
    │       ├── ThreeFretboard.tsx     # 3D Three.js Neck with animations
    │       ├── TabStaff.tsx           # Custom SVG Guitar Tab notation
    │       ├── PlaybackBar.tsx        # Speed, loop, audio stem selector
    │       ├── SongUploader.tsx       # YouTube/TikTok/File drop ingestion
    │       ├── TabEditor.tsx          # Real-time note & voicing editor
    │       ├── StemMixer.tsx          # 4-track stem volume mixer
    │       ├── MicPitchEvaluator.tsx  # Browser mic guitar hero coach
    │       ├── PlayabilityStatsView.ts# Fretboard metrics breakdown
    │       └── ExportModal.tsx        # GP5, MIDI, MusicXML, PDF download
```

---

## ⚡ Quick Start

### Prerequisites
* **Node.js**: v18+ or v20+
* **Python**: 3.11+
* **FFmpeg**: Installed and available in PATH (for audio decoding and stem separation)
* Optional: NVIDIA GPU with CUDA for accelerated neural inference.

### 1. Run the Frontend (Vite + React Studio)
```bash
cd client
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser. The studio immediately loads with the built-in interactive demo song, 3D fretboard, and SVG tab notation.

### 2. Run the Backend API (FastAPI)
```bash
cd server
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python main.py
```
API docs available at: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Run with Docker Compose
```bash
docker-compose up --build
```

---

## 🧩 Reverse-Engineered Data Format (`sample.json`)

DeepFret output uses a high-density JSON schema representing note events, acoustic statistics, and post-processed playability scores. Here is an excerpt from `sample.json`:

```json
{
  "duration_seconds": 44.348,
  "tempo": 92,
  "key": "E minor",
  "time_signature": [4, 4],
  "confidence": 0.9075,
  "model_arch": "kong_crnn_pp+mdl_v3",
  "events": [
    {
      "time": 0.0509,
      "duration": 0.1,
      "string": 0,
      "fret": 0,
      "articulation": "none",
      "velocity": 103,
      "effects": {
        "palm_mute": false,
        "vibrato": false,
        "hammer": false,
        "slide": false,
        "is_dead": true,
        "harmonic": false,
        "bend": false
      },
      "confidence": 0.7616
    }
  ],
  "playability": {
    "chords": 21,
    "vetoed": 0,
    "revoiced": 0,
    "notes_restrung": 0,
    "decode_voicing_enum": 21
  },
  "handpath": { "clusters": 96 },
  "alphatex": "\\title \"sample\"\\ntempo 92\\ninstrument 25\\ntuning (E4 B3 G3 D3 A2 E2)\\n..."
}
```

---

## 📜 License

MIT License. Designed and maintained by [Harshit Shukla](https://github.com/Harshit975shukla).
