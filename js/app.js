/* ============================================
   Main App — Portfolio llapik
   Scroll animations, JSON loading, filters
   ============================================ */

(function () {
  'use strict';

  /* ---------- Loader ---------- */
  window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    if (loader) {
      setTimeout(() => loader.classList.add('loaded'), 600);
    }
    animateHero();
  });

  /* ---------- Hero Entrance ---------- */
  function animateHero() {
    const elements = [
      { el: document.querySelector('.hero-greeting'), delay: 300 },
      { el: document.querySelector('.hero-name'),     delay: 500 },
      { el: document.querySelector('.hero-tagline'),  delay: 700 },
      { el: document.querySelector('.hero-cta'),      delay: 900 }
    ];

    elements.forEach(({ el, delay }) => {
      if (!el) return;
      setTimeout(() => {
        el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, delay);
    });
  }

  /* ---------- Hero Parallax on Scroll ---------- */
  const heroContent = document.querySelector('.hero-content');
  window.addEventListener('scroll', () => {
    if (!heroContent) return;
    const scroll = window.scrollY;
    const heroHeight = window.innerHeight;
    if (scroll < heroHeight) {
      const progress = scroll / heroHeight;
      heroContent.style.opacity = 1 - progress;
      heroContent.style.transform = `translateY(${scroll * 0.3}px)`;
    }
  }, { passive: true });

  /* ---------- Navigation ---------- */
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');

  // Scroll shrink
  window.addEventListener('scroll', () => {
    if (nav) {
      nav.classList.toggle('scrolled', window.scrollY > 80);
    }
  }, { passive: true });

  // Mobile toggle
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      navLinks.classList.toggle('open');
    });

    // Close on link click
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
      if (sec.offsetTop <= scroll) {
        currentId = sec.id;
      }
    });
    navAnchors.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === '#' + currentId);
    });
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });

  /* ---------- About — Word Reveal ---------- */
  const aboutText = document.getElementById('about-text');
  if (aboutText) {
    const text = aboutText.textContent.trim();
    aboutText.innerHTML = '';
    const words = text.split(/\s+/);
    words.forEach((word, i) => {
      const span = document.createElement('span');
      span.className = 'reveal-word';
      span.textContent = word;
      span.style.transitionDelay = (i * 0.03) + 's';
      aboutText.appendChild(span);
      // Add space between words
      if (i < words.length - 1) {
        aboutText.appendChild(document.createTextNode(' '));
      }
    });
  }

  /* ---------- Intersection Observer — Reveal ---------- */
  const observerOptions = {
    root: null,
    threshold: 0.15,
    rootMargin: '0px'
  };

  // Word reveal observer
  const wordObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const words = entry.target.querySelectorAll('.reveal-word');
        words.forEach(w => w.classList.add('visible'));
        wordObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  if (aboutText) {
    wordObserver.observe(aboutText);
  }

  // Card reveal observer
  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        cardObserver.unobserve(entry.target);
      }
    });
  }, { root: null, threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  // Section title observer
  const titleObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        titleObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.section-title, .section-subtitle').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    titleObserver.observe(el);
  });

  // Contact pulse on visible
  const contactObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const links = entry.target.querySelectorAll('.contact-link');
      if (entry.isIntersecting) {
        links.forEach((link, i) => {
          setTimeout(() => {
            link.style.opacity = '1';
            link.style.transform = 'translateY(0)';
            link.classList.add('pulse');
          }, i * 150);
        });
        contactObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const contactSection = document.getElementById('contact');
  if (contactSection) {
    contactSection.querySelectorAll('.contact-link').forEach(link => {
      link.style.opacity = '0';
      link.style.transform = 'translateY(20px)';
      link.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
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
      if (!response.ok) throw new Error('Failed to load projects');
      allProjects = await response.json();

      // Collect all technologies for filter
      allProjects.forEach(p => {
        (p.technologies || []).forEach(t => allTechs.add(t));
      });

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
    // Update active state
    filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    activeBtn.classList.add('active');

    if (tech === 'all') {
      renderProjects(allProjects);
    } else {
      const filtered = allProjects.filter(p =>
        (p.technologies || []).includes(tech)
      );
      renderProjects(filtered);
    }
  }

  // Bind "All" button
  if (filterBar) {
    const allBtn = filterBar.querySelector('[data-filter="all"]');
    if (allBtn) {
      allBtn.addEventListener('click', () => filterProjects('all', allBtn));
    }
  }

  function renderProjects(projects) {
    if (!projectsGrid) return;
    projectsGrid.innerHTML = '';

    projects.forEach((project, index) => {
      const card = document.createElement('div');
      card.className = 'project-card interactive';
      card.style.transitionDelay = (index * 0.1) + 's';

      const linkIcon = project.type === 'gdrive'
        ? '<i class="fa-brands fa-google-drive"></i>'
        : '<i class="fa-brands fa-github"></i>';

      const linkLabel = project.type === 'gdrive' ? 'Google Drive' : 'GitHub';

      card.innerHTML = `
        <div class="project-card-number">Проект ${String(index + 1).padStart(2, '0')}</div>
        <h3 class="project-card-title">${escapeHtml(project.title)}</h3>
        <p class="project-card-desc">${escapeHtml(project.description)}</p>
        <div class="project-card-tech">
          ${(project.technologies || []).map(t =>
            `<span class="tech-badge">${escapeHtml(t)}</span>`
          ).join('')}
        </div>
        <a href="${escapeHtml(project.link)}" target="_blank" rel="noopener" class="project-card-link interactive">
          ${linkIcon} ${linkLabel} <span class="arrow">&rarr;</span>
        </a>
      `;

      projectsGrid.appendChild(card);

      // Observe for reveal animation
      cardObserver.observe(card);
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  loadProjects();

  /* ---------- Smooth Scroll for anchor links ---------- */
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
