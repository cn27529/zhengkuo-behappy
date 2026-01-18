<template>
  <div class="tiangan-dizhi-clock-container">
    <div class="clock-wrapper">
      <svg
        :width="clockSize"
        :height="clockSize"
        viewBox="0 0 400 400"
        class="clock-svg"
      >
        <!-- 外圈：60甲子圏 -->
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
            :d="getTickPath(outerRadius, index, 60, 10)"
            :class="[
              'tick',
              'tick-60',
              {
                'tick-second-highlight': isCurrentSecond(index),
                'tick-minute-highlight': isCurrentMinute(index),
              },
            ]"
          />

          <!-- 60甲子文字 -->
          <text
            :x="getTextPosition(outerRadius - 24, index, 60).x"
            :y="getTextPosition(outerRadius - 24, index, 60).y"
            :class="[
              'tick-text',
              'tick-text-60',
              {
                'text-second': isCurrentSecond(index),
                'text-minute-highlight': isCurrentMinute(index),
              },
            ]"
            text-anchor="middle"
            dominant-baseline="middle"
          >
            {{ item }}
          </text>
        </g>

        <!-- 中圈：12地支刻度 - 12小時 -->
        <circle
          cx="200"
          cy="200"
          :r="middleRadius"
          fill="none"
          stroke="#1a252f"
          stroke-width="1.5"
          class="middle-circle"
        />

        <!-- 12地支刻度線 - 使用調整後的地支順序 -->
        <g v-for="(dizhi, index) in adjustedDizhis" :key="'dizhi-' + index">
          <path
            :d="getTickPath(middleRadius, index, 12, 10)"
            :class="['tick', 'tick-12', { 'tick-hour': isCurrentHour(index) }]"
          />

          <!-- 地支文字 -->
          <text
            :x="getTextPosition(middleRadius - 24, index, 12).x"
            :y="getTextPosition(middleRadius - 24, index, 12).y"
            :class="[
              'tick-text',
              'tick-text-12',
              { 'text-hour-highlight': isCurrentHour(index) },
            ]"
            text-anchor="middle"
            dominant-baseline="middle"
          >
            {{ dizhi }}
          </text>
        </g>

        <!-- 24小時圈 -->
        <circle
          cx="200"
          cy="200"
          :r="middleRadius24"
          fill="none"
          stroke="#1a252f"
          stroke-width="1"
          class="middle-circle"
        />

        <!-- 24小時刻度 -->
        <g
          transform="rotate(180 200 200)"
          v-for="(hour24Label, index) in 24"
          :key="'hour-' + index"
        >
          <path
            :d="getTickPath(middleRadius24, index, 24, 10)"
            :class="[
              'tick',
              'tick-text-24',
              { 'tick-hour-highlight': isCurrentHour24(index) },
            ]"
          />
          <!-- 只有在 index 是奇數時顯示文字 xy=  -->
          <text
            v-if="index % 2 === 1"
            :x="getTextPosition(middleRadius24 - 15, index, 24).x"
            :y="getTextPosition(middleRadius24 - 15, index, 24).y"
            :class="[
              'tick-text',
              'tick-text-24',
              { 'text-hour24-highlight': isCurrentHour24(index) },
            ]"
            text-anchor="middle"
            dominant-baseline="middle"
          >
            &nbsp;
          </text>
        </g>

        <!-- 96刻圈 -->
        <g transform="rotate(180 200 200)">
          <circle
            cx="200"
            cy="200"
            :r="keRadius96"
            fill="none"
            stroke="#1a252f"
            stroke-width="0.5"
            class="ke-circle"
          ></circle>

          <!-- 刻鐘刻度：每個時辰8刻，12時辰共96刻 -->
          <g v-for="(ke96Label, index) in 96" :key="'ke-' + index">
            <path
              :d="getTickPath(keRadius96, index, 96, 5)"
              :class="[
                'tick',
                'tick-ke',
                { 'tick-ke-highlight': isCurrentKe96(index) },
              ]"
            />
          </g>
        </g>

        <!-- 太極圖都在這個 <g> 裡 -->
        <g id="taiji" transform="translate(200 200) rotate(0)">
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

          <!-- 添加旋轉動畫 -->
          <animateTransform
            attributeName="transform"
            attributeType="XML"
            type="rotate"
            from="360 0 0"
            to="0 0 0"
            dur="0s"
            repeatCount="indefinite"
            additive="sum"
          />
        </g>

        <!-- 中心點 -->
        <circle cx="200" cy="200" r="1" fill="#696969" />
      </svg>
    </div>

    <div class="info-legend">
      <div class="time-display">
        <div class="current-time">目前時間 {{ currentDateTime }}</div>
        <div class="ganzhi-time">
          {{ currentGanzhiHour }}時辰 {{ currentHourRange }}
        </div>
      </div>

      <div class="legend">
        <div class="legend-item">
          <span class="legend-color hour-color"></span>
          <span>地支時辰（每2小時）</span>
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
const clockSize = ref(600);
const outerRadius = ref(170); //
const middleRadius = ref(120); // 12地支
const middleRadius24 = ref(120); // 24小時時鐘
// 刻鐘相關的數據和方法
const keRadius96 = ref(120); // 96刻鐘圈半徑（介於地支圈和24小時圈之間）

