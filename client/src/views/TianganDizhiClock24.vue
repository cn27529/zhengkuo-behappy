<template>
  <div class="tiangan-dizhi-clock-container">
    <div class="clock-wrapper">
      <svg
        :width="clockSize"
        :height="clockSize"
        viewBox="0 0 400 400"
        class="clock-svg"
      >
        <!-- 外圈：60甲子刻度 -->
        <circle
          cx="200"
          cy="200"
          :r="outerRadius"
          fill="none"
          stroke="#2c3e50"
          stroke-width="1"
          class="outer-circle"
        />

        <!-- 60甲子刻度線 -->
        <g v-for="(item, index) in jiazi60" :key="'jiazi-' + index">
          <path
            :d="getTickPath(outerRadius, index, 60, 6)"
            :class="[
              'tick',
              'tick-60',
              {
                'tick-second-highlight': isCurrentSecond(index),
                'tick-minute-highlight': isCurrentMinute(index),
              },
            ]"
          />

          <!-- 60甲子文字 outerRadius - 15（靠近刻度線 5 個單位）-->
          <text
            :x="getTextPosition(outerRadius - 15, index, 60).x"
            :y="getTextPosition(outerRadius - 15, index, 60).y"
            :class="[
              'tick-text',
              'tick-text-60',
              {
                'text-second-highlight': isCurrentSecond(index),
                'text-minute-highlight': isCurrentMinute(index),
              },
            ]"
            text-anchor="middle"
            dominant-baseline="middle"
          >
            {{ item }}
          </text>
        </g>

        <!-- 中圈：地支刻度 - 24小時 -->
        <circle
          cx="200"
          cy="200"
          :r="middleRadius"
          fill="none"
          stroke="#1a252f"
          stroke-width="1.5"
          class="middle-circle"
        />

        <!-- 地支刻度線 - 24小時版本 -->
        <g v-for="(hourLabel, index) in hourLabels" :key="'hour-' + index">
          <path
            :d="getTickPath(middleRadius, index, 24, 8)"
            :class="[
              'tick',
              'tick-24',
              { 'tick-hour-highlight': isCurrentHour24(index) },
            ]"
          />

          <!-- 24小時文字 middleRadius - 28（更靠近刻度線 3 個單位）-->
          <text
            :x="getTextPosition(middleRadius - 20, index, 24).x"
            :y="getTextPosition(middleRadius - 20, index, 24).y"
            :class="[
              'tick-text',
              'tick-text-24',
              { 'text-hour-highlight': isCurrentHour24(index) },
            ]"
            text-anchor="middle"
            dominant-baseline="middle"
          >
            {{ hourLabel }}
          </text>
        </g>

        <!-- 太極圖 -->
        <g id="taiji" transform="translate(200 200) rotate(180)">
          <!-- 外圓（黑底） -->
          <circle
            cx="0"
            cy="0"
            :r="taijiRadius"
            fill="black"
            stroke="black"
            stroke-width="0"
            class="taiji-circle"
          />

          <!-- 白色半圓 -->
          <path
            :d="`
              M 0 -${taijiRadius}
              A ${taijiRadius} ${taijiRadius} 0 0 0 0 ${taijiRadius}
              A ${taijiRadius / 2} ${taijiRadius / 2} 0 0 1 0 0
              A ${taijiRadius / 2} ${taijiRadius / 2} 0 0 0 0 -${taijiRadius}
              Z
            `"
            fill="white"
          />

          <!-- 白色小圓 -->
          <circle
            cx="0"
            :cy="-taijiRadius / 2"
            :r="taijiRadius / 2"
            fill="white"
          />

          <!-- 黑色小圓 -->
          <circle
            cx="0"
            :cy="taijiRadius / 2"
            :r="taijiRadius / 2"
            fill="black"
          />

          <!-- 黑點 -->
          <circle
            cx="0"
            :cy="-taijiRadius / 2"
            :r="taijiRadius / 8"
            fill="black"
          />

          <!-- 白點 -->
          <circle
            cx="0"
            :cy="taijiRadius / 2"
            :r="taijiRadius / 8"
            fill="white"
          />
          
        </g>

        <!-- 中心點 -->
        <circle cx="200" cy="200" r="2" fill="#2c3e50" />
      </svg>
    </div>

    <div class="info-legend">
      <div class="time-display">
        <div class="current-time">{{ currentDateTime }}</div>
        <div class="ganzhi-time">{{ currentGanzhiTime }}</div>
        <div class="hour-info">
          <!-- 時辰：{{ currentDizhi }}時 ({{ currentHourRange }}) -->
          時辰：{{ currentHourRange }}
        </div>
      </div>

      <div class="legend">
        <div class="legend-item">
          <span class="legend-color hour-color"></span>
          <span>地支24小時（每1小時）</span>
        </div>
        <div class="legend-item">
          <span class="legend-color minute-color"></span>
          <span>60甲子分鐘（每1分鐘）</span>
        </div>
        <div class="legend-item">
          <span class="legend-color second-color"></span>
          <span>60甲子秒數（每1秒）</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useTaiSuiStore } from "../stores/taisuiStore";

const taisuiStore = useTaiSuiStore();

// 時鐘尺寸
const clockSize = ref(450);
const outerRadius = ref(195);
const middleRadius = ref(120);
const taijiRadius = ref(50);

// 時間狀態
const currentTime = ref(new Date());
const currentHour = ref(0);
const currentMinute = ref(0);
const currentSecond = ref(0);

// 從 store 獲取數據
const dizhis = taisuiStore.dizhis || [
  "子",
  "丑",
  "寅",
  "卯",
  "辰",
  "巳",
  "午",
  "未",
  "申",
  "酉",
  "戌",
  "亥",
];
const jiazi60 = computed(() =>
  taisuiStore.get60Jiazi ? taisuiStore.get60Jiazi() : generateJiazi60()
);

// 生成60甲子
function generateJiazi60() {
  const tiangans = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const jiazi = [];
  for (let i = 0; i < 60; i++) {
    const tianganIndex = i % 10;
    const dizhiIndex = i % 12;
    jiazi.push(tiangans[tianganIndex] + dizhis[dizhiIndex]);
  }
  return jiazi;
}

// 生成24小時標籤：地支 + 數字
const hourLabels = computed(() => {
  const labels = [];

  // 地支順序：子丑寅卯辰巳午未申酉戌亥
  // 子時：23-1點，我們要讓"子"在底部（6點鐘方向）
  // 午時：11-13點，在頂部（12點鐘方向）

  // 創建24小時標籤
  for (let i = 0; i < 24; i++) {
    // 計算對應的地支索引
    // 傳統：子(23-1)、丑(1-3)、寅(3-5)...午(11-13)
    const dizhiIndex = Math.floor(((i + 1) % 24) / 2);
    const dizhi = dizhis[dizhiIndex];

    // 對於偶數小時，顯示地支；奇數小時顯示數字
    if (i % 2 === 0) {
      // 主要小時顯示地支
      labels.push(dizhi);
    } else {
      // 次要小時顯示數字（小字號）
      labels.push(`${i}`);
    }
  }

  return labels;
});

// 當前時間格式化
const currentDateTime = computed(() => {
  return currentTime.value.toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
});

// 計算當前地支和時辰範圍
const currentDizhi = computed(() => {
  const hourIndex = Math.floor(((currentHour.value + 1) % 24) / 2);
  return dizhis[hourIndex];
});

const currentHourRange = computed(() => {
  const hourIndex = Math.floor(((currentHour.value + 1) % 24) / 2);
  const startHour = (hourIndex * 2 - 1 + 24) % 24;
  const endHour = (startHour + 2) % 24;
  return `${startHour}:00-${endHour}:00`;
});

// 計算干支時間
const currentGanzhiTime = computed(() => {
  // 計算60甲子分和秒
  const jiaziMinute = jiazi60.value[currentMinute.value];
  const jiaziSecond = jiazi60.value[currentSecond.value];

  return `${currentDizhi.value}時 ${jiaziMinute}分 ${jiaziSecond}秒`;
});

// 刻度路徑計算
function getTickPath(radius, index, total, length) {
  // 調整角度，讓"午"在12點鐘方向
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  const x1 = 200 + radius * Math.cos(angle);
  const y1 = 200 + radius * Math.sin(angle);
  const x2 = 200 + (radius - length) * Math.cos(angle);
  const y2 = 200 + (radius - length) * Math.sin(angle);

  return `M ${x1} ${y1} L ${x2} ${y2}`;
}

// 文字位置計算
function getTextPosition(radius, index, total) {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  return {
    x: 200 + radius * Math.cos(angle),
    y: 200 + radius * Math.sin(angle),
  };
}

// 高亮判斷 - 24小時版本
function isCurrentHour24(index) {
  // 24小時刻度，每個刻度代表1小時
  // index 0 = 0點，index 1 = 1點... index 23 = 23點
  return index === currentHour.value;
}

// 獲取顯示的地支文字
function getDisplayDizhi(index) {
  return hourLabels.value[index];
}

function isCurrentMinute(index) {
  return index === currentMinute.value;
}

function isCurrentSecond(index) {
  return index === currentSecond.value;
}

// 更新時間
let timer = null;

function updateTime() {
  currentTime.value = new Date();
  currentHour.value = currentTime.value.getHours();
  currentMinute.value = currentTime.value.getMinutes();
  currentSecond.value = currentTime.value.getSeconds();
}

// 生命周期
onMounted(() => {
  updateTime();
  timer = setInterval(updateTime, 1000);
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});
</script>

<style scoped>
.tiangan-dizhi-clock-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 5px;
  box-sizing: border-box;
}

.clock-wrapper {
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  padding: 5px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3),
    inset 0 5px 15px rgba(255, 255, 255, 0.1);
  transform: scale(1.3);
}

.clock-svg {
  display: block;
  filter: drop-shadow(0 10px 20px rgba(228, 215, 215, 0.5));
}

/* 外圈和中圈樣式 */
.outer-circle {
  stroke: rgba(255, 255, 255, 0.2);
}

.middle-circle {
  stroke: rgba(255, 255, 255, 0.3);
}

/* 刻度樣式 */
.tick {
  stroke: #bdc3c7;
  stroke-width: 1;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.tick-60 {
  stroke-width: 1.2;
}

.tick-24 {
  stroke-width: 1.5;
}

/* 高亮效果 */
.tick-second-highlight {
  stroke: #e74c3c !important;
  stroke-width: 3 !important;
  filter: drop-shadow(0 0 8px #e74c3c);
}

.tick-minute-highlight {
  stroke: #3498db !important;
  stroke-width: 2.5 !important;
  filter: drop-shadow(0 0 6px #3498db);
}

.tick-hour-highlight {
  stroke: #2ecc71 !important;
  stroke-width: 3 !important;
  filter: drop-shadow(0 0 8px #2ecc71);
}

/* 文字樣式 */
.tick-text {
  font-family: "Noto Sans TC", "Microsoft JhengHei", "SimHei", sans-serif;
  font-weight: bold;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
}

.tick-text-60 {
  font-size: 7px;
  fill: #ecf0f1;
  opacity: 0.8;
}

.tick-text-24 {
  font-size: 12px;
  fill: #ecf0f1;
  font-weight: bold;
}

/* 奇數小時（數字）的字體小一點 */
.tick-text-24:nth-child(odd) {
  font-size: 10px;
  opacity: 0.7;
}

/* 文字高亮效果 */
.text-second-highlight {
  fill: #e74c3c !important;
  font-size: 14px !important;
  font-weight: 900 !important;
  opacity: 1 !important;
  filter: drop-shadow(0 0 6px #e74c3c);
}

.text-minute-highlight {
  fill: #3498db !important;
  font-size: 13px !important;
  font-weight: 900 !important;
  opacity: 1 !important;
  filter: drop-shadow(0 0 5px #3498db);
}

.text-hour-highlight {
  fill: #2ecc71 !important;
  font-size: 18px !important;
  font-weight: 900 !important;
  opacity: 1 !important;
  filter: drop-shadow(0 0 8px #2ecc71);
}

/* 信息與圖例區域 */
.info-legend {
  position: fixed;
  bottom: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.7);
  padding: 15px;
  border-radius: 10px;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  max-width: 300px;
  z-index: 100;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
  transition: all 0.3s ease;
}

.time-display {
  text-align: left;
  margin-bottom: 15px;
}

.current-time {
  font-size: 10px;
  font-weight: bold;
  color: white;
  margin-bottom: 2px;
  font-family: "Courier New", monospace;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.ganzhi-time {
  font-size: 15px;
  color: #ffeb3b;
  font-weight: bold;
  font-family: "Noto Sans TC", "Microsoft JhengHei", sans-serif;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  margin-bottom: 8px;
}

.hour-info {
  font-size: 12px;
  color: #2ecc71;
  font-family: "Noto Sans TC", "Microsoft JhengHei", sans-serif;
  font-weight: bold;
  background: rgba(46, 204, 113, 0.1);
  padding: 5px;
  border-radius: 5px;
  border-left: 3px solid #2ecc71;
}

.legend {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.9);
  font-family: "Noto Sans TC", "Microsoft JhengHei", sans-serif;
}

.legend-color {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.hour-color {
  background: #2ecc71;
}

.minute-color {
  background: #3498db;
}

.second-color {
  background: #e74c3c;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .clock-wrapper {
    padding: 5px;
    margin-bottom: 30px;
    transform: scale(1);
  }

  .clock-svg {
    width: 350px;
    height: 350px;
  }

  .tick-text-60 {
    font-size: 9px;
  }

  .tick-text-24 {
    font-size: 14px;
  }

  .tick-text-24:nth-child(odd) {
    font-size: 12px;
  }

  .info-legend {
    display: none;
    padding: 5px;
    max-width: 350px;
  }
}

@media (max-width: 480px) {
  .clock-wrapper {
    padding: 5px;
    transform: scale(0.9);
  }

  .clock-svg {
    width: 280px;
    height: 280px;
  }

  .tick-text-60 {
    font-size: 7px;
  }

  .tick-text-24 {
    font-size: 12px;
  }

  .tick-text-24:nth-child(odd) {
    font-size: 10px;
  }

  .info-legend {
    display: none;
    padding: 5px;
    max-width: 280px;
  }
}
</style>
