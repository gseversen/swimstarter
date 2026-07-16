import { analyzeFrame } from "./analyzeFrame";

const END_EPSILON_SEC = 0.02;

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

/**
 * Analyze video during muted playback — one detection per presented frame.
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

  const wasMuted = video.muted;
  const cache = [];
  let lastAnalyzedTimeSec = -1;
  let frameId = null;
  let finished = false;

  const cleanup = async () => {
    if (frameId !== null) {
      cancelScheduledFrame(video, frameId);
      frameId = null;
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

    video.pause();
    video.muted = true;

    waitForSeek(video, 0)
      .then(() => {
        if (isCancelled?.() || finished) {
          finish([]);
          return;
        }

        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            if (!finished) {
              finished = true;
              cleanup().then(() => reject(err));
            }
          });
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