// 刻鐘名稱
const keNames = [
  "初刻",
  "二刻",
  "三刻",
  "四刻",
  "五刻",
  "六刻",
  "七刻",
  "末刻",
];

const taijiRadius = ref(50);

// 時間狀態
const currentTime = ref(new Date());
const currentHour = ref(0);
const currentMinute = ref(0);
const currentSecond = ref(0);
const currentKe = ref(0);

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
  taisuiStore.get60Jiazi ? taisuiStore.get60Jiazi() : generateJiazi60(),
);

// 生成60甲子（如果 store 沒有提供）
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

const hour24Labels = computed(() => {
  const labels = [];

  // 地支順序：子丑寅卯辰巳午未申酉戌亥
  // 子時：23-1點，我們要讓"子"在底部（6點鐘方向）
  // 午時：11-13點，在頂部（12點鐘方向）

  // 創建24小時標籤
  for (let i = 0; i < 24; i++) {
    // 計算對應的地支索引
    // 傳統：子(23-1)、丑(1-3)、寅(3-5)...午(11-13)
    // const dizhiIndex = Math.floor(((i + 1) % 24) / 2);
    // const dizhi = dizhis[dizhiIndex];

    // // 對於偶數小時，顯示地支；奇數小時顯示數字
    // if (i % 2 === 0) {
    //   // 主要小時顯示地支
    //   labels.push(dizhi);
    // } else {
    //   // 次要小時顯示數字（小字號）
    //   labels.push(`${i}`);
    // }

    // 對於偶數小時，顯示地支

    labels.push(`${i}`);
  }

  return labels;
});

// 調整地支順序，讓"午"在12點鐘方向，"子"在6點鐘方向
const adjustedDizhis = computed(() => {
  // 地支順序：子丑寅卯辰巳午未申酉戌亥
  // 我們要讓"午"在頂部（12點），"子"在底部（6點）
  // 將地支順序旋轉6個位置
  const rotateBy = 6; // "午"原始位置是6，旋轉後到0（頂部）
  const rotated = [...dizhis];
  for (let i = 0; i < rotateBy; i++) {
    rotated.push(rotated.shift());
  }
  return rotated;
});

