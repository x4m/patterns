// pattern-lib.js — shared foundation for Russian Forest pattern generators

// ─── PRNG ─────────────────────────────────────────────────────────────────

function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashN(...args) {
  let h = (window._patternSeed * 2654435761) >>> 0;
  for (const v of args) {
    h ^= (v * 2246822519) >>> 0;
    h = Math.imul(h, 2654435761) >>> 0;
    h ^= h >>> 16;
  }
  return h >>> 0;
}

// ─── Canvas setup ─────────────────────────────────────────────────────────
// Call once after creating canvas. Returns view state object { offsetX, offsetY, zoom }.
// renderFn(ctx, width, height, offsetX, offsetY, zoom) is called on every redraw.

function setupCanvas(canvas, renderFn) {
  const view = { offsetX: 0, offsetY: 0, zoom: 1 };

  let dragging = false, dragStartX = 0, dragStartY = 0, dragOffX = 0, dragOffY = 0;

  function redraw() {
    canvas.width = canvas.clientWidth || window.innerWidth;
    canvas.height = canvas.clientHeight || window.innerHeight;
    renderFn(canvas.getContext('2d'), canvas.width, canvas.height,
             view.offsetX, view.offsetY, view.zoom);
    if (window._coordsEl) {
      window._coordsEl.textContent =
        `x: ${Math.round(view.offsetX / view.zoom)}  ` +
        `y: ${Math.round(view.offsetY / view.zoom)}  ` +
        `z: ${Math.round(view.zoom * 100)}%`;
    }
  }

  // Resize
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    redraw();
  });
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Mouse drag
  canvas.addEventListener('mousedown', e => {
    dragging = true;
    dragStartX = e.clientX; dragStartY = e.clientY;
    dragOffX = view.offsetX; dragOffY = view.offsetY;
  });
  window.addEventListener('mousemove', e => {
    if (!dragging) return;
    view.offsetX = dragOffX - (e.clientX - dragStartX);
    view.offsetY = dragOffY - (e.clientY - dragStartY);
    redraw();
  });
  window.addEventListener('mouseup', () => { dragging = false; });

  // Wheel zoom
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const f = e.deltaY < 0 ? 1.10 : 0.91;
    view.offsetX = e.clientX - (e.clientX - view.offsetX) * f;
    view.offsetY = e.clientY - (e.clientY - view.offsetY) * f;
    view.zoom = Math.min(6, Math.max(0.15, view.zoom * f));
    if (window._zoomEl) {
      window._zoomEl.value = Math.round(view.zoom * 100);
      window._zoomValEl.textContent = Math.round(view.zoom * 100) + '%';
    }
    redraw();
  }, { passive: false });

  // Touch
  let lastDist = null, lastMidX = 0, lastMidY = 0, touchOffX = 0, touchOffY = 0;
  canvas.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      dragging = true;
      dragStartX = e.touches[0].clientX; dragStartY = e.touches[0].clientY;
      dragOffX = view.offsetX; dragOffY = view.offsetY;
    } else if (e.touches.length === 2) {
      dragging = false;
      lastDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY);
      lastMidX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      lastMidY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      touchOffX = view.offsetX; touchOffY = view.offsetY;
    }
  }, { passive: true });
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (e.touches.length === 1 && dragging) {
      view.offsetX = dragOffX - (e.touches[0].clientX - dragStartX);
      view.offsetY = dragOffY - (e.touches[0].clientY - dragStartY);
      redraw();
    } else if (e.touches.length === 2 && lastDist) {
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY);
      const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const f = d / lastDist;
      view.offsetX = mx - (lastMidX - touchOffX) * f - (mx - lastMidX);
      view.offsetY = my - (lastMidY - touchOffY) * f - (my - lastMidY);
      view.zoom = Math.min(6, Math.max(0.15, view.zoom * f));
      lastDist = d; lastMidX = mx; lastMidY = my;
      touchOffX = view.offsetX; touchOffY = view.offsetY;
      redraw();
    }
  }, { passive: false });
  canvas.addEventListener('touchend', () => { dragging = false; lastDist = null; });

  view.redraw = redraw;
  view.resetView = () => {
    view.offsetX = 0; view.offsetY = 0; view.zoom = 1;
    if (window._zoomEl) { window._zoomEl.value = 100; window._zoomValEl.textContent = '100%'; }
    redraw();
  };
  return view;
}

// ─── Export ───────────────────────────────────────────────────────────────

