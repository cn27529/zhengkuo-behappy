<template>
  <!-- 主内容区域 -->
  <main class="main-content">
    <div class="page-header">
      <h2>登記儀表板</h2>
      <p style="display: none">查看登記情况和统计数据</p>
      <div class="total-participants">
        年度总参与人数: <strong>{{ totalParticipants }}</strong> 人
      </div>
    </div>

    <!-- 活动统计卡片 -->
    <div class="stats-grid">
      <div v-for="activity in activities" :key="activity.id" class="stat-card">
        <div class="stat-icon">{{ activity.icon }}</div>
        <div class="stat-info">
          <h3>{{ activity.name }}</h3>
          <div class="stat-number">{{ activity.participants }}</div>
          <div class="stat-label">报名人数</div>
          <div class="activity-date">{{ formatDate(activity.date) }}</div>
        </div>
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
</template>

<script>
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/authStore.js";
import { useActivitiesStore } from "../stores/activities.js";

export default {
  name: "Dashboard",
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();
    const activitiesStore = useActivitiesStore();

    // 从store获取数据
    const activities = activitiesStore.activities;
    const totalParticipants = activitiesStore.totalParticipants;
    const upcomingActivities = activitiesStore.upcomingActivities;
    const completedActivities = activitiesStore.completedActivities;

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString("zh-TW", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    onMounted(async () => {
      // 初始化数据
      try {
        await activitiesStore.fetchActivities();
      } catch (error) {
        console.error("初始化数据失败:", error);
      }
    });

    onUnmounted(() => {
      // 清理工作
    });

    return {
      activities,
      totalParticipants,
      upcomingActivities,
      completedActivities,
      formatDate,
    };
  },
};
</script>

<style scoped>
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

@media (max-width: 768px) {
  .stat-card {
    flex-direction: column;
    text-align: center;
  }

  .total-participants {
    display: none;
    text-align: center;
  }
}
</style>
