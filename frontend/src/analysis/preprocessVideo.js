import { analyzeFrame } from "./analyzeFrame";

const FRAME_INTERVAL_SEC = 0.05;

/** Seek video to a time and wait for the frame to be ready. */
function seekVideoToTime(video, timeSec) {
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

/**
 * Walk the video once, running MediaPipe at fixed intervals.
 * @param {HTMLVideoElement} video
 * @param {(progress: number) => void} [onProgress] - 0 to 1
 * @returns {Promise<Array>} sorted analysis results
 */
export async function preprocessVideo(video, onProgress) {
  const duration = video.duration;
  if (!duration || !isFinite(duration) || duration <= 0) {
    onProgress?.(1);
    return [];
  }

  video.pause();

  const cache = [];
  const totalSteps = Math.max(1, Math.ceil(duration / FRAME_INTERVAL_SEC) + 1);
  let step = 0;
  let mpTimestamp = 0;

  for (let t = 0; t < duration; t += FRAME_INTERVAL_SEC) {
    const seekTime = Math.min(t, duration);
    await seekVideoToTime(video, seekTime);

    mpTimestamp += 1;
    const result = analyzeFrame(video, mpTimestamp);
    if (result) {
      // Ensure timestamp matches seek time for cache lookup
      cache.push({ ...result, timestamp: seekTime });
    }

    step += 1;
    onProgress?.(Math.min(step / totalSteps, 0.99));
  }

  // Final frame at exact duration
  await seekVideoToTime(video, duration);
  mpTimestamp += 1;
  const last = analyzeFrame(video, mpTimestamp);
  if (last) {
    cache.push({ ...last, timestamp: duration });
  }

  await seekVideoToTime(video, 0);
  onProgress?.(1);
  return cache;
}
