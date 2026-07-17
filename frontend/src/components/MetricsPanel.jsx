import HipAngleDiagram from "./HipAngleDiagram";

const panelStyle = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  padding: "1rem",
  minWidth: "240px",
  fontSize: "0.9rem",
  color: "#0f172a",
};

const labelStyle = { color: "#64748b", fontSize: "0.78rem", marginBottom: "0.15rem" };
const valueStyle = { fontWeight: 600, fontFamily: "monospace", marginBottom: "0.75rem" };

function Metric({ label, value }) {
  return (
    <div>
      <div style={labelStyle}>{label}</div>
      <div style={valueStyle}>{value}</div>
    </div>
  );
}

export default function MetricsPanel({ analysis, loading, preprocessing, ready }) {
  if (loading) {
    return (
      <div style={panelStyle}>
        <p style={{ color: "#64748b" }}>Loading pose model...</p>
      </div>
    );
  }

  if (preprocessing) {
    return (
      <div style={panelStyle}>
        <p style={{ color: "#64748b" }}>
          Analyzing frame-by-frame — please wait. Takes about as long as the clip; replay will be
          smooth after. Use Re-analyze if tracking looks off.
        </p>
      </div>
    );
  }

  if (!ready && !analysis) {
    return (
      <div style={panelStyle}>
        <p style={{ color: "#64748b" }}>Load a dive video. Analysis runs once, then you can replay freely.</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div style={panelStyle}>
        <p style={{ color: "#64748b" }}>Ready — press play or scrub to see metrics.</p>
      </div>
    );
  }

  const { metrics, timestamp } = analysis;

  return (
    <div style={panelStyle}>
      <Metric label="Timestamp" value={`${timestamp.toFixed(2)}s`} />
      <Metric label="Hip Angle" value={`${metrics.hip_angle_degrees}°`} />
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
  );
}
