import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
// import analyze from "rollup-plugin-analyzer";
import { visualizer } from "rollup-plugin-visualizer";
// import viteCompression from 'vite-plugin-compression';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    // mode === "analyze" && viteCompression(),
    // mode === "analyze" &&
    //   analyze({
    //     summaryOnly: true, // 只顯示總結
    //     //limit: 10, // 顯示前 10 個最大的模塊
    //     hideSmallModules: true, // 隱藏小模塊
    //   }),
    mode === "analyze" &&
      visualizer({
        open: true, // 打包完成自動打開瀏覽器
        filename: "stats.html", // 分析文件輸出名稱
        gzipSize: true, // 顯示 gzip 大小
        brotliSize: true, // 顯示 brotli 大小
        template: "treemap", // 圖表類型: treemap, sunburst, network
      }),
  ],
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
}));
