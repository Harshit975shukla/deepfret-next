import React, { useRef } from 'react';
import { NoteEvent, BeatEvent, ChordEvent } from '../types/transcription';

interface TabStaffProps {
  events: NoteEvent[];
  beats?: BeatEvent[];
  chords?: ChordEvent[];
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
  loopRange: [number, number] | null;
}

export const TabStaff: React.FC<TabStaffProps> = ({
  events,
  beats = [],
  chords = [],
  currentTime,
  duration,
  onSeek,
  loopRange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Layout parameters
  const pxPerSecond = 90; // Horizontal scale
  const totalWidth = Math.max(900, duration * pxPerSecond + 150);
  const staffHeight = 160;
  const lineSpacing = 16;
  const topOffset = 45;
  const stringLabels = ['e', 'B', 'G', 'D', 'A', 'E']; // High to Low for standard tab

  // Handle click on staff to seek
  const handleStaffClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const time = Math.max(0, Math.min(duration, (clickX - 50) / pxPerSecond));
    onSeek(time);
  };

  const playheadX = 50 + currentTime * pxPerSecond;

  return (
    <div className="w-full bg-paper border border-paper-border rounded-2xl p-4 shadow-sm overflow-hidden space-y-2">
      <div className="flex items-center justify-between text-xs text-studio-600 font-mono px-2">
        <span className="font-bold text-studio-900">TABLATURE STAFF</span>
        <span>Click anywhere to seek</span>
      </div>

      <div
        ref={containerRef}
        className="w-full overflow-x-auto pb-3 select-none"
        style={{ scrollBehavior: 'smooth' }}
      >
        <svg
          width={totalWidth}
          height={staffHeight}
          onClick={handleStaffClick}
          className="cursor-pointer bg-paper-light/50 rounded-xl"
        >
          {/* Background Loop Highlight */}
          {loopRange && (
            <rect
              x={50 + loopRange[0] * pxPerSecond}
              y={topOffset - 25}
              width={(loopRange[1] - loopRange[0]) * pxPerSecond}
              height={staffHeight - topOffset + 15}
              fill="#E07A28"
              fillOpacity="0.12"
              stroke="#E07A28"
              strokeDasharray="4 2"
              strokeWidth="1.5"
            />
          )}

          {/* 6 String Horizontal Lines */}
          {stringLabels.map((label, sIdx) => {
            const y = topOffset + sIdx * lineSpacing;
            return (
              <g key={`line-${sIdx}`}>
                <text
                  x={25}
                  y={y + 4}
                  fill="#78716C"
                  fontSize="12"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {label}
                </text>
                <line
                  x1={45}
                  y1={y}
                  x2={totalWidth - 30}
                  y2={y}
                  stroke="#D6C6A8"
                  strokeWidth="1.5"
                />
              </g>
            );
          })}

          {/* Downbeat / Bar Measure Dividers */}
          {beats
            .filter((b) => b.downbeat)
            .map((b, i) => {
              const x = 50 + b.time * pxPerSecond;
              return (
                <g key={`bar-${i}`}>
                  <line
                    x1={x}
                    y1={topOffset}
                    x2={x}
                    y2={topOffset + 5 * lineSpacing}
                    stroke="#A89470"
                    strokeWidth="1.5"
                  />
                  <text
                    x={x + 4}
                    y={topOffset - 12}
                    fill="#78716C"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {i + 1}
                  </text>
                </g>
              );
            })}

          {/* Chord Labels Above Staff */}
          {chords.map((ch, i) => {
            const x = 50 + ch.time * pxPerSecond;
            return (
              <g key={`chord-${i}`}>
                <rect
                  x={x - 14}
                  y={topOffset - 28}
                  width={28}
                  height={16}
                  rx={4}
                  fill="#F1E9D6"
                  stroke="#D4C3A3"
                />
                <text
                  x={x}
                  y={topOffset - 16}
                  textAnchor="middle"
                  fill="#9A3412"
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {ch.label}
                </text>
              </g>
            );
          })}

          {/* Note Events (Fret numbers) */}
          {events.map((ev, i) => {
            const x = 50 + ev.time * pxPerSecond;
            // ev.string: 0=Low E, 5=High E. Staff lines: index 0=High E, 5=Low E
            const stringStaffIdx = 5 - ev.string;
            const y = topOffset + stringStaffIdx * lineSpacing;
            const isPlaying = Math.abs(currentTime - ev.time) < 0.08;

            return (
              <g key={`note-${i}`}>
                {/* Note fret background badge */}
                <rect
                  x={x - 6}
                  y={y - 8}
                  width={14}
                  height={15}
                  rx={3}
                  fill={isPlaying ? '#EA580C' : '#FAF6EE'}
                  stroke={isPlaying ? '#C2410C' : '#D4C3A3'}
                  strokeWidth="1"
                />
                {/* Fret text or X for dead note */}
                <text
                  x={x + 1}
                  y={y + 3.5}
                  textAnchor="middle"
                  fill={isPlaying ? '#FFFFFF' : '#1C1917'}
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {ev.effects.is_dead ? 'X' : ev.fret}
                </text>
              </g>
            );
          })}

          {/* Animated Synced Playhead */}
          <g>
            <line
              x1={playheadX}
              y1={topOffset - 25}
              x2={playheadX}
              y2={topOffset + 5 * lineSpacing + 10}
              stroke="#EA580C"
              strokeWidth="2.5"
            />
            {/* Playhead marker cap */}
            <polygon
              points={`${playheadX - 6},${topOffset - 25} ${playheadX + 6},${topOffset - 25} ${playheadX},${topOffset - 15}`}
              fill="#EA580C"
            />
          </g>
        </svg>
      </div>
    </div>
  );
};
