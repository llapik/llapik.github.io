/* ============================================
   Fluid Background — Three.js Metaball Shader
   Scroll-driven liquid simulation
   ============================================ */

(function () {
  'use strict';

  const canvas = document.getElementById('fluid-canvas');
  if (!canvas) return;

  // Detect reduced motion preference
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

  // Simplex-like fluid shader with metaball blobs, scroll-driven
  const fragmentShader = `
    precision mediump float;

    varying vec2 vUv;

    uniform float uTime;
    uniform float uScrollProgress;   // 0..1 overall page scroll
    uniform vec2  uMouse;            // normalised mouse coords
    uniform float uMouseInfluence;   // how much mouse affects the field
    uniform float uRipple;           // click ripple intensity
    uniform float uRippleTime;       // time since last ripple
    uniform vec2  uResolution;

    // Simple 2D noise (hash-based)
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    float fbm(vec2 p) {
      float val = 0.0;
      float amp = 0.5;
      float freq = 1.0;
      for (int i = 0; i < 5; i++) {
        val += amp * noise(p * freq);
        freq *= 2.0;
        amp *= 0.5;
      }
      return val;
    }

    // Metaball function
    float metaball(vec2 p, vec2 center, float radius) {
      float d = length(p - center);
      return radius * radius / (d * d + 0.001);
    }

    void main() {
      vec2 uv = vUv;
      float aspect = uResolution.x / uResolution.y;
      vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

      // Scroll-driven parameters
      // Hero (0-0.25): calm, slow
      // About (0.25-0.5): structured
      // Projects (0.5-0.75): chaotic
      // Contact (0.75-1): fade out
      float scrollSpeed = 0.3 + uScrollProgress * 1.2;
      float turbulence = 0.5 + smoothstep(0.3, 0.6, uScrollProgress) * 1.5
                           - smoothstep(0.7, 1.0, uScrollProgress) * 1.0;
      float orangeAmount = 0.3 + smoothstep(0.2, 0.5, uScrollProgress) * 0.5
                             - smoothstep(0.75, 1.0, uScrollProgress) * 0.3;

      float time = uTime * scrollSpeed * 0.15;

      // Animated blob positions
      vec2 b1 = vec2(sin(time * 0.7) * 0.6, cos(time * 0.5) * 0.4);
      vec2 b2 = vec2(cos(time * 0.4) * 0.5, sin(time * 0.8) * 0.5);
      vec2 b3 = vec2(sin(time * 0.6 + 2.0) * 0.7, cos(time * 0.3 + 1.0) * 0.3);
      vec2 b4 = vec2(cos(time * 0.9 + 3.0) * 0.4, sin(time * 0.6 + 2.0) * 0.6);
      vec2 b5 = vec2(sin(time * 0.3 + 4.0) * 0.5, cos(time * 0.7 + 3.0) * 0.4);

      float blobSize = 0.12 + turbulence * 0.06;

      // Metaball field
      float field = 0.0;
      field += metaball(p, b1, blobSize);
      field += metaball(p, b2, blobSize * 1.2);
      field += metaball(p, b3, blobSize * 0.8);
      field += metaball(p, b4, blobSize * 0.9);
      field += metaball(p, b5, blobSize * 1.1);

      // Mouse influence
      vec2 mouseP = (uMouse - 0.5) * vec2(aspect, 1.0);
      float mouseDist = length(p - mouseP);
      float mouseField = uMouseInfluence * 0.08 / (mouseDist * mouseDist + 0.01);
      field += mouseField;

      // Ripple from click
      if (uRipple > 0.0) {
        float rippleWave = sin(mouseDist * 30.0 - uRippleTime * 8.0) * 0.5 + 0.5;
        float rippleFade = exp(-uRippleTime * 2.0) * uRipple;
        float rippleRing = smoothstep(0.02, 0.0, abs(mouseDist - uRippleTime * 0.5));
        field += rippleWave * rippleFade * 0.3 + rippleRing * rippleFade * 0.5;
      }

      // Noise distortion
      float n = fbm(p * 3.0 + time * 0.5) * turbulence;
      field += n * 0.4;

      // Threshold
      float blob = smoothstep(0.8, 1.2, field);

      // Color mixing: white → orange based on scroll + field intensity
      vec3 colWhite = vec3(1.0, 1.0, 1.0);
      vec3 colOrange = vec3(1.0, 0.4, 0.0);
      vec3 blobColor = mix(colWhite, colOrange, orangeAmount * blob + n * 0.3);

      // Edge glow
      float edge = smoothstep(0.6, 0.8, field) - blob;
      vec3 edgeColor = mix(colWhite, colOrange, orangeAmount) * 0.5;

      // Compose
      float fadeOut = 1.0 - smoothstep(0.85, 1.0, uScrollProgress) * 0.6;
      float alpha = (blob * 0.15 + edge * 0.08) * fadeOut;

      vec3 finalColor = blobColor * blob + edgeColor * edge;

      gl_FragColor = vec4(finalColor, alpha);
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

  function onClick() {
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

  // Expose for cursor module
  window.fluidState = state;
  window.fluidUniforms = uniforms;

  /* ---------- Render Loop ---------- */
  let lastTime = 0;
  const FPS_INTERVAL = isMobile ? 1000 / 30 : 0; // cap mobile to 30fps

  function animate(time) {
    requestAnimationFrame(animate);

    if (isMobile && time - lastTime < FPS_INTERVAL) return;
    lastTime = time;

    const dt = 0.016; // ~60fps step

    // Smooth interpolation
    const lerpFactor = 0.05;
    state.scrollProgress += (state.targetScrollProgress - state.scrollProgress) * lerpFactor;
    state.mouseX += (state.targetMouseX - state.mouseX) * 0.08;
    state.mouseY += (state.targetMouseY - state.mouseY) * 0.08;
    state.mouseInfluence += (state.targetMouseInfluence - state.mouseInfluence) * 0.05;

    // Ripple decay
    if (state.isRippling) {
      state.rippleTime += dt;
      state.ripple *= 0.97;
      if (state.ripple < 0.01) {
        state.ripple = 0;
        state.isRippling = false;
      }
    }

    // Update uniforms
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
