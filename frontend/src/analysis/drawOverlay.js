import { PoseLandmarker } from "@mediapipe/tasks-vision";

// MediaPipe pose connections for full skeleton
const CONNECTIONS = PoseLandmarker.POSE_CONNECTIONS;

/**
 * Draw full pose skeleton onto a canvas overlay.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width canvas width
 * @param {number} height canvas height
 * @param {object|null} analysis result from analyzeFrame()
 */
export function drawOverlay(ctx, width, height, analysis) {
  ctx.clearRect(0, 0, width, height);
  if (!analysis || !analysis.landmarks) return;

  const lm = analysis.landmarks;
  const toPx = (p) => ({ x: p.x * width, y: p.y * height });

  // Draw connections
  ctx.strokeStyle = "#22d3ee";
  ctx.lineWidth = 2;
  for (const conn of CONNECTIONS) {
    const start = toPx(lm[conn.start]);
    const end = toPx(lm[conn.end]);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }

  // Draw joint dots
  ctx.fillStyle = "#f97316";
  for (const point of lm) {
    const p = toPx(point);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw torso midline (shoulder mid to hip mid)
  const { shoulder_mid, hip_mid } = analysis.metrics;
  const sm = toPx(shoulder_mid);
  const hm = toPx(hip_mid);
  ctx.strokeStyle = "#f97316";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(sm.x, sm.y);
  ctx.lineTo(hm.x, hm.y);
  ctx.stroke();
}
