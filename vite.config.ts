import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// vite.config.ts 由 tsconfig.node.json 编译且未引入 @types/node，
// 这里只声明用到的 process.env，避免为一行配置新增依赖。
declare const process: { env: Record<string, string | undefined> };

export default defineConfig({
  plugins: [react()],
  // 部署到子路径（如 GitHub Pages 的 /Mcdonalds-mbti/）时由 VITE_BASE 注入；
  // 本地开发与 Vercel / Netlify 的根路径部署保持默认 '/'
  base: process.env.VITE_BASE || '/',
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
