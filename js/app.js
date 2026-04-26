/* ============================================
   Main App — Portfolio llapik
   Underwater theme, list projects, depth system
   ============================================ */
(function () {
  'use strict';

  /* ---------- Theme ---------- */
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');

  function detectTheme() {
    const s = localStorage.getItem('theme');
    if (s) return s;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('theme', t);
    if (themeIcon) themeIcon.className = t === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#020b18' : '#eef6fc');
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: t } }));
  }
  let currentTheme = detectTheme();
  applyTheme(currentTheme);
  if (themeToggle) themeToggle.addEventListener('click', () => { currentTheme = currentTheme === 'dark' ? 'light' : 'dark'; applyTheme(currentTheme); });

  /* ---------- Bubbles ---------- */
  const bubblesContainer = document.getElementById('bubbles');
  if (bubblesContainer) {
    const BUBBLE_COUNT = 18;
    for (let i = 0; i < BUBBLE_COUNT; i++) {
      const b = document.createElement('div');
      b.className = 'bubble';
      const size = 4 + Math.random() * 18;
      b.style.width = size + 'px';
      b.style.height = size + 'px';
      b.style.left = Math.random() * 100 + '%';
      b.style.animationDuration = (8 + Math.random() * 12) + 's';
      b.style.animationDelay = (Math.random() * 10) + 's';
      bubblesContainer.appendChild(b);
    }
  }

  /* ---------- Creatures (jellyfish, fish, droplets, orbits) ---------- */
  const creaturesLayer = document.getElementById('creatures');
  if (creaturesLayer && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const isMobile = window.innerWidth < 768;

    function makeJellyfish() {
      const c = document.createElement('div');
      c.className = 'creature jellyfish';
      c.innerHTML = '<div class="body"></div><div class="tentacles"><span></span><span></span><span></span></div>';
      const scale = 0.6 + Math.random() * 1.2;
      c.style.transform = `scale(${scale})`;
      c.style.left = Math.random() * 90 + '%';
      c.style.top = Math.random() * 80 + 10 + '%';
      c.style.opacity = (0.3 + Math.random() * 0.5).toFixed(2);
      c.style.animationDuration = (18 + Math.random() * 14) + 's';
      c.style.animationDelay = (-Math.random() * 12) + 's';
      return c;
    }

    function makeFish() {
      const c = document.createElement('div');
      c.className = 'creature fish';
      c.innerHTML = '<div class="fish-body"></div>';
      const scale = 0.7 + Math.random() * 1.4;
      const flip = Math.random() > 0.5 ? -1 : 1;
      c.style.transform = `scale(${scale * flip}, ${scale})`;
      c.style.top = Math.random() * 90 + '%';
      c.style.opacity = (0.35 + Math.random() * 0.4).toFixed(2);
      c.style.animationDuration = (14 + Math.random() * 16) + 's';
      c.style.animationDelay = (-Math.random() * 20) + 's';
      return c;
    }

    function makeDroplet() {
      const c = document.createElement('div');
      c.className = 'creature droplet';
      const scale = 0.5 + Math.random() * 1.6;
      c.style.transform = `scale(${scale})`;
      c.style.left = Math.random() * 95 + '%';
      c.style.top = Math.random() * 90 + '%';
      c.style.opacity = (0.25 + Math.random() * 0.5).toFixed(2);
      c.style.animationDuration = `${3 + Math.random() * 4}s, ${22 + Math.random() * 14}s`;
      c.style.animationDelay = `${-Math.random() * 4}s, ${-Math.random() * 20}s`;
      return c;
    }

    function makeOrbit() {
      const c = document.createElement('div');
      c.className = 'creature orbit-ring';
      const scale = 0.5 + Math.random() * 1.0;
      c.style.transform = `scale(${scale})`;
      c.style.left = Math.random() * 90 + '%';
      c.style.top = Math.random() * 85 + '%';
      c.style.opacity = (0.25 + Math.random() * 0.4).toFixed(2);
      c.style.animationDelay = (-Math.random() * 25) + 's';
      return c;
    }

    const counts = isMobile
      ? { jelly: 3, fish: 4, drop: 5, orbit: 2 }
      : { jelly: 6, fish: 7, drop: 9, orbit: 4 };

    for (let i = 0; i < counts.jelly; i++) creaturesLayer.appendChild(makeJellyfish());
    for (let i = 0; i < counts.fish; i++)  creaturesLayer.appendChild(makeFish());
    for (let i = 0; i < counts.drop; i++)  creaturesLayer.appendChild(makeDroplet());
    for (let i = 0; i < counts.orbit; i++) creaturesLayer.appendChild(makeOrbit());
  }

  /* ---------- Depth Indicator ---------- */
  const depthEl = document.querySelector('.depth-value');
  function updateDepth() {
    if (!depthEl) return;
    const h = document.documentElement.scrollHeight - window.innerHeight;
    const progress = h > 0 ? window.scrollY / h : 0;
    const depth = Math.round(progress * 500);
    depthEl.textContent = depth + 'm';
  }
  window.addEventListener('scroll', updateDepth, { passive: true });

  /* ---------- Loader ---------- */
  window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    if (loader) setTimeout(() => loader.classList.add('loaded'), 800);
    animateHero();
  });

  /* ---------- Hero ---------- */
  function animateHero() {
    [
      { el: document.querySelector('.hero-greeting'), delay: 500 },
      { el: document.querySelector('.hero-name'),     delay: 750 },
      { el: document.querySelector('.hero-tagline'),  delay: 1100 },
      { el: document.querySelector('.hero-cta'),      delay: 1400 }
    ].forEach(({ el, delay }) => {
      if (!el) return;
      setTimeout(() => {
        el.style.transition = 'opacity 1.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 1.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, delay);
    });

    // Scramble effect on hero name lines
    setTimeout(() => {
      document.querySelectorAll('.hero-name [data-scramble]').forEach((el, idx) => {
        scrambleText(el, 900 + idx * 200);
      });
    }, 800);
  }

  /* ---------- Text Scramble Effect ---------- */
  const SCRAMBLE_CHARS = '!<>-_\\/[]{}—=+*^?#________';
  function scrambleText(el, duration = 1200) {
    const hasDataText = el.hasAttribute('data-text');
    const finalText = (el.dataset.scrambleFinal) || el.textContent;
    el.dataset.scrambleFinal = finalText;
    const len = finalText.length;
    const start = performance.now();

    function frame(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      let out = '';
      for (let i = 0; i < len; i++) {
        const charProgress = progress * len - i;
        if (charProgress >= 1) {
          out += finalText[i];
        } else if (charProgress > 0) {
          out += finalText[i] === ' ' ? ' ' : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        } else {
          out += ' ';
        }
      }
      el.textContent = out;
      if (hasDataText) el.setAttribute('data-text', out);
      if (progress < 1) requestAnimationFrame(frame);
      else {
        el.textContent = finalText;
        if (hasDataText) el.setAttribute('data-text', finalText);
      }
    }
    requestAnimationFrame(frame);
  }

  /* ---------- Hero Parallax (smoothed with lerp) ---------- */
  const heroContent = document.querySelector('.hero-content');
  let heroTargetY = 0, heroCurrentY = 0, heroTargetOpacity = 1, heroCurrentOpacity = 1;
  let heroRafRunning = false;

  function lerpHero() {
    heroCurrentY += (heroTargetY - heroCurrentY) * 0.08;
    heroCurrentOpacity += (heroTargetOpacity - heroCurrentOpacity) * 0.08;
    if (heroContent) {
      heroContent.style.opacity = heroCurrentOpacity;
      heroContent.style.transform = 'translateY(' + heroCurrentY + 'px) scale(' + (1 - (1 - heroCurrentOpacity) * 0.06) + ')';
    }
    if (Math.abs(heroTargetY - heroCurrentY) > 0.5 || Math.abs(heroTargetOpacity - heroCurrentOpacity) > 0.005) {
      requestAnimationFrame(lerpHero);
    } else {
      heroRafRunning = false;
    }
  }

  window.addEventListener('scroll', () => {
    if (!heroContent) return;
    const s = window.scrollY, h = window.innerHeight;
    if (s < h) {
      const p = s / h;
      heroTargetOpacity = Math.max(0, 1 - p * 1.3);
      heroTargetY = s * 0.3;
    }
    if (!heroRafRunning) { heroRafRunning = true; requestAnimationFrame(lerpHero); }
  }, { passive: true });

  /* ---------- Navigation ---------- */
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');

  window.addEventListener('scroll', () => { if (nav) nav.classList.toggle('scrolled', window.scrollY > 80); }, { passive: true });

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => { navToggle.classList.toggle('active'); navLinks.classList.toggle('open'); });
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => { navToggle.classList.remove('active'); navLinks.classList.remove('open'); });
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

  /* ---------- Word Reveal ---------- */
  const aboutText = document.getElementById('about-text');
  const obsOpts = { root: null, threshold: 0.15, rootMargin: '0px' };

  const wordObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('.reveal-word').forEach(w => w.classList.add('visible'));
        wordObs.unobserve(e.target);
      }
    });
  }, obsOpts);

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

  /* ---------- Card / Item Reveal ---------- */
  const itemObs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); itemObs.unobserve(e.target); } });
  }, { root: null, threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  /* ---------- Title Reveal + Scramble ---------- */
  const titleObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
        if (e.target.classList.contains('section-title')) {
          scrambleText(e.target, 700);
        }
        titleObs.unobserve(e.target);
      }
    });
  }, obsOpts);

  document.querySelectorAll('.section-title, .section-subtitle').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 1s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    titleObs.observe(el);
  });

  /* ---------- Section Wrapper Reveal ---------- */
  const sectionWrapperObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('section-visible'); sectionWrapperObs.unobserve(e.target); }
    });
  }, { root: null, threshold: 0.08, rootMargin: '0px 0px -60px 0px' });

  document.querySelectorAll('.about-wrapper, .projects-wrapper, .contact-wrapper').forEach(el => {
    sectionWrapperObs.observe(el);
  });

  /* ---------- Skill Tags Stagger ---------- */
  const skillObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('.skill-tag').forEach((tag, i) => {
          tag.style.transitionDelay = (i * 0.06) + 's';
          tag.style.opacity = '1'; tag.style.transform = 'translateY(0)';
        });
        skillObs.unobserve(e.target);
      }
    });
  }, obsOpts);

  const skillsGrid = document.querySelector('.skills-grid');
  if (skillsGrid) {
    skillsGrid.querySelectorAll('.skill-tag').forEach(tag => {
      tag.style.opacity = '0'; tag.style.transform = 'translateY(16px)';
      tag.style.transition = 'opacity 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94), border-color 0.4s ease, color 0.4s ease, box-shadow 0.4s ease';
    });
    skillObs.observe(skillsGrid);
  }

  /* ---------- Contact Reveal ---------- */
  const contactObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('.contact-link').forEach((link, i) => {
          setTimeout(() => { link.style.opacity = '1'; link.style.transform = 'translateY(0)'; link.classList.add('pulse'); }, i * 200);
        });
        contactObs.unobserve(e.target);
      }
    });
  }, obsOpts);

  const contactSection = document.getElementById('contact');
  if (contactSection) {
    contactSection.querySelectorAll('.contact-link').forEach(link => {
      link.style.opacity = '0'; link.style.transform = 'translateY(20px)';
      link.style.transition = 'opacity 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94), border-color 0.4s ease, box-shadow 0.4s ease';
    });
    contactObs.observe(contactSection);
  }

  /* ---------- Wave Divider Parallax ---------- */
  const waveDividers = document.querySelectorAll('.wave-divider');
  const wavePaths = [];
  waveDividers.forEach((w, idx) => {
    const paths = w.querySelectorAll('svg path');
    wavePaths.push({ el: w, paths: paths, speed: [0.15, 0.1, 0.05][idx] || 0.1 });
  });

  function updateWaveParallax() {
    const scrollY = window.scrollY;
    const winH = window.innerHeight;
    wavePaths.forEach(({ el, paths, speed }) => {
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const offset = (center - winH / 2) * speed;
      paths.forEach((path, i) => {
        const layerSpeed = 1 - i * 0.3;
        path.style.transform = 'translateY(' + (offset * layerSpeed) + 'px)';
      });
    });
  }
  window.addEventListener('scroll', updateWaveParallax, { passive: true });

  /* ---------- Wave Divider Fade In ---------- */
  const waveObs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.style.opacity = '1'; waveObs.unobserve(e.target); } });
  }, { root: null, threshold: 0.1 });

  document.querySelectorAll('.wave-divider').forEach(w => {
    w.style.opacity = '0';
    w.style.transition = 'opacity 1.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    waveObs.observe(w);
  });

  /* ---------- Projects ---------- */
  const projectsGrid = document.getElementById('projects-grid');
  const filterBar = document.getElementById('filter-bar');
  let allProjects = [];
  let allTechs = new Set();

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
        projectsGrid.innerHTML = '<p style="color:var(--text-muted);">' + escapeHtml(msg) + '</p>';
      }
    }
  }

  function buildFilterButtons() {
    if (!filterBar) return;
    allTechs.forEach(tech => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn interactive';
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
      item.className = 'project-item interactive';
      item.style.transitionDelay = (index * 0.1) + 's';

      const linkIcon = project.type === 'gdrive' ? '<i class="fa-brands fa-google-drive"></i>' : '<i class="fa-brands fa-github"></i>';
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
        '<a href="' + escapeHtml(project.link) + '" target="_blank" rel="noopener" class="project-item-link interactive">' +
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

    function easeOutExpo(t) {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

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
