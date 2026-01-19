import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/* ---------------- Texture helpers ---------------- */
const loader = new THREE.TextureLoader();
function tex(name) {
  const t = loader.load(`/static/textures/${name}.jpg`);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---------------- UI ---------------- */
const timeLabel = document.getElementById("timeLabel");
const nowBtn = document.getElementById("refreshBtn");
const realtimeBtn = document.getElementById("realtimeBtn");
const fastBtn = document.getElementById("fastBtn");
const datePick = document.getElementById("datePick");
const goBtn = document.getElementById("goBtn");

/* ---------------- Time control ----------------
   Speed is "days per real second".
   - 0 => real-time
   - 1 => 1 day/sec
   - 30 => ~1 month/sec
   Note:  API is fetched 2x/sec, so super high speeds will “jump” between samples.
------------------------------------------------- */
let mode = "realtime";               // "realtime" | "fast"
let simTime = new Date();
let fastDaysPerSecond = 5;           //  change this number anytime
let lastTick = performance.now();
let lastFetchMs = 0;
const FETCH_INTERVAL_MS = 250;       // 4 fetches/sec (was 500)

/* ---------------- Scene ---------------- */
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 1e7);
camera.position.set(0, 40, 120);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 1);
document.body.appendChild(renderer.domElement);

// Keep canvas behind HUD but visible
renderer.domElement.style.position = "fixed";
renderer.domElement.style.inset = "0";
renderer.domElement.style.zIndex = "0";

/* ---------------- Controls ---------------- */
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enableZoom = true;
controls.zoomSpeed = 1.2;
controls.enablePan = false;
controls.minDistance = 12;
controls.maxDistance = 2500;
controls.target.set(0, 0, 0);

controls.mouseButtons = {
  LEFT: THREE.MOUSE.ROTATE,
  MIDDLE: THREE.MOUSE.DOLLY,
  RIGHT: THREE.MOUSE.ROTATE,
};

/* ---------------- Lighting ---------------- */
scene.add(new THREE.AmbientLight(0xffffff, 0.35));
const sunLight = new THREE.PointLight(0xffffff, 1.4);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);

/* ---------------- Sun ---------------- */
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(3.5, 24, 24),
  new THREE.MeshStandardMaterial({
    map: tex("sun.jpg"),
    emissive: 0xffffff,
    emissiveIntensity: 1.2,
    roughness: 1.0,
    metalness: 0.0,
  })
);
scene.add(sun);

/* ---------------- Planets + textures ---------------- */
const AU_TO_UNITS = 24;
const SIZE_MULT = 2.2;

const planetDefs = {
  mercury: { r: 0.6 },
  venus: { r: 1.2 },
  earth: { r: 1.3 },
  mars: { r: 0.9 },
  jupiter: { r: 2.8 },
  saturn: { r: 2.5 },
  uranus: { r: 2.0 },
  neptune: { r: 2.0 },
};

const planets = {};
for (const [name, def] of Object.entries(planetDefs)) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(def.r * SIZE_MULT, 48, 48),
    new THREE.MeshStandardMaterial({
      map: tex(name),
      roughness: 0.95,
      metalness: 0.0,
    })
  );
  scene.add(mesh);
  planets[name] = mesh;
}

/* ---------------- Saturn rings (uses saturn_ring.png) ----------------
   Put your ring texture at: app/static/textures/saturn_ring.png
   (PNG works best because it can include transparency)
----------------------------------------------------------------------- */
const ringTex = loader.load("/static/textures/saturn_ring.png");
ringTex.colorSpace = THREE.SRGBColorSpace;

const saturnRings = new THREE.Mesh(
  new THREE.RingGeometry(planetDefs.saturn.r * SIZE_MULT * 1.2, planetDefs.saturn.r * SIZE_MULT * 2.2, 128),
  new THREE.MeshStandardMaterial({
    map: ringTex,
    transparent: true,
    side: THREE.DoubleSide,
    roughness: 1.0,
    metalness: 0.0,
  })
);
// tilt rings like real Saturn
saturnRings.rotation.x = THREE.MathUtils.degToRad(70);
scene.add(saturnRings);

/* ---------------- Data ---------------- */
async function fetchPositions(tIso) {
  const res = await fetch(`/api/positions?t=${encodeURIComponent(tIso)}`);
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}
function titleCaseKey(lower) {
  return lower[0].toUpperCase() + lower.slice(1);
}

async function updatePlanets(tIso) {
  const data = await fetchPositions(tIso);

  for (const name of Object.keys(planetDefs)) {
    const key = titleCaseKey(name);           // API uses "Earth", "Mars", etc.
    const p = data.positions?.[key];
    if (!p) continue;

    planets[name].position.set(
      p.x * AU_TO_UNITS,
      p.z * AU_TO_UNITS * 0.2,
      p.y * AU_TO_UNITS
    );
  }

  // Keep rings centered on Saturn and rotate with it
  saturnRings.position.copy(planets.saturn.position);
}

/* ---------------- Loop ---------------- */
function tick() {
  const now = performance.now();
  const dt = (now - lastTick) / 1000;
  lastTick = now;

  if (mode === "realtime") {
    simTime = new Date();
  } else {
    // Clamp dt so tab-switching doesn't jump years instantly
    const dtClamped = Math.min(dt, 0.25);
    simTime = new Date(simTime.getTime() + dtClamped * fastDaysPerSecond * 86400 * 1000);
  }

  const tIso = simTime.toISOString();
  timeLabel.textContent = `${tIso}  (${mode === "fast" ? `${fastDaysPerSecond} d/s` : "real-time"})`;

  if (now - lastFetchMs > FETCH_INTERVAL_MS) {
    lastFetchMs = now;
    updatePlanets(tIso).catch(console.error);
  }
}

function animate() {
  requestAnimationFrame(animate);

  tick();

  controls.target.set(0, 0, 0);
  controls.update();

  renderer.render(scene, camera);
}

/* ---------------- Events ---------------- */
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

realtimeBtn?.addEventListener("click", () => {
  mode = "realtime";
  lastFetchMs = 0;
  realtimeBtn.classList.add("primary");
  fastBtn?.classList.remove("primary");
});

fastBtn?.addEventListener("click", () => {
  mode = "fast";
  lastFetchMs = 0;
  fastBtn.classList.add("primary");
  realtimeBtn?.classList.remove("primary");
});

nowBtn?.addEventListener("click", () => {
  mode = "realtime";
  simTime = new Date();
  lastFetchMs = 0;
  realtimeBtn?.classList.add("primary");
  fastBtn?.classList.remove("primary");
});

goBtn?.addEventListener("click", () => {
  if (!datePick?.value) return;
  simTime = new Date(datePick.value);   // local datetime
  mode = "fast";
  lastFetchMs = 0;
  fastBtn?.classList.add("primary");
  realtimeBtn?.classList.remove("primary");
  updatePlanets(simTime.toISOString()).catch(console.error);
});

//  press 1/2/3/4 to set speed quickly
window.addEventListener("keydown", (e) => {
  if (e.key === "1") fastDaysPerSecond = 1;
  if (e.key === "2") fastDaysPerSecond = 5;
  if (e.key === "3") fastDaysPerSecond = 20;
  if (e.key === "4") fastDaysPerSecond = 60;
});

/* ---------------- Init ---------------- */
if (datePick) datePick.value = new Date().toISOString().slice(0, 16);
updatePlanets(new Date().toISOString()).catch(console.error);
animate();
