import * as THREE from "three";

// ===================== CONFIG / CONSTANTS =====================
const SCORES_API = "/api/scores"; // same-origin GET for leaderboard
const API_BASE = "/api/session";  // server authoritative scoring
const TURNSTILE_SITE_KEY = "0x4AAAAAABu-PtUy0saF714Z";

const REFERENCE_FPS = 120;                // fixed logic rate
const FIXED_DT = 1 / REFERENCE_FPS;       // seconds
const CLEAR_CORRIDOR_MS = 5000;           // ms
const STAR_COUNT = 1500;
const LASER_MAX = 5;
const LASER_SPEED = 1.6;                  // units per logic step scalar
const LASER_SIZE = { x: 0.08, y: 0.08, z: 0.9 };
const PLAYER_Z = 2.2, OBSTACLE_START_Z = -80, DESPAWN_Z = 6.0;
const SHIP_SPAN = 2.1, SHIP_LENGTH = 1.1; // visual ship dims
const POINTS_PER_ASTEROID_DODGED = 10;
const POINTS_PER_ASTEROID_SHOT = 100;

// ===================== GLOBAL TYPES =====================
declare global {
  interface Window {
    turnstile?: any;
    onTurnstileVerified?: (token: string) => void;
  }
}

// ===================== UTILS =====================
const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
function distPointToSegment2D(px: number, pz: number, x0: number, z0: number, x1: number, z1: number): number {
  const vx = x1 - x0, vz = z1 - z0;
  const wx = px - x0, wz = pz - z0;
  const vv = vx * vx + vz * vz;
  const t = vv > 0 ? clamp01((wx * vx + wz * vz) / vv) : 0;
  const dx = px - (x0 + vx * t), dz = pz - (z0 + vz * t);
  return Math.hypot(dx, dz);
}

function escHtml(s: string) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

// ===================== SERVICES =====================
class ApiService {
  async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "omit",
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  startSession(turnstileToken: string) {
    return this.post<{ sessionId: string }>(`${API_BASE}/start`, { turnstileToken });
  }

  batch(sessionId: string, d: number, s: number, l: number, levelMax: number) {
    return this.post(`${API_BASE}/batch`, {
      sessionId,
      dodgedDelta: d,
      shotDelta: s,
      lasersFiredDelta: l,
      levelMax
    });
  }

  finalize(sessionId: string, name: string) {
    return this.post<{ scores: any[]; score: number; level: number }>(`${API_BASE}/finalize`, {
      sessionId,
      name: name.slice(0, 24)
    });
  }
}

class LeaderboardService {
  listEl: HTMLOListElement;
  constructor(listId: string) {
    const el = document.getElementById(listId);
    if (!(el instanceof HTMLOListElement)) throw new Error("Leaderboard list not found");
    this.listEl = el;
  }

  setStatus(text: string) {
    this.listEl.innerHTML = `<li class="opacity-70">${escHtml(text)}</li>`;
  }

  render(scores: Array<{ name: string; score: number; level: number; date?: string | number }>) {
    if (!scores?.length) return this.setStatus("No scores yet. Be the first!");
    this.listEl.innerHTML = "";
    scores.forEach((e, i) => {
      const when = new Date(e.date || Date.now()).toLocaleDateString(undefined, { month: "short", day: "numeric" });
      const li = document.createElement("li");
      li.style.display = "grid";
      li.style.gridTemplateColumns = "2rem 1fr auto";
      li.style.gap = "0.5rem";
      li.innerHTML = `<span class="opacity-70">${i + 1}.</span><span class="name">${escHtml(e.name || "")}</span><span class="opacity-80">Score ${e.score} • L${e.level} • ${when}</span>`;
      this.listEl.appendChild(li);
    });
  }

