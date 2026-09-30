from typing import List, Dict, Set
from models.schemas import NoteEvent, ChordEvent
from config import STANDARD_TUNING_MIDI

NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

# Common chord templates (semitone intervals relative to root)
CHORD_PROFILES = {
    "maj": {0, 4, 7},
    "m": {0, 3, 7},
    "7": {0, 4, 7, 10},
    "m7": {0, 3, 7, 10},
    "maj7": {0, 4, 7, 11},
    "sus4": {0, 5, 7},
    "sus2": {0, 2, 7},
    "dim": {0, 3, 6},
    "5": {0, 7},
}

class ChordDetector:
    """
    Identifies musical chord labels (e.g., Em, G, Cadd9, D) from polyphonic note events.
    """

    def __init__(self, tuning_midi: List[int] = STANDARD_TUNING_MIDI):
        self.tuning_midi = tuning_midi

    def detect_chords(self, events: List[NoteEvent]) -> List[ChordEvent]:
        # Group notes by timestamp (within 0.05s)
        time_slices: Dict[float, List[NoteEvent]] = {}
        for ev in events:
            # Round time to nearest 50ms
            t_key = round(ev.time * 20) / 20
            if t_key not in time_slices:
                time_slices[t_key] = []
            time_slices[t_key].append(ev)

        chord_events: List[ChordEvent] = []

        for t, slice_evs in sorted(time_slices.items()):
            if len(slice_evs) < 2:
                continue # Needs at least 2 notes for a dyad / chord

            # Compute pitch classes (0-11)
            pitch_classes = set()
            for ev in slice_evs:
                pitch_midi = self.tuning_midi[ev.string] + ev.fret
                pitch_classes.add(pitch_midi % 12)

            best_match = None
            best_score = -1

            # Match against known chords for all 12 possible roots
            for root_pc in range(12):
                root_name = NOTE_NAMES[root_pc]
                for chord_type, intervals in CHORD_PROFILES.items():
                    target_pcs = {(root_pc + interval) % 12 for interval in intervals}
                    # Jaccard similarity score
                    intersection = len(pitch_classes.intersection(target_pcs))
                    union = len(pitch_classes.union(target_pcs))
                    score = intersection / max(1, union)

                    if score > best_score and score >= 0.5:
                        best_score = score
                        suffix = "" if chord_type == "maj" else chord_type
                        best_match = f"{root_name}{suffix}"

            if best_match:
                chord_events.append(ChordEvent(
                    time=float(round(t, 4)),
                    label=best_match,
                    size=len(slice_evs)
                ))

        return chord_events
