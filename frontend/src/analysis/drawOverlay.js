const CONNECTIONS = [
  [0, 9], [0, 10],
  [11, 12],
  [11, 23], [23, 25], [25, 27], [27, 31],
  [12, 24], [24, 26], [26, 28], [28, 32],
  [23, 24],
  [15, 17], [16, 18],
  [11, 15], [12, 16],
];

/**
 * Draw filtered pose skeleton onto a canvas overlay.
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

  ctx.strokeStyle = "#39FF14";
  ctx.lineWidth = 2;
  for (const [a, b] of CONNECTIONS) {
    if (!lm[a] || !lm[b]) continue;
    const start = toPx(lm[a]);
    const end = toPx(lm[b]);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }

  ctx.fillStyle = "#FF073A";
  for (const key of Object.keys(lm)) {
    const p = toPx(lm[key]);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  const { shoulder_mid, hip_mid, knee_mid } = analysis.metrics;
  const sm = toPx(shoulder_mid);
  const hm = toPx(hip_mid);
  const km = toPx(knee_mid);
  ctx.strokeStyle = "#f97316";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(sm.x, sm.y);
  ctx.lineTo(hm.x, hm.y);
  ctx.lineTo(km.x, km.y);
  ctx.stroke();
}
