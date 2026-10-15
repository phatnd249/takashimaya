# Chuyện Tụi Mình — Landing Page Văn Bằng 2 Truyền Thông LHU

Trang đích (Landing Page) giới thiệu chương trình Văn bằng 2 Truyền thông Đa phương tiện tại Đại học Lạc Hồng (LHU) dưới góc nhìn trải nghiệm thực tế từ sinh viên năm 3.

---

## 1. Yêu cầu Môi trường & Công nghệ
- **Node.js:** Phiên bản LTS `>= 20.0.0` (đã kiểm thử và chạy ổn định trên `v22.15.1 LTS`).
- **Nền tảng:** Vite (Template Vanilla ES Modules) + HTML5 Semantic + Vanilla CSS3 (CSS Custom Properties).
- **Không sử dụng:** React, Vue, TypeScript, Tailwind hay thư viện UI nặng.
- **Font chữ:** Google Fonts `Plus Jakarta Sans` với fallback hệ thống an toàn.

---

## 2. Hướng dẫn Cài đặt & Chạy Dự án

### Cài đặt dependencies:
```bash
npm install
```

### Chạy môi trường phát triển (Dev server):
```bash
npm run dev
```
Trang web sẽ chạy tại: `http://localhost:5173/`

### Build phiên bản Production:
```bash
npm run build
```
Thư mục xuất bản tĩnh sẽ nằm trong `dist/`.

### Xem trước bản build tĩnh (Preview):
```bash
npm run preview
```

---

## 3. Cấu trúc Thư mục

```
/
├── index.html                  # Mã nguồn HTML semantic hoàn chỉnh
├── vite.config.js              # Cấu hình Vite tương thích GitHub Pages
├── package.json                # Khai báo scripts và Node LTS engines
├── .env.example                # Mẫu biến môi trường
├── .gitignore                  # Bỏ qua node_modules, dist, .env
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions tự động deploy lên GitHub Pages
├── public/
│   ├── favicon.svg             # Favicon định dạng SVG chất lượng cao
│   ├── robots.txt              # Khai báo cấu hình bot tìm kiếm
│   ├── sitemap.xml             # Khai báo sitemap SEO
│   ├── 404.html                # Trang thông báo 404 tùy biến
│   └── og-image.svg            # Ảnh đại diện chia sẻ mạng xã hội (Open Graph)
├── src/
│   ├── styles/
│   │   ├── tokens.css          # Design tokens (màu sắc, spacing, bóng đổ, bo góc)
│   │   ├── base.css            # Reset, typography, placeholder, container
│   │   ├── components.css      # Nút bấm, thẻ card, skeleton loader, badge
│   │   └── sections/           # CSS module hóa riêng cho từng section
│   ├── scripts/
│   │   ├── main.js             # Điểm khởi chạy ứng dụng
│   │   ├── config.js           # Cấu hình API, chuyên mục WP, URL
│   │   ├── images.js           # Quản lý tập trung toàn bộ hình ảnh và placeholder
│   │   ├── posts.js            # Gọi WordPress REST API, làm sạch dữ liệu, marquee
│   │   ├── menu.js             # Menu di động (drawer)
│   │   ├── quick-nav.js        # Thanh điều hướng nhanh ("KHÁM PHÁ" 01 - 05)
│   │   ├── slider.js           # Slider thẻ Hero
│   │   └── accordion.js        # Accordion câu hỏi thường gặp (FAQ)
│   └── assets/
│       └── images/             # Thư mục lưu trữ ảnh thực tế khi bổ sung
└── docs/
    ├── PROJECT_NOTES.md        # Tài liệu phân tích thiết kế, CORS & kiến trúc
    └── ASSETS_TODO.md          # Bảng đối chiếu danh sách hình ảnh cần bổ sung
```

---

## 4. Cách Quản lý & Thay thế Dữ liệu

### 4.1. Thay đổi hình ảnh (Quy tắc Khung trước, ảnh sau)
- Khi có ảnh mới, bạn chỉ cần lưu file ảnh với đúng tên file quy định trong [docs/ASSETS_TODO.md](file:///d:/Projects/landing-page/Takashimaya/docs/ASSETS_TODO.md) vào thư mục `src/assets/images/`.
- File `src/scripts/images.js` sẽ tự động nhận diện ảnh thật và hiển thị thay thế các khối placeholder mà không cần chỉnh sửa bất kỳ cấu trúc HTML nào.

### 4.2. Cấu hình Section Bài viết từ WordPress API
Mọi cấu hình liên quan đến bài viết được tập trung tại `src/scripts/config.js` hoặc file `.env`:
- `VITE_WP_API_URL`: Mặc định `https://share4happy.com/wp-json/wp/v2/posts`.
- `VITE_WP_CATEGORY_ID`: Mặc định chuyên mục `208`.
- `VITE_WP_FALLBACK_CATEGORY`: Mặc định chuyên mục `207` (Ẩm thực Biên Hòa - hiện có sẵn 5 bài viết thật để hiển thị mượt mà khi chuyên mục 208 chưa có bài).

---

## 5. Hướng dẫn Triển khai GitHub Pages (GitHub Actions)

Dự án đã tích hợp sẵn workflow tại `.github/workflows/deploy.yml`.

1. **Đẩy mã nguồn lên GitHub:**
   ```bash
   git init
   git add .
   git commit -m "feat: complete production-ready landing page"
   git branch -M main
   git remote add origin https://github.com/TÊN_NGƯỜI_DÙNG/TÊN_REPO.git
   git push -u origin main
   ```
2. **Kích hoạt GitHub Pages:**
   - Truy cập vào Repository trên GitHub: **Settings** > **Pages**.
   - Tại mục **Build and deployment** > **Source**, chọn: **GitHub Actions**.
3. **Cấu hình đường dẫn base (nếu là repo phụ):**
   - File `vite.config.js` đã được thiết lập `base: process.env.VITE_BASE_PATH || './'`, cho phép các asset đường dẫn tương đối hoạt động hoàn hảo ngay lập tức trên cả tên miền gốc (`username.github.io`) hoặc tên miền phụ (`username.github.io/ten-repo/`).
4. **Bật Enforce HTTPS:**
   - Trong trang **Settings** > **Pages**, tích chọn **Enforce HTTPS**.
5. **Kiểm tra trạng thái:**
   - Vào tab **Actions** trên GitHub để theo dõi workflow `Deploy to GitHub Pages`. Khi có dấu tích xanh, website đã xuất bản trực tiếp.
