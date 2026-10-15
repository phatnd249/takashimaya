/**
 * Centralized Image Asset Registry
 * Rule 7: "Khung trước, ảnh sau".
 * When images are added to src/assets/images/, they will automatically load here.
 */

// Vite glob import to detect existing images in src/assets/images/
const localImages = import.meta.glob('../assets/images/*.{png,jpg,jpeg,svg,webp}', { eager: true, as: 'url' });

export const IMAGES = {
  // Brand & Logos
  'lhu-logo': {
    file: 'lhu-logo.png',
    alt: 'Logo Đại học Lạc Hồng - Powered by Arizona State University',
    width: 240,
    height: 60,
    aspectRatio: '4 / 1',
    label: 'Logo Đại học Lạc Hồng'
  },
  
  // Hero Slider
  'hero-slide-1': {
    file: 'hero-slide-1.jpg',
    alt: 'Sân khấu Gala kết nối sinh viên Đại học Lạc Hồng',
    width: 800,
    height: 600,
    aspectRatio: '4 / 3',
    label: 'Ảnh tham khảo từ kênh LHU'
  },
  'hero-slide-2': {
    file: 'hero-slide-2.jpg',
    alt: 'Hoạt động trải nghiệm truyền thông thực tế',
    width: 800,
    height: 600,
    aspectRatio: '4 / 3',
    label: 'Góc nhìn sinh viên năm 3'
  },

  // Section 3: Stories
  'story-featured': {
    file: 'story-featured.jpg',
    alt: 'Hội trường đông đảo sinh viên LHU Media trong buổi làm dự án',
    width: 640,
    height: 480,
    aspectRatio: '4 / 3',
    label: 'Ảnh: LHU Media'
  },

  // Section 4: Experiences
  'exp-story-1': {
    file: 'exp-story-1.jpg',
    alt: 'Biến ý tưởng thành câu chuyện - Gala chào tân sinh viên',
    width: 400,
    height: 320,
    aspectRatio: '5 / 4',
    label: 'Ảnh LHU'
  },
  'exp-story-2': {
    file: 'exp-story-2.jpg',
    alt: 'Phối hợp để đi đến cùng - Chuyến tham quan thực tế',
    width: 400,
    height: 320,
    aspectRatio: '5 / 4',
    label: 'Ảnh LHU'
  },
  'exp-story-3': {
    file: 'exp-story-3.jpg',
    alt: 'Học từ phản hồi - Hoạt động ngoại khóa năng lượng',
    width: 400,
    height: 320,
    aspectRatio: '5 / 4',
    label: 'Ảnh LHU'
  },

  // Section 5: Gallery (Bento Grid)
  'gallery-k26': {
    file: 'gallery-k26.jpg',
    alt: 'Chào đón tân sinh viên K26 trước backdrop sự kiện',
    width: 320,
    height: 500,
    aspectRatio: '9 / 14',
    label: 'Chào K26'
  },
  'gallery-stage': {
    file: 'gallery-stage.jpg',
    alt: 'Cùng hòa nhịp - Gala chào đón tân sinh viên 2026',
    width: 320,
    height: 220,
    aspectRatio: '16 / 11',
    label: 'Cùng hòa nhịp'
  },
  'gallery-connect': {
    file: 'gallery-connect.jpg',
    alt: 'Gặp gỡ & kết nối - Cộng đồng LHU cùng nhau tạo kỷ niệm',
    width: 320,
    height: 220,
    aspectRatio: '16 / 11',
    label: 'Gặp gỡ & kết nối'
  },
  'gallery-arts': {
    file: 'gallery-arts.jpg',
    alt: 'Sắc màu văn nghệ - Tài năng sinh viên tỏa sáng',
    width: 320,
    height: 220,
    aspectRatio: '16 / 11',
    label: 'Sắc màu văn nghệ'
  },
  'gallery-tech': {
    file: 'gallery-tech.jpg',
    alt: 'Công nghệ & sáng tạo - Trải nghiệm công nghệ mới',
    width: 320,
    height: 220,
    aspectRatio: '16 / 11',
    label: 'Công nghệ & sáng tạo'
  },
  'gallery-fieldtrip': {
    file: 'gallery-fieldtrip.jpg',
    alt: 'Học từ trải nghiệm - Đi thực tế mở rộng góc nhìn',
    width: 660,
    height: 220,
    aspectRatio: '3 / 1',
    label: 'Học từ trải nghiệm'
  },
  'gallery-team': {
    file: 'gallery-team.jpg',
    alt: 'Đồng đội & năng lượng - Cùng chơi, cùng trưởng thành',
    width: 320,
    height: 220,
    aspectRatio: '16 / 11',
    label: 'Đồng đội & năng lượng'
  },
  'gallery-sports': {
    file: 'gallery-sports.jpg',
    alt: 'Thử sức ngoài giảng đường - Thể thao và câu lạc bộ',
    width: 320,
    height: 220,
    aspectRatio: '16 / 11',
    label: 'Thử sức ngoài giảng đường'
  },

  // Footer map
  'campus-map': {
    file: 'campus-map.jpg',
    alt: 'Bản đồ Cơ sở 1 Đại học Lạc Hồng',
    width: 500,
    height: 280,
    aspectRatio: '16 / 9',
    label: 'Cơ sở 1 — Trụ sở chính'
  }
};

/**
 * Returns image source if found in src/assets/images/, otherwise null
 */
export function getImageSrc(key) {
  const item = IMAGES[key];
  if (!item) return null;
  const matchKey = Object.keys(localImages).find(p => p.endsWith(item.file));
  return matchKey ? localImages[matchKey] : null;
}

/**
 * Render image or placeholder HTML
 */
export function renderImageOrPlaceholder(key, { isEager = false, customClass = '', dark = false } = {}) {
  const item = IMAGES[key];
  if (!item) return '';

  const realSrc = getImageSrc(key);
  const loadingAttr = isEager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"';

  if (realSrc) {
    return `<img 
      src="${realSrc}" 
      alt="${item.alt}" 
      width="${item.width}" 
      height="${item.height}" 
      style="aspect-ratio: ${item.aspectRatio}; object-fit: cover; width: 100%; height: 100%;" 
      class="${customClass}" 
      ${loadingAttr}
    />`;
  }

  // Placeholder mode
  return `
    <div 
      class="img-placeholder ${dark ? 'dark' : ''} ${customClass}" 
      style="aspect-ratio: ${item.aspectRatio};"
      role="img" 
      aria-label="${item.alt}"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
      <span>${item.label}</span>
    </div>
  `;
}
