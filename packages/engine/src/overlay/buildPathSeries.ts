import type { FrameResult } from '../types.js';
import { resolveLandmarkPoint } from './landmarkCatalog.js';

export type PathPoint = { t: number; x: number; y: number };

export function buildPathSeries(
  frames: FrameResult[],
  landmarkId: string,
): PathPoint[] {
  if (!frames || !landmarkId) return [];
  const series: PathPoint[] = [];
  for (const frame of frames) {
    const pt = resolveLandmarkPoint(frame, landmarkId);
    if (pt) series.push({ t: frame.t, x: pt.x, y: pt.y });
  }
  return series;
}
