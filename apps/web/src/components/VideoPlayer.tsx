import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import { renderOverlay, buildPathSeries, LANDMARK_GROUPS, FrameCache } from '@swimstarter/engine';
import type { FrameResult, PathPoint } from '@swimstarter/engine';

const VISIBILITY_THRESHOLD = 0.5;

export type VideoPlayerHandle = {
  getVideo: () => HTMLVideoElement | null;
};

type Props = {
  videoUrl: string;
  cache: FrameCache;
  onCurrentFrame: (f: FrameResult | null) => void;
  onMetadataLoaded: (video: HTMLVideoElement) => void;
  disabled: boolean;
};

const VideoPlayer = forwardRef<VideoPlayerHandle, Props>(function VideoPlayer(
  { videoUrl, cache, onCurrentFrame, onMetadataLoaded, disabled },
  ref,
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const lastTimeRef = useRef(-1);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [pathLandmark, setPathLandmark] = useState<string | null>('right_wrist');
  const [pathSeries, setPathSeries] = useState<PathPoint[]>([]);

  // refs for RAF-safe access
  const showSkeletonRef = useRef(showSkeleton);
  const pathSeriesRef = useRef(pathSeries);
  showSkeletonRef.current = showSkeleton;
  pathSeriesRef.current = pathSeries;

  useImperativeHandle(ref, () => ({
    getVideo: () => videoRef.current,
  }));

  // rebuild path series when landmark or cache changes
  useEffect(() => {
    if (pathLandmark && cache.length > 0) {
      const series = buildPathSeries(cache.all, pathLandmark);
      setPathSeries(series);
    } else {
      setPathSeries([]);
    }
  }, [pathLandmark, cache.length]);

  const drawFrame = useCallback((time: number) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || cache.length === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const frame = cache.lookup(time);
    onCurrentFrame(frame);

    renderOverlay(ctx, canvas.width, canvas.height, {
      frame,
      showSkeleton: showSkeletonRef.current,
      pathSeries: pathSeriesRef.current,
      currentTime: time,
    });
  }, [cache, onCurrentFrame]);

  // playback RAF loop
  useEffect(() => {
    if (!playing || disabled) return;
    const video = videoRef.current;
    if (!video) return;

    function tick() {
      const t = video!.currentTime;
      if (t !== lastTimeRef.current) {
        lastTimeRef.current = t;
        setCurrentTime(t);
        drawFrame(t);
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, disabled, drawFrame]);

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration);
    onMetadataLoaded(video);
  };

  const handlePlay = () => {
    if (disabled) return;
    videoRef.current?.play();
    setPlaying(true);
  };
  const handlePause = () => {
    videoRef.current?.pause();
    setPlaying(false);
  };
  const handleToggle = () => playing ? handlePause() : handlePlay();

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value);
    if (videoRef.current) videoRef.current.currentTime = t;
    setCurrentTime(t);
    drawFrame(t);
  };

  const handleSeeked = () => {
    if (!playing) {
      const t = videoRef.current?.currentTime ?? 0;
      setCurrentTime(t);
      drawFrame(t);
    }
  };

  // §7: frame-step by sample interval
  const sampleRate = cache.length > 1 && duration > 0
    ? cache.length / duration : 30;
  const stepSize = 1 / sampleRate;

  const stepForward = () => {
    if (!videoRef.current || disabled) return;
    const t = Math.min(videoRef.current.currentTime + stepSize, duration);
    videoRef.current.currentTime = t;
  };
  const stepBackward = () => {
    if (!videoRef.current || disabled) return;
    const t = Math.max(videoRef.current.currentTime - stepSize, 0);
    videoRef.current.currentTime = t;
  };

  const handleSkeletonToggle = () => {
    setShowSkeleton(s => !s);
    if (!playing) drawFrame(currentTime);
  };

  const handlePathChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value || null;
    setPathLandmark(val);
    if (!playing && val && cache.length > 0) {
      const series = buildPathSeries(cache.all, val);
      setPathSeries(series);
      setTimeout(() => drawFrame(currentTime), 0);
    }
  };

  const handleEnded = () => {
    setPlaying(false);
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = (s % 60).toFixed(2);
    return `${m}:${sec.padStart(5, '0')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Video + overlay */}
      <div style={{
        position: 'relative', borderRadius: 'var(--radius)', overflow: 'hidden',
        aspectRatio: '16/9', backgroundColor: '#080a0c',
        backgroundImage: 'repeating-linear-gradient(135deg,rgba(255,255,255,.055) 0 2px,transparent 2px 10px)',
      }}>
        {/* E8: visibility:hidden not display:none during analysis */}
        <video
          ref={videoRef}
          src={videoUrl}
          style={{
            width: '100%', height: '100%', objectFit: 'contain',
            visibility: disabled ? 'hidden' : 'visible',
          }}
          muted
          playsInline
          onLoadedMetadata={handleLoadedMetadata}
          onSeeked={handleSeeked}
          onEnded={handleEnded}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            pointerEvents: 'none',
            visibility: disabled ? 'hidden' : 'visible',
          }}
        />

        {disabled && (
          <div style={{
            position: 'absolute', left: 16, top: 14,
            fontFamily: 'var(--font-mono)', fontSize: 10.5,
            letterSpacing: '.08em', color: 'rgba(255,255,255,.42)',
          }}>ANALYZING…</div>
        )}

        {!disabled && (
          <>
            <div style={{
              position: 'absolute', left: 16, top: 14,
              fontFamily: 'var(--font-mono)', fontSize: 10.5,
              letterSpacing: '.08em', color: 'rgba(255,255,255,.42)',
            }}>VIDEO FRAME · t = {currentTime.toFixed(2)}s</div>

            <div style={{
              position: 'absolute', right: 16, bottom: 14,
              display: 'flex', gap: 8,
            }}>
              <button onClick={handleSkeletonToggle} style={{
                padding: '7px 14px', borderRadius: 'var(--radius-pill)',
                fontSize: 11.5, color: '#fff',
                background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(8px)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,.3)',
              }}>
                Skeleton <span style={{ color: showSkeleton ? 'var(--accent)' : 'var(--text-muted)' }}>
                  {showSkeleton ? 'on' : 'off'}
                </span>
              </button>
              <div style={{ position: 'relative' }}>
                <select
                  value={pathLandmark ?? ''}
                  onChange={handlePathChange}
                  style={{
                    appearance: 'none', padding: '7px 28px 7px 14px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: 11.5, color: 'rgba(255,255,255,.75)',
                    background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(8px)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,.3)',
                    border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  <option value="">Path: none</option>
                  {LANDMARK_GROUPS.map(g => (
                    <optgroup key={g.label} label={g.label}>
                      {g.options.map(o => (
                        <option key={o.id} value={o.id}>{o.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <span style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 10, pointerEvents: 'none', color: 'rgba(255,255,255,.5)',
                }}>▾</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Controls bar */}
      {!disabled && (
        <div style={{
          borderRadius: 'var(--radius)', padding: '16px 18px 14px',
          background: 'var(--glass)', backdropFilter: 'blur(8px)',
          boxShadow: 'var(--glass-border-t), var(--glass-border-b)',
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Play/pause + step buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={handleToggle} style={{
                width: 40, height: 40, borderRadius: 'var(--radius-pill)',
                background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {playing ? (
                  <svg width="12" height="14" viewBox="0 0 12 14"><rect x="0" y="0" width="4" height="14" fill="#000"/><rect x="8" y="0" width="4" height="14" fill="#000"/></svg>
                ) : (
                  <div style={{
                    width: 0, height: 0,
                    borderLeft: '12px solid #000', borderTop: '8px solid transparent',
                    borderBottom: '8px solid transparent', marginLeft: 3,
                  }} />
                )}
              </button>
              <button onClick={stepBackward} style={{
                width: 34, height: 34, borderRadius: 'var(--radius-pill)',
                background: 'rgba(255,255,255,.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, color: 'rgba(255,255,255,.8)',
              }}>‹</button>
              <button onClick={stepForward} style={{
                width: 34, height: 34, borderRadius: 'var(--radius-pill)',
                background: 'rgba(255,255,255,.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, color: 'rgba(255,255,255,.8)',
              }}>›</button>
            </div>

            {/* Scrub bar */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
              <input
                type="range"
                min={0}
                max={duration}
                step={0.001}
                value={currentTime}
                onChange={handleScrub}
                style={{ width: '100%', accentColor: '#fff' }}
              />
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,.4)',
              }}>
                <span>0:00</span>
                <span>frame step = 1/{Math.round(sampleRate)} s</span>
                <span>{fmt(duration)}</span>
              </div>
            </div>

            {/* Time display */}
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,.7)' }}>
              {currentTime.toFixed(2)} / {duration.toFixed(2)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default VideoPlayer;
