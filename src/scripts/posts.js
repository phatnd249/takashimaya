/**
 * WordPress REST API Posts Carousel Module
 * Fetches latest posts from share4happy.com, cleans data with DOMParser,
 * and creates a responsive, bounded slider with smooth auto-rotation,
 * previous/next navigation buttons, and bottom progress indicator.
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
  // Cắt gọn excerpt tối đa 115 ký tự
  const excerpt = rawExcerpt.length > 115 ? rawExcerpt.substring(0, 115).trim() + '...' : rawExcerpt;
  
  let imageUrl = null;
  let imageAlt = title;

  const embeddedMedia = rawPost._embedded?.['wp:featuredmedia']?.[0];
  if (embeddedMedia) {
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
 * Fetch posts from WordPress REST API with fallback and merge capability
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
    let posts = [];

    // 1. Thử gọi chuyên mục chính
    try {
      const primaryUrl = makeUrl(CATEGORY_ID);
      const res = await fetch(primaryUrl, { mode: 'cors' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          posts = data.map(normalizePost);
        }
      }
    } catch (e) {
      console.warn('Không thể tải chuyên mục chính, chuyển sang fallback:', e);
    }

    // 2. Nếu chuyên mục chính có ít hơn 4 bài, nạp thêm từ fallback (207)
    if (posts.length < 4 && USE_FALLBACK_IF_EMPTY && FALLBACK_CATEGORY_ID) {
      try {
        const fallbackUrl = makeUrl(FALLBACK_CATEGORY_ID);
        const fallbackRes = await fetch(fallbackUrl, { mode: 'cors' });
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          if (Array.isArray(fallbackData) && fallbackData.length > 0) {
            const fallbackPosts = fallbackData.map(normalizePost);
            const existingIds = new Set(posts.map(p => p.id));
            fallbackPosts.forEach(fp => {
              if (!existingIds.has(fp.id)) {
                posts.push(fp);
              }
            });
          }
        }
      } catch (fbErr) {
        console.warn('Fallback category fetch failed:', fbErr);
      }
    }

    return posts;
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

  // Badge: "Bài Viết Mới" (matching Image 2)
  const badge = document.createElement('span');
  badge.className = 'post-card-badge';
  badge.textContent = 'Bài Viết Mới';
  mediaWrap.appendChild(badge);

  if (post.imageUrl) {
    const img = document.createElement('img');
    img.src = post.imageUrl;
    img.alt = post.imageAlt || post.title;
    img.loading = 'lazy';
    img.width = 360;
    img.height = 225;
    img.onerror = () => {
      // Fallback nếu ảnh lỗi
      mediaWrap.innerHTML = `
        <span class="post-card-badge">Bài Viết Mới</span>
        <div class="img-placeholder" style="aspect-ratio: 16/10;">
          <span>Bài viết LHU</span>
        </div>`;
    };
    mediaWrap.appendChild(img);
  } else {
    const placeholder = document.createElement('div');
    placeholder.className = 'img-placeholder';
    placeholder.style.aspectRatio = '16/10';
    placeholder.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="24" height="24" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
      </svg>
      <span>Góc nhìn sinh viên</span>`;
    mediaWrap.appendChild(placeholder);
  }

  // Content wrapper
  const content = document.createElement('div');
  content.className = 'post-card-body';

  // Date meta with Calendar Icon (matching Image 2)
  if (post.date) {
    const dateRow = document.createElement('div');
    dateRow.className = 'post-card-date';
    dateRow.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
      <time datetime="${post.date}">${post.date}</time>
    `;
    content.appendChild(dateRow);
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

  // Read more indicator (Amber color with arrow matching Image 2)
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
 * Initialize Bounded Carousel Slider with Auto-rotation
 */
