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
            :d="getTickPath(outerRadius, index, 60, 12)"
            :class="[
              'tick',
              'tick-60',
              { 
                'tick-second-highlight': isCurrentSecond(index),
                'tick-minute-highlight': isCurrentMinute(index)
              }
            ]"
          />
          
          <!-- 60甲子文字 -->
          <text
            :x="getTextPosition(outerRadius - 20, index, 60).x"
            :y="getTextPosition(outerRadius - 20, index, 60).y"
            :class="[
              'tick-text',
              'tick-text-60',
              { 
                'text-second-highlight': isCurrentSecond(index),
                'text-minute-highlight': isCurrentMinute(index)
              }
            ]"
            text-anchor="middle"
            dominant-baseline="middle"
          >
            {{ item }}
          </text>
        </g>
        
        <!-- 中圈：地支刻度 - 12小時 -->
        <circle 
          cx="200" 
          cy="200" 
          :r="middleRadius" 
          fill="none" 
          stroke="#1a252f" 
          stroke-width="1.5"
          class="middle-circle"
        />
        
        <!-- 地支刻度線 - 使用調整後的地支順序 -->
        <g v-for="(dizhi, index) in adjustedDizhis" :key="'dizhi-' + index">
          <path
            :d="getTickPath(middleRadius, index, 12, 15)"
            :class="[
              'tick',
              'tick-12',
              { 'tick-hour-highlight': isCurrentHour(index) }
            ]"
          />
          
          <!-- 地支文字 -->
          <text
            :x="getTextPosition(middleRadius - 25, index, 12).x"
            :y="getTextPosition(middleRadius - 25, index, 12).y"
            :class="[
              'tick-text',
              'tick-text-12',
              { 'text-hour-highlight': isCurrentHour(index) }
            ]"
            text-anchor="middle"
            dominant-baseline="middle"
          >
            {{ dizhi }}
          </text>
        </g>

        
        
        <!-- 太極圖都在這個 <g> 裡 -->
        <g id="taiji" transform="translate(200 200) rotate(180)">
          <!-- 外圓（黑底） -->
          <circle 
            cx="0" 
            cy="0" 
            :r="taijiRadius" 
            fill="black" 
            stroke="black" 
            stroke-width="2"
          />
          
          <!-- 白色半圓 -->
          <path
            :d="`
              M 0 -${taijiRadius}
              A ${taijiRadius} ${taijiRadius} 0 0 0 0 ${taijiRadius}
              A ${taijiRadius/2} ${taijiRadius/2} 0 0 1 0 0
              A ${taijiRadius/2} ${taijiRadius/2} 0 0 0 0 -${taijiRadius}
              Z
            `"
            fill="white"
          />
          
          <!-- 上方黑色小圓 -->
          <circle 
            cx="0" 
            :cy="-taijiRadius/2" 
            :r="taijiRadius/2" 
            fill="black"
          />
          
          <!-- 下方白色小圓 -->
          <circle 
            cx="0" 
            :cy="taijiRadius/2" 
            :r="taijiRadius/2" 
            fill="white"
          />
          
          <!-- 黑中白點 -->
          <circle 
            cx="0" 
            :cy="-taijiRadius/2" 
            :r="taijiRadius/6" 
            fill="white"
          />
          
          <!-- 白中黑點 -->
          <circle 
            cx="0" 
            :cy="taijiRadius/2" 
            :r="taijiRadius/6" 
            fill="black"
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useTaiSuiStore } from '../stores/taisuiStore';

const taisuiStore = useTaiSuiStore();

// 時鐘尺寸
const clockSize = ref(500);
const outerRadius = ref(180);
const middleRadius = ref(120);
const taijiRadius = ref(50);

// 時間狀態
const currentTime = ref(new Date());
const currentHour = ref(0);
const currentMinute = ref(0);
const currentSecond = ref(0);

// 從 store 獲取數據
const dizhis = taisuiStore.dizhis || ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const jiazi60 = computed(() => taisuiStore.get60Jiazi ? taisuiStore.get60Jiazi() : generateJiazi60());

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
  return currentTime.value.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
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
    y: 200 + radius * Math.sin(angle)
  };
}

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
  console.log('當前時間:', currentHour.value + ':' + currentMinute.value);
  console.log('當前時辰:', dizhis[Math.floor(((currentHour.value + 1) % 24) / 2)]);
  console.log('高亮位置:', adjustedDizhis.value.indexOf(dizhis[Math.floor(((currentHour.value + 1) % 24) / 2)]));
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
  padding: 20px;
  box-sizing: border-box;
}

.clock-wrapper {
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  padding: 1px; /* 調小內邊距 */
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.3),
    inset 0 5px 15px rgba(255, 255, 255, 0.1);
    transform: scale(1.3); /* 縮放到 80% */
}

.clock-svg {
  display: block;
  filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.5));
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

.tick-12 {
  stroke-width: 2;
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

/* 文字樣式 - 調小字體 */
.tick-text {
  font-family: 'Noto Sans TC', 'Microsoft JhengHei', 'SimHei', sans-serif;
  font-weight: bold;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
}

.tick-text-60 {
  font-size: 7px; /* 調小字體 */
  fill: #ecf0f1;
  opacity: 0.8;
}

.tick-text-12 {
  font-size: 14px; /* 調小字體 */
  fill: #ecf0f1;
  font-weight: 900;
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
  font-size: 22px !important;
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
  padding: 15px 20px;
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
  font-size: 10px; /* 調小字體 */
  font-weight: bold;
  color: white;
  margin-bottom: 2px;
  font-family: 'Courier New', monospace;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.ganzhi-time {
  font-size: 15px; /* 調小字體 */
  color: #ffeb3b;
  font-weight: bold;
  font-family: 'Noto Sans TC', 'Microsoft JhengHei', sans-serif;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
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
  font-size: 010px; /* 調小字體 */
  color: rgba(255, 255, 255, 0.9);
  font-family: 'Noto Sans TC', 'Microsoft JhengHei', sans-serif;

}

.legend-color {
  width: 10px; /* 調小尺寸 */
  height: 10px; /* 調小尺寸 */
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
    padding: 15px;
    margin-bottom: 30px;
  }
  
  .clock-svg {
    width: 350px;
    height: 350px;
  }
  
  .tick-text-60 {
    font-size: 9px;
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