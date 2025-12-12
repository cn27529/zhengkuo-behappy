<template>
  <div class="app-container">
    <header v-if="layoutReady && showHeader">
      <div class="header-content">
        <div class="header-logo">
          <div class="logo-icon">🛕</div>
          <h1>{{ appTitle }}</h1>
          <div class="user-info" v-if="showUserInfo">
            <span>{{ userDisplayName }}</span
            >&nbsp;<span>🙏</span>
          </div>
        </div>
        <!-- 顶部导航栏 -->
        <nav>
          <ul>
            <li>
              <router-link to="/logout" v-if="showLogoutLink"
                >退出登录</router-link
              >
            </li>
          </ul>
        </nav>
      </div>
    </header>
    <!-- 父内容区 -->
    <div class="app-content">
      <!-- 側邊菜單栏 -->
      <aside
        v-if="layoutReady && showSidebar"
        :class="[
          'sidebar',
          {
            'sidebar-left': menuPosition === 'left',
            'sidebar-right': menuPosition === 'right',
          },
        ]"
      >
        <div class="menu-toggle" style="display: none">
          <label>菜單位置：</label>
          <select v-model="menuPosition" class="position-select">
            <option value="left">左侧</option>
            <option value="right">右侧</option>
          </select>
        </div>

        <nav class="sidebar-nav">
          <ul>
            <li v-for="menuItem in availableMenuItems" :key="menuItem.id">
              <router-link
                :to="menuItem.path"
                :class="['nav-link', { active: isMenuActive(menuItem) }]"
                @click="handleMenuClick(menuItem)"
              >
                <span class="nav-icon">{{ menuItem.icon }}</span>
                <span class="nav-text">{{ menuItem.name }}</span>
                <!-- <span v-if="isMenuActive(menuItem)" class="nav-icon">👌</span> -->
              </router-link>
            </li>
          </ul>
        </nav>
      </aside>
      <!-- 主要内容区 -->
      <main>
        <router-view></router-view>
      </main>
    </div>
    <!-- 底部-->
    <footer v-if="layoutReady && showFooter">
      <p>© 2025 {{ appTitle }} | 弘扬佛法、服务众生</p>
    </footer>
    <!-- <DevTools /> -->
  </div>
</template>

<script setup>
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "./stores/authStore.js";
import { useMenuStore } from "./stores/menu.js";
import { ref, computed, onMounted, watch, provide, nextTick } from "vue";
import appConfig from "./config/appConfig";
import DevTools from "./components/DevTools.vue";
import { usePageStateStore } from "./stores/pageStateStore.js";
import { ElMessage } from "element-plus";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const menuStore = useMenuStore();
const pageStateStore = usePageStateStore();

//const appTitle = ref(appConfig.title);
const appTitle = computed(() => appConfig.title);

const myPageState = computed(() =>
  pageStateStore.loadPageState("registration")
);

const menuPosition = ref(sessionStorage.getItem("menuPosition") || "left");

// 顶部导航栏显示控制：在非打印页面显示，將三個 UI 可見性預設為 false，等待子組件載入完成後再設定
const showHeader = ref(false);

// 側邊菜單栏显示控制：在非打印页面且非登录/登出页面显示
const showSidebar = ref(false);

// 底部显示控制：在非打印页面显示
const showFooter = ref(false);

// layoutReady: 在子組件完成渲染（nextTick）後才變 true，避免先顯示後隱藏的閃爍
const layoutReady = ref(false);

const userDisplayName = ref("");

// 計算是否為列印路由（供判斷用）
const isPrintRoute = computed(() => route.path && route.path.includes("print"));

// 依賴 showHeader 的顯示條件（確保在尚未載入時不會顯示）
const showUserInfo = computed(() => {
  return (
    showHeader.value &&
    !isPrintRoute.value &&
    route.path !== "/login" &&
    route.path !== "/logout"
  );
});

const showLogoutLink = computed(() => {
  return (
    showHeader.value &&
    !isPrintRoute.value &&
    route.path !== "/login" &&
    route.path !== "/logout"
  );
});

const availableMenuItems = computed(() => {
  return menuStore.availableMenuItems;
});

// 方法
const isMenuActive = (menuItem) => {
  return menuStore.activeMenuId === menuItem.id;
};

const handleMenuClick = (menuItem) => {
  menuStore.setActiveMenu(menuItem.id);
};

// 计算顶部导航栏、側邊菜單栏、底部的预期可见性（不直接改变 ref，供 updateLayoutVisibility 使用）
const computeVisibility = () => {
  const isPrint = route.path && route.path.includes("print");
  return {
    header: !isPrint, // 顶部导航栏：非打印页面显示
    sidebar: !isPrint && route.path !== "/login" && route.path !== "/logout", // 側邊菜單栏：非打印页面且非登录/登出页面显示
    footer: !isPrint, // 底部：非打印页面显示
  };
};

// 在 nextTick 后更新三个 UI 状态（确保子组件已完成 mounted / DOM 已更新）
// 根据路由条件控制顶部导航栏、側邊菜單栏、底部的显示/隐藏
const updateLayoutVisibility = async () => {
  await nextTick();
  const v = computeVisibility();
  showHeader.value = v.header; // 更新顶部导航栏显示状态
  showSidebar.value = v.sidebar; // 更新側邊菜單栏显示状态
  showFooter.value = v.footer; // 更新底部显示状态
  // 完成更新后标记 layout 已准备好，template 才会显示 header/sidebar/footer
  layoutReady.value = true;
};