  async refresh() {
    this.setStatus("Loading…");
    try {
      const res = await fetch(SCORES_API, { method: "GET", credentials: "omit" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { scores } = await res.json();
      this.render(scores);
    } catch (err) {
      console.error("Leaderboard load failed:", err);
      this.setStatus("Error loading leaderboard.");
    }
  }
}

class TurnstileClient {
  private widgetId: any = null;
  token: string = "";

  constructor() {
    window.onTurnstileVerified = (token: string) => (this.token = token || "");
    document.addEventListener("DOMContentLoaded", () => this.mount());
  }

  private mount() {
    if (this.widgetId) return;
    const tryRender = () => {
      if (!window.turnstile || typeof window.turnstile.render !== "function") {
        setTimeout(tryRender, 120);
        return;
      }
      try {
        this.widgetId = window.turnstile.render("#turnstile-target", {
          sitekey: TURNSTILE_SITE_KEY,
          size: "invisible",
          callback: (t: string) => (this.token = t || ""),
          "error-callback": () => (this.token = "")
        });
        try { window.turnstile.execute(this.widgetId); } catch {}
      } catch (e) {
        console.error("Turnstile render failed", e);
      }
    };
    tryRender();
  }

  async ensureToken(timeoutMs = 4000): Promise<string> {
    if (this.token) return this.token;
    if (window.turnstile && this.widgetId) {
      try { window.turnstile.execute(this.widgetId); } catch {}
    } else {
      this.mount();
    }
    const started = performance.now();
    return await new Promise((resolve, reject) => {
      const iv = setInterval(() => {
        if (this.token) { clearInterval(iv); resolve(this.token); }
        if (performance.now() - started > timeoutMs) { clearInterval(iv); reject(new Error("Turnstile timeout")); }
      }, 100);
    });
  }

  reset() {
    if (window.turnstile && this.widgetId) {
      try { window.turnstile.reset(this.widgetId); } catch {}
    }
    this.token = "";
  }
}

// ===================== GAME OBJECTS =====================
class Ship extends THREE.Group {
  isPlayer: boolean;
  constructor(isPlayer = true) {
    super();
    this.isPlayer = isPlayer;

    const hullMat = new THREE.MeshPhongMaterial({ color: 0x2a2f33, emissive: 0x0b0f10, shininess: 80, flatShading: true });
    const glowMat = new THREE.MeshPhongMaterial({ color: isPlayer ? 0x00ff99 : 0xff6666, emissive: isPlayer ? 0x006644 : 0x661111, emissiveIntensity: 0.7 });

    const halfSpan = SHIP_SPAN / 2, L = SHIP_LENGTH;
    const s = new THREE.Shape();
    s.moveTo(-halfSpan, 0.00);
    s.lineTo(-halfSpan * 0.45, 0.20 * L);
    s.lineTo(-halfSpan * 0.17, 0.28 * L);
    s.lineTo(0, 0.30 * L);
    s.lineTo(halfSpan * 0.17, 0.28 * L);
    s.lineTo(halfSpan * 0.45, 0.20 * L);
    s.lineTo(halfSpan, 0.00);
    s.lineTo(halfSpan * 0.55, -0.10 * L);
    s.lineTo(halfSpan * 0.20, -0.18 * L);
    s.lineTo(0, -0.22 * L);
    s.lineTo(-halfSpan * 0.20, -0.18 * L);
    s.lineTo(-halfSpan * 0.55, -0.10 * L);
    s.closePath();

    const wingGeo = new THREE.ExtrudeGeometry(s, { depth: 0.14, bevelEnabled: false, curveSegments: 4 });
    wingGeo.rotateX(Math.PI / 2); wingGeo.translate(0, 0.05, 0);
    this.add(new THREE.Mesh(wingGeo, hullMat));

    const canopy = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.55, 12), new THREE.MeshPhongMaterial({ color: 0x88ffee, transparent: true, opacity: 0.5 }));
    canopy.rotation.x = Math.PI / 2; canopy.position.set(0, 0.10, 0.18 * L); this.add(canopy);

    const stripGeo = new THREE.BoxGeometry(0.9, 0.02, 0.02);
    const leftStrip = new THREE.Mesh(stripGeo, glowMat); leftStrip.position.set(-halfSpan * 0.6, 0.06, 0.20 * L); leftStrip.rotation.y = -Math.PI * 0.05;
    const rightStrip = leftStrip.clone(); (rightStrip as any).material = glowMat; rightStrip.position.x = halfSpan * 0.6; rightStrip.rotation.y = Math.PI * 0.05;
    this.add(leftStrip, rightStrip);

    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.02, 0.24, 10), glowMat);
    exhaust.rotation.x = Math.PI / 2; exhaust.position.set(0, 0.02, -0.20 * L); this.add(exhaust);
  }
}

