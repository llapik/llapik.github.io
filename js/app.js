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

  /* ---------- Starfield ---------- */
  const starCanvas = document.getElementById('starfield');
  if (starCanvas && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const ctx = starCanvas.getContext('2d');
    let stars = [];

    function initStars() {
      starCanvas.width = window.innerWidth;
      starCanvas.height = window.innerHeight;
      let seed = 1337;
      function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
      stars = [];
      for (let i = 0; i < 55; i++) {
        stars.push({
          x: rnd() * starCanvas.width,
          y: rnd() * starCanvas.height,
          r: rnd() * 1.4 + 0.3,
          o: rnd() * 0.35 + 0.08,
          phase: rnd() * Math.PI * 2,
        });
      }
    }

    function drawStars(ts) {
      const t = ts / 1000;
      ctx.clearRect(0, 0, starCanvas.width, starCanvas.height);
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const rgb = isDark ? '237,237,234' : '10,10,10';
      stars.forEach(s => {
        const alpha = s.o * (0.55 + 0.45 * Math.sin(t * 0.7 + s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb},${alpha})`;
        ctx.fill();
      });
      requestAnimationFrame(drawStars);
    }

    initStars();
    window.addEventListener('resize', initStars, { passive: true });
    requestAnimationFrame(drawStars);
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
    if (!heroContent) return;
    const s = window.scrollY, h = window.innerHeight;
    if (s < h) {
      const p = s / h;
      heroTargetO = Math.max(0, 1 - p * 1.4);
      heroTargetY = s * 0.28;
    }
    if (!heroRaf) { heroRaf = true; requestAnimationFrame(lerpHero); }
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

  /* ---------- Section heading + label reveal ---------- */
  const headingObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        headingObs.unobserve(e.target);
      }
    });
  }, { root: null, threshold: 0.15 });

  document.querySelectorAll('.section-label, .section-heading').forEach(el => {
    headingObs.observe(el);
  });

  /* ---------- Section wrapper reveal ---------- */
  const wrapperObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('section-visible'); wrapperObs.unobserve(e.target); }
    });
  }, { root: null, threshold: 0.08, rootMargin: '0px 0px -60px 0px' });

  document.querySelectorAll('.about-wrapper, .projects-wrapper, .contact-wrapper').forEach(el => {
    wrapperObs.observe(el);
  });

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

  /* ---------- Skill tags stagger reveal ---------- */
  const skillObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('.skill-tag').forEach((tag, i) => {
          tag.style.transitionDelay = (i * 0.07) + 's';
          tag.classList.add('visible');
        });
        skillObs.unobserve(e.target);
      }
    });
  }, { root: null, threshold: 0.15 });

  const skillsGrid = document.querySelector('.skills-grid');
  if (skillsGrid) skillObs.observe(skillsGrid);

  /* ---------- Contact channels reveal ---------- */
  const channelObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('.contact-channel').forEach((ch, i) => {
          ch.style.transitionDelay = (i * 0.18) + 's';
          ch.classList.add('visible');
        });
        channelObs.unobserve(e.target);
      }
    });
  }, { root: null, threshold: 0.15 });

  const contactChannels = document.querySelector('.contact-channels');
  if (contactChannels) channelObs.observe(contactChannels);

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
