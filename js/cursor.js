/* ============================================
   Custom Cursor with Inertia
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

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }, { passive: true });

  // Hover detection on interactive elements
  document.addEventListener('mouseover', (e) => {
    const interactive = e.target.closest('a, button, .interactive, .project-row, .contact-link, .theme-toggle, .nav-toggle');
    if (interactive) {
      cursor.classList.add('cursor--hover');
      isHovering = true;
    }
  });

  document.addEventListener('mouseout', (e) => {
    const interactive = e.target.closest('a, button, .interactive, .project-row, .contact-link, .theme-toggle, .nav-toggle');
    if (interactive) {
      cursor.classList.remove('cursor--hover');
      isHovering = false;
    }
  });

  // Click effect
  document.addEventListener('mousedown', () => {
    cursor.classList.add('cursor--click');
  });

  document.addEventListener('mouseup', () => {
    cursor.classList.remove('cursor--click');
  });

  // Animation loop with inertia
  function animateCursor() {
    // Outer ring — slower (inertia)
    const easeCursor = isHovering ? 0.12 : 0.15;
    cursorX += (mouseX - cursorX) * easeCursor;
    cursorY += (mouseY - cursorY) * easeCursor;

    // Inner dot — faster
    const easeDot = 0.25;
    dotX += (mouseX - dotX) * easeDot;
    dotY += (mouseY - dotY) * easeDot;

    cursor.style.left = cursorX + 'px';
    cursor.style.top = cursorY + 'px';
    cursorDot.style.left = dotX + 'px';
    cursorDot.style.top = dotY + 'px';

    requestAnimationFrame(animateCursor);
  }

  requestAnimationFrame(animateCursor);
})();
