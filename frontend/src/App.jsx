import { useCallback, useEffect, useRef, useState } from "react";
import { APP_NAME, APP_TAGLINE } from "./config";
import { analyzeFrame, initPoseLandmarker, getPoseLandmarker } from "./analysis/analyzeFrame";
import { drawOverlay } from "./analysis/drawOverlay";
import { searchVideos } from "./data/mockVideos";
import AdSlot from "./components/AdSlot";
import SupportLink from "./components/SupportLink";
import MetricsPanel from "./components/MetricsPanel";
import "./analysis/frameCache";

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

function AnalysisView() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const rafIdRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);
  const lastTimestampRef = useRef(0);

  const [videoUrl, setVideoUrl] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [modelLoading, setModelLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [strokeFilter, setStrokeFilter] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState("");

  // Initialize MediaPipe on mount
  useEffect(() => {
    setModelLoading(true);
    initPoseLandmarker()
      .then(() => setModelLoading(false))
      .catch((err) => {
        setError(`Failed to load pose model: ${err.message}`);
        setModelLoading(false);
      });
  }, []);

  // Revoke URL on cleanup
  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  const runFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !getPoseLandmarker()) {
      rafIdRef.current = requestAnimationFrame(runFrame);
      return;
    }

    // Only analyze when the video frame has actually advanced
    if (video.currentTime !== lastVideoTimeRef.current && video.readyState >= 2) {
      lastVideoTimeRef.current = video.currentTime;

      // Ensure strictly increasing timestamp for MediaPipe
      const now = performance.now();
      const ts = now > lastTimestampRef.current ? now : lastTimestampRef.current + 1;
      lastTimestampRef.current = ts;

      const result = analyzeFrame(video, ts);
      if (result) {
        setAnalysis(result);

        const width = video.videoWidth;
        const height = video.videoHeight;
        if (width && height) {
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) drawOverlay(ctx, width, height, result);
        }
      }
    }

    rafIdRef.current = requestAnimationFrame(runFrame);
  }, []);

  // Start/stop the analysis loop based on play state
  useEffect(() => {
    if (playing && !modelLoading) {
      rafIdRef.current = requestAnimationFrame(runFrame);
    }
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [playing, modelLoading, runFrame]);

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAnalysis(null);
    lastVideoTimeRef.current = -1;
    lastTimestampRef.current = 0;
    setVideoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const handlePlay = () => setPlaying(true);
  const handlePause = () => setPlaying(false);

  // Analyze single frame when user scrubs while paused
  const handleSeeked = () => {
    if (playing) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !getPoseLandmarker()) return;
    if (video.readyState < 2) return;

    const now = performance.now();
    const ts = now > lastTimestampRef.current ? now : lastTimestampRef.current + 1;
    lastTimestampRef.current = ts;
    lastVideoTimeRef.current = video.currentTime;

    const result = analyzeFrame(video, ts);
    if (result) {
      setAnalysis(result);
      const width = video.videoWidth;
      const height = video.videoHeight;
      if (width && height) {
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) drawOverlay(ctx, width, height, result);
      }
    }
  };

  const handleSearch = () => {
    setError("");
    setSearchResults(searchVideos({ stroke: strokeFilter.trim() }));
  };

  return (
    <div style={layout.card}>
      <div style={{ ...layout.row, justifyContent: "space-between" }}>
        <h1 style={layout.heading}>{APP_NAME}</h1>
        <SupportLink />
      </div>
      <p style={layout.muted}>{APP_TAGLINE}</p>

      <label style={{ ...layout.field, marginTop: "1rem" }}>
        <span>Load Dive Video (side angle)</span>
        <input type="file" accept="video/*" onChange={handleFile} />
      </label>

      <div style={layout.columns}>
        {/* Left: video + overlay */}
        <div style={{ flex: "1 1 600px", position: "relative", lineHeight: 0 }}>
          <video
            ref={videoRef}
            controls
            src={videoUrl || undefined}
            onPlay={handlePlay}
            onPause={handlePause}
            onEnded={handlePause}
            onSeeked={handleSeeked}
            style={{ width: "100%", height: "auto", borderRadius: "10px", display: "block", backgroundColor: "#111827" }}
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

        {/* Right: metrics */}
        <div style={{ flex: "0 0 260px" }}>
          <MetricsPanel analysis={analysis} loading={modelLoading} />
        </div>
      </div>

      {error ? (
        <p style={{ color: "#b91c1c", marginTop: "1rem" }}>{error}</p>
      ) : null}

      <div style={{ marginTop: "1.25rem" }}>
        <label style={layout.field}>
          <span>Stroke Filter</span>
          <input
            type="text"
            value={strokeFilter}
            onChange={(event) => setStrokeFilter(event.target.value)}
            placeholder="freestyle, butterfly, backstroke..."
            style={layout.input}
          />
        </label>
        <button type="button" style={layout.button} onClick={handleSearch}>
          Search Videos
        </button>
      </div>

      {searchResults.length > 0 ? (
        <ul style={{ marginTop: "1rem" }}>
          {searchResults.map((video) => (
            <li key={video.id}>
              {video.title} ({video.genre}, {video.stroke})
            </li>
          ))}
        </ul>
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