// 監聽路由變化以更新 menu active
watch(
  () => route.path,
  (newPath) => {
    menuStore.setActiveMenuByPath(newPath);
  }
);

// 每次路由切換開始時，先把 layoutReady 關閉，避免中途顯示舊 layout
router.beforeEach((to, from, next) => {
  layoutReady.value = false;
  next();
});

// 當 menuPosition 改變時，同步到 sessionStorage
watch(menuPosition, (val) => {
  try {
    sessionStorage.setItem("menuPosition", val);
  } catch (e) {}
});

// 监听 authStore.user 的变化
watch(
  () => authStore.user,
  (newUser) => {
    userDisplayName.value = newUser ? newUser.displayName : "訪客";
  },
  { immediate: true }
);

// 在组件挂载前初始化认证状态
const initializeApp = async () => {
  // // 确保认证状态已恢复
  // if (sessionStorage.getItem("auth-user")) {
  //   authStore.initializeAuth();
  // }

  // // 检查当前路由是否需要重定向
  // if (route.meta.requiresAuth && !authStore.isAuthenticated) {
  //   await router.push("/login");
  //   return;
  // }

  // if (route.meta.requiresGuest && authStore.isAuthenticated) {
  //   await router.push("/");
  //   return;
  // }

  // 初始化菜單
  menuStore.initializeActiveMenu();
  // 更新布局可见性
  await updateLayoutVisibility();
};

onMounted(() => {
  initializeApp();
  // 初始化菜單
  menuStore.initializeActiveMenu();

  // 修改用户昵称的计算方式
  userDisplayName.value = authStore.user ? authStore.user.displayName : "訪客";

  // 初始載入時，在 nextTick 後設定 header/sidebar/footer
  updateLayoutVisibility();

  // 每次路由切換後，在 nextTick 後更新（確保 router-view 的子組件已渲染完成）
  router.afterEach(() => {
    updateLayoutVisibility();
  });
});

// 增加粘性标题时的样式
// window.addEventListener('scroll', function() {
//     var header = document.querySelector('.form-header');
//     if (window.pageYOffset > 0) {
//         header.classList.add('sticky');
//     } else {
//         header.classList.remove('sticky');
//     }
// });
</script>

<style>
.dashboard-header {
  background: linear-gradient(
    to right,
    var(--primary-color),
    var(--secondary-color)
  );
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header-left .header-logo {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.logo-icon {
  font-size: 2rem;
}

.app-content {
  display: flex;
  min-height: calc(100vh - 80px);
}

/* 側邊栏样式 - 修正部分 */
.sidebar {
  width: 230px;
  background: white;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  padding: 1.5rem 0 1.5rem 1rem;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.sidebar-left {
  order: 0;
}

.sidebar-right {
  order: 1;
}

.menu-toggle {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.position-select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-top: 0.5rem;
}

/* 修正側邊导航样式 */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
}

.sidebar-nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
}

.sidebar-nav li {
  margin-bottom: 0.5rem;
  width: 100%;
}

.nav-link {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  color: var(--dark-color);
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.3s ease;
  width: 100%;
  box-sizing: border-box;
}

.nav-icon {
  font-size: 1.3rem;
  margin-right: 0.75rem;
  width: 24px;
  text-align: center;
  flex-shrink: 0;
}

.nav-text {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.main-content::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.main-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.main-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 响應式設計 */
@media (max-width: 768px) {
}

/* 滚动条样式 */
.sidebar-nav::-webkit-scrollbar {
  width: 4px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.sidebar-nav::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.main-content::-webkit-scrollbar {
  width: 6px;
}

.nav-link:hover,
.nav-link.active {
  background-color: var(--light-color);
  color: var(--primary-color);
  transform: translateX(5px);
}

/* 保持原有的样式不变，只添加active状态的样式增强 */
.nav-link.active {
  background-color: var(--light-color) !important;
  color: var(--primary-color) !important;
  font-weight: 600;
  border-left: 3px solid var(--primary-color);
  /* background-image: linear-gradient(to right, var(--light-color), #f8f9fa); */
}

.nav-link.active .nav-icon {
  transform: scale(1.1);
}

/* 平滑过渡效果 */
.nav-link {
  transition: all 0.3s ease;
}

/* 胶囊样式按钮 */
.capsule-btn {
  border-radius: 50px !important;
  padding: 12px 30px;
  font-weight: 600;
  transition: all 0.3s ease;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .app-content {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    order: 1;
    max-height: 300px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .header-right {
    flex-direction: column;
    gap: 1rem;
  }

  .dashboard-header {
    padding: 1rem;
  }

  .dialog-content {
    flex-direction: column;
    text-align: center;
  }

  .warning-icon {
    align-self: center;
  }

  /* 自訂對話框樣式 */
  :deep(.custom-dialog .el-dialog__title) {
    color: white !important;
  }

  /* 移动端按钮样式调整 */
  .capsule-btn {
    padding: 14px 30px;
    font-size: 16px;
  }
}
</style>
