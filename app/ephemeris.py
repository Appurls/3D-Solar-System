# Caches function results so we don’t reload heavy data repeatedly
from functools import lru_cache

# Used to work with dates, times, and time zones
from datetime import datetime, timezone

#library that handles real astronomy math and data
from skyfield.api import load


# Dictionary of bodies we want to calculate positions for
# Left side = name we use in our app
# Right side = name Skyfield understands
BODIES = {
    "Sun": "sun",
    "Mercury": "mercury",
    "Venus": "venus",
    "Earth": "earth",
    "Mars": "mars",
    "Jupiter": "jupiter barycenter",  
    "Saturn": "saturn barycenter",
    "Uranus": "uranus barycenter",
    "Neptune": "neptune barycenter",
}


# This function loads the ephemeris data and time system
# lru_cache(maxsize=1) means:
#  run this function once and reuse the result forever
@lru_cache(maxsize=1)
def load_ephemeris():
    # Create Skyfield's time scale object
    ts = load.timescale()

    # Load NASA/JPL ephemeris file
    # If not found, Skyfield downloads it automatically
    eph = load("de421.bsp")

    # Return both so we can use them elsewhere
    return ts, eph


# Main function: returns planet positions at a given time
def positions_au(iso_utc: str):
    

    # Get cached timescale and ephemeris
    ts, eph = load_ephemeris()

    # Clean up the timestamp string
    # Replace 'Z' with '+00:00' so Python can parse it
    s = iso_utc.strip().replace("Z", "+00:00")

    # Convert string to Python datetime
    dt = datetime.fromisoformat(s)

    # If no timezone is provided, assume UTC
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)

    # Ensure the time is in UTC
    dt = dt.astimezone(timezone.utc)

    # Convert Python datetime → Skyfield time object
    t = ts.from_datetime(dt)

    # Get the Sun object from the ephemeris
    sun = eph["sun"]

    # Dictionary to store output positions
    out = {}

    # Loop through each planet/body
    for key, eph_name in BODIES.items():
        # Get planet object from ephemeris
        body = eph[eph_name]

        # Compute position of body relative to the Sun at time t
        # Result is a 3D vector in AU
        vec = (body - sun).at(t).position.au

        # Store x, y, z values in a JSON-friendly format
        out[key] = {
            "x": float(vec[0]),
            "y": float(vec[1]),
            "z": float(vec[2]),
        }

    # Return all planet positions
    return out
