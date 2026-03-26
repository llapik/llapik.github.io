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
    const BUBBLE_COUNT = 15;
    for (let i = 0; i < BUBBLE_COUNT; i++) {
      const b = document.createElement('div');
      b.className = 'bubble';
      const size = 4 + Math.random() * 16;
      b.style.width = size + 'px';
      b.style.height = size + 'px';
      b.style.left = Math.random() * 100 + '%';
      b.style.animationDuration = (8 + Math.random() * 12) + 's';
      b.style.animationDelay = (Math.random() * 10) + 's';
      bubblesContainer.appendChild(b);
    }
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
      { el: document.querySelector('.hero-greeting'), delay: 400 },
      { el: document.querySelector('.hero-name'),     delay: 600 },
      { el: document.querySelector('.hero-tagline'),  delay: 900 },
      { el: document.querySelector('.hero-cta'),      delay: 1100 }
    ].forEach(({ el, delay }) => {
      if (!el) return;
      setTimeout(() => {
        el.style.transition = 'opacity 1s var(--expo), transform 1s var(--expo)';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, delay);
    });
  }

  /* ---------- Hero Parallax ---------- */
  const heroContent = document.querySelector('.hero-content');
  window.addEventListener('scroll', () => {
    if (!heroContent) return;
    const s = window.scrollY, h = window.innerHeight;
    if (s < h) {
      const p = s / h;
      heroContent.style.opacity = 1 - p * 1.3;
      heroContent.style.transform = 'translateY(' + (s * 0.35) + 'px) scale(' + (1 - p * 0.05) + ')';
    }
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

  /* ---------- Title Reveal ---------- */
  const titleObs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.style.opacity = '1'; e.target.style.transform = 'translateY(0)'; titleObs.unobserve(e.target); } });
  }, obsOpts);

  document.querySelectorAll('.section-title, .section-subtitle').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.8s var(--expo), transform 0.8s var(--expo)';
    titleObs.observe(el);
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
      tag.style.transition = 'opacity 0.6s ease, transform 0.6s var(--expo), border-color 0.4s ease, color 0.4s ease, box-shadow 0.4s ease';
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
      link.style.transition = 'opacity 0.6s ease, transform 0.6s var(--expo), border-color 0.4s ease, box-shadow 0.4s ease';
    });
    contactObs.observe(contactSection);
  }

  /* ---------- Wave Divider Animation ---------- */
  const waveObs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.style.opacity = '1'; e.target.style.transform = 'translateY(0)'; waveObs.unobserve(e.target); } });
  }, { root: null, threshold: 0.2 });

  document.querySelectorAll('.wave-divider').forEach(w => {
    w.style.opacity = '0'; w.style.transform = 'translateY(20px)';
    w.style.transition = 'opacity 1s var(--expo), transform 1s var(--expo)';
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
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
    });
  });

})();
