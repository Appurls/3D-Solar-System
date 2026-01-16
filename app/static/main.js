async function loadPositions() {
    const t = new Date().toISOString(); // e.g. 2026-01-16T03:12:34.567Z
  
    const url = `/api/positions?t=${encodeURIComponent(t)}`;
    const res = await fetch(url);
  
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Request failed: ${res.status}`);
    }
  
    const data = await res.json();
    console.log("API response:", data);
  
    // Example: log Earth's position
    console.log("Earth (AU):", data.positions.earth);
  }
  
  loadPositions().catch((e) => console.error(e));
  