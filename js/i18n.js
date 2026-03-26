/* ============================================
   i18n — Language switching (RU / EN)
   ============================================ */

(function () {
  'use strict';

  var translations = {
    ru: {
      'nav.about': 'О себе',
      'nav.projects': 'Проекты',
      'nav.contact': 'Контакты',
      'hero.greeting': 'Привет, я',
      'hero.tagline': 'Создаю цифровые продукты на стыке дизайна, кода и безответственности',
      'hero.dive': 'Погрузиться',
      'hero.cta': 'Смотреть проекты <span>&rarr;</span>',
      'loader.depth': 'Погружение...',
      'about.title': 'О себе',
      'about.subtitle': 'Developer & Creative Thinker',
      'about.text': 'Я разработчик с фокусом на визуальные впечатления и интересные программные решения. Мне нравится решать сложные задачи путём реализации элегантных цифровых решений, где каждая деталь продумана — от анимации до архитектуры кода. Работаю с современными веб-технологиями, не брезгую нейросетями и всегда ищу способы сделать пользовательский опыт более живым и запоминающимся, а также расширить свой кругозор.',
      'projects.title': 'Проекты',
      'projects.subtitle': 'Избранные работы и эксперименты',
      'projects.all': 'Все',
      'projects.prefix': 'Проект',
      'projects.loading': 'Проекты загружаются...',
      'contact.title': 'Контакты',
      'contact.subtitle': 'Открыт для сотрудничества и новых идей',
      'footer.copy': '&copy; 2026 llapik. Все права защищены.',
      'meta.title': 'llapik — Портфолио разработчика | Александр Стих',
      'meta.description': 'Портфолио Александра Стих (llapik) — разработчик и дизайнер. Проекты на JavaScript, Python, C++, C#, WebGL.'
    },
    en: {
      'nav.about': 'About',
      'nav.projects': 'Projects',
      'nav.contact': 'Contact',
      'hero.greeting': "Hi, I'm",
      'hero.tagline': 'I build digital products at the intersection of design, code, and recklessness',
      'hero.dive': 'Dive in',
      'hero.cta': 'View projects <span>&rarr;</span>',
      'loader.depth': 'Diving...',
      'about.title': 'About me',
      'about.subtitle': 'Developer & Creative Thinker',
      'about.text': "I'm a developer focused on visual experiences and creative software solutions. I enjoy solving complex problems through elegant digital solutions, where every detail is carefully crafted — from animations to code architecture. I work with modern web technologies, embrace AI tools, and always look for ways to make user experiences more vibrant and memorable while expanding my horizons.",
      'projects.title': 'Projects',
      'projects.subtitle': 'Selected works and experiments',
      'projects.all': 'All',
      'projects.prefix': 'Project',
      'projects.loading': 'Loading projects...',
      'contact.title': 'Contact',
      'contact.subtitle': 'Open for collaboration and new ideas',
      'footer.copy': '&copy; 2026 llapik. All rights reserved.',
      'meta.title': 'llapik — Developer Portfolio | Alexandr Stih',
      'meta.description': 'Portfolio of Alexandr Stih (llapik) — developer & designer. Projects in JavaScript, Python, C++, C#, WebGL.'
    }
  };

  // Detect preferred language: saved > browser > default ru
  function detectLanguage() {
    var saved = localStorage.getItem('lang');
    if (saved && translations[saved]) return saved;
    var browserLang = (navigator.language || navigator.userLanguage || '').slice(0, 2);
    return browserLang === 'ru' ? 'ru' : 'en';
  }

  var currentLang = detectLanguage();

  function t(key) {
    return (translations[currentLang] && translations[currentLang][key]) || key;
  }

  function applyTranslations() {
    document.documentElement.lang = currentLang;

    // Translate all data-i18n elements
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var value = t(key);
      if (key === 'about.text') {
        // About text needs special handling — will be re-processed by word reveal in app.js
        el.textContent = value;
        // Dispatch event so app.js can re-init word reveal
        el.dispatchEvent(new CustomEvent('i18n:updated'));
      } else {
        el.innerHTML = value;
      }
    });

    // Update meta tags
    document.title = t('meta.title');
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', t('meta.description'));

    // Update toggle button text
    var toggleBtn = document.getElementById('lang-toggle');
    if (toggleBtn) {
      toggleBtn.textContent = currentLang === 'ru' ? 'EN' : 'RU';
      toggleBtn.setAttribute('aria-label', currentLang === 'ru' ? 'Switch to English' : 'Переключить на русский');
    }

    // Dispatch global event for app.js to re-render projects
    window.dispatchEvent(new CustomEvent('langchange', { detail: { lang: currentLang } }));
  }

  function switchLanguage() {
    currentLang = currentLang === 'ru' ? 'en' : 'ru';
    localStorage.setItem('lang', currentLang);
    applyTranslations();
  }

  // Expose globally for other modules
  window.i18n = { t: t, lang: function () { return currentLang; } };

  // Bind toggle button
  document.addEventListener('DOMContentLoaded', function () {
    var toggleBtn = document.getElementById('lang-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', switchLanguage);
    }
  });

  // Apply on load — before DOMContentLoaded so hero animations show correct text
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyTranslations);
  } else {
    applyTranslations();
  }
})();
