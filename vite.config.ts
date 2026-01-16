import { defineConfig } from 'vite';

export default defineConfig({
  base: '/ShioLilia.github.io/src/sonnetaw/', // 改为你的仓库名称，或者如果部署到根目录就用 '/'
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  }
});
