/* ============================================
   Custom Cursor with Inertia + Magnetic Effect
   ============================================ */

(function () {
  'use strict';

  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (isTouchDevice || prefersReducedMotion) return;

  const cursor = document.getElementById('cursor');
  const cursorDot = document.getElementById('cursor-dot');
  if (!cursor || !cursorDot) return;

  let mouseX = 0, mouseY = 0;
  let cursorX = 0, cursorY = 0;
  let dotX = 0, dotY = 0;
  let isHovering = false;
  let magnetTarget = null;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }, { passive: true });

  // Hover detection on interactive elements
  document.addEventListener('mouseover', (e) => {
    const interactive = e.target.closest('a, button, .interactive, .project-card, .skill-tag, .contact-link, .filter-btn');
    if (interactive) {
      cursor.classList.add('cursor--hover');
      isHovering = true;
      // Enable magnetic pull for small elements
      if (interactive.matches('.skill-tag, .filter-btn, .theme-toggle, .lang-toggle, .contact-link')) {
        magnetTarget = interactive;
      }
    }
  });

  document.addEventListener('mouseout', (e) => {
    const interactive = e.target.closest('a, button, .interactive, .project-card, .skill-tag, .contact-link, .filter-btn');
    if (interactive) {
      cursor.classList.remove('cursor--hover');
      isHovering = false;
      magnetTarget = null;
    }
  });

  // Click effect
  document.addEventListener('mousedown', () => {
    cursor.classList.add('cursor--click');
  });

  document.addEventListener('mouseup', () => {
    cursor.classList.remove('cursor--click');
  });

  // Animation loop with inertia + magnetic pull
  function animateCursor() {
    let targetX = mouseX;
    let targetY = mouseY;

    // Magnetic pull toward element center
    if (magnetTarget) {
      const rect = magnetTarget.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dist = Math.hypot(mouseX - centerX, mouseY - centerY);
      const maxDist = Math.max(rect.width, rect.height);

      if (dist < maxDist) {
        const pull = 0.3 * (1 - dist / maxDist);
        targetX = mouseX + (centerX - mouseX) * pull;
        targetY = mouseY + (centerY - mouseY) * pull;
      }
    }

    // Outer ring — slower (inertia)
    const easeCursor = isHovering ? 0.1 : 0.13;
    cursorX += (targetX - cursorX) * easeCursor;
    cursorY += (targetY - cursorY) * easeCursor;

    // Inner dot — faster
    const easeDot = 0.22;
    dotX += (targetX - dotX) * easeDot;
    dotY += (targetY - dotY) * easeDot;

    cursor.style.left = cursorX + 'px';
    cursor.style.top = cursorY + 'px';
    cursorDot.style.left = dotX + 'px';
    cursorDot.style.top = dotY + 'px';

    requestAnimationFrame(animateCursor);
  }

  requestAnimationFrame(animateCursor);
})();
