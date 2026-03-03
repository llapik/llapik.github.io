/* ============================================
   3D Particle System — Lusion-inspired
   Flow field + 3D depth + camera tilt
   Dissolve transitions + burst effects
   ============================================ */

(function () {
  'use strict';

  const canvas = document.getElementById('fluid-canvas');
  if (!canvas) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) { canvas.style.display = 'none'; return; }

  const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent)
                   || window.innerWidth < 768;

  const COUNT = isMobile ? 900 : 3500;
  const LINE_COUNT = isMobile ? 600 : 2500;

  /* ---------- Three.js Setup ---------- */
  const renderer = new THREE.WebGLRenderer({
    canvas, alpha: true, antialias: false,
    powerPreference: isMobile ? 'low-power' : 'high-performance'
  });
  const dpr = isMobile ? 1 : Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(dpr);
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 4;

  const group = new THREE.Group();
  scene.add(group);

  /* ---------- Particle Shaders ---------- */
  const particleVert = `
    attribute float aSize;
    attribute float aRandom;

    uniform float uTime;
    uniform float uScrollProgress;
    uniform vec2  uMouse;
    uniform float uMouseInfluence;
    uniform float uBurst;
    uniform float uBurstTime;
    uniform float uPixelRatio;
    uniform float uLightMode;

    varying vec3 vColor;
    varying float vAlpha;
    varying float vDist;

    /* ---- cheap 3D gradient noise ---- */
    vec3 hash3(vec3 p) {
      p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
               dot(p, vec3(269.5, 183.3, 246.1)),
               dot(p, vec3(113.5, 271.9, 124.6)));
      return -1.0 + 2.0 * fract(sin(p) * 43758.5453);
    }

    float gnoise(vec3 p) {
      vec3 i = floor(p);
      vec3 f = fract(p);
      vec3 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(mix(dot(hash3(i), f),
                dot(hash3(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),
            mix(dot(hash3(i + vec3(0,1,0)), f - vec3(0,1,0)),
                dot(hash3(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x), u.y),
        mix(mix(dot(hash3(i + vec3(0,0,1)), f - vec3(0,0,1)),
                dot(hash3(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),
            mix(dot(hash3(i + vec3(0,1,1)), f - vec3(0,1,1)),
                dot(hash3(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x), u.y), u.z);
    }

    /* ---- flow field ---- */
    vec3 flowField(vec3 pos, float t) {
      return vec3(
        gnoise(pos * 0.8 + t * 0.15),
        gnoise(pos * 0.8 + t * 0.12 + 100.0),
        gnoise(pos * 0.6 + t * 0.1  + 200.0)
      );
    }

    /* ---- section colors (dark) ---- */
    vec3 sectionColorDark(float scroll, float r) {
      vec3 hero    = mix(vec3(0.1, 0.4, 1.0), vec3(0.5, 0.8, 1.0), r);
      vec3 about   = mix(vec3(0.5, 0.0, 1.0), vec3(0.0, 0.8, 0.93), r);
      vec3 proj    = mix(vec3(1.0, 0.4, 0.0), vec3(1.0, 0.13, 0.0), r);
      vec3 contact = mix(vec3(0.0, 0.8, 0.6), vec3(0.6, 1.0, 0.93), r);

      float t1 = smoothstep(0.0,  0.2,  scroll);
      float t2 = smoothstep(0.25, 0.5,  scroll);
      float t3 = smoothstep(0.55, 0.8,  scroll);

      vec3 c = mix(hero, about, t1);
      c = mix(c, proj, t2);
      c = mix(c, contact, t3);
      return c;
    }

    /* ---- section colors (light) ---- */
    vec3 sectionColorLight(float scroll, float r) {
      vec3 hero    = mix(vec3(0.2, 0.45, 0.95), vec3(0.15, 0.35, 0.8), r);
      vec3 about   = mix(vec3(0.5, 0.15, 0.9), vec3(0.1, 0.55, 0.85), r);
      vec3 proj    = mix(vec3(0.95, 0.45, 0.05), vec3(0.85, 0.15, 0.0), r);
      vec3 contact = mix(vec3(0.05, 0.65, 0.5), vec3(0.0, 0.45, 0.35), r);

      float t1 = smoothstep(0.0,  0.2,  scroll);
      float t2 = smoothstep(0.25, 0.5,  scroll);
      float t3 = smoothstep(0.55, 0.8,  scroll);

      vec3 c = mix(hero, about, t1);
      c = mix(c, proj, t2);
      c = mix(c, contact, t3);
      return c;
    }

    void main() {
      float t = uTime;
      float scroll = uScrollProgress;
      float rnd = aRandom;

      /* -- flow field displacement -- */
      float speed = 0.3 + scroll * 0.4;
      speed += smoothstep(0.35, 0.55, scroll) * 0.6;
      speed -= smoothstep(0.7, 0.9, scroll) * 0.3;

      vec3 flow = flowField(position, t * speed) * (0.4 + speed * 0.3);

      vec3 pos = position + flow;

      /* -- mouse repulsion -- */
      vec2 mouseWorld = (uMouse - 0.5) * vec2(5.5, 3.2);
      vec2 diff = pos.xy - mouseWorld;
      float mDist = length(diff);
      float repel = uMouseInfluence * 0.6 / (mDist * mDist + 0.4);
      pos.xy += normalize(diff + 0.001) * repel * 0.25;

      /* -- burst effect -- */
      if (uBurst > 0.01) {
        vec3 burstDir = normalize(pos + 0.001);
        float force = uBurst * exp(-uBurstTime * 1.8) * 2.5;
        pos += burstDir * force * (0.4 + rnd * 0.8);

        // Swirl during burst
        float angle = uBurstTime * 3.0 * (rnd - 0.5);
        float cosA = cos(angle * 0.3);
        float sinA = sin(angle * 0.3);
        pos.xy = mat2(cosA, -sinA, sinA, cosA) * pos.xy;
      }

      /* -- color -- */
      vec3 col;
      if (uLightMode > 0.5) {
        col = sectionColorLight(scroll, rnd);
      } else {
        col = sectionColorDark(scroll, rnd);
      }

      // Brighten during burst
      col = mix(col, col + 0.3, uBurst * exp(-uBurstTime * 2.0));

      vColor = col;

      /* -- project to screen -- */
      vec4 mv = modelViewMatrix * vec4(pos, 1.0);
      float depth = -mv.z;

      /* -- depth-of-field simulation -- */
      float dof = smoothstep(2.0, 6.0, depth);
      vAlpha = mix(0.85, 0.15, dof);
      vDist = depth;

      // Burst boosts alpha
      vAlpha += uBurst * exp(-uBurstTime * 2.0) * 0.3;
      vAlpha = clamp(vAlpha, 0.0, 1.0);

      // Light mode: reduce alpha
      if (uLightMode > 0.5) {
        vAlpha *= 0.7;
      }

      float baseSize = aSize * uPixelRatio;
      gl_PointSize = baseSize * (250.0 / depth) * mix(1.0, 1.4, dof);
      gl_PointSize = clamp(gl_PointSize, 1.0, 64.0);

      gl_Position = projectionMatrix * mv;
    }
  `;

  const particleFrag = `
    precision highp float;

    varying vec3 vColor;
    varying float vAlpha;
    varying float vDist;

    void main() {
      float dist = length(gl_PointCoord - 0.5);
      if (dist > 0.5) discard;

      /* soft circle with glow halo */
      float core = smoothstep(0.5, 0.15, dist);
      float glow = smoothstep(0.5, 0.0, dist) * 0.3;
      float alpha = (core * 0.7 + glow) * vAlpha;

      /* bright center */
      vec3 color = vColor;
      color += vec3(0.2) * core * core;

      gl_FragColor = vec4(color, alpha);
    }
  `;

  /* ---------- Line Shaders ---------- */
  const lineVert = `
    attribute float aAlpha;
    varying float vLineAlpha;
    varying vec3 vLineColor;

    void main() {
      vLineAlpha = aAlpha;
      vLineColor = color;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const lineFrag = `
    precision highp float;
    varying float vLineAlpha;
    varying vec3 vLineColor;

    void main() {
      gl_FragColor = vec4(vLineColor, vLineAlpha * 0.2);
    }
  `;

  /* ---------- Create Particles ---------- */
  const positions   = new Float32Array(COUNT * 3);
  const sizes       = new Float32Array(COUNT);
  const randoms     = new Float32Array(COUNT);

  for (let i = 0; i < COUNT; i++) {
    const i3 = i * 3;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = Math.pow(Math.random(), 0.6) * 3.0 + 0.3;

    positions[i3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = (Math.random() - 0.5) * 2.5;

    sizes[i]   = Math.random() * 4.0 + 1.0;
    randoms[i] = Math.random();
  }

  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute('aSize',    new THREE.BufferAttribute(sizes, 1));
  particleGeo.setAttribute('aRandom',  new THREE.BufferAttribute(randoms, 1));

  const uniforms = {
    uTime:           { value: 0 },
    uScrollProgress: { value: 0 },
    uMouse:          { value: new THREE.Vector2(0.5, 0.5) },
    uMouseInfluence: { value: 0 },
    uBurst:          { value: 0 },
    uBurstTime:      { value: 0 },
    uPixelRatio:     { value: dpr },
    uLightMode:      { value: 0 }
  };

  const particleMat = new THREE.ShaderMaterial({
    vertexShader: particleVert,
    fragmentShader: particleFrag,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const particles = new THREE.Points(particleGeo, particleMat);
  group.add(particles);

  /* ---------- Create Connecting Lines ---------- */
  // Pick random pairs and only draw if they're close enough (computed in render loop)
  const linePairs = [];
  for (let i = 0; i < LINE_COUNT; i++) {
    const a = Math.floor(Math.random() * COUNT);
    let b = Math.floor(Math.random() * COUNT);
    if (b === a) b = (a + 1) % COUNT;
    linePairs.push(a, b);
  }

  const linePositions = new Float32Array(LINE_COUNT * 6);
  const lineColors    = new Float32Array(LINE_COUNT * 6);
  const lineAlphas    = new Float32Array(LINE_COUNT * 2);

  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  lineGeo.setAttribute('color',    new THREE.BufferAttribute(lineColors, 3));
  lineGeo.setAttribute('aAlpha',   new THREE.BufferAttribute(lineAlphas, 1));

  const lineMat = new THREE.ShaderMaterial({
    vertexShader: lineVert,
    fragmentShader: lineFrag,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true
  });

  const lines = new THREE.LineSegments(lineGeo, lineMat);
  group.add(lines);

  /* ---------- Interaction State ---------- */
  const state = {
    scrollProgress: 0,
    targetScrollProgress: 0,
    mouseX: 0.5, mouseY: 0.5,
    targetMouseX: 0.5, targetMouseY: 0.5,
    mouseInfluence: 0, targetMouseInfluence: 0,
    burst: 0, burstTime: 0, isBursting: false,
    lightMode: 0,
    cameraTargetX: 0, cameraTargetY: 0
  };

  /* ---------- Public API ---------- */
  window.fluidState = state;
  window.fluidUniforms = uniforms;

  window.triggerBurst = function (scrollPos) {
    state.burst = 1.0;
    state.burstTime = 0;
    state.isBursting = true;
  };

  window.setFluidLightMode = function (isLight) {
    state.lightMode = isLight ? 1.0 : 0.0;
  };

  /* ---------- Events ---------- */
  function onScroll() {
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    state.targetScrollProgress = docH > 0 ? window.scrollY / docH : 0;
  }

  function onMouseMove(e) {
    state.targetMouseX = e.clientX / window.innerWidth;
    state.targetMouseY = 1.0 - e.clientY / window.innerHeight;
    state.targetMouseInfluence = 1.0;
    state.cameraTargetX = (e.clientX / window.innerWidth - 0.5) * 0.12;
    state.cameraTargetY = (e.clientY / window.innerHeight - 0.5) * -0.08;
  }

  function onMouseLeave() {
    state.targetMouseInfluence = 0;
    state.cameraTargetX = 0;
    state.cameraTargetY = 0;
  }

  function onClick() {
    // Small burst on click
    if (!state.isBursting) {
      state.burst = 0.4;
      state.burstTime = 0;
      state.isBursting = true;
    }
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('mousemove', onMouseMove, { passive: true });
  document.addEventListener('mouseleave', onMouseLeave);
  window.addEventListener('click', onClick);
  window.addEventListener('resize', onResize);

  /* ---------- Section color helpers (JS, for lines) ---------- */
  function lerpColor(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }

  function getSectionColor(scroll, rnd, light) {
    const palettes = light ? [
      [[0.2,0.45,0.95], [0.15,0.35,0.8]],
      [[0.5,0.15,0.9],  [0.1,0.55,0.85]],
      [[0.95,0.45,0.05],[0.85,0.15,0.0]],
      [[0.05,0.65,0.5], [0.0,0.45,0.35]]
    ] : [
      [[0.1,0.4,1.0],  [0.5,0.8,1.0]],
      [[0.5,0.0,1.0],  [0.0,0.8,0.93]],
      [[1.0,0.4,0.0],  [1.0,0.13,0.0]],
      [[0.0,0.8,0.6],  [0.6,1.0,0.93]]
    ];

    function getCol(pal) { return lerpColor(pal[0], pal[1], rnd); }

    const t1 = Math.max(0, Math.min(1, (scroll - 0.0) / 0.2));
    const t2 = Math.max(0, Math.min(1, (scroll - 0.25) / 0.25));
    const t3 = Math.max(0, Math.min(1, (scroll - 0.55) / 0.25));

    let c = lerpColor(getCol(palettes[0]), getCol(palettes[1]), t1);
    c = lerpColor(c, getCol(palettes[2]), t2);
    c = lerpColor(c, getCol(palettes[3]), t3);
    return c;
  }

  /* ---------- Render Loop ---------- */
  // We need particle world positions for lines — extract from shader logic in JS
  // Simplified: use base positions + simple sin-based flow (approximation)
  const worldPositions = new Float32Array(COUNT * 3);

  let lastTime = 0;
  const FPS_INTERVAL = isMobile ? 1000 / 30 : 0;

  function animate(time) {
    requestAnimationFrame(animate);
    if (isMobile && time - lastTime < FPS_INTERVAL) return;
    lastTime = time;

    const t = time * 0.001;
    const dt = 0.016;

    // Smooth interpolation
    state.scrollProgress += (state.targetScrollProgress - state.scrollProgress) * 0.04;
    state.mouseX += (state.targetMouseX - state.mouseX) * 0.06;
    state.mouseY += (state.targetMouseY - state.mouseY) * 0.06;
    state.mouseInfluence += (state.targetMouseInfluence - state.mouseInfluence) * 0.05;
    state.targetMouseInfluence *= 0.993;

    // Burst decay
    if (state.isBursting) {
      state.burstTime += dt;
      state.burst *= 0.97;
      if (state.burst < 0.01) { state.burst = 0; state.isBursting = false; }
    }

    // Camera tilt (3D parallax)
    group.rotation.y += (state.cameraTargetX - group.rotation.y) * 0.03;
    group.rotation.x += (state.cameraTargetY - group.rotation.x) * 0.03;

    // Update uniforms
    uniforms.uTime.value = t;
    uniforms.uScrollProgress.value = state.scrollProgress;
    uniforms.uMouse.value.set(state.mouseX, state.mouseY);
    uniforms.uMouseInfluence.value = state.mouseInfluence;
    uniforms.uBurst.value = state.burst;
    uniforms.uBurstTime.value = state.burstTime;
    uniforms.uLightMode.value = state.lightMode;

    // Approximate world positions for lines (simplified flow field in JS)
    const scroll = state.scrollProgress;
    const speed = 0.3 + scroll * 0.4 + (scroll > 0.35 && scroll < 0.55 ? 0.6 : 0);
    const flowT = t * speed;
    const light = state.lightMode > 0.5;

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      const bx = positions[i3], by = positions[i3+1], bz = positions[i3+2];

      // Simplified flow (sin-based, matching shader noise roughly)
      const fx = Math.sin(by * 0.8 + flowT * 0.15) * 0.4 * speed;
      const fy = Math.cos(bx * 0.8 + flowT * 0.12) * 0.4 * speed;
      const fz = Math.sin(bx * 0.6 + flowT * 0.1) * 0.2 * speed;

      worldPositions[i3]     = bx + fx;
      worldPositions[i3 + 1] = by + fy;
      worldPositions[i3 + 2] = bz + fz;
    }

    // Update lines
    const lineDistThreshold = 1.2 + state.burst * 2.0;

    for (let i = 0; i < LINE_COUNT; i++) {
      const a = linePairs[i * 2];
      const b = linePairs[i * 2 + 1];
      const a3 = a * 3, b3 = b * 3;
      const i6 = i * 6;
      const i2 = i * 2;

      const ax = worldPositions[a3], ay = worldPositions[a3+1], az = worldPositions[a3+2];
      const bx = worldPositions[b3], by = worldPositions[b3+1], bz = worldPositions[b3+2];

      linePositions[i6]     = ax; linePositions[i6+1] = ay; linePositions[i6+2] = az;
      linePositions[i6 + 3] = bx; linePositions[i6+4] = by; linePositions[i6+5] = bz;

      const dx = ax - bx, dy = ay - by, dz = az - bz;
      const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

      // Alpha based on distance
      const alpha = dist < lineDistThreshold
        ? (1.0 - dist / lineDistThreshold) * 0.8
        : 0.0;

      lineAlphas[i2]     = alpha;
      lineAlphas[i2 + 1] = alpha;

      // Color from section palette
      const rnd = randoms[a];
      const col = getSectionColor(scroll, rnd, light);
      lineColors[i6]   = col[0]; lineColors[i6+1] = col[1]; lineColors[i6+2] = col[2];
      lineColors[i6+3] = col[0]; lineColors[i6+4] = col[1]; lineColors[i6+5] = col[2];
    }

    lineGeo.attributes.position.needsUpdate = true;
    lineGeo.attributes.color.needsUpdate = true;
    lineGeo.attributes.aAlpha.needsUpdate = true;

    renderer.render(scene, camera);
  }

  requestAnimationFrame(animate);
})();
