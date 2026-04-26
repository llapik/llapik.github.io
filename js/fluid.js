/* ============================================
   Underwater Caustics — Three.js Shader
   Deep ocean light simulation
   ============================================ */
(function () {
  'use strict';

  const canvas = document.getElementById('fluid-canvas');
  if (!canvas) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent) || window.innerWidth < 768;

  if (prefersReducedMotion) { canvas.style.display = 'none'; return; }

  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    precision mediump float;
    varying vec2 vUv;

    uniform float uTime;
    uniform float uScroll;
    uniform vec2  uMouse;
    uniform float uMouseInf;
    uniform float uRipple;
    uniform float uRippleT;
    uniform vec2  uRes;
    uniform float uDark;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }

    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      f = f*f*(3.0-2.0*f);
      return mix(mix(hash(i), hash(i+vec2(1,0)), f.x),
                 mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
    }

    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      mat2 rot = mat2(0.8,-0.6,0.6,0.8);
      for(int i = 0; i < 5; i++) { v += a*noise(p); p = rot*p*2.0; a *= 0.5; }
      return v;
    }

    // Caustic light pattern
    float caustic(vec2 p, float t) {
      float c = 0.0;
      // Layer 1
      c += 0.5 * fbm(p * 3.0 + t * 0.4);
      // Layer 2 — sharper, faster
      c += 0.3 * pow(fbm(p * 5.0 - t * 0.6 + 3.14), 2.0);
      // Layer 3 — subtle detail
      c += 0.2 * fbm(p * 8.0 + t * 0.3 + 1.57);
      return c;
    }

    void main() {
      vec2 uv = vUv;
      float aspect = uRes.x / uRes.y;
      vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

      float t = uTime * 0.12;

      // Depth affects intensity — deeper = dimmer but more colorful
      float depth = smoothstep(0.0, 0.8, uScroll);
      float intensity = 1.0 - depth * 0.5;

      // Generate caustic pattern
      float c = caustic(p, t);

      // Mouse light beam
      vec2 mouseP = (uMouse - 0.5) * vec2(aspect, 1.0);
      float mDist = length(p - mouseP);
      float mouseLight = uMouseInf * 0.15 / (mDist * mDist + 0.05);
      c += mouseLight;

      // Ripple
      if (uRipple > 0.0) {
        float wave = sin(mDist * 25.0 - uRippleT * 10.0) * 0.5 + 0.5;
        float fade = exp(-uRippleT * 2.5) * uRipple;
        c += wave * fade * 0.4;
      }

      // Color: monochrome turquoise (light → mid → deep)
      vec3 colLight = vec3(0.37, 1.0, 0.91);
      vec3 colMid   = vec3(0.11, 0.91, 0.85);
      vec3 colDeep  = vec3(0.04, 0.55, 0.52);

      float colorShift = sin(p.x * 2.0 + t) * 0.5 + 0.5;
      vec3 shallowColor = mix(colLight, colMid, colorShift);
      vec3 deepColor    = mix(colMid, colDeep, colorShift * 0.7);
      vec3 waterColor   = mix(shallowColor, deepColor, depth);

      // Light theme: darker caustics on light bg
      if (uDark < 0.5) {
        waterColor *= 0.6;
      }

      // Final alpha — caustic brightness
      float pattern = smoothstep(0.35, 0.7, c);
      float glow = smoothstep(0.5, 0.9, c) * 0.5;
      float alphaBase = uDark > 0.5 ? 0.18 : 0.1;
      float alpha = (pattern * alphaBase + glow * 0.06) * intensity;

      vec3 finalColor = waterColor * (pattern + glow * 0.3);

      gl_FragColor = vec4(finalColor, alpha);
    }
  `;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: isMobile ? 'low-power' : 'high-performance' });
  renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

  const uniforms = {
    uTime:     { value: 0 },
    uScroll:   { value: 0 },
    uMouse:    { value: new THREE.Vector2(0.5, 0.5) },
    uMouseInf: { value: 0 },
    uRipple:   { value: 0 },
    uRippleT:  { value: 0 },
    uRes:      { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    uDark:     { value: isDark ? 1.0 : 0.0 }
  };

  scene.add(new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, transparent: true, depthWrite: false })
  ));

  window.addEventListener('themechange', (e) => { uniforms.uDark.value = e.detail.theme === 'dark' ? 1.0 : 0.0; });

  const st = { scroll: 0, tScroll: 0, mx: 0.5, my: 0.5, tmx: 0.5, tmy: 0.5, mi: 0, tmi: 0, ripple: 0, rippleT: 0, ripping: false };

  window.addEventListener('scroll', () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    st.tScroll = h > 0 ? window.scrollY / h : 0;
  }, { passive: true });

  window.addEventListener('mousemove', (e) => {
    st.tmx = e.clientX / window.innerWidth;
    st.tmy = 1.0 - e.clientY / window.innerHeight;
    st.tmi = 1.0;
  }, { passive: true });

  document.addEventListener('mouseleave', () => { st.tmi = 0; });
  window.addEventListener('click', () => { st.ripple = 1.0; st.rippleT = 0; st.ripping = true; });
  window.addEventListener('resize', () => { renderer.setSize(window.innerWidth, window.innerHeight); uniforms.uRes.value.set(window.innerWidth, window.innerHeight); });

  window.fluidState = st;

  let lastT = 0;
  const fpsInt = isMobile ? 1000 / 30 : 0;

  function tick(time) {
    requestAnimationFrame(tick);
    if (isMobile && time - lastT < fpsInt) return;
    lastT = time;

    st.scroll += (st.tScroll - st.scroll) * 0.05;
    st.mx += (st.tmx - st.mx) * 0.08;
    st.my += (st.tmy - st.my) * 0.08;
    st.mi += (st.tmi - st.mi) * 0.05;

    if (st.ripping) {
      st.rippleT += 0.016;
      st.ripple *= 0.97;
      if (st.ripple < 0.01) { st.ripple = 0; st.ripping = false; }
    }

    uniforms.uTime.value = time * 0.001;
    uniforms.uScroll.value = st.scroll;
    uniforms.uMouse.value.set(st.mx, st.my);
    uniforms.uMouseInf.value = st.mi;
    uniforms.uRipple.value = st.ripple;
    uniforms.uRippleT.value = st.rippleT;

    renderer.render(scene, camera);
  }
  requestAnimationFrame(tick);
})();
