<template>
  <div class="app-container">
    <header v-if="showHeader">
      <div class="header-content">
        <div class="logo">
          <div class="logo-icon">🛕</div>
          <h1>{{ appTitle }}</h1>
          <div class="user-info" v-if="showUserInfo">
            <span>管理员</span><span>你好</span>🙏
          </div>
        </div>
        <!-- 顶部导航栏 -->
        <nav>
          <ul>
            <li><router-link to="/logout" v-if="showLogoutLink">退出登录</router-link></li>
          </ul>
        </nav>
      </div>
    </header>
    
    <!-- 主要内容区 -->
    <div class="dashboard-container">
      <div class="dashboard-content">
        
        <!-- 侧边菜单栏 -->
        <aside v-if="showSidebar" :class="['sidebar', { 'sidebar-left': menuPosition === 'left', 'sidebar-right': menuPosition === 'right' }]">
          <div class="menu-toggle" style="display: none;">
            <label>菜单位置：</label>
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
                  @click="handleMenuClick(menuItem)">
                  <span class="nav-icon">{{ menuItem.icon }}</span>
                  <span class="nav-text">{{ menuItem.name }}</span>
                  <!-- <span v-if="isMenuActive(menuItem)" class="nav-icon">👌</span> -->
                </router-link>
              </li>
            </ul>
          </nav>
        </aside>

        <main>
          <router-view></router-view>
        </main>
      </div>
    </div>
    
    <footer v-if="showFooter">
      <p>© 2025 {{ appTitle }} | 弘扬佛法，服务众生</p>
    </footer>
  </div>
</template>

<script>
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useMenuStore } from './stores/menu'
import { ref, computed, onMounted, watch, provide } from 'vue'
import appConfig from './config/appConfig'

export default {
  name: 'App',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const authStore = useAuthStore()
    const menuStore = useMenuStore()
    
    const menuPosition = ref(localStorage.getItem('menuPosition') || 'left')

    // 计算属性
    const isPrintRoute = computed(() => route.path && route.path.includes('print'))

    const showHeader = computed(() => {
      return !isPrintRoute.value 
    })

    const showSidebar = computed(() => {
      return !isPrintRoute.value && route.path !== '/login' && route.path !== '/logout'
    })

    const showFooter = computed(() => {
      //return route.path !== '/dashboard'
      return !isPrintRoute.value
    })

    const showUserInfo = computed(() => {
      return !isPrintRoute.value && route.path !== '/login'
    })

    const showDashboardLink = computed(() => {
      return route.path !== '/login'
    })

    const showLogoutLink = computed(() => {
      return !isPrintRoute.value && route.path !== '/login'
    })

    const availableMenuItems = computed(() => {
      //alert(typeof(menuStore.availableMenuItems))
      return menuStore.availableMenuItems
    })

    // 方法
    const isMenuActive = (menuItem) => {
      return menuStore.activeMenuId === menuItem.id
    }

    const handleMenuClick = (menuItem) => {
      menuStore.navigateToMenu(menuItem)
    }

    // 监听路由变化，更新激活菜单
    watch(() => route.path, (newPath) => {
      menuStore.setActiveMenuByPath(newPath)
    })

    // 當 menuPosition 改變時，同步到 localStorage
    watch(menuPosition, (val) => {
      try {
        localStorage.setItem('menuPosition', val)
      } catch (e) {
        // ignore quota errors
      }
    })

    onMounted(() => {
      // 初始化菜单
      menuStore.initializeActiveMenu()
      
      // 檢查用戶是否已登入
      // if (!authStore.isAuthenticated && route.path !== '/login') {
      //   router.push('/login')
      // }

    })

    return {
      menuPosition,
      showSidebar,
      showHeader,
      showFooter,
      showUserInfo,
      showDashboardLink,
      showLogoutLink,
      availableMenuItems,
      isMenuActive,
      handleMenuClick,
      appTitle: appConfig.title,
    }
  }
}
</script>

<style>

/* 全局样式 */
.dashboard-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.dashboard-header {
  background: linear-gradient(to right, var(--primary-color), var(--secondary-color));
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header-left .logo {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo-icon {
  font-size: 2rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.dashboard-content {
  display: flex;
  min-height: calc(100vh - 80px);
}

/* 侧边栏样式 - 修正部分 */
.sidebar {
  width: 230px;
  background: white;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
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

/* 修正侧边导航样式 */
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

.nav-link:hover, .nav-link.active {
  background-color: var(--light-color);
  color: var(--primary-color);
  transform: translateX(5px);
}

.nav-icon {
  font-size: 1.2rem;
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

/* 主内容区域 */
.main-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  background-color: #f8f9fa;
}


/* 响应式设计 */
@media (max-width: 768px) {
  .dashboard-content {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    order: 1;
    max-height: 300px;
  }
  
  .main-content {
    order: 0;
    padding: 1rem;
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
  
  .nav-link:hover, .nav-link.active {
    transform: translateY(2px);
  }
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

/* 保持原有的样式不变，只添加active状态的样式增强 */
.nav-link.active {
  background-color: var(--light-color) !important;
  color: var(--primary-color) !important;
  font-weight: 600;
  border-left: 3px solid var(--primary-color);
}

.nav-link.active .nav-icon {
  transform: scale(1.1);
}

/* 平滑过渡效果 */
.nav-link {
  transition: all 0.3s ease;
}

/* 其他原有样式保持不变 */
</style>