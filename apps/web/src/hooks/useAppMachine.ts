import { useReducer, useCallback, useRef, useEffect, useState } from 'react';
import {
  initPoseLandmarker, resetPoseLandmarker, analyze,
  FrameCache, buildPathSeries,
} from '@swimstarter/engine';
import type { AnalysisResult, FrameResult, PathPoint } from '@swimstarter/engine';
import { initialContext, transition } from '../machine/appMachine.js';
import type { AppContext, AppEvent } from '../machine/appMachine.js';

export function useAppMachine() {
  const [ctx, dispatch] = useReducer(transition, undefined, initialContext);
  const cacheRef = useRef(new FrameCache());
  const analysisRef = useRef<AnalysisResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [modelReady, setModelReady] = useState(false);

  const send = useCallback((e: AppEvent) => dispatch(e), []);

  // auto-init model on mount
  useEffect(() => {
    send({ type: 'MODEL_LOAD_START' });
    initPoseLandmarker((msg) => send({ type: 'STATUS', message: msg }))
      .then(() => {
        setModelReady(true);
        send({ type: 'MODEL_LOADED' });
      })
      .catch((err) => send({ type: 'MODEL_FAILED', error: String(err) }));
  }, [send]);

  const handleFile = useCallback((file: File) => {
    abortRef.current?.abort();
    cacheRef.current = new FrameCache();
    analysisRef.current = null;
    send({ type: 'FILE_SELECTED', file });
  }, [send]);

  const startAnalysis = useCallback(async (video: HTMLVideoElement) => {
    if (!modelReady) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    send({ type: 'ANALYZE_START' });

    try {
      const result = await analyze(video, {
        targetHz: 30,
        signal: ac.signal,
        onProgress: (p) => send({ type: 'PROGRESS', value: p }),
        onStatus: (msg) => send({ type: 'STATUS', message: msg }),
      });
      analysisRef.current = result;
      cacheRef.current = new FrameCache();
      cacheRef.current.load(result.frames);
      send({ type: 'ANALYZE_DONE', frameCount: result.frames.length });
    } catch (err) {
      if (!ac.signal.aborted) {
        send({ type: 'ANALYZE_FAILED', error: String(err) });
      }
    }
  }, [send, modelReady]);

  const reanalyze = useCallback(async (video: HTMLVideoElement) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    send({ type: 'REANALYZE' });

    try {
      await resetPoseLandmarker((msg) => send({ type: 'STATUS', message: msg }));
      const result = await analyze(video, {
        targetHz: 30,
        signal: ac.signal,
        onProgress: (p) => send({ type: 'PROGRESS', value: p }),
        onStatus: (msg) => send({ type: 'STATUS', message: msg }),
      });
      analysisRef.current = result;
      cacheRef.current = new FrameCache();
      cacheRef.current.load(result.frames);
      send({ type: 'ANALYZE_DONE', frameCount: result.frames.length });
    } catch (err) {
      if (!ac.signal.aborted) {
        send({ type: 'ANALYZE_FAILED', error: String(err) });
      }
    }
  }, [send]);

  return {
    ctx,
    send,
    cache: cacheRef.current,
    analysis: analysisRef.current,
    modelReady,
    handleFile,
    startAnalysis,
    reanalyze,
  };
}
