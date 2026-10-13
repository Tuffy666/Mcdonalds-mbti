import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // 允许从 src/ 之外的 engine/ 目录导入共享引擎
  server: { fs: { allow: ['..'] } },
  build: {
    outDir: 'dist',
    target: 'es2019',
    rollupOptions: {
      output: {
        manualChunks: {
          // 图鉴页的 16 张插画与主流程分离，避免首屏加载全部资源（§17.4）
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});
