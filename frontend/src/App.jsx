import { useCallback, useEffect, useRef, useState } from "react";
import { APP_NAME, APP_TAGLINE } from "./config";
import { initPoseLandmarker, resetPoseLandmarker } from "./analysis/analyzeFrame";
import { drawOverlay } from "./analysis/drawOverlay";
import { preprocessVideo } from "./analysis/preprocessVideo";
import { clearCache, getCachedResultForTime } from "./analysis/frameCache";
import AdSlot from "./components/AdSlot";
import SupportLink from "./components/SupportLink";
import MetricsPanel from "./components/MetricsPanel";
import HipAngleChart from "./components/HipAngleChart";
import { isIOS } from "./utils/isIOS";
import { colors, radii, shadows, spacing, typography, maxWidth } from "./theme";

const styles = {
  page: {
    fontFamily: typography.fontFamily,
    color: colors.text,
    backgroundColor: colors.bg,
    minHeight: "100vh",
    padding: `${spacing.lg} ${spacing.md}`,
  },
  container: {
    maxWidth,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: `${spacing.md} ${spacing.lg}`,
    backgroundColor: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.lg,
    boxShadow: shadows.card,
    marginBottom: spacing.lg,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: spacing.md,
  },
  logo: {
    fontWeight: 700,
    fontSize: "1.1rem",
    color: colors.text,
    letterSpacing: "-0.01em",
  },
  heroSection: {
    textAlign: "center",
    marginBottom: spacing.xl,
    padding: `0 ${spacing.md}`,
  },
  badge: {
    display: "inline-block",
    ...typography.badge,
    color: colors.textMuted,
    border: `1px solid ${colors.border}`,
    borderRadius: "100px",
    padding: "0.3rem 0.85rem",
    marginBottom: spacing.md,
  },
  headline: {
    ...typography.headline,
    color: colors.text,
    margin: `0 0 ${spacing.sm}`,
  },
  subhead: {
    ...typography.subhead,
    color: colors.textMuted,
    margin: 0,
    maxWidth: "480px",
    marginLeft: "auto",
    marginRight: "auto",
  },
  workspace: {
    display: "grid",
    gridTemplateColumns: "1fr 300px",
    gap: spacing.lg,
    alignItems: "start",
  },
  workspaceMobile: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: spacing.lg,
  },
  primaryPanel: {
    backgroundColor: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.lg,
    boxShadow: shadows.card,
    padding: spacing.lg,
  },
  uploadRow: {
    display: "flex",
    alignItems: "center",
    gap: spacing.md,
    flexWrap: "wrap",
  },
  uploadLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: spacing.sm,
    padding: "0.55rem 1.1rem",
    backgroundColor: colors.buttonBg,
    color: colors.buttonText,
    borderRadius: radii.md,
    fontSize: "0.85rem",
    fontWeight: 600,
    cursor: "pointer",
    border: "none",
    transition: "opacity 0.15s",
  },
  uploadHint: {
    ...typography.small,
    color: colors.textMuted,
  },
  hiddenInput: {
    position: "absolute",
    width: "1px",
    height: "1px",
    opacity: 0,
    overflow: "hidden",
  },
  statusRow: {
    display: "flex",
    alignItems: "center",
    gap: spacing.md,
    flexWrap: "wrap",
    marginTop: spacing.md,
  },
  statusText: {
    ...typography.small,
    color: colors.textMuted,
    margin: 0,
  },
  progressWrap: {
    marginTop: spacing.md,
  },
  progressTrack: {
    height: "5px",
    backgroundColor: colors.progressTrack,
    borderRadius: "100px",
    overflow: "hidden",
    marginTop: spacing.sm,
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.progressFill,
    borderRadius: "100px",
    transition: "width 0.15s linear",
  },
  buttonPrimary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0.5rem 1rem",
    backgroundColor: colors.buttonBg,
    color: colors.buttonText,
    border: "none",
    borderRadius: radii.md,
    fontSize: "0.82rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "opacity 0.15s",
  },
  buttonSecondary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0.5rem 1rem",
    backgroundColor: colors.surface,
    color: colors.text,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.md,
    fontSize: "0.82rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "opacity 0.15s",
  },
  videoContainer: {
    position: "relative",
    lineHeight: 0,
    marginTop: spacing.lg,
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: colors.videoBg,
  },
  video: {
    width: "100%",
    height: "auto",
    display: "block",
  },
  canvas: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
  },
  chartSection: {
    marginTop: spacing.lg,
  },
  error: {
    color: colors.error,
    ...typography.small,
    marginTop: spacing.md,
    padding: `${spacing.sm} ${spacing.md}`,
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: radii.sm,
  },
  footer: {
    marginTop: spacing.xl,
    textAlign: "center",
  },
};

