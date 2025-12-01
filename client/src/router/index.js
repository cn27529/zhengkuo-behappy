// src/router/index.js 更新版本
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/authStore.js";
import { usePageStateStore } from "../stores/pageStateStore.js";

const routes = [
  { path: "/", redirect: "/dashboard" },
  { path: "/newtab", component: () => import("../views/NewTab.vue") },
  { path: "/dialog", component: () => import("../views/ElDialog.vue") },
  { path: "/empty", component: () => import("../views/Empty.vue") },
  { path: "/env", component: () => import("../views/Env.vue") },
  { path: "/hash", component: () => import("../views/generatorHash.vue") },
  { path: "/login", component: () => import("../views/Login.vue") },
  { path: "/contact", component: () => import("../views/Contact.vue") },
  { path: "/mock", component: () => import("../views/MockLogin.vue") },
  {
    path: "/dashboard",
    component: () => import("../views/Dashboard.vue"),
    meta: { requiresAuth: true },
  },
  { path: "/logout", component: () => import("../views/Logout.vue") },
  {
    path: "/registration-list",
    name: "RegistrationList",
    component: () => import("../views/RegistrationList.vue"),
    // 🛡️ RegistrationList.vue路由進入前的驗證
    beforeEnter: (to, from, next) => {
      console.log("🚪 進入 RegistrationList 路由，清除頁面狀態");
      const pageStateStore = usePageStateStore();
      pageStateStore.clearPageState("registration");
      console.log("🚪 清除頁面狀態完成");
      next();
    },
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/registration",
    name: "Registration",
    component: () => import("../views/Registration.vue"),
    // 🛡️ Registration.vue路由進入前的驗證
    beforeEnter: (to, from, next) => {
      console.log("🚪 進入 Registration 路由，獲取頁面狀態");
      const pageStateStore = usePageStateStore();
      const pageState = pageStateStore.getPageState("registration");
      if (pageState) {
        console.log("🚪 頁面狀態數據調適:", pageState);
      }

      const { action, formId, id } = to.query;

      console.log("🚪 進入 Registration 路由:", { action, formId, id });

      // 情況1: 沒有任何參數,默認為 create
      if (!action && !formId && !id) {
        console.log("✨ 無參數,設置為 create 模式");
        next({
          path: "/registration",
          query: { action: "create" },
          replace: true,
        });
        return;
      }

      // 情況2: action 不合法
      const validActions = ["create", "edit"];
      if (action && !validActions.includes(action)) {
        console.log("⚠️ 不合法的 action:", action);
        next({
          path: "/registration",
          query: { action: "create" },
          replace: true,
        });
        return;
      }

      // 情況3: edit/view 模式但缺少必要參數
      if (action === "edit" && (!formId || !id)) {
        console.log("⚠️ edit/view 模式缺少必要參數");
        ElMessage.error("缺少必要的表單資訊");
        next({ path: "/registration-list", replace: true });
        return;
      }

      // 情況4: create 模式有多餘參數,清理掉
      if (action === "create" && (formId || id)) {
        console.log("🧹 清理 create 模式的多餘參數");
        next({
          path: "/registration",
          query: { action: "create" },
          replace: true,
        });
        return;
      }

      // 通過驗證,繼續
      next();
    },
    meta: { requiresAuth: true },
  },
  {
    path: "/print-registration",
    component: () => import("../views/PrintRegistration.vue"),
    meta: { requiresAuth: true },
  },
  // 为未来功能预留路由
  {
    path: "/receipts",
    component: () => import("../views/Placeholder.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/receipts-query",
    component: () => import("../views/Placeholder.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/data-import",
    component: () => import("../views/Placeholder.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/taisui",
    component: () => import("../views/TaiSui.vue"),
    props: (route) => ({
      // 設定預設年份為當前年份，如果 URL 有參數則使用 URL 參數
      year: route.query.year || new Date().getFullYear(),
    }),
    meta: { requiresAuth: true },
  },
  {
    path: "/testpage",
    name: "/testpage",
    component: () => import("../views/TestPage.vue"),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/mydata",
    name: "MydataList",
    component: () => import("../views/MydataList.vue"),
    meta: {
      requiresAuth: true,
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// ========================================
// 🛡️ 全局路由守衛(可選)
// ========================================

// 記錄路由歷史,用於更好的錯誤處理
let routeHistory = [];

// 全局導航路由守衛
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  // 明確檢查 matched records 中是否有 requiresAuth === true
  const requiresAuth = to.matched.some(
    (record) => record.meta && record.meta.requiresAuth === true
  );

  console.log("路由守衛(目前檢查的路由):", {
    to: to.path,
    requiresAuth,
    matched: to.matched.map((r) => ({ path: r.path, meta: r.meta })),
    isAuthenticated: authStore.isAuthenticated,
  });

  //sessionStorage（關閉瀏覽器就登出）
  const savedUser = sessionStorage.getItem("auth-user");

  if (savedUser) {
    try {
      authStore.user = JSON.parse(savedUser);
      authStore.isAuthenticated = true;
      console.log("從本地存儲恢復用戶會話:", authStore.user.displayName);
    } catch (error) {
      console.error("解析保存的用戶數據失敗:", error);
      authStore.logout();
    }
  }

  // 記錄路由歷史(最多保留10條)
  routeHistory.push(from.fullPath);
  if (routeHistory.length > 10) {
    routeHistory.shift();
  }

  // 如果需要驗證且未登入
  if (requiresAuth && !authStore.isAuthenticated) {
    console.log("需要驗證但未登入，跳轉到登入頁");
    next("/login");
  } else {
    next();
  }
});

// 路由錯誤處理
router.onError((error) => {
  console.error("❌ 路由錯誤:", error);

  // 🛡️ 如果發生錯誤,嘗試回到安全的頁面
  if (
    error.message.includes("Failed to fetch") ||
    error.message.includes("Loading chunk")
  ) {
    ElMessage.error("頁面載入失敗,請重新整理");
  }
});

export default router;
