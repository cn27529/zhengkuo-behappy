import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
//import { path } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
  },
  build: {
    sourcemap: true, // 确保生成 sourcemap
    rollupOptions: {
      output: {
        manualChunks: {
          "element-plus": ["element-plus"], // 單獨打包 Element Plus
        },
      },
    },
  },
});
