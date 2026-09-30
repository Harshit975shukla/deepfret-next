from pathlib import Path
from typing import List
from models.schemas import NoteEvent
from config import STANDARD_TUNING_MIDI

class MusicXMLExporter:
    """
    Exports transcription to standard MusicXML (.musicxml) for import into
    MuseScore, Sibelius, Finale, and Dorico.
    """

    @staticmethod
    def export(events: List[NoteEvent], output_path: Path, title: str = "DeepFret Tab", tempo: int = 120) -> Path:
        xml_lines = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">',
            '<score-partwise version="3.1">',
            f'  <work><work-title>{title}</work-title></work>',
            '  <part-list>',
            '    <score-part id="P1">',
            '      <part-name>Acoustic Guitar</part-name>',
            '    </score-part>',
            '  </part-list>',
            '  <part id="P1">',
            '    <measure number="1">',
            '      <attributes>',
            '        <divisions>4</divisions>',
            '        <key><fifths>0</fifths></key>',
            '        <time><beats>4</beats><beat-type>4</beat-type></time>',
            '        <clef><sign>TAB</sign><line>5</line></clef>',
            '        <staff-details><staff-lines>6</staff-lines></staff-details>',
            '      </attributes>',
            '      <direction placement="above">',
            '        <direction-type>',
            f'          <metronome><beat-unit>quarter</beat-unit><per-minute>{tempo}</per-minute></metronome>',
            '        </direction-type>',
            '        <sound tempo="{tempo}"/>',
            '      </direction>'
        ]

        step_names = ["C", "C", "D", "D", "E", "F", "F", "G", "G", "A", "A", "B"]
        alter_vals = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0]

        for e in events[:32]:
            pitch_midi = STANDARD_TUNING_MIDI[e.string] + e.fret
            pc = pitch_midi % 12
            octave = (pitch_midi // 12) - 1
            step = step_names[pc]
            alter = alter_vals[pc]
            str_num = 6 - e.string

            xml_lines.extend([
                '      <note>',
                '        <pitch>',
                f'          <step>{step}</step>',
                f'          <alter>{alter}</alter>' if alter != 0 else '',
                f'          <octave>{octave}</octave>',
                '        </pitch>',
                '        <duration>2</duration>',
                '        <type>eighth</type>',
                '        <notations>',
                '          <technical>',
                f'            <string>{str_num}</string>',
                f'            <fret>{e.fret}</fret>',
                '          </technical>',
                '        </notations>',
                '      </note>'
            ])

        xml_lines.extend([
            '    </measure>',
            '  </part>',
            '</score-partwise>'
        ])

        clean_xml = "\n".join([l for l in xml_lines if l.strip()])
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(clean_xml)

        return output_path
