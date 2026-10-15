/**
 * WordPress REST API Posts Carousel Module
 * Fetches latest posts from share4happy.com, cleans data with DOMParser,
 * and creates an accessible, smooth infinite marquee carousel.
 */

import { CONFIG } from './config.js';

/**
 * Clean HTML tags & decode HTML entities safely using DOMParser
 */
function cleanHtmlText(rawHtml) {
  if (!rawHtml) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');
  return (doc.body.textContent || '').trim();
}

/**
 * Format date to Vietnamese format: DD/MM/YYYY
 */
function formatDate(isoDateString) {
  try {
    const d = new Date(isoDateString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return '';
  }
}

/**
 * Normalize raw WP post item into a clean, safe object
 */
function normalizePost(rawPost) {
  const title = cleanHtmlText(rawPost.title?.rendered) || 'Bài viết chia sẻ';
  const rawExcerpt = cleanHtmlText(rawPost.excerpt?.rendered);
  // Cắt gọn excerpt tối đa 110 ký tự
  const excerpt = rawExcerpt.length > 110 ? rawExcerpt.substring(0, 110).trim() + '...' : rawExcerpt;
  
  let imageUrl = null;
  let imageAlt = title;

  const embeddedMedia = rawPost._embedded?.['wp:featuredmedia']?.[0];
  if (embeddedMedia) {
    // Ưu tiên size medium_large hoặc large nếu có, fallback về source_url
    const sizes = embeddedMedia.media_details?.sizes;
    imageUrl = sizes?.medium_large?.source_url || sizes?.large?.source_url || embeddedMedia.source_url;
    if (embeddedMedia.alt_text) {
      imageAlt = cleanHtmlText(embeddedMedia.alt_text);
    }
  }

  return {
    id: rawPost.id,
    title,
    excerpt,
    url: rawPost.link || '#',
    imageUrl,
    imageAlt,
    date: formatDate(rawPost.date)
  };
}

/**
 * Fetch posts from WordPress REST API with fallback capability
 */
export async function fetchWordPressPosts() {
  const { API_URL, CATEGORY_ID, PER_PAGE, FALLBACK_CATEGORY_ID, USE_FALLBACK_IF_EMPTY } = CONFIG.WP;

  const makeUrl = (catId) => {
    let url = `${API_URL}?per_page=${PER_PAGE}&_embed=1`;
    if (catId) {
      url += `&categories=${catId}`;
    }
    return url;
  };

  try {
    // 1. Thử gọi chuyên mục chính (208)
    const primaryUrl = makeUrl(CATEGORY_ID);
    const res = await fetch(primaryUrl, { mode: 'cors' });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();

    if (Array.isArray(data) && data.length > 0) {
      return data.map(normalizePost);
    }

    // 2. Nếu chuyên mục 208 rỗng và cho phép fallback, gọi chuyên mục dự phòng có bài (207)
    if (USE_FALLBACK_IF_EMPTY && FALLBACK_CATEGORY_ID) {
      const fallbackUrl = makeUrl(FALLBACK_CATEGORY_ID);
      const fallbackRes = await fetch(fallbackUrl, { mode: 'cors' });
      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        if (Array.isArray(fallbackData) && fallbackData.length > 0) {
          return fallbackData.map(normalizePost);
        }
      }
    }

    return [];
  } catch (err) {
    console.warn('Không thể kết nối đến WordPress REST API:', err);
    throw err;
  }
}

/**
 * Build a single post card element safely using DOM methods
 */
