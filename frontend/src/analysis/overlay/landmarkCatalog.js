export const LANDMARK_GROUPS = [
  {
    label: "Head",
    options: [
      { id: "nose", label: "Nose" },
    ],
  },
  {
    label: "Arms",
    options: [
      { id: "left_shoulder", label: "Left shoulder" },
      { id: "right_shoulder", label: "Right shoulder" },
      { id: "left_wrist", label: "Left wrist" },
      { id: "right_wrist", label: "Right wrist" },
    ],
  },
  {
    label: "Torso",
    options: [
      { id: "shoulder_mid", label: "Shoulder midpoint" },
      { id: "hip_mid", label: "Hip midpoint" },
      { id: "knee_mid", label: "Knee midpoint" },
    ],
  },
  {
    label: "Legs",
    options: [
      { id: "left_hip", label: "Left hip" },
      { id: "right_hip", label: "Right hip" },
      { id: "left_knee", label: "Left knee" },
      { id: "right_knee", label: "Right knee" },
      { id: "left_ankle", label: "Left ankle" },
      { id: "right_ankle", label: "Right ankle" },
    ],
  },
];

const METRIC_MIDS = new Set(["shoulder_mid", "hip_mid", "knee_mid"]);

/**
 * Resolve a landmark id to an {x, y} point (normalized) from a single cache entry.
 * Returns null if the point isn't available for this frame.
 */
export function resolveLandmarkPoint(entry, landmarkId) {
  if (!entry) return null;

  if (METRIC_MIDS.has(landmarkId)) {
    const pt = entry.metrics?.[landmarkId];
    if (pt && Number.isFinite(pt.x) && Number.isFinite(pt.y)) return pt;
    return null;
  }

  const pt = entry.joints?.[landmarkId];
  if (pt && Number.isFinite(pt.x) && Number.isFinite(pt.y)) return pt;
  return null;
}
