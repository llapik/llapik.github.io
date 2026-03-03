/* ============================================
   Fluid Background — Liquid Metaballs
   Color burst on section transitions
   Subdued palette for text readability
   Light/Dark theme
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
    uniform float uBurst;
    uniform float uBurstTime;
    uniform float uBurstScroll;
    uniform float uLightMode;

    /* ---- noise ---- */
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289((x * 34.0 + 1.0) * x); }

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

    float fbm(vec2 p) {
      float val = 0.0, amp = 0.5, freq = 1.0;
      mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
      for (int i = 0; i < 6; i++) {
        val += amp * snoise(p * freq);
        p = rot * p;
        freq *= 2.0;
        amp *= 0.5;
      }
      return val;
    }

    float warpedNoise(vec2 p, float t) {
      vec2 q = vec2(fbm(p + t * 0.15), fbm(p + vec2(5.2, 1.3) + t * 0.12));
      vec2 r = vec2(fbm(p + 4.0 * q + vec2(1.7, 9.2) + t * 0.1),
                    fbm(p + 4.0 * q + vec2(8.3, 2.8) + t * 0.08));
      return fbm(p + 4.0 * r);
    }

    float metaball(vec2 p, vec2 center, float radius) {
      float d = length(p - center);
      return (radius * radius) / (d * d + 0.0005);
    }

    /* ---- DARK palette (subdued for readability) ---- */
    void getSectionColorsDark(float scroll, out vec3 col1, out vec3 col2, out vec3 col3) {
      vec3 h1 = vec3(0.01, 0.04, 0.14);
      vec3 h2 = vec3(0.07, 0.25, 0.65);
      vec3 h3 = vec3(0.25, 0.5, 0.75);

      vec3 a1 = vec3(0.08, 0.01, 0.2);
      vec3 a2 = vec3(0.3, 0.0, 0.6);
      vec3 a3 = vec3(0.0, 0.45, 0.55);

      vec3 p1 = vec3(0.18, 0.03, 0.0);
      vec3 p2 = vec3(0.6, 0.25, 0.0);
      vec3 p3 = vec3(0.6, 0.1, 0.03);

      vec3 c1 = vec3(0.01, 0.08, 0.1);
      vec3 c2 = vec3(0.0, 0.45, 0.3);
      vec3 c3 = vec3(0.25, 0.55, 0.45);

      float t1 = smoothstep(0.0, 0.15, scroll);
      float t2 = smoothstep(0.25, 0.45, scroll);
      float t3 = smoothstep(0.55, 0.75, scroll);

      col1 = mix(h1, a1, t1); col1 = mix(col1, p1, t2); col1 = mix(col1, c1, t3);
      col2 = mix(h2, a2, t1); col2 = mix(col2, p2, t2); col2 = mix(col2, c2, t3);
      col3 = mix(h3, a3, t1); col3 = mix(col3, p3, t2); col3 = mix(col3, c3, t3);
    }

    /* ---- LIGHT palette ---- */
    void getSectionColorsLight(float scroll, out vec3 col1, out vec3 col2, out vec3 col3) {
      vec3 h1 = vec3(0.9, 0.93, 1.0);
      vec3 h2 = vec3(0.25, 0.45, 0.85);
      vec3 h3 = vec3(0.12, 0.28, 0.7);

      vec3 a1 = vec3(0.93, 0.9, 1.0);
      vec3 a2 = vec3(0.4, 0.15, 0.7);
      vec3 a3 = vec3(0.08, 0.45, 0.6);

      vec3 p1 = vec3(1.0, 0.94, 0.88);
      vec3 p2 = vec3(0.8, 0.4, 0.08);
      vec3 p3 = vec3(0.7, 0.15, 0.04);

      vec3 c1 = vec3(0.9, 1.0, 0.96);
      vec3 c2 = vec3(0.08, 0.55, 0.4);
      vec3 c3 = vec3(0.0, 0.4, 0.3);

      float t1 = smoothstep(0.0, 0.15, scroll);
      float t2 = smoothstep(0.25, 0.45, scroll);
      float t3 = smoothstep(0.55, 0.75, scroll);

      col1 = mix(h1, a1, t1); col1 = mix(col1, p1, t2); col1 = mix(col1, c1, t3);
      col2 = mix(h2, a2, t1); col2 = mix(col2, p2, t2); col2 = mix(col2, c2, t3);
      col3 = mix(h3, a3, t1); col3 = mix(col3, p3, t2); col3 = mix(col3, c3, t3);
    }

    void main() {
      vec2 uv = vUv;
      float aspect = uResolution.x / uResolution.y;
      vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
      float scroll = uScrollProgress;

      /* turbulence driven by scroll */
      float turbulence = 0.6
        + smoothstep(0.15, 0.35, scroll) * 0.4
        + smoothstep(0.35, 0.55, scroll) * 0.8
        - smoothstep(0.65, 0.85, scroll) * 0.6;

      float speed = 0.3 + scroll * 0.5 + smoothstep(0.35, 0.55, scroll) * 0.7;
      float t = uTime * speed * 0.12;

      /* --- metaballs --- */
      vec2 b1 = vec2(sin(t * 0.7) * 0.8,  cos(t * 0.5) * 0.5);
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

      /* --- mouse interaction --- */
      vec2 mouseP = (uMouse - 0.5) * vec2(aspect, 1.0);
      float mouseDist = length(p - mouseP);
      field += uMouseInfluence * 0.15 / (mouseDist * mouseDist + 0.008);

      /* --- click ripple --- */
      if (uRipple > 0.01) {
        float rWave = sin(mouseDist * 25.0 - uRippleTime * 10.0) * 0.5 + 0.5;
        float rFade = exp(-uRippleTime * 2.5) * uRipple;
        float rRing = smoothstep(0.03, 0.0, abs(mouseDist - uRippleTime * 0.4));
        field += (rWave * 0.4 + rRing * 0.6) * rFade;
      }

      /* === burst on section enter === */
      float burstEffect = 0.0;
      vec3 burstColor = vec3(0.0);

      if (uBurst > 0.01) {
        float bt = uBurstTime;
        float ringDist = length(p);

        float wave1 = smoothstep(0.02, 0.0, abs(ringDist - bt * 1.2)) * exp(-bt * 1.5);
        float wave2 = smoothstep(0.04, 0.0, abs(ringDist - bt * 0.8 + 0.1)) * exp(-bt * 1.8);
        float wave3 = smoothstep(0.06, 0.0, abs(ringDist - bt * 1.5 + 0.05)) * exp(-bt * 2.0);

        float splash = snoise(p * 6.0 + bt * 2.0) * 0.5 + 0.5;
        splash *= exp(-bt * 2.0);
        splash *= smoothstep(bt * 1.5, bt * 0.3, ringDist);

        float angle = atan(p.y, p.x);
        float streaks = sin(angle * 12.0 + bt * 5.0) * 0.5 + 0.5;
        streaks *= smoothstep(bt * 1.2 + 0.1, bt * 0.5, ringDist);
        streaks *= exp(-bt * 1.8);

        burstEffect = (wave1 + wave2 + wave3) * 0.6 + splash * 0.4 + streaks * 0.3;
        burstEffect *= uBurst;
        burstEffect = clamp(burstEffect, 0.0, 1.0);

        vec3 bColDeep, bColMid, bColBright;
        if (uLightMode > 0.5) {
          getSectionColorsLight(uBurstScroll, bColDeep, bColMid, bColBright);
        } else {
          getSectionColorsDark(uBurstScroll, bColDeep, bColMid, bColBright);
        }
        burstColor = mix(bColBright, bColMid, splash);
        burstColor = mix(burstColor, vec3(1.0), 0.15);
      }

      /* --- domain-warped noise --- */
      float warp = warpedNoise(p * 1.5 + t * 0.3, t) * turbulence;
      field += warp * 0.5;
      field += snoise(p * 8.0 + t * 0.5) * 0.15;
      field += burstEffect * 0.4;

      /* --- blob thresholds --- */
      float blobCore  = smoothstep(0.85, 1.4, field);
      float blobGlow  = smoothstep(0.5,  0.85, field);
      float blobOuter = smoothstep(0.3,  0.5, field);

      /* --- section colors --- */
      vec3 colDeep, colMid, colBright;
      if (uLightMode > 0.5) {
        getSectionColorsLight(scroll, colDeep, colMid, colBright);
      } else {
        getSectionColorsDark(scroll, colDeep, colMid, colBright);
      }

      vec3 coreColor  = mix(colMid, colBright, blobCore * 0.8);
      vec3 glowColor  = mix(colDeep, colMid, blobGlow);
      vec3 outerColor = colDeep * 0.5;

      vec3 color = outerColor;
      color = mix(color, glowColor, blobGlow);
      color = mix(color, coreColor, blobCore);

      /* edge highlight (subtle) */
      float edge = smoothstep(0.75, 0.85, field) - smoothstep(0.85, 0.95, field);
      color += colBright * edge * 0.3;

      /* blend burst */
      color = mix(color, burstColor, burstEffect * 0.5);

      /* --- vignette (stronger — push fluid to edges) --- */
      float vignette = 1.0 - length(vUv - 0.5) * 0.9;
      vignette = smoothstep(0.0, 1.0, vignette);

      /* --- alpha (subdued for text readability) --- */
      float alpha = blobOuter * 0.12 + blobGlow * 0.18 + blobCore * 0.22;
      alpha *= vignette;
      alpha *= 1.1;
      alpha += burstEffect * 0.2;
      alpha = clamp(alpha, 0.0, 0.5);

      float endFade = 1.0 - smoothstep(0.9, 1.0, scroll) * 0.3;
      alpha *= endFade;

      if (uLightMode > 0.5) {
        alpha *= 0.4;
      }

      gl_FragColor = vec4(color, alpha);
    }
  `;

  /* ---------- Three.js Setup ---------- */
  const renderer = new THREE.WebGLRenderer({
    canvas, alpha: true, antialias: false,
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
    uResolution:     { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    uBurst:          { value: 0 },
    uBurstTime:      { value: 0 },
    uBurstScroll:    { value: 0 },
    uLightMode:      { value: 0 }
  };

  const material = new THREE.ShaderMaterial({
    vertexShader, fragmentShader, uniforms,
    transparent: true, depthWrite: false
  });

  const geometry = new THREE.PlaneGeometry(2, 2);
  scene.add(new THREE.Mesh(geometry, material));

  /* ---------- State ---------- */
  const state = {
    scrollProgress: 0, targetScrollProgress: 0,
    mouseX: 0.5, mouseY: 0.5,
    targetMouseX: 0.5, targetMouseY: 0.5,
    mouseInfluence: 0, targetMouseInfluence: 0,
    ripple: 0, rippleTime: 0, isRippling: false,
    burst: 0, burstTime: 0, burstScroll: 0, isBursting: false,
    lightMode: 0
  };

  /* ---------- Public API ---------- */
  window.fluidState = state;
  window.fluidUniforms = uniforms;

  window.triggerBurst = function (scrollPos) {
    state.burst = 1.0;
    state.burstTime = 0;
    state.burstScroll = scrollPos;
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
  }

  function onMouseLeave() { state.targetMouseInfluence = 0; }

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

  /* ---------- Render Loop ---------- */
  let lastTime = 0;
  const FPS_INTERVAL = isMobile ? 1000 / 30 : 0;

  function animate(time) {
    requestAnimationFrame(animate);
    if (isMobile && time - lastTime < FPS_INTERVAL) return;
    lastTime = time;

    const dt = 0.016;

    state.scrollProgress += (state.targetScrollProgress - state.scrollProgress) * 0.04;
    state.mouseX += (state.targetMouseX - state.mouseX) * 0.06;
    state.mouseY += (state.targetMouseY - state.mouseY) * 0.06;
    state.mouseInfluence += (state.targetMouseInfluence - state.mouseInfluence) * 0.04;
    state.targetMouseInfluence *= 0.995;

    if (state.isRippling) {
      state.rippleTime += dt;
      state.ripple *= 0.96;
      if (state.ripple < 0.01) { state.ripple = 0; state.isRippling = false; }
    }

    if (state.isBursting) {
      state.burstTime += dt;
      state.burst *= 0.975;
      if (state.burst < 0.01) { state.burst = 0; state.isBursting = false; }
    }

    uniforms.uTime.value = time * 0.001;
    uniforms.uScrollProgress.value = state.scrollProgress;
    uniforms.uMouse.value.set(state.mouseX, state.mouseY);
    uniforms.uMouseInfluence.value = state.mouseInfluence;
    uniforms.uRipple.value = state.ripple;
    uniforms.uRippleTime.value = state.rippleTime;
    uniforms.uBurst.value = state.burst;
    uniforms.uBurstTime.value = state.burstTime;
    uniforms.uBurstScroll.value = state.burstScroll;
    uniforms.uLightMode.value = state.lightMode;

    renderer.render(scene, camera);
  }

  requestAnimationFrame(animate);
})();
