import type { FrameResult } from '../types.js';
import type { PathPoint } from './buildPathSeries.js';
import { drawSkeleton } from './drawSkeleton.js';
import { drawLandmarkPath } from './drawLandmarkPath.js';

export { buildPathSeries } from './buildPathSeries.js';
export type { PathPoint } from './buildPathSeries.js';
export { LANDMARK_GROUPS, resolveLandmarkPoint } from './landmarkCatalog.js';

export function renderOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: {
    frame: FrameResult | null;
    showSkeleton: boolean;
    pathSeries: PathPoint[] | null;
    currentTime: number | null;
  },
): void {
  ctx.clearRect(0, 0, width, height);
  if (options.pathSeries && options.pathSeries.length >= 2) {
    drawLandmarkPath(ctx, width, height, options.pathSeries, options.currentTime);
  }
  if (options.showSkeleton) {
    drawSkeleton(ctx, width, height, options.frame);
  }
}
