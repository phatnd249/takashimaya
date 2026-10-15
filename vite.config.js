import { defineConfig } from 'vite';

export default defineConfig({
  // Sử dụng './' để đường dẫn tương đối hoạt động hoàn hảo trên cả domain riêng và GitHub Pages subpath
  base: process.env.VITE_BASE_PATH || './',
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
