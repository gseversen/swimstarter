import type { PathPoint } from './buildPathSeries.js';

const PATH_COLOR = 'oklch(0.82 0.11 205)';
const PATH_WIDTH = 2.5;

export function drawLandmarkPath(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  pathSeries: PathPoint[],
  currentTime: number | null,
): void {
  if (!pathSeries || pathSeries.length < 2) return;

  let end = pathSeries.length - 1;
  if (currentTime != null) {
    // binary search for last point where t <= currentTime
    let lo = 0, hi = pathSeries.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (pathSeries[mid].t <= currentTime) lo = mid;
      else hi = mid - 1;
    }
    end = lo;
  }

  if (end < 1) return;

  ctx.strokeStyle = PATH_COLOR;
  ctx.lineWidth = PATH_WIDTH;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.moveTo(pathSeries[0].x * w, pathSeries[0].y * h);
  for (let i = 1; i <= end; i++) {
    ctx.lineTo(pathSeries[i].x * w, pathSeries[i].y * h);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
}
