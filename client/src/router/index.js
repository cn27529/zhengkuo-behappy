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
  { path: "/hash-code", component: () => import("../views/HashCode.vue") },
  { path: "/login", component: () => import("../views/Login.vue") },
  { path: "/logout", component: () => import("../views/Logout.vue") },
  { path: "/contact", component: () => import("../views/Contact.vue") },
  { path: "/mock", component: () => import("../views/MockLogin.vue") },
  { path: "/card-design", component: () => import("../views/CardDesign.vue") },
  { path: "/logs", component: () => import("../views/LogViewPage.vue") },
  {
    path: "/td-clock",
    component: () => import("../views/TianganDizhiClock12.vue"),
  },
  {
    path: "/join-record",
    title: "活動參加",
    component: () => import("../views/JoinRecord.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/join-record-list",
    title: "參加記錄查詢",
    name: "JoinRecordList",
    component: () => import("../views/JoinRecordList.vue"),
    beforeEnter: (to, from, next) => {
      console.log("🚪 進入 JoinRecordList 路由");
      const pageStateStore = usePageStateStore();
      pageStateStore.clearPageState("joinRecord");
      console.log("🚪 清除頁面狀態");
      next();
    },
    meta: { requiresAuth: true },
  },
  {
    path: "/join-record-print",
    title: "活動參加記錄列印",
    component: () => import("../views/JoinRecordPrint.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/states-control",
    title: "參加記錄狀態控制台",
    name: "JoinRecordStatesControl",
    component: () => import("../views/JoinRecordStatesControl.vue"),
    beforeEnter: (to, from, next) => {
      console.log("🚪 進入 JoinRecordStatesControl 路由");
      const pageStateStore = usePageStateStore();
      pageStateStore.clearPageState("joinRecordStates");
      console.log("🚪 清除頁面狀態");
      next();
    },
    meta: { requiresAuth: true },
  },
  {
    path: "/animated-number",
    component: () => import("../views/AnimatedNumber.vue"),
  },
  {
    path: "/monthly-donate",
    title: "每月贊助",
    component: () => import("../views/MonthlyDonate.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/dashboard",
    title: "儀表板",
    component: () => import("../views/Dashboard2.vue"),
    meta: { requiresAuth: true },
  },

  {
    path: "/activity-list",
    title: "活動管理",
    name: "ActivityList",
    component: () => import("../views/ActivityList.vue"),
    beforeEnter: (to, from, next) => {
      console.log("🚪 進入 ActivityList 路由");
      const pageStateStore = usePageStateStore();
      pageStateStore.clearPageState("activity");
      console.log("🚪 清除頁面狀態");
      next();
    },
    meta: { requiresAuth: true },
  },
  {
    path: "/registration-list",
    title: "登記查詢",
    name: "RegistrationList",
    component: () => import("../views/RegistrationList.vue"),
    // 🛡️ RegistrationList.vue路由進入前的驗證
    beforeEnter: (to, from, next) => {
      console.log("🚪 進入 RegistrationList 路由");
      const pageStateStore = usePageStateStore();
      pageStateStore.clearPageState("registration");
      console.log("🚪 清除頁面狀態");
      next();
    },
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/registration",
    title: "祈福登記",
    name: "Registration",
    component: () => import("../views/Registration.vue"),
    // 🛡️ Registration.vue路由進入前的驗證
    beforeEnter: (to, from, next) => {
      // const { action, formId, id } = to.query;
      // console.log("🚪 進入 Registration 路由:", { action, formId, id });
      console.log("🚪 進入 Registration 路由");
      const pageStateStore = usePageStateStore();
      pageStateStore.clearPageState("registration");
      console.log("🚪 重建頁面狀態");
      const pageState = new Promise(async () => {
        await pageStateStore.setPageState("registration", {
          action: "create",
          formId: "",
          id: -1,
          source: "routes",
        });
      });
      console.log("🚪 頁面狀態重建完成");

      // // 情況1: 沒有任何參數,默認為 create
      // if (!action && !formId && !id) {
      //   console.log("✨ 無參數,設置為 create 模式");
      //   next({
      //     path: "/registration",
      //     //query: { action: "create" },
      //     replace: true,
      //   });
      //   return;
      // }

      // // 情況2: action 不合法
      // const validActions = ["create", "edit"];
      // if (action && !validActions.includes(action)) {
      //   console.log("⚠️ 不合法的 action:", action);
      //   next({
      //     path: "/registration",
      //     //query: { action: "create" },
      //     replace: true,
      //   });
      //   return;
      // }

      // // 情況3: edit/view 模式但缺少必要參數
      // if (action === "edit" && (!formId || !id)) {
      //   console.log("⚠️ edit 模式缺少必要參數");
      //   ElMessage.error("缺少必要的表單資訊");
      //   next({ path: "/registration-list", replace: true });
      //   return;
      // }

      // // 情況4: create 模式有多餘參數,清理掉
      // if (action === "create" && (formId || id)) {
      //   console.log("🧹 清理 create 模式的多餘參數");
      //   next({
      //     path: "/registration",
      //     //query: { action: "create" },
      //     replace: true,
      //   });
      //   return;
      // }

      // 通過驗證,繼續
      next();
    },
    meta: { requiresAuth: true },
  },
  {
    path: "/registration-edit",
    title: "祈福登記編輯",
    name: "RegistrationEdit",
    component: () => import("../views/RegistrationEdit.vue"),
    // 🛡️ RegistrationEdit.vue路由進入前的驗證
    beforeEnter: (to, from, next) => {
      const pageStateStore = usePageStateStore();
      const pageState = pageStateStore.getPageState("registration");
      if (pageState.action === "create") {
        console.log(
          "🚪 進入 RegistrationEdit 路由，頁面狀態是action=create，所以狀態與頁面不匹配，重新導航",
        );
        next({
          path: "/registration-list",
          replace: true,
        });
        return;
      }

      next();
    },
    meta: { requiresAuth: true },
  },
  {
    path: "/registration-print",
    title: "祈福登記列印",
    component: () => import("../views/RegistrationPrint.vue"),
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
    path: "/dotlamp",
    title: "太歲點燈",
    name: "TaiSuiDotLamp",
    component: () => import("../views/TaisuiDotLamp.vue"),
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
    (record) => record.meta && record.meta.requiresAuth === true,
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
