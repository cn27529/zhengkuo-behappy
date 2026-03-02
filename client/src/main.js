// src/main.js
import { createApp } from "vue";
import { createPinia } from "pinia";
import { authService } from "./services/authService.js";

import App from "./App.vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
// 導入中文語言包
import zhTW from "element-plus/dist/locale/zh-tw.mjs";
import "./style.css";

// 导入路由配置
import router from "./router";
// 引入 appConfig
import appConfig from "./config/appConfig.js";
import { useMenuStore } from "./stores/menu.js";
import { useRegistrationStore } from "./stores/registrationStore.js";
import { usePageStateStore } from "./stores/pageStateStore.js";

// 创建Pinia实例
const pinia = createPinia();

// 模式下的初始化
if (import.meta.env.VITE_AUTH_MODE === "mock") {
  console.warn("🚨 注意！");
  console.warn(
    "⚠️ 當前使用前端模擬認證，密碼為明碼儲存！正式環境請切換到後端模式並移除密碼硬編碼。",
  );
  //console.log("🔒 可用帳號：admin, zkuser01, temple_staff, volunteer, user01");
}

if (authService.getCurrentDev()) {
  console.warn(
    "🔧 調試信息已打開！使用 window.$authService.setMode() 來切換模式",
  );
}

// 切換 VITE_AUTH_MODE 認證模式
authService.setMode(import.meta.env.VITE_AUTH_MODE);
// 從 sessionStorage 讀取保存的模式
const savedMode = sessionStorage.getItem("auth-mode");
if (savedMode) {
  authService.setMode(savedMode);
}
console.log("當前認證模式:", authService.getCurrentMode());

// 切換 VITE_DEV 開發模式
authService.setDev(import.meta.env.VITE_DEV);
// 從 sessionStorage 讀取保存的開發模式
const savedDev = sessionStorage.getItem("auth-dev");
if (savedDev) {
  authService.setDev(savedDev);
}
console.log("當前開發模式:", authService.getCurrentDev());

// 在控制台暴露 authService 方便調試
window.$authService = authService;

// 创建Vue應用
const app = createApp(App);

// 使用路由和状态管理
app.use(router);
app.use(pinia);

// 使用Element Plus组件库
app.use(ElementPlus, {
  locale: zhTW, // 使用中文語言包
});

// 挂载應用
app.mount("#app");

// 在控制台暴露 regiStore
window.$regiStore = useRegistrationStore();
window.$pageState = usePageStateStore();

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
        (m) => m.path === to.path || (to.name && m.name === to.name),
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
