import { analyzeFrame } from "./analyzeFrame";

const END_EPSILON_SEC = 0.02;
const SEEK_INTERVAL_SEC = 0.05;

function waitForSeek(video, timeSec) {
  return new Promise((resolve) => {
    if (Math.abs(video.currentTime - timeSec) < 0.001) {
      resolve();
      return;
    }

    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked);
      resolve();
    };

    video.addEventListener("seeked", onSeeked);
    video.currentTime = timeSec;
  });
}

function scheduleFrame(video, callback) {
  if (video.requestVideoFrameCallback) {
    return video.requestVideoFrameCallback(callback);
  }
  return requestAnimationFrame(() => callback(performance.now(), { mediaTime: video.currentTime }));
}

function cancelScheduledFrame(video, id) {
  if (video.cancelVideoFrameCallback && video.requestVideoFrameCallback) {
    video.cancelVideoFrameCallback(id);
    return;
  }
  cancelAnimationFrame(id);
}

/** Seek-based fallback for platforms that block programmatic video.play() (e.g. iOS Safari). */
async function preprocessViaSeek(video, duration, onProgress, isCancelled) {
  const wasMuted = video.muted;
  video.pause();
  video.muted = true;

  const cache = [];
  let mpTimestamp = 0;
  const steps = Math.max(1, Math.ceil(duration / SEEK_INTERVAL_SEC));

  for (let i = 0; i <= steps; i += 1) {
    if (isCancelled?.()) break;

    const seekTime = Math.min(i * SEEK_INTERVAL_SEC, duration);
    await waitForSeek(video, seekTime);

    mpTimestamp += 1;
    const result = analyzeFrame(video, mpTimestamp);
    if (result) {
      cache.push({ ...result, timestamp: seekTime });
    }

    onProgress?.(Math.min(seekTime / duration, 0.99));
  }

  await waitForSeek(video, 0);
  video.muted = wasMuted;
  onProgress?.(1);
  return cache;
}

function preprocessViaPlayback(video, duration, onProgress, isCancelled) {
  const wasMuted = video.muted;
  const cache = [];
  let lastAnalyzedTimeSec = -1;
  let frameId = null;
  let finished = false;
  let endedListener = null;

  const cleanup = async () => {
    if (frameId !== null) {
      cancelScheduledFrame(video, frameId);
      frameId = null;
    }
    if (endedListener) {
      video.removeEventListener("ended", endedListener);
      endedListener = null;
    }
    video.pause();
    await waitForSeek(video, 0);
    video.muted = wasMuted;
  };

  return new Promise((resolve, reject) => {
    const finish = async (result) => {
      if (finished) return;
      finished = true;
      await cleanup();
      onProgress?.(1);
      resolve(result);
    };

    const onFrame = () => {
      if (isCancelled?.() || finished) {
        finish([]);
        return;
      }

      const timeSec = video.currentTime;
      const timestampMs = Math.round(timeSec * 1000);

      if (timeSec !== lastAnalyzedTimeSec) {
        lastAnalyzedTimeSec = timeSec;
        const result = analyzeFrame(video, timestampMs);
        if (result) {
          cache.push({ ...result, timestamp: timeSec });
        }
      }

      onProgress?.(Math.min(timeSec / duration, 0.99));

      if (timeSec >= duration - END_EPSILON_SEC || video.ended) {
        finish(cache);
        return;
      }

      frameId = scheduleFrame(video, onFrame);
    };

    waitForSeek(video, 0)
      .then(async () => {
        if (isCancelled?.() || finished) {
          finish([]);
          return;
        }

        // rVFC does not emit a callback for the final frame at end-of-playback;
        // the `ended` event is the reliable completion signal.
        endedListener = () => finish(cache);
        video.addEventListener("ended", endedListener);

        try {
          await video.play();
        } catch {
          if (!finished) {
            finished = true;
            await cleanup();
            resolve(null);
          }
          return;
        }

        frameId = scheduleFrame(video, onFrame);
      })
      .catch((err) => {
        if (!finished) {
          finished = true;
          cleanup().then(() => reject(err));
        }
      });
  });
}

/**
 * Analyze video — prefers muted playback; falls back to seek on play() rejection (iOS).
 * @param {HTMLVideoElement} video
 * @param {(progress: number) => void} [onProgress] - 0 to 1
 * @param {() => boolean} [isCancelled]
 * @returns {Promise<Array>} sorted analysis results
 */
export async function preprocessVideo(video, onProgress, isCancelled) {
  const duration = video.duration;
  if (!duration || !isFinite(duration) || duration <= 0) {
    onProgress?.(1);
    return [];
  }

  video.pause();
  video.muted = true;

  const playbackCache = await preprocessViaPlayback(video, duration, onProgress, isCancelled);
  if (playbackCache !== null) return playbackCache;

  return preprocessViaSeek(video, duration, onProgress, isCancelled);
}
