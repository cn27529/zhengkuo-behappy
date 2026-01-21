# AnimatedNumber 組件技術說明

## 🛠️ 技術實現（純原生，無第三方依賴）

### 1. **核心技術：requestAnimationFrame**

```javascript
const animate = (timestamp) => {
  // 使用瀏覽器原生 API，確保 60fps 流暢動畫
  animationFrame = requestAnimationFrame(animate);
};
```

**優點：**

- ✅ 瀏覽器原生支持，無需依賴
- ✅ 自動優化性能（閒置標籤頁會暫停）
- ✅ 與瀏覽器刷新率同步，保證流暢

### 2. **緩動函數：數學計算**

```javascript
// easeOutExpo - 指數衰減函數
const easeOutExpo = (t, b, c, d) => {
  return (c * (-Math.pow(2, (-10 * t) / d) + 1) * 1024) / 1023 + b;
};
// t: 當前時間, b: 起始值, c: 變化量, d: 持續時間
```

**效果：** 開始快速，逐漸減速，類似真實物理運動

### 3. **數字格式化：正則表達式**

```javascript
// 千分位分隔
integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
```

**完全原生實現，零依賴！**

---

## 🎨 CSS 樣式影響分析

### ❌ **組件不會影響你的外觀**

**原因：**

1. **使用 `<span>` 標籤**

   ```html
   <span :class="className">{{ displayNumber }}</span>
   ```

   - 行內元素，不會破壞佈局
   - 繼承父元素樣式

2. **CSS Scoped**

   ```vue
   <style scoped>
   /* 樣式只作用於組件內部 */
   </style>
   ```

   - 不會污染全局樣式
   - 你的外部 CSS 完全不受影響

3. **完全可自定義**
   ```vue
   <!-- 你的 CSS 完全有效 -->
   <AnimatedNumber
     :value="100"
     class="my-custom-class"
     style="color: red; font-size: 24px;"
   />
   ```

### ✅ **最佳實踐：樣式繼承**

```vue
<template>
  <!-- 組件會繼承父元素的樣式 -->
  <div class="participants" style="color: blue; font-size: 20px;">
    參與人次：
    <AnimatedNumber :value="342" suffix=" 人" />
    <!-- ↑ 會繼承藍色和 20px 字體 -->
  </div>
</template>

<style>
.participants {
  color: #8b4513;
  font-size: 24px;
  font-weight: bold;
}
/* AnimatedNumber 會自動繼承這些樣式 */
</style>
```

---

## 📦 Element Plus 替代方案

### Element Plus **沒有**內建的數字動畫組件

但有以下方案：

### 方案 1：**Statistic 組件 + 自定義動畫**

```vue
<template>
  <el-statistic :value="displayValue" suffix="人" title="參與人次" />
</template>

<script setup>
import { ref, onMounted } from "vue";

const displayValue = ref(0);
const targetValue = 342;

onMounted(() => {
  // 需要自己實現動畫邏輯
  animateValue(0, targetValue, 2000);
});

const animateValue = (start, end, duration) => {
  // 還是需要自己寫動畫代碼
};
</script>
```

**缺點：** 還是需要自己實現動畫邏輯

---

## 🎯 第三方數字動畫庫對比

### 1. **CountUp.js** ⭐⭐⭐⭐⭐

```bash
npm install countup.js
```

```vue
<template>
  <span ref="countupRef"></span>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { CountUp } from "countup.js";

const countupRef = ref(null);

onMounted(() => {
  const countUp = new CountUp(countupRef.value, 342, {
    duration: 2,
    separator: ",",
    suffix: " 人",
  });
  countUp.start();
});
</script>
```

**優點：**

- ✅ 功能強大，配置豐富
- ✅ 支持小數、前綴、後綴
- ✅ 4.8k stars，維護良好

**缺點：**

- ❌ 需要安裝依賴（28KB）

### 2. **vue-countup-v3** ⭐⭐⭐⭐

```bash
npm install vue-countup-v3
```

```vue
<template>
  <vue-countup :end-val="342" :duration="2" suffix=" 人" />
</template>

<script setup>
import VueCountup from "vue-countup-v3";
</script>
```

**優點：**

- ✅ Vue 3 原生組件
- ✅ 基於 CountUp.js
- ✅ 使用簡單

**缺點：**

- ❌ 需要安裝依賴

### 3. **gsap (GreenSock)** ⭐⭐⭐⭐⭐

```bash
npm install gsap
```

```vue
<script setup>
import { ref, onMounted } from "vue";
import { gsap } from "gsap";

const displayValue = ref(0);

onMounted(() => {
  gsap.to(displayValue, {
    value: 342,
    duration: 2,
    ease: "power2.out",
    onUpdate: () => {
      displayValue.value = Math.round(displayValue.value);
    },
  });
});
</script>
```

