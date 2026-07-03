import { useEffect, useMemo, useRef, useState } from "react";
import { APP_NAME, APP_TAGLINE } from "./config";
import { analyzeFrame } from "./analysis/analyzeFrame";
import { drawOverlay } from "./analysis/drawOverlay";
import { searchVideos } from "./data/mockVideos";
import AdSlot from "./components/AdSlot";
import SupportLink from "./components/SupportLink";

const layout = {
  app: {
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
    color: "#0f172a",
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
    padding: "2rem",
  },
  card: {
    maxWidth: "980px",
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
};

function LoginView({ onLogin }) {
  return (
    <div style={layout.card}>
      <h1 style={layout.heading}>{APP_NAME}</h1>
      <p style={layout.muted}>
        Login placeholder view. Connect Supabase auth next to enable athlete and coach sessions.
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
  const [videoUrl, setVideoUrl] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [waterLine, setWaterLine] = useState(50);
  const [strokeFilter, setStrokeFilter] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const width = video.videoWidth || video.clientWidth || 640;
    const height = video.videoHeight || video.clientHeight || 360;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawOverlay(ctx, width, height, waterLine, analysisResult);
  }, [waterLine, currentTime, analysisResult]);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  const maxTime = useMemo(() => (duration > 0 ? duration : 1), [duration]);

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAnalysisResult(null);
    setVideoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const handleScrub = (event) => {
    const nextTime = Number(event.target.value);
    setCurrentTime(nextTime);
    if (videoRef.current) {
      videoRef.current.currentTime = nextTime;
    }
  };

  const handleAnalyze = () => {
    const video = videoRef.current;
    if (!video) return;

    setError("");
    try {
      // ponytail: passes the live video element; real pose detection will read pixels from it.
      setAnalysisResult(analyzeFrame(video, waterLine));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSearch = () => {
    setError("");
    setSearchResults(searchVideos({ stroke: strokeFilter.trim() }));
  };

  return (
    <div style={layout.card}>
      <div style={{ ...layout.row, justifyContent: "space-between" }}>
        <h1 style={layout.heading}>{APP_NAME} Analysis Dashboard</h1>
        <SupportLink />
      </div>
      <p style={layout.muted}>{APP_TAGLINE}</p>

      <label style={{ ...layout.field, marginTop: "1rem" }}>
        <span>Load Video</span>
        <input type="file" accept="video/*" onChange={handleFile} />
      </label>

      <div style={{ position: "relative", width: "100%", maxWidth: "820px", marginTop: "1rem" }}>
        <video
          ref={videoRef}
          controls
          src={videoUrl || undefined}
          onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
          onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime || 0)}
          style={{ width: "100%", borderRadius: "10px", display: "block", backgroundColor: "#111827" }}
        />

        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        />

        <input
          type="range"
          min="0"
          max="100"
          value={waterLine}
          onChange={(event) => setWaterLine(Number(event.target.value))}
          aria-label="Water line position"
          style={{
            position: "absolute",
            right: "-58px",
            top: "50%",
            transform: "translateY(-50%) rotate(-90deg)",
            width: "220px",
          }}
        />
      </div>

      <div style={{ marginTop: "1rem" }}>
        <label style={{ ...layout.field, marginBottom: "0.5rem" }}>
          <span>Video Scrubber</span>
          <input
            type="range"
            min="0"
            max={maxTime}
            step="0.01"
            value={Math.min(currentTime, maxTime)}
            onChange={handleScrub}
          />
        </label>
        <p style={layout.muted}>
          Timestamp: {currentTime.toFixed(2)}s / {duration.toFixed(2)}s | Water line: {waterLine}%
        </p>
      </div>

      <div style={layout.row}>
        <button type="button" style={layout.button} onClick={handleAnalyze}>
          Analyze Current Frame
        </button>
      </div>

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

      {error ? (
        <p style={{ color: "#b91c1c", marginTop: "1rem" }}>{error}</p>
      ) : null}

      {analysisResult ? (
        <pre
          style={{
            marginTop: "1rem",
            padding: "0.75rem",
            backgroundColor: "#f1f5f9",
            borderRadius: "8px",
            overflowX: "auto",
          }}
        >
          {JSON.stringify(analysisResult, null, 2)}
        </pre>
      ) : null}

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
