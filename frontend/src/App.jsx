import { useEffect, useMemo, useRef, useState } from "react";
import { analyzeFrame, fetchWelcomeMessage, searchVideos } from "./api";

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
      <h1 style={layout.heading}>SwimStarter</h1>
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
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [waterLine, setWaterLine] = useState(50);
  const [strokeFilter, setStrokeFilter] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchWelcomeMessage()
      .then((data) => setWelcomeMessage(data.message))
      .catch((err) => setError(err.message));
  }, []);

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
    ctx.clearRect(0, 0, width, height);

    const y = (waterLine / 100) * height;
    ctx.strokeStyle = "#0ea5e9";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }, [waterLine, currentTime]);

  const maxTime = useMemo(() => (duration > 0 ? duration : 1), [duration]);

  const handleScrub = (event) => {
    const nextTime = Number(event.target.value);
    setCurrentTime(nextTime);
    if (videoRef.current) {
      videoRef.current.currentTime = nextTime;
    }
  };

  const handleAnalyze = async () => {
    const video = videoRef.current;
    if (!video) return;

    setError("");
    try {
      const frameCanvas = document.createElement("canvas");
      frameCanvas.width = video.videoWidth || 640;
      frameCanvas.height = video.videoHeight || 360;
      const frameContext = frameCanvas.getContext("2d");
      if (!frameContext) {
        throw new Error("Unable to capture video frame");
      }

      frameContext.drawImage(video, 0, 0, frameCanvas.width, frameCanvas.height);
      const blob = await new Promise((resolve, reject) => {
        frameCanvas.toBlob((fileBlob) => {
          if (fileBlob) resolve(fileBlob);
          else reject(new Error("Frame capture failed"));
        }, "image/jpeg");
      });

      const result = await analyzeFrame(blob, waterLine);
      setAnalysisResult(result);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSearch = async () => {
    setError("");
    try {
      const data = await searchVideos({ stroke: strokeFilter.trim() });
      setSearchResults(data.results || []);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={layout.card}>
      <h1 style={layout.heading}>SwimStarter Analysis Dashboard</h1>
      <p style={layout.muted}>{welcomeMessage || "Connecting to backend..."}</p>

      <div style={{ position: "relative", width: "100%", maxWidth: "820px", marginTop: "1rem" }}>
        <video
          ref={videoRef}
          controls
          onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
          onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime || 0)}
          style={{ width: "100%", borderRadius: "10px", display: "block", backgroundColor: "#111827" }}
        >
          <source src="" type="video/mp4" />
        </video>

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
