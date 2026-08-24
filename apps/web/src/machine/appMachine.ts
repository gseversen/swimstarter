export type AppState =
  | 'idle'
  | 'modelLoading'
  | 'modelReady'
  | 'fileSelected'
  | 'analyzing'
  | 'ready'
  | 'error';

export type AppEvent =
  | { type: 'MODEL_LOAD_START' }
  | { type: 'MODEL_LOADED' }
  | { type: 'MODEL_FAILED'; error: string }
  | { type: 'FILE_SELECTED'; file: File }
  | { type: 'ANALYZE_START' }
  | { type: 'ANALYZE_DONE'; frameCount: number }
  | { type: 'ANALYZE_FAILED'; error: string }
  | { type: 'REANALYZE' }
  | { type: 'NEW_FILE'; file: File }
  | { type: 'PROGRESS'; value: number }
  | { type: 'STATUS'; message: string };

export type AppContext = {
  state: AppState;
  file: File | null;
  videoUrl: string | null;
  progress: number;
  statusMessage: string;
  error: string | null;
  frameCount: number;
};

export function initialContext(): AppContext {
  return {
    state: 'idle',
    file: null,
    videoUrl: null,
    progress: 0,
    statusMessage: '',
    error: null,
    frameCount: 0,
  };
}

export function transition(ctx: AppContext, event: AppEvent): AppContext {
  switch (event.type) {
    case 'MODEL_LOAD_START':
      return { ...ctx, state: 'modelLoading', statusMessage: 'Loading pose model…' };

    case 'MODEL_LOADED':
      if (ctx.file && ctx.state === 'modelLoading') {
        return { ...ctx, state: 'analyzing', statusMessage: 'Analyzing frame-by-frame…', progress: 0 };
      }
      return { ...ctx, state: 'modelReady', statusMessage: '' };

    case 'MODEL_FAILED':
      return { ...ctx, state: 'error', error: event.error };

    case 'FILE_SELECTED': {
      const url = URL.createObjectURL(event.file);
      if (ctx.videoUrl) URL.revokeObjectURL(ctx.videoUrl);
      const next: AppContext = {
        ...ctx,
        file: event.file,
        videoUrl: url,
        error: null,
        frameCount: 0,
        progress: 0,
      };
      if (ctx.state === 'modelReady' || ctx.state === 'ready' || ctx.state === 'error') {
        return { ...next, state: 'fileSelected' };
      }
      return { ...next, state: 'fileSelected' };
    }

    case 'ANALYZE_START':
      return { ...ctx, state: 'analyzing', progress: 0, statusMessage: 'Analyzing frame-by-frame…', error: null };

    case 'ANALYZE_DONE':
      if (event.frameCount === 0) {
        return {
          ...ctx,
          state: 'error',
          error: 'No pose detected. Try a clearer angle or Reanalyze.',
          frameCount: 0,
        };
      }
      return { ...ctx, state: 'ready', frameCount: event.frameCount, statusMessage: '' };

    case 'ANALYZE_FAILED':
      return { ...ctx, state: 'error', error: event.error };

    case 'REANALYZE':
      return { ...ctx, state: 'analyzing', progress: 0, statusMessage: 'Resetting model…', error: null };

    case 'NEW_FILE': {
      const url = URL.createObjectURL(event.file);
      if (ctx.videoUrl) URL.revokeObjectURL(ctx.videoUrl);
      return {
        ...initialContext(),
        state: ctx.state === 'idle' || ctx.state === 'modelLoading' ? ctx.state : 'fileSelected',
        file: event.file,
        videoUrl: url,
      };
    }

    case 'PROGRESS':
      return { ...ctx, progress: event.value };

    case 'STATUS':
      return { ...ctx, statusMessage: event.message };

    default:
      return ctx;
  }
}
