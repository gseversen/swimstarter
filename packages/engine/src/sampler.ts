import type { AnalysisResult, FrameResult } from './types.js';
import { analyzeFrame } from './analyzeFrame.js';
import { getModelId } from './poseModel.js';

const MAX_SAMPLES = 900;
const YIELD_EVERY = 8;

function waitForSeek(video: HTMLVideoElement, timeSec: number): Promise<void> {
  return new Promise((resolve, reject) => {
    if (Math.abs(video.currentTime - timeSec) < 0.001) {
      resolve();
      return;
    }
    const timeout = setTimeout(() => {
      video.removeEventListener('seeked', onSeeked);
      resolve(); // resolve anyway, best effort
    }, 2000);
    function onSeeked() {
      clearTimeout(timeout);
      video.removeEventListener('seeked', onSeeked);
      resolve();
    }
    video.addEventListener('seeked', onSeeked);
    video.currentTime = timeSec;
  });
}

// E1: single seek-based sampling path for all platforms
// E2: real timestamps passed to MediaPipe
// E7: yields to event loop every N samples
export async function analyze(
  video: HTMLVideoElement,
  opts: {
    targetHz?: number;
    signal?: AbortSignal;
    onProgress?: (p: number) => void;
    onStatus?: (msg: string) => void;
  } = {},
): Promise<AnalysisResult> {
  const targetHz = opts.targetHz ?? 30;
  const duration = video.duration;

  if (!Number.isFinite(duration) || duration <= 0) {
    opts.onProgress?.(1);
    return {
      version: 1,
      modelId: getModelId(),
      sampleRateHz: targetHz,
      duration: 0,
      frames: [],
    };
  }

  let effectiveHz = targetHz;
  if (duration * targetHz > MAX_SAMPLES) {
    effectiveHz = MAX_SAMPLES / duration;
    opts.onStatus?.(`Clip is long — sampling at ${effectiveHz.toFixed(0)} Hz instead of ${targetHz}`);
  }
  const interval = 1 / effectiveHz;
  const totalSteps = Math.ceil(duration / interval);

  const wasMuted = video.muted;
  video.muted = true;
  video.pause();

  const frames: FrameResult[] = [];
  opts.onStatus?.('Analyzing frame-by-frame…');

  for (let i = 0; i <= totalSteps; i++) {
    if (opts.signal?.aborted) break;

    const seekTime = Math.min(i * interval, duration);
    await waitForSeek(video, seekTime);

    // E2: pass real millisecond timestamps
    const timestampMs = Math.round(seekTime * 1000);
    const result = analyzeFrame(video, timestampMs);
    if (result) {
      frames.push(result);
    }

    opts.onProgress?.((i + 1) / (totalSteps + 1));

    // E7: yield to event loop periodically
    if (i % YIELD_EVERY === 0) {
      await new Promise(r => setTimeout(r, 0));
    }
  }

  video.currentTime = 0;
  video.muted = wasMuted;
  opts.onProgress?.(1);

  return {
    version: 1,
    modelId: getModelId(),
    sampleRateHz: effectiveHz,
    duration,
    frames,
  };
}