class Asteroid extends THREE.Mesh<THREE.DodecahedronGeometry, THREE.MeshPhongMaterial> {
  r: number;
  fast: boolean;
  constructor(size = 0.7, fast = false) {
    const geo = new THREE.DodecahedronGeometry(size, 0);
    const mat = new THREE.MeshPhongMaterial({ color: 0x8b6b4e, flatShading: true });
    super(geo, mat);
    this.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    this.r = size * 0.50;
    this.fast = fast;
  }
}

class Laser extends THREE.Mesh<THREE.BoxGeometry, THREE.MeshPhongMaterial> {
  prevZ: number;
  constructor(x: number, z: number) {
    const geo = new THREE.BoxGeometry(LASER_SIZE.x, LASER_SIZE.y, LASER_SIZE.z);
    const mat = new THREE.MeshPhongMaterial({ color: 0x00ff99, emissive: 0x006644, emissiveIntensity: 0.9 });
    super(geo, mat);
    this.position.set(x, 0, z);
    this.prevZ = this.position.z;
  }
}

class StarField extends THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial> {
  constructor() {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 2] = -Math.random() * 200;
    }
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({ color: 0xffffff, size: 0.06 });
    super(g, m);
  }

  update(speed: number, dtMul: number) {
    const attr = this.geometry.getAttribute("position") as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < STAR_COUNT; i++) {
      const idx = i * 3 + 2;
      arr[idx] += speed * 1.5 * dtMul;
      if (arr[idx] > 5) {
        arr[idx] = -200 - Math.random() * 100;
        arr[i * 3 + 0] = (Math.random() - 0.5) * 60;
        arr[i * 3 + 1] = (Math.random() - 0.5) * 40;
      }
    }
    attr.needsUpdate = true;
  }
}

// ===================== INPUT =====================
class InputManager {
  left = false;
  right = false;
  shootRequested = false;

  private touchStartX = 0;
  private touchStartY = 0;
  private touchStartTime = 0;

  private readonly SWIPE_THRESHOLD = 30;
  private readonly TAP_MAX_TIME = 300;
  private readonly TAP_MAX_MOVE = 20;

  constructor(private canvas: HTMLCanvasElement) {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);

    canvas.addEventListener("touchstart", this.onTouchStart, { passive: false });
    canvas.addEventListener("touchend", this.onTouchEnd, { passive: false });
  }

  dispose() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    this.canvas.removeEventListener("touchstart", this.onTouchStart as any);
    this.canvas.removeEventListener("touchend", this.onTouchEnd as any);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") this.left = true;
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") this.right = true;
    if (e.code === "Space" || e.key === " " || e.key === "Spacebar") this.shootRequested = true;
  };

  private onKeyUp = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") this.left = false;
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") this.right = false;
  };

  private onTouchStart = (ev: TouchEvent) => {
    ev.preventDefault();
    const t = ev.touches[0];
    this.touchStartX = t.clientX;
    this.touchStartY = t.clientY;
    this.touchStartTime = performance.now();
  };

  private onTouchEnd = (ev: TouchEvent) => {
    ev.preventDefault();
    const t = ev.changedTouches[0];
    const dx = t.clientX - this.touchStartX;
    const dy = t.clientY - this.touchStartY;
    const dist = Math.hypot(dx, dy);
    const dt = performance.now() - this.touchStartTime;

    if (Math.abs(dx) >= this.SWIPE_THRESHOLD && Math.abs(dx) >= Math.abs(dy)) {
      if (dx < 0) { this.left = true; this.right = false; setTimeout(() => (this.left = false), 20); }
      else { this.right = true; this.left = false; setTimeout(() => (this.right = false), 20); }
      return;
    }

    if (dt <= this.TAP_MAX_TIME && dist <= this.TAP_MAX_MOVE) this.shootRequested = true;
  };
}

