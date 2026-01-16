import { defineConfig } from 'vite';

export default defineConfig({
  base: '/src/sonnetaw/', // 部署到 ShioLilia.github.io/src/sonnetaw/
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      // 排除字典文件，不打包到构建产物中
      external: [],
      output: {
        // 优化代码分割
        manualChunks: undefined
      }
    }
  }
});
