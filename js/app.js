/* ============================================
   Main App — Portfolio llapik
   Cinematic reveals, 3D card tilt,
   dissolve section transitions, theme toggle
   ============================================ */

(function () {
  'use strict';

  /* ---------- Theme Toggle ---------- */
  const THEME_KEY = 'llapik-theme';

  function getStoredTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }

  function setTheme(mode) {
    document.documentElement.setAttribute('data-theme', mode);
    try { localStorage.setItem(THEME_KEY, mode); } catch (e) { /* ok */ }
    if (typeof window.setFluidLightMode === 'function') {
      window.setFluidLightMode(mode === 'light');
    }
    const icon = document.querySelector('#theme-toggle i');
    if (icon) {
      icon.className = mode === 'light' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    }
  }

  initTheme();

  function initTheme() {
    setTheme(getStoredTheme() || 'dark');
  }

  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      setTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  /* ---------- Loader ---------- */
  window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    if (loader) setTimeout(() => loader.classList.add('loaded'), 600);
    animateHero();
  });

  /* ---------- Hero Entrance ---------- */
  function animateHero() {
    const ease = 'opacity 1s cubic-bezier(.16,1,.3,1), transform 1s cubic-bezier(.16,1,.3,1)';
    [
      { el: document.querySelector('.hero-greeting'), delay: 400 },
      { el: document.querySelector('.hero-name'),     delay: 650 },
      { el: document.querySelector('.hero-tagline'),  delay: 900 },
      { el: document.querySelector('.hero-cta'),      delay: 1150 }
    ].forEach(({ el, delay }) => {
      if (!el) return;
      setTimeout(() => {
        el.style.transition = ease;
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, delay);
    });
  }

  /* ---------- Hero Parallax ---------- */
  const heroContent = document.querySelector('.hero-content');
  window.addEventListener('scroll', () => {
    if (!heroContent) return;
    const s = window.scrollY;
    const h = window.innerHeight;
    if (s < h) {
      const p = s / h;
      heroContent.style.opacity = 1 - p * 1.2;
      heroContent.style.transform = 'translateY(' + (s * 0.3) + 'px) scale(' + (1 - p * 0.06) + ')';
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

  // Active link tracking
  const sections = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('.nav-links a');

  function updateActiveNav() {
    const scroll = window.scrollY + window.innerHeight * 0.3;
    let currentId = '';
    sections.forEach(sec => {
      if (sec.offsetTop <= scroll) currentId = sec.id;
    });
    navAnchors.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === '#' + currentId);
    });
  }
  window.addEventListener('scroll', updateActiveNav, { passive: true });

  /* ---------- Section Burst on Enter ---------- */
  let lastSectionIndex = 0;
  const sectionIds = ['hero', 'about', 'projects', 'contact'];
  const sectionScrollMap = { hero: 0, about: 0.15, projects: 0.45, contact: 0.75 };

  const burstObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      const idx = sectionIds.indexOf(id);
      if (idx > 0 && idx !== lastSectionIndex) {
        lastSectionIndex = idx;
        if (typeof window.triggerBurst === 'function') {
          window.triggerBurst(sectionScrollMap[id] || 0.5);
        }
      }
    });
  }, { root: null, threshold: 0.2 });

  sectionIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) burstObserver.observe(el);
  });

  /* ---------- Section Content Dissolve/Reveal ---------- */
  const dissolveObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        dissolveObserver.unobserve(entry.target);
      }
    });
  }, { root: null, threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  document.querySelectorAll('.about-wrapper, .projects-wrapper, .contact-wrapper').forEach(el => {
    el.classList.add('dissolve-target');
    dissolveObserver.observe(el);
  });

  /* ---------- About — Word Reveal ---------- */
  const aboutText = document.getElementById('about-text');
  if (aboutText) {
    const text = aboutText.textContent.trim();
    aboutText.innerHTML = '';
    text.split(/\s+/).forEach((word, i, arr) => {
      const span = document.createElement('span');
      span.className = 'reveal-word';
      span.textContent = word;
      span.style.transitionDelay = (i * 0.025) + 's';
      aboutText.appendChild(span);
      if (i < arr.length - 1) aboutText.appendChild(document.createTextNode(' '));
    });
  }

  /* ---------- Intersection Observers ---------- */
  const wordObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.reveal-word').forEach(w => w.classList.add('visible'));
        wordObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  if (aboutText) wordObserver.observe(aboutText);

  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Enable 3D tilt after entrance transition completes
        entry.target.addEventListener('transitionend', function onEnd() {
          entry.target.dataset.tiltReady = '1';
          entry.target.removeEventListener('transitionend', onEnd);
        });
        cardObserver.unobserve(entry.target);
      }
    });
  }, { root: null, threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  const titleObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        titleObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.section-title, .section-subtitle').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(25px)';
    el.style.transition = 'opacity 0.8s cubic-bezier(.16,1,.3,1), transform 0.8s cubic-bezier(.16,1,.3,1)';
    titleObserver.observe(el);
  });

  // Contact links reveal with stagger
  const contactObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.querySelectorAll('.contact-link').forEach((link, i) => {
        setTimeout(() => {
          link.style.opacity = '1';
          link.style.transform = 'translateY(0)';
          link.classList.add('pulse');
        }, i * 180);
      });
      contactObserver.unobserve(entry.target);
    });
  }, { threshold: 0.15 });

  const contactSection = document.getElementById('contact');
  if (contactSection) {
    contactSection.querySelectorAll('.contact-link').forEach(link => {
      link.style.opacity = '0';
      link.style.transform = 'translateY(25px)';
      link.style.transition = 'opacity 0.7s cubic-bezier(.16,1,.3,1), transform 0.7s cubic-bezier(.16,1,.3,1), border-color 0.35s ease, box-shadow 0.35s ease';
    });
    contactObserver.observe(contactSection);
  }

  /* ---------- Load Projects from JSON ---------- */
  const projectsGrid = document.getElementById('projects-grid');
  const filterBar = document.getElementById('filter-bar');
  let allProjects = [];
  let allTechs = new Set();

  async function loadProjects() {
    try {
      const response = await fetch('data/projects.json');
      if (!response.ok) throw new Error('Failed');
      allProjects = await response.json();
      allProjects.forEach(p => (p.technologies || []).forEach(t => allTechs.add(t)));
      buildFilterButtons();
      renderProjects(allProjects);
    } catch (err) {
      console.warn('Could not load projects:', err);
      if (projectsGrid) {
        projectsGrid.innerHTML = '<p style="color:var(--text-muted);">Проекты загружаются...</p>';
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

  function filterProjects(tech, activeBtn) {
    filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    activeBtn.classList.add('active');
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
      const card = document.createElement('div');
      card.className = 'project-card interactive';
      card.style.transitionDelay = (index * 0.1) + 's';

      const linkIcon = project.type === 'gdrive'
        ? '<i class="fa-brands fa-google-drive"></i>' : '<i class="fa-brands fa-github"></i>';
      const linkLabel = project.type === 'gdrive' ? 'Google Drive' : 'GitHub';

      card.innerHTML = `
        <div class="project-card-number">Проект ${String(index + 1).padStart(2, '0')}</div>
        <h3 class="project-card-title">${escapeHtml(project.title)}</h3>
        <p class="project-card-desc">${escapeHtml(project.description)}</p>
        <div class="project-card-tech">
          ${(project.technologies || []).map(t => '<span class="tech-badge">' + escapeHtml(t) + '</span>').join('')}
        </div>
        <a href="${escapeHtml(project.link)}" target="_blank" rel="noopener" class="project-card-link interactive">
          ${linkIcon} ${linkLabel} <span class="arrow">&rarr;</span>
        </a>
      `;

      /* 3D tilt — only after entrance animation */
      card.addEventListener('mousemove', (e) => {
        if (!card.dataset.tiltReady) return;
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;

        card.style.transform = 'perspective(800px) rotateY(' + (x * 10) + 'deg) rotateX(' + (-y * 10) + 'deg) translateY(-6px) scale(1.02)';
        card.style.setProperty('--mouse-x', ((x + 0.5) * 100) + '%');
        card.style.setProperty('--mouse-y', ((y + 0.5) * 100) + '%');
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });

      projectsGrid.appendChild(card);
      cardObserver.observe(card);
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  loadProjects();

  /* ---------- Smooth Scroll ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

})();