**優點：**

- ✅ 最強大的動畫庫
- ✅ 可以做任何動畫
- ✅ 性能極佳

**缺點：**

- ❌ 體積較大（對於數字動畫來說過於重量級）

---

## 📊 方案對比表

| 方案           | 體積   | 難度     | 性能       | 依賴   | 推薦度     |
| -------------- | ------ | -------- | ---------- | ------ | ---------- |
| **自建組件**   | 0KB    | ⭐⭐     | ⭐⭐⭐⭐⭐ | 無     | ⭐⭐⭐⭐⭐ |
| CountUp.js     | 28KB   | ⭐       | ⭐⭐⭐⭐   | 有     | ⭐⭐⭐⭐   |
| vue-countup-v3 | 30KB   | ⭐       | ⭐⭐⭐⭐   | 有     | ⭐⭐⭐⭐   |
| GSAP           | 300KB+ | ⭐⭐⭐   | ⭐⭐⭐⭐⭐ | 有     | ⭐⭐⭐     |
| Element Plus   | -      | ⭐⭐⭐⭐ | -          | 需自建 | ⭐⭐       |

---

## 💡 我的推薦

### 情況 1：簡單項目 → **使用自建組件**

- ✅ 零依賴，輕量級
- ✅ 完全可控
- ✅ 學習原理

### 情況 2：需要更多功能 → **vue-countup-v3**

```bash
npm install vue-countup-v3
```

### 情況 3：已使用 GSAP → **直接用 GSAP**

- 可以統一動畫庫

---

## 🔧 自建組件技術細節

### 關鍵代碼解析

```javascript
// 1. 動畫循環
const animate = (timestamp) => {
  if (!startTime) startTime = timestamp;
  const progress = timestamp - startTime; // 已經過時間

  // 2. 計算當前值（緩動函數）
  currentValue.value = easeOutExpo(
    progress, // 當前時間
    0, // 起始值
    props.value, // 目標值
    props.duration, // 總時長
  );

  // 3. 格式化顯示
  displayNumber.value = formatNumber(currentValue.value);

  // 4. 繼續動畫或結束
  if (progress < props.duration) {
    animationFrame = requestAnimationFrame(animate);
  }
};
```

### 性能優化

1. **使用 requestAnimationFrame** - 瀏覽器優化
2. **單一數值更新** - 不操作 DOM
3. **Math 原生計算** - 最快速度
4. **自動清理** - 防止內存洩漏

---

# 🎯 AnimatedNumber 組件功能

## ✨ 核心特性

平滑動畫：從 0 跳動到目標數字
緩動效果：使用 easeOutExpo 緩動函數，開始快結束慢
高性能：使用 requestAnimationFrame 確保流暢
完全可配置：多達 10+ 個可配置選項

## 🎨 配置選項

屬性類型默認值說明

valueNumber0目標數字（必填）

durationNumber2000動畫時長（毫秒）

useEasingBooleantrue是否使用緩動效果

decimalsNumber0小數位數separatorString','千分位分隔符prefixString''前綴（如 $）suffixString''後綴（如 人）autoplayBooleantrue是否自動播放delayNumber0延遲開始（毫秒）

## 📝 使用方式

**基本使用：**

```vue
<AnimatedNumber :value="342" suffix=" 人" />
```

**自定義樣式和時長：**

```vue
<AnimatedNumber
  :value="1567"
  :duration="3000"
  separator=","
  suffix=" 人"
  class="my-number"
/>
```

**列表中逐個顯示：**

```vue
<AnimatedNumber
  v-for="(act, index) in activities"
  :key="act.id"
  :value="act.participants"
  :delay="index * 100"
  suffix=" 人"
/>
```

**手動控制：**

```vue
<AnimatedNumber ref="numberRef" :value="count" :autoplay="false" />

<button @click="numberRef.startAnimation()">開始</button>
<button @click="numberRef.reset()">重置</button>
```

## 💡 實用場景

活動卡片 - 展示參與人次
統計面板 - 顯示總人次、活動數等
進度展示 - 報名進度、完成度
數據看板 - Dashboard 數據展示
成就解鎖 - 遊戲化積分顯示

## 🎭 視覺效果建議

```css
/* 加大字體，醒目顯示 */
.participants-count {
  font-size: 28px;
  font-weight: bold;
  color: #8b4513;
}

/* 漸變背景 */
.total-stats {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 陰影效果 */
.number-highlight {
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}
```

---

## ✨ 總結

**自建組件完全滿足需求：**

- ✅ 純原生實現，零依賴
- ✅ 不影響現有樣式
- ✅ 性能優秀
- ✅ 完全可控

**如果需要更多功能，推薦 vue-countup-v3**

你目前的 CSS 樣式**完全不會**受影響，組件只是一個帶動畫效果的 `<span>` 標籤！
