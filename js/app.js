/* ============================================
   Main App — Portfolio llapik
   Lusion-inspired unified narrative
   Scroll-driven reveals, editorial project list
   ============================================ */

(function () {
  'use strict';

  /* ---------- Theme ---------- */
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
    var icon = document.querySelector('#theme-toggle i');
    if (icon) icon.className = mode === 'light' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
  }

  setTheme(getStoredTheme() || 'dark');

  var themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme') || 'dark';
      setTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  /* ---------- Loader ---------- */
  window.addEventListener('load', function () {
    var loader = document.getElementById('loader');
    if (loader) setTimeout(function () { loader.classList.add('loaded'); }, 500);
    animateHero();
  });

  /* ---------- Hero Entrance ---------- */
  function animateHero() {
    var ease = 'opacity 1.2s cubic-bezier(.16,1,.3,1), transform 1.2s cubic-bezier(.16,1,.3,1)';
    var items = [
      { el: document.querySelector('.hero-label'),   delay: 500 },
      { el: document.querySelector('.hero-name'),    delay: 700 },
      { el: document.querySelector('.hero-tagline'), delay: 1000 }
    ];
    items.forEach(function (item) {
      if (!item.el) return;
      setTimeout(function () {
        item.el.style.transition = ease;
        item.el.style.opacity = '1';
        item.el.style.transform = 'translateY(0)';
      }, item.delay);
    });
  }

  /* ---------- Hero Parallax (disabled on touch for perf) ---------- */
  var heroContent = document.querySelector('.hero-content');
  var isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  if (!isTouchDevice) {
    window.addEventListener('scroll', function () {
      if (!heroContent) return;
      var s = window.scrollY;
      var h = window.innerHeight;
      if (s < h) {
        var p = s / h;
        heroContent.style.opacity = String(1 - p * 1.3);
        heroContent.style.transform = 'translateY(' + (s * 0.35) + 'px) scale(' + (1 - p * 0.05) + ')';
      }
    }, { passive: true });
  }

  /* ---------- Navigation ---------- */
  var nav = document.getElementById('nav');
  var navToggle = document.getElementById('nav-toggle');
  var navLinks = document.getElementById('nav-links');

  window.addEventListener('scroll', function () {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 80);
  }, { passive: true });

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var isOpen = navLinks.classList.toggle('open');
      navToggle.classList.toggle('active');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navToggle.classList.remove('active');
        navLinks.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // Active link tracking
  var sections = document.querySelectorAll('section[id]');
  var navAnchors = document.querySelectorAll('.nav-links a');

  function updateActiveNav() {
    var scroll = window.scrollY + window.innerHeight * 0.35;
    var currentId = '';
    sections.forEach(function (sec) {
      if (sec.offsetTop <= scroll) currentId = sec.id;
    });
    navAnchors.forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('href') === '#' + currentId);
    });
  }
  window.addEventListener('scroll', updateActiveNav, { passive: true });

  /* ---------- Section Labels Reveal ---------- */
  var labelObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        labelObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.section-label').forEach(function (el) {
    labelObserver.observe(el);
  });

  /* ---------- About — Word Reveal ---------- */
  var aboutText = document.getElementById('about-text');
  if (aboutText) {
    var text = aboutText.textContent.trim();
    aboutText.innerHTML = '';
    text.split(/\s+/).forEach(function (word, i, arr) {
      var span = document.createElement('span');
      span.className = 'reveal-word';
      span.textContent = word;
      span.style.transitionDelay = (i * 0.022) + 's';
      aboutText.appendChild(span);
      if (i < arr.length - 1) aboutText.appendChild(document.createTextNode(' '));
    });
  }

  var wordObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.reveal-word').forEach(function (w) {
          w.classList.add('visible');
        });
        wordObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  if (aboutText) wordObserver.observe(aboutText);

  /* ---------- Contact Reveals ---------- */
  var contactHeading = document.querySelector('.contact-heading');
  var contactHeadingObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        contactHeadingObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  if (contactHeading) contactHeadingObs.observe(contactHeading);

  var contactLinkObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var links = entry.target.querySelectorAll('.contact-link');
      links.forEach(function (link, i) {
        setTimeout(function () {
          link.classList.add('visible');
        }, i * 120);
      });
      contactLinkObs.unobserve(entry.target);
    });
  }, { threshold: 0.15 });

  var contactLinks = document.querySelector('.contact-links');
  if (contactLinks) contactLinkObs.observe(contactLinks);

  /* ---------- Project Row Observer ---------- */
  var rowObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        rowObserver.unobserve(entry.target);
      }
    });
  }, { root: null, threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

  /* ---------- Load Projects ---------- */
  var workList = document.getElementById('work-list');

  async function loadProjects() {
    try {
      var response = await fetch('data/projects.json');
      if (!response.ok) throw new Error('Failed');
      var projects = await response.json();
      renderProjects(projects);
    } catch (err) {
      console.warn('Could not load projects:', err);
      if (workList) {
        workList.innerHTML = '<p style="color:var(--text-muted);padding:2rem 0;">Проекты загружаются...</p>';
      }
    }
  }

  function renderProjects(projects) {
    if (!workList) return;
    workList.innerHTML = '';

    projects.forEach(function (project, index) {
      var row = document.createElement('a');
      row.className = 'project-row interactive';
      row.href = project.link;
      row.target = '_blank';
      row.rel = 'noopener';
      row.style.transitionDelay = (index * 0.08) + 's';

      var iconClass = project.type === 'gdrive' ? 'fa-google-drive' : 'fa-github';
      var techHtml = (project.technologies || []).map(function (t) {
        return '<span>' + escapeHtml(t) + '</span>';
      }).join('');

      row.innerHTML =
        '<span class="project-row-num">' + String(index + 1).padStart(2, '0') + '</span>' +
        '<div class="project-row-body">' +
          '<h3 class="project-row-title">' + escapeHtml(project.title) + '</h3>' +
          '<p class="project-row-desc">' + escapeHtml(project.description) + '</p>' +
          '<div class="project-row-tech">' + techHtml + '</div>' +
        '</div>' +
        '<span class="project-row-arrow"><i class="fa-brands ' + iconClass + '"></i> &rarr;</span>';

      // Mouse glow tracking on row
      row.addEventListener('mousemove', function (e) {
        var rect = row.getBoundingClientRect();
        row.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
        row.style.setProperty('--my', (e.clientY - rect.top) + 'px');
      });

      workList.appendChild(row);
      rowObserver.observe(row);
    });
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  loadProjects();

  /* ---------- Smooth Scroll ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

})();
