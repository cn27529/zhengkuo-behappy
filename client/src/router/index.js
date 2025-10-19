// src/router/index.js 更新版本
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";

const routes = [
  { path: "/", redirect: "/dashboard" },
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
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由守卫
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

  // 改為localStorage檢查設定isAuthenticated
  const savedUser = localStorage.getItem("auth-user");
  if (savedUser) {
    try {
      authStore.user = JSON.parse(savedUser);
      authStore.isAuthenticated = true;
      console.log(
        "index router 從本地存儲恢復用戶會話:",
        authStore.user.nickname
      );
    } catch (error) {
      console.error("index router 解析保存的用戶數據失敗:", error);
      authStore.logout();
    }
  }

  // 如果需要驗證且未登入
  if (requiresAuth && !authStore.isAuthenticated) {
    console.log("index router 需要驗證但未登入，跳轉到登入頁");
    next("/login");
  } else {
    next();
  }
});

export default router;