// 當前時間格式化
const currentDateTime = computed(() => {
  return currentTime.value.toLocaleString("zh-TW", {
    //year: "numeric",
    //month: "2-digit",
    //day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
});

// 計算干支時間
const currentGanzhiTime = computed(() => {
  // 計算時辰（地支）
  const hourIndex = Math.floor(((currentHour.value + 1) % 24) / 2);
  const dizhiHour = dizhis[hourIndex];

  // 計算60甲子分和秒
  const jiaziMinute = jiazi60.value[currentMinute.value];
  const jiaziSecond = jiazi60.value[currentSecond.value];

  return `${dizhiHour}時 ${jiaziMinute}分 ${jiaziSecond}秒`;
});

const currentGanzhiHour = computed(() => {
  // 計算時辰（地支）
  const hourIndex = Math.floor(((currentHour.value + 1) % 24) / 2);
  const dizhiHour = dizhis[hourIndex];
  return `${dizhiHour}時`;
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

// // 高亮判斷 - 簡化版的計算96刻
function isCurrentKe96(index) {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  // 計算當前總分鐘數（從0點開始）
  const totalMinutes = currentHour * 60 + currentMinute;
  // 計算對應的刻數（每15分鐘一刻）
  // 一天有 1440分鐘 ÷ 15 = 96刻
  const currentKe = Math.floor(totalMinutes / 15);
  return index === currentKe;
}

// // 高亮判斷 - 直接用總分鐘數計算96刻
function isCurrentKeSimple(index) {
  const now = new Date();
  const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
  const keIndex = Math.floor(minutesSinceMidnight / 15);
  return index === keIndex;
}

// 高亮判斷 - 24小時版本
function isCurrentHour24(index) {
  // 24小時刻度，每個刻度代表1小時
  // index 0 = 0點，index 1 = 1點... index 23 = 23點
  return index === currentHour.value;
}

const currentHourRange = computed(() => {
  const hourIndex = Math.floor(((currentHour.value + 1) % 24) / 2);
  const startHour = (hourIndex * 2 - 1 + 24) % 24;
  const endHour = (startHour + 2) % 24;
  //return `${startHour}:00-${endHour}:00`;
  return `${startHour}-${endHour}`;
});

// 高亮判斷 - 修正版
function isCurrentHour(index) {
  // 地支對應的時間：子(23-1)、丑(1-3)、寅(3-5)...依此類推
  const hourIndex = Math.floor(((currentHour.value + 1) % 24) / 2);

  // 現在時間是11:06，應該是"午"時（11-13點）
  // 計算在調整後的地支陣列中，"午"應該在哪個位置
  // 因為我們把"午"旋轉到頂部（index=0），所以需要找到"午"在原始陣列中的位置
  const currentDizhi = dizhis[hourIndex];

  // 找到當前時辰在調整後陣列中的位置
  const adjustedIndex = adjustedDizhis.value.indexOf(currentDizhi);

  return index === adjustedIndex;
}

// 獲取顯示的地支文字
function getDisplayDizhi(index) {
  return adjustedDizhis.value[index];
}

function isCurrentMinute(index) {
  // 分鐘轉換為60甲子索引
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

  // 調試信息
  console.log("當前時間:", currentHour.value + ":" + currentMinute.value);
  console.log(
    "當前時辰:",
    dizhis[Math.floor(((currentHour.value + 1) % 24) / 2)],
  );
  console.log(
    "高亮位置:",
    adjustedDizhis.value.indexOf(
      dizhis[Math.floor(((currentHour.value + 1) % 24) / 2)],
    ),
  );
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
  /* background-color: #696969; */
  background: linear-gradient(90deg, #696969 0%, #000000 80%);
  /* padding: 0px; */
  box-sizing: border-box;
}

.clock-wrapper {
  margin: 0 auto;
  /* background: rgba(255, 255, 255, 0.1); */
  border-radius: 50%;
  padding: 1px; /* 調小內邊距 */
  /* box-shadow: 0 0px 30px #000000, inset 0 5px 15px #696969; */
  /* box-shadow: 0 1px 5px #ffffff; */
  transform: scale(1.15); /* 縮放到 80% */
}

.taiji-circle {
  opacity: 1 !important;
  filter: drop-shadow(0 0 12px #969696);
}

.taiji-animate {
  animation: taiji-rotate 60s linear infinite;
  transform-origin: center;
  will-change: transform;
}

@keyframes taiji-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 可選：添加陰陽魚交互動畫 */
.taiji-animate:hover {
  animation-duration: 20s;
}

/* 可選：白天/夜晚速度不同 */
@media (prefers-color-scheme: dark) {
  .taiji-animate {
    animation-duration: 120s; /* 夜晚旋轉慢 */
  }
}

.clock-svg {
  display: block;
  filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.5));
}

/* 外圈和中圈樣式 */
.outer-circle {
  stroke: rgba(255, 255, 255, 0.2);
}

.ke-circle {
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

.tick-12 {
  stroke-width: 2;
}

/* 高亮效果 */
.tick-second-highlight {
  stroke: var(--tick-second-color) !important;
  stroke-width: 10 !important;
}

.tick-minute-highlight {
  stroke: var(--tick-minute-color) !important;
  stroke-width: 10 !important;
  filter: drop-shadow(0 0 6px #3498db);
}

.tick-ke-highlight {
  stroke: var(--tick-hour-color) !important;
  stroke-width: 2 !important;
  filter: drop-shadow(0 0 8px #2ecc71);
}

.tick-hour-highlight {
  stroke: var(--tick-hour-color) !important;
  stroke-width: 10 !important;
  filter: drop-shadow(0 0 8px #2ecc71);
}

/* 文字樣式 - 調小字體 */
.tick-text {
  font-family: "Noto Sans TC", "Microsoft JhengHei", "SimHei", sans-serif;
  font-weight: bold;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
}

.tick-text-60 {
  font-size: 6px; /* 調小字體 */
  /* fill: #ecf0f1; */
  fill: #a0a0a0;
  opacity: 0.8;
}

.tick-text-12 {
  font-size: 10px; /* 調小字體 */
  fill: #ecf0f1;
  font-weight: 900;
}

.tick-text-24 {
  font-size: 5px;
  fill: #ecf0f1;
  font-weight: 900;
}

/* 文字高亮效果 */
.text-second-highlight {
  fill: var(--tick-second-color) !important;
  font-size: 10px !important;
  font-weight: 900 !important;
  opacity: 1 !important;
}

.text-minute-highlight {
  fill: var(--tick-minute-color) !important;
  font-size: 15px !important;
  font-weight: 900 !important;
  opacity: 1 !important;
  filter: drop-shadow(0 0 5px #3498db);
}

.text-hour-highlight {
  fill: #2ecc71 !important;
  font-size: 20px; /* 調小字體 */
  font-weight: 900 !important;
  opacity: 1 !important;
  filter: drop-shadow(0 0 8px #2ecc71);
}

.text-hour24-highlight {
  fill: #2ecc71 !important;
  font-size: 5px; /* 調小字體 */
  font-weight: 900 !important;
  opacity: 1 !important;
  filter: drop-shadow(0 0 8px #2ecc71);
}

/* 信息與圖例區域 */
.info-legend {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: #000000;
  padding: 15px 20px;
  border-radius: 10px;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  max-width: 300px;
  z-index: 100;
  box-shadow: 0 1px 5px #ffffff;
  transition: all 0.3s ease;
}

.time-display {
  text-align: left;
  margin-bottom: 15px;
  opacity: 0.5 !important;
}

.current-time {
  font-size: 15px; /* 調小字體 */
  font-weight: bold;
  color: white;
  margin-bottom: 2px;
  font-family: "Courier New", monospace;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.ganzhi-time {
  font-size: 15px; /* 調小字體 */
  color: #ffeb3b;
  font-weight: bold;
  font-family: "Courier New", monospace;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
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
  font-size: 15px; /* 調小字體 */
  color: #ffffff;
  font-family: "Noto Sans TC", "Microsoft JhengHei", sans-serif;
}

.legend-color {
  width: 15px; /* 調小尺寸 */
  height: 15px; /* 調小尺寸 */
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.hour-color {
  background: var(--tick-hour-color);
}

.minute-color {
  background: var(--tick-minute-color);
}

.second-color {
  background: var(--tick-second-color);
}

/* 響應式設計 */
@media (max-width: 768px) {
  .clock-wrapper {
    padding: 15px;
    margin-bottom: 30px;
  }

  .clock-svg {
    width: 350px;
    height: 350px;
  }

  .tick-text-60 {
    font-size: 7px;
  }

  .tick-text-12 {
    font-size: 16px;
  }

  .info-legend {
    display: none;
    padding: 10px;
    max-width: 350px;
  }

  .current-time {
    font-size: 1.4rem;
  }

  .ganzhi-time {
    font-size: 1.1rem;
  }

  .legend-item {
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .clock-wrapper {
    padding: 10px;
  }

  .clock-svg {
    width: 280px;
    height: 280px;
  }

  .tick-text-60 {
    font-size: 7px;
  }

  .tick-text-12 {
    font-size: 14px;
  }

  .info-legend {
    display: none;
    padding: 15px;
    max-width: 280px;
  }

  .current-time {
    font-size: 10px;
  }

  .ganzhi-time {
    font-size: 10px;
  }

  .legend-item {
    font-size: 5px;
  }

  .legend-color {
    width: 18px;
    height: 18px;
  }
}
</style>
