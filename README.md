# SwimStarter

SwimStarter analyzes a swim-start (dive) video clip entirely in the browser.
Drop in an MP4/MOV, and it runs pose detection frame-by-frame to track body
position and hip angle through the start, with a scrubbable video player, a
skeleton overlay, and a hip-angle chart synced to playback. Nothing leaves
the device — there is no backend; all analysis runs client-side on top of
[MediaPipe Tasks Vision](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker).

## How it works

1. A clip is loaded into an `<video>` element (drag-and-drop or file picker).
2. A MediaPipe `PoseLandmarker` model is loaded in the browser (WASM, with a
   GPU delegate and automatic fallback to CPU if GPU init fails).
3. Once both the clip and the model are ready, the engine seeks through the
   video at a fixed sample rate (30Hz on desktop, 15Hz on detected mobile
   devices), running pose detection on each frame.
4. For each sampled frame it extracts 17 joints, computes the hip angle
   (shoulder–hip–knee) from the midpoints of the shoulders/hips/knees, and
   records per-landmark visibility as a confidence score.
5. Results are cached in memory (`FrameCache`) with binary-search lookup and
   linear interpolation between samples, so the video player and chart can
   query pose data at any point in time, not just at sampled timestamps.
6. Playback renders a skeleton overlay on a canvas and a hip-angle-over-time
   chart, both driven by the same interpolated frame lookup.

## Project structure

This is an npm workspaces monorepo with two packages:

```
apps/web/              React + Vite UI
  src/
    App.tsx             top-level state wiring
    machine/             explicit state machine (idle → modelLoading →
                          fileSelected → analyzing → ready/error)
    hooks/useAppMachine.ts  wires the state machine to the engine
    components/          EmptyScreen, ProgressScreen, ErrorScreen,
                          VideoPlayer, MetricsPanel, HipAngleChart, Navbar
    utils/device.ts      mobile device detection

packages/engine/        Framework-agnostic pose analysis engine
  src/
    poseModel.ts         MediaPipe model loading, GPU→CPU fallback
    sampler.ts            analyze(): seek-based frame sampling loop
    analyzeFrame.ts        per-frame pose detection + hip-angle metric
    cache.ts               FrameCache: binary search + interpolation
    serialize.ts            compact JSON serialize/deserialize of results
    metrics/hipAngle.ts     angle/midpoint math
    overlay/                skeleton + path-series rendering helpers
    types.ts                shared types (FrameResult, AnalysisResult, ...)
  test/                  node --test unit tests
```

`apps/web` depends on `@swimstarter/engine` as a workspace package (no
build step between them — the web app imports the engine's TypeScript
source directly via Vite).

## Getting started

Requires Node.js and npm (npm workspaces).

```bash
npm install
npm run dev
```

This starts the Vite dev server for `apps/web` on port 5174
(`http://localhost:5174`). Alternatively, run `./dev.sh` or use the
`swimstarter-dev` launch configuration in `.claude/launch.json`.

### Build

```bash
npm run build
```

Type-checks and builds `apps/web` for production (`apps/web/dist`).

### Test

```bash
npm test
```

Runs the engine package's unit tests (`node --test`, via `tsx`) — covers
`FrameCache` lookup/interpolation, the hip-angle/midpoint math, and
serialize/deserialize round-tripping.

## Tech stack

- **UI**: React 18, Vite 5, TypeScript (strict mode)
- **Pose detection**: `@mediapipe/tasks-vision` (`PoseLandmarker`, WASM +
  WebGL2 GPU delegate with CPU fallback), model and runtime fetched from
  Google Cloud Storage / jsDelivr at runtime — no bundled model weights
- **Engine package**: plain TypeScript, no framework dependency, so the
  analysis pipeline can be reused outside React
- **Testing**: Node's built-in test runner (`node --test`) via `tsx`,
  engine package only — no tests currently cover the React app

## Data format

`AnalysisResult` (see `packages/engine/src/types.ts`) is the in-memory
shape produced by `analyze()`. `serialize()`/`deserialize()` persist a
slimmed-down version (landmarks only, 4 decimal places, joints and hip
angle recomputed on load) as JSON. `isStale()` compares a stored result's
`modelId` against the currently loaded model to detect when cached
analysis was produced by a different model version.

## Known limitations

- **"Save session"** (navbar) and **"Library"** (nav tab) are present in
  the UI but not yet wired up — no persistence layer exists yet.
- Pose detection accuracy depends heavily on camera angle; a clear,
  side-on view of the full body works best (surfaced in the empty-state
  copy and in the "no pose detected" error state).
- The model and WASM runtime are fetched from third-party CDNs on first
  load (~15–20MB combined); this can be slow on constrained mobile
  networks. The mobile-vs-desktop sample-rate split (`apps/web/src/utils/device.ts`)
  and the model-load timeout/retry handling in `poseModel.ts` mitigate
  this, but there is no offline/bundled-model mode.
