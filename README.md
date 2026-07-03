# SwimStarter

SwimStarter is a competitive swimming video analysis app that runs **entirely in the
browser**. Users load a local video, scrub to a frame, set a water line, and get a
skeletal/angle overlay — no backend, no video uploads, no server compute bills.

This makes it a great fit for **free static hosting** (e.g. Vercel).

## Project Structure

- `frontend/` — React + Vite single-page app (the whole product)
  - `src/analysis/` — client-side frame analysis + canvas overlay
  - `src/utils/` — math helpers (angles, midpoints)
  - `src/data/` — mock video search data
  - `src/components/` — support link, ad slot
  - `src/lib/` — Supabase client stub (auth, later)
  - `src/config.js` — app metadata + monetization toggles

## Quick Start

No backend required.

```bash
cd frontend
npm install
npm run dev
```

Then open the printed local URL (default `http://localhost:5173`).

## Deploy to Vercel

1. Import the repo in Vercel.
2. Set **Root Directory** to `frontend`.
3. Build command: `npm run build` — Output directory: `dist`.
4. No environment variables needed for the client-side analysis MVP.

## Tests

A tiny self-check for the math helpers:

```bash
cd frontend && node src/utils/mathHelpers.test.mjs
```

## Scaffolded vs. TODO

Working today (mocked where noted):
- Local video loading, scrubbing, water-line control
- Canvas overlay (water line + mock skeleton)
- Frame analysis returning mock landmarks + torso angle
- Mock video search

Left to implement:
- [ ] Real MediaPipe pose detection (`@mediapipe/tasks-vision` in `src/analysis/analyzeFrame.js`)
- [ ] Supabase auth (`src/lib/supabaseClient.js`, `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`)
- [ ] Donation URL (`DONATION_URL` in `src/config.js`)
- [ ] Ad network integration (`ADS_ENABLED` + `src/components/AdSlot.jsx`)
- [ ] Vercel deploy
