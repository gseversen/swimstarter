---
alwaysApply: true
globs:
  - "frontend/src/**/*.js"
  - "frontend/src/**/*.jsx"
---
# SwimStarter — project rules

## What this app is
- **Client-only** dive video analyzer: React + Vite, no backend, no server compute, no auth.
- Videos stay on the user's device. Analysis runs in-browser via MediaPipe Pose Landmarker (WebAssembly).

## Stack
- **UI**: React 18, inline styles, functional components
- **Build**: Vite (`frontend/`)
- **Analysis**: `frontend/src/analysis/` — `analyzeFrame.js`, `preprocessVideo.js`, `frameCache.js`, `drawOverlay.js`
- **Math/utils**: `frontend/src/utils/mathHelpers.js`
- **Monetization (extensible, config-driven)**:
  - `frontend/src/config.js` — `DONATION_URL`, `ADS_ENABLED`
  - `frontend/src/components/SupportLink.jsx` — shown when `DONATION_URL` is set
  - `frontend/src/components/AdSlot.jsx` — shown when `ADS_ENABLED` is true

## Constraints
- **Never** add a backend, Supabase, auth, or cloud video storage unless explicitly requested.
- Prefer extending via `config.js` and small components over new infrastructure.
- During `requestAnimationFrame` playback loops, avoid unnecessary React state updates/re-renders.
- Keep changes focused; match existing naming and file layout.

## Key flows
1. User picks local video file
2. Desktop: auto-preprocess on metadata; iOS: explicit "Analyze" tap
3. Cache pose results; playback/scrub reads cache only (no re-inference)
4. Metrics panel updates from cached frame at current time
