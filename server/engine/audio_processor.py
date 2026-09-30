import subprocess
import os
import shutil
from pathlib import Path
from typing import Tuple, Optional
import numpy as np
import librosa
import soundfile as sf
from config import SAMPLE_RATE, STEMS_DIR

class AudioProcessor:
    """
    Handles audio loading, resample to 22.05kHz, normalization,
    and source separation (Demucs) to extract clean guitar stems.
    """

    def __init__(self, sample_rate: int = SAMPLE_RATE):
        self.sample_rate = sample_rate

    def load_and_preprocess(self, file_path: Path) -> Tuple[np.ndarray, float]:
        """
        Loads an audio file, converts to mono, resamples to target sample rate (22.05 kHz),
        and normalizes loudness.
        """
        audio, sr = librosa.load(str(file_path), sr=self.sample_rate, mono=True)
        # Peak normalize to -1.0 to 1.0
        max_val = np.max(np.abs(audio))
        if max_val > 0:
            audio = audio / max_val * 0.95
        duration = float(len(audio)) / self.sample_rate
        return audio, duration

    def separate_guitar_stem(self, input_file: Path, job_id: str) -> Tuple[Path, Optional[Path]]:
        """
        Runs Demucs to separate guitar from drums, bass, and vocals.
        Returns paths: (isolated_guitar_path, backing_track_path).
        If demucs is not installed or fails, falls back gracefully to the original file.
        """
        out_dir = STEMS_DIR / job_id
        out_dir.mkdir(parents=True, exist_ok=True)
        guitar_stem = out_dir / "guitar.wav"
        backing_stem = out_dir / "backing.wav"

        # Check if Demucs CLI is available
        demucs_bin = shutil.which("demucs")
        if demucs_bin:
            try:
                cmd = [
                    demucs_bin,
                    "-n", "htdemucs_6s", # 6-source model includes guitar & piano
                    "--two-stems=guitar",
                    "-o", str(out_dir),
                    str(input_file)
                ]
                subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                
                # Check output path
                # Demucs writes to out_dir / model_name / track_name / guitar.wav
                found_guitars = list(out_dir.glob("**/guitar.wav"))
                if found_guitars:
                    shutil.copy(found_guitars[0], guitar_stem)
                    
                found_no_guitars = list(out_dir.glob("**/no_guitar.wav"))
                if found_no_guitars:
                    shutil.copy(found_no_guitars[0], backing_stem)
                    
                if guitar_stem.exists():
                    return guitar_stem, backing_stem if backing_stem.exists() else None
            except Exception as e:
                print(f"[AudioProcessor] Demucs separation notice: {e}, falling back to direct audio")

        # Fallback: copy original to guitar stem location
        shutil.copy(input_file, guitar_stem)
        return guitar_stem, None
