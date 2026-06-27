from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="SwimStarter API",
    description="Backend API for competitive swimming video analysis.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def read_root() -> dict:
    return {"message": "Welcome to SwimStarter API"}


@app.post("/analyze-frame")
async def analyze_frame(
    image: UploadFile = File(...),
    water_line: int = Form(...),
) -> dict:
    if water_line < 0:
        raise HTTPException(status_code=422, detail="water_line must be >= 0")

    if image.content_type is None or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="Only image uploads are supported")

    # ponytail: Keep lightweight until real CV pipeline is integrated.
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded image is empty")

    return {
        "frame_analysis": {
            "left_shoulder": {"x": 0.42, "y": 0.31},
            "right_shoulder": {"x": 0.56, "y": 0.32},
            "left_hip": {"x": 0.45, "y": 0.61},
            "right_hip": {"x": 0.53, "y": 0.62},
            "torso_angle_degrees": 18.4,
        },
        "water_line": water_line,
        "filename": image.filename,
        "content_type": image.content_type,
    }


@app.get("/search/")
async def search_videos(
    genre: Optional[str] = None,
    stroke: Optional[str] = None,
) -> dict:
    mock_videos = [
        {"id": "vid-001", "title": "50m Freestyle Sprint", "genre": "race", "stroke": "freestyle"},
        {"id": "vid-002", "title": "Butterfly Turn Drill", "genre": "training", "stroke": "butterfly"},
        {"id": "vid-003", "title": "Backstroke Start Session", "genre": "training", "stroke": "backstroke"},
    ]

    filtered = [
        video
        for video in mock_videos
        if (not genre or video["genre"].lower() == genre.lower())
        and (not stroke or video["stroke"].lower() == stroke.lower())
    ]

    return {"filters": {"genre": genre, "stroke": stroke}, "results": filtered}
