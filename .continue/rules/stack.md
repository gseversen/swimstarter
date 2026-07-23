---
alwaysApply: false
globs:
  - "frontend/src/**/*.js"
  - "frontend/src/**/*.jsx"
---
# Tech Stack Standards
- **Core**: React, Vite.
- **Backend/State**: Supabase (`frontend/src/lib/supabaseClient.js`).
- **Analysis Execution**: HTML5 Canvas API for rendering overlays (`drawOverlay.js`) and frame processing (`analyzeFrame.js`). 
- **Style Constraint**: Avoid unnecessary state updates or component re-renders during `requestAnimationFrame` loops.