// ===================== GAME CORE =====================
class Game {
  // DOM
  private container = document.getElementById("gameContainer") as HTMLDivElement;
  private canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
  private scoreBoard = document.getElementById("scoreBoard") as HTMLDivElement;
  private rowNotice = document.getElementById("rowNotice") as HTMLDivElement;
  private startModal = document.getElementById("startModal") as HTMLDivElement;
  private startButton = document.getElementById("startButton") as HTMLButtonElement;
  private startError = document.getElementById("startError") as HTMLDivElement;
  private gameOverModal = document.getElementById("gameOverModal") as HTMLDivElement;
  private restartButton = document.getElementById("restartButton") as HTMLButtonElement;
  private saveScoreButton = document.getElementById("saveScoreButton") as HTMLButtonElement;
  private nameInput = document.getElementById("playerNameInput") as HTMLInputElement;
  private finalScoreDisplay = document.getElementById("finalScore") as HTMLDivElement;
  private finalLevelDisplay = document.getElementById("finalLevel") as HTMLDivElement;
  private instructions = document.getElementById("instructions") as HTMLDivElement;
  private levelToast = document.getElementById("levelToast") as HTMLDivElement;
  private toastLevel = document.getElementById("toastLevel") as HTMLSpanElement;

  // Services
  private api = new ApiService();
  private lb = new LeaderboardService("leaderboardList");
  private turnstile = new TurnstileClient();

  // 3D
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  private starField = new StarField();
  private player = new Ship(true);

  // State
  private lanes: number[] = [-2.5, 0, 2.5];
  private currentLane = 1;
  private targetX = this.lanes[this.currentLane];
  private laneLerp = 0.15; // smoothing factor (exponential)

  private lasers: Laser[] = [];
  private obstacles: Asteroid[] = [];
  private laserAmmo = 3;

  private level = 1;
  private baseAsteroidsTarget = 10;
  private passedThisLevel = 0;
  private targetThisLevel = this.baseAsteroidsTarget;
  private totalPassed = 0;

  private score = 0;

  private speed = 0.2;          // base forward speed (scaled by dtMul)
  private spawnInterval = 70;   // frames at 120fps
  private spawnEverySec = this.spawnInterval / REFERENCE_FPS;
  private spawnTimerSec = 0;
  private extraSpawnChance = 0.0;

  private phase: "idle" | "play" | "transition_wait_clear" | "transition_corridor" = "idle";
  private corridorStartTime = 0;
  private paused = false;

  private serverSessionId = "";
  private queuedDodged = 0; private queuedShot = 0; private queuedLasersFired = 0;
  private lastBatchAtMs = 0; private hasSavedThisRun = false;

  private accumulator = 0; // for fixed-step logic
  private lastTs = performance.now();

  private input: InputManager;

  constructor() {
    this.scene.background = new THREE.Color(0x000000);
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    this.camera.position.set(0, 2.6, PLAYER_Z + 7.5);
    this.camera.lookAt(0, 0.5, -10);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const ambient = new THREE.AmbientLight(0xffffff, 0.6); this.scene.add(ambient);
    const dir = new THREE.DirectionalLight(0x88ffcc, 0.9); dir.position.set(5, 10, 5); this.scene.add(dir);

    this.scene.add(this.starField);

    this.player.position.set(this.lanes[this.currentLane], 0, PLAYER_Z);
    this.scene.add(this.player);

    this.input = new InputManager(this.canvas);

    // UI events
    this.startButton.addEventListener("click", () => this.onStartClicked());
    this.restartButton.addEventListener("click", () => this.restart().catch(console.error));
    this.saveScoreButton.addEventListener("click", () => this.onSaveScore());

    window.addEventListener("resize", () => this.onResize());
    window.addEventListener("keydown", (e) => { if (e.key.toLowerCase() === "p") this.togglePause(); });

    this.updateHud();
    this.loop();
  }

