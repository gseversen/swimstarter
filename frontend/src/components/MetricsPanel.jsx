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

function coordStr(p) {
  if (!p) return "—";
  return `(${p.x.toFixed(3)}, ${p.y.toFixed(3)})`;
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
        <p style={{ color: "#64748b" }}>Analyzing video — please wait. Replay will be smooth after this.</p>
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

  const { metrics, timestamp, joints } = analysis;

  return (
    <div style={panelStyle}>
      <Metric label="Timestamp" value={`${timestamp.toFixed(2)}s`} />
      <Metric label="Torso Angle" value={`${metrics.torso_angle_degrees}°`} />
      <Metric label="Shoulder Mid" value={coordStr(metrics.shoulder_mid)} />
      <Metric label="Hip Mid" value={coordStr(metrics.hip_mid)} />
      <Metric label="L Shoulder" value={coordStr(joints.left_shoulder)} />
      <Metric label="R Shoulder" value={coordStr(joints.right_shoulder)} />
      <Metric label="L Hip" value={coordStr(joints.left_hip)} />
      <Metric label="R Hip" value={coordStr(joints.right_hip)} />
      <Metric label="L Knee" value={coordStr(joints.left_knee)} />
      <Metric label="R Knee" value={coordStr(joints.right_knee)} />
      <Metric label="L Ankle" value={coordStr(joints.left_ankle)} />
      <Metric label="R Ankle" value={coordStr(joints.right_ankle)} />
    </div>
  );
}
