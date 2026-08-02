import HipAngleDiagram from "./HipAngleDiagram";
import { colors, radii, shadows, spacing, typography } from "../theme";

const panelStyle = {
  backgroundColor: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: radii.lg,
  boxShadow: shadows.card,
  padding: spacing.lg,
};

const sectionLabel = {
  ...typography.sectionLabel,
  color: colors.textMuted,
  margin: `0 0 ${spacing.sm}`,
};

const metricCard = {
  padding: spacing.md,
  backgroundColor: colors.bg,
  border: `1px solid ${colors.border}`,
  borderRadius: radii.md,
  marginBottom: spacing.sm,
};

const labelStyle = {
  ...typography.sectionLabel,
  color: colors.textMuted,
  marginBottom: "0.2rem",
};

const valueStyle = {
  ...typography.metricValue,
  color: colors.text,
};

const placeholderStyle = {
  ...typography.small,
  color: colors.textMuted,
  margin: 0,
};

function Metric({ label, value }) {
  return (
    <div style={metricCard}>
      <div style={labelStyle}>{label}</div>
      <div style={valueStyle}>{value}</div>
    </div>
  );
}

export default function MetricsPanel({ analysis, loading, preprocessing, ready }) {
  if (loading) {
    return (
      <div style={panelStyle}>
        <div style={sectionLabel}>Metrics</div>
        <p style={placeholderStyle}>Loading pose model…</p>
      </div>
    );
  }

  if (preprocessing) {
    return (
      <div style={panelStyle}>
        <div style={sectionLabel}>Metrics</div>
        <p style={placeholderStyle}>
          Analyzing frame-by-frame — please wait. Replay will be smooth after.
        </p>
      </div>
    );
  }

  if (!ready && !analysis) {
    return (
      <div style={panelStyle}>
        <div style={sectionLabel}>Metrics</div>
        <p style={placeholderStyle}>Load a dive video to begin analysis.</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div style={panelStyle}>
        <div style={sectionLabel}>Metrics</div>
        <p style={placeholderStyle}>Ready — press play or scrub to see metrics.</p>
      </div>
    );
  }

  const { metrics, timestamp } = analysis;

  return (
    <div style={panelStyle}>
      <div style={sectionLabel}>Metrics</div>
      <Metric label="TIMESTAMP" value={`${timestamp.toFixed(2)}s`} />
      <Metric label="HIP ANGLE" value={`${metrics.hip_angle_degrees}°`} />
      <div style={{ marginTop: spacing.md }}>
        <HipAngleDiagram
          shoulderMid={metrics.shoulder_mid}
          hipMid={metrics.hip_mid}
          kneeMid={metrics.knee_mid}
          angleDegrees={metrics.hip_angle_degrees}
        />
        <HipAngleDiagram
          shoulderMid={metrics.shoulder_mid}
          hipMid={metrics.hip_mid}
          kneeMid={metrics.knee_mid}
          angleDegrees={metrics.hip_angle_degrees}
          down
        />
      </div>
    </div>
  );
}
