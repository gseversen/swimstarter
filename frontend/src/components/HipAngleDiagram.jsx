// Schematic (not-to-scale) angle-at-vertex figure for the hip angle.
// Hip Mid is the vertex; rays go to knees (left) and shoulders (right).
// Default: metric interior angle (wedge through the bottom).
// `down`: reflex 360 − angle (wedge through the top). The two add to 360°.

const W = 160;
const H = 140;
const CX = W / 2;
const RAY_LEN = 74;
const ARC_R = 30;
const DOT_R = 3.5;

const LINE_COLOR = "#171717";
const LABEL_COLOR = "#737373";
const ARC_COLOR = "#f97316";

const deg2rad = (d) => (d * Math.PI) / 180;
const fmt = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

function ray(dirDeg, len, vy) {
  const a = deg2rad(dirDeg);
  return { x: CX + len * Math.cos(a), y: vy + len * Math.sin(a) };
}

function arcPoints(startDeg, endDeg, r, vy, steps = 48) {
  const pts = [];
  for (let i = 0; i <= steps; i += 1) {
    const a = deg2rad(startDeg + ((endDeg - startDeg) * i) / steps);
    pts.push(`${(CX + r * Math.cos(a)).toFixed(2)},${(vy + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(" ");
}

export default function HipAngleDiagram({ shoulderMid, hipMid, kneeMid, angleDegrees, down = false }) {
  const hasMids = shoulderMid && hipMid && kneeMid;
  const angle = Number(angleDegrees);
  if (!hasMids || !Number.isFinite(angle)) {
    return <div style={{ color: LABEL_COLOR, fontSize: "0.8rem" }}>—</div>;
  }

  // Same rays on both figures: knees left, shoulders right, opening downward.
  const clamped = Math.max(1, Math.min(179, angle));
  const half = clamped / 2;
  const shoulderDir = 90 - half; // down-right
  const kneeDir = 90 + half; // down-left

  // Same canvas size; reflex vertex sits just low enough for the top-facing
  // wedge, so there is no empty band above the figure.
  const vy = down ? 48 : 26;
  const shoulderPt = ray(shoulderDir, RAY_LEN, vy);
  const kneePt = ray(kneeDir, RAY_LEN, vy);

  // Interior: knees → down → shoulders (metric angle).
  // Reflex: knees → up → shoulders (360 − metric). Never a full circle.
  const arcStart = kneeDir;
  const arcEnd = down ? shoulderDir + 360 : shoulderDir;

  const displayAngle = down ? 360 - angle : angle;
  const arcLabelY = down ? vy - ARC_R - 6 : vy + ARC_R + 14;
  const hipLabelDy = down ? 16 : -10;

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Hip angle ${fmt(displayAngle)}°${down ? " (reflex, opposite side)" : ""}`}
      style={{ display: "block", marginBottom: "0.75rem" }}
    >
      {/* rays */}
      <line x1={CX} y1={vy} x2={shoulderPt.x} y2={shoulderPt.y} stroke={LINE_COLOR} strokeWidth={2} />
      <line x1={CX} y1={vy} x2={kneePt.x} y2={kneePt.y} stroke={LINE_COLOR} strokeWidth={2} />

      {/* angle arc */}
      <polyline
        points={arcPoints(arcStart, arcEnd, ARC_R, vy)}
        fill="none"
        stroke={ARC_COLOR}
        strokeWidth={2}
      />
      <text x={CX} y={arcLabelY} textAnchor="middle" fontSize="11" fontWeight="600" fill={ARC_COLOR}>
        {fmt(displayAngle)}°
      </text>

      {/* vertices */}
      <circle cx={shoulderPt.x} cy={shoulderPt.y} r={DOT_R} fill={LINE_COLOR} />
      <circle cx={CX} cy={vy} r={DOT_R} fill={LINE_COLOR} />
      <circle cx={kneePt.x} cy={kneePt.y} r={DOT_R} fill={LINE_COLOR} />

      {/* labels */}
      <text x={shoulderPt.x + 6} y={shoulderPt.y + 14} textAnchor="start" fontSize="10" fill={LABEL_COLOR}>
        Shoulders
      </text>
      <text x={kneePt.x - 6} y={kneePt.y + 14} textAnchor="end" fontSize="10" fill={LABEL_COLOR}>
        Knees
      </text>
      <text x={CX} y={vy + hipLabelDy} textAnchor="middle" fontSize="10" fill={LABEL_COLOR}>
        Hips
      </text>
    </svg>
  );
}
