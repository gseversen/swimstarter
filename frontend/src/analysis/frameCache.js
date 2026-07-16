/**
 * In-memory cache of preprocessed frame results for one video.
 * Each entry: { landmarks, joints, metrics, timestamp } — same shape as analyzeFrame().
 * Sorted ascending by timestamp (seconds).
 */

/** @returns {[]} */
export function clearCache() {
  return [];
}

/**
 * @param {number} currentTime - video.currentTime in seconds
 * @param {Array} cache - sorted array of analysis results
 * @returns {object|null} nearest cached result, or null if cache is empty
 */
export function getCachedResultForTime(currentTime, cache) {
  if (!cache || cache.length === 0) return null;

  const first = cache[0];
  const last = cache[cache.length - 1];

  if (currentTime <= first.timestamp) return first;
  if (currentTime >= last.timestamp) return last;

  for (let i = 0; i < cache.length - 1; i++) {
    const a = cache[i];
    const b = cache[i + 1];

    if (currentTime >= a.timestamp && currentTime <= b.timestamp) {
      const diffA = currentTime - a.timestamp;
      const diffB = b.timestamp - currentTime;
      return diffA <= diffB ? a : b;
    }
  }

  return last;
}