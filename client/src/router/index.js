// src/router/index.js 更新版本
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth.js";

const routes = [
  { path: "/", redirect: "/dashboard" },
  { path: "/empty", component: () => import("../views/Empty.vue") },
  { path: "/env", component: () => import("../views/Env.vue") },
  { path: "/login", component: () => import("../views/Login.vue") },
  { path: "/contact", component: () => import("../views/Contact.vue") },
  {
    path: "/dashboard",
    component: () => import("../views/Dashboard.vue"),
    meta: { requiresAuth: true },
  },
  { path: "/logout", component: () => import("../views/Logout.vue") },
  {
    path: "/registration",
    component: () => import("../views/Registration.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/print-registration",
    component: () => import("../views/PrintRegistration.vue"),
    meta: { requiresAuth: false },
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
    path: "/test",
    name: "/test",
    component: () => import("../views/TestPage.vue"),
    meta: {
      title: "測試頁面",
      requiresAuth: false,
    },
  },
  {
    path: "/mocklogin",
    component: () => import("../views/MockLogin.vue"),
    meta: {
      requiresAuth: false,
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
  {
    path: "/registration-list",
    name: "RegistrationList",
    component: () => import("../views/RegistrationList.vue"),
    meta: {
      requiresAuth: true,
    },
  },

  {
    path: "/hash",
    name: "Hash",
    component: () => import("../views/generatorHash.vue"),
    meta: {
      requiresAuth: true,
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 全局導航路由守衛
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  // 明確檢查 matched records 中是否有 requiresAuth === true
  const requiresAuth = to.matched.some(
    (record) => record.meta && record.meta.requiresAuth === true
  );

  console.log("路由守衛:", {
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
      console.log("router 從本地存儲恢復用戶會話:", authStore.user.displayName);
    } catch (error) {
      console.error("index router 解析保存的用戶數據失敗:", error);
      authStore.logout();
    }
  }

  // 如果需要驗證且未登入
  if (requiresAuth && !authStore.isAuthenticated) {
    console.log("router 需要驗證但未登入，跳轉到登入頁");
    next("/login");
  } else {
    next();
  }
});

export default router;
