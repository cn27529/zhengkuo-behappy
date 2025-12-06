<template>
  <div class="activities-page">
    <!-- 示例 1：簡單使用 -->
    <div class="activity-card">
      <h3>{{ activity.name }}</h3>
      <div class="participants">
        <span class="label">參與人數：</span>
        <AnimatedNumber
          :value="activity.participants"
          suffix=" 人"
          class="number-highlight"
        />
      </div>
    </div>

    <!-- 示例 2：自定義動畫時長和延遲 -->
    <div class="activity-card">
      <h3>{{ activity2.name }}</h3>
      <div class="participants">
        <span class="label">參與人數：</span>
        <AnimatedNumber
          :value="activity2.participants"
          :duration="3000"
          :delay="500"
          suffix=" 人"
          separator=","
          class="number-large"
        />
      </div>
    </div>

    <!-- 示例 3：在活動列表中使用 -->
    <div class="activities-list">
      <h2>所有活動</h2>
      <div
        v-for="(act, index) in activities"
        :key="act.id"
        class="activity-item"
      >
        <div class="activity-info">
          <span class="activity-icon">{{ act.icon }}</span>
          <span class="activity-name">{{ act.name }}</span>
        </div>
        <div class="activity-stats">
          <AnimatedNumber
            :value="act.participants"
            :duration="2000"
            :delay="index * 100"
            suffix=" 人"
            separator=","
            class="participants-count"
          />
        </div>
      </div>
    </div>

    <!-- 示例 4：統計總人數（大數字展示） -->
    <div class="total-stats">
      <h2>總參與人數</h2>
      <AnimatedNumber
        :value="totalParticipants"
        :duration="2500"
        separator=","
        class="total-number"
      />
      <span class="unit">人次</span>
    </div>

    <!-- 示例 5：手動控制動畫 -->
    <div class="manual-control">
      <h3>手動控制動畫</h3>
      <AnimatedNumber
        ref="manualNumber"
        :value="manualValue"
        :autoplay="false"
        suffix=" 人"
        class="manual-number"
      />
      <div class="controls">
        <button @click="startManualAnimation">開始動畫</button>
        <button @click="resetManualAnimation">重置</button>
        <button @click="manualValue += 50">+50</button>
      </div>
    </div>

    <!-- 示例 6：卡片式展示 -->
    <div class="stats-cards">
      <div class="stat-card upcoming">
        <div class="card-title">即將舉行</div>
        <AnimatedNumber
          :value="upcomingCount"
          :duration="1500"
          class="card-number"
        />
        <div class="card-label">場活動</div>
      </div>

      <div class="stat-card completed">
        <div class="card-title">已完成</div>
        <AnimatedNumber
          :value="completedCount"
          :duration="1500"
          :delay="200"
          class="card-number"
        />
        <div class="card-label">場活動</div>
      </div>

      <div class="stat-card total">
        <div class="card-title">累計參與</div>
        <AnimatedNumber
          :value="totalParticipants"
          :duration="2000"
          :delay="400"
          separator=","
          class="card-number"
        />
        <div class="card-label">人次</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useActivityStore } from "../stores/activityStore.js";
import AnimatedNumber from "../components/AnimatedNumber.vue";

// Store
const activitiesStore = useActivityStore();

// 單個活動示例
const activity = ref({
  name: "2025年春季法會",
  participants: 342,
});

const activity2 = ref({
  name: "2024年中元普度",
  participants: 1567,
});

// 手動控制示例
const manualNumber = ref(null);
const manualValue = ref(100);

const startManualAnimation = () => {
  manualNumber.value?.startAnimation();
};

const resetManualAnimation = () => {
  manualNumber.value?.reset();
};

// 活動列表
const activities = computed(() => activitiesStore.activities);

// 統計數據
const totalParticipants = computed(() => activitiesStore.totalParticipants);
const upcomingCount = computed(() => activitiesStore.upcomingActivities.length);
const completedCount = computed(
  () => activitiesStore.completedActivities.length
);

// 初始化
onMounted(async () => {
  await activitiesStore.initialize();
});
</script>

<style scoped>
.activities-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 活動卡片 */
.activity-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.activity-card h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.participants {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
}

.label {
  color: #666;
}

/* 數字樣式 */
.number-highlight {
  color: #8b4513;
  font-weight: bold;
  font-size: 24px;
}

.number-large {
  color: #d4380d;
  font-weight: bold;
  font-size: 32px;
}

/* 活動列表 */
.activities-list {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.activities-list h2 {
  margin: 0 0 20px 0;
  color: #333;
}

.activity-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.3s;
}

.activity-item:hover {
  background: #fafafa;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.activity-icon {
  font-size: 24px;
}

.activity-name {
  font-size: 16px;
  color: #333;
}

.participants-count {
  color: #8b4513;
  font-weight: bold;
  font-size: 20px;
}

/* 總統計 */
.total-stats {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 40px;
  margin-bottom: 20px;
  text-align: center;
  color: white;
}

.total-stats h2 {
  margin: 0 0 20px 0;
  font-size: 24px;
  font-weight: 300;
}

.total-number {
  font-size: 64px;
  font-weight: bold;
  color: white;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.unit {
  display: block;
  margin-top: 10px;
  font-size: 20px;
  opacity: 0.9;
}

/* 手動控制 */
.manual-control {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.manual-control h3 {
  margin: 0 0 15px 0;
}

.manual-number {
  color: #1890ff;
  font-weight: bold;
  font-size: 28px;
  display: block;
  margin: 20px 0;
}

.controls {
  display: flex;
  gap: 10px;
}

.controls button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background: #1890ff;
  color: white;
  cursor: pointer;
  transition: background 0.3s;
}

.controls button:hover {
  background: #40a9ff;
}

/* 統計卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 12px;
  padding: 30px;
  text-align: center;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-card.upcoming {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-card.completed {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-card.total {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.card-title {
  font-size: 16px;
  margin-bottom: 15px;
  opacity: 0.9;
  font-weight: 300;
}

.card-number {
  font-size: 48px;
  font-weight: bold;
  color: white;
  display: block;
  margin: 10px 0;
}

.card-label {
  font-size: 14px;
  margin-top: 10px;
  opacity: 0.9;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .total-number {
    font-size: 48px;
  }

  .card-number {
    font-size: 36px;
  }

  .stats-cards {
    grid-template-columns: 1fr;
  }
}
</style>
