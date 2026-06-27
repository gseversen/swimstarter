# SwimStarter

SwimStarter is a competitive swimming video analysis application with a FastAPI backend and a React + Vite frontend.  
This initial codebase provides a clean scaffold for frame analysis, stroke search, and a video-overlay dashboard UI.

## Project Structure

- `backend/` - FastAPI API server and analysis utilities
- `frontend/` - React dashboard client (Vite)

## Quick Start

### Backend

1. Create a virtual environment and activate it.
2. Install dependencies:
   - `pip install -r backend/requirements.txt`
3. Run the API:
   - `uvicorn backend.main:app --reload`

### Frontend

1. Install dependencies:
   - `cd frontend && npm install`
2. Start development server:
   - `npm run dev`

Frontend calls are pre-wired to `http://127.0.0.1:8000`.
