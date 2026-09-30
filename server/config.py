import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
STEMS_DIR = DATA_DIR / "stems"
EXPORTS_DIR = DATA_DIR / "exports"

for d in [DATA_DIR, UPLOAD_DIR, STEMS_DIR, EXPORTS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# Audio & Processing Defaults
SAMPLE_RATE = int(os.getenv("SAMPLE_RATE", "22050"))
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "100"))
MAX_DURATION_SECONDS = int(os.getenv("MAX_DURATION_SECONDS", "1200"))
SUPPORTED_FORMATS = [".mp3", ".wav", ".flac", ".ogg", ".m4a", ".aac"]

# Model Architecture Configuration
MODEL_ARCH = "hybrid_demucs_v4+conformer_crnn_pp"
RENDER_VERSION = "deepfret-next-v2.0.musescore-steel"

# Standard Guitar Tuning (Low to High: E2, A2, D3, G3, B3, E4)
STANDARD_TUNING_MIDI = [40, 45, 50, 55, 59, 64]
STANDARD_TUNING_NAMES = ["E", "A", "D", "G", "B", "E"]
