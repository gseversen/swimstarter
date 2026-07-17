import { useCallback, useEffect, useRef, useState } from "react";
import { APP_NAME, APP_TAGLINE } from "./config";
import { initPoseLandmarker, resetPoseLandmarker } from "./analysis/analyzeFrame";
import { drawOverlay } from "./analysis/drawOverlay";
import { preprocessVideo } from "./analysis/preprocessVideo";
import { clearCache, getCachedResultForTime } from "./analysis/frameCache";
import AdSlot from "./components/AdSlot";
import SupportLink from "./components/SupportLink";
import MetricsPanel from "./components/MetricsPanel";

const layout = {
  app: {
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
    color: "#0f172a",
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
    padding: "2rem",
  },
  card: {
    maxWidth: "1200px",
    margin: "0 auto",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
    padding: "1.5rem",
  },
  heading: { marginTop: 0, marginBottom: "0.5rem" },
  muted: { color: "#475569" },
  button: {
    border: "1px solid #0f172a",
    borderRadius: "8px",
    backgroundColor: "#0f172a",
    color: "#ffffff",
    padding: "0.6rem 1rem",
    cursor: "pointer",
    fontWeight: 600,
  },
  field: {
    display: "grid",
    gap: "0.35rem",
    marginBottom: "1rem",
  },
  input: {
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "0.55rem 0.7rem",
    fontSize: "0.95rem",
  },
  row: { display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" },
  columns: {
    display: "flex",
    gap: "1.5rem",
    marginTop: "1rem",
    flexWrap: "wrap",
    alignItems: "flex-start",
  },
};

const IS_IOS =
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

function LoginView({ onLogin }) {
  return (
    <div style={layout.card}>
      <h1 style={layout.heading}>{APP_NAME}</h1>
      <p style={layout.muted}>
        Login placeholder. Connect Supabase auth to enable athlete and coach sessions.
      </p>
      <button type="button" style={layout.button} onClick={onLogin}>
        Continue to Dashboard
      </button>
    </div>
  );
}

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

    try {
      const cache = await preprocessVideo(
        video,
        (p) => {
          if (jobId === preprocessIdRef.current) setPreprocessProgress(p);
        },
        () => jobId !== preprocessIdRef.current,
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
    if (IS_IOS) return;
    if (!modelLoading && videoUrl) {
      startPreprocess(videoUrl);
    }
  };

  // Model finished after video already had metadata (desktop auto-start only)
  useEffect(() => {
    if (IS_IOS) return;
    if (!modelLoading && videoUrl && videoRef.current?.duration) {
      startPreprocess(videoUrl);
    }
  }, [modelLoading, videoUrl, startPreprocess]);

  const handleAnalyze = () => {
    const video = videoRef.current;
    if (!video || !videoUrl || !video.duration || modelLoading || isPreprocessing) return;

    // Prime playback inside the user gesture (helps iOS allow play() during preprocess).
    video.muted = true;
    video.play().catch(() => {});

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
    // Ignore seeks from preprocessing
    if (isPreprocessingRef.current || playing) return;
    if (!isReadyRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    lastVideoTimeRef.current = video.currentTime;
    showCachedFrame(video, canvas, analysisCacheRef.current, video.currentTime, setAnalysis);
  };

  const pct = Math.round(preprocessProgress * 100);

  return (
    <div style={layout.card}>
      <div style={{ ...layout.row, justifyContent: "space-between" }}>
        <h1 style={layout.heading}>{APP_NAME}</h1>
        <SupportLink />
      </div>
      <p style={layout.muted}>{APP_TAGLINE}</p>

      <label style={{ ...layout.field, marginTop: "1rem" }}>
        <span>Load Dive Video (side angle)</span>
        <input type="file" accept="video/*" onChange={handleFile} disabled={isPreprocessing} />
      </label>

      {IS_IOS && videoUrl && !isReady && !isPreprocessing && !modelLoading ? (
        <div style={{ ...layout.row, marginTop: "0.75rem" }}>
          <p style={layout.muted}>Video loaded — tap Analyze to start.</p>
          <button type="button" style={layout.button} onClick={handleAnalyze}>
            Analyze Video
          </button>
        </div>
      ) : null}

      {isPreprocessing ? (
        <div style={{ marginTop: "0.75rem" }}>
          <p style={layout.muted}>
            Analyzing frame-by-frame... {pct}% (takes about as long as the clip)
          </p>
          <div
            style={{
              height: "8px",
              backgroundColor: "#e2e8f0",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${pct}%`,
                backgroundColor: "#0f172a",
                transition: "width 0.15s linear",
              }}
            />
          </div>
        </div>
      ) : null}

      {isReady && !isPreprocessing ? (
        <div style={{ ...layout.row, marginTop: "0.75rem" }}>
          <p style={layout.muted}>
            Ready — press play to review. Replay and scrub use cached analysis (no lag).
          </p>
          <button
            type="button"
            style={layout.button}
            onClick={handleReanalyze}
            disabled={!videoUrl || modelLoading}
          >
            Re-analyze
          </button>
        </div>
      ) : null}

      <div style={layout.columns}>
        <div style={{ flex: "1 1 600px", position: "relative", lineHeight: 0 }}>
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
            style={{
              width: "100%",
              height: "auto",
              borderRadius: "10px",
              display: "block",
              backgroundColor: "#111827",
              opacity: isPreprocessing ? 0.6 : 1,
            }}
          />
          <canvas
            ref={canvasRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              borderRadius: "10px",
            }}
          />
        </div>

        <div style={{ flex: "0 0 260px" }}>
          <MetricsPanel
            analysis={analysis}
            loading={modelLoading}
            preprocessing={isPreprocessing}
            ready={isReady}
          />
        </div>
      </div>

      {error ? (
        <p style={{ color: "#b91c1c", marginTop: "1rem" }}>{error}</p>
      ) : null}

      <AdSlot />
    </div>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (!isLoggedIn) {
    return (
      <div style={layout.app}>
        <LoginView onLogin={() => setIsLoggedIn(true)} />
      </div>
    );
  }

  return (
    <div style={layout.app}>
      <AnalysisView />
    </div>
  );
}