  // ===================== UI =====================
  private setRowNotice(text: string) {
    this.rowNotice.textContent = text;
    this.rowNotice.classList.remove("opacity-0");
    this.rowNotice.classList.add("opacity-100");
    (this.rowNotice as any)._timer && clearTimeout((this.rowNotice as any)._timer);
    (this.rowNotice as any)._timer = setTimeout(() => {
      this.rowNotice.classList.add("opacity-0");
      this.rowNotice.classList.remove("opacity-100");
    }, 1400);
  }

  private updateHud() {
    this.scoreBoard.textContent = `Lvl ${this.level} • Score: ${this.score} • Lasers: ${this.laserAmmo}/${LASER_MAX}`;
  }

  private showLevelToast() {
    this.toastLevel.textContent = String(this.level);
    this.levelToast.style.display = "block";
    setTimeout(() => (this.levelToast.style.display = "none"), 1000);
  }

  private togglePause() { this.paused = !this.paused; }

  // ===================== TURNSTILE + START =====================
  private async onStartClicked() {
    this.startError.textContent = "";
    this.startButton.disabled = true;
    try {
      await this.startGame();
    } catch (err) {
      console.error(err);
      this.startError.textContent = "Could not start (verification/API). Check site key & routes.";
    } finally {
      this.startButton.disabled = false;
    }
  }

  async startGame() {
    // ensure token
    await this.turnstile.ensureToken();
    const sess = await this.api.startSession(this.turnstile.token);
    this.serverSessionId = sess.sessionId || "";
    if (!this.serverSessionId) throw new Error("No session from API");
    this.turnstile.reset();

    // reset state
    this.lanes = [-2.5, 0, 2.5];
    this.currentLane = 1;
    this.targetX = this.lanes[this.currentLane];
    this.level = 1; this.passedThisLevel = 0; this.targetThisLevel = this.baseAsteroidsTarget; this.totalPassed = 0;
    this.score = 0; this.laserAmmo = 3; this.hasSavedThisRun = false;
    this.clearLasers(); this.clearObstacles();

    this.speed = 0.2; this.spawnInterval = 70; this.spawnEverySec = this.spawnInterval / REFERENCE_FPS; this.spawnTimerSec = 0; this.extraSpawnChance = 0.0;

    this.phase = "play"; this.corridorStartTime = 0;
    this.player.position.set(this.lanes[this.currentLane], 0, PLAYER_Z); this.player.rotation.z = 0;

    this.instructions.style.display = "block";
    this.startModal.style.display = "none";
    this.gameOverModal.style.display = "none";
    this.updateHud();
  }

  private clearLasers() { this.lasers.forEach(L => this.scene.remove(L)); this.lasers = []; }
  private clearObstacles() { this.obstacles.forEach(o => this.scene.remove(o)); this.obstacles = []; }

  private shootLaser() {
    if (this.phase !== "play" || this.laserAmmo <= 0) return;
    const L = new Laser(this.player.position.x, PLAYER_Z - 0.55);
    this.scene.add(L);
    this.lasers.push(L);
    this.laserAmmo--; this.queuedLasersFired++;
    this.updateHud();
  }

  private getPlayerRadius(): number {
    const spacing = this.lanes.length >= 2 ? Math.abs(this.lanes[1] - this.lanes[0]) : 2.5;
    const width = Math.min(SHIP_SPAN, spacing * 0.72);
    return width * 0.32; // tuned smaller to avoid "shoulder" clips
  }

  // ===================== LEVEL/DIFFICULTY =====================
  private beginLevelTransition() { this.phase = "transition_wait_clear"; }

