import { useRef, useState, useCallback, useEffect } from 'react';
import type { FrameResult } from '@swimstarter/engine';
import { useAppMachine } from './hooks/useAppMachine.js';
import Navbar from './components/Navbar.js';
import EmptyScreen from './components/EmptyScreen.js';
import ProgressScreen from './components/ProgressScreen.js';
import ErrorScreen from './components/ErrorScreen.js';
import VideoPlayer from './components/VideoPlayer.js';
import type { VideoPlayerHandle } from './components/VideoPlayer.js';
import MetricsPanel from './components/MetricsPanel.js';
import HipAngleChart from './components/HipAngleChart.js';

export default function App() {
  const { ctx, cache, modelReady, handleFile, startAnalysis, reanalyze } = useAppMachine();
  const playerRef = useRef<VideoPlayerHandle>(null);
  const [currentFrame, setCurrentFrame] = useState<FrameResult | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoReady, setVideoReady] = useState(false);

  const onCurrentFrame = useCallback((f: FrameResult | null) => {
    setCurrentFrame(f);
    if (f) setCurrentTime(f.t);
  }, []);

  const onMetadataLoaded = useCallback((_video: HTMLVideoElement) => {
    setVideoReady(true);
  }, []);

  // D4: auto-start analysis once BOTH model and video metadata are ready
  useEffect(() => {
    if (modelReady && videoReady && ctx.state === 'fileSelected') {
      const video = playerRef.current?.getVideo();
      if (video) {
        setVideoReady(false);
        startAnalysis(video);
      }
    }
  }, [modelReady, videoReady, ctx.state, startAnalysis]);

  const onFile = useCallback((f: File) => {
    setVideoReady(false);
    setCurrentFrame(null);
    setCurrentTime(0);
    handleFile(f);
  }, [handleFile]);

  const onReanalyze = useCallback(() => {
    const video = playerRef.current?.getVideo();
    if (video) reanalyze(video);
  }, [reanalyze]);

  const isAnalyzing = ctx.state === 'analyzing';
  const isReady = ctx.state === 'ready';
  const showEmpty = !ctx.videoUrl;
  const showError = ctx.state === 'error';
  const hasVideo = !!ctx.videoUrl;

  const sampleRate = cache.length > 0
    ? Math.round(cache.length / (cache.all[cache.all.length - 1]?.t || 1))
    : 30;

  return (
    <div
      className="app-root"
      onDragOver={(e) => {
        if (isAnalyzing) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      }}
      onDrop={(e) => {
        if (isAnalyzing) return;
        e.preventDefault();
        const f = e.dataTransfer.files[0];
        if (f) onFile(f);
      }}
    >
      <Navbar ctx={ctx} onFile={onFile} onReanalyze={onReanalyze} onSave={() => {}} />

      {showEmpty && <EmptyScreen onFile={onFile} />}

      {isAnalyzing && (
        <ProgressScreen
          progress={ctx.progress}
          statusMessage={ctx.statusMessage}
          totalFrames={Math.round(ctx.progress > 0 ? cache.length / ctx.progress : 252)}
          sampleRate={30}
        />
      )}

      {showError && (
        <ErrorScreen error={ctx.error!} onReanalyze={onReanalyze} onFile={onFile} />
      )}

      {/* Single VideoPlayer — always mounted when videoUrl exists.
          E8: use visibility:hidden during analysis, not display:none */}
      {hasVideo && (
        <div
          className="workspace-grid"
          style={{
            visibility: isAnalyzing ? 'hidden' : 'visible',
            position: isAnalyzing ? 'absolute' : 'relative',
            width: isAnalyzing ? '100%' : undefined,
            pointerEvents: isAnalyzing ? 'none' : 'auto',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <VideoPlayer
              ref={playerRef}
              videoUrl={ctx.videoUrl!}
              cache={cache}
              onCurrentFrame={onCurrentFrame}
              onMetadataLoaded={onMetadataLoaded}
              disabled={!isReady}
            />
            {isReady && cache.length > 1 && (
              <HipAngleChart frames={cache.all} currentTime={currentTime} />
            )}
          </div>
          {isReady && (
            <MetricsPanel
              frame={currentFrame}
              state={ctx.state}
              sampleRate={sampleRate}
              totalFrames={cache.length}
            />
          )}
        </div>
      )}
    </div>
  );
}