function showCachedFrame(video, canvas, cache, time, setAnalysis) {
  const result = getCachedResultForTime(time, cache);
  if (!result) return;

  setAnalysis(result);

  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) return;

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (ctx) drawOverlay(ctx, width, height, result);
}

function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);
  return matches;
}

function AnalysisView() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const rafIdRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);
  const analysisCacheRef = useRef([]);
  const isReadyRef = useRef(false);
  const isPreprocessingRef = useRef(false);
  const preprocessIdRef = useRef(0);
  const preprocessForUrlRef = useRef("");

  const [videoUrl, setVideoUrl] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [analysisCache, setAnalysisCache] = useState([]);
  const [modelLoading, setModelLoading] = useState(true);
  const [isPreprocessing, setIsPreprocessing] = useState(false);
  const [preprocessProgress, setPreprocessProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");
  const [preprocessStatus, setPreprocessStatus] = useState("");

  const isDesktop = useMediaQuery("(min-width: 860px)");

  useEffect(() => {
    setModelLoading(true);
    initPoseLandmarker()
      .then(() => setModelLoading(false))
      .catch((err) => {
        setError(`Failed to load pose model: ${err.message}`);
        setModelLoading(false);
      });
  }, []);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  useEffect(() => {
    analysisCacheRef.current = analysisCache;
  }, [analysisCache]);

  useEffect(() => {
    isReadyRef.current = isReady;
  }, [isReady]);

  useEffect(() => {
    isPreprocessingRef.current = isPreprocessing;
  }, [isPreprocessing]);

  const runFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      rafIdRef.current = requestAnimationFrame(runFrame);
      return;
    }

    if (
      isReadyRef.current &&
      video.currentTime !== lastVideoTimeRef.current &&
      video.readyState >= 2
    ) {
      lastVideoTimeRef.current = video.currentTime;
      showCachedFrame(
        video,
        canvas,
        analysisCacheRef.current,
        video.currentTime,
        setAnalysis,
      );
    }

    rafIdRef.current = requestAnimationFrame(runFrame);
  }, []);

  useEffect(() => {
    if (playing && isReady) {
      rafIdRef.current = requestAnimationFrame(runFrame);
    }
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [playing, isReady, runFrame]);

  const startPreprocess = useCallback(async (url) => {
    const video = videoRef.current;
    if (!video || !url || !video.duration) return;
    if (preprocessForUrlRef.current === url) return;

    preprocessForUrlRef.current = url;
    const jobId = ++preprocessIdRef.current;
    isPreprocessingRef.current = true;
    setIsPreprocessing(true);
    setPreprocessProgress(0);
    setIsReady(false);
    setError("");
    setAnalysis(null);
    setAnalysisCache(clearCache());
    setPreprocessStatus("");

    try {
      const cache = await preprocessVideo(
        video,
        (p) => {
          if (jobId === preprocessIdRef.current) setPreprocessProgress(p);
        },
        () => jobId !== preprocessIdRef.current,
        {
          preferSeek: isIOS(),
          onStatus: (msg) => {
            if (jobId === preprocessIdRef.current) setPreprocessStatus(msg);
          },
        },
      );

      if (jobId !== preprocessIdRef.current) return;

      setAnalysisCache(cache);
      setIsReady(true);
      lastVideoTimeRef.current = -1;

      if (cache.length === 0) {
        setError("No pose detected in this video. Try a clearer side-angle clip.");
      }
    } catch (err) {
      if (jobId !== preprocessIdRef.current) return;
      preprocessForUrlRef.current = "";
      setError(`Analysis failed: ${err.message}`);
      setAnalysisCache(clearCache());
      setIsReady(false);
    } finally {
      if (jobId === preprocessIdRef.current) {
        isPreprocessingRef.current = false;
        setIsPreprocessing(false);
      }
    }
  }, []);

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    preprocessIdRef.current += 1;
    preprocessForUrlRef.current = "";
    isPreprocessingRef.current = false;
    setAnalysis(null);
    setAnalysisCache(clearCache());
    setIsReady(false);
    setIsPreprocessing(false);
    setPreprocessProgress(0);
    setPlaying(false);
    setError("");
    lastVideoTimeRef.current = -1;

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    setVideoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const handleLoadedMetadata = () => {
    if (isIOS()) return;
    if (!modelLoading && videoUrl) {
      startPreprocess(videoUrl);
    }
  };

  useEffect(() => {
    if (isIOS()) return;
    if (!modelLoading && videoUrl && videoRef.current?.duration) {
      startPreprocess(videoUrl);
    }
  }, [modelLoading, videoUrl, startPreprocess]);

  const handleAnalyze = () => {
    const video = videoRef.current;
    if (!video || !videoUrl || !video.duration || modelLoading || isPreprocessing) return;
    startPreprocess(videoUrl);
  };

  const handleReanalyze = async () => {
    if (!videoUrl || isPreprocessing || modelLoading) return;

    preprocessIdRef.current += 1;
    preprocessForUrlRef.current = "";
    setPlaying(false);
    setError("");

    try {
      await resetPoseLandmarker();
      startPreprocess(videoUrl);
    } catch (err) {
      setError(`Failed to reset pose model: ${err.message}`);
    }
  };

  const handlePlay = () => {
    if (isPreprocessingRef.current) return;
    if (!isReady) {
      videoRef.current?.pause();
      return;
    }
    setPlaying(true);
  };

  const handlePause = () => setPlaying(false);

  const handleSeeked = () => {
    if (isPreprocessingRef.current || playing) return;
    if (!isReadyRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    lastVideoTimeRef.current = video.currentTime;
    showCachedFrame(video, canvas, analysisCacheRef.current, video.currentTime, setAnalysis);
  };

  const pct = Math.round(preprocessProgress * 100);

  const workspaceGrid = isDesktop ? styles.workspace : styles.workspaceMobile;

  return (
    <>
      {/* Hero */}
      <div style={styles.heroSection}>
        <span style={styles.badge}>SwimStarter · Beta</span>
        <h1 style={styles.headline}>{APP_NAME}</h1>
        <p style={styles.subhead}>{APP_TAGLINE}</p>
      </div>

      {/* Workspace */}
      <div style={workspaceGrid}>
        {/* Primary — video + controls */}
        <div style={styles.primaryPanel}>
          {/* Upload */}
          <div style={styles.uploadRow}>
            <label style={{ ...styles.uploadLabel, opacity: isPreprocessing ? 0.5 : 1 }}>
              Upload video
              <input
                type="file"
                accept="video/*"
                onChange={handleFile}
                disabled={isPreprocessing}
                style={styles.hiddenInput}
              />
            </label>
            <span style={styles.uploadHint}>Side-angle dive clip</span>
          </div>

          {/* iOS tap-to-start */}
          {isIOS() && videoUrl && !isReady && !isPreprocessing && !modelLoading ? (
            <div style={styles.statusRow}>
              <p style={styles.statusText}>Video loaded — tap Analyze to start.</p>
              <button type="button" style={styles.buttonPrimary} onClick={handleAnalyze}>
                Analyze Video
              </button>
            </div>
          ) : null}

          {/* Preprocessing progress */}
          {isPreprocessing ? (
            <div style={styles.progressWrap}>
              <p style={styles.statusText}>
                Analyzing frame-by-frame… {pct}%{preprocessStatus ? ` — ${preprocessStatus}` : ""}
              </p>
              <div style={styles.progressTrack}>
                <div style={{ ...styles.progressFill, width: `${pct}%` }} />
              </div>
            </div>
          ) : null}

          {/* Ready state */}
          {isReady && !isPreprocessing ? (
            <div style={styles.statusRow}>
              <p style={styles.statusText}>
                Ready — press play to review. Cached analysis means no lag.
              </p>
              <button
                type="button"
                style={styles.buttonSecondary}
                onClick={handleReanalyze}
                disabled={!videoUrl || modelLoading}
              >
                Re-analyze
              </button>
            </div>
          ) : null}

          {/* Video + overlay */}
          <div style={{ ...styles.videoContainer, opacity: isPreprocessing ? 0.6 : 1 }}>
            <video
              ref={videoRef}
              controls={!isPreprocessing}
              playsInline
              src={videoUrl || undefined}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={handlePlay}
              onPause={handlePause}
              onEnded={handlePause}
              onSeeked={handleSeeked}
              style={styles.video}
            />
            <canvas ref={canvasRef} style={styles.canvas} />
          </div>

          {/* Error */}
          {error ? <p style={styles.error}>{error}</p> : null}
        </div>

        {/* Secondary — Metrics */}
        <div>
          <MetricsPanel
            analysis={analysis}
            loading={modelLoading}
            preprocessing={isPreprocessing}
            ready={isReady}
          />
        </div>
      </div>

      {/* Chart — full width below workspace */}
      {isReady && !isPreprocessing && analysisCache.length > 1 ? (
        <div style={styles.chartSection}>
          <HipAngleChart analysisCache={analysisCache} currentTime={analysis?.timestamp ?? null} />
        </div>
      ) : null}

      {/* Footer */}
      <div style={styles.footer}>
        <AdSlot />
      </div>
    </>
  );
}

export default function App() {
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <span style={styles.logo}>{APP_NAME}</span>
          </div>
          <SupportLink />
        </header>

        <AnalysisView />
      </div>
    </div>
  );
}
