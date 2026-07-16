import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { midpoint, torsoAngle } from "../utils/mathHelpers";

let poseLandmarker = null;
let isInitializing = false;

// Full model has significantly better tracking for fast athletic movement
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
      // CPU is more broadly compatible; GPU can silently fail on some systems
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

// MediaPipe landmark indices for key body joints
const LM = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
};

/**
 * Run pose detection on a video frame and return structured metrics.
 * @param {HTMLVideoElement} video
 * @param {number} timestampMs - must be strictly increasing, use performance.now()
 * @returns {{landmarks: Array, joints: object, metrics: object, timestamp: number} | null}
 */
export function analyzeFrame(video, timestampMs) {
  if (!poseLandmarker) return null;
  if (video.readyState < 2) return null;
  if (video.videoWidth === 0 || video.videoHeight === 0) return null;

  let result;
  try {
    result = poseLandmarker.detectForVideo(video, timestampMs);
  } catch (e) {
    // Timestamp must be strictly increasing; skip frame if not
    return null;
  }

  if (!result.landmarks || result.landmarks.length === 0) return null;

  const lm = result.landmarks[0];

  const joints = {
    left_shoulder: { x: lm[LM.LEFT_SHOULDER].x, y: lm[LM.LEFT_SHOULDER].y },
    right_shoulder: { x: lm[LM.RIGHT_SHOULDER].x, y: lm[LM.RIGHT_SHOULDER].y },
    left_hip: { x: lm[LM.LEFT_HIP].x, y: lm[LM.LEFT_HIP].y },
    right_hip: { x: lm[LM.RIGHT_HIP].x, y: lm[LM.RIGHT_HIP].y },
    left_elbow: { x: lm[LM.LEFT_ELBOW].x, y: lm[LM.LEFT_ELBOW].y },
    right_elbow: { x: lm[LM.RIGHT_ELBOW].x, y: lm[LM.RIGHT_ELBOW].y },
    left_wrist: { x: lm[LM.LEFT_WRIST].x, y: lm[LM.LEFT_WRIST].y },
    right_wrist: { x: lm[LM.RIGHT_WRIST].x, y: lm[LM.RIGHT_WRIST].y },
    left_knee: { x: lm[LM.LEFT_KNEE].x, y: lm[LM.LEFT_KNEE].y },
    right_knee: { x: lm[LM.RIGHT_KNEE].x, y: lm[LM.RIGHT_KNEE].y },
    left_ankle: { x: lm[LM.LEFT_ANKLE].x, y: lm[LM.LEFT_ANKLE].y },
    right_ankle: { x: lm[LM.RIGHT_ANKLE].x, y: lm[LM.RIGHT_ANKLE].y },
  };

  const shoulderMid = midpoint(joints.left_shoulder, joints.right_shoulder);
  const hipMid = midpoint(joints.left_hip, joints.right_hip);
  const torsoAngleDeg = Number(torsoAngle(shoulderMid, hipMid).toFixed(1));

  return {
    landmarks: lm,
    joints,
    metrics: {
      torso_angle_degrees: torsoAngleDeg,
      shoulder_mid: shoulderMid,
      hip_mid: hipMid,
    },
    timestamp: video.currentTime,
  };
}
