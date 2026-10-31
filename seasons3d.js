/* Season 01 tickets: four thin card-stock tickets lying on the "table" of the black screen.
   Each has a perforation with half-round notches; hovering a ticket lifts its tear-off stub
   along the perforation, more at one corner, as if someone started tearing it, then it springs back. */
(function () {
  const section = document.querySelector('.seasons-section');
  const T = window.THREE;
  if (!section || !T) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'seasons3d';
  canvas.setAttribute('aria-hidden', 'true');
  let renderer;
  try { renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { renderer = null; }
  if (renderer) {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    section.prepend(canvas);
  }
  const maxAniso = renderer ? renderer.capabilities.getMaxAnisotropy() : 1;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(26, 1, 0.1, 200);
  camera.position.set(0, 0, 30);
  scene.add(new T.AmbientLight(0xffffff, 0.5));
  const sun = new T.DirectionalLight(0xffffff, 0.75);
  sun.position.set(-5, 9, 14); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 6; sun.shadow.bias = -0.0008;
  Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 12, bottom: -12, near: 1, far: 60 });
  scene.add(sun, sun.target);

  /* The table: everything lies in this group, tilted back a little. */
  const table = new T.Group();
  table.rotation.x = -0.36;
  scene.add(table);
  const catcher = new T.Mesh(new T.PlaneGeometry(60, 40), new T.ShadowMaterial({ opacity: 0.55 }));
  catcher.receiveShadow = true; catcher.position.z = -0.02;
  table.add(catcher);

  /* Ticket geometry (unit width). Body above the perforation (y 0..BH), stub below (y -SH..0). */
  const W = 1, BH = 2.05, SH = 0.62, R = 0.035, NR = 0.05, D = 0.012;
  const bodyShape = new T.Shape();
  bodyShape.moveTo(-W / 2 + NR, 0); bodyShape.lineTo(W / 2 - NR, 0);
  bodyShape.absarc(W / 2, 0, NR, Math.PI, Math.PI / 2, true);
  bodyShape.lineTo(W / 2, BH - R); bodyShape.quadraticCurveTo(W / 2, BH, W / 2 - R, BH);
  bodyShape.lineTo(-W / 2 + R, BH); bodyShape.quadraticCurveTo(-W / 2, BH, -W / 2, BH - R);
  bodyShape.lineTo(-W / 2, NR); bodyShape.absarc(-W / 2, 0, NR, Math.PI / 2, 0, true);
  const stubShape = new T.Shape();
  stubShape.moveTo(-W / 2, -NR); stubShape.absarc(-W / 2, 0, NR, -Math.PI / 2, 0, false);
  stubShape.lineTo(W / 2 - NR, 0); stubShape.absarc(W / 2, 0, NR, Math.PI, Math.PI * 1.5, false);
  stubShape.lineTo(W / 2, -SH + R); stubShape.quadraticCurveTo(W / 2, -SH, W / 2 - R, -SH);
  stubShape.lineTo(-W / 2 + R, -SH); stubShape.quadraticCurveTo(-W / 2, -SH, -W / 2, -SH + R);
  stubShape.lineTo(-W / 2, -NR);
  const uvMap = (g, y0, h) => { const p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + W / 2) / W, (p.getY(i) - y0) / h); uv.needsUpdate = true; return g; };
  const ext = (s) => { const g = new T.ExtrudeGeometry(s, { depth: D, bevelEnabled: false, curveSegments: 10 }); return g; };
  const bodyGeo = ext(bodyShape), stubGeo = ext(stubShape);
  const bodyFace = uvMap(new T.ShapeGeometry(bodyShape, 10), 0, BH), stubFace = uvMap(new T.ShapeGeometry(stubShape, 10), -SH, SH);

  /* Artwork */
  const MARK = ['M45 12H23Q10 12 10 25V59Q10 72 23 72H45', 'M61 12V59Q61 72 74 72H98', 'M126 12H138Q151 12 151 25V59Q151 72 138 72H126Q113 72 113 59V25Q113 12 126 12Z',
    'M205 12H180Q167 12 167 25V29Q167 42 180 42H192Q205 42 205 55V59Q205 72 192 72H167', 'M260 12H235Q222 12 222 25V59Q222 72 235 72H260M223 42H254', 'M276 12H298Q316 12 316 30V54Q316 72 298 72H276Z'];
  const drawMark = (x, ox, oy, h, stroke) => { const s = h / 84; x.save(); x.translate(ox, oy); x.scale(s, s); x.strokeStyle = stroke; x.lineWidth = 11; x.lineCap = 'round'; x.lineJoin = 'round'; for (const d of MARK) x.stroke(new Path2D(d)); x.restore(); };
  const PW = 512, PBH = Math.round(512 * BH), PSH = Math.round(512 * SH);

  const patterns = {
    bars(x, ink, a) { // vertical bars with a waist, like a sound wave squeezed in the middle
      for (let i = 0; i < 13; i++) { const cx = 44 + i * 34, w = 12;
        for (let y = 36; y < a; y += 2) { const t = (y - 36) / (a - 36), waist = 1 - 0.55 * Math.exp(-Math.pow((t - 0.55) / 0.18, 2)) * (0.6 + 0.4 * Math.cos(i));
          x.fillStyle = ink; x.fillRect(cx - (w * waist) / 2, y, w * waist, 2); } } },
    ornament(x, ink, a) { // interlocking arcs
      x.strokeStyle = ink; x.lineWidth = 3;
      for (let cy = 70; cy < a; cy += 112) for (let cx = 70; cx < PW; cx += 93) {
        x.beginPath(); x.ellipse(cx, cy, 44, 60, 0, 0, Math.PI * 2); x.stroke();
        x.beginPath(); x.moveTo(cx, cy - 60); x.lineTo(cx, cy + 60); x.stroke(); } },
    quarters(x, ink, a) { // quarter-circle tiles
      x.fillStyle = ink; const s = 84; let k = 0;
      for (let y = 36; y + s <= a + 10; y += s) for (let cx = 46; cx + s <= PW - 30; cx += s, k++) {
        const r = (k * 7 + (y / s | 0) * 3) % 4, ox = cx + (r === 1 || r === 2 ? s : 0), oy = y + (r >= 2 ? s : 0);
        x.beginPath(); x.moveTo(ox, oy); x.arc(ox, oy, s * 0.96, r * Math.PI / 2, r * Math.PI / 2 + Math.PI / 2); x.closePath(); x.fill(); } },
    rings(x, ink, a) { // concentric rings, offset like a radar sweep
      x.strokeStyle = ink;
      for (let i = 1; i < 14; i++) { x.lineWidth = i % 3 === 0 ? 7 : 3; x.beginPath(); x.arc(PW / 2, a + 30, i * 34, Math.PI, Math.PI * 2); x.stroke(); }
      for (let i = 0; i < 9; i++) { x.beginPath(); const ang = Math.PI + (i + 0.5) * Math.PI / 9; x.moveTo(PW / 2, a + 30); x.lineTo(PW / 2 + Math.cos(ang) * 480, a + 30 + Math.sin(ang) * 480); x.lineWidth = 2; x.stroke(); } }
  };

  const TICKETS = [
    { dark: true,  pattern: 'bars',     title: ['MACRO', 'CONTEXT'],   text: 'Макроэкономика и взаимосвязи рынков: что двигает цену до того, как это видно на графике.', code: '01' },
    { dark: false, pattern: 'ornament', title: ['VOLUME', 'FOOTPRINT'], text: 'Объёмы и Footprint: как читать движение изнутри и видеть, кто стоит за свечой.', code: '02' },
    { dark: true,  pattern: 'quarters', title: ['OPTIONS', 'FLOW'],     text: 'Опционные данные и позиционирование: другая сторона рынка в одном модуле.', code: '03' },
    { dark: false, pattern: 'rings',    title: ['COT', 'REPORTS'],      text: 'COT-отчёты как часть рыночного контекста: кто держит позиции и где меняется баланс.', code: '04' }
  ];

  /* Season 02 is still being prepared: same kind of tickets, blurred to silhouettes, a big "?" on top. */
  const TICKETS2 = [
    { dark: false, pattern: 'quarters', title: ['DEEP', 'LIQUIDITY'], text: 'Следующий сезон уже готовится. Подробности появятся позже для участников клуба.', code: '01' },
    { dark: true,  pattern: 'rings',    title: ['ORDER', 'BOOK'],      text: 'Следующий сезон уже готовится. Подробности появятся позже для участников клуба.', code: '02' },
    { dark: false, pattern: 'bars',     title: ['RISK', 'MODEL'],      text: 'Следующий сезон уже готовится. Подробности появятся позже для участников клуба.', code: '03' },
    { dark: true,  pattern: 'ornament', title: ['MARKET', 'MAKERS'],   text: 'Следующий сезон уже готовится. Подробности появятся позже для участников клуба.', code: '04' }
  ].map(t => Object.assign(t, { szn: '02', locked: true }));

  function blurInto(c, src, r) {
    const x = c.getContext('2d'); x.save(); x.clearRect(0, 0, c.width, c.height);
    x.fillStyle = src.getContext('2d').getImageData(2, 2, 1, 1).data[0] < 128 ? '#141416' : '#ecebe7'; x.fillRect(0, 0, c.width, c.height);
    if ('filter' in x) { x.filter = 'blur(' + r + 'px)'; x.drawImage(src, 0, 0); x.filter = 'none'; }
    else { const k = r / 2.2, sm = document.createElement('canvas'); sm.width = Math.max(1, Math.round(c.width / k)); sm.height = Math.max(1, Math.round(c.height / k));
      const sx = sm.getContext('2d'); sx.imageSmoothingQuality = 'high'; sx.drawImage(src, 0, 0, sm.width, sm.height);
      x.imageSmoothingQuality = 'high'; x.drawImage(sm, 0, 0, c.width, c.height); }
    x.restore();
  }
  function drawCard(c, t, part) {
    if (!t.locked) return part === 'b' ? drawBody(c, t) : drawStub(c, t);
    const tmp = document.createElement('canvas'); tmp.width = c.width; tmp.height = c.height;
    part === 'b' ? drawBody(tmp, t) : drawStub(tmp, t);
    blurInto(c, tmp, 9);
    if (part === 'b') {                                          // the question mark sits at the middle of the whole ticket
      const x = c.getContext('2d'), cy = (BH + SH) / 2 * 512;
      x.fillStyle = t.dark ? 'rgba(20,20,22,.55)' : 'rgba(236,235,231,.55)';
      x.beginPath(); x.arc(PW / 2, cy, 150, 0, Math.PI * 2); x.fill();
      x.font = '400 280px "Russo One", Inter, Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.shadowColor = t.dark ? 'rgba(0,0,0,.6)' : 'rgba(0,0,0,.18)'; x.shadowBlur = 24;
      x.fillStyle = t.dark ? '#f2f2f3' : '#111113'; x.fillText('?', PW / 2, cy + 10);
      x.shadowBlur = 0; x.textAlign = 'left'; x.textBaseline = 'alphabetic';
    }
  }

  function wrap(x, text, maxW) { const words = text.split(' '), lines = []; let l = '';
    for (const w of words) { const t = l ? l + ' ' + w : w; if (x.measureText(t).width > maxW && l) { lines.push(l); l = w; } else l = t; } if (l) lines.push(l); return lines; }

  function drawBody(c, t) {
    const x = c.getContext('2d'), bg = t.dark ? '#141416' : '#ecebe7', ink = t.dark ? '#f2f2f3' : '#111113', soft = t.dark ? '#a9a9ae' : '#3f3f44';
    x.fillStyle = bg; x.fillRect(0, 0, PW, PBH);
    const art = 560;
    x.save(); x.beginPath(); x.rect(30, 30, PW - 60, art - 30); x.clip(); patterns[t.pattern](x, ink, art); x.restore();
    x.fillStyle = '#ff6a1f'; x.font = '500 22px "JetBrains Mono", ui-monospace, monospace'; x.textBaseline = 'alphabetic';
    x.fillText('SEASON ' + (t.szn || '01') + ' / ' + t.code, 40, art + 58);
    x.fillStyle = ink; x.font = '400 66px "Russo One", Inter, Arial, sans-serif';
    x.fillText(t.title[0], 38, art + 128); x.fillText(t.title[1], 38, art + 196);
    x.fillStyle = soft; x.font = '400 23px Inter, Arial, sans-serif';
    wrap(x, t.text, PW - 80).slice(0, 4).forEach((ln, i) => x.fillText(ln, 40, art + 246 + i * 31));
    x.fillStyle = ink; x.font = '500 26px "JetBrains Mono", ui-monospace, monospace';
    const rowY = PBH - 54; x.fillText('SZN ' + (t.szn || '01'), 40, rowY); x.textAlign = 'center'; x.fillText('MOD ' + t.code, PW / 2, rowY); x.textAlign = 'right'; x.fillText('2026', PW - 40, rowY); x.textAlign = 'left';
    x.fillStyle = t.dark ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.3)';
    for (let i = 46; i < PW - 40; i += 16) { x.beginPath(); x.arc(i, PBH - 4, 2.4, 0, Math.PI * 2); x.fill(); }
  }
  function drawStub(c, t) {
    const x = c.getContext('2d'), bg = t.dark ? '#141416' : '#ecebe7', ink = t.dark ? '#f2f2f3' : '#111113';
    x.fillStyle = bg; x.fillRect(0, 0, PW, PSH);
    x.fillStyle = t.dark ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.3)';
    for (let i = 46; i < PW - 40; i += 16) { x.beginPath(); x.arc(i, 4, 2.4, 0, Math.PI * 2); x.fill(); }
    x.fillStyle = ink; x.font = '600 19px Inter, Arial, sans-serif';
    x.fillText('CLOSED.PROJECT', 40, 58); x.fillText('PRIVATE TRADING CLUB', 120, 84);
    const og = x.createLinearGradient(40, 0, 170, 0); og.addColorStop(0, '#ff5a14'); og.addColorStop(1, '#ff9a3c');
    drawMark(x, 36, 106, 30, og);
    x.font = '500 18px "JetBrains Mono", ui-monospace, monospace'; x.textAlign = 'right';
    x.fillText('SEASON ' + (t.szn || '01') + ' · MODULE ' + t.code, PW - 40, 126); x.fillText('ACCESS · MEMBERS ONLY', PW - 40, 150); x.textAlign = 'left';
    let bx = 40; const seed = parseInt(t.code, 10) * 97;
    for (let i = 0; bx < PW - 44; i++) { const w = 2 + ((i * 31 + seed) % 5); if (((i * 17 + seed) % 3) !== 0) { x.fillRect(bx, 196, w, 98); } bx += w + 2 + ((i * 13 + seed) % 3); }
  }

  /* The same ticket artwork, flat, for the lesson cards in the platform preview (works without WebGL). */
  function fillMiniTickets() {
    document.querySelectorAll('img.mini-ticket[data-t]').forEach(img => {
      const t = TICKETS[+img.dataset.t]; if (!t) return;
      const c = document.createElement('canvas'); c.width = PW; c.height = PBH; drawBody(c, t);
      try { img.src = c.toDataURL('image/jpeg', 0.9); } catch (e) {}
    });
  }
  fillMiniTickets();
  if (document.fonts && document.fonts.load) Promise.all(['400 66px "Russo One"', '500 22px "JetBrains Mono"', '400 23px Inter'].map(f => document.fonts.load(f).catch(() => {}))).then(fillMiniTickets);
  if (!renderer) return;

  const tickets = TICKETS.map((t, i) => {
    const mk = (d) => { const bc = document.createElement('canvas'); bc.width = PW; bc.height = PBH; drawCard(bc, d, 'b');
      const sc = document.createElement('canvas'); sc.width = PW; sc.height = PSH; drawCard(sc, d, 's');
      const b = new T.CanvasTexture(bc), s = new T.CanvasTexture(sc);
      [b, s].forEach(tx => { tx.encoding = T.sRGBEncoding; tx.anisotropy = maxAniso; }); return { d, b, s }; };
    const sets = { 1: mk(t), 2: mk(TICKETS2[i]) }, bt = sets[1].b, st = sets[1].s;
    const paper = t.dark ? 0x141416 : 0xe4e3df, edge = new T.MeshStandardMaterial({ color: t.dark ? 0x2a2a2e : 0xcfcec9, roughness: 0.9 });
    const g = new T.Group();
    const body = new T.Mesh(bodyGeo, [edge, edge]); body.castShadow = true;
    const bodyF = new T.Mesh(bodyFace, new T.MeshStandardMaterial({ map: bt, roughness: 0.92, color: 0xffffff })); bodyF.position.z = D + 0.0008;
    const stubPivot = new T.Group();
    const stub = new T.Mesh(stubGeo, [edge, edge]); stub.castShadow = true;
    const stubF = new T.Mesh(stubFace, new T.MeshStandardMaterial({ map: st, roughness: 0.92 })); stubF.position.z = D + 0.0008;
    stubPivot.add(stub, stubF);
    g.add(body, bodyF, stubPivot);
    table.add(g);
    g.userData = { paper };
    return { t, g, stubPivot, bodyF, stubF, edge, sets, shown: 1, flip: 1, flipFrom: 1, hit: [body, bodyF, stub, stubF], lift: 0, liftV: 0, hover: 0, baseRot: [-0.05, 0.03, -0.02, 0.06][i] };
  });

  /* Layout: four tickets centred above the headline. */
  let cw = 1, ch = 1;
  function layout() {
    const r = section.getBoundingClientRect(); cw = r.width; ch = r.height; if (!cw || !ch) return;
    renderer.setSize(cw, ch, false); camera.aspect = cw / ch; camera.updateProjectionMatrix();
    const viewH = 2 * camera.position.z * Math.tan(T.MathUtils.degToRad(camera.fov / 2)), viewW = viewH * camera.aspect, px = viewH / ch;
    const title = section.querySelector('.seasons-title');
    const tTop = title ? title.getBoundingClientRect().top - r.top : ch * 0.75;
    const availH = Math.max(200, tTop - 210);   // leaves room for the quote under the tickets                 // between header area and the headline
    let hPx = Math.min(availH * 1.02, 560) * 0.84, wPx = hPx / (BH + SH);
    const gapPx = Math.max(24, wPx * 0.32), totalW = 4 * wPx + 3 * gapPx;
    if (totalW > cw * 0.9) { const k = (cw * 0.9) / totalW; wPx *= k; hPx *= k; }
    const s = wPx * px, gap = Math.max(24, wPx * 0.32) * px;
    const botPx = 18 + (tTop - 130) / 2 + Math.min(availH * 1.02, 560) / 2;   // keep the old bottom edge
    const cyPx = botPx - hPx / 2;
    const cy = (ch / 2 - cyPx) * px / Math.cos(table.rotation.x);
    tickets.forEach((tk, i) => {
      tk.g.scale.setScalar(s);
      tk.g.position.set((i - 1.5) * (s + gap), cy - ((BH - SH) / 2) * s, 0);
      tk.g.rotation.z = tk.baseRot;
    });
    sun.target.position.set(0, 0, 0);
    /* Big "SEASON 1" behind the tickets: as wide as the ticket row (a little less), centred on it. */
    const bg = section.querySelector('.season-bg');
    if (bg) {
      const span = (4 * wPx + 3 * Math.max(24, wPx * 0.32)) * 0.9;
      bg.style.fontSize = '100px';
      const k = span / Math.max(1, bg.scrollWidth);
      bg.style.fontSize = (100 * k) + 'px';
      const fs = 100 * k, capTop = 0.14 * fs, capH = 0.72 * fs;      // Russo One cap box inside the line
      bg.style.top = (botPx - hPx - capTop - capH * 0.55) + 'px';    // tickets cover the lower ~45%
      bg.classList.add('on');
    }
    /* Small quote between the tickets and the headline. */
    const q = section.querySelector('.seasons-quote');
    if (q) q.style.top = Math.max(botPx + 14, (botPx + tTop) / 2 - q.offsetHeight / 2 - 4) + 'px';
    wake();
  }

  /* Season switch: the arrow next to the number flips the tickets over, one after another. */
  let season = 1, flipClock = 0;
  const bgEl = section.querySelector('.season-bg'), numEl = section.querySelector('.szn-num');
  function setSeason(n) {
    if (n === season) return; season = n; hovered = -1;
    tickets.forEach((tk, i) => { tk.flip = -i * 0.09; });          // negative = waiting for its turn (stagger)
    if (numEl) { numEl.classList.add('swap'); setTimeout(() => { numEl.textContent = String(n); numEl.classList.remove('swap'); }, 220); }
    if (bgEl) bgEl.dataset.season = String(n);
    wake();
  }
  section.querySelectorAll('.szn-arrow').forEach(b => b.addEventListener('click', (e) => {
    e.preventDefault(); setSeason(b.classList.contains('next') ? 2 : 1);
    const other = section.querySelector(b.classList.contains('next') ? '.szn-arrow.prev' : '.szn-arrow.next');
    if (document.activeElement === b && other) setTimeout(() => other.focus({ preventScroll: true }), 260);
  }));
  function show(tk, n) {
    const set = tk.sets[n]; tk.shown = n;
    tk.bodyF.material.map = set.b; tk.stubF.material.map = set.s;
    tk.edge.color.setHex(set.d.dark ? 0x2a2a2e : 0xcfcec9);
  }

  /* Hover → stub lifts along the perforation. Touch: tap toggles. */
  const ray = new T.Raycaster(), ndc = new T.Vector2();
  let hovered = -1;
  function pick(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    let best = -1, dist = Infinity;
    tickets.forEach((tk, i) => { const h = ray.intersectObjects(tk.hit, false)[0]; if (h && h.distance < dist) { dist = h.distance; best = i; } });
    return best;
  }
  section.addEventListener('pointermove', (e) => { if (e.pointerType === 'touch') return; const h = pick(e); if (h !== hovered) { hovered = h; section.classList.toggle('ticket-hover', h >= 0); wake(); } }, { passive: true });
  section.addEventListener('pointerleave', () => { hovered = -1; section.classList.remove('ticket-hover'); wake(); });
  section.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'touch') return; const h = pick(e); hovered = hovered === h ? -1 : h; wake(); });

  let raf = 0, last = 0, onScreen = false;
  function step(dt) {
    let moving = false;
    tickets.forEach((tk, i) => {
      const target = i === hovered && season === 1 ? 1 : 0;
      if (tk.flip < 1) {                                             // flipping over: 0 → 1, texture swaps edge-on
        tk.flip = Math.min(1, tk.flip + dt / 0.75); moving = true;
        const p = Math.max(0, tk.flip), e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        if (e >= 0.5 && tk.shown !== season) show(tk, season);
        tk.g.rotation.y = (e < 0.5 ? e : e - 1) * Math.PI;
        tk.flipLift = Math.sin(e * Math.PI);
      } else { tk.g.rotation.y = 0; tk.flipLift = 0; }
      tk.liftV += ((target - tk.lift) * 70 - tk.liftV * (target ? 9 : 11)) * dt; tk.lift += tk.liftV * dt;
      tk.hover += ((target) - tk.hover) * Math.min(1, dt * 8);
      const L = Math.max(0, tk.lift);
      /* hinge at the perforation: lifts toward the viewer, the right corner more (tear starting there) */
      tk.stubPivot.rotation.set(-0.78 * L, 0.26 * L, 0.06 * L);
      tk.stubPivot.position.set(0.012 * L, -0.004 * L, 0.01 * L);
      tk.g.position.z = (0.06 * tk.hover + 0.45 * (tk.flipLift || 0)) * tk.g.scale.x;
      if (Math.abs(target - tk.lift) > 0.002 || Math.abs(tk.liftV) > 0.002) moving = true;
    });
    return moving;
  }
  let still = 0;
  function frame(now) {
    raf = 0; const t = now / 1000, dt = Math.min(1 / 30, last ? t - last : 1 / 60); last = t;
    if (reduce.matches) tickets.forEach(tk => { if (tk.shown !== season) show(tk, season); tk.flip = 1; tk.g.rotation.y = 0; });
    const moving = reduce.matches ? (tickets.forEach((tk, i) => { tk.lift = i === hovered ? 1 : 0; tk.stubPivot.rotation.set(-0.62 * tk.lift, 0.22 * tk.lift, 0.05 * tk.lift); }), false) : step(dt);
    renderer.render(scene, camera);
    still = moving ? 0 : still + 1;
    if (onScreen && !document.hidden && still < 8) raf = requestAnimationFrame(frame); else last = 0;
  }
  function wake() { still = 0; if (!raf && onScreen && !document.hidden) raf = requestAnimationFrame(frame); }

  new ResizeObserver(layout).observe(section);
  new IntersectionObserver(es => { onScreen = es[0].isIntersecting; if (onScreen) wake(); }).observe(section);
  document.addEventListener('visibilitychange', wake);
  if (document.fonts && document.fonts.load) {
    Promise.all(['400 66px "Russo One"', '500 22px "JetBrains Mono"', '400 23px Inter', '600 19px Inter'].map(f => document.fonts.load(f).catch(() => {}))).then(() => {
      tickets.forEach(tk => [1, 2].forEach(n => { const st = tk.sets[n];
        drawCard(st.b.image, st.d, 'b'); st.b.needsUpdate = true; drawCard(st.s.image, st.d, 's'); st.s.needsUpdate = true; }));
      layout();
    });
  }
  layout();
})();
