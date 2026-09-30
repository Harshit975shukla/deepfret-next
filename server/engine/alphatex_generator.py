from typing import List, Dict
from models.schemas import NoteEvent, BeatEvent

class AlphaTexGenerator:
    """
    Compiles NoteEvents and BeatEvents into AlphaTex format
    compatible with AlphaTab and DeepFret notation engines.
    """

    @staticmethod
    def generate(
        title: str,
        tempo: int,
        events: List[NoteEvent],
        beats: List[BeatEvent],
        tuning_str: str = "E4 B3 G3 D3 A2 E2"
    ) -> str:
        lines = [
            f'\\title "{title}"',
            f'\\tempo {tempo}',
            '\\instrument 25',
            f'\\tuning ({tuning_str})'
        ]

        if not events:
            return "\n".join(lines) + "\nr.1 |"

        # Group notes by timestamp (quantized to ~0.05s)
        slices: Dict[float, List[NoteEvent]] = {}
        for ev in events:
            t_key = round(ev.time * 20) / 20
            if t_key not in slices:
                slices[t_key] = []
            slices[t_key].append(ev)

        bar_tokens = []
        current_bar = []
        notes_in_bar = 0

        # Sort time slices
        sorted_times = sorted(slices.keys())

        for t in sorted_times:
            evs = slices[t]
            # Convert 0-indexed string (0=Low E, 5=High E) to AlphaTex 1-indexed (6=Low E, 1=High E)
            # Duration approximation (default to 8th note)
            dur_token = "8"
            avg_dur = sum(e.duration for e in evs) / len(evs)
            if avg_dur >= 0.7:
                dur_token = "2"
            elif avg_dur >= 0.35:
                dur_token = "4"
            else:
                dur_token = "8"

            if len(evs) == 1:
                e = evs[0]
                str_num = 6 - e.string # 0 -> 6, 5 -> 1
                fret_str = "x" if e.effects.is_dead else str(e.fret)
                current_bar.append(f"{fret_str}.{str_num}.{dur_token}")
            else:
                # Chord: (fret.string fret.string).duration
                chord_parts = []
                for e in sorted(evs, key=lambda x: x.string):
                    str_num = 6 - e.string
                    fret_str = "x" if e.effects.is_dead else str(e.fret)
                    chord_parts.append(f"{fret_str}.{str_num}")
                current_bar.append(f"({' '.join(chord_parts)}).{dur_token}")

            notes_in_bar += 1
            # Every 8 eighth-notes or 4 quarter-notes, end measure
            if (dur_token == "8" and notes_in_bar >= 8) or (dur_token == "4" and notes_in_bar >= 4):
                bar_tokens.append(" ".join(current_bar) + " |")
                current_bar = []
                notes_in_bar = 0

        if current_bar:
            bar_tokens.append(" ".join(current_bar) + " |")

        lines.append("\n".join(bar_tokens))
        return "\n".join(lines)
