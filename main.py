from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CRITICAL: Allow React to talk to your backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # React's default address
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#home
@app.get("/")
async def root():
    return{"message": "Welcome to the SwimStarter"}

#start detailer
@app.get("/start/{start_id}")
async def get_start(start_id: int):
    return{
        "start_id": start_id,
        "title": f"Awesome start #{start_id}",
        "calculated" : True
    }

#search endpoint
@app.get("/search/")
async def search(genre: str, limit: int = 5):
    #this simulates filtering  a large list of data based on optional criteria
    return{
        "filtered_by_genre": str,
        "results_limit": limit,
        "results": [f"{genre} start A", f"{genre} start B"]
    }