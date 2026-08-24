import type { FrameResult, Pt } from '../types.js';

export type LandmarkOption = { id: string; label: string };
export type LandmarkGroup = { label: string; options: LandmarkOption[] };

export const LANDMARK_GROUPS: LandmarkGroup[] = [
  { label: 'Head', options: [{ id: 'nose', label: 'Nose' }] },
  { label: 'Arms', options: [
    { id: 'left_shoulder', label: 'Left shoulder' },
    { id: 'right_shoulder', label: 'Right shoulder' },
    { id: 'left_wrist', label: 'Left wrist' },
    { id: 'right_wrist', label: 'Right wrist' },
  ]},
  { label: 'Torso', options: [
    { id: 'shoulder_mid', label: 'Shoulder mid' },
    { id: 'hip_mid', label: 'Hip mid' },
    { id: 'knee_mid', label: 'Knee mid' },
  ]},
  { label: 'Legs', options: [
    { id: 'left_hip', label: 'Left hip' },
    { id: 'right_hip', label: 'Right hip' },
    { id: 'left_knee', label: 'Left knee' },
    { id: 'right_knee', label: 'Right knee' },
    { id: 'left_ankle', label: 'Left ankle' },
    { id: 'right_ankle', label: 'Right ankle' },
  ]},
];

const METRIC_MIDS = new Set(['shoulder_mid', 'hip_mid', 'knee_mid']);

export function resolveLandmarkPoint(
  frame: FrameResult,
  landmarkId: string,
): Pt | null {
  if (!frame) return null;
  if (METRIC_MIDS.has(landmarkId)) {
    const pt = (frame.metrics as any)?.[landmarkId];
    return pt && Number.isFinite(pt.x) && Number.isFinite(pt.y) ? pt : null;
  }
  const pt = (frame.joints as any)?.[landmarkId];
  return pt && Number.isFinite(pt.x) && Number.isFinite(pt.y) ? pt : null;
}
