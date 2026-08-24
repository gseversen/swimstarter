import { useMemo } from 'react';
import type { FrameResult } from '@swimstarter/engine';

const VISIBILITY_THRESHOLD = 0.5;

type Props = {
  frames: FrameResult[];
  currentTime: number;
};

export default function HipAngleChart({ frames, currentTime }: Props) {
  const series = useMemo(() =>
    frames
      .filter(f => Number.isFinite(f.metrics.hipAngleDeg) && Number.isFinite(f.t))
      .map(f => ({ t: f.t, angle: f.metrics.hipAngleDeg, conf: f.confidence })),
    [frames]
  );

  if (series.length < 2) return null;

  const tMin = series[0].t;
  const tMax = series[series.length - 1].t;
  const tRange = tMax - tMin || 1;

  const angles = series.map(s => s.angle);
  const aMin = Math.floor(Math.min(...angles) / 10) * 10;
  const aMax = Math.ceil(Math.max(...angles) / 10) * 10;
  const aRange = aMax - aMin || 1;

  const W = 1000;
  const H = 84;

  const sx = (t: number) => ((t - tMin) / tRange) * W;
  const sy = (a: number) => H - ((a - aMin) / aRange) * H;

  // E3: break line across low-confidence gaps
  const segments: string[] = [];
  let current: string[] = [];
  for (const pt of series) {
    if (pt.conf >= VISIBILITY_THRESHOLD) {
      current.push(`${sx(pt.t).toFixed(1)},${sy(pt.angle).toFixed(1)}`);
    } else {
      if (current.length >= 2) segments.push(current.join(' '));
      current = [];
    }
  }
  if (current.length >= 2) segments.push(current.join(' '));

  // find gap region for shading
  let gapStart: number | null = null;
  let gapEnd: number | null = null;
  for (let i = 0; i < series.length; i++) {
    if (series[i].conf < VISIBILITY_THRESHOLD) {
      if (gapStart === null) gapStart = series[i].t;
      gapEnd = series[i].t;
    }
  }

  const playheadX = sx(Math.max(tMin, Math.min(tMax, currentTime)));

  return (
    <div style={{
      borderTop: '1px solid var(--border)', paddingTop: 12,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', marginBottom: 6,
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 9.5,
          letterSpacing: '.1em', color: 'rgba(255,255,255,.4)',
        }}>HIP ANGLE OVER TIME</span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'rgba(255,255,255,.3)',
        }}>180° — 0°</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{
        width: '100%', height: 84, display: 'block',
      }}>
        {/* midline */}
        <line x1="0" y1={H / 2} x2={W} y2={H / 2}
          stroke="rgba(255,255,255,0.07)" strokeWidth="1" />

        {/* gap shading */}
        {gapStart !== null && gapEnd !== null && (
          <rect
            x={sx(gapStart)} y="0"
            width={sx(gapEnd) - sx(gapStart)} height={H}
            fill="rgba(255,255,255,0.035)"
          />
        )}

        {/* angle line segments */}
        {segments.map((pts, i) => (
          <polyline key={i} points={pts}
            fill="none" stroke="var(--accent)" strokeWidth="2.5" />
        ))}

        {/* playhead */}
        <line
          x1={playheadX} y1="0" x2={playheadX} y2={H}
          stroke="#fff" strokeWidth="1.5" strokeDasharray="4 4"
        />
      </svg>
      {gapStart !== null && gapEnd !== null && (
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 9.5,
          color: 'rgba(255,255,255,.32)', marginTop: 4,
        }}>
          gap {gapStart.toFixed(1)}–{gapEnd.toFixed(1)}s · confidence below 0.50, line not interpolated
        </div>
      )}
    </div>
  );
}
