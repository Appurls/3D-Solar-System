# 🌌 Interactive Solar System Simulator (Dockerized)

An interactive 3D solar system visualization built with **Three.js** and a **Dockerized FastAPI backend**.  
The backend serves real planetary position data (ephemeris-based), while the frontend renders the Sun and major planets in a navigable 3D scene with controllable simulation speed.

> 🚧 Work in progress — visual scaling, lighting, and polish are actively being improved.

---

## Features

- Real-time planetary positions (API-driven)
- Accelerated time simulation (days per second)
- Interactive 3D camera controls (orbit & zoom)
- Textured planets + Saturn’s rings
- Client–server architecture (frontend + backend API)
- Runs consistently via Docker

---

## Tech Stack

**Frontend**
- JavaScript (ES Modules)
- Three.js
- WebGL

**Backend**
- Python
- FastAPI
- Skyfield (astronomical ephemeris)
- REST API (JSON)

**DevOps**
- Docker

---

## Run with Docker (Recommended)

### 1) Build the image
```bash
docker build -t solar-system .
docker run --rm -p 8000:8000 solar-system
```
Open in browser
App: http://localhost:8000
API (example): http://localhost:8000/api/positions

## Development Notes
The frontend fetches positions from the backend API and updates planet meshes each tick.
Visual distance scaling and Sun lighting are being refined for better readability.

## Planned Improvements
- Log-scaled / compressed distance model for outer planets
- Sun glow / bloom effect
- Orbit lines + labels
- Axial rotation and tilt
- Performance optimizations

