/**
 * Application Configuration
 * Centralized settings for API endpoints, URLs and fallback behaviors
 */

export const CONFIG = {
  SITE_NAME: 'Chuyện Tụi Mình — Văn Bằng 2 Truyền Thông LHU',
  PAGE_SOURCE: 'Văn bằng 2 - Truyền thông LHU',
  SITE_URL: import.meta.env.VITE_SITE_URL || 'https://username.github.io/Takashimaya/',
  
  // WordPress REST API
  WP: {
    API_URL: import.meta.env.VITE_WP_API_URL || 'https://share4happy.com/wp-json/wp/v2/posts',
    CATEGORY_ID: Number(import.meta.env.VITE_WP_CATEGORY_ID) || 210,
    PER_PAGE: Number(import.meta.env.VITE_WP_POSTS_PER_PAGE) || 10,
    // Chuyên mục fallback (nếu cần chỉ định khi muốn nạp thêm)
    FALLBACK_CATEGORY_ID: Number(import.meta.env.VITE_WP_FALLBACK_CATEGORY) || null,
    USE_FALLBACK_IF_EMPTY: import.meta.env.VITE_WP_USE_FALLBACK === 'true',
  },

  // Carousel settings
  CAROUSEL: {
    AUTOPLAY_INTERVAL: 3800, // milliseconds between auto slides
  },
};
