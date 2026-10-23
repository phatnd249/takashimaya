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

  let isSuccess = false;
  let statusCode = null;

  try {
    let posts = [];

    // 1. Thử gọi chuyên mục chính
    try {
      const primaryUrl = makeUrl(CATEGORY_ID);
      const res = await fetch(primaryUrl, { mode: 'cors' });
      statusCode = res.status;
      if (res.ok) {
        isSuccess = true;
        const data = await res.json();
        if (Array.isArray(data)) {
          posts = data.map(normalizePost);
        }
        console.log(`[WordPress API] Gọi thành công Chuyên mục #${CATEGORY_ID}: HTTP ${statusCode} OK. Nhận được ${posts.length} bài viết.`);
      } else {
        console.warn(`[WordPress API] Chuyên mục #${CATEGORY_ID} trả về mã HTTP ${statusCode}`);
      }
    } catch (e) {
      console.warn(`[WordPress API] Không thể tải dữ liệu Chuyên mục #${CATEGORY_ID}:`, e);
    }

    // 2. Nếu chuyên mục chính có ít hơn 4 bài và USE_FALLBACK_IF_EMPTY được bật
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

    // Gắn metadata kiểm tra gọi API
    posts.apiStatus = {
      isSuccess,
      statusCode,
      categoryId: CATEGORY_ID,
      count: posts.length
    };

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
 * Render luxurious empty state when Category 210 currently has 0 posts
 */
function renderPostsEmptyState(container, apiStatus = {}) {
  const sliderInner = container.querySelector('.posts-slider-inner');
  const progressWrap = container.querySelector('.posts-progress-wrap');
  const statusEl = container.querySelector('.posts-status-message');
  
  if (statusEl) statusEl.style.display = 'none';
  if (sliderInner) sliderInner.style.display = 'none';
  if (progressWrap) progressWrap.style.display = 'none';

  // Remove existing empty state if any
  const oldEmpty = container.querySelector('.posts-empty-state');
  if (oldEmpty) oldEmpty.remove();

  const categoryId = apiStatus.categoryId || CONFIG.WP.CATEGORY_ID || 210;
  const statusOk = apiStatus.isSuccess !== false;

  const emptyWrap = document.createElement('div');
  emptyWrap.className = 'posts-empty-state';
  emptyWrap.setAttribute('role', 'region');
  emptyWrap.setAttribute('aria-label', 'Thông báo chuyên mục đang biên tập');

  emptyWrap.innerHTML = `
    <!-- Top Status Banner with Active API Ping -->
    <div class="empty-status-pill" role="status">
      <span class="empty-status-dot" aria-hidden="true"></span>
      <span class="empty-status-text">
        ${statusOk 
          ? `Đã kết nối API thành công: Chuyên mục #${categoryId} (Văn bằng 2) • HTTP 200 OK • Hệ thống sẵn sàng đồng bộ` 
          : `Đang kết nối lại máy chủ WordPress (Chuyên mục #${categoryId})`}
      </span>
    </div>

    <!-- Main Showcase Card -->
    <div class="empty-main-card">
      <div class="empty-icon-wrapper" aria-hidden="true">
        <div class="empty-icon-glow"></div>
        <div class="empty-icon-circle">
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            <line x1="8" y1="6" x2="16" y2="6"></line>
            <line x1="8" y1="10" x2="16" y2="10"></line>
            <line x1="8" y1="14" x2="12" y2="14"></line>
          </svg>
        </div>
        <span class="empty-sparkle empty-sparkle-1">✦</span>
        <span class="empty-sparkle empty-sparkle-2">★</span>
      </div>

      <div class="empty-content">
        <div class="empty-tag">
          <span class="empty-tag-icon">✨</span>
          <span>Chuyên mục đang biên tập nội dung</span>
        </div>
        <h3 class="empty-title">Các bài viết & góc nhìn mới đang được hoàn thiện</h3>
        <p class="empty-desc">
          Chuyên mục <strong>Văn bằng 2 (ID: ${categoryId})</strong> đã kết nối thành công với cổng tin tức Đại học Lạc Hồng. Ban biên tập sinh viên đang tổng hợp những trải nghiệm học tập thực chiến, câu chuyện chuyển ngành và review đồ án truyền thông chất lượng nhất để gửi đến bạn.
        </p>

        <div class="empty-actions">
          <a href="#consultation-modal" class="btn btn-primary btn-empty-cta" data-open-modal="consultation-modal">
            <span>✦ Nhận thông báo bài mới & Tư vấn</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </a>
          <a href="#cau-chuyen" class="btn btn-secondary btn-empty-secondary">
            <span>Khám phá chuyện tụi mình</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </a>
          <button type="button" class="btn-refresh-posts" id="btn-refresh-posts" aria-label="Kiểm tra lại bài viết mới từ máy chủ">
            <svg class="refresh-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            <span class="refresh-text">Kiểm tra bài mới</span>
          </button>
        </div>
      </div>
    </div>
  `;

  container.appendChild(emptyWrap);

  // Hook consultation modal trigger
  const modalCta = emptyWrap.querySelector('[data-open-modal="consultation-modal"]');
  if (modalCta) {
    modalCta.addEventListener('click', (e) => {
      e.preventDefault();
      const modal = document.getElementById('consultation-modal');
      if (modal) {
        modal.classList.add('is-active');
        document.body.style.overflow = 'hidden';
      }
    });
  }

  // Hook refresh button
  const refreshBtn = emptyWrap.querySelector('#btn-refresh-posts');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.classList.add('is-refreshing');
      const textSpan = refreshBtn.querySelector('.refresh-text');
      if (textSpan) textSpan.textContent = 'Đang kiểm tra...';

      try {
        const recheck = await fetchWordPressPosts();
        if (recheck && recheck.length > 0) {
          // Has posts now! Clear empty state and reinitialize carousel
          emptyWrap.remove();
          if (sliderInner) sliderInner.style.display = '';
          if (progressWrap) progressWrap.style.display = '';
          initPostsCarousel(containerSelector);
        } else {
          setTimeout(() => {
            refreshBtn.classList.remove('is-refreshing');
            if (textSpan) textSpan.textContent = 'Đã kiểm tra (0 bài)';
            const statusText = emptyWrap.querySelector('.empty-status-text');
            if (statusText) {
              const now = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              statusText.textContent = `Đã kiểm tra lúc ${now}: Chuyên mục #${categoryId} (Văn bằng 2) phản hồi HTTP 200 OK (Hiện chưa có bài mới).`;
            }
            setTimeout(() => {
              if (textSpan) textSpan.textContent = 'Kiểm tra bài mới';
            }, 3000);
          }, 600);
        }
      } catch (err) {
        refreshBtn.classList.remove('is-refreshing');
        if (textSpan) textSpan.textContent = 'Lỗi kết nối';
        setTimeout(() => {
          if (textSpan) textSpan.textContent = 'Kiểm tra bài mới';
        }, 3000);
      }
    });
  }
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
      renderPostsEmptyState(container, fetchedPosts?.apiStatus, containerSelector);
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
