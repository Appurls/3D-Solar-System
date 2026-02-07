import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// ---------- Config ----------
const AU_SCALE = 10; // used only for direction (not radius)
const FLATTEN_Y = 0.12;
const UPDATE_INTERVAL_MS = 200;
const SUN_RADIUS = 6;

// Manual distances from the Sun (in scene units)
const MANUAL_RADIUS = {
    Mercury: 25,
    Venus: 33,
    Earth: 40,
    Mars: 55,
    Jupiter: 86,
    Saturn: 98,
    Uranus: 110,
    Neptune: 118,
};

// ---------- Helpers ----------
function mapVec(p) {
    return {
        x: p.x * AU_SCALE,
        y: p.y * AU_SCALE,
        z: p.z * AU_SCALE,
    };
}

async function fetchPositions(tIso) {
    const url = `/api/positions?t=${encodeURIComponent(tIso)}&_=${Date.now()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

// ---------- Scene ----------
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1e6
);
camera.position.set(0, 40, 120);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 1);
document.body.appendChild(renderer.domElement);

renderer.domElement.style.position = "fixed";
renderer.domElement.style.inset = "0";
renderer.domElement.style.zIndex = "0";

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0, 0);
controls.update();

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 0.45));
const sunLight = new THREE.PointLight(0xffffff, 1.8);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);

// ---------- Textures ----------
const textureLoader = new THREE.TextureLoader();
const tex = {
    Sun: "/static/textures/sun.jpg",
    Mercury: "/static/textures/mercury.jpg",
    Venus: "/static/textures/venus.jpg",
    Earth: "/static/textures/earth.jpg",
    Mars: "/static/textures/mars.jpg",
    Jupiter: "/static/textures/jupiter.jpg",
    Saturn: "/static/textures/saturn.jpg",
    Uranus: "/static/textures/uranus.jpg",
    Neptune: "/static/textures/neptune.jpg",
};

// Sun
const sun = new THREE.Mesh(
    new THREE.SphereGeometry(SUN_RADIUS, 64, 64),
    new THREE.MeshBasicMaterial({ map: textureLoader.load(tex.Sun) })
);
scene.add(sun);

// Planets
const bodies = {
    Mercury: { r: 1.4 },
    Venus: { r: 2.2 },
    Earth: { r: 2.3 },
    Mars: { r: 1.8 },
    Jupiter: { r: 5.4 },
    Saturn: { r: 4.8 },
    Uranus: { r: 3.8 },
    Neptune: { r: 3.8 },
};

const meshes = {};
for (const [name, { r }] of Object.entries(bodies)) {
    const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(r, 32, 32),
        new THREE.MeshStandardMaterial({ map: textureLoader.load(tex[name]) })
    );
    meshes[name] = mesh;
    scene.add(mesh);
}

// ---------- HUD ----------
const timeLabel = document.getElementById("timeLabel");
const modeBadge = document.getElementById("modeBadge");
const debug = document.getElementById("debug");
const modeSelect = document.getElementById("modeSelect");
const fastRate = document.getElementById("fastRate");
const datePick = document.getElementById("datePick");
const goBtn = document.getElementById("goBtn");
const refreshBtn = document.getElementById("refreshBtn");

let mode = "realtime";
let currentTime = new Date();
let speedDaysPerSec = 1;
let lastTick = performance.now();

function updateTimeLabel() {
    if (timeLabel) timeLabel.textContent = currentTime.toLocaleString();
    if (modeBadge) {
        modeBadge.textContent =
            mode === "fast" ? `FAST ${speedDaysPerSec} day/sec` :
                mode === "fixed" ? "FIXED" :
                    "REAL‑TIME";
    }
}

function setMode(newMode) {
    mode = newMode;
    if (modeSelect) modeSelect.value = mode;
    updateTimeLabel();
}

modeSelect?.addEventListener("change", () => {
    setMode(modeSelect.value);
});

fastRate?.addEventListener("change", () => {
    speedDaysPerSec = Number(fastRate.value) || 1;
    updateTimeLabel();
});

refreshBtn?.addEventListener("click", () => {
    currentTime = new Date();
    setMode("realtime");
    updateFromApi().catch(() => { });
});

goBtn?.addEventListener("click", () => {
    if (!datePick?.value) return;
    const chosen = new Date(datePick.value);
    if (!isNaN(chosen.getTime())) {
        currentTime = chosen;
        setMode("fixed");
        updateFromApi().catch(() => { });
    }
});

// ---------- API update ----------
async function updateFromApi() {
    const t = (mode === "realtime") ? new Date() : currentTime;
    const data = await fetchPositions(t.toISOString());

    for (const [name, mesh] of Object.entries(meshes)) {
        const p = data.positions?.[name];
        if (!p) continue;

        const v = mapVec(p);

        // use x/y as orbit plane
        const dirR = Math.hypot(v.x, v.y) || 1e-9;
        const targetR = MANUAL_RADIUS[name] ?? dirR;

        const x = (v.x / dirR) * targetR;
        const z = (v.y / dirR) * targetR;

        // z from API becomes small vertical offset
        const y = v.z * FLATTEN_Y;

        mesh.position.set(x, y, z);
    }

    if (debug) {
        const keys = Object.keys(data.positions || {});
        debug.textContent = `API ok • t=${t.toISOString()} • keys=${keys.join(", ")}`;
    }
}

// Prime once
updateFromApi().catch(() => {
    if (debug) debug.textContent = "API error (fallback showing).";
});

setInterval(() => {
    updateFromApi().catch(() => { });
}, UPDATE_INTERVAL_MS);

// ---------- Render ----------
function animate(now) {
    requestAnimationFrame(animate);

    const dt = Math.max(0, (now - lastTick) / 1000);
    lastTick = now;

    if (mode === "realtime") {
        currentTime = new Date();
    } else if (mode === "fast") {
        const msPerDay = 24 * 60 * 60 * 1000;
        currentTime = new Date(currentTime.getTime() + dt * speedDaysPerSec * msPerDay);
    }

    updateTimeLabel();
    controls.update();
    renderer.render(scene, camera);
}
requestAnimationFrame(animate);

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
