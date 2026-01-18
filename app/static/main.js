const canvas = document.getElementById("view");
const ctx = canvas.getContext("2d");

function toScreen(x, y, scale) {
  // heliocentric x,y in AU -> screen pixels (centered)
  return {
    sx: canvas.width / 2 + x * scale,
    sy: canvas.height / 2 - y * scale,
  };
}

function drawDot(x, y, r, label) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillText(label, x + 6, y - 6);
}

async function loadAndDraw() {
  const t = new Date().toISOString();
  const res = await fetch(`/api/positions?t=${encodeURIComponent(t)}`);
  const data = await res.json();

  // Clear
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "12px system-ui";

  // Scale: 1 AU = 200 px (tweak)
  const scale = 200;

  // Sun at center
  ctx.fillText("Sun", canvas.width / 2 + 6, canvas.height / 2 - 6);
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, 6, 0, Math.PI * 2);
  ctx.fill();

  // Earth + Mars (x,y only)
  const earth = data.positions.earth;
  const mars = data.positions.mars;

  const E = toScreen(earth.x, earth.y, scale);
  const M = toScreen(mars.x, mars.y, scale);

  drawDot(E.sx, E.sy, 4, "Earth");
  drawDot(M.sx, M.sy, 4, "Mars");
}

loadAndDraw().catch(console.error);

