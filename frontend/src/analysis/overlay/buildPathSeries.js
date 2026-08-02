import { resolveLandmarkPoint } from "./landmarkCatalog";

/**
 * Build a path series [{t, x, y}, ...] for a single landmark across the full cache.
 * Skips frames where the point is missing or non-finite.
 * @param {Array} cache - sorted analysis cache
 * @param {string} landmarkId - e.g. "left_wrist", "hip_mid"
 * @returns {Array<{t: number, x: number, y: number}>}
 */
export function buildPathSeries(cache, landmarkId) {
  if (!cache || !landmarkId) return [];

  const series = [];
  for (const entry of cache) {
    const pt = resolveLandmarkPoint(entry, landmarkId);
    if (pt) {
      series.push({ t: entry.timestamp, x: pt.x, y: pt.y });
    }
  }
  return series;
}
