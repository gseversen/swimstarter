import { analyzeFrame } from "./analyzeFrame";

const END_EPSILON_SEC = 0.02;
const SEEK_INTERVAL_SEC = 0.2;

function waitForReadyState(video, minState = 2) {
  return new Promise((resolve) => {
    if (video.readyState >= minState) { resolve(); return; }
    const check = () => {
      if (video.readyState >= minState) {
        video.removeEventListener("loadeddata", check);
        video.removeEventListener("canplay", check);
        resolve();
      }
    };
    video.addEventListener("loadeddata", check);
    video.addEventListener("canplay", check);
    setTimeout(() => {
      video.removeEventListener("loadeddata", check);
      video.removeEventListener("canplay", check);
      resolve();
    }, 2000);
  });
}

function waitForSeek(video, timeSec) {
  return new Promise((resolve) => {
    if (Math.abs(video.currentTime - timeSec) < 0.001) {
      resolve();
      return;
    }

    let settled = false;
    const onSeeked = () => {
      if (settled) return;
      settled = true;
      video.removeEventListener("seeked", onSeeked);
      resolve();
    };

    video.addEventListener("seeked", onSeeked);
    video.currentTime = timeSec;

    setTimeout(() => {
      if (!settled) {
        settled = true;
        video.removeEventListener("seeked", onSeeked);
        resolve();
      }
    }, 500);
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

async function safeCleanup(video, state) {
  try {
    if (state.frameId !== null) {
      cancelScheduledFrame(video, state.frameId);
      state.frameId = null;
    }
    if (state.endedListener) {
      video.removeEventListener("ended", state.endedListener);
      state.endedListener = null;
    }
    video.pause();
    await waitForSeek(video, 0);
    video.muted = state.wasMuted;
  } catch {
    /* cleanup best-effort */
  }
}

/** Seek-based analysis — no video.play(), works on iOS Safari. */
async function preprocessViaSeek(video, duration, onProgress, isCancelled, onStatus) {
  const wasMuted = video.muted;
  video.pause();
  video.muted = true;

  onStatus?.("Waiting for video data...");
  await waitForReadyState(video, 2);

  const cache = [];
  let mpTimestamp = 0;
  const steps = Math.max(1, Math.ceil(duration / SEEK_INTERVAL_SEC));

  onStatus?.(`Analyzing ${steps} frames...`);

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
  const state = {
    wasMuted: video.muted,
    cache: [],
    lastAnalyzedTimeSec: -1,
    frameId: null,
    finished: false,
    endedListener: null,
  };

  return new Promise((resolve, reject) => {
    const finish = async (result) => {
      if (state.finished) return;
      state.finished = true;
      await safeCleanup(video, state);
      onProgress?.(1);
      resolve(result);
    };

    const onFrame = () => {
      if (isCancelled?.() || state.finished) {
        finish([]);
        return;
      }

      const timeSec = video.currentTime;
      const timestampMs = Math.round(timeSec * 1000);

      if (timeSec !== state.lastAnalyzedTimeSec) {
        state.lastAnalyzedTimeSec = timeSec;
        const result = analyzeFrame(video, timestampMs);
        if (result) {
          state.cache.push({ ...result, timestamp: timeSec });
        }
      }

      onProgress?.(Math.min(timeSec / duration, 0.99));

      if (timeSec >= duration - END_EPSILON_SEC || video.ended) {
        finish(state.cache);
        return;
      }

      state.frameId = scheduleFrame(video, onFrame);
    };

    waitForSeek(video, 0)
      .then(async () => {
        if (isCancelled?.() || state.finished) {
          finish([]);
          return;
        }

        // rVFC does not fire for the final frame; ended event is the reliable signal.
        state.endedListener = () => finish(state.cache);
        video.addEventListener("ended", state.endedListener);

        try {
          await video.play();
        } catch {
          state.finished = true;
          await safeCleanup(video, state);
          resolve(null);
          return;
        }

        state.frameId = scheduleFrame(video, onFrame);
      })
      .catch((err) => {
        if (!state.finished) {
          state.finished = true;
          safeCleanup(video, state).then(() => reject(err));
        } else {
          resolve(null);
        }
      });
  });
}

/**
 * Analyze video — prefers muted playback on desktop; seek-only on iOS / when preferSeek.
 * @param {HTMLVideoElement} video
 * @param {(progress: number) => void} [onProgress]
 * @param {() => boolean} [isCancelled]
 * @param {{ preferSeek?: boolean, onStatus?: (msg: string) => void }} [options]
 */
export async function preprocessVideo(video, onProgress, isCancelled, { preferSeek = false, onStatus } = {}) {
  const duration = video.duration;
  if (!duration || !isFinite(duration) || duration <= 0) {
    onProgress?.(1);
    return [];
  }

  video.pause();
  video.muted = true;

  if (preferSeek) {
    return preprocessViaSeek(video, duration, onProgress, isCancelled, onStatus);
  }

  try {
    const playbackCache = await preprocessViaPlayback(video, duration, onProgress, isCancelled);
    if (playbackCache !== null) return playbackCache;
    return await preprocessViaSeek(video, duration, onProgress, isCancelled, onStatus);
  } catch {
    return preprocessViaSeek(video, duration, onProgress, isCancelled, onStatus);
  }
}
