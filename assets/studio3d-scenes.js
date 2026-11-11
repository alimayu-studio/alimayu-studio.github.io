// Alimayu Studio — WebGL scenes. Loaded on demand by studio3d.js.
// Scenes: stage (speaking), constellation (speaking), boardroom (board service), monogram (closing calls to action).
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js';

const C = {
  night: 0x141830, navy: 0x1E2346, navy2: 0x2A3060, gold: 0xB08D57,
  goldLight: 0xD2B585, cream: 0xE7DBC5, teal: 0x2F7A78, tealLight: 0x7FC4BF
};
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const lerp = (a, b, t) => a + (b - a) * t;

// ---------- shared plumbing ----------
function makeRenderer(canvas) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  r.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 760 ? 1.5 : 2));
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 1.05;
  return r;
}

// Run a render loop only while the canvas is on screen.
function loop(canvas, renderer, camera, frame) {
  let visible = false, raf = 0, last = performance.now();
  function size() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  function tick(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    frame(dt, now / 1000);
    if (visible) raf = requestAnimationFrame(tick);
  }
  new ResizeObserver(size).observe(canvas); size();
  new IntersectionObserver(es => {
    visible = es[0].isIntersecting;
    cancelAnimationFrame(raf);
    if (visible) { last = performance.now(); raf = requestAnimationFrame(tick); }
  }, { rootMargin: '120px' }).observe(canvas);
  frame(0, performance.now() / 1000);
}

// A soft studio environment for metal reflections, built without loaders.
function studioEnv(renderer, roomColor = 0x2a2f4d) {
  const s = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.BoxGeometry(10, 8, 10), new THREE.MeshBasicMaterial({ color: roomColor, side: THREE.BackSide }));
  s.add(room);
  const panel = (w, h, x, y, z, ry, k, col = 0xffffff) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.rotation.y = ry; s.add(m);
  };
  panel(4, 2, 0, 3.6, 0, 0, 6); s.children.at(-1).rotation.x = Math.PI / 2;
  panel(3, 3, -4.9, .5, 0, Math.PI / 2, 3.2, 0xfff1d6);
  panel(2, 4, 4.9, 1, -1, -Math.PI / 2, 2.2, 0xdbe6ff);
  panel(5, 1, 0, -1, -4.9, 0, 1.4, 0xffe2b0);
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(s, .04).texture; pm.dispose();
  return tex;
}

// Solid navy shape with gold drafting lines: the atelier look.
const lineMat = new THREE.LineBasicMaterial({ color: C.goldLight, transparent: true, opacity: .85 });
function drafted(geo, mat, edges = true) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(geo, mat); g.add(m);
  if (edges) g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 28), lineMat));
  return g;
}
function lights(scene, warm = 1) {
  scene.add(new THREE.HemisphereLight(0xf3e9d6, 0x141830, .9));
  const k = new THREE.DirectionalLight(0xfff0d8, 1.6 * warm); k.position.set(4, 8, 6); scene.add(k);
  const r = new THREE.DirectionalLight(0x7fc4bf, .7); r.position.set(-6, 3, -4); scene.add(r);
}
function glowTexture(inner = 'rgba(255,236,200,1)', mid = 'rgba(210,181,133,.55)') {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, inner); g.addColorStop(.25, mid); g.addColorStop(1, 'rgba(210,181,133,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function sectionProgress(el, start = .85, end = .15) {
  // 0 when the element top sits at start*vh, 1 when its bottom reaches end*vh.
  const r = el.getBoundingClientRect(), vh = innerHeight;
  const a = r.top - vh * start, b = r.bottom - vh * end;
  return clamp(-a / (b - a + .0001) * (1));
}

