import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.TAURI_ENV ? '/' : '/src/sonnetaw/', // Tauri 使用根路径，Web 使用子路径
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      external: [],
      output: {
        manualChunks: undefined
      }
    }
  },
  // 确保开发服务器可以被 Tauri 访问
  server: {
    port: 5173,
    strictPort: true,
    host: '127.0.0.1'
  },
  // 在 Tauri 模式下复制数据文件
  publicDir: 'public'
});