export async function initPostsCarousel(containerSelector = '#posts-carousel-container') {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const track = container.querySelector('.posts-slider-track');
  const viewport = container.querySelector('.posts-slider-viewport');
  const prevBtn = container.querySelector('.posts-nav-prev');
  const nextBtn = container.querySelector('.posts-nav-next');
  const progressBar = container.querySelector('.posts-progress-bar');
  const statusEl = container.querySelector('.posts-status-message');

  if (!track || !viewport) return;

  try {
    const fetchedPosts = await fetchWordPressPosts();

    // Clear skeleton cards
    track.innerHTML = '';

    if (!fetchedPosts || fetchedPosts.length === 0) {
      if (statusEl) {
        statusEl.textContent = 'Hiện chưa có bài viết mới. Vui lòng quay lại sau!';
        statusEl.style.display = 'block';
      }
      if (prevBtn) prevBtn.style.display = 'none';
      if (nextBtn) nextBtn.style.display = 'none';
      const progressWrap = container.querySelector('.posts-progress-wrap');
      if (progressWrap) progressWrap.style.display = 'none';
      return;
    }

    // Đảm bảo có tối thiểu 6 items cho slider xoay tua mượt mà
    let basePosts = [...fetchedPosts];
    while (basePosts.length < 6) {
      basePosts = basePosts.concat(fetchedPosts);
    }

    const postCount = basePosts.length;

    // Tạo 3 bộ thẻ: Set 0 (clones trước), Set 1 (chính), Set 2 (clones sau)
    // Giúp vòng lặp vô tận (infinite loop) hoạt động liền mạch 100% không giật
    const sets = [
      { isClone: true },
      { isClone: false },
      { isClone: true }
    ];

    sets.forEach(({ isClone }) => {
      basePosts.forEach(post => {
        const cardEl = createPostCardElement(post, isClone);
        track.appendChild(cardEl);
      });
    });

    let currentIndex = postCount; // Bắt đầu ở đầu Set 1 (chính)
    let isTransitioning = false;
    let transitionSafetyTimer = null;
    let autoPlayTimer = null;
    const AUTO_PLAY_INTERVAL = CONFIG.CAROUSEL?.AUTOPLAY_INTERVAL || 3800;

    // Tính toán khoảng cách trượt chính xác theo sub-pixel
    function getStepWidth() {
      const card = track.querySelector('.post-card');
      if (!card) return 0;
      const cardRect = card.getBoundingClientRect();
      const style = window.getComputedStyle(track);
      const gap = parseFloat(style.gap) || 20;
      return cardRect.width + gap;
    }

    // Cập nhật vị trí trượt và thanh tiến trình
    function updateSlide(animated = true) {
      const step = getStepWidth();
      if (step <= 0) return;

      if (animated) {
        track.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
      } else {
        track.style.transition = 'none';
      }

      const offset = currentIndex * step;
      track.style.transform = `translate3d(-${offset}px, 0, 0)`;

      // Cập nhật thanh tiến trình theo phong cách Image 2 (indicator thumb trượt theo bài)
      if (progressBar) {
        const w = window.innerWidth;
        const visibleCount = w <= 520 ? 1 : w <= 768 ? 2 : w <= 1100 ? 3 : 4;
        const wrapWidth = progressBar.parentElement?.clientWidth || 1000;
        const thumbRatio = Math.min(0.85, Math.max(0.25, visibleCount / postCount));
        const thumbPx = Math.round(wrapWidth * thumbRatio);
        const maxShiftPx = wrapWidth - thumbPx;
        const activeRealIndex = (currentIndex % postCount);
        const maxIndex = Math.max(1, postCount - 1);
        const shiftPx = Math.round((activeRealIndex / maxIndex) * maxShiftPx);

        progressBar.style.width = `${thumbPx}px`;
        progressBar.style.transform = `translate3d(${shiftPx}px, 0, 0)`;
      }
    }

    function setTransitioning(val) {
      isTransitioning = val;
      if (transitionSafetyTimer) clearTimeout(transitionSafetyTimer);
      if (val) {
        transitionSafetyTimer = setTimeout(() => {
          isTransitioning = false;
        }, 650);
      }
    }

    function slideNext() {
      if (isTransitioning) return;
      setTransitioning(true);
      currentIndex++;
      updateSlide(true);
    }

    function slidePrev() {
      if (isTransitioning) return;
      setTransitioning(true);
      currentIndex--;
      updateSlide(true);
    }

    // Bắt sự kiện kết thúc chuyển động để nhảy tức thời giữa các Set mà người dùng không nhận ra
    track.addEventListener('transitionend', (e) => {
      if (e.target !== track || e.propertyName !== 'transform') return;
      setTransitioning(false);

      if (currentIndex >= 2 * postCount) {
        currentIndex -= postCount;
        updateSlide(false);
      } else if (currentIndex < postCount) {
        currentIndex += postCount;
        updateSlide(false);
      }
    });

    // Auto Play Logic
    function startAutoPlay() {
      stopAutoPlay();
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return;

      autoPlayTimer = setInterval(() => {
        slideNext();
      }, AUTO_PLAY_INTERVAL);
    }

    function stopAutoPlay() {
      if (autoPlayTimer) {
        clearInterval(autoPlayTimer);
        autoPlayTimer = null;
      }
    }

    // Đặt vị trí ban đầu chính xác sau khi DOM render
    requestAnimationFrame(() => {
      updateSlide(false);
      setTimeout(() => {
        updateSlide(false);
      }, 60);
      startAutoPlay();
    });

    // Sự kiện nút Prev / Next
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        slidePrev();
        startAutoPlay();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        slideNext();
        startAutoPlay();
      });
    }

    // Tạm dừng khi rê chuột hoặc focus
    container.addEventListener('mouseenter', stopAutoPlay);
    container.addEventListener('mouseleave', startAutoPlay);
    container.addEventListener('focusin', stopAutoPlay);
    container.addEventListener('focusout', startAutoPlay);

    // Tạm dừng khi chuyển tab trình duyệt
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopAutoPlay();
      } else {
        startAutoPlay();
      }
    });

    // Touch Swipe cho Mobile / Tablet
    let touchStartX = 0;
    let touchStartY = 0;
    let isSwiping = false;

    viewport.addEventListener('touchstart', (e) => {
      if (!e.touches || e.touches.length === 0) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isSwiping = true;
      stopAutoPlay();
    }, { passive: true });

    viewport.addEventListener('touchend', (e) => {
      if (!isSwiping || !e.changedTouches || e.changedTouches.length === 0) return;
      isSwiping = false;
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const diffX = touchStartX - touchEndX;
      const diffY = touchStartY - touchEndY;

      // Chỉ kích hoạt swipe ngang nếu chuyển động ngang lớn hơn dọc
      if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 0) {
          slideNext();
        } else {
          slidePrev();
        }
      }
      startAutoPlay();
    }, { passive: true });

    // Cập nhật khi resize cửa sổ
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        updateSlide(false);
      }, 100);
    });

  } catch (err) {
    console.error('Lỗi khi tải bài viết WordPress:', err);
    track.innerHTML = '';
    if (statusEl) {
      statusEl.textContent = 'Không thể tải bài viết lúc này. Bạn vẫn có thể khám phá các nội dung khác bên dưới.';
      statusEl.style.display = 'block';
    }
  }
}
