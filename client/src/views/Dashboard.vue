<template>
  <!-- 主内容区域 -->
  <main class="main-content">
    <div class="page-header">
      <h2>登記儀表板</h2>
      <p style="display: none">查看登記情况和统计数据</p>
      <div style="" class="total-participants">
        總參與人次&nbsp;
        <AnimatedNumber
          :value="totalParticipants"
          :duration="2500"
          separator=""
          class=""
        />
      </div>
    </div>

    <!-- 活動狀態統計 -->
    <el-row :gutter="24" class="stats-grid">
      <el-col :xs="24" :sm="12" :md="12" :lg="12">
        <el-card shadow="hover" class="status-card upcoming">
          <div class="status-icon">⏳</div>
          <div class="status-info">
            <h3>即將到來</h3>
            <div class="status-count">{{ upcomingActivities.length }}</div>
            <div class="status-label">場活動</div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="12" :lg="12">
        <el-card shadow="hover" class="status-card completed">
          <div class="status-icon">✅</div>
          <div class="status-info">
            <h3>已完成</h3>
            <div class="status-count">{{ completedActivities.length }}</div>
            <div class="status-label">場活動</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 活動統計卡片 -->
    <el-row :gutter="24" class="stats-grid">
      <el-col
        v-for="activity in activities"
        :key="activity.id"
        :xs="24"
        :sm="12"
        :md="8"
        :lg="6"
        :xl="6"
      >
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon">{{ activity.icon }}</div>
          <div class="stat-info">
            <h3>{{ activity.name }}</h3>
            <div class="stat-number">{{ activity.participants }}</div>
            <div class="stat-label">報名人次</div>
            <div class="activity-date">{{ formatDate(activity.date) }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </main>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { useAuthStore } from "../stores/authStore.js";
import { useActivityStore } from "../stores/activityStore.js";
import AnimatedNumber from "../components/AnimatedNumber.vue";
import { DateUtils } from "../utils/dateUtils.js";

const router = useRouter();
const authStore = useAuthStore();
const activityStore = useActivityStore();

// 从store获取数据
const activities = computed(() => activityStore.activities);
const totalParticipants = computed(() => activityStore.totalParticipants);
const upcomingActivities = computed(() => activityStore.upcomingActivities);
const completedActivities = computed(() => activityStore.completedActivities);

const formatDate = (dateString) => {
  return DateUtils.formatDate(dateString);
};

onMounted(async () => {
  // 初始化数据
  try {
    await activityStore.initialize();
  } catch (error) {
    console.error("初始化数据失败:", error);
  }
});

onUnmounted(() => {
  // 清理工作
});
</script>

<style scoped>
.el-col {
  margin-bottom: 24px; /* 增加卡片之間的垂直間距 */
}

/* 统计卡片网格 */
.stats-grid {
  margin-bottom: 2rem;
}

.stat-card {
  border-radius: 10px;
  display: flex;
  align-items: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-left: 4px solid var(--primary-color);
  height: 100%;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}

.stat-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  padding: 1.5rem;
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
  border-radius: 10px;
  display: flex;
  align-items: center;
  transition: transform 0.3s ease;
  height: 100%;
}

.status-card:hover {
  transform: translateY(-3px);
}

.status-card.upcoming {
  border-left: 4px solid #ffa726;
}

.status-card.upcoming :deep(.el-card__body) {
  display: flex;
  align-items: center;
  padding: 1.5rem;
}

.status-card.completed {
  border-left: 4px solid #66bb6a;
}

.status-card.completed :deep(.el-card__body) {
  display: flex;
  align-items: center;
  padding: 1.5rem;
}

.status-card.all-participants {
  border-left: 4px solid #26afff;
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
