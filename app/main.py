from fastapi import FastAPI, Query, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.ephemeris import positions_au

app = FastAPI(title="Solar System API")


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


app.mount("/static", StaticFiles(directory="app/static"), name="static")


@app.get("/")
def index():
    return FileResponse("app/static/index.html")
