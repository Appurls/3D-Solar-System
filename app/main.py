from fastapi import FastAPI, Query, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.ephemeris import positions_au

app = FastAPI(title="Solar System API")


# --- Pages ---
@app.get("/", include_in_schema=False)
def index():
    # Serve the frontend
    return FileResponse("app/static/index.html")


# --- Static files (JS/CSS/etc.) ---
app.mount("/static", StaticFiles(directory="app/static"), name="static")


# --- API ---
@app.get("/api/positions")
def get_positions(
    t: str = Query(
        ...,
        description="ISO time string. Example: 2025-12-25T12:00:00Z",
        examples=["2025-12-25T12:00:00Z"],
    )
):
    try:
        pos = positions_au(t)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Bad time 't': {t}. Error: {e}")

    return {
        "t": t,
        "units": "AU",
        "frame": "heliocentric",
        "positions": pos,
    }
