# DeepFret Next — Production Deployment Guide

This guide describes how to deploy **DeepFret Next** on modern cloud infrastructure with GPU acceleration for audio source separation and neural transcription.

---

## 1. Architecture Deployment Topology

```
                  [ Cloudflare / Route53 DNS ]
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
 [ Vercel / Cloudflare Pages ]           [ AWS / GCP / Modal GPU ]
  React 19 + Three.js Frontend            FastAPI Transcription Engine
  (Static Edge Assets)                    (Demucs + CRNN / PyTorch)
            │                                     │
            └──────────────────┬──────────────────┘
                               ▼
                   [ AWS S3 / Cloud Storage ]
                 Audio Stems, Tabs, Model Weights
```

---

## 2. Server Requirements
* **Recommended GPU**: NVIDIA T4, A10G, L4, or RTX 3090/4090 with >= 8GB VRAM.
* **CPU**: 4+ vCPUs.
* **RAM**: 16 GB+.
* **Disk**: 50 GB SSD (for model cache & temporary audio stems).
* **System Packages**: `ffmpeg`, `libsndfile1`.

---

## 3. Serverless GPU Deployment (Modal / RunPod)

DeepFret transcription is bursty (users upload a song, it processes for 4–8 seconds, then is idle). Serverless GPU platforms like Modal or RunPod are 80% cheaper than dedicated instances.

### Modal Implementation Example (`server/modal_app.py`)
```python
import modal

app = modal.App("deepfret-next")
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg", "libsndfile1")
    .pip_install("torch", "torchaudio", "demucs", "librosa", "fastapi", "mido", "pyguitarpro")
)

@app.function(gpu="T4", timeout=600, image=image)
def process_audio_transcription(audio_bytes: bytes, options: dict):
    from engine.audio_processor import AudioProcessor
    from engine.transcriber import Transcriber
    from engine.fret_allocator import FretAllocator

    processor = AudioProcessor()
    transcriber = Transcriber()
    allocator = FretAllocator()

    # 1. Stem separation
    guitar_audio, backing_audio = processor.separate_guitar(audio_bytes)
    # 2. Neural pitch detection
    raw_events = transcriber.predict(guitar_audio)
    # 3. Biomechanical fret assignment
    document = allocator.optimize(raw_events, options)

    return document
```

---

## 4. Docker Deployment

### Run Locally with Docker Compose:
```bash
docker-compose up -d --build
```

### Build and Push Container:
```bash
docker build -t your-registry/deepfret-server:latest -f server/Dockerfile server/
docker push your-registry/deepfret-server:latest
```

---

## 5. Environment Variables

Create `.env` file in `server/`:
```env
PORT=8000
ENVIRONMENT=production
MODEL_CACHE_DIR=/models
MAX_FILE_SIZE_MB=100
MAX_DURATION_SECONDS=1200
CORS_ORIGINS=https://yourdomain.com,http://localhost:5173
STORAGE_BACKEND=local # or s3 / gcs
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
S3_BUCKET_NAME=deepfret-audio-stems
```