function createPostCardElement(post, isClone = false) {
  const card = document.createElement('article');
  card.className = 'post-card';
  if (isClone) {
    card.setAttribute('aria-hidden', 'true');
  }

  const link = document.createElement('a');
  link.href = post.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.className = 'post-card-inner';
  if (isClone) {
    link.setAttribute('tabindex', '-1');
  }
  link.setAttribute('aria-label', `Đọc bài viết: ${post.title}`);

  // Image wrapper
  const mediaWrap = document.createElement('div');
  mediaWrap.className = 'post-card-thumb';

  if (post.imageUrl) {
    const img = document.createElement('img');
    img.src = post.imageUrl;
    img.alt = post.imageAlt || post.title;
    img.loading = 'lazy';
    img.width = 360;
    img.height = 200;
    img.onerror = () => {
      // Fallback nếu ảnh bị lỗi 404
      mediaWrap.innerHTML = `
        <div class="img-placeholder" style="aspect-ratio: 16/9;">
          <span>Bài viết LHU</span>
        </div>`;
    };
    mediaWrap.appendChild(img);
  } else {
    mediaWrap.innerHTML = `
      <div class="img-placeholder" style="aspect-ratio: 16/9;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="24" height="24" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
        </svg>
        <span>Góc nhìn sinh viên</span>
      </div>`;
  }

  // Content wrapper
  const content = document.createElement('div');
  content.className = 'post-card-body';

  // Date meta
  if (post.date) {
    const time = document.createElement('time');
    time.className = 'post-card-date';
    time.textContent = post.date;
    content.appendChild(time);
  }

  // Title
  const h3 = document.createElement('h3');
  h3.className = 'post-card-title';
  h3.textContent = post.title;
  content.appendChild(h3);

  // Excerpt
  if (post.excerpt) {
    const p = document.createElement('p');
    p.className = 'post-card-excerpt';
    p.textContent = post.excerpt;
    content.appendChild(p);
  }

  // Read more indicator
  const readMore = document.createElement('span');
  readMore.className = 'post-card-more';
  readMore.innerHTML = `Đọc tiếp <span aria-hidden="true">→</span>`;
  content.appendChild(readMore);

  link.appendChild(mediaWrap);
  link.appendChild(content);
  card.appendChild(link);

  return card;
}

/**
 * Initialize Carousel in container
 */
export async function initPostsCarousel(containerSelector = '#posts-carousel-container') {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const track = container.querySelector('.posts-marquee-track');
  const statusEl = container.querySelector('.posts-status-message');
  const toggleBtn = container.querySelector('.btn-toggle-marquee');

  if (!track) return;

  try {
    const posts = await fetchWordPressPosts();

    // Remove skeleton cards
    track.innerHTML = '';

    if (posts.length === 0) {
      if (statusEl) {
        statusEl.textContent = 'Hiện chưa có bài viết mới. Vui lòng quay lại sau!';
        statusEl.style.display = 'block';
      }
      return;
    }

    // Duplicate posts enough times so width exceeds 1920px seamlessly (3 sets of 5 = 15 cards)
    const setsNeeded = 4;
    for (let setIdx = 0; setIdx < setsNeeded; setIdx++) {
      const isClone = setIdx > 0;
      posts.forEach(post => {
        const cardEl = createPostCardElement(post, isClone);
        track.appendChild(cardEl);
      });
    }

    // Pause/Play toggle button support
    if (toggleBtn) {
      let isPaused = false;
      toggleBtn.addEventListener('click', () => {
        isPaused = !isPaused;
        track.classList.toggle('is-paused', isPaused);
        toggleBtn.setAttribute('aria-pressed', isPaused ? 'true' : 'false');
        toggleBtn.innerHTML = isPaused 
          ? `<span aria-hidden="true">▶</span> Tiếp tục trôi`
          : `<span aria-hidden="true">⏸</span> Tạm dừng`;
      });
    }

    // Touch support for mobile: pause on touchstart, resume on touchend
    container.addEventListener('touchstart', () => {
      track.classList.add('is-touch-paused');
    }, { passive: true });

    container.addEventListener('touchend', () => {
      track.classList.remove('is-touch-paused');
    }, { passive: true });

  } catch (err) {
    // API / Network error
    track.innerHTML = '';
    if (statusEl) {
      statusEl.textContent = 'Không thể tải bài viết lúc này. Bạn vẫn có thể khám phá các nội dung khác bên dưới.';
      statusEl.style.display = 'block';
    }
  }
}
