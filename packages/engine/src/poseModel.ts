let poseLandmarker: any = null;
let isInitializing = false;
let usedDelegate: 'GPU' | 'CPU' = 'GPU';
let resolvedModelId = '';

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task';
const MODEL_ID = 'pose_landmarker_full@0.10.35';
const LOAD_TIMEOUT_MS = 20000;

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (err) => { clearTimeout(timer); reject(err); },
    );
  });
}

export async function initPoseLandmarker(onStatus?: (msg: string) => void): Promise<any> {
  if (poseLandmarker) return poseLandmarker;
  if (isInitializing) {
    while (isInitializing) await new Promise(r => setTimeout(r, 50));
    return poseLandmarker;
  }
  isInitializing = true;

  try {
    onStatus?.('Loading pose model…');
    const timeoutMessage = 'Model failed to load — check your connection and try again.';
    const vision = await import('@mediapipe/tasks-vision');
    const { FilesetResolver, PoseLandmarker } = vision;
    const fileset = await withTimeout(
      FilesetResolver.forVisionTasks(WASM_URL),
      LOAD_TIMEOUT_MS,
      timeoutMessage,
    );

    // E6: GPU → CPU fallback
    try {
      poseLandmarker = await withTimeout(
        PoseLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        }),
        LOAD_TIMEOUT_MS,
        timeoutMessage,
      );
      usedDelegate = 'GPU';
    } catch {
      onStatus?.('GPU unavailable, falling back to CPU…');
      poseLandmarker = await withTimeout(
        PoseLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: 'CPU' },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        }),
        LOAD_TIMEOUT_MS,
        timeoutMessage,
      );
      usedDelegate = 'CPU';
    }

    resolvedModelId = MODEL_ID;
    onStatus?.(`Pose model loaded — ${usedDelegate} delegate`);
    return poseLandmarker;
  } finally {
    isInitializing = false;
  }
}

export function getPoseLandmarker(): any {
  return poseLandmarker;
}

export function getModelId(): string {
  return resolvedModelId;
}

export function getDelegate(): 'GPU' | 'CPU' {
  return usedDelegate;
}

// E9: full reset for reanalyze
export async function resetPoseLandmarker(onStatus?: (msg: string) => void): Promise<any> {
  if (poseLandmarker) {
    poseLandmarker.close();
    poseLandmarker = null;
  }
  isInitializing = false;
  return initPoseLandmarker(onStatus);
}
