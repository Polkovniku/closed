/* CREW: five real 3D ID cards hanging on woven lanyards from the top of the white screen.
   Each card is a thin plate with a slot cut through it; the lanyard loops through the slot
   (one ply down the front, one down the back). Cards swing like pendulums, turn on their own
   axis on their own. Card text is read from the HTML (.hang elements). */
(function () {
  const section = document.querySelector('.crew-section');
  const T = window.THREE;
  if (!section || !T) return;
  const hangs = [...section.querySelectorAll('.hang')];
  if (!hangs.length) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'crew3d';
  canvas.setAttribute('aria-hidden', 'true');
  let renderer;
  try { renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.setClearColor(0x000000, 0);
  section.appendChild(canvas);
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(24, 1, 0.1, 200);
  camera.position.set(0, 0, 30);
  scene.add(new T.AmbientLight(0xffffff, 0.3));
  const key = new T.DirectionalLight(0xffffff, 0.85); key.position.set(-6, 6, 10); scene.add(key);
  const fill = new T.DirectionalLight(0xdfe3ea, 0.25); fill.position.set(6, -2, 4); scene.add(fill);

  /* Unit card (width 1); scaled per layout. Proportions follow the 2D design. */
  const CW = 1, CH = 1 / 0.66, D = 0.03, R = 0.05, BEV = 0.006, FZ = D / 2 + BEV;
  const SW = 0.28, SH = 0.06, STOP = 0.05;                // slot size and distance from the top edge
  const shape = new T.Shape();
  shape.moveTo(-CW / 2 + R, -CH / 2);
  shape.lineTo(CW / 2 - R, -CH / 2); shape.quadraticCurveTo(CW / 2, -CH / 2, CW / 2, -CH / 2 + R);
  shape.lineTo(CW / 2, CH / 2 - R); shape.quadraticCurveTo(CW / 2, CH / 2, CW / 2 - R, CH / 2);
  shape.lineTo(-CW / 2 + R, CH / 2); shape.quadraticCurveTo(-CW / 2, CH / 2, -CW / 2, CH / 2 - R);
  shape.lineTo(-CW / 2, -CH / 2 + R); shape.quadraticCurveTo(-CW / 2, -CH / 2, -CW / 2 + R, -CH / 2);
  const sy1 = CH / 2 - STOP, sy0 = sy1 - SH, sr = SH / 2, SLOT_MID = (sy0 + sy1) / 2;
  const slot = new T.Path();
  slot.moveTo(-SW / 2 + sr, sy0); slot.lineTo(SW / 2 - sr, sy0); slot.absarc(SW / 2 - sr, sy0 + sr, sr, -Math.PI / 2, Math.PI / 2, false);
  slot.lineTo(-SW / 2 + sr, sy1); slot.absarc(-SW / 2 + sr, sy0 + sr, sr, Math.PI / 2, Math.PI * 1.5, false);
  shape.holes.push(slot);
  const remapUV = (g) => { const p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + CW / 2) / CW, (p.getY(i) + CH / 2) / CH); uv.needsUpdate = true; return g; };
  const bodyGeo = new T.ExtrudeGeometry(shape, { depth: D, bevelEnabled: true, bevelThickness: BEV, bevelSize: BEV, bevelSegments: 2, curveSegments: 10 });
  bodyGeo.translate(0, 0, -D / 2);
  const faceGeo = remapUV(new T.ShapeGeometry(shape, 12));
  const edgeMat = new T.MeshStandardMaterial({ color: 0x121116, roughness: 0.42, metalness: 0.1 });

  /* Fabric for the lanyards: twill weave, stitched hems, CLOSED lettering. */
  const fabric = (() => {
    const c = document.createElement('canvas'); c.width = 128; c.height = 512; const x = c.getContext('2d');
    x.fillStyle = '#121215'; x.fillRect(0, 0, 128, 512);
    for (let y = 0; y < 512; y += 2) for (let i = 0; i < 128; i += 2) {
      const hem = i < 10 || i >= 118, lit = hem ? (y >> 1) % 2 === 0 : (((i >> 1) + (y >> 1)) % 4) < 2;
      const v = (lit ? 26 : 15) + (hem ? 5 : 0) + ((i * 7 + y * 13) % 5);
      x.fillStyle = `rgb(${v},${v},${v + 2})`; x.fillRect(i, y, 2, 2);
    }
    x.fillStyle = 'rgba(255,255,255,.22)';
    for (let y = 0; y < 512; y += 8) { x.fillRect(8, y, 1, 5); x.fillRect(119, y, 1, 5); }
    x.save(); x.translate(64, 300); x.rotate(Math.PI / 2);
    x.fillStyle = 'rgba(235,235,240,.85)'; x.font = '700 40px Inter, Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('CLOSED', 0, 2); x.restore();
    const t = new T.CanvasTexture(c); t.wrapT = T.RepeatWrapping; t.flipY = false; t.encoding = T.sRGBEncoding; t.anisotropy = maxAniso; return t;
  })();
  const strapMat = new T.MeshStandardMaterial({ map: fabric, roughness: 0.8, metalness: 0, side: T.DoubleSide });
  const STRAP_W = 0.19;

  const MARK = ['M45 12H23Q10 12 10 25V59Q10 72 23 72H45', 'M61 12V59Q61 72 74 72H98', 'M126 12H138Q151 12 151 25V59Q151 72 138 72H126Q113 72 113 59V25Q113 12 126 12Z',
    'M205 12H180Q167 12 167 25V29Q167 42 180 42H192Q205 42 205 55V59Q205 72 192 72H167', 'M260 12H235Q222 12 222 25V59Q222 72 235 72H260M223 42H254', 'M276 12H298Q316 12 316 30V54Q316 72 298 72H276Z'];
  const drawMark = (x, ox, oy, h, stroke) => {
    const s = h / 84; x.save(); x.translate(ox, oy); x.scale(s, s); x.strokeStyle = stroke; x.lineWidth = 11; x.lineCap = 'round'; x.lineJoin = 'round';
    for (const d of MARK) x.stroke(new Path2D(d)); x.restore();
  };
  const rr = (x, l, t, w, h, r) => { x.beginPath(); x.moveTo(l + r, t); x.arcTo(l + w, t, l + w, t + h, r); x.arcTo(l + w, t + h, l, t + h, r); x.arcTo(l, t + h, l, t, r); x.arcTo(l, t, l + w, t, r); x.closePath(); };

  /* Front artwork, drawn at 512 × 776 from the HTML content. */
  function drawFront(c, d) {
    const x = c.getContext('2d'), W = 512, H = 776;
    const bg = x.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#2c2a31'); bg.addColorStop(.6, '#1f1d24'); bg.addColorStop(1, '#25232a');
    x.fillStyle = bg; x.fillRect(0, 0, W, H);
    /* Title and name shrink to fit the space left of the vertical side labels. */
    const fit = (txt, base) => { x.font = `500 ${base}px Inter, Arial, sans-serif`; const w = x.measureText(txt).width; return Math.min(base, Math.floor(base * 380 / Math.max(1, w))); };
    x.textBaseline = 'alphabetic';
    const tSize = fit(d.title, 61), nSize = fit(d.num, 61);
    x.fillStyle = '#ffffff'; x.font = `500 ${tSize}px Inter, Arial, sans-serif`; x.fillText(d.title, 44, 82 + 56);
    x.fillStyle = '#a29fa9'; x.font = `500 ${nSize}px Inter, Arial, sans-serif`; x.fillText(d.num, 44, 82 + 56 + 64);
    x.fillStyle = '#e6e4ea'; x.font = '400 27px "JetBrains Mono", ui-monospace, monospace'; x.fillText(d.role, 44, 82 + 56 + 64 + 52);
    /* Only the year, a little larger, centred vertically in the band beside the name block. */
    x.fillStyle = '#d8d6dd'; x.font = '400 32px "JetBrains Mono", ui-monospace, monospace';
    x.save(); x.translate(470, 82 + (369 - 82) / 2); x.rotate(-Math.PI / 2); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(d.side1, 0, 0); x.restore();
    const py = 369, ph = 292;
    rr(x, 44, py, W - 88, ph, 18); x.save(); x.clip();
    const pg = x.createRadialGradient(W / 2, py + 50, 10, W / 2, py + 60, 320); pg.addColorStop(0, '#cfccd6'); pg.addColorStop(.7, '#8f8a99'); pg.addColorStop(1, '#6f6a7a');
    x.fillStyle = pg; x.fillRect(44, py, W - 88, ph);
    x.fillStyle = '#2a2830'; x.beginPath(); x.arc(W / 2, py + 132, 62, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.moveTo(W / 2 - 130, py + ph); x.quadraticCurveTo(W / 2 - 120, py + 205, W / 2, py + 205); x.quadraticCurveTo(W / 2 + 120, py + 205, W / 2 + 130, py + ph); x.fill();
    x.restore();
    const og = x.createLinearGradient(44, 0, 220, 0); og.addColorStop(0, '#ff5a14'); og.addColorStop(.55, '#ff7a24'); og.addColorStop(1, '#ff9a3c');
    drawMark(x, 40, 694, 40, og);
    const sh = x.createLinearGradient(0, 0, 0, 30); sh.addColorStop(0, 'rgba(255,255,255,.1)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = sh; x.fillRect(0, 0, W, 30);
  }
  function drawBack(c) {
    const x = c.getContext('2d'), W = 512, H = 776;
    const bg = x.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#1d1b22'); bg.addColorStop(1, '#141318'); x.fillStyle = bg; x.fillRect(0, 0, W, H);
    drawMark(x, 256 - 105, 360, 56, 'rgba(255,255,255,.14)');
    x.fillStyle = 'rgba(255,255,255,.28)'; x.font = '400 22px "JetBrains Mono", ui-monospace, monospace'; x.textAlign = 'center';
    x.fillText('CLOSED.PROJECT — CREW', 256, 470);
  }

  /* Build the five cards from the HTML. */
  const cards = hangs.map((h, i) => {
    const title = h.querySelector('.id-name b')?.textContent.trim() || 'CREW';
    const num = h.querySelector('.id-name span')?.textContent.trim() || '0' + (i + 1);
    const role = h.querySelector('.id-role')?.textContent.trim() || '';
    const sides = [...h.querySelectorAll('.id-side span')].map(s => s.textContent.trim());
    const st = h.style;
    const data = { title, num, role, side1: sides[0] || '', side2: sides[1] || '', long: title.length > 6,
      len: parseFloat(st.getPropertyValue('--len')) || 15, dur: parseFloat(st.getPropertyValue('--dur')) || 6.5,
      phase: (parseFloat(st.getPropertyValue('--delay')) || 0) * 1.7 + i * 1.3, amp: (parseFloat(st.getPropertyValue('--amp')) || 2) * Math.PI / 180 };
    const fc = document.createElement('canvas'); fc.width = 512; fc.height = 776; drawFront(fc, data);
    const bc = document.createElement('canvas'); bc.width = 512; bc.height = 776; drawBack(bc);
    const ft = new T.CanvasTexture(fc); ft.encoding = T.sRGBEncoding; ft.anisotropy = maxAniso;
    const bt = new T.CanvasTexture(bc); bt.encoding = T.sRGBEncoding;
    const group = new T.Group(); group.rotation.order = 'ZYX';
    const body = new T.Mesh(bodyGeo, [edgeMat, edgeMat]);
    const front = new T.Mesh(faceGeo, new T.MeshPhysicalMaterial({ map: ft, roughness: 0.5, clearcoat: 0.55, clearcoatRoughness: 0.22 }));
    front.position.z = FZ + 0.001;
    const back = new T.Mesh(faceGeo, new T.MeshStandardMaterial({ map: bt, roughness: 0.6 }));
    back.rotation.y = Math.PI; back.position.z = -(FZ + 0.001);
    group.add(body, front, back);
    /* lanyard loop through the slot: front ply and back ply meeting inside the slot */
    const ply = (sign) => {
      const zf = sign * (FZ + 0.008), curve = new T.CatmullRomCurve3([
        new T.Vector3(0, CH / 2 + 0.07, 0), new T.Vector3(0, CH / 2 + 0.02, zf * .9), new T.Vector3(0, CH / 2 - 0.012, zf),
        new T.Vector3(0, sy1 + 0.004, zf), new T.Vector3(0, SLOT_MID + 0.004, zf * .45), new T.Vector3(0, SLOT_MID - 0.01, 0)], false, 'centripetal');
      const pts = curve.getPoints(24), pos = [], uv = [], idx = []; let len = 0;
      pts.forEach((p, k) => { if (k) len += p.distanceTo(pts[k - 1]); pos.push(-STRAP_W / 2, p.y, p.z, STRAP_W / 2, p.y, p.z); uv.push(0, len / STRAP_W * .25, 1, len / STRAP_W * .25);
        if (k < 24) { const a = k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } });
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
      return new T.Mesh(g, strapMat);
    };
    group.add(ply(1), ply(-1));
    scene.add(group);
    /* main strap: straight ribbon from the top edge to the loop, twisting with the card */
    const SEG = 20, sPos = new Float32Array((SEG + 1) * 6), sUV = new Float32Array((SEG + 1) * 4), sIdx = [];
    for (let k = 0; k < SEG; k++) { const a = k * 2; sIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const sg = new T.BufferGeometry(); sg.setIndex(sIdx); sg.setAttribute('position', new T.BufferAttribute(sPos, 3)); sg.setAttribute('uv', new T.BufferAttribute(sUV, 2));
    const strap = new T.Mesh(sg, strapMat); strap.frustumCulled = false; scene.add(strap);
    return { data, group, strap, sPos, sUV, sg, ang: 0, angV: 0, ax: 0, ay: 0, L: 1, s: 1 };
  });

  /* Layout mirrors the CSS row: centred, card width clamp(150px, 14.5vw, 236px). */
  let cw = 1, ch = 1, pxW = 1, viewH = 1;
  function layout() {
    const r = section.getBoundingClientRect(); cw = r.width; ch = r.height; if (!cw || !ch) return;
    renderer.setSize(cw, ch, false); camera.aspect = cw / ch; camera.updateProjectionMatrix();
    viewH = 2 * camera.position.z * Math.tan(T.MathUtils.degToRad(camera.fov / 2)); pxW = viewH / ch;
    const vw = window.innerWidth, vh = window.innerHeight;
    const w = Math.min(210, Math.max(140, vw * 0.12)), gap = Math.min(34, Math.max(12, vw * 0.018));
    const total = cards.length * w + (cards.length - 1) * gap; let x0 = (cw - total) / 2 + w / 2;
    cards.forEach((c, i) => {
      c.s = w * pxW;
      c.ax = (x0 + i * (w + gap) - cw / 2) * pxW;
      c.ay = viewH / 2 + 0.6;
      const lenPx = c.data.len * vh / 100 + 0.11 * vh + w * 0.1;
      c.L = lenPx * pxW + 0.6;
      c.group.scale.setScalar(c.s);
    });
    wake();
  }

  const tmp = new T.Vector3(), top = new T.Vector3();
  function step(dt, t) {
    cards.forEach(c => {
      const d = c.data, idle = reduce.matches ? 0 : 1;
      const target = d.amp * Math.sin((t / d.dur) * Math.PI * 2 + d.phase) * idle;
      c.angV += (-(c.ang - target) * 7 - c.angV * 1.5) * dt; c.angV = T.MathUtils.clamp(c.angV, -1.2, 1.2); c.ang += c.angV * dt;
      const turn = (0.32 * Math.sin((t / (d.dur * 1.35)) * Math.PI * 2 + d.phase * 0.7)) * idle + c.angV * 0.35;
      const z = c.ang, sZ = Math.sin(z), cZ = Math.cos(z);
      top.set(c.ax + sZ * c.L, c.ay - cZ * c.L, 0);                 // strap end = top of the loop
      const off = (CH / 2 + 0.07) * c.s;                            // card centre sits below the loop top
      c.group.position.set(top.x + sZ * off, top.y - cZ * off, 0);
      c.group.rotation.set(0, turn, z);
      /* strap ribbon from anchor to loop top, twisting toward the card's turn */
      const hw = STRAP_W * c.s / 2; let len = 0;
      for (let k = 0; k <= 20; k++) {
        const u = k / 20, px = c.ax + (top.x - c.ax) * u, py = c.ay + (top.y - c.ay) * u;
        const a = turn * u * u, ca = Math.cos(a), sa = Math.sin(a);
        const wx = ca * cZ, wy = ca * sZ, wz = -sa;
        const o = k * 6; c.sPos[o] = px - wx * hw; c.sPos[o + 1] = py - wy * hw; c.sPos[o + 2] = -wz * hw; c.sPos[o + 3] = px + wx * hw; c.sPos[o + 4] = py + wy * hw; c.sPos[o + 5] = wz * hw;
        if (k) len += c.L / 20;
        const v = (len - c.L) / (STRAP_W * c.s / 0.25) + 1.0, q = k * 4; c.sUV[q] = 0; c.sUV[q + 1] = v; c.sUV[q + 2] = 1; c.sUV[q + 3] = v;
      }
      c.sg.attributes.position.needsUpdate = true; c.sg.attributes.uv.needsUpdate = true; c.sg.computeVertexNormals();
    });
  }

  let raf = 0, last = 0, onScreen = false;
  function frame(now) {
    raf = 0; const t = now / 1000, dt = Math.min(1 / 30, last ? t - last : 1 / 60); last = t;
    step(dt, t); renderer.render(scene, camera);
    if (onScreen && !document.hidden) raf = requestAnimationFrame(frame); else last = 0;
  }
  function wake() { if (!raf && onScreen && !document.hidden) raf = requestAnimationFrame(frame); }

  const wideEnough = () => window.innerWidth > 900;
  const apply = () => { const on = wideEnough(); section.classList.toggle('crew-3d', on); canvas.style.display = on ? '' : 'none'; if (on) layout(); };
  new ResizeObserver(apply).observe(section);
  new IntersectionObserver(es => { onScreen = es[0].isIntersecting && wideEnough(); if (onScreen) wake(); }).observe(section);
  document.addEventListener('visibilitychange', wake);
  if (document.fonts && document.fonts.load) {
    Promise.all(['500 61px Inter', '400 27px "JetBrains Mono"'].map(f => document.fonts.load(f).catch(() => {}))).then(() => {
      cards.forEach((c, i) => { const m = c.group.children[1].material.map; const cv = m.image; cv.getContext('2d').clearRect(0, 0, 512, 776); drawFront(cv, c.data); m.needsUpdate = true; });
      wake();
    });
  }
  apply();
})();
