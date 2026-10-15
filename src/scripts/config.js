/**
 * Application Configuration
 * Centralized settings for API endpoints, URLs and fallback behaviors
 */

export const CONFIG = {
  SITE_NAME: 'Chuyện Tụi Mình — Văn Bằng 2 Truyền Thông LHU',
  SITE_URL: import.meta.env.VITE_SITE_URL || 'https://username.github.io/Takashimaya/',
  
  // WordPress REST API
  WP: {
    API_URL: import.meta.env.VITE_WP_API_URL || 'https://share4happy.com/wp-json/wp/v2/posts',
    CATEGORY_ID: Number(import.meta.env.VITE_WP_CATEGORY_ID) || 208,
    PER_PAGE: Number(import.meta.env.VITE_WP_POSTS_PER_PAGE) || 5,
    // Chuyên mục fallback (ví dụ 207 - Ẩm thực Biên Hòa) khi chuyên mục 208 hiện có 0 bài viết
    FALLBACK_CATEGORY_ID: Number(import.meta.env.VITE_WP_FALLBACK_CATEGORY) || 207,
    USE_FALLBACK_IF_EMPTY: true,
  },

  // Marquee duration (seconds)
  MARQUEE_DURATION_SECONDS: 45,
};
