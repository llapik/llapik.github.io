/* ============================================
   Fluid Background — Liquid Color Mixing
   Dramatic per-section color transitions
   ============================================ */

(function () {
  'use strict';

  const canvas = document.getElementById('fluid-canvas');
  if (!canvas) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent)
                   || window.innerWidth < 768;

  if (prefersReducedMotion) {
    canvas.style.display = 'none';
    return;
  }

  /* ---------- Shader Sources ---------- */
  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    precision highp float;

    varying vec2 vUv;

    uniform float uTime;
    uniform float uScrollProgress;
    uniform vec2  uMouse;
    uniform float uMouseInfluence;
    uniform float uRipple;
    uniform float uRippleTime;
    uniform vec2  uResolution;

    /* ---- Section color palettes ----
       Hero:     deep blue + white (calm ocean)
       About:    purple + cyan (creative energy)
       Projects: orange + hot red (fire / passion)
       Contact:  teal + soft white (tranquil)
    */

    // Smooth noise functions
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289((x * 34.0 + 1.0) * x); }

    // Simplex 2D noise
    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                         -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m * m;
      m = m * m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
      g.x = a0.x * x0.x + h.x * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    // Fractal Brownian Motion with rotation per octave
    float fbm(vec2 p) {
      float val = 0.0;
      float amp = 0.5;
      float freq = 1.0;
      mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
      for (int i = 0; i < 6; i++) {
        val += amp * snoise(p * freq);
        p = rot * p;
        freq *= 2.0;
        amp *= 0.5;
      }
      return val;
    }

    // Domain warping — liquid distortion
    float warpedNoise(vec2 p, float t) {
      vec2 q = vec2(
        fbm(p + vec2(0.0, 0.0) + t * 0.15),
        fbm(p + vec2(5.2, 1.3) + t * 0.12)
      );
      vec2 r = vec2(
        fbm(p + 4.0 * q + vec2(1.7, 9.2) + t * 0.1),
        fbm(p + 4.0 * q + vec2(8.3, 2.8) + t * 0.08)
      );
      return fbm(p + 4.0 * r);
    }

    // Metaball field
    float metaball(vec2 p, vec2 center, float radius) {
      float d = length(p - center);
      return (radius * radius) / (d * d + 0.0005);
    }

    // Color palette per section
    void getSectionColors(float scroll, out vec3 col1, out vec3 col2, out vec3 col3) {
      // Hero: deep blue + white + cyan accent
      vec3 h1 = vec3(0.02, 0.08, 0.25);  // deep navy
      vec3 h2 = vec3(0.1, 0.4, 1.0);     // electric blue
      vec3 h3 = vec3(0.5, 0.8, 1.0);     // ice

      // About: purple + cyan + magenta
      vec3 a1 = vec3(0.15, 0.02, 0.35);  // deep purple
      vec3 a2 = vec3(0.5, 0.0, 1.0);     // vivid purple
      vec3 a3 = vec3(0.0, 0.8, 0.9);     // cyan

      // Projects: orange + red + gold
      vec3 p1 = vec3(0.3, 0.05, 0.0);    // deep ember
      vec3 p2 = vec3(1.0, 0.4, 0.0);     // orange
      vec3 p3 = vec3(1.0, 0.15, 0.05);   // hot red

      // Contact: teal + white + soft green
      vec3 c1 = vec3(0.02, 0.15, 0.18);  // deep teal
      vec3 c2 = vec3(0.0, 0.8, 0.6);     // emerald
      vec3 c3 = vec3(0.6, 1.0, 0.9);     // mint

      // Smooth transitions between sections
      // Each section occupies ~0.25 of scroll, overlapping at boundaries
      float t1 = smoothstep(0.0, 0.15, scroll);    // hero → about
      float t2 = smoothstep(0.25, 0.45, scroll);   // about → projects
      float t3 = smoothstep(0.55, 0.75, scroll);   // projects → contact

      col1 = mix(h1, a1, t1);
      col1 = mix(col1, p1, t2);
      col1 = mix(col1, c1, t3);

      col2 = mix(h2, a2, t1);
      col2 = mix(col2, p2, t2);
      col2 = mix(col2, c2, t3);

      col3 = mix(h3, a3, t1);
      col3 = mix(col3, p3, t2);
      col3 = mix(col3, c3, t3);
    }

    void main() {
      vec2 uv = vUv;
      float aspect = uResolution.x / uResolution.y;
      vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

      float scroll = uScrollProgress;

      // Turbulence ramps up for Projects section, calms for Contact
      float turbulence = 0.6
        + smoothstep(0.15, 0.35, scroll) * 0.4   // about: slightly more
        + smoothstep(0.35, 0.55, scroll) * 0.8    // projects: intense
        - smoothstep(0.65, 0.85, scroll) * 0.6;   // contact: calm down

      float speed = 0.3 + scroll * 0.5 + smoothstep(0.35, 0.55, scroll) * 0.7;
      float t = uTime * speed * 0.12;

      // --- Metaballs ---
      vec2 b1 = vec2(sin(t * 0.7) * 0.8, cos(t * 0.5) * 0.5);
      vec2 b2 = vec2(cos(t * 0.4 + 1.0) * 0.6, sin(t * 0.8 + 0.5) * 0.6);
      vec2 b3 = vec2(sin(t * 0.6 + 2.0) * 0.9, cos(t * 0.3 + 1.0) * 0.4);
      vec2 b4 = vec2(cos(t * 0.9 + 3.0) * 0.5, sin(t * 0.6 + 2.0) * 0.7);
      vec2 b5 = vec2(sin(t * 0.3 + 4.0) * 0.7, cos(t * 0.7 + 3.0) * 0.5);
      vec2 b6 = vec2(cos(t * 0.5 + 5.0) * 0.6, sin(t * 0.4 + 4.0) * 0.8);
      vec2 b7 = vec2(sin(t * 0.8 + 1.5) * 0.4, cos(t * 0.9 + 2.5) * 0.6);

      float blobSize = 0.14 + turbulence * 0.08;

      float field = 0.0;
      field += metaball(p, b1, blobSize * 1.3);
      field += metaball(p, b2, blobSize * 1.1);
      field += metaball(p, b3, blobSize * 0.9);
      field += metaball(p, b4, blobSize * 1.0);
      field += metaball(p, b5, blobSize * 1.2);
      field += metaball(p, b6, blobSize * 0.8);
      field += metaball(p, b7, blobSize * 1.0);

      // --- Mouse interaction ---
      vec2 mouseP = (uMouse - 0.5) * vec2(aspect, 1.0);
      float mouseDist = length(p - mouseP);
      float mouseField = uMouseInfluence * 0.15 / (mouseDist * mouseDist + 0.008);
      field += mouseField;

      // --- Click ripple ---
      if (uRipple > 0.01) {
        float rWave = sin(mouseDist * 25.0 - uRippleTime * 10.0) * 0.5 + 0.5;
        float rFade = exp(-uRippleTime * 2.5) * uRipple;
        float rRing = smoothstep(0.03, 0.0, abs(mouseDist - uRippleTime * 0.4));
        field += (rWave * 0.4 + rRing * 0.6) * rFade;
      }

      // --- Domain-warped noise for liquid feel ---
      float warp = warpedNoise(p * 1.5 + t * 0.3, t) * turbulence;
      field += warp * 0.5;

      // --- Secondary noise layer (small detail) ---
      float detail = snoise(p * 8.0 + t * 0.5) * 0.15;
      field += detail;

      // --- Blob thresholds ---
      float blobCore = smoothstep(0.85, 1.4, field);
      float blobGlow = smoothstep(0.5, 0.85, field);
      float blobOuter = smoothstep(0.3, 0.5, field);

      // --- Section colors ---
      vec3 colDeep, colMid, colBright;
      getSectionColors(scroll, colDeep, colMid, colBright);

      // Mix colors based on field intensity
      vec3 coreColor = mix(colMid, colBright, blobCore * 0.8 + detail);
      vec3 glowColor = mix(colDeep, colMid, blobGlow);
      vec3 outerColor = colDeep * 0.5;

      vec3 color = outerColor;
      color = mix(color, glowColor, blobGlow);
      color = mix(color, coreColor, blobCore);

      // --- Edge highlight (liquid surface tension) ---
      float edge = smoothstep(0.75, 0.85, field) - smoothstep(0.85, 0.95, field);
      color += colBright * edge * 0.6;

      // --- Vignette ---
      float vignette = 1.0 - length(vUv - 0.5) * 0.8;
      vignette = smoothstep(0.0, 1.0, vignette);

      // --- Alpha composition ---
      float alpha = blobOuter * 0.25 + blobGlow * 0.3 + blobCore * 0.35;
      alpha *= vignette;

      // Boost overall visibility
      alpha = alpha * 1.4;
      alpha = clamp(alpha, 0.0, 0.85);

      // Slight fade at very bottom
      float endFade = 1.0 - smoothstep(0.9, 1.0, scroll) * 0.3;
      alpha *= endFade;

      gl_FragColor = vec4(color, alpha);
    }
  `;

  /* ---------- Three.js Setup ---------- */
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: false,
    powerPreference: isMobile ? 'low-power' : 'high-performance'
  });

  const pixelRatio = isMobile ? 1 : Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const uniforms = {
    uTime:           { value: 0 },
    uScrollProgress: { value: 0 },
    uMouse:          { value: new THREE.Vector2(0.5, 0.5) },
    uMouseInfluence: { value: 0 },
    uRipple:         { value: 0 },
    uRippleTime:     { value: 0 },
    uResolution:     { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
  };

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false
  });

  const geometry = new THREE.PlaneGeometry(2, 2);
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  /* ---------- Interaction State ---------- */
  const state = {
    scrollProgress: 0,
    targetScrollProgress: 0,
    mouseX: 0.5,
    mouseY: 0.5,
    targetMouseX: 0.5,
    targetMouseY: 0.5,
    mouseInfluence: 0,
    targetMouseInfluence: 0,
    ripple: 0,
    rippleTime: 0,
    isRippling: false
  };

  /* ---------- Events ---------- */
  function onScroll() {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    state.targetScrollProgress = docHeight > 0 ? window.scrollY / docHeight : 0;
  }

  function onMouseMove(e) {
    state.targetMouseX = e.clientX / window.innerWidth;
    state.targetMouseY = 1.0 - e.clientY / window.innerHeight;
    state.targetMouseInfluence = 1.0;
  }

  function onMouseLeave() {
    state.targetMouseInfluence = 0;
  }

  function onClick(e) {
    state.targetMouseX = e.clientX / window.innerWidth;
    state.targetMouseY = 1.0 - e.clientY / window.innerHeight;
    state.ripple = 1.0;
    state.rippleTime = 0;
    state.isRippling = true;
  }

  function onResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('mousemove', onMouseMove, { passive: true });
  document.addEventListener('mouseleave', onMouseLeave);
  window.addEventListener('click', onClick);
  window.addEventListener('resize', onResize);

  window.fluidState = state;
  window.fluidUniforms = uniforms;

  /* ---------- Render Loop ---------- */
  let lastTime = 0;
  const FPS_INTERVAL = isMobile ? 1000 / 30 : 0;

  function animate(time) {
    requestAnimationFrame(animate);

    if (isMobile && time - lastTime < FPS_INTERVAL) return;
    lastTime = time;

    const dt = 0.016;

    // Smooth interpolation
    state.scrollProgress += (state.targetScrollProgress - state.scrollProgress) * 0.04;
    state.mouseX += (state.targetMouseX - state.mouseX) * 0.06;
    state.mouseY += (state.targetMouseY - state.mouseY) * 0.06;
    state.mouseInfluence += (state.targetMouseInfluence - state.mouseInfluence) * 0.04;

    // Decay mouse influence when idle
    state.targetMouseInfluence *= 0.995;

    // Ripple decay
    if (state.isRippling) {
      state.rippleTime += dt;
      state.ripple *= 0.96;
      if (state.ripple < 0.01) {
        state.ripple = 0;
        state.isRippling = false;
      }
    }

    uniforms.uTime.value = time * 0.001;
    uniforms.uScrollProgress.value = state.scrollProgress;
    uniforms.uMouse.value.set(state.mouseX, state.mouseY);
    uniforms.uMouseInfluence.value = state.mouseInfluence;
    uniforms.uRipple.value = state.ripple;
    uniforms.uRippleTime.value = state.rippleTime;

    renderer.render(scene, camera);
  }

  requestAnimationFrame(animate);
})();