function exportPNG(canvas, renderFn, seed, w, h) {
  w = w || 2560; h = h || 1440;
  const ec = document.createElement('canvas');
  ec.width = w; ec.height = h;
  const view = window._patternView;
  const eox = view.offsetX - (w - canvas.width) / 2;
  const eoy = view.offsetY - (h - canvas.height) / 2;
  renderFn(ec.getContext('2d'), w, h, eox, eoy, view.zoom);
  const a = document.createElement('a');
  a.download = `pattern-seed${seed}-${w}x${h}.png`;
  a.href = ec.toDataURL('image/png');
  a.click();
}

// ─── Shared CSS ───────────────────────────────────────────────────────────

const PATTERN_UI_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { overflow: hidden; background: #111; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
  canvas { display: block; cursor: grab; user-select: none; }
  canvas:active { cursor: grabbing; }
  #ui {
    position: fixed; top: 18px; right: 18px;
    background: rgba(16,12,10,0.88);
    color: #e8ddd4; padding: 18px 20px; border-radius: 12px;
    font-size: 13px; display: flex; flex-direction: column; gap: 12px;
    backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.07);
    min-width: 240px; box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  }
  #ui h3 { font-size: 15px; font-weight: 600; color: #f0e6dc; letter-spacing: 0.3px; }
  .sep { height: 1px; background: rgba(255,255,255,0.08); margin: 2px 0; }
  .row { display: flex; align-items: center; gap: 10px; }
  .row label { flex: 0 0 96px; color: #9a8a7a; font-size: 12px; }
  .row input[type=range] { flex: 1; accent-color: #7a9a6a; height: 4px; }
  .val { flex: 0 0 34px; text-align: right; color: #c8b8a8; font-size: 11px; font-variant-numeric: tabular-nums; }
  .seed-row { display: flex; gap: 8px; align-items: center; }
  .seed-row label { color: #9a8a7a; font-size: 12px; }
  .seed-row input[type=number] {
    flex: 1; background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1); color: #f0e6dc;
    padding: 5px 8px; border-radius: 6px; font-size: 12px; outline: none;
  }
  .seed-row input:focus { border-color: #7a9a6a; }
  button {
    background: #5a7a4a; color: #fff; border: none;
    padding: 8px 14px; border-radius: 7px; cursor: pointer;
    font-size: 12px; font-weight: 600; letter-spacing: 0.3px; transition: background 0.15s;
  }
  button:hover { background: #6e9058; }
  button.sec { background: rgba(255,255,255,0.08); color: #c8b8a8; font-weight: 500; }
  button.sec:hover { background: rgba(255,255,255,0.14); }
  .btns { display: flex; gap: 8px; }
  .hint { color: #5a4a3a; font-size: 11px; line-height: 1.5; }
  .coords { color: #5a4a3a; font-size: 10px; font-variant-numeric: tabular-nums; letter-spacing: 0.5px; }
`;

// ─── UI helpers ───────────────────────────────────────────────────────────

// Inject CSS into document head
function injectCSS(css) {
  const s = document.createElement('style');
  s.textContent = css;
  document.head.appendChild(s);
}

// Bind a range slider: updates a global variable and calls redraw on input.
// varSetter: fn(value) called with parsed float
// displayFn: fn(value) → string for the .val span (optional)
function bindSlider(id, varSetter, displayFn) {
  const el = document.getElementById(id);
  const valEl = document.getElementById(id + 'Val');
  if (!el) return;
  const update = () => {
    const v = parseFloat(el.value);
    varSetter(v);
    if (valEl) valEl.textContent = displayFn ? displayFn(v) : v;
    if (window._patternView) window._patternView.redraw();
  };
  el.addEventListener('input', update);
  // Set initial display
  if (valEl) valEl.textContent = displayFn ? displayFn(parseFloat(el.value)) : el.value;
}

function bindSeed(inputId, setter) {
  const el = document.getElementById(inputId);
  if (!el) return;
  el.addEventListener('change', e => {
    const v = (parseInt(e.target.value) || 0) >>> 0;
    window._patternSeed = v;
    if (setter) setter(v);
    if (window._patternView) window._patternView.redraw();
  });
}

function randomSeedFn(inputId) {
  const v = Math.floor(Math.random() * 9999999);
  window._patternSeed = v;
  const el = document.getElementById(inputId);
  if (el) el.value = v;
  if (window._patternView) window._patternView.redraw();
}