  private applyLevelDifficulty() {
    const increments = Math.floor((this.level - 1) / 3);
    this.speed = Math.min(0.2 + increments * 0.015, 0.75);
    this.spawnInterval = Math.max(24, 70 - (this.level - 1) * 4);
    this.spawnEverySec = this.spawnInterval / REFERENCE_FPS;
    this.extraSpawnChance = Math.min(0.05 + (this.level - 1) * 0.03, 0.45);
  }

  private startClearCorridor() {
    this.level++; this.passedThisLevel = 0; this.targetThisLevel = this.baseAsteroidsTarget + (this.level - 1) * 10;
    this.laserAmmo = Math.min(LASER_MAX, this.laserAmmo + 1);

    this.showLevelToast();

    const prevX = this.player.position.x;
    let rowsAdded = 0;
    if (this.level === 4) { this.lanes = [-5, -2.5, 0, 2.5, 5]; rowsAdded = 2; }
    else if (this.level === 10) { this.lanes = [-7.5, -5, -2.5, 0, 2.5, 5, 7.5]; rowsAdded = 2; }

    if (rowsAdded > 0) {
      this.setRowNotice(`+${rowsAdded} Rows added`);
      // pick the nearest lane to current x; do NOT recenter
      let idx = 0, best = Infinity;
      for (let i = 0; i < this.lanes.length; i++) {
        const d = Math.abs(this.lanes[i] - prevX);
        if (d < best) { best = d; idx = i; }
      }
      this.currentLane = idx; this.targetX = this.lanes[this.currentLane];
    } else {
      this.targetX = this.lanes[this.currentLane];
    }

    this.applyLevelDifficulty();
    this.corridorStartTime = performance.now();
    this.phase = "transition_corridor";
    this.updateHud();
  }

