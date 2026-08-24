import type { AnalysisResult, FrameResult, Landmark, JointName } from './types.js';
import { hipAngle, midpoint } from './metrics/hipAngle.js';

const CURRENT_VERSION = 1;
const DECIMAL_PLACES = 4;

function round(n: number): number {
  return Number(n.toFixed(DECIMAL_PLACES));
}

// persist landmarks only; rebuild joints on load
export function serialize(result: AnalysisResult): string {
  const slim = {
    version: result.version,
    modelId: result.modelId,
    sampleRateHz: result.sampleRateHz,
    duration: result.duration,
    frames: result.frames.map(f => ({
      t: round(f.t),
      confidence: round(f.confidence),
      lm: Object.fromEntries(
        Object.entries(f.landmarks).map(([k, v]) => [
          k, [round(v.x), round(v.y), round(v.visibility)]
        ])
      ),
    })),
  };
  return JSON.stringify(slim);
}

const INDEX_TO_JOINT: Record<number, JointName> = {
  0: 'nose', 9: 'mouth_left', 10: 'mouth_right',
  11: 'left_shoulder', 12: 'right_shoulder',
  15: 'left_wrist', 16: 'right_wrist',
  17: 'left_pinky', 18: 'right_pinky',
  23: 'left_hip', 24: 'right_hip',
  25: 'left_knee', 26: 'right_knee',
  27: 'left_ankle', 28: 'right_ankle',
  31: 'left_foot_index', 32: 'right_foot_index',
};

export function deserialize(json: string): AnalysisResult {
  const raw = JSON.parse(json);
  const frames: FrameResult[] = raw.frames.map((f: any) => {
    const landmarks: Record<number, Landmark> = {};
    for (const [k, v] of Object.entries(f.lm) as [string, number[]][]) {
      landmarks[Number(k)] = { x: v[0], y: v[1], visibility: v[2] };
    }

    const joints = {} as Record<JointName, Landmark>;
    for (const [idx, name] of Object.entries(INDEX_TO_JOINT)) {
      if (landmarks[Number(idx)]) joints[name] = landmarks[Number(idx)];
    }

    const shoulderMid = midpoint(joints.left_shoulder, joints.right_shoulder);
    const hipMid = midpoint(joints.left_hip, joints.right_hip);
    const kneeMid = midpoint(joints.left_knee, joints.right_knee);
    const angle = Number(hipAngle(shoulderMid, hipMid, kneeMid).toFixed(1));

    return {
      t: f.t,
      landmarks,
      joints,
      metrics: { hipAngleDeg: angle, shoulderMid, hipMid, kneeMid },
      confidence: f.confidence,
    };
  });

  return {
    version: CURRENT_VERSION,
    modelId: raw.modelId,
    sampleRateHz: raw.sampleRateHz,
    duration: raw.duration,
    frames,
  };
}

export function isStale(result: AnalysisResult, currentModelId: string): boolean {
  return result.modelId !== currentModelId;
}
