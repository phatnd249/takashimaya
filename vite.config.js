import { defineConfig } from 'vite';

export default defineConfig({
  // Sử dụng './' để đường dẫn tương đối hoạt động trơn tru trên mọi cấu hình GitHub Pages
  // Hoặc ghi đè bằng biến môi trường VITE_BASE_PATH nếu cần đường dẫn tuyệt đối
  base: process.env.VITE_BASE_PATH || '/Takashimaya/',
  server: {
    port: 5173,
    open: false
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
});
