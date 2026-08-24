import type { FrameResult, Landmark, JointName } from './types.js';
import { hipAngle, midpoint } from './metrics/hipAngle.js';
import { getPoseLandmarker } from './poseModel.js';

// MediaPipe landmark indices for the 17 joints we track
const LM = {
  NOSE: 0, MOUTH_LEFT: 9, MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12,
  LEFT_WRIST: 15, RIGHT_WRIST: 16,
  LEFT_PINKY: 17, RIGHT_PINKY: 18,
  LEFT_HIP: 23, RIGHT_HIP: 24,
  LEFT_KNEE: 25, RIGHT_KNEE: 26,
  LEFT_ANKLE: 27, RIGHT_ANKLE: 28,
  LEFT_FOOT_INDEX: 31, RIGHT_FOOT_INDEX: 32,
} as const;

const KEPT_INDICES = Object.values(LM);

const INDEX_TO_JOINT: Record<number, JointName> = {
  [LM.NOSE]: 'nose',
  [LM.MOUTH_LEFT]: 'mouth_left',
  [LM.MOUTH_RIGHT]: 'mouth_right',
  [LM.LEFT_SHOULDER]: 'left_shoulder',
  [LM.RIGHT_SHOULDER]: 'right_shoulder',
  [LM.LEFT_WRIST]: 'left_wrist',
  [LM.RIGHT_WRIST]: 'right_wrist',
  [LM.LEFT_PINKY]: 'left_pinky',
  [LM.RIGHT_PINKY]: 'right_pinky',
  [LM.LEFT_HIP]: 'left_hip',
  [LM.RIGHT_HIP]: 'right_hip',
  [LM.LEFT_KNEE]: 'left_knee',
  [LM.RIGHT_KNEE]: 'right_knee',
  [LM.LEFT_ANKLE]: 'left_ankle',
  [LM.RIGHT_ANKLE]: 'right_ankle',
  [LM.LEFT_FOOT_INDEX]: 'left_foot_index',
  [LM.RIGHT_FOOT_INDEX]: 'right_foot_index',
};

// The 6 landmarks the hip angle depends on
const HIP_ANGLE_INDICES = [
  LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER,
  LM.LEFT_HIP, LM.RIGHT_HIP,
  LM.LEFT_KNEE, LM.RIGHT_KNEE,
];

export function analyzeFrame(
  video: HTMLVideoElement,
  timestampMs: number,
): FrameResult | null {
  const landmarker = getPoseLandmarker();
  if (!landmarker) return null;
  if (video.readyState < 2) return null;
  if (video.videoWidth === 0 || video.videoHeight === 0) return null;

  let result: any;
  try {
    result = landmarker.detectForVideo(video, timestampMs);
  } catch {
    return null;
  }

  if (!result?.landmarks?.length) return null;
  const lm = result.landmarks[0];

  // E3: retain visibility
  const landmarks: Record<number, Landmark> = {};
  for (const idx of KEPT_INDICES) {
    const p = lm[idx];
    landmarks[idx] = { x: p.x, y: p.y, visibility: p.visibility ?? 0 };
  }

  const joints = {} as Record<JointName, Landmark>;
  for (const idx of KEPT_INDICES) {
    joints[INDEX_TO_JOINT[idx]] = landmarks[idx];
  }

  const shoulderMid = midpoint(joints.left_shoulder, joints.right_shoulder);
  const hipMid = midpoint(joints.left_hip, joints.right_hip);
  const kneeMid = midpoint(joints.left_knee, joints.right_knee);
  const angle = Number(hipAngle(shoulderMid, hipMid, kneeMid).toFixed(1));

  // E3: confidence = min visibility across the 6 hip-angle landmarks
  const confidence = Math.min(
    ...HIP_ANGLE_INDICES.map(i => landmarks[i].visibility)
  );

  return {
    t: timestampMs / 1000,
    landmarks,
    joints,
    metrics: { hipAngleDeg: angle, shoulderMid, hipMid, kneeMid },
    confidence,
  };
}
