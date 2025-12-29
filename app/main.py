from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.ephemeris import positions_au  # import our position-calculator function

app = FastAPI(title="Solar System API")  # create the web app


@app.get("/api/positions")  # this URL returns planet positions for a given time
def get_positions(t: str):
    # t should be an ISO UTC string like: 2025-12-25T12:00:00Z
    return {
        "t": t,
        "units": "AU",
        "frame": "heliocentric",
        "positions": positions_au(t),
    }


# Serve the website files (HTML/CSS/JS) from the /static URL
app.mount("/static", StaticFiles(directory="app/static"), name="static")


@app.get("/")  # when you open the website root, show index.html
def index():
    return FileResponse("app/static/index.html")
