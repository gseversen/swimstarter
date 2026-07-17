import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { midpoint, hipAngle } from "../utils/mathHelpers";

let poseLandmarker = null;
let isInitializing = false;

const POSE_LANDMARKER_MODEL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task";

export async function initPoseLandmarker() {
  if (poseLandmarker || isInitializing) return poseLandmarker;
  isInitializing = true;

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm",
  );

  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: POSE_LANDMARKER_MODEL,
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  isInitializing = false;
  return poseLandmarker;
}

export function getPoseLandmarker() {
  return poseLandmarker;
}

export async function resetPoseLandmarker() {
  if (poseLandmarker) {
    poseLandmarker.close();
    poseLandmarker = null;
  }
  isInitializing = false;
  return initPoseLandmarker();
}

const LM = {
  NOSE: 0,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
};

const KEPT_INDICES = Object.values(LM);

/**
 * Run pose detection on a video frame and return structured metrics.
 * @param {HTMLVideoElement} video
 * @param {number} timestampMs - must be strictly increasing; use video time in ms
 * @returns {{landmarks: object, joints: object, metrics: object, timestamp: number} | null}
 */
export function analyzeFrame(video, timestampMs) {
  if (!poseLandmarker) return null;
  if (video.readyState < 2) return null;
  if (video.videoWidth === 0 || video.videoHeight === 0) return null;

  let result;
  try {
    result = poseLandmarker.detectForVideo(video, timestampMs);
  } catch (e) {
    return null;
  }

  if (!result.landmarks || result.landmarks.length === 0) return null;

  const lm = result.landmarks[0];

  const landmarks = {};
  for (const idx of KEPT_INDICES) {
    landmarks[idx] = { x: lm[idx].x, y: lm[idx].y };
  }

  const joints = {
    nose: landmarks[LM.NOSE],
    mouth_left: landmarks[LM.MOUTH_LEFT],
    mouth_right: landmarks[LM.MOUTH_RIGHT],
    left_shoulder: landmarks[LM.LEFT_SHOULDER],
    right_shoulder: landmarks[LM.RIGHT_SHOULDER],
    left_wrist: landmarks[LM.LEFT_WRIST],
    right_wrist: landmarks[LM.RIGHT_WRIST],
    left_pinky: landmarks[LM.LEFT_PINKY],
    right_pinky: landmarks[LM.RIGHT_PINKY],
    left_hip: landmarks[LM.LEFT_HIP],
    right_hip: landmarks[LM.RIGHT_HIP],
    left_knee: landmarks[LM.LEFT_KNEE],
    right_knee: landmarks[LM.RIGHT_KNEE],
    left_ankle: landmarks[LM.LEFT_ANKLE],
    right_ankle: landmarks[LM.RIGHT_ANKLE],
    left_foot_index: landmarks[LM.LEFT_FOOT_INDEX],
    right_foot_index: landmarks[LM.RIGHT_FOOT_INDEX],
  };

  const shoulderMid = midpoint(joints.left_shoulder, joints.right_shoulder);
  const hipMid = midpoint(joints.left_hip, joints.right_hip);
  const kneeMid = midpoint(joints.left_knee, joints.right_knee);
  const hipAngleDeg = Number(hipAngle(shoulderMid, hipMid, kneeMid).toFixed(1));

  return {
    landmarks,
    joints,
    metrics: {
      hip_angle_degrees: hipAngleDeg,
      shoulder_mid: shoulderMid,
      hip_mid: hipMid,
      knee_mid: kneeMid,
    },
    timestamp: timestampMs / 1000,
  };
}