  // ===================== LOOP =====================
  private loop = () => {
    requestAnimationFrame(this.loop);

    const now = performance.now();
    let dt = (now - this.lastTs) / 1000; // seconds
    this.lastTs = now;
    if (dt > 0.25) dt = 0.25; // clamp huge tab-switch gaps

    // render starfield every frame for smoothness
    const dtMulForStars = (dt * REFERENCE_FPS);
    this.starField.update(this.speed, dtMulForStars);

    if (!this.paused && this.phase !== "idle") {
      this.accumulator += dt;
      while (this.accumulator >= FIXED_DT) {
        this.step(FIXED_DT);
        this.accumulator -= FIXED_DT;
      }
    }

    // camera follow & render
    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, this.player.position.x * 0.5, 0.08);
    this.camera.lookAt(this.player.position.x, 0.4, -10);
    this.renderer.render(this.scene, this.camera);
  };

  private step(dtSec: number) {
    const dtMul = dtSec * REFERENCE_FPS; // 1 for fixed-step, but we keep the multiplier for tuning carry-over

    // player lane interpolation & input
    if (this.phase === "play" || this.phase === "transition_corridor") {
      if (this.input.left) {
        const newLane = Math.max(0, this.currentLane - 1);
        if (newLane !== this.currentLane) { this.currentLane = newLane; this.targetX = this.lanes[this.currentLane]; }
        this.input.left = false; // consume discrete lane move
      } else if (this.input.right) {
        const newLane = Math.min(this.lanes.length - 1, this.currentLane + 1);
        if (newLane !== this.currentLane) { this.currentLane = newLane; this.targetX = this.lanes[this.currentLane]; }
        this.input.right = false;
      }
      if (this.input.shootRequested) { this.shootLaser(); this.input.shootRequested = false; }

      const lerpFactor = 1 - Math.pow(1 - this.laneLerp, dtMul);
      this.player.position.x += (this.targetX - this.player.position.x) * lerpFactor;
      const diff = this.targetX - this.player.position.x;
      this.player.rotation.z = THREE.MathUtils.clamp(diff * 0.12, -0.2, 0.2);
    }

    // spawning & transitions
    if (this.phase === "play") {
      this.spawnTimerSec += dtSec;
      while (this.spawnTimerSec >= this.spawnEverySec) {
        this.spawnWave();
        this.spawnTimerSec -= this.spawnEverySec;
      }
    } else if (this.phase === "transition_wait_clear") {
      if (this.obstacles.length === 0) this.startClearCorridor();
    } else if (this.phase === "transition_corridor") {
      if (performance.now() - this.corridorStartTime >= CLEAR_CORRIDOR_MS) this.phase = "play";
    }

    // updates
    this.updateLasers(dtMul);
    this.updateObstacles(dtMul);

    // batch scoring every ~10s if needed
    if (this.serverSessionId) {
      const needSend = (this.queuedDodged >= 5) || (this.queuedShot >= 1) || (this.queuedLasersFired >= 1);
      if ((performance.now() - this.lastBatchAtMs > 10000) && needSend) {
        const d = this.queuedDodged, s = this.queuedShot, l = this.queuedLasersFired;
        this.queuedDodged = this.queuedShot = this.queuedLasersFired = 0; this.lastBatchAtMs = performance.now();
        this.api.batch(this.serverSessionId, d, s, l, this.level).catch(err => {
          console.error("batch failed", err);
          this.queuedDodged += d; this.queuedShot += s; this.queuedLasersFired += l;
        });
      }
    }
  }

  private spawnWave() {
    this.spawnAsteroidInLane();
    if (Math.random() < this.extraSpawnChance) this.spawnAsteroidInLane();
  }

  private spawnAsteroidInLane() {
    const baseSize = 0.6 + Math.min((this.level - 1) * 0.08, 0.8);
    const size = baseSize * (0.85 + Math.random() * 0.3);
    const laneIndex = Math.floor(Math.random() * this.lanes.length);
    const fast = Math.random() < Math.min(0.05 + this.level * 0.01, 0.25);
    const rock = new Asteroid(size, fast);
    rock.position.set(this.lanes[laneIndex], 0, OBSTACLE_START_Z);
    this.scene.add(rock);
    this.obstacles.push(rock);
  }

  private updateLasers(dtMul: number) {
    for (let li = this.lasers.length - 1; li >= 0; li--) {
      const L = this.lasers[li];
      const prevZ = L.prevZ;
      L.position.z -= LASER_SPEED * dtMul;

      if (L.position.z < OBSTACLE_START_Z - 20) { this.scene.remove(L); this.lasers.splice(li, 1); continue; }

      let hitHandled = false;
      for (let oi = this.obstacles.length - 1; oi >= 0; oi--) {
        const o = this.obstacles[oi];
        const xL = L.position.x, xO = o.position.x;
        const dx = xL - xO;
        const zL0 = prevZ, zL1 = L.position.z;
        const zO0 = o.position.z;
        const zSpeedO = (o.fast ? this.speed * 1.4 : this.speed) * dtMul;
        const zO1 = zO0 + zSpeedO;

        // swept test along z between (zL0->zL1) vs asteroid moving (zO0->zO1)
        const a = zL0 - zO0;
        const b = (zL1 - zL0) - (zO1 - zO0);
        const tStar = b !== 0 ? clamp01(-a / b) : 0;
        const dzAtMin = a + b * tStar;
        const effR = (o.r ?? 0.5) + (LASER_SIZE.z * 0.5) + 0.12;
        const hit = (dx * dx + dzAtMin * dzAtMin) <= (effR * effR);

        if (hit) {
          this.scene.remove(o); this.obstacles.splice(oi, 1);
          this.scene.remove(L); this.lasers.splice(li, 1);
          hitHandled = true;
          this.score += POINTS_PER_ASTEROID_SHOT;
          this.passedThisLevel++; this.totalPassed++; this.queuedShot++;

          if (this.phase === "play" && this.passedThisLevel >= this.targetThisLevel) this.beginLevelTransition();
          this.updateHud();
          break;
        }
      }

      if (!hitHandled) L.prevZ = L.position.z;
    }
  }

  private updateObstacles(dtMul: number) {
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const o = this.obstacles[i];
      const zSpeed = (o.fast ? this.speed * 1.4 : this.speed) * dtMul;
      const z0 = o.position.z; const z1 = z0 + zSpeed;

      const pX = this.player.position.x, pZ = this.player.position.z;
      const dist = distPointToSegment2D(pX, pZ, o.position.x, z0, o.position.x, z1);
      const pR = this.getPlayerRadius(); const oR = (o.r ?? 0.5); const GRACE = 0.06; // smaller overlap for fewer false positives

      if (dist <= Math.max(0, pR + oR - GRACE)) { this.endGame(); return; }

      o.position.z = z1;
      o.rotation.x += (0.01 + this.speed * 0.05) * dtMul;
      o.rotation.y += (0.02 + this.speed * 0.05) * dtMul;

      if (o.position.z > DESPAWN_Z) {
        this.scene.remove(o); this.obstacles.splice(i, 1);
        this.score += POINTS_PER_ASTEROID_DODGED;
        this.passedThisLevel++; this.totalPassed++; this.queuedDodged++;
        if (this.phase === "play" && this.passedThisLevel >= this.targetThisLevel) this.beginLevelTransition();
        this.updateHud();
      }
    }
  }

  private async endGame() {
    this.phase = "idle";
    this.finalScoreDisplay.textContent = `Score: ${this.score}`;
    this.finalLevelDisplay.textContent = `Final Level: ${this.level}`;
    this.hasSavedThisRun = false;

    if (this.saveScoreButton) {
      this.saveScoreButton.disabled = false;
      this.saveScoreButton.textContent = "Save Score";
      this.saveScoreButton.classList.remove("opacity-60");
    }

    await this.lb.refresh();
    this.gameOverModal.style.display = "block";
    this.instructions.style.display = "none";
  }

  private async restart() { this.gameOverModal.style.display = "none"; await this.startGame(); }

  private async onSaveScore() {
    if (this.hasSavedThisRun) return;
    const name = (this.nameInput?.value || "").trim();
    if (!name) { this.nameInput?.focus(); this.nameInput.placeholder = "Enter a name to save"; return; }
    if (!this.serverSessionId) { this.lb.setStatus("Session expired. Restart and try again."); return; }

    this.saveScoreButton.disabled = true; this.saveScoreButton.textContent = "Saving…";
    try {
      if (this.serverSessionId && (this.queuedDodged || this.queuedShot || this.queuedLasersFired)) {
        const d = this.queuedDodged, s = this.queuedShot, l = this.queuedLasersFired; this.queuedDodged = this.queuedShot = this.queuedLasersFired = 0;
        await this.api.batch(this.serverSessionId, d, s, l, this.level);
      }
      const { scores, score: serverScore, level: serverLevel } = await this.api.finalize(this.serverSessionId, name);
      this.hasSavedThisRun = true;
      this.saveScoreButton.textContent = "Saved"; this.saveScoreButton.classList.add("opacity-60");
      this.finalScoreDisplay.textContent = `Score: ${serverScore}`;
      this.finalLevelDisplay.textContent = `Final Level: ${serverLevel}`;
      this.lb.render(scores);
    } catch (err) {
      console.error("Save failed:", err);
      this.saveScoreButton.disabled = false; this.saveScoreButton.textContent = "Retry Save";
    }
  }

  private onResize() {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
}

// ===================== BOOT =====================
function boot() {
  // Ensure the hidden turnstile mount exists (same as your HTML)
  let mount = document.getElementById("turnstile-target");
  if (!mount) {
    mount = document.createElement("div");
    mount.id = "turnstile-target";
    mount.style.position = "absolute"; mount.style.left = "-9999px"; mount.style.top = "-9999px";
    document.body.appendChild(mount);
  }
  new Game();
}

document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", boot) : boot();
