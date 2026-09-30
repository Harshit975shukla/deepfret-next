import mido
from pathlib import Path
from typing import List
from models.schemas import NoteEvent
from config import STANDARD_TUNING_MIDI

class MidiExporter:
    """
    Exports transcription to Multi-track / MPE Guitar MIDI.
    Uses 1 MIDI channel per guitar string (Channels 1 to 6)
    to enable independent per-string pitch bends and vibrato in DAWs.
    """

    @staticmethod
    def export(events: List[NoteEvent], output_path: Path, tempo: int = 120, tuning: List[int] = STANDARD_TUNING_MIDI) -> Path:
        mid = mido.MidiFile(type=1) # Synchronous multitrack
        ticks_per_beat = 480
        mid.ticks_per_beat = ticks_per_beat

        # Track 0: Tempo and Time Signature
        meta_track = mido.MidiTrack()
        mid.tracks.append(meta_track)
        meta_track.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(tempo), time=0))
        meta_track.append(mido.MetaMessage('time_signature', numerator=4, denominator=4, time=0))
        meta_track.append(mido.MetaMessage('end_of_track', time=0))

        # Tracks 1 to 6: Guitar Strings (Low E to High E)
        string_tracks = [mido.MidiTrack() for _ in range(6)]
        for s_idx, tr in enumerate(string_tracks):
            mid.tracks.append(tr)
            tr.append(mido.MetaMessage('track_name', name=f"Guitar String {s_idx + 1}", time=0))
            # Program change: 25 = Acoustic Guitar (Steel)
            tr.append(mido.Message('program_change', program=25, channel=s_idx, time=0))

        # Flatten note on/off messages per string track
        # Convert seconds to ticks: ticks = seconds * (tempo / 60) * ticks_per_beat
        ticks_per_sec = (tempo / 60.0) * ticks_per_beat

        for s_idx in range(6):
            string_events = [e for e in events if e.string == s_idx]
            string_events.sort(key=lambda e: e.time)
            
            raw_msgs = []
            for e in string_events:
                pitch_midi = tuning[s_idx] + e.fret
                start_tick = int(round(e.time * ticks_per_sec))
                dur_tick = int(round(max(0.05, e.duration) * ticks_per_sec))
                end_tick = start_tick + dur_tick
                raw_msgs.append((start_tick, 'note_on', pitch_midi, e.velocity))
                raw_msgs.append((end_tick, 'note_off', pitch_midi, 0))

            raw_msgs.sort(key=lambda x: x[0])
            
            last_tick = 0
            for tick, m_type, note, vel in raw_msgs:
                delta = max(0, tick - last_tick)
                string_tracks[s_idx].append(mido.Message(m_type, note=note, velocity=vel, channel=s_idx, time=delta))
                last_tick = tick
            
            string_tracks[s_idx].append(mido.MetaMessage('end_of_track', time=0))

        mid.save(str(output_path))
        return output_path
