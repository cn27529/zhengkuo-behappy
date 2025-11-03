// src/main.js
import { createApp } from "vue";
import { createPinia } from "pinia";
import { authService } from "./services/authService";

import App from "./App.vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import "./style.css";

// 导入路由配置
import router from "./router";
// 引入 appConfig
import appConfig from "./config/appConfig";
import { useMenuStore } from "./stores/menu";

// 引入 antd
import Antd from "ant-design-vue";
import "ant-design-vue/dist/reset.css"; // 方式一：reset 樣式（推薦）
//import 'ant-design-vue/dist/antd.css'; // 方式二：傳統樣式

// 创建Pinia实例
const pinia = createPinia();

// 開發模式下的初始化
if (import.meta.env.VITE_DEV) {
  // 從 sessionStorage 讀取保存的模式
  const savedMode = sessionStorage.getItem("dev-auth-mode");
  if (savedMode) {
    authService.setMode(savedMode);
  }

  // 在控制台暴露 authService 方便調試
  window.authService = authService;

  console.log("🔧 開發模式已啟用");
  console.log("當前認證模式:", authService.getCurrentMode());
  console.log("使用 window.authService.setMode() 來切換模式");
}

// 创建Vue应用
const app = createApp(App);

// 使用路由和状态管理
app.use(router);
app.use(pinia);
app.use(ElementPlus); // 使用Element Plus组件库

app.use(Antd); // 使用 Ant Design Vue 组件库

// 挂载应用
app.mount("#app");

// 設定初始 document.title（若存在設定）
if (appConfig && appConfig.title) {
  document.title = appConfig.title;
}

// 若使用 router，在每次路由變更後更新 title（若 route.meta.title 存在）
if (typeof router !== "undefined") {
  router.afterEach((to) => {
    // 先讀 route.meta.title
    const metaTitle = to.meta && to.meta.title ? to.meta.title : null;

    // 取 menu store（Pinia 已註冊）並尋找對應 menu
    let menuTitle = null;
    try {
      const menuStore = useMenuStore();
      const found = menuStore.availableMenuItems.find(
        (m) => m.path === to.path || (to.name && m.name === to.name)
      );
      if (found && found.name) menuTitle = found.name;
    } catch (e) {
      // 若無法取得 store，忽略
      // console.error('menu store not available in main.js', e)
    }

    const title = metaTitle || menuTitle || appConfig.title;
    if (title) document.title = title;
  });
}

// 导出app实例
export default app;
