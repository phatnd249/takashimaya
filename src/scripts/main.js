/**
 * Main Application Entry Point
 */

// Styles
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/components.css';
import '../styles/sections/header.css';
import '../styles/sections/hero.css';
import '../styles/sections/insights.css';
import '../styles/sections/stories.css';
import '../styles/sections/experiences.css';
import '../styles/sections/gallery.css';
import '../styles/sections/posts-carousel.css';
import '../styles/sections/journey.css';
import '../styles/sections/admission.css';
import '../styles/sections/faq.css';
import '../styles/sections/cta-banner.css';
import '../styles/sections/footer.css';
import '../styles/sections/quick-nav.css';

// Scripts
import { initMobileMenu } from './menu.js';
import { initHeroSlider } from './slider.js';
import { initAccordion } from './accordion.js';
import { initQuickNav } from './quick-nav.js';
import { initPostsCarousel } from './posts.js';

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initHeroSlider();
  initAccordion();
  initQuickNav();
  initPostsCarousel();
});
