# 🌌 Interactive Solar System Simulator

An interactive 3D solar system visualization built with Three.js and a custom backend API.  
The project renders the Sun and major planets in real time using astronomical ephemeris data, with controllable simulation speed and camera navigation.

> 🚧 Work in progress — visual scaling, lighting, and polish are actively being improved.

---

## Features

- Real-time planetary positions
- Accelerated time simulation (days per second)
- Interactive 3D camera (orbit & zoom)
- Textured planets and Saturn’s rings
- Client–server architecture
- Full-screen WebGL rendering

---

## Tech Stack

**Frontend**
- JavaScript (ES Modules)
- Three.js
- WebGL

**Backend**
- Python
- Skyfield (astronomical ephemeris)
- REST API (JSON)

---

## Time Controls

- Real-time mode (current time)
- Fast-forward simulation
- Jump to a specific date via date picker

---

## Project Structure

app/
├─ static/
│ ├─ textures/
│ └─ main.js
├─ api/
│ └─ positions
└─ templates/



---

## Running Locally

1. Clone the repository
2. Install backend dependencies
3. Start the API server
4. Open the app in your browser

```bash
git clone https://github.com/yourusername/solar-system
cd solar-system
