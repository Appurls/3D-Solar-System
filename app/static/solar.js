import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";


// --- UI ---
const timeLabel = document.getElementById("timeLabel");
const refreshBtn = document.getElementById("refreshBtn");

let simTime = new Date();      // current simulated time
let playing = true;
const DAYS_PER_SECOND = 10;    // speed: 10 days per real second
let lastTick = performance.now();
let lastFetchMs = 0;

// --- Scene ---
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 1e7);
camera.position.set(0, 40, 120);
camera.lookAt(0, 0, 0);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 1);
document.body.style.margin = "0";
document.body.appendChild(renderer.domElement);

// Keep WebGL canvas behind the HUD
renderer.domElement.style.position = "fixed";
renderer.domElement.style.inset = "0";
renderer.domElement.style.zIndex = "-1";

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0, 0);

// Lighting
scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const sunLight = new THREE.PointLight(0xffffff, 1.2);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);

// Sun
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(4, 32, 32),
  new THREE.MeshStandardMaterial({ emissive: 0xffdd66, emissiveIntensity: 1.0 })
);
scene.add(sun);

// // Grid 
// const grid = new THREE.GridHelper(400, 20);
// grid.position.y = -10;
// scene.add(grid);

// Planets 
const AU_TO_UNITS = 30;

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
    new THREE.SphereGeometry(def.r, 24, 24),
    new THREE.MeshStandardMaterial()
  );
  scene.add(mesh);
  planets[name] = mesh;
}

//  Data 
async function fetchPositions(tIso) {
  const res = await fetch(`/api/positions?t=${encodeURIComponent(tIso)}`);
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}



async function updatePlanets(tIso) {
  const data = await fetchPositions(tIso);
  console.log("keys:", Object.keys(data.positions));
  console.log("earth:", data.positions.earth);
  for (const name of Object.keys(planetDefs)) {
    const key = name[0].toUpperCase() + name.slice(1);
    const p = data.positions[key];
    if (!p) continue;
  
    planets[name].position.set(
      p.x * AU_TO_UNITS,
      p.z * AU_TO_UNITS * 0.2,
      p.y * AU_TO_UNITS
    );
  }
  
}

function tick() {
  const now = performance.now();
  const dt = (now - lastTick) / 1000;
  lastTick = now;

  if (playing) {
    simTime = new Date(simTime.getTime() + dt * DAYS_PER_SECOND * 86400 * 1000);
  }

  const tIso = simTime.toISOString();
  timeLabel.textContent = tIso;

  // fetch at most 2 times/second (avoid spamming API)
  if (now - lastFetchMs > 500) {
    lastFetchMs = now;
    updatePlanets(tIso).catch(console.error);
  }
}

// Loop 
function animate() {
  requestAnimationFrame(animate);
  tick(); 
  controls.update();
  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

refreshBtn.addEventListener("click", () => {
    simTime = new Date();
    lastFetchMs = 0;
  });

// updateOnce().catch(console.error);


animate();
