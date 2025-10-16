<template>
  <div class="app-container">
    <header>
      <div class="header-content">
        <div class="logo">
          <div class="logo-icon">🛕</div>
          <h1>寺庙活动报名系统</h1>
          <div class="user-info" v-if="$route.path !== '/login'">
            <span>管理员</span><span>你好</span>🙏
          </div>
        </div>
        <!-- 顶部导航栏 -->
        <nav>
          <ul>
            <!-- <li><router-link to="/login">登录</router-link></li> -->
            <!-- <li><router-link to="/contact">联系我们</router-link></li> -->
            <li><router-link to="/dashboard" v-if="$route.path !== '/login'">仪表板</router-link></li>
            <li><router-link to="/logout" v-if="$route.path !== '/login'">退出登录</router-link></li>
          </ul>
        </nav>
      </div>
    </header>
    <!-- 主要内容区 -->
    <div class="dashboard-container">
      <div class="dashboard-content">

        <!-- 侧边菜单栏 -->
      <aside v-if="$route.path !== '/login' && $route.path !== '/logout'" :class="['sidebar', { 'sidebar-left': menuPosition === 'left', 'sidebar-right': menuPosition === 'right' }]">
        <div class="menu-toggle" style="display: none;">
          <label>菜单位置：</label>
          <select v-model="menuPosition" class="position-select">
            <option value="left">左侧</option>
            <option value="right">右侧</option>
          </select>
        </div>
        
        <nav class="sidebar-nav">
          <ul>
            <li>
              <router-link to="/dashboard" class="nav-link active">
                <span class="nav-icon">📊</span>
                <span class="nav-text">仪表板</span>
              </router-link>
            </li>
            <li>
              <router-link to="/contact" class="nav-link">
                <span class="nav-icon">📝</span>
                <span class="nav-text">活动报名</span>
              </router-link>
            </li>
            <li>
              <a href="#" class="nav-link">
                <span class="nav-icon">🧾</span>
                <span class="nav-text">收据管理</span>
              </a>
            </li>
            <li>
              <a href="#" class="nav-link">
                <span class="nav-icon">🔍</span>
                <span class="nav-text">查询收据</span>
              </a>
            </li>
            <li>
              <a href="#" class="nav-link">
                <span class="nav-icon">📥</span>
                <span class="nav-text">数据导入</span>
              </a>
            </li>
            
          </ul>
        </nav>
      </aside>
        <main>
          <router-view></router-view>
        </main>
      </div>
    </div>
    
    
    <footer v-if="$route.path !== '/dashboard'">
      <p>© 2025 寺庙活动报名系统 | 弘扬佛法，服务众生</p>
    </footer>
  </div>
</template>

<script>

import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { ref, onMounted, watch } from 'vue'

export default {
  name: 'App',
  setup() {
    // 这里可以添加全局状态或方法
    const authStore = useAuthStore()
    const router = useRouter()
    const menuPosition = ref(localStorage.getItem('menuPosition') || 'left')

    // 當 menuPosition 改變時，同步到 localStorage
    watch(menuPosition, (val) => {
      try {
        localStorage.setItem('menuPosition', val)
      } catch (e) {
        // ignore quota errors
      }
    })

    const logout = () => {
      authStore.logout()
      alert('退出登录！在实际应用中，这里会跳转到登录页面。')
      router.push('/login')
    }

    onMounted(() => {
      // 檢查用戶是否已登入
      if (!authStore.isAuthenticated && router.currentRoute.value.path !== '/login') {
        router.push('/login')
      }
    })
    return {
      menuPosition,
      logout
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

</style>