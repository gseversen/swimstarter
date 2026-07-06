# SwimStarter

SwimStarter is a **live dive video analysis app** that runs entirely in the browser.
Load a side-angle video of a dive, press play, and watch real-time pose detection
with a skeleton overlay and live metrics (torso angle, joint coordinates) updating
frame-by-frame as the video plays.

No backend, no video uploads, no server compute bills — powered by
[MediaPipe Pose Landmarker](https://developers.google.com/mediapipe/solutions/vision/pose_landmarker)
running client-side via WebAssembly.

## Quick Start

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`, click "Continue to Dashboard," load a dive video, and press play.

## How It Works

1. **Load video** — local file picker; video stays on your device.
2. **Press play** — a `requestAnimationFrame` loop sends each frame to MediaPipe Pose Landmarker.
3. **Skeleton overlay** — all 33 pose landmarks + connections drawn on a `<canvas>` over the video.
4. **Live metrics panel** — torso angle, shoulder/hip midpoints, and key joint coords update every frame.
5. **Pause** — overlay and metrics freeze on the last analyzed frame.

## Project Structure

- `frontend/` — React + Vite single-page app
  - `src/analysis/analyzeFrame.js` — MediaPipe PoseLandmarker init + per-frame detection
  - `src/analysis/drawOverlay.js` — canvas skeleton rendering
  - `src/utils/mathHelpers.js` — angle/midpoint math
  - `src/components/MetricsPanel.jsx` — live metrics readout
  - `src/data/mockVideos.js` — mock video search
  - `src/components/` — SupportLink, AdSlot
  - `src/lib/supabaseClient.js` — Supabase stub (auth, later)
  - `src/config.js` — app metadata + monetization toggles

## Deploy to Vercel

1. Import repo → set **Root Directory** to `frontend`.
2. Build: `npm run build` — Output: `dist`.
3. No env vars needed for the core analysis.

## Tests

```bash
cd frontend && node src/utils/mathHelpers.test.mjs
```

## TODO

- [ ] Supabase auth (`src/lib/supabaseClient.js`)
- [ ] Donation URL (`DONATION_URL` in `src/config.js`)
- [ ] Ad network integration (`ADS_ENABLED`)
- [ ] Additional dive-specific metrics (entry angle, knee tuck, splash timing)
- [ ] Vercel deploy
