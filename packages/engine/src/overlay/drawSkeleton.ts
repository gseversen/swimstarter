import type { FrameResult } from '../types.js';

const CONNECTIONS: [number, number][] = [
  [0, 9], [0, 10],
  [11, 12],
  [11, 23], [23, 25], [25, 27], [27, 31],
  [12, 24], [24, 26], [26, 28], [28, 32],
  [23, 24],
  [15, 17], [16, 18],
  [11, 15], [12, 16],
];

const BONE_COLOR = 'oklch(0.82 0.11 205)';
const JOINT_COLOR = '#fff';
const MIDLINE_COLOR = '#fff';
const VISIBILITY_THRESHOLD = 0.5;

export function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  frame: FrameResult | null,
): void {
  if (!frame || frame.confidence < VISIBILITY_THRESHOLD) return;
  const lm = frame.landmarks;

  const px = (p: { x: number; y: number }) => ({ x: p.x * w, y: p.y * h });

  // bones
  ctx.strokeStyle = BONE_COLOR;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  for (const [a, b] of CONNECTIONS) {
    if (!lm[a] || !lm[b]) continue;
    const pa = px(lm[a]), pb = px(lm[b]);
    ctx.beginPath();
    ctx.moveTo(pa.x, pa.y);
    ctx.lineTo(pb.x, pb.y);
    ctx.stroke();
  }

  // joints
  ctx.fillStyle = JOINT_COLOR;
  for (const key of Object.keys(lm)) {
    const p = px(lm[Number(key)]);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // hip-angle midline
  const { shoulderMid, hipMid, kneeMid } = frame.metrics;
  ctx.strokeStyle = MIDLINE_COLOR;
  ctx.lineWidth = 2;
  const s = px(shoulderMid), hp = px(hipMid), k = px(kneeMid);
  ctx.beginPath();
  ctx.moveTo(s.x, s.y);
  ctx.lineTo(hp.x, hp.y);
  ctx.lineTo(k.x, k.y);
  ctx.stroke();
}