// ---------- 1. The changing stage (speaking page) ----------
function stage(root) {
  const canvas = root.querySelector('canvas');
  const panels = [...root.querySelectorAll('[data-room]')];
  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(C.night, 16, 34);
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
  lights(scene);

  const navyMat = new THREE.MeshStandardMaterial({ color: C.navy, roughness: .7, metalness: .1 });
  const navy2Mat = new THREE.MeshStandardMaterial({ color: C.navy2, roughness: .6, metalness: .15 });
  const goldMat = new THREE.MeshStandardMaterial({ color: C.gold, roughness: .35, metalness: .8 });
  const creamMat = new THREE.MeshStandardMaterial({ color: C.cream, roughness: .8 });

  // Floor and permanent stage
  const grid = new THREE.PolarGridHelper(16, 24, 10, 64, C.gold, C.gold);
  grid.material.transparent = true; grid.material.opacity = .14; scene.add(grid);
  const platform = drafted(new THREE.CylinderGeometry(3.4, 3.6, .4, 64, 1), navy2Mat);
  platform.position.y = .2; scene.add(platform);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(3.42, .035, 8, 96), goldMat);
  rim.rotation.x = Math.PI / 2; rim.position.y = .4; scene.add(rim);
  const lectern = drafted(new THREE.CylinderGeometry(.42, .62, 1.5, 4, 1), navyMat);
  lectern.rotation.y = Math.PI / 4; lectern.position.set(0, 1.15, -.6); scene.add(lectern);
  const lecternTop = drafted(new THREE.BoxGeometry(1.05, .08, .7), goldMat, false);
  lecternTop.position.set(0, 1.95, -.55); lecternTop.rotation.x = -.25; scene.add(lecternTop);
  const seal = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .03, 32), goldMat);
  seal.rotation.x = Math.PI / 2; seal.position.set(0, 1.35, -.04); scene.add(seal);

  const sets = [new THREE.Group(), new THREE.Group(), new THREE.Group(), new THREE.Group()];
  sets.forEach(s => scene.add(s));
  const add = (set, obj, delay = 0) => { obj.userData.base = obj.position.clone(); obj.userData.d = delay; set.add(obj); return obj; };

  // Room 0: keynote hall — curved rows of seats and spotlights
  const seatGeo = new THREE.BoxGeometry(.5, .45, .5), backGeo = new THREE.BoxGeometry(.5, .55, .1);
  for (let row = 0; row < 5; row++) {
    const rad = 5.6 + row * 1.15, n = 9 + row * 2;
    for (let i = 0; i < n; i++) {
      const a = (i / (n - 1) - .5) * 1.75;
      const chair = new THREE.Group();
      chair.add(drafted(seatGeo, navyMat));
      const back = drafted(backGeo, navyMat); back.position.set(0, .45, .22); chair.add(back);
      chair.position.set(Math.sin(a) * rad, .23 + row * .18, Math.cos(a) * rad);
      chair.rotation.y = a;
      add(sets[0], chair, row * .12 + Math.abs(i / (n - 1) - .5) * .2);
    }
  }
  const coneMat = new THREE.MeshBasicMaterial({ color: C.goldLight, transparent: true, opacity: .12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  [-1.6, 0, 1.6].forEach((x, i) => {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.25, 7, 40, 1, true), coneMat);
    cone.position.set(x * .7, 4.1, -.4); cone.rotation.z = -x * .07;
    add(sets[0], cone, .2 + i * .08);
  });

  // Room 1: broadcast studio — cameras, light truss, big screen
  function tvCamera(x, z, ry) {
    const g = new THREE.Group();
    [-1, 1, 0].forEach((s, k) => { const leg = drafted(new THREE.CylinderGeometry(.03, .03, 1.7, 6), goldMat, false); leg.position.set(s * .32, .8, k === 2 ? -.35 : .18); leg.rotation.z = -s * .2; leg.rotation.x = k === 2 ? .2 : -.1; g.add(leg); });
    const body = drafted(new THREE.BoxGeometry(.55, .5, 1), navyMat); body.position.set(0, 1.85, 0); g.add(body);
    const lens = drafted(new THREE.CylinderGeometry(.2, .24, .45, 24), navy2Mat); lens.rotation.x = Math.PI / 2; lens.position.set(0, 1.85, -.7); g.add(lens);
    const tally = new THREE.Mesh(new THREE.SphereGeometry(.05, 12, 12), new THREE.MeshBasicMaterial({ color: 0xff5a4a })); tally.position.set(0, 2.15, -.3); g.add(tally);
    g.position.set(x, 0, z); g.rotation.y = ry; return g;
  }
  add(sets[1], tvCamera(-3.4, 4.2, -.65), .05);
  add(sets[1], tvCamera(3.4, 4.2, .65), .15);
  add(sets[1], tvCamera(0, 5.6, 0), .25);
  const screen = new THREE.Group();
  const frame = drafted(new THREE.BoxGeometry(7.2, 3.9, .18), navyMat); screen.add(frame);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 3.5), new THREE.MeshBasicMaterial({ color: C.teal })); glass.position.z = .1; screen.add(glass);
  const stripe = new THREE.Mesh(new THREE.PlaneGeometry(6.8, .45), new THREE.MeshBasicMaterial({ color: C.navy })); stripe.position.set(0, -1.15, .11); screen.add(stripe);
  const stripeGold = new THREE.Mesh(new THREE.PlaneGeometry(2.2, .45), new THREE.MeshBasicMaterial({ color: C.gold })); stripeGold.position.set(-2.3, -1.15, .12); screen.add(stripeGold);
  screen.position.set(0, 3.1, -4.6); add(sets[1], screen, .1);
  const truss = drafted(new THREE.BoxGeometry(9, .22, .22), navyMat); truss.position.set(0, 5.6, 1); add(sets[1], truss, .3);
  for (let i = 0; i < 5; i++) {
    const can = drafted(new THREE.CylinderGeometry(.16, .22, .45, 16), goldMat, false);
    can.position.set(-3.2 + i * 1.6, 5.25, 1); can.rotation.x = .5; add(sets[1], can, .32 + i * .04);
  }

  // Room 2: the dais — curved hearing table, nameplates, the seal
  const daisR = 4.7;
  for (let i = 0; i < 9; i++) {
    const a = Math.PI + (i / 8 - .5) * 1.9;
    const seg = new THREE.Group();
    const desk = drafted(new THREE.BoxGeometry(1.2, .95, .7), navyMat); desk.position.y = .95; seg.add(desk);
    const top = drafted(new THREE.BoxGeometry(1.25, .06, .78), goldMat, false); top.position.y = 1.45; seg.add(top);
    const plate = drafted(new THREE.BoxGeometry(.55, .16, .04), creamMat, false); plate.position.set(0, 1.56, .3); plate.rotation.x = -.35; seg.add(plate);
    const mic = drafted(new THREE.CylinderGeometry(.012, .012, .45, 6), goldMat, false); mic.position.set(.3, 1.7, .2); mic.rotation.x = .5; seg.add(mic);
    const chairB = drafted(new THREE.BoxGeometry(.6, 1.1, .12), navy2Mat); chairB.position.set(0, 1.6, -.6); seg.add(chairB);
    const plinth = drafted(new THREE.BoxGeometry(1.25, .48, 1.6), navy2Mat); plinth.position.set(0, .24, -.2); seg.add(plinth);
    seg.position.set(Math.sin(a) * daisR, 0, Math.cos(a) * daisR - .6);
    seg.rotation.y = a + Math.PI;
    add(sets[2], seg, i * .05);
  }
  const wallSeal = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, .12, 64), goldMat); disc.rotation.x = Math.PI / 2; wallSeal.add(disc);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.85, .03, 8, 64), new THREE.MeshStandardMaterial({ color: C.navy })); ring.position.z = .07; wallSeal.add(ring);
  wallSeal.position.set(0, 4.3, -6.4); add(sets[2], wallSeal, .4);

  // Room 3: any room in the world — a drafted globe with gold pins
  const globe = new THREE.Group();
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(2.6, 48, 32), new THREE.MeshStandardMaterial({ color: C.navy, roughness: .5, metalness: .2, transparent: true, opacity: .92 }));
  globe.add(sphere);
  const latLong = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.SphereGeometry(2.62, 24, 12), 1), new THREE.LineBasicMaterial({ color: C.goldLight, transparent: true, opacity: .45 }));
  globe.add(latLong);
  const pinMat = new THREE.MeshBasicMaterial({ color: 0xffe2b0 });
  // lat, lon: North Carolina, Nevada, Ireland, Kenya, Namibia, Indonesia, Malaysia, Canada, Brazil
  [[35.6, -79], [39, -117], [53, -8], [-1, 37], [-22, 17], [-2, 118], [4, 102], [56, -106], [-10, -52]].forEach(([la, lo]) => {
    const phi = (90 - la) * Math.PI / 180, th = (lo + 180) * Math.PI / 180;
    const pin = new THREE.Mesh(new THREE.SphereGeometry(.07, 12, 12), pinMat);
    pin.position.set(-2.66 * Math.sin(phi) * Math.cos(th), 2.66 * Math.cos(phi), 2.66 * Math.sin(phi) * Math.sin(th));
    globe.add(pin);
  });
  globe.position.set(0, 3.6, -5.2); add(sets[3], globe, .05);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(210,181,133,.5)', 'rgba(210,181,133,.18)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.scale.set(9, 9, 1); halo.position.copy(globe.position); halo.position.z -= 1; add(sets[3], halo, 0);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 3; j++) {
      const desk = drafted(new THREE.BoxGeometry(1.3, .7, .6), navyMat);
      desk.position.set(-2.6 + i * 1.75, .35, 4.6 + j * 1.3);
      add(sets[3], desk, .1 + (i + j) * .05);
    }
  }

  // Scroll state
  let t = 0, tSmooth = 0;
  function readScroll() {
    const mid = innerHeight * .55; let best = 0, bestD = 1e9;
    const centers = panels.map(p => { const r = p.getBoundingClientRect(); return (r.top + r.bottom) / 2; });
    centers.forEach((c, i) => { const d = Math.abs(c - mid); if (d < bestD) { bestD = d; best = i; } });
    // continuous index between neighbours
    const i = best, c = centers[i];
    const j = c > mid ? i - 1 : i + 1;
    if (j >= 0 && j < centers.length) {
      const span = Math.abs(centers[j] - c) || 1;
      t = i + (j - i) * clamp(Math.abs(c - mid) / span);
    } else t = i;
    panels.forEach((p, k) => p.classList.toggle('is-on', k === Math.round(t)));
  }
  addEventListener('scroll', readScroll, { passive: true }); readScroll();

  let px = 0, py = 0;
  root.addEventListener('pointermove', e => { const r = root.getBoundingClientRect(); px = (e.clientX - r.left) / r.width - .5; py = (e.clientY - r.top) / r.height - .5; });

  loop(canvas, renderer, camera, (dt, time) => {
    tSmooth = REDUCED ? t : lerp(tSmooth, t, 1 - Math.pow(.0015, dt));
    sets.forEach((set, i) => {
      const w = clamp(1 - Math.abs(tSmooth - i));
      set.visible = w > .002;
      set.children.forEach(o => {
        const k = ease(clamp((w * 1.35) - o.userData.d));
        o.position.y = o.userData.base.y - (1 - k) * 3.2;
        o.scale.setScalar(.001 + k * .999);
      });
    });
    globe.rotation.y = time * (REDUCED ? 0 : .12);
    const ang = -.32 + tSmooth * .2 + px * .12;
    const rad = 15.5 * (camera.aspect < 1.2 ? 1.2 / Math.max(.55, camera.aspect) : 1);
    camera.position.set(Math.sin(ang) * rad, 6.4 - py * .8, Math.cos(ang) * rad);
    camera.lookAt(0, 1.9, -.8);
    renderer.render(scene, camera);
  });
}

