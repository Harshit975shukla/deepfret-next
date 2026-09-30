import numpy as np
import librosa
from typing import List, Tuple
from models.schemas import BeatEvent
from config import SAMPLE_RATE

class BeatTracker:
    """
    Detects tempo (BPM), beat timings, downbeats (measure starts), and bar positions.
    """

    def __init__(self, sample_rate: int = SAMPLE_RATE):
        self.sample_rate = sample_rate

    def track_beats(self, audio: np.ndarray) -> Tuple[int, List[BeatEvent], List[int]]:
        """
        Returns:
            tempo: integer BPM
            beats: list of BeatEvent (time, downbeat, beat_in_bar)
            time_signature: [numerator, denominator] e.g. [4, 4]
        """
        # Estimate tempo and frame-level beats using librosa beat tracker
        tempo, beat_frames = librosa.beat.beat_track(
            y=audio,
            sr=self.sample_rate,
            units='frames',
            hop_length=512
        )
        tempo_int = int(round(float(np.atleast_1d(tempo)[0])))
        if tempo_int <= 0:
            tempo_int = 120

        beat_times = librosa.frames_to_time(beat_frames, sr=self.sample_rate, hop_length=512)
        beats: List[BeatEvent] = []

        # Standard 4/4 meter by default
        time_signature = [4, 4]

        for i, b_time in enumerate(beat_times):
            beat_in_bar = i % 4
            downbeat = (beat_in_bar == 0)
            beats.append(BeatEvent(
                time=float(round(b_time, 4)),
                downbeat=downbeat,
                beat_in_bar=beat_in_bar
            ))

        return tempo_int, beats, time_signature
