(() => {
  const canvas = document.getElementById('board');
  const ctx = canvas.getContext('2d');
  const colorEl = document.getElementById('color');
  const sizeEl = document.getElementById('size');
  const sizeVal = document.getElementById('sizeVal');
  const eraserBtn = document.getElementById('eraser');
  const undoBtn = document.getElementById('undo');
  const redoBtn = document.getElementById('redo');
  const clearBtn = document.getElementById('clear');
  const downloadBtn = document.getElementById('download');
  const postBtn = document.getElementById('post');
  const authorEl = document.getElementById('author');
  const captionEl = document.getElementById('caption');

  // Same-origin Worker route
  const API_BASE = '/api/paint';

  const state = {
    drawing: false,
    erasing: false,
    lastX: 0,
    lastY: 0,
    strokeColor: colorEl ? colorEl.value : '#00ff88',
    strokeSize: sizeEl ? +sizeEl.value : 10,
    undo: [],
    redo: [],
    maxHistory: 40,
    dpr: Math.max(1, Math.min(3, window.devicePixelRatio || 1))
  };

  function setSizeLabel() {
    if (sizeVal) sizeVal.textContent = state.strokeSize;
  }
  setSizeLabel();

  // ---- History ----
  function snapshot(pushTo = 'undo') {
    try {
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      state[pushTo].push(img);
      if (state[pushTo].length > state.maxHistory) state[pushTo].shift();
    } catch (e) {
      // Cross-origin or memory limits; ignore gracefully
    }
  }

  function restore(from = 'undo', to = 'redo') {
    if (!state[from].length) return;
    try {
      const img = state[from].pop();
      state[to].push(ctx.getImageData(0, 0, canvas.width, canvas.height));
      ctx.putImageData(img, 0, 0);
    } catch (e) {}
  }

  // ---- Canvas sizing ----
  function fitCanvas() {
    const rect = canvas.getBoundingClientRect();
    const { dpr } = state;
    const w = Math.max(1, Math.floor(rect.width * dpr));
    const h = Math.max(1, Math.floor(rect.height * dpr));
    if (canvas.width === w && canvas.height === h) return;

    // preserve current pixels
    const prev = document.createElement('canvas');
    prev.width = canvas.width; prev.height = canvas.height;
    const pctx = prev.getContext('2d');
    if (prev.width && prev.height) pctx.drawImage(canvas, 0, 0);

    // set new size & reset transform
    canvas.width = w; canvas.height = h;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.imageSmoothingEnabled = true;

    // restore previous pixels scaled
    if (prev.width && prev.height) {
      ctx.drawImage(prev, 0, 0, prev.width, prev.height, 0, 0, w, h);
    }
  }

  window.addEventListener('load', fitCanvas);
  if ('ResizeObserver' in window) {
    new ResizeObserver(fitCanvas).observe(canvas);
  }
  window.addEventListener('resize', fitCanvas, { passive: true });

  // quick sanity log
  setTimeout(() => {
    console.log('canvas backing store:', canvas.width, 'x', canvas.height, '@dpr', state.dpr);
  }, 0);

  // ---- Drawing (pointer/touch/mouse) ----
  const hasPointer = 'onpointerdown' in window;

  function posFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY, pressure = 1;

    if (e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
      if (typeof e.pressure === 'number' && e.pressure > 0) pressure = e.pressure;
    }

    const x = (clientX - rect.left) * state.dpr;
    const y = (clientY - rect.top) * state.dpr;
    return { x, y, p: pressure };
  }

  function drawDot(x, y) {
    const r = Math.max(0.5, state.strokeSize / 2);
    ctx.save();
    ctx.globalCompositeOperation = state.erasing ? 'destination-out' : 'source-over';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = state.erasing ? '#000' : state.strokeColor;
    ctx.fill();
    ctx.restore();
  }

  function startStroke(e) {
    state.drawing = true;
    state.redo = []; // new branch on new stroke
    snapshot('undo');

    if (hasPointer && typeof canvas.setPointerCapture === 'function' && e.pointerId != null) {
      try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    }

    const { x, y, p } = posFromEvent(e);
    state.lastX = x; state.lastY = y;

    // First tap should produce a visible mark
    const lw = Math.max(0.5, state.strokeSize * (hasPointer ? p : 1));
    ctx.lineWidth = lw;
    drawDot(x, y);
  }

  function moveStroke(e) {
    if (!state.drawing) return;
    e.preventDefault();

    const { x, y, p } = posFromEvent(e);
    const lw = Math.max(0.5, state.strokeSize * (hasPointer ? p : 1));

    ctx.lineWidth = lw;
    ctx.strokeStyle = state.erasing ? 'rgba(0,0,0,1)' : state.strokeColor;
    ctx.globalCompositeOperation = state.erasing ? 'destination-out' : 'source-over';

    ctx.beginPath();
    ctx.moveTo(state.lastX, state.lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

    state.lastX = x; state.lastY = y;
  }

  function endStroke(e) {
    state.drawing = false;
    if (hasPointer && typeof canvas.releasePointerCapture === 'function' && e?.pointerId != null) {
      try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
    }
  }

  if (hasPointer) {
    canvas.addEventListener('pointerdown', startStroke);
    canvas.addEventListener('pointermove', moveStroke, { passive: false });
    window.addEventListener('pointerup', endStroke);
  } else {
    // Fallback (older Safari)
    canvas.addEventListener('mousedown', startStroke);
    canvas.addEventListener('mousemove', moveStroke);
    window.addEventListener('mouseup', endStroke);
    canvas.addEventListener('touchstart', (e) => { startStroke(e); }, { passive: false });
    canvas.addEventListener('touchmove', moveStroke, { passive: false });
    window.addEventListener('touchend', endStroke);
  }

  // ---- Tools ----
  if (colorEl) {
    colorEl.addEventListener('input', e => { state.strokeColor = e.target.value; });
  }
  if (sizeEl) {
    sizeEl.addEventListener('input', e => { state.strokeSize = +e.target.value; setSizeLabel(); });
  }
  if (eraserBtn) {
    eraserBtn.addEventListener('click', () => {
      state.erasing = !state.erasing;
      eraserBtn.setAttribute('aria-pressed', String(state.erasing));
    });
  }
  if (undoBtn) undoBtn.addEventListener('click', () => restore('undo', 'redo'));
  if (redoBtn) redoBtn.addEventListener('click', () => restore('redo', 'undo'));
  if (clearBtn) clearBtn.addEventListener('click', () => { snapshot('undo'); ctx.clearRect(0, 0, canvas.width, canvas.height); });

  // ---- Shortcuts ----
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      if (e.shiftKey) restore('redo', 'undo'); else restore('undo', 'redo');
      e.preventDefault();
    }
  });

  // ---- Download ----
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      canvas.toBlob(blob => {
        if (!blob) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `vrians-paint-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(a.href);
      }, 'image/png');
    });
  }

  // ---- Post to gallery ----
  if (postBtn) {
    postBtn.addEventListener('click', async () => {
      postBtn.disabled = true; postBtn.textContent = 'Posting…';
      try {
        const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
        if (!blob) throw new Error('Could not export image');
        if (blob.size > 5 * 1024 * 1024) throw new Error('Image too large (>5MB)');

        const fd = new FormData();
        fd.append('file', blob, 'art.png');
        fd.append('author', (authorEl?.value || '').slice(0, 32));
        fd.append('caption', (captionEl?.value || '').slice(0, 100));

        const r = await fetch(`${API_BASE}/publish`, { method: 'POST', body: fd });
        if (!r.ok) throw new Error(`Upload failed (${r.status})`);
        await r.json();

        postBtn.textContent = 'Posted! View Gallery';
        setTimeout(() => { window.location.href = '/paint/gallery.html'; }, 700);
      } catch (err) {
        alert(err.message || 'Failed to post');
        postBtn.textContent = 'Post to Gallery';
      } finally {
        postBtn.disabled = false;
      }
    });
  }
})();