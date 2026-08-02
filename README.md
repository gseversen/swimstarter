# SwimStarter

SwimStarter is a **browser-only dive video analysis app** — no backend, no accounts,
no video uploads. Load a side-angle dive video, MediaPipe analyzes it **once**,
then replay and scrub with a smooth skeleton overlay and live metrics (no lag).

Powered by [MediaPipe Pose Landmarker](https://developers.google.com/mediapipe/solutions/vision/pose_landmarker)
running client-side via WebAssembly.

## Quick Start

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`, load a dive video, wait for analysis to finish,
then press play.

## How It Works

1. **Load video** — local file picker; video stays on your device.
2. **One-time analysis** — MediaPipe walks the clip and caches pose results.
   - Desktop: auto-starts on metadata load.
   - iOS: tap **Analyze Video** (required by iOS autoplay policy).
3. **Replay from cache** — play/scrub only looks up cached frames and draws the overlay.
4. **Metrics panel** — hip angle, schematic diagram, and timestamp update as you watch.
5. **New video** — cache clears and analysis runs again.

## Project Structure

- `frontend/` — React + Vite single-page app
  - `src/analysis/analyzeFrame.js` — MediaPipe PoseLandmarker init + per-frame detection
  - `src/analysis/preprocessVideo.js` — one-time frame walk that builds the cache
  - `src/analysis/frameCache.js` — nearest-timestamp cache lookup
  - `src/analysis/drawOverlay.js` — canvas skeleton rendering
  - `src/utils/mathHelpers.js` — angle/midpoint math
  - `src/utils/isIOS.js` — iOS detection for mobile-specific analysis flow
  - `src/components/MetricsPanel.jsx` — metrics readout
  - `src/components/HipAngleDiagram.jsx` — schematic hip-angle triangle
  - `src/components/SupportLink.jsx` — donation link (shown when `DONATION_URL` is set)
  - `src/components/AdSlot.jsx` — ad placeholder (shown when `ADS_ENABLED` is true)
  - `src/config.js` — app metadata + monetization toggles

## Monetization

Both toggles live in `frontend/src/config.js`:

- **`DONATION_URL`** — set to a Buy Me a Coffee / Ko-fi URL to show a support link.
- **`ADS_ENABLED`** — flip to `true` and wire an ad network into `AdSlot.jsx`.

## Deploy to Vercel

1. Import repo → set **Root Directory** to `frontend`.
2. Build: `npm run build` — Output: `dist`.
3. No env vars needed.

## Tests

```bash
cd frontend && node src/utils/mathHelpers.test.mjs
```
