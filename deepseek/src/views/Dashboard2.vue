<template>
  <div class="dashboard-container">
    <!-- 顶部导航栏 -->
    <div class="dashboard-header" style="display: none;">
      <div class="header-left">
        <div class="logo">
          <div class="logo-icon">🛕</div>
          <h1>寺庙活动管理系统</h1>
        </div>
      </div>
      <div class="header-right">
        <div class="user-info">
          <span>管理员</span>
          <div class="user-avatar">🙏</div>
        </div>
        <button class="btn btn-secondary" @click="logout">退出登录</button>
      </div>
    </div>

    <div class="dashboard-content">
      <!-- 侧边菜单栏 -->
      <aside :class="['sidebar', { 'sidebar-left': menuPosition === 'left', 'sidebar-right': menuPosition === 'right' }]">
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
              <a href="#" class="nav-link">
                <span class="nav-icon">📝</span>
                <span class="nav-text">活动报名</span>
              </a>
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
            <li>
              <router-link to="/contact" class="nav-link">
                <span class="nav-icon">📞</span>
                <span class="nav-text">联系我们</span>
              </router-link>
            </li>
          </ul>
        </nav>
      </aside>

      <!-- 主内容区域 -->
      <main class="main-content">
        <div class="page-header">
          <h2>活动统计仪表板</h2>
          <p>查看寺庙各项活动的报名情况和统计数据</p>
          <div class="total-participants">
            年度总参与人数: <strong>{{ totalParticipants }}</strong> 人
          </div>
        </div>

        <!-- 活动统计卡片 -->
        <div class="stats-grid">
          <div 
            v-for="activity in activities" 
            :key="activity.id" 
            class="stat-card"
          >
            <div class="stat-icon">{{ activity.icon }}</div>
            <div class="stat-info">
              <h3>{{ activity.name }}</h3>
              <div class="stat-number">{{ activity.participants }}</div>
              <div class="stat-label">报名人数</div>
              <div class="activity-date">{{ formatDate(activity.date) }}</div>
            </div>
          </div>
        </div>

        <!-- 年度法会数据图表 -->
        <div class="chart-container" style="display: none;">
          <div class="chart-header">
            <h3>年度法会数据统计</h3>
            <div class="chart-actions">
              <button class="btn btn-outline" @click="changeChartType('bar')">柱状图</button>
              <button class="btn btn-outline" @click="changeChartType('line')">折线图</button>
              <button class="btn btn-outline" @click="refreshData">刷新数据</button>
            </div>
          </div>
          <div class="chart-wrapper">
            <canvas ref="chartCanvas" width="800" height="400"></canvas>
          </div>
        </div>

        <!-- 活动状态统计 -->
        <div class="status-grid">
          <div class="status-card upcoming">
            <div class="status-icon">📅</div>
            <div class="status-info">
              <h3>即将举办</h3>
              <div class="status-count">{{ upcomingActivities.length }}</div>
              <div class="status-label">场活动</div>
            </div>
          </div>
          <div class="status-card completed">
            <div class="status-icon">✅</div>
            <div class="status-info">
              <h3>已完成</h3>
              <div class="status-count">{{ completedActivities.length }}</div>
              <div class="status-label">场活动</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useActivitiesStore } from '../stores/activities'

export default {
  name: 'Dashboard',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const activitiesStore = useActivitiesStore()
    
    const chartCanvas = ref(null)
    const menuPosition = ref('left')
    let chartInstance = null

    // 从store获取数据
    const activities = activitiesStore.activities
    const totalParticipants = activitiesStore.totalParticipants
    const upcomingActivities = activitiesStore.upcomingActivities
    const completedActivities = activitiesStore.completedActivities
    const chartData = activitiesStore.chartData

    const logout = () => {
      router.push('/logout')
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    const changeChartType = (type) => {
      if (chartInstance) {
        chartInstance.destroy()
      }
      renderChart(type)
    }

    const refreshData = async () => {
      try {
        await activitiesStore.fetchActivities()
        await activitiesStore.fetchMonthlyStats()
        
        // 重新渲染图表
        if (chartInstance) {
          chartInstance.destroy()
        }
        renderChart()
        
        console.log('数据刷新成功')
      } catch (error) {
        console.error('数据刷新失败:', error)
      }
    }

    const renderChart = (type = 'bar') => {
      const ctx = chartCanvas.value.getContext('2d')
      
      chartInstance = new Chart(ctx, {
        type: type,
        data: chartData.value,
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
            },
            title: {
              display: true,
              text: '2023年法会参与人数统计'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: '参与人数'
              }
            },
            x: {
              title: {
                display: true,
                text: '月份'
              }
            }
          }
        }
      })
    }

    onMounted(async () => {
      // 初始化数据
      try {
        await activitiesStore.fetchActivities()
        await activitiesStore.fetchMonthlyStats()
        
        // 动态导入Chart.js并渲染图表
        import('chart.js/auto').then(() => {
          renderChart()
        })
      } catch (error) {
        console.error('初始化数据失败:', error)
      }
    })
    
    onUnmounted(() => {
      if (chartInstance) {
        chartInstance.destroy()
      }
    })
    
    return {
      menuPosition,
      activities,
      totalParticipants,
      upcomingActivities,
      completedActivities,
      chartCanvas,
      logout,
      changeChartType,
      refreshData,
      formatDate
    }
  }
}
</script>

<style scoped>
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

.user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.dashboard-content {
  display: flex;
  min-height: calc(100vh - 80px);
}

/* 侧边栏样式 - 修正部分 */
.sidebar {
  width: 220px;
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

.page-header {
  margin-bottom: 2rem;
}

.page-header h2 {
  color: var(--primary-color);
  margin-bottom: 0.5rem;
  font-size: 1.8rem;
}

.page-header p {
  color: #666;
  font-size: 1rem;
}

/* 统计卡片网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-left: 4px solid var(--primary-color);
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 2.5rem;
  margin-right: 1rem;
  opacity: 0.8;
  flex-shrink: 0;
}

.stat-info {
  flex: 1;
}

.stat-info h3 {
  font-size: 1rem;
  color: #666;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: var(--primary-color);
  margin-bottom: 0.25rem;
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: #888;
}

/* 图表容器 */
.chart-container {
  background: white;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e9ecef;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.chart-header h3 {
  color: var(--primary-color);
  margin: 0;
  font-size: 1.3rem;
}

.chart-actions {
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #5a6268;
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--primary-color);
  color: var(--primary-color);
}

.btn-outline:hover {
  background: var(--primary-color);
  color: white;
}

.chart-wrapper {
  position: relative;
  height: 400px;
  padding: 1rem;
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

.total-participants {
  background: var(--light-color);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  display: inline-block;
  margin-top: 0.5rem;
  color: var(--primary-color);
  font-weight: 500;
}

.activity-date {
  font-size: 0.75rem;
  color: #888;
  margin-top: 0.25rem;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.status-card {
  background: white;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  transition: transform 0.3s ease;
}

.status-card:hover {
  transform: translateY(-3px);
}

.status-card.upcoming {
  border-left: 4px solid #ffa726;
}

.status-card.completed {
  border-left: 4px solid #66bb6a;
}

.status-icon {
  font-size: 2rem;
  margin-right: 1rem;
  opacity: 0.8;
}

.status-info h3 {
  font-size: 1rem;
  color: #666;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.status-count {
  font-size: 1.8rem;
  font-weight: bold;
  color: var(--primary-color);
  margin-bottom: 0.25rem;
}

.status-label {
  font-size: 0.875rem;
  color: #888;
}
</style>