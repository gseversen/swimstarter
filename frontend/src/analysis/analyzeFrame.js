import { midpoint, torsoAngleVsWaterline } from "../utils/mathHelpers";

// ponytail: Replace with @mediapipe/tasks-vision PoseLandmarker.
// For now we return fixed normalized landmarks so the rest of the pipeline
// (overlay drawing, angle math, result display) can be built and tested.
const MOCK_LANDMARKS = {
  leftShoulder: { x: 0.42, y: 0.31 },
  rightShoulder: { x: 0.56, y: 0.32 },
  leftHip: { x: 0.45, y: 0.61 },
  rightHip: { x: 0.53, y: 0.62 },
};

/**
 * Analyze a single video frame entirely in the browser.
 *
 * @param {HTMLVideoElement|HTMLCanvasElement|HTMLImageElement} _source frame source (unused until real pose detection)
 * @param {number} waterLine water-line position, 0-100
 * @returns {{frame_analysis: object, water_line: number}}
 */
export function analyzeFrame(_source, waterLine) {
  const shoulderMid = midpoint(MOCK_LANDMARKS.leftShoulder, MOCK_LANDMARKS.rightShoulder);
  const hipMid = midpoint(MOCK_LANDMARKS.leftHip, MOCK_LANDMARKS.rightHip);

  return {
    frame_analysis: {
      left_shoulder: MOCK_LANDMARKS.leftShoulder,
      right_shoulder: MOCK_LANDMARKS.rightShoulder,
      left_hip: MOCK_LANDMARKS.leftHip,
      right_hip: MOCK_LANDMARKS.rightHip,
      torso_angle_degrees: Number(torsoAngleVsWaterline(shoulderMid, hipMid).toFixed(1)),
    },
    water_line: waterLine,
  };
}
