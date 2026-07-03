/**
 * Draw the water line and (if present) mock skeletal overlay onto a canvas.
 * Landmark coordinates are normalized (0-1) and scaled to canvas size here so
 * the overlay stays correct at any resolution.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width canvas width in px
 * @param {number} height canvas height in px
 * @param {number} waterLine water-line position, 0-100
 * @param {object|null} analysis result from analyzeFrame(), or null
 */
export function drawOverlay(ctx, width, height, waterLine, analysis) {
  ctx.clearRect(0, 0, width, height);

  const y = (waterLine / 100) * height;
  ctx.strokeStyle = "#0ea5e9";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(width, y);
  ctx.stroke();

  if (!analysis) return;

  const { left_shoulder, right_shoulder, left_hip, right_hip } = analysis.frame_analysis;
  const toPx = (p) => ({ x: p.x * width, y: p.y * height });
  const s = toPx(left_shoulder);
  const s2 = toPx(right_shoulder);
  const h = toPx(left_hip);
  const h2 = toPx(right_hip);
  const shoulderMid = { x: (s.x + s2.x) / 2, y: (s.y + s2.y) / 2 };
  const hipMid = { x: (h.x + h2.x) / 2, y: (h.y + h2.y) / 2 };

  ctx.strokeStyle = "#f97316";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(s.x, s.y);
  ctx.lineTo(s2.x, s2.y);
  ctx.moveTo(h.x, h.y);
  ctx.lineTo(h2.x, h2.y);
  ctx.moveTo(shoulderMid.x, shoulderMid.y);
  ctx.lineTo(hipMid.x, hipMid.y);
  ctx.stroke();

  ctx.fillStyle = "#f97316";
  for (const p of [s, s2, h, h2]) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}
