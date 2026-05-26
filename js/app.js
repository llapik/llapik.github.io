/* ============================================
   Main App — Portfolio llapik
   Celestial / Monochrome theme
   ============================================ */
(function () {
  'use strict';

  /* ---------- Theme ---------- */
  const themeToggle = document.getElementById('theme-toggle');

  function detectTheme() {
    const s = localStorage.getItem('theme');
    if (s) return s;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('theme', t);
    if (themeToggle) themeToggle.textContent = t === 'dark' ? 'light' : 'dark';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#0a0a0a' : '#ededea');
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: t } }));
  }

  let currentTheme = detectTheme();
  applyTheme(currentTheme);
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(currentTheme);
    });
  }

  /* ---------- Scroll Progress Bar ---------- */
  const progressFill = document.querySelector('.scroll-progress-fill');
  function updateProgress() {
    if (!progressFill) return;
    const h = document.documentElement.scrollHeight - window.innerHeight;
    progressFill.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
  }
  window.addEventListener('scroll', updateProgress, { passive: true });

  /* ---------- Starfield + Scroll-driven Background Orbs ---------- */
  const starCanvas = document.getElementById('starfield');
  if (starCanvas && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const ctx = starCanvas.getContext('2d');
    let stars = [], orbKeys = null;
    let W = 0, H = 0;
    // Smoothed mouse offset (-1..1 from viewport center) for orb parallax
    let pmx = 0, pmy = 0, tmx = 0, tmy = 0;
    window.addEventListener('mousemove', (e) => {
      tmx = (e.clientX / window.innerWidth - 0.5) * 2;
      tmy = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    function initCanvas() {
      W = starCanvas.width = window.innerWidth;
      H = starCanvas.height = window.innerHeight;
      const S = Math.min(W, H);

      let seed = 1337;
      function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
      stars = Array.from({ length: 55 }, () => ({
        x: rnd() * W, y: rnd() * H,
        r: rnd() * 1.4 + 0.3, o: rnd() * 0.35 + 0.08,
        phase: rnd() * Math.PI * 2,
      }));

      // Keyframes: [hero, about, projects, contact]
      // Contact positions are fallbacks — DOM alignment takes over when scrolled in
      orbKeys = [
        // C0 — sun → vast faint about-orb → small planet → signal orb
        [
          { x: W*0.78, y: H*0.50, r: S*0.220, o: 1.00, ringRx: S*0.340, ringRy: S*0.115 },
          { x: W*0.80, y: H*0.50, r: S*0.340, o: 0.08, ringRx: S*0.400, ringRy: S*0.400 },
          { x: W*0.78, y: H*0.28, r: S*0.100, o: 0.20, ringRx: 0, ringRy: 0 },
          { x: W*0.28, y: H*0.58, r: S*0.065, o: 0.50, ringRx: 0, ringRy: 0 },
        ],
        // C1 — moon (orbiting hero) → secondary body
        [
          { x: W*0.78+S*0.34, y: H*0.50, r: S*0.044, o: 1.00 },
          { x: W*0.62, y: H*0.18, r: S*0.050, o: 0.45 },
          { x: W*0.62, y: H*0.65, r: S*0.075, o: 0.20 },
          { x: W*0.50, y: H*0.58, r: S*0.065, o: 0.50 },
        ],
        // C2 — far body → drifting planet → tertiary orb
        [
          { x: W*0.90, y: H*0.15, r: S*0.024, o: 0.45 },
          { x: W*0.93, y: H*0.82, r: S*0.030, o: 0.20 },
          { x: W*0.15, y: H*0.50, r: S*0.055, o: 0.25 },
          { x: W*0.72, y: H*0.58, r: S*0.065, o: 0.50 },
        ],
      ];
    }

    function getScenePos() {
      const ids = ['hero', 'about', 'projects', 'contact'];
      const secs = ids.map(id => document.getElementById(id));
      const mid = window.scrollY + H * 0.5;
      for (let i = secs.length - 1; i >= 0; i--) {
        if (!secs[i]) continue;
        const next = secs[i + 1];
        const bottom = next ? next.offsetTop : document.body.scrollHeight;
        if (mid >= secs[i].offsetTop) {
          return Math.min(i + Math.min((mid - secs[i].offsetTop) / Math.max(1, bottom - secs[i].offsetTop), 1), 3);
        }
      }
      return 0;
    }

    function lrp(a, b, t) { return a + (b - a) * t; }
    function eio(t) { return t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2, 2)/2; }

    function drawFrame(ts) {
      const t = ts / 1000;
      ctx.clearRect(0, 0, W, H);
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const rgb = isDark ? '237,237,234' : '10,10,10';

      // Stars
      stars.forEach(s => {
        const a = s.o * (0.55 + 0.45 * Math.sin(t * 0.7 + s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb},${a.toFixed(3)})`;
        ctx.fill();
      });

      if (!orbKeys || W <= 768) { requestAnimationFrame(drawFrame); return; }

      const sp = getScenePos();
      const fi = Math.min(Math.floor(sp), 2);
      const ft = eio(sp - fi);

      function interp(frames) {
        const a = frames[fi], b = frames[fi + 1] || frames[fi];
        return {
          x: lrp(a.x, b.x, ft), y: lrp(a.y, b.y, ft),
          r: lrp(a.r, b.r, ft), o: lrp(a.o, b.o, ft),
          ringRx: lrp(a.ringRx || 0, b.ringRx || 0, ft),
          ringRy: lrp(a.ringRy || 0, b.ringRy || 0, ft),
        };
      }

      const c0 = interp(orbKeys[0]);
      const c1 = interp(orbKeys[1]);
      const c2 = interp(orbKeys[2]);

      // Moon orbit — elliptical in hero, breaks free toward about
      const moonBlend = Math.max(0, 1 - sp * 1.5);
      if (moonBlend > 0) {
        const S = Math.min(W, H);
        const angle = t * (Math.PI * 2 / 14);
        const ox = c0.x + Math.cos(angle) * (S * 0.34);
        const oy = c0.y + Math.sin(angle) * (S * 0.115);
        c1.x = lrp(c1.x, ox, moonBlend);
        c1.y = lrp(c1.y, oy, moonBlend);
      }

      // Contact alignment strength — based on the contact section's own position
      // so it reliably reaches 1 even though it is the last (short) section.
      let contactBlend = 0;
      const contactSec = document.getElementById('contact');
      if (contactSec) {
        const cr = contactSec.getBoundingClientRect();
        contactBlend = Math.max(0, Math.min(1, (H * 0.9 - cr.top) / (H * 0.6)));
      }

      // Mouse parallax — orbs drift with the cursor for depth (faded out in contact)
      pmx += (tmx - pmx) * 0.05;
      pmy += (tmy - pmy) * 0.05;
      const par = 1 - contactBlend;
      [c0, c1, c2].forEach((c, i) => {
        const depth = 6 + i * 8;
        c.x += pmx * depth * par;
        c.y += pmy * depth * par;
      });

      // Align orbs precisely behind each contact channel orb
      if (contactBlend > 0) {
        // Read live positions each frame so orbs follow channel entry animation
        const dots = document.querySelectorAll('.contact-channel-orb');
        if (dots.length >= 3) {
          [c0, c1, c2].forEach((c, i) => {
            if (!dots[i]) return;
            const r = dots[i].getBoundingClientRect();
            c.x = lrp(c.x, r.left + r.width / 2, contactBlend);
            c.y = lrp(c.y, r.top + r.height / 2, contactBlend);
          });
        }
      }

      // Dashed orbit ring around C0
      if (c0.ringRx > 0.5) {
        ctx.save();
        ctx.setLineDash([3, 8]);
        ctx.strokeStyle = `rgba(${rgb},${(c0.o * 0.22).toFixed(3)})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.ellipse(c0.x, c0.y, c0.ringRx, c0.ringRy, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      // Constellation lines in projects/contact zone
      const lineFade = Math.max(0, Math.min(1, (sp - 1.6) / 0.7));
      if (lineFade > 0.01) {
        ctx.save();
        ctx.setLineDash([3, 12]);
        ctx.lineWidth = 0.6;
        [[c0, c1], [c1, c2], [c0, c2]].forEach(([a, b]) => {
          ctx.strokeStyle = `rgba(${rgb},${(Math.min(a.o, b.o) * 0.28 * lineFade).toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        });
        ctx.setLineDash([]);
        ctx.restore();
      }

      // Draw each orb: soft atmospheric corona + solid core
      function drawOrb(orb) {
        if (orb.o < 0.005 || orb.r < 0.5) return;
        const S = Math.min(W, H);
        // Glow halo — radius 3.5× the core, very faint
        const gr = orb.r * 3.5;
        const ga = Math.max(orb.o * 0.12, Math.min(orb.r / S * 0.5, 0.065));
        const grd = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, gr);
        grd.addColorStop(0,    `rgba(${rgb},${ga.toFixed(3)})`);
        grd.addColorStop(0.45, `rgba(${rgb},${(ga * 0.25).toFixed(3)})`);
        grd.addColorStop(1,    `rgba(${rgb},0)`);
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, gr, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
        // Solid core
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb},${orb.o.toFixed(3)})`;
        ctx.fill();
      }

      [c2, c1, c0].forEach(drawOrb);

      requestAnimationFrame(drawFrame);
    }

    initCanvas();
    window.addEventListener('resize', initCanvas, { passive: true });
    requestAnimationFrame(drawFrame);
  }

  /* ---------- Loader ---------- */
  window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    if (loader) setTimeout(() => loader.classList.add('loaded'), 900);
    animateHero();
  });

  /* ---------- Hero animation ---------- */
  function animateHero() {
    const steps = [
      { el: document.querySelector('.hero-greeting'), delay: 400 },
      { el: document.querySelector('.hero-name'),     delay: 650 },
      { el: document.querySelector('.hero-tagline'),  delay: 1050 },
      { el: document.querySelector('.hero-cta'),      delay: 1300 },
    ];
    steps.forEach(({ el, delay }) => {
      if (!el) return;
      setTimeout(() => {
        el.style.transition = 'opacity 1.2s cubic-bezier(0.25,0.46,0.45,0.94), transform 1.2s cubic-bezier(0.25,0.46,0.45,0.94)';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, delay);
    });

    setTimeout(() => {
      document.querySelectorAll('.hero-name [data-scramble]').forEach((el, idx) => {
        scrambleText(el, 900 + idx * 220);
      });
    }, 700);
  }

  /* ---------- Text Scramble ---------- */
  const CHARS = '!<>-_\\/[]{}—=+*^?#________';
  function scrambleText(el, duration) {
    const finalText = el.dataset.scrambleFinal || el.textContent;
    el.dataset.scrambleFinal = finalText;
    const len = finalText.length;
    const start = performance.now();
    function frame(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      let out = '';
      for (let i = 0; i < len; i++) {
        const cp = progress * len - i;
        if (cp >= 1) out += finalText[i];
        else if (cp > 0) out += finalText[i] === ' ' ? ' ' : CHARS[Math.floor(Math.random() * CHARS.length)];
        else out += ' ';
      }
      el.textContent = out;
      if (progress < 1) requestAnimationFrame(frame);
      else el.textContent = finalText;
    }
    requestAnimationFrame(frame);
  }

  /* ---------- Heading character reveal (reel-style) ---------- */
  function initHeadingCharReveal(el) {
    const nodes = Array.from(el.childNodes);
    el.innerHTML = '';
    nodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent.split('').forEach(ch => {
          if (ch === ' ' || ch === '\n') {
            if (ch === ' ') el.appendChild(document.createTextNode(' '));
          } else {
            const span = document.createElement('span');
            span.className = 'heading-char';
            span.textContent = ch;
            el.appendChild(span);
          }
        });
      } else {
        el.appendChild(node.cloneNode(true));
      }
    });
    // Staggered delays — 0.04s per char, like the reel
    el.querySelectorAll('.heading-char').forEach((char, i) => {
      char.style.transitionDelay = (i * 0.04) + 's';
    });
    el.classList.add('has-chars');
  }

  // Init all section headings on load
  document.querySelectorAll('.section-heading').forEach(el => {
    initHeadingCharReveal(el);
  });

  /* ---------- Hero Parallax ---------- */
  const heroContent = document.querySelector('.hero-content');
  let heroTargetY = 0, heroCurrentY = 0, heroTargetO = 1, heroCurrentO = 1, heroRaf = false;

  function lerpHero() {
    heroCurrentY += (heroTargetY - heroCurrentY) * 0.08;
    heroCurrentO += (heroTargetO - heroCurrentO) * 0.08;
    if (heroContent) {
      heroContent.style.opacity = heroCurrentO;
      heroContent.style.transform = `translateY(${heroCurrentY}px)`;
    }
    if (Math.abs(heroTargetY - heroCurrentY) > 0.5 || Math.abs(heroTargetO - heroCurrentO) > 0.005) {
      requestAnimationFrame(lerpHero);
    } else {
      heroRaf = false;
    }
  }

  window.addEventListener('scroll', () => {
    const s = window.scrollY, h = window.innerHeight;

    // Hero content parallax + fade
    if (heroContent && s < h) {
      const p = s / h;
      heroTargetO = Math.max(0, 1 - p * 1.4);
      heroTargetY = s * 0.28;
      if (!heroRaf) { heroRaf = true; requestAnimationFrame(lerpHero); }
    }

  }, { passive: true });

  /* ---------- Navigation ---------- */
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');

  window.addEventListener('scroll', () => {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 80);
  }, { passive: true });

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      navLinks.classList.toggle('open');
    });
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navLinks.classList.remove('open');
      });
    });
  }

  const sections = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('.nav-links a');
  function updateActiveNav() {
    const s = window.scrollY + window.innerHeight * 0.3;
    let id = '';
    sections.forEach(sec => { if (sec.offsetTop <= s) id = sec.id; });
    navAnchors.forEach(a => { a.classList.toggle('active', a.getAttribute('href') === '#' + id); });
  }
  window.addEventListener('scroll', updateActiveNav, { passive: true });

  /* ---------- Section label reveal ---------- */
  const labelObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        labelObs.unobserve(e.target);
      }
    });
  }, { root: null, threshold: 0.15 });
  document.querySelectorAll('.section-label').forEach(el => labelObs.observe(el));

  /* ---------- Section heading char reveal ---------- */
  const headingObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('reveal-done');
        headingObs.unobserve(e.target);
      }
    });
  }, { root: null, threshold: 0.15 });
  document.querySelectorAll('.section-heading').forEach(el => headingObs.observe(el));

  /* ---------- Scroll-driven scene transitions ---------- */
  // Replaces IntersectionObserver for main section wrappers.
  // Each wrapper enters from below and exits upward as you scroll past,
  // mirroring the reel's per-scene entrance/exit animations.
  const sceneDefs = [
    { id: 'about',    sel: '.about-wrapper' },
    { id: 'projects', sel: '.projects-wrapper' },
    { id: 'contact',  sel: '.contact-wrapper' },
  ].map(d => {
    const sec = document.getElementById(d.id);
    return { sec, wrapper: sec && sec.querySelector(d.sel.slice(1)) };
  }).filter(d => d.sec && d.wrapper);

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  let sceneRafId = null;

  function updateSceneTransitions() {
    const vh = window.innerHeight;
    sceneDefs.forEach(({ sec, wrapper }) => {
      const rect = sec.getBoundingClientRect();
      // centerOffset: 0 = section centered in viewport, +1 = one viewport below, -1 = one viewport above
      const centerOffset = (rect.top + rect.height / 2 - vh / 2) / vh;

      let opacity, ty;

      if (centerOffset > 0.85) {
        opacity = 0; ty = 55;
      } else if (centerOffset > 0) {
        const t = easeOutCubic(clamp01(1 - centerOffset / 0.85));
        opacity = t;
        ty = (1 - t) * 55;
      } else if (centerOffset >= -0.55) {
        opacity = 1; ty = 0;
      } else if (centerOffset >= -1.0) {
        const t = easeOutCubic(clamp01((-centerOffset - 0.55) / 0.45));
        opacity = 1 - t * 0.65;
        ty = -t * 28;
      } else {
        opacity = 0.35; ty = -28;
      }

      wrapper.style.opacity = opacity;
      wrapper.style.transform = ty !== 0 ? `translateY(${ty.toFixed(2)}px)` : 'none';
    });
    sceneRafId = null;
  }

  window.addEventListener('scroll', () => {
    if (!sceneRafId) sceneRafId = requestAnimationFrame(updateSceneTransitions);
  }, { passive: true });

  // Run once immediately so sections below fold start hidden
  updateSceneTransitions();

  /* ---------- Scene number indicator ---------- */
  const sceneIndicatorNum = document.getElementById('scene-indicator-num');
  const sceneMap = { hero: '01', about: '02', projects: '03', contact: '04' };
  let activeSceneId = 'hero';

  function updateSceneIndicator() {
    const s = window.scrollY + window.innerHeight * 0.35;
    let newId = 'hero';
    document.querySelectorAll('section[id]').forEach(sec => {
      if (sec.offsetTop <= s) newId = sec.id;
    });
    if (newId !== activeSceneId) {
      activeSceneId = newId;
      if (sceneIndicatorNum && sceneMap[newId]) {
        sceneIndicatorNum.style.opacity = '0';
        sceneIndicatorNum.style.transform = 'translateY(8px)';
        setTimeout(() => {
          sceneIndicatorNum.textContent = sceneMap[newId];
          sceneIndicatorNum.style.opacity = '';
          sceneIndicatorNum.style.transform = '';
        }, 180);
      }
    }
  }
  window.addEventListener('scroll', updateSceneIndicator, { passive: true });

  /* ---------- Scene dividers draw-in ---------- */
  const dividerObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); dividerObs.unobserve(e.target); }
    });
  }, { root: null, threshold: 0.5 });
  document.querySelectorAll('.scene-divider').forEach(el => dividerObs.observe(el));

  /* ---------- Word reveal on about text ---------- */
  const aboutText = document.getElementById('about-text');
  const wordObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('.reveal-word').forEach(w => w.classList.add('visible'));
        wordObs.unobserve(e.target);
      }
    });
  }, { root: null, threshold: 0.15 });

  function initWordReveal() {
    if (!aboutText) return;
    const txt = aboutText.textContent.trim();
    aboutText.innerHTML = '';
    txt.split(/\s+/).forEach((word, i, arr) => {
      const span = document.createElement('span');
      span.className = 'reveal-word';
      span.textContent = word;
      span.style.transitionDelay = (i * 0.03) + 's';
      aboutText.appendChild(span);
      if (i < arr.length - 1) aboutText.appendChild(document.createTextNode(' '));
    });
    wordObs.observe(aboutText);
  }
  initWordReveal();
  if (aboutText) aboutText.addEventListener('i18n:updated', initWordReveal);

  /* ---------- Skills fly-in (golden angle offsets, like SceneSkills) ---------- */
  const skillsGrid = document.querySelector('.skills-grid');
  if (skillsGrid) {
    // Assign fly-in directions based on golden angle (137.5°), scaled for web
    skillsGrid.querySelectorAll('.skill-tag').forEach((tag, i) => {
      const angle = (i * 137.5) * (Math.PI / 180);
      const dist = 120 + (i % 3) * 40; // vary distances a bit
      tag.style.setProperty('--fly-x', Math.cos(angle) * dist + 'px');
      tag.style.setProperty('--fly-y', Math.sin(angle) * (dist * 0.55) + 'px');
      tag.style.transitionDelay = (i * 0.07) + 's';
    });

    const skillObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.querySelectorAll('.skill-tag').forEach(tag => tag.classList.add('visible'));
          skillObs.unobserve(e.target);
        }
      });
    }, { root: null, threshold: 0.15 });
    skillObs.observe(skillsGrid);
  }

  /* ---------- Contact channels converge (like SceneContact) ---------- */
  const contactChannels = document.querySelector('.contact-channels');
  if (contactChannels) {
    // Channels start spread apart (left, center, right) and converge
    const offsets = [-220, 0, 220];
    contactChannels.querySelectorAll('.contact-channel').forEach((ch, i) => {
      ch.style.setProperty('--channel-offset', (offsets[i] || 0) + 'px');
      ch.style.transitionDelay = (i * 0.12) + 's';
    });

    const channelObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          contactChannels.querySelectorAll('.contact-channel').forEach(ch => ch.classList.add('visible'));
          channelObs.unobserve(e.target);
        }
      });
    }, { root: null, threshold: 0.2 });
    channelObs.observe(contactChannels);
  }

  /* ---------- Project item reveal ---------- */
  const itemObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); itemObs.unobserve(e.target); }
    });
  }, { root: null, threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  /* ---------- Projects ---------- */
  const projectsGrid = document.getElementById('projects-grid');
  const filterBar = document.getElementById('filter-bar');
  let allProjects = [];
  let allTechs = new Set();

  // Cursor-tracking spotlight position for hovered project rows
  if (projectsGrid) {
    projectsGrid.addEventListener('mousemove', (e) => {
      const item = e.target.closest('.project-item');
      if (!item) return;
      const r = item.getBoundingClientRect();
      item.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
      item.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
    }, { passive: true });
  }

  async function loadProjects() {
    try {
      const res = await fetch('data/projects.json');
      if (!res.ok) throw new Error('Failed');
      allProjects = await res.json();
      allProjects.forEach(p => (p.technologies || []).forEach(t => allTechs.add(t)));
      buildFilterButtons();
      renderProjects(allProjects);
    } catch (err) {
      console.warn('Could not load projects:', err);
      if (projectsGrid) {
        const msg = window.i18n ? window.i18n.t('projects.loading') : 'Проекты загружаются...';
        projectsGrid.innerHTML = '<p style="color:var(--dim);font-family:var(--font-mono);font-size:0.7rem;letter-spacing:0.1em;text-transform:uppercase;">' + escapeHtml(msg) + '</p>';
      }
    }
  }

  function buildFilterButtons() {
    if (!filterBar) return;
    allTechs.forEach(tech => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.dataset.filter = tech;
      btn.textContent = tech;
      btn.addEventListener('click', () => filterProjects(tech, btn));
      filterBar.appendChild(btn);
    });
  }

  function filterProjects(tech, btn) {
    filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderProjects(tech === 'all' ? allProjects : allProjects.filter(p => (p.technologies || []).includes(tech)));
  }

  if (filterBar) {
    const allBtn = filterBar.querySelector('[data-filter="all"]');
    if (allBtn) allBtn.addEventListener('click', () => filterProjects('all', allBtn));
  }

  function renderProjects(projects) {
    if (!projectsGrid) return;
    projectsGrid.innerHTML = '';
    projects.forEach((project, index) => {
      const item = document.createElement('div');
      item.className = 'project-item';
      item.style.transitionDelay = (index * 0.08) + 's';

      const linkIcon = project.type === 'gdrive'
        ? '<i class="fa-brands fa-google-drive"></i>'
        : '<i class="fa-brands fa-github"></i>';
      const linkLabel = project.type === 'gdrive' ? 'Drive' : 'GitHub';
      const lang = window.i18n ? window.i18n.lang() : 'ru';
      const desc = (lang === 'en' && project.description_en) ? project.description_en : project.description;

      item.innerHTML =
        '<div class="project-item-number">' + String(index + 1).padStart(2, '0') + '</div>' +
        '<div class="project-item-content">' +
          '<h3 class="project-item-title">' + escapeHtml(project.title) + '</h3>' +
          '<p class="project-item-desc">' + escapeHtml(desc) + '</p>' +
          '<div class="project-item-tech">' +
            (project.technologies || []).map(t => '<span class="tech-badge">' + escapeHtml(t) + '</span>').join('') +
          '</div>' +
        '</div>' +
        '<a href="' + escapeHtml(project.link) + '" target="_blank" rel="noopener" class="project-item-link">' +
          linkIcon + ' ' + linkLabel + ' <span class="arrow">&rarr;</span>' +
        '</a>';

      projectsGrid.appendChild(item);
      itemObs.observe(item);
    });
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  loadProjects();

  window.addEventListener('langchange', () => {
    if (allProjects.length > 0) {
      const active = filterBar ? filterBar.querySelector('.filter-btn.active') : null;
      const tech = active ? active.dataset.filter : 'all';
      renderProjects(tech === 'all' ? allProjects : allProjects.filter(p => (p.technologies || []).includes(tech)));
    }
  });

  /* ---------- Smooth Scroll ---------- */
  function smoothScrollTo(targetEl) {
    const navH = nav ? nav.offsetHeight : 0;
    const targetY = targetEl.getBoundingClientRect().top + window.scrollY - navH;
    const startY = window.scrollY;
    const diff = targetY - startY;
    const duration = Math.min(1200, Math.max(600, Math.abs(diff) * 0.5));
    let start = null;
    function easeOutExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }
    function step(ts) {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / duration, 1);
      window.scrollTo(0, startY + diff * easeOutExpo(progress));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) { e.preventDefault(); smoothScrollTo(target); }
    });
  });

})();
