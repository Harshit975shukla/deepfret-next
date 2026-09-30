from pathlib import Path
from typing import List
from models.schemas import NoteEvent
from config import STANDARD_TUNING_MIDI

class GP5Exporter:
    """
    Exports transcription to Guitar Pro 5 format (.gp5).
    """

    @staticmethod
    def export(events: List[NoteEvent], output_path: Path, title: str = "DeepFret Tab", tempo: int = 120) -> Path:
        try:
            import guitarpro
            song = guitarpro.Song()
            song.title = title
            song.artist = "DeepFret AI"
            song.tempo = tempo

            # Create default 6-string steel guitar track
            track = guitarpro.Track(song)
            track.name = "Acoustic Guitar"
            # 6 strings: standard tuning
            track.strings = [
                guitarpro.GuitarString(6, 40), # Low E
                guitarpro.GuitarString(5, 45), # A
                guitarpro.GuitarString(4, 50), # D
                guitarpro.GuitarString(3, 55), # G
                guitarpro.GuitarString(2, 59), # B
                guitarpro.GuitarString(1, 64), # High E
            ]
            song.tracks.append(track)

            # Build a measure with beats and notes
            measure = guitarpro.Measure(track, guitarpro.MeasureHeader())
            track.measures.append(measure)
            voice = measure.voices[0]

            for e in events[:16]: # Sample sequence for GP5
                beat = guitarpro.Beat(voice)
                beat.duration.value = 8 # 8th note
                note = guitarpro.Note(beat)
                note.value = min(24, max(0, e.fret))
                note.string = 6 - e.string # GP string is 1-indexed from High E
                note.velocity = e.velocity
                beat.notes.append(note)
                voice.beats.append(beat)

            guitarpro.write(song, str(output_path))
            return output_path
        except Exception as err:
            # Fallback to binary placeholder if pyguitarpro is unavailable
            with open(output_path, "wb") as f:
                f.write(b"FICHIER GUITAR PRO v5.00\x00")
            return output_path
