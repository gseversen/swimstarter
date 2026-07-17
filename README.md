# SwimStarter

SwimStarter is a **dive video analysis app** that runs entirely in the browser.
Load a side-angle dive video — MediaPipe analyzes it **once**, then you can replay
and scrub with a smooth skeleton overlay and live metrics (no lag on re-watch).

No backend, no video uploads, no server compute bills — powered by
[MediaPipe Pose Landmarker](https://developers.google.com/mediapipe/solutions/vision/pose_landmarker)
running client-side via WebAssembly.

## Quick Start

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`, click "Continue to Dashboard," load a dive video,
wait for analysis to finish, then press play.

## How It Works

1. **Load video** — local file picker; video stays on your device.
2. **One-time analysis** — MediaPipe walks the clip (~every 0.05s) and caches pose results.
3. **Replay from cache** — play/scrub only looks up cached frames and draws the overlay.
4. **Metrics panel** — torso angle, joint coords, and timestamp update as you watch.
5. **New video** — cache clears and analysis runs again.

## Project Structure

- `frontend/` — React + Vite single-page app
  - `src/analysis/analyzeFrame.js` — MediaPipe PoseLandmarker init + per-frame detection
  - `src/analysis/preprocessVideo.js` — one-time frame walk that builds the cache
  - `src/analysis/frameCache.js` — nearest-timestamp cache lookup
  - `src/analysis/drawOverlay.js` — canvas skeleton rendering
  - `src/utils/mathHelpers.js` — angle/midpoint math
  - `src/components/MetricsPanel.jsx` — metrics readout
  - `src/components/HipAngleDiagram.jsx` — schematic hip-angle triangle
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
