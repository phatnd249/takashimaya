/**
 * Accessible FAQ Accordion Module
 */

export function initAccordion(selector = '.faq-accordion') {
  const accordion = document.querySelector(selector);
  if (!accordion) return;

  const items = accordion.querySelectorAll('.faq-item');

  items.forEach((item, index) => {
    const trigger = item.querySelector('.faq-trigger');
    const content = item.querySelector('.faq-content');

    if (!trigger || !content) return;

    trigger.addEventListener('click', () => {
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';

      // Đóng các item khác để trải nghiệm gọn gàng
      items.forEach(otherItem => {
        if (otherItem !== item) {
          const otherTrigger = otherItem.querySelector('.faq-trigger');
          const otherContent = otherItem.querySelector('.faq-content');
          if (otherTrigger && otherContent) {
            otherTrigger.setAttribute('aria-expanded', 'false');
            otherContent.hidden = true;
            otherItem.classList.remove('is-open');
          }
        }
      });

      // Toggle item hiện tại
      const nextState = !isExpanded;
      trigger.setAttribute('aria-expanded', nextState ? 'true' : 'false');
      content.hidden = !nextState;
      item.classList.toggle('is-open', nextState);
    });

    // Keyboard support: Arrow navigation
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = (index + 1) % items.length;
        items[nextIndex].querySelector('.faq-trigger')?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = (index - 1 + items.length) % items.length;
        items[prevIndex].querySelector('.faq-trigger')?.focus();
      }
    });
  });
}
