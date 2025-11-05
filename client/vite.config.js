import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
  },
  // 配置别名
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // 设置 `@` 指向 `src` 目录
    },
  },
});