// ---------- 2. Topic constellation (speaking page) ----------
function constellation(root) {
  const canvas = root.querySelector('canvas');
  const labels = [...root.querySelectorAll('[data-topic]')];
  const panel = root.querySelector('.const-panel');
  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 100);
  camera.position.set(0, 0, 10.5);
  lights(scene);
  const world = new THREE.Group(); scene.add(world);

  // Background stars
  const starGeo = new THREE.BufferGeometry(), N = 420, arr = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { const v = new THREE.Vector3().randomDirection().multiplyScalar(7 + Math.random() * 9); arr.set([v.x, v.y, v.z], i * 3); }
  starGeo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: C.cream, size: .045, transparent: true, opacity: .55 }));
  scene.add(stars);

  // Center: a faceted gold core
  const env = studioEnv(renderer);
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(.55, 0), new THREE.MeshStandardMaterial({ color: 0xC9A46C, metalness: 1, roughness: .25, envMap: env, flatShading: true }));
  world.add(core);
  const coreGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  coreGlow.scale.set(3.2, 3.2, 1); world.add(coreGlow);

  // Topic nodes on a sphere
  const n = labels.length, R = 3.1, nodes = [];
  const tex = glowTexture();
  labels.forEach((el, i) => {
    const y = 1 - (i + .5) / n * 2, r = Math.sqrt(1 - y * y), th = i * Math.PI * (3 - Math.sqrt(5));
    const p = new THREE.Vector3(Math.cos(th) * r, y * .82, Math.sin(th) * r).multiplyScalar(R);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    s.position.copy(p); s.scale.set(.9, .9, 1); world.add(s);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(.08, 16, 16), new THREE.MeshBasicMaterial({ color: 0xfff1d6 })); dot.position.copy(p); world.add(dot);
    nodes.push({ el, p, s });
  });
  const lineGeo = new THREE.BufferGeometry(), seg = [];
  nodes.forEach((a, i) => { seg.push(0, 0, 0, a.p.x, a.p.y, a.p.z); nodes.forEach((b, j) => { if (j > i && a.p.distanceTo(b.p) < R * 1.25) seg.push(a.p.x, a.p.y, a.p.z, b.p.x, b.p.y, b.p.z); }); });
  lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(seg, 3));
  world.add(new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({ color: C.goldLight, transparent: true, opacity: .32 })));
  const orbit = new THREE.Mesh(new THREE.TorusGeometry(R * 1.02, .006, 4, 160), new THREE.MeshBasicMaterial({ color: C.goldLight, transparent: true, opacity: .35 }));
  orbit.rotation.x = Math.PI / 2.3; world.add(orbit);

  // Rotation state (yaw, pitch) with drag and focus
  let yaw = .4, pitch = .15, tYaw = yaw, tPitch = pitch, active = -1, dragging = false, lastX = 0, lastY = 0, idle = 0;
  const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
  function focus(i, scroll) {
    active = i;
    const d = nodes[i].p;
    tYaw = Math.atan2(-d.x, d.z);
    tPitch = Math.atan2(d.y, Math.hypot(d.x, d.z));
    yaw = tYaw - wrap(tYaw - yaw); // shortest way round
    labels.forEach((l, k) => l.setAttribute('aria-pressed', k === i ? 'true' : 'false'));
    const src = nodes[i].el.dataset;
    panel.querySelector('.cp-title').textContent = nodes[i].el.textContent.trim();
    panel.querySelector('.cp-hook').textContent = src.hook || '';
    panel.querySelector('.cp-best').textContent = src.best || '';
    const ask = panel.querySelector('.cp-ask');
    ask.href = 'mailto:info@alimayu.studio?subject=' + encodeURIComponent('Speaking request: ' + nodes[i].el.textContent.trim()) + '&body=' + encodeURIComponent('Date:\nAudience:\nFormat:\nLocation:\nBudget:\n');
    const more = panel.querySelector('.cp-more');
    more.href = '#' + (src.card || '');
    panel.classList.remove('flash'); void panel.offsetWidth; panel.classList.add('flash');
    idle = 0;
  }
  labels.forEach((l, i) => l.addEventListener('click', () => focus(i)));
  canvas.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => {
    if (!dragging) return;
    tYaw += (e.clientX - lastX) * .008; tPitch = clamp(tPitch + (e.clientY - lastY) * .006, -1.1, 1.1);
    lastX = e.clientX; lastY = e.clientY; idle = 0;
  });
  const up = () => { dragging = false; };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  focus(0);

  const v = new THREE.Vector3();
  loop(canvas, renderer, camera, (dt, time) => {
    idle += dt;
    if (!REDUCED && !dragging && idle > 6) tYaw += dt * .12;
    const k = REDUCED ? 1 : 1 - Math.pow(.004, dt);
    yaw = lerp(yaw, tYaw, k); pitch = lerp(pitch, tPitch, k);
    camera.position.z = camera.aspect < 1.1 ? 12.6 : 10.5;
    world.rotation.set(pitch, yaw, 0, 'XYZ');
    core.rotation.y = time * .4; core.rotation.x = time * .2;
    stars.rotation.y = yaw * .15;
    renderer.render(scene, camera);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    nodes.forEach((nd, i) => {
      v.copy(nd.p).applyMatrix4(world.matrixWorld);
      const depth = clamp((v.z + R) / (2 * R)); // 0 back, 1 front
      const sc = .55 + depth * .55;
      nd.s.scale.setScalar((i === active ? 1.5 : .85) * (.7 + depth * .5));
      v.project(camera);
      const x = (v.x * .5 + .5) * w, y = (-v.y * .5 + .5) * h;
      nd.el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${sc.toFixed(3)})`;
      nd.el.style.opacity = (.35 + depth * .65).toFixed(3);
      nd.el.style.zIndex = Math.round(depth * 100);
    });
  });
}

// ---------- 3. Boardroom assembly (board service page) ----------
function boardroom(root) {
  const canvas = root.querySelector('canvas');
  const tags = [...root.querySelectorAll('[data-seat]')];
  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 100);
  lights(scene, 1.1);
  const env = studioEnv(renderer);
  const navyMat = new THREE.MeshStandardMaterial({ color: C.navy2, roughness: .55, metalness: .2, envMap: env, envMapIntensity: .5 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xC9A46C, roughness: .28, metalness: 1, envMap: env });
  const floor = new THREE.PolarGridHelper(9, 16, 6, 64, C.gold, C.gold);
  floor.material.transparent = true; floor.material.opacity = .16; scene.add(floor);

  const table = new THREE.Group();
  const topGeo = new THREE.CylinderGeometry(1, 1, .16, 96); topGeo.scale(3.3, 1, 1.55);
  const top = drafted(topGeo, navyMat); top.position.y = .95; table.add(top);
  const inlay = new THREE.Mesh(new THREE.TorusGeometry(1, .012, 6, 160), goldMat); inlay.scale.set(2.9, 1.35, 1); inlay.rotation.x = Math.PI / 2; inlay.position.y = 1.04; table.add(inlay);
  const pedGeo = new THREE.CylinderGeometry(.9, 1.1, .85, 48); pedGeo.scale(2.2, 1, .8);
  const ped = drafted(pedGeo, navyMat); ped.position.y = .45; table.add(ped);
  const sealDisc = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .04, 64), goldMat); sealDisc.position.y = 1.05; table.add(sealDisc);
  scene.add(table);

  const chairs = [], N = 15, ax = 4.15, az = 2.45;
  const seatGeo = new THREE.BoxGeometry(.6, .12, .6), backGeo = new THREE.BoxGeometry(.6, .8, .1), legGeo = new THREE.CylinderGeometry(.05, .07, .5, 8);
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 + Math.PI / 2;
    const c = new THREE.Group();
    const seat = drafted(seatGeo, navyMat); seat.position.y = .55; c.add(seat);
    const back = drafted(backGeo, navyMat); back.position.set(0, 1, .28); c.add(back);
    const leg = new THREE.Mesh(legGeo, goldMat); leg.position.y = .25; c.add(leg);
    const glow = new THREE.Mesh(new THREE.TorusGeometry(.32, .015, 6, 40), goldMat); glow.rotation.x = Math.PI / 2; glow.position.y = .02; c.add(glow);
    const x = Math.cos(a) * ax, z = Math.sin(a) * az;
    c.userData = { home: new THREE.Vector3(x, 0, z), from: new THREE.Vector3(x * 2.4, 3.5 + (i % 3), z * 2.4), a };
    c.lookAt(0, 0, 0); c.rotateY(Math.PI);
    chairs.push(c); scene.add(c);
  }

  let p = 0, pS = 0, px = 0;
  const stageEl = root.querySelector('.board3d-stage') || root;
  const read = () => { p = sectionProgress(stageEl, .95, .92); };
  addEventListener('scroll', read, { passive: true }); read();
  root.addEventListener('pointermove', e => { const r = root.getBoundingClientRect(); px = (e.clientX - r.left) / r.width - .5; });
  const v = new THREE.Vector3();
  const counter = root.querySelector('[data-seat-count]');

  loop(canvas, renderer, camera, (dt, time) => {
    pS = REDUCED ? p : lerp(pS, p, 1 - Math.pow(.003, dt));
    const tp = ease(clamp(pS / .22));
    table.position.y = (1 - tp) * -1.4; table.scale.setScalar(.6 + tp * .4);
    let landed = 0;
    chairs.forEach((c, i) => {
      const k = ease(clamp((pS - .18 - i * .038) / .2));
      if (k > .98) landed++;
      c.position.lerpVectors(c.userData.from, c.userData.home, k);
      c.visible = k > .001;
      c.children[3].material.emissive?.setHex(0x000000);
    });
    if (counter) counter.textContent = landed;
    const ang = .55 - pS * .7 + px * .15;
    const br = 11 * (camera.aspect < 1.6 ? 1.6 / Math.max(.6, camera.aspect) : 1);
    camera.position.set(Math.sin(ang) * br, 6.2 - pS * .8, Math.cos(ang) * br);
    camera.lookAt(0, .6, 0);
    renderer.render(scene, camera);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    tags.forEach(t => {
      const c = chairs[+t.dataset.seat];
      v.copy(c.userData.home); v.y = 1.6; v.project(camera);
      t.style.transform = `translate(${((v.x * .5 + .5) * w).toFixed(1)}px, ${((-v.y * .5 + .5) * h).toFixed(1)}px) translate(-50%, -100%)`;
    });
    root.classList.toggle('seated', landed === N);
  });
}

// ---------- 4. Gold monogram "A" ----------
const GLYPH_A = [[[200,287],[209,305],[468,305],[475,287]],[[694,12],[695.2,11.8],[696.2,11.3],[697,10.5],[697.6,9.3],[697.9,7.8],[698,6],[697.9,4.2],[697.6,2.7],[697,1.5],[696.2,0.7],[695.2,0.2],[694,0],[684.6,0.1],[675.2,0.2],[665.6,0.5],[656,0.9],[646.3,1.4],[636.5,2],[626.7,2.6],[617.1,3.1],[607.6,3.5],[598.3,3.8],[589.1,3.9],[580,4],[569.9,3.9],[560.3,3.8],[551.1,3.5],[542.4,3.1],[534.2,2.6],[526.5,2],[518.9,1.4],[511,0.9],[502.9,0.5],[494.5,0.2],[485.9,0.1],[477,0],[475.8,0.2],[474.8,0.7],[474,1.5],[473.4,2.7],[473.1,4.2],[473,6],[473.1,7.8],[473.4,9.3],[474,10.5],[474.8,11.3],[475.8,11.8],[477,12],[494.5,12.4],[509.7,13.7],[522.6,15.8],[533.2,18.7],[541.5,22.4],[547.5,27],[551.4,32.8],[553.4,40],[553.6,48.8],[551.9,59],[548.4,70.8],[543,84],[317,570],[336,587],[143,123],[135.9,103.7],[131.4,86.3],[129.5,71],[130.1,57.7],[133.3,46.3],[139,37],[147.3,29.4],[158.2,23.1],[171.8,18.2],[187.9,14.8],[206.6,12.7],[228,12],[229.5,11.8],[230.8,11.3],[231.8,10.5],[232.4,9.3],[232.9,7.8],[233,6],[232.9,4.2],[232.4,2.7],[231.8,1.5],[230.8,0.7],[229.5,0.2],[228,0],[218.1,0.1],[208.6,0.2],[199.2,0.5],[190.2,0.9],[181.5,1.4],[173,2],[164.3,2.6],[154.9,3.1],[144.8,3.5],[133.9,3.8],[122.3,3.9],[110,4],[98.7,3.9],[88.2,3.8],[78.4,3.5],[69.3,3.1],[61,2.6],[53.5,2],[46.1,1.4],[38.2,0.9],[29.9,0.5],[21.1,0.2],[11.8,0.1],[2,0],[0.8,0.2],[-0.2,0.7],[-1,1.5],[-1.6,2.7],[-1.9,4.2],[-2,6],[-1.9,7.8],[-1.6,9.3],[-1,10.5],[-0.2,11.3],[0.8,11.8],[2,12],[10.8,12.3],[19.2,13.1],[27.2,14.5],[34.9,16.4],[42.1,18.9],[49,22],[55.6,25.8],[62.1,30.4],[68.4,36],[74.6,42.4],[80.6,49.8],[86.5,58],[92.4,67.3],[98.4,77.8],[104.6,89.5],[110.9,102.4],[117.4,116.6],[124,132],[333,635],[333.7,635.9],[334.6,636.7],[335.6,637.2],[336.8,637.7],[338.1,637.9],[339.5,638],[340.9,637.9],[342.1,637.7],[343.1,637.2],[343.9,636.7],[344.6,635.9],[345,635],[577,137],[584.5,121],[591.8,106.2],[598.8,92.6],[605.4,80.3],[611.9,69.3],[618,59.5],[624,50.8],[630,43.1],[636,36.4],[642,30.6],[648,25.8],[654,22],[660.1,18.9],[666.4,16.4],[673,14.5],[679.8,13.1],[686.8,12.3],[694,12]]]; // Cormorant Garamond 600, capital A

function monogram(root) {
  const canvas = root.querySelector('canvas');
  const renderer = makeRenderer(canvas);
  renderer.toneMappingExposure = 1.15;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 50);
  camera.position.set(0, 0, 8.2);
  scene.environment = studioEnv(renderer, 0x7a6038);
  const key = new THREE.DirectionalLight(0xfff2dc, 1.4); key.position.set(3, 4, 5); scene.add(key);
  const toShape = pts => new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const shapes = GLYPH_A.map(toShape); // crossbar + the open inverted V
  const geo = new THREE.ExtrudeGeometry(shapes, { depth: 70, bevelEnabled: true, bevelThickness: 16, bevelSize: 7, bevelSegments: 5, curveSegments: 6 });
  geo.center(); geo.scale(1 / 205, 1 / 205, 1 / 205);
  const gold = new THREE.MeshPhysicalMaterial({ color: 0xE2BE7E, metalness: 1, roughness: .3, clearcoat: .6, clearcoatRoughness: .2, envMapIntensity: 1.6 });
  const A = new THREE.Mesh(geo, gold); scene.add(A);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,236,200,.55)', 'rgba(210,181,133,.22)'), transparent: true, depthWrite: false }));
  halo.scale.set(6.5, 6.5, 1); halo.position.z = -1.5; scene.add(halo);
  let tx = 0, ty = 0, rx = 0, ry = 0;
  addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    tx = clamp((e.clientX - (r.left + r.width / 2)) / innerWidth * 2, -1, 1);
    ty = clamp((e.clientY - (r.top + r.height / 2)) / innerHeight * 2, -1, 1);
  }, { passive: true });
  loop(canvas, renderer, camera, (dt, time) => {
    const k = 1 - Math.pow(.02, dt);
    const sway = REDUCED ? 0 : Math.sin(time * .7) * .22;
    ry = lerp(ry, tx * .75 + sway, k); rx = lerp(rx, ty * .4, k);
    A.rotation.set(rx, ry, 0);
    renderer.render(scene, camera);
  });
}

// ---------- boot ----------
const SCENES = { stage, constellation, boardroom, monogram };
export function mount(el) {
  if (el.dataset.mounted) return; el.dataset.mounted = '1';
  try { SCENES[el.dataset.scene](el); el.classList.add('scene-live'); }
  catch (err) { console.warn('3D scene unavailable:', err); el.classList.add('scene-off'); }
}
