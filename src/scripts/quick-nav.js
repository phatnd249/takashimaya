/**
 * Quick Navigator Module ("KHÁM PHÁ" 01 - 05)
 * Controls the floating right navigation pill with high contrast,
 * always-visible numbers, tooltips, and IntersectionObserver scrollspy.
 */

export function initQuickNav() {
  const quickNav = document.querySelector('.quick-nav');
  if (!quickNav) return;

  const navItems = quickNav.querySelectorAll('.quick-nav-item');
  const sections = [];

  navItems.forEach(item => {
    const targetId = item.getAttribute('href');
    if (targetId && targetId.startsWith('#')) {
      const section = document.querySelector(targetId);
      if (section) {
        sections.push({ id: targetId, section, item });
      }
    }
  });

  if (sections.length === 0) return;

  function setActiveItem(targetId) {
    navItems.forEach(item => {
      const isTarget = item.getAttribute('href') === targetId;
      item.classList.toggle('is-active', isTarget);
      if (isTarget) {
        item.setAttribute('aria-current', 'true');
      } else {
        item.removeAttribute('aria-current');
      }
    });
  }

  // Smooth click navigation
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = item.getAttribute('href');
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth' });
        setActiveItem(targetId);
      }
    });
  });

  // IntersectionObserver for scrollspy
  const observerOptions = {
    root: null,
    rootMargin: '-30% 0px -40% 0px',
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setActiveItem(`#${entry.target.id}`);
      }
    });
  }, observerOptions);

  sections.forEach(({ section }) => {
    observer.observe(section);
  });
}
