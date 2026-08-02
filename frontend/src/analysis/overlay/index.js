import { drawSkeleton } from "./drawSkeleton";
import { drawLandmarkPath } from "./drawLandmarkPath";

/**
 * Orchestrator: clear canvas, then draw enabled overlay layers.
 * Path is drawn first (underneath), then skeleton on top so joints stay visible.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width
 * @param {number} height
 * @param {object} options
 * @param {object|null} options.analysis - current frame result
 * @param {boolean} options.showSkeleton - whether to draw pose skeleton
 * @param {string|null} options.pathLandmark - selected landmark id or null
 * @param {Array|null} options.pathSeries - precomputed [{t,x,y},...] for pathLandmark
 * @param {number|null} options.currentTime - video playhead time (seconds)
 */
export function renderOverlay(ctx, width, height, { analysis, showSkeleton, pathLandmark, pathSeries, currentTime }) {
  ctx.clearRect(0, 0, width, height);

  if (pathLandmark && pathSeries && pathSeries.length >= 2) {
    drawLandmarkPath(ctx, width, height, pathSeries, currentTime);
  }

  if (showSkeleton) {
    drawSkeleton(ctx, width, height, analysis);
  }
}
