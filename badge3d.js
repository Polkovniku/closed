/* CLOSED 3D badge: a steel card on a woven lanyard hanging from the top of the page.
   Grab it to pull it around inside its zone; flick sideways to spin it. The lanyard twists
   as the card turns and unwinds on release. The card is kept fully inside its zone. */
(function () {
  const stage = document.querySelector('.badge-stage');
  const hero = document.querySelector('.hero');
  if (!stage || !hero || !window.THREE) return;
  const T = window.THREE;
  const TAU = Math.PI * 2;

  const canvas = document.createElement('canvas');
  canvas.className = 'badge3d';
  canvas.setAttribute('aria-hidden', 'true');
  let renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) { return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);
  stage.appendChild(canvas);
  stage.classList.add('has-webgl');
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(26, 1, 0.1, 100);
  camera.position.set(0, 0, 13);

  /* Studio reflections for the brushed-steel edges. */
  const pmrem = new T.PMREMGenerator(renderer);
  const env = new T.Scene();
  env.add(new T.Mesh(new T.BoxGeometry(30, 30, 30), new T.MeshBasicMaterial({ color: 0x0b0b0d, side: T.BackSide })));
  const softbox = (w, h, pos, rot, c) => {
    const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide }));
    m.position.set(pos[0], pos[1], pos[2]); m.rotation.set(rot[0], rot[1], rot[2]); env.add(m);
  };
  softbox(16, 4, [0, 10, 2], [Math.PI / 2, 0, 0], 0xffffff);
  softbox(3, 14, [-11, 0, 3], [0, Math.PI / 2, 0], 0xd8dbe0);
  softbox(2, 14, [11, 1, -2], [0, -Math.PI / 2, 0], 0x9fa3aa);
  softbox(12, 3, [0, -6, 12], [0, Math.PI, 0], 0x3a3c40);
  /* Diagonal strip lights behind the viewer: these are what the protective glass reflects. */
  softbox(2.2, 26, [-2.5, 1, 11], [0, Math.PI, 0.62], 0xffffff);
  softbox(0.5, 26, [1.4, 1, 11], [0, Math.PI, 0.62], 0xd9dce2);
  softbox(6, 26, [-9, 0, 9], [0, Math.PI * 0.85, 0.62], 0x2c2e33);
  scene.environment = pmrem.fromScene(env, 0.04).texture;

  scene.add(new T.AmbientLight(0xffffff, 0.3));
  const key = new T.DirectionalLight(0xffffff, 1.25); key.position.set(2, 5, 7); scene.add(key);
  const rim = new T.DirectionalLight(0xc9ccd4, 0.65); rim.position.set(-5, 2, -4); scene.add(rim);

  /* Card: proportions of the badge face in the photo (514 × 830). */
  const H = 2.9, W = H * (514 / 830), D = 0.09, R = 0.09, BEV = 0.016;
  const FZ = D / 2 + BEV;            // front / back surface depth
  const SLOT_Y = -0.15;               // slot centre, measured down from the top edge
  const shape = new T.Shape();
  shape.moveTo(-W / 2 + R, -H / 2);
  shape.lineTo(W / 2 - R, -H / 2); shape.quadraticCurveTo(W / 2, -H / 2, W / 2, -H / 2 + R);
  shape.lineTo(W / 2, H / 2 - R); shape.quadraticCurveTo(W / 2, H / 2, W / 2 - R, H / 2);
  shape.lineTo(-W / 2 + R, H / 2); shape.quadraticCurveTo(-W / 2, H / 2, -W / 2, H / 2 - R);
  shape.lineTo(-W / 2, -H / 2 + R); shape.quadraticCurveTo(-W / 2, -H / 2, -W / 2 + R, -H / 2);
  /* Real slot through the card, where the photo shows it (x 112..402, y 24..57 of the 514×830 face). */
  const px = (x) => (x / 514 - 0.5) * W, py = (y) => (0.5 - y / 830) * H;
  const SX0 = px(112), SX1 = px(402), SY1 = py(24), SY0 = py(57), SR = (SY1 - SY0) / 2;
  const slot = new T.Path();
  slot.moveTo(SX0 + SR, SY0); slot.lineTo(SX1 - SR, SY0); slot.absarc(SX1 - SR, SY0 + SR, SR, -Math.PI / 2, Math.PI / 2, false);
  slot.lineTo(SX0 + SR, SY1); slot.absarc(SX0 + SR, SY0 + SR, SR, Math.PI / 2, Math.PI * 1.5, false);
  shape.holes.push(slot);
  const SLOT_TOP = SY1 - H / 2, SLOT_MID = (SY0 + SY1) / 2 - H / 2;   // in pivot space (pivot = top edge)

  const remapUV = (geo) => {
    const p = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + W / 2) / W, (p.getY(i) + H / 2) / H);
    uv.needsUpdate = true; return geo;
  };

  const body = new T.Mesh(
    new T.ExtrudeGeometry(shape, { depth: D, bevelEnabled: true, bevelThickness: BEV, bevelSize: BEV, bevelSegments: 3, curveSegments: 10 }),
    [new T.MeshStandardMaterial({ color: 0x1a1b1e, metalness: 0.9, roughness: 0.45 }),
     new T.MeshStandardMaterial({ color: 0xc4c7cc, metalness: 1, roughness: 0.28 })]
  );
  body.geometry.translate(0, 0, -D / 2);

  /* Face image is embedded as a data URI so it also loads inside sandboxed frames. */
  const faceImg = new Image();
  const faceTex = new T.Texture(faceImg);
  faceTex.encoding = T.sRGBEncoding;
  faceTex.anisotropy = maxAniso;
  faceImg.onload = () => { faceTex.needsUpdate = true; stage.classList.add('is-3d'); wake(); };
  faceImg.src = window.CLOSED_BADGE_FACE || 'assets/badge-face.jpg';
  /* The printed face is lit by a key light in front and to the left: turning the badge to the right
     turns it away from the light, so it darkens, the far edge most. */
  const faceMat = new T.ShaderMaterial({
    uniforms: { map: { value: faceTex }, uLight: { value: new T.Vector3(-6, 4, 10) } },
    vertexShader: `varying vec2 vUv; varying vec3 vW; varying vec3 vN;
      void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform sampler2D map; uniform vec3 uLight; varying vec2 vUv; varying vec3 vW; varying vec3 vN;
      void main(){
        vec4 c = texture2D(map, vUv);
        vec3 L = normalize(uLight - vW);
        float d = max(dot(normalize(vN), L), 0.0);
        float shade = clamp(d / 0.74, 0.0, 1.06);
        shade = 0.16 + 0.84 * pow(shade, 1.35);
        gl_FragColor = vec4(c.rgb * shade, c.a);
      }`
  });
  const face = new T.Mesh(remapUV(new T.ShapeGeometry(shape, 12)), faceMat);
  face.position.z = FZ + 0.002;

  /* Glass reflection, computed per pixel: a soft streak that is wide near the top and tapers
     toward the bottom, with rounded ends that fade out, a faint companion streak and a corner
     sheen. It stays on the glass and fades out before the metal frame. */
  const glareMat = new T.ShaderMaterial({
    uniforms: { uShift: { value: 0 }, uOpacity: { value: 0.35 }, uSize: { value: new T.Vector2(W, H) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      uniform float uShift; uniform float uOpacity; uniform vec2 uSize; varying vec2 vUv;
      float streak(vec2 q, vec2 a, vec2 b, float w0, float w1, float fadeIn, float fadeOut){
        vec2 ab = b - a;
        float s = dot(q - a, ab) / dot(ab, ab);
        float sc = clamp(s, 0.0, 1.0);
        float w = mix(w0, w1, sc);
        float d = length(q - (a + ab * sc));
        float along = smoothstep(0.0, fadeIn, s) * (1.0 - smoothstep(fadeOut, 1.0, s));
        return exp(-(d * d) / (w * w)) * along;
      }
      void main(){
        vec2 q = vUv * uSize;
        vec2 a = vec2(0.10, 0.99) * uSize, b = vec2(0.97, 0.10) * uSize;
        vec2 n = normalize(vec2(-(b - a).y, (b - a).x));
        a += n * uShift; b += n * uShift;
        float main = streak(q, a, b, 0.30, 0.025, 0.22, 0.45);
        vec2 o = n * -0.36;
        float thin = streak(q, a + o + (b - a) * 0.12, a + o + (b - a) * 0.7, 0.045, 0.012, 0.25, 0.4);
        vec2 corner = vec2(0.08, 0.95) * uSize;
        float sheen = exp(-dot(q - corner, q - corner) / 0.35);
        float glass = smoothstep(0.055, 0.11, vUv.x) * (1.0 - smoothstep(0.89, 0.945, vUv.x))
                    * smoothstep(0.06, 0.1, vUv.y) * (1.0 - smoothstep(0.87, 0.91, vUv.y));
        float i = (main * 0.85 + thin * 0.45 + sheen * 0.18) * glass * uOpacity;
        gl_FragColor = vec4(vec3(i), 1.0);
      }`,
    transparent: true, depthWrite: false, blending: T.AdditiveBlending
  });
  const glare = new T.Mesh(remapUV(new T.ShapeGeometry(shape, 12)), glareMat);
  glare.position.z = FZ + 0.004;

  const back = new T.Mesh(remapUV(new T.ShapeGeometry(shape, 12)),
    new T.MeshStandardMaterial({ map: makeBackTexture(), metalness: 0.75, roughness: 0.42 }));
  back.rotation.y = Math.PI;
  back.position.z = -(FZ + 0.002);

  /* Pivot = middle of the top edge, where the lanyard loops through. */
  const inner = new T.Group();
  /* Protective glass over the black screen: a separate clear pane sitting just above the print.
     Only its reflections are drawn (additive), so the print shows through untouched while
     studio lights glide across the glass as the badge turns. */
  const GX0 = -W / 2 + W * 0.057, GX1 = W / 2 - W * 0.057, GY0 = -H / 2 + H * 0.062, GY1 = H / 2 - H * 0.092, GR = 0.05;
  const glassShape = new T.Shape();
  glassShape.moveTo(GX0 + GR, GY0); glassShape.lineTo(GX1 - GR, GY0); glassShape.quadraticCurveTo(GX1, GY0, GX1, GY0 + GR);
  glassShape.lineTo(GX1, GY1 - GR); glassShape.quadraticCurveTo(GX1, GY1, GX1 - GR, GY1);
  glassShape.lineTo(GX0 + GR, GY1); glassShape.quadraticCurveTo(GX0, GY1, GX0, GY1 - GR);
  glassShape.lineTo(GX0, GY0 + GR); glassShape.quadraticCurveTo(GX0, GY0, GX0 + GR, GY0);
  /* Glass shader: reflects a small "studio" of diagonal light strips. The reflection is computed
     from the real viewing angle, so the strips slide across the glass as the badge turns and stay
     put relative to the room, while the print below stays deep black. Edges pick up a Fresnel sheen. */
  const glassMat = new T.ShaderMaterial({
    uniforms: { uShift: { value: 0.235 }, uGain: { value: 1 } },
    vertexShader: `varying vec3 vN; varying vec3 vP; varying vec2 vL;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vP = mv.xyz; vN = normalize(normalMatrix * normal); vL = position.xy; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uShift; uniform float uGain; varying vec3 vN; varying vec3 vP; varying vec2 vL;
      float band(float s, float c, float w, float soft){ return smoothstep(c - w - soft, c - w, s) * (1.0 - smoothstep(c + w, c + w + soft, s)); }
      void main(){
        vec3 V = normalize(-vP); vec3 N = normalize(vN);
        if (dot(N, V) < 0.0) discard;
        vec3 R = reflect(-V, N);
        vec2 d = normalize(vec2(1.0, 0.8));
        float s = dot(R.xy, d) + uShift;
        float along = dot(R.xy, vec2(-d.y, d.x));
        float taper = smoothstep(-0.45, 0.25, along);
        float main = band(s, 0.0, 0.042 * (0.3 + 0.7 * taper), 0.012) * 0.36 * taper;
        float thin = band(s, -0.1, 0.005, 0.005) * 0.32 * taper;
        float broad = band(s, 0.20, 0.16, 0.18) * 0.012;
        float fres = pow(1.0 - max(dot(N, V), 0.0), 4.0) * 0.55;
        float c = (main + thin + broad + fres + 0.006) * uGain;
        gl_FragColor = vec4(vec3(c), 1.0);
      }`,
    transparent: true, depthWrite: false, blending: T.AdditiveBlending
  });
  const glassPane = new T.Mesh(new T.ShapeGeometry(glassShape, 8), glassMat);
  glassPane.position.z = FZ + 0.022;
  /* Thin bright rim where the glass meets the frame. */
  const rimGeo = new T.BufferGeometry().setFromPoints(glassShape.getPoints(24).map(p => new T.Vector3(p.x, p.y, 0)));
  const rimLine = new T.LineLoop(rimGeo, new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, blending: T.AdditiveBlending, depthWrite: false }));
  rimLine.position.z = FZ + 0.023;
  glare.visible = false;
  inner.add(body, face, glare, glassPane, rimLine, back);
  inner.position.set(0, -H / 2, 0);
  const card = new T.Group();
  card.add(inner);
  card.rotation.order = 'ZXY';
  scene.add(card);

  /* Woven lanyard material. */
  const STRAP_W = W * 0.38;
  const fabric = makeFabricTextures();
  const strapMat = new T.MeshStandardMaterial({
    map: fabric.map, bumpMap: fabric.bump, bumpScale: 0.012,
    roughness: 0.72, metalness: 0.0, side: T.DoubleSide
  });

  /* The lanyard loops around the top bar of the frame: one ply comes down the front, the other down
     the back, and they meet in a U-turn inside the slot, so the strap visibly passes through the hole. */
  function loopPly(sign) {
    const zf = sign * (FZ + 0.012), N = 28;
    const curve = new T.CatmullRomCurve3([
      new T.Vector3(0, 0.08, 0),
      new T.Vector3(0, 0.025, zf * 0.85),
      new T.Vector3(0, -0.02, zf),
      new T.Vector3(0, SLOT_TOP + 0.01, zf),
      new T.Vector3(0, SLOT_MID + 0.005, zf * 0.45),
      new T.Vector3(0, SLOT_MID - 0.012, 0)
    ], false, 'centripetal');
    const pts = curve.getPoints(N);
    const pos = [], uv = [], idx = [];
    let len = 0;
    pts.forEach((p, i) => {
      if (i) len += p.distanceTo(pts[i - 1]);
      pos.push(-STRAP_W / 2, p.y, p.z, STRAP_W / 2, p.y, p.z);
      uv.push(0, len / STRAP_W * 0.25, 1, len / STRAP_W * 0.25);
      if (i < N) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    });
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    return new T.Mesh(g, strapMat);
  }
  card.add(loopPly(1), loopPly(-1));

  /* Main strap, rebuilt every frame from the top of the page to the card. */
  const SEG = 72;
  const strapGeo = new T.BufferGeometry();
  const sPos = new Float32Array((SEG + 1) * 6), sUV = new Float32Array((SEG + 1) * 4), sIdx = [];
  for (let i = 0; i < SEG; i++) { const a = i * 2; sIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  strapGeo.setIndex(sIdx);
  strapGeo.setAttribute('position', new T.BufferAttribute(sPos, 3));
  strapGeo.setAttribute('uv', new T.BufferAttribute(sUV, 2));
  const strap = new T.Mesh(strapGeo, strapMat);
  strap.frustumCulled = false;
  scene.add(strap);

  /* Layout: the badge lives in a zone to the right of the headline, below the header. */
  let viewH = 1, viewW = 1, cw = 1, ch = 1, scale = 1;
  const REST = new T.Vector3(), ANCHOR = new T.Vector3();
  const ZONE = { l: -1, r: 1, b: -1, t: 1 };   // in NDC
  function layout() {
    const cr = canvas.getBoundingClientRect();
    cw = cr.width; ch = cr.height;
    if (!cw || !ch) return;
    renderer.setSize(cw, ch, false);
    camera.aspect = cw / ch; camera.updateProjectionMatrix();
    viewH = 2 * camera.position.z * Math.tan(T.MathUtils.degToRad(camera.fov / 2));
    viewW = viewH * camera.aspect;

    const wide = getComputedStyle(stage).position === 'absolute';
    const copy = document.querySelector('.hero-copy');
    let lpx = 16, rpx = cw - 16, tpx = 16, bpx = ch - 16;
    if (wide && copy) {
      const r = copy.getBoundingClientRect();
      lpx = Math.max(16, r.right - cr.left + 24);
      rpx = cw - Math.max(24, cw * 0.03);
      tpx = 104;
      bpx = ch - 84;
    }
    lpx = Math.min(lpx, rpx - Math.min(320, cw * 0.5));  // never let the zone collapse
    ZONE.l = lpx / cw * 2 - 1; ZONE.r = rpx / cw * 2 - 1;
    ZONE.t = 1 - tpx / ch * 2; ZONE.b = 1 - bpx / ch * 2;

    const zoneWWorld = (rpx - lpx) / cw * viewW, zoneHWorld = (bpx - tpx) / ch * viewH;
    scale = Math.min(1, (zoneHWorld * 0.78) / H, (zoneWWorld * 0.62) / W);
    card.scale.setScalar(scale);

    /* Hang the badge in the gap between the menu and the account button, so the strap
       never runs over the header buttons; stay inside the zone. */
    let cxPx = (lpx + rpx) / 2;
    const navEl = document.querySelector('header nav'), accEl = document.querySelector('header .glass.compact');
    if (wide && navEl && accEl && getComputedStyle(navEl).display !== 'none') {
      const gap = (navEl.getBoundingClientRect().right + accEl.getBoundingClientRect().left) / 2 - cr.left;
      const halfCard = (W * scale / 2) / viewW * cw * 1.25;
      cxPx = Math.min(Math.max(gap, lpx + halfCard), rpx - halfCard);
    }
    const cx = (cxPx / cw - 0.5) * viewW;
    const cy = (0.5 - (tpx + bpx) / 2 / ch) * viewH;
    const nx = cx, ny = cy + (H * scale) / 2;
    if (!started) {
      S.x = nx; S.y = ny; started = true;
    } else if (!dragging) {
      S.x += nx - REST.x; S.y += ny - REST.y;
      S.vx = 0; S.vy = 0;
    }
    REST.set(nx, ny, 0);
    ANCHOR.set(cx, viewH / 2 + 0.6, -0.25);
    wake();
  }

  /* Physics state: pivot position, spin (ry), forward tilt (rx), sideways wobble. */
  const S = { x: 0, y: 0, vx: 0, vy: 0, ry: 0, vry: 0, rx: 0, vrx: 0, wob: 0, vwob: 0 };
  let started = false;

  const ray = new T.Raycaster(), ndc = new T.Vector2(), plane = new T.Plane(new T.Vector3(0, 0, 1), 0);
  const pointer = new T.Vector3(), grab = new T.Vector3(), hitPoint = new T.Vector3();
  let hovering = false, dragging = false, pointerIn = false, dragDX = 0, lastPX = 0, activeId = null;

  function aim(e) {
    const r = canvas.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    ray.ray.intersectPlane(plane, hitPoint);
    return inside;
  }
  const hitsCard = () => ray.intersectObjects([body, face, back], false).length > 0;
  const setHover = (h) => { if (h !== hovering) { hovering = h; hero.classList.toggle('badge-hover', h); } };

  /* The canvas never blocks the page; pointer input is read on the window. */
  window.addEventListener('pointermove', (e) => {
    const inside = aim(e);
    if (dragging) {
      if (e.pointerId !== activeId) return;
      dragDX += hitPoint.x - lastPX; lastPX = hitPoint.x;
      pointer.copy(hitPoint);
      wake(); return;
    }
    pointerIn = inside;
    if (!inside) { setHover(false); return; }
    pointer.copy(hitPoint);
    setHover(!(e.target.closest && e.target.closest('a,button,input')) && hitsCard());
    wake();
  }, { passive: true });

  window.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (e.target.closest && e.target.closest('a,button,input,dialog')) return;
    if (!aim(e) || !hitsCard()) return;
    dragging = true; activeId = e.pointerId; lastPX = hitPoint.x; dragDX = 0;
    pointer.copy(hitPoint);
    grab.set(S.x - hitPoint.x, S.y - hitPoint.y, 0);
    hero.classList.add('badge-drag'); setHover(true);
    e.preventDefault();
    wake();
  });
  const release = (e) => {
    if (!dragging || (e && e.pointerId !== activeId)) return;
    dragging = false; activeId = null;
    hero.classList.remove('badge-drag');
    wake();
  };
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);
  /* Keep a touch drag on the card from scrolling the page. */
  window.addEventListener('touchmove', (e) => { if (dragging) e.preventDefault(); }, { passive: false });

  const softClamp = (v, r) => r * Math.tanh(v / r);
  const corners = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) corners.push(new T.Vector3(sx * W / 2, sy * H / 2, sz * FZ));
  const cp = new T.Vector3();

  function pose() {
    const swing = T.MathUtils.clamp(Math.atan2(S.x - ANCHOR.x, ANCHOR.y - S.y), -0.45, 0.45);
    card.position.set(S.x, S.y, 0);
    card.rotation.set(S.rx, S.ry, swing * 0.9 + S.wob);
    card.updateMatrixWorld(true);
  }

  /* Push the card back inside its zone so it is never clipped or over the text. */
  function confine() {
    for (let k = 0; k < 3; k++) {
      let minX = 9, maxX = -9, minY = 9, maxY = -9;
      for (const c of corners) {
        cp.copy(c).applyMatrix4(inner.matrixWorld).project(camera);
        minX = Math.min(minX, cp.x); maxX = Math.max(maxX, cp.x);
        minY = Math.min(minY, cp.y); maxY = Math.max(maxY, cp.y);
      }
      if (![minX, maxX, minY, maxY].every(Number.isFinite)) return;
      let ox = 0, oy = 0;
      if (minX < ZONE.l) ox = ZONE.l - minX; else if (maxX > ZONE.r) ox = ZONE.r - maxX;
      if (minY < ZONE.b) oy = ZONE.b - minY; else if (maxY > ZONE.t) oy = ZONE.t - maxY;
      if (!ox && !oy) return;
      ox = T.MathUtils.clamp(ox, -0.25, 0.25); oy = T.MathUtils.clamp(oy, -0.25, 0.25);
      S.x += ox * viewW / 2 * 1.02; S.y += oy * viewH / 2 * 1.02;
      if (ox && Math.sign(S.vx) !== Math.sign(ox)) S.vx *= -0.25;
      if (oy && Math.sign(S.vy) !== Math.sign(oy)) S.vy *= -0.25;
      pose();
    }
  }

  function step(dt, t) {
    const idle = reduce.matches ? 0 : 1;
    const restX = REST.x + Math.sin(t * 0.7) * 0.04 * idle;
    let lookX = 0, lookY = 0;
    if (pointerIn && !dragging) {
      lookX = T.MathUtils.clamp((pointer.x - S.x) * 0.1, -0.22, 0.22);
      lookY = T.MathUtils.clamp((pointer.y - (S.y - H * scale / 2)) * 0.05, -0.12, 0.12);
    }
    const rangeX = 0.9 * scale, rangeY = 0.6 * scale;

    if (dragging) {
      const tx = REST.x + softClamp(pointer.x + grab.x - REST.x, rangeX);
      const ty = REST.y + softClamp(pointer.y + grab.y - REST.y, rangeY);
      S.vx = (tx - S.x) * 16; S.vy = (ty - S.y) * 16;
      S.x += S.vx * dt; S.y += S.vy * dt;
      S.vry += dragDX * 3.2 / scale; dragDX = 0;
      S.vry += (-S.ry * 1.2 - S.vry * 0.9) * dt;            // the lanyard resists twisting
    } else {
      S.vx += (-(S.x - restX) * 38 - S.vx * 4.2) * dt;
      S.vy += (-(S.y - REST.y) * 38 - S.vy * 4.2) * dt;
      S.x += S.vx * dt; S.y += S.vy * dt;
      const target = Math.sin(t * 0.45) * 0.18 * idle + lookX;
      S.vry += (-(S.ry - target) * 5.5 - S.vry * 1.6) * dt;  // unwinds back to the front
    }
    S.vry = T.MathUtils.clamp(S.vry, -16, 16);
    S.ry = T.MathUtils.clamp(S.ry + S.vry * dt, -TAU * 1.5, TAU * 1.5);

    const wobT = T.MathUtils.clamp(-S.vx * 0.08, -0.28, 0.28);
    S.vwob += ((wobT - S.wob) * 40 - S.vwob * 5) * dt; S.wob += S.vwob * dt;
    const rxT = T.MathUtils.clamp(S.vy * 0.05, -0.2, 0.2) - lookY;
    S.vrx += ((rxT - S.rx) * 30 - S.vrx * 6) * dt; S.rx += S.vrx * dt;

    pose();
    confine();
    faceMat.uniforms.uLight.value.set(S.x - 8.5 * scale, S.y + 3.5 * scale, 10);
    /* Safety net: if anything ever throws the card far off, put it back at rest instantly. */
    if (!Number.isFinite(S.x + S.y + S.ry) || Math.abs(S.x - REST.x) > 2.5 * scale || Math.abs(S.y - REST.y) > 2 * scale) {
      S.x = REST.x; S.y = REST.y; S.vx = S.vy = S.vry = S.vwob = S.vrx = 0; S.ry = S.wob = S.rx = 0;
      pose();
    }

    glareMat.uniforms.uShift.value = T.MathUtils.clamp(Math.sin(S.ry) * 0.9 + S.wob * 0.6 + (pointerIn ? (pointer.x - S.x) * -0.08 : 0), -1.1, 1.1);
    glareMat.uniforms.uOpacity.value = 0.38 + Math.min(0.3, Math.abs(Math.sin(S.ry)) * 0.35 + Math.abs(S.rx) * 0.45);

    updateStrap();
  }

  const up = new T.Vector3(), cardX = new T.Vector3(), attach = new T.Vector3(), p1 = new T.Vector3(), p2 = new T.Vector3();
  const pt = new T.Vector3(), prev = new T.Vector3(), tang = new T.Vector3(), wv = new T.Vector3(), base = new T.Vector3(), tmp = new T.Vector3();
  function bez(t, out) {
    const u = 1 - t, b0 = u * u * u, b1 = 3 * u * u * t, b2 = 3 * u * t * t, b3 = t * t * t;
    return out.set(
      b0 * ANCHOR.x + b1 * p1.x + b2 * p2.x + b3 * attach.x,
      b0 * ANCHOR.y + b1 * p1.y + b2 * p2.y + b3 * attach.y,
      b0 * ANCHOR.z + b1 * p1.z + b2 * p2.z + b3 * attach.z);
  }
  function updateStrap() {
    attach.set(0, 0.08, 0).applyMatrix4(card.matrixWorld);
    up.set(0, 1, 0).applyQuaternion(card.quaternion);
    cardX.set(1, 0, 0).applyQuaternion(card.quaternion);
    const dist = ANCHOR.distanceTo(attach);
    p1.copy(ANCHOR).add(tmp.set(0, -dist * 0.4, 0));
    p2.copy(attach).addScaledVector(up, dist * 0.32);
    const hw = STRAP_W * scale / 2;
    let len = 0;
    bez(0, prev);
    for (let i = 0; i <= SEG; i++) {
      const t = i / SEG;
      bez(t, pt);
      bez(Math.min(1, t + 0.01), tang); tang.sub(bez(Math.max(0, t - 0.01), tmp)).normalize();
      if (i) len += pt.distanceTo(prev);
      prev.copy(pt);
      // Twist spreads evenly along the strap; the last part lines up with the card.
      const yaw = S.ry * t;
      base.set(Math.cos(yaw), 0, -Math.sin(yaw));
      const k = Math.pow(t, 6);
      wv.copy(base).multiplyScalar(1 - k).addScaledVector(cardX, k);
      wv.addScaledVector(tang, -wv.dot(tang)).normalize();
      const o = i * 6;
      sPos[o] = pt.x - wv.x * hw; sPos[o + 1] = pt.y - wv.y * hw; sPos[o + 2] = pt.z - wv.z * hw;
      sPos[o + 3] = pt.x + wv.x * hw; sPos[o + 4] = pt.y + wv.y * hw; sPos[o + 5] = pt.z + wv.z * hw;
      const v = len / (STRAP_W * scale) * 0.25, q = i * 4;
      sUV[q] = 0; sUV[q + 1] = v; sUV[q + 2] = 1; sUV[q + 3] = v;
    }
    /* Measure the woven pattern from the card end, so the CLOSED lettering always sits fully visible
       just above the badge (centred about 1.2 strap widths above the slot loop). */
    const per = (STRAP_W * scale) / 0.25;
    for (let i = 0, run = 0; i <= SEG; i++) {
      if (i) run += Math.hypot(sPos[i * 6] - sPos[i * 6 - 6], sPos[i * 6 + 1] - sPos[i * 6 - 5], sPos[i * 6 + 2] - sPos[i * 6 - 4]);
      const v = (run - len) / per + 1.0;
      sUV[i * 4 + 1] = v; sUV[i * 4 + 3] = v;
    }
    strapGeo.attributes.position.needsUpdate = true;
    strapGeo.attributes.uv.needsUpdate = true;
    strapGeo.computeVertexNormals();
  }

  /* Render loop: sleeps when still or off screen. */
  let raf = 0, last = 0, onScreen = true, stillFrames = 0;
  function frame(now) {
    raf = 0;
    const t = now / 1000;
    const dt = Math.min(1 / 30, last ? t - last : 1 / 60);
    last = t;
    if (!started) return;
    step(dt, t);
    renderer.render(scene, camera);
    const moving = dragging || Math.abs(S.vx) + Math.abs(S.vy) + Math.abs(S.vry) + Math.abs(S.vwob) > 0.002;
    stillFrames = moving ? 0 : stillFrames + 1;
    if (onScreen && !document.hidden && (!reduce.matches || moving || stillFrames < 10)) raf = requestAnimationFrame(frame);
    else last = 0;
  }
  function wake() { if (!raf && onScreen && !document.hidden) raf = requestAnimationFrame(frame); }

  new ResizeObserver(layout).observe(stage);
  new IntersectionObserver((es) => { onScreen = es[0].isIntersecting; if (onScreen) wake(); }).observe(stage);
  document.addEventListener('visibilitychange', wake);
  if (reduce.addEventListener) reduce.addEventListener('change', wake);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  layout();

  /* Woven nylon: twill weave, stitched hems and a jacquard CLOSED wordmark. */
  function makeFabricTextures() {
    const Wd = 256, Ht = 1024;
    const mk = () => { const c = document.createElement('canvas'); c.width = Wd; c.height = Ht; return c; };
    const colorC = mk(), bumpC = mk();
    const cx = colorC.getContext('2d'), bx = bumpC.getContext('2d');
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

    cx.fillStyle = '#0f0f11'; cx.fillRect(0, 0, Wd, Ht);
    bx.fillStyle = '#404040'; bx.fillRect(0, 0, Wd, Ht);

    /* Jacquard word, woven slightly lighter into the body. */
    const word = mk(), wx = word.getContext('2d');
    wx.translate(Wd / 2, Ht * 0.7); wx.rotate(Math.PI / 2);
    wx.fillStyle = '#fff'; wx.font = '700 118px Arial, Helvetica, sans-serif';
    wx.textAlign = 'center'; wx.textBaseline = 'middle';
    wx.fillText('CLOSED', 0, 6);
    const wordData = wx.getImageData(0, 0, Wd, Ht).data;

    /* Twill: 2-pixel threads, each row offset by one thread to form diagonals. */
    const HEM = 18;
    for (let y = 0; y < Ht; y += 2) {
      for (let x = 0; x < Wd; x += 2) {
        const inHem = x < HEM || x >= Wd - HEM;
        const diag = ((x >> 1) + (y >> 1)) % 4;
        const lit = inHem ? ((y >> 1) % 2 === 0) : diag < 2;
        const a = wordData[((y * Wd) + x) * 4 + 3] / 255;
        const n = rnd() * 10 - 5;
        const v = (lit ? 23 : 13) + n * 0.7 + (inHem ? 5 : 0) + a * (lit ? 52 : 40);
        cx.fillStyle = `rgb(${v | 0},${v | 0},${(v + 2) | 0})`;
        cx.fillRect(x, y, 2, 2);
        const bv = (lit ? 170 : 90) + n * 3 + (inHem ? 20 : 0);
        bx.fillStyle = `rgb(${bv | 0},${bv | 0},${bv | 0})`;
        bx.fillRect(x, y, 2, 2);
      }
    }
    /* Stitch lines along both hems and loose fibres. */
    for (const sx of [HEM - 3, Wd - HEM + 1]) {
      for (let y = 0; y < Ht; y += 10) {
        cx.fillStyle = '#2b2b30'; cx.fillRect(sx, y, 2, 6);
        bx.fillStyle = '#e0e0e0'; bx.fillRect(sx, y, 2, 6);
      }
    }
    cx.fillStyle = '#050506'; cx.fillRect(0, 0, 3, Ht); cx.fillRect(Wd - 3, 0, 3, Ht);
    for (let i = 0; i < 900; i++) {
      cx.fillStyle = `rgba(255,255,255,${(rnd() * 0.05).toFixed(3)})`;
      cx.fillRect(rnd() * Wd, rnd() * Ht, 1, 2 + rnd() * 5);
    }
    const finish = (c, srgb) => {
      const t = new T.CanvasTexture(c);
      t.wrapS = T.ClampToEdgeWrapping; t.wrapT = T.RepeatWrapping;
      t.flipY = false; t.anisotropy = maxAniso;
      if (srgb) t.encoding = T.sRGBEncoding;
      return t;
    };
    return { map: finish(colorC, true), bump: finish(bumpC, false) };
  }

  function makeBackTexture() {
    const c = document.createElement('canvas'); c.width = 514; c.height = 830;
    const x = c.getContext('2d');
    const bg = x.createLinearGradient(0, 0, 514, 830);
    bg.addColorStop(0, '#2c2e33'); bg.addColorStop(0.5, '#3b3e44'); bg.addColorStop(1, '#25272b');
    x.fillStyle = bg; x.fillRect(0, 0, 514, 830);
    for (let y = 0; y < 830; y++) { x.fillStyle = `rgba(255,255,255,${(Math.random() * 0.035).toFixed(3)})`; x.fillRect(0, y, 514, 1); }
    x.strokeStyle = 'rgba(0,0,0,.45)'; x.lineWidth = 2; x.strokeRect(26, 26, 462, 778);
    x.fillStyle = '#1b1c1f';
    for (const [cx, cy] of [[52, 52], [462, 52], [52, 778], [462, 778]]) { x.beginPath(); x.arc(cx, cy, 11, 0, TAU); x.fill(); }
    x.strokeStyle = 'rgba(0,0,0,.55)'; x.lineWidth = 3; roundRect(x, 108, 20, 298, 41, 18); x.stroke();

    const mark = ['M45 12H23Q10 12 10 25V59Q10 72 23 72H45', 'M61 12V59Q61 72 74 72H98', 'M126 12H138Q151 12 151 25V59Q151 72 138 72H126Q113 72 113 59V25Q113 12 126 12Z',
      'M205 12H180Q167 12 167 25V29Q167 42 180 42H192Q205 42 205 55V59Q205 72 192 72H167', 'M260 12H235Q222 12 222 25V59Q222 72 235 72H260M223 42H254', 'M276 12H298Q316 12 316 30V54Q316 72 298 72H276Z'];
    const drawMark = (ox, oy, color) => {
      x.save(); x.translate(ox, oy); x.scale(1.05, 1.05);
      x.strokeStyle = color; x.lineWidth = 11; x.lineCap = 'round'; x.lineJoin = 'round';
      for (const d of mark) x.stroke(new Path2D(d));
      x.restore();
    };
    drawMark(86, 301.5, 'rgba(255,255,255,.18)');
    drawMark(85, 300, '#16171a');
    x.strokeStyle = '#16171a'; x.lineWidth = 4;
    x.beginPath(); x.arc(257, 470, 30, 0, TAU); x.stroke();
    for (const dx of [-12, 0, 12]) { x.beginPath(); x.moveTo(257 + dx, 445); x.lineTo(257 + dx, 495); x.stroke(); }
    x.fillStyle = '#8c8f95'; x.font = '500 15px monospace'; x.textAlign = 'center';
    x.fillText('MEMBER ACCESS', 257, 600);
    x.fillStyle = '#62656b'; x.font = '13px monospace';
    x.fillText('CLOSED.PROJECT — 2026', 257, 628);
    x.fillText('№ 0047283', 257, 652);
    const t = new T.CanvasTexture(c);
    t.encoding = T.sRGBEncoding;
    return t;
  }
  function roundRect(x, l, t, w, h, r) {
    x.beginPath(); x.moveTo(l + r, t); x.arcTo(l + w, t, l + w, t + h, r); x.arcTo(l + w, t + h, l, t + h, r);
    x.arcTo(l, t + h, l, t, r); x.arcTo(l, t, l + w, t, r); x.closePath();
  }
})();
