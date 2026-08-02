import { useMemo } from "react";
import { colors, radii, shadows, spacing, typography } from "../theme";

const ACCENT = "#f97316";
const LABEL_COLOR = colors.textMuted;
const LINE_COLOR = colors.text;
const GRID_COLOR = colors.border;

const CHART_W = 600;
const CHART_H = 180;
const PAD = { top: 24, right: 16, bottom: 32, left: 42 };
const PLOT_W = CHART_W - PAD.left - PAD.right;
const PLOT_H = CHART_H - PAD.top - PAD.bottom;

function buildSeries(cache) {
  const pts = [];
  for (const entry of cache) {
    const t = entry.timestamp;
    const a = entry.metrics?.hip_angle_degrees;
    if (Number.isFinite(t) && Number.isFinite(a)) {
      pts.push({ t, angle: a });
    }
  }
  return pts;
}

function niceStep(range, targetTicks) {
  const rough = range / targetTicks;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const residual = rough / mag;
  if (residual <= 1.5) return mag;
  if (residual <= 3.5) return 2 * mag;
  if (residual <= 7.5) return 5 * mag;
  return 10 * mag;
}

function ticks(min, max, target = 5) {
  if (max - min < 1e-9) return [min];
  const step = niceStep(max - min, target);
  const result = [];
  let v = Math.ceil(min / step) * step;
  while (v <= max + step * 0.001) {
    result.push(v);
    v += step;
  }
  return result;
}

const containerStyle = {
  backgroundColor: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: radii.lg,
  boxShadow: shadows.card,
  padding: spacing.lg,
};

const titleStyle = {
  ...typography.sectionLabel,
  color: colors.textMuted,
  marginBottom: spacing.sm,
};

export default function HipAngleChart({ analysisCache, currentTime }) {
  const series = useMemo(() => buildSeries(analysisCache), [analysisCache]);

  if (series.length < 2) return null;

  const tMin = series[0].t;
  const tMax = series[series.length - 1].t;
  const tRange = tMax - tMin || 1;

  const angles = series.map((p) => p.angle);
  const aMin = Math.floor(Math.min(...angles) / 10) * 10;
  const aMax = Math.ceil(Math.max(...angles) / 10) * 10;
  const aRange = aMax - aMin || 1;

  const sx = (t) => PAD.left + ((t - tMin) / tRange) * PLOT_W;
  const sy = (a) => PAD.top + ((aMax - a) / aRange) * PLOT_H;

  const polyline = series.map((p) => `${sx(p.t).toFixed(1)},${sy(p.angle).toFixed(1)}`).join(" ");

  const xTicks = ticks(tMin, tMax, 6);
  const yTicks = ticks(aMin, aMax, 4);

  const playheadX = currentTime != null ? sx(Math.max(tMin, Math.min(tMax, currentTime))) : null;

  let currentAngle = null;
  if (currentTime != null) {
    let best = series[0];
    let bestDist = Math.abs(currentTime - best.t);
    for (let i = 1; i < series.length; i += 1) {
      const d = Math.abs(currentTime - series[i].t);
      if (d < bestDist) { best = series[i]; bestDist = d; }
      if (series[i].t > currentTime) break;
    }
    currentAngle = best.angle;
  }

  return (
    <div style={containerStyle}>
      <div style={titleStyle}>Hip Angle Over Time</div>
      <svg
        width="100%"
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        role="img"
        aria-label="Hip angle over time"
        style={{ display: "block" }}
      >
        {yTicks.map((v) => (
          <g key={`y${v}`}>
            <line x1={PAD.left} y1={sy(v)} x2={PAD.left + PLOT_W} y2={sy(v)} stroke={GRID_COLOR} strokeWidth={1} />
            <text x={PAD.left - 6} y={sy(v) + 3.5} textAnchor="end" fontSize="9" fill={LABEL_COLOR}>
              {v}°
            </text>
          </g>
        ))}

        {xTicks.map((v) => (
          <g key={`x${v}`}>
            <line x1={sx(v)} y1={PAD.top} x2={sx(v)} y2={PAD.top + PLOT_H} stroke={GRID_COLOR} strokeWidth={1} />
            <text x={sx(v)} y={CHART_H - 8} textAnchor="middle" fontSize="9" fill={LABEL_COLOR}>
              {v.toFixed(1)}s
            </text>
          </g>
        ))}

        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + PLOT_H} stroke={LINE_COLOR} strokeWidth={1.5} />
        <line x1={PAD.left} y1={PAD.top + PLOT_H} x2={PAD.left + PLOT_W} y2={PAD.top + PLOT_H} stroke={LINE_COLOR} strokeWidth={1.5} />

        <polyline points={polyline} fill="none" stroke={ACCENT} strokeWidth={2} strokeLinejoin="round" />

        {playheadX != null ? (
          <>
            <line x1={playheadX} y1={PAD.top} x2={playheadX} y2={PAD.top + PLOT_H} stroke={ACCENT} strokeWidth={1.5} strokeDasharray="4 3" />
            {currentAngle != null ? (
              <circle cx={playheadX} cy={sy(currentAngle)} r={4} fill={ACCENT} />
            ) : null}
          </>
        ) : null}

        {playheadX != null && currentAngle != null ? (
          <text
            x={playheadX + (playheadX > PAD.left + PLOT_W * 0.75 ? -8 : 8)}
            y={PAD.top + 12}
            textAnchor={playheadX > PAD.left + PLOT_W * 0.75 ? "end" : "start"}
            fontSize="11"
            fontWeight="600"
            fill={LABEL_COLOR}
          >
            {Number.isInteger(currentAngle) ? currentAngle : currentAngle.toFixed(1)}°
          </text>
        ) : null}
      </svg>
    </div>
  );
}
