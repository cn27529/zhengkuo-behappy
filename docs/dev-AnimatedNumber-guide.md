# AnimatedNumber 組件開發指南

## 功能概述

AnimatedNumber 是一個純原生實現的數字動畫組件，提供平滑的數字跳動效果，從 0 動畫到目標數值。組件採用瀏覽器原生 API，無第三方依賴，具有高性能和完全可配置的特性。

## 核心特性

- **平滑動畫**：從 0 跳動到目標數字
- **緩動效果**：使用 easeOutExpo 緩動函數，開始快結束慢
- **高性能**：使用 requestAnimationFrame 確保流暢
- **零依賴**：純原生實現，不依賴任何第三方庫
- **完全可配置**：支援 10+ 個可配置選項

## 技術實現

### 1. 核心動畫引擎

```javascript
const animate = (timestamp) => {
  // 使用瀏覽器原生 API，確保 60fps 流暢動畫
  animationFrame = requestAnimationFrame(animate);
};
```

**技術優勢：**
- ✅ 瀏覽器原生支援，無需依賴
- ✅ 自動優化效能（閒置標籤頁會暫停）
- ✅ 與瀏覽器刷新率同步，保證流暢

### 2. 緩動函數

```javascript
// easeOutExpo - 指數衰減函數
const easeOutExpo = (t, b, c, d) => {
  return (c * (-Math.pow(2, (-10 * t) / d) + 1) * 1024) / 1023 + b;
};
// t: 當前時間, b: 起始值, c: 變化量, d: 持續時間
```

**視覺效果：** 開始快速，逐漸減速，模擬真實物理運動

### 3. 數字格式化

```javascript
// 千分位分隔符
integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
```

**完全原生實現，零依賴！**

## CSS 樣式相容性

### 組件不會影響現有樣式

**設計原則：**

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
   - 不會污染全域樣式
   - 外部 CSS 完全不受影響

3. **完全可自訂**
   ```vue
   <AnimatedNumber
     :value="100"
     class="my-custom-class"
     style="color: red; font-size: 24px;"
   />
   ```

### 樣式繼承最佳實踐

```vue
<template>
  <div class="participants" style="color: blue; font-size: 20px;">
    參與人次：
    <AnimatedNumber :value="342" suffix=" 人" />
    <!-- 會繼承藍色和 20px 字體 -->
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

## 實用場景

- **活動卡片** - 展示參與人次
- **統計面板** - 顯示總人次、活動數等
- **進度展示** - 報名進度、完成度
- **數據看板** - Dashboard 數據展示
- **成就解鎖** - 遊戲化積分顯示

## 視覺效果建議

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

## 第三方替代方案

### Element Plus 方案

Element Plus 沒有內建的數字動畫組件，但可使用：

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
</script>
```

**缺點：** 仍需自己實現動畫邏輯

### 第三方庫對比

#### 1. CountUp.js
```bash
npm install countup.js
```

```vue
<template>
  <span ref="countupRef"></span>
</template>

<script setup>
import { CountUp } from "countup.js";

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

**優點：** 功能強大，配置豐富，4.8k stars  
**缺點：** 需要安裝依賴（28KB）

#### 2. vue-countup-v3
```bash
npm install vue-countup-v3
```

```vue
<template>
  <vue-countup :end-val="342" :duration="2" suffix=" 人" />
</template>
```

**優點：** Vue 3 原生組件，使用簡單  
**缺點：** 需要安裝依賴

#### 3. GSAP (GreenSock)
```bash
npm install gsap
```

```vue
<script setup>
import { gsap } from "gsap";

onMounted(() => {
  gsap.to(displayValue, {
    value: 342,
    duration: 2,
    ease: "power2.out"
  });
});
</script>
```

**優點：** 最強大的動畫庫，效能極佳  
**缺點：** 體積較大（300KB+）

## 方案對比

| 方案 | 體積 | 難度 | 效能 | 依賴 | 推薦度 |
|------|------|------|------|------|--------|
| **自建組件** | 0KB | ⭐⭐ | ⭐⭐⭐⭐⭐ | 無 | ⭐⭐⭐⭐⭐ |
| CountUp.js | 28KB | ⭐ | ⭐⭐⭐⭐ | 有 | ⭐⭐⭐⭐ |
| vue-countup-v3 | 30KB | ⭐ | ⭐⭐⭐⭐ | 有 | ⭐⭐⭐⭐ |
| GSAP | 300KB+ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 有 | ⭐⭐⭐ |
| Element Plus | - | ⭐⭐⭐⭐ | - | 需自建 | ⭐⭐ |

## 技術細節

### 關鍵程式碼解析

```javascript
// 1. 動畫循環
const animate = (timestamp) => {
  if (!startTime) startTime = timestamp;
  const progress = timestamp - startTime; // 已經過時間

  // 2. 計算當前值（緩動函數）
  currentValue.value = easeOutExpo(
    progress,        // 當前時間
    0,              // 起始值
    props.value,    // 目標值
    props.duration  // 總時長
  );

  // 3. 格式化顯示
  displayNumber.value = formatNumber(currentValue.value);

  // 4. 繼續動畫或結束
  if (progress < props.duration) {
    animationFrame = requestAnimationFrame(animate);
  }
};
```

### 效能優化

1. **使用 requestAnimationFrame** - 瀏覽器優化
2. **單一數值更新** - 不操作 DOM
3. **Math 原生計算** - 最快速度
4. **自動清理** - 防止記憶體洩漏

## 建議

### 簡單專案 → 使用自建組件
- ✅ 零依賴，輕量級
- ✅ 完全可控
- ✅ 學習原理

### 需要更多功能 → vue-countup-v3
```bash
npm install vue-countup-v3
```

### 已使用 GSAP → 直接用 GSAP
- 可以統一動畫庫

## 總結

**自建組件完全滿足需求：**
- ✅ 純原生實現，零依賴
- ✅ 不影響現有樣式
- ✅ 效能優秀
- ✅ 完全可控

組件只是一個帶動畫效果的 `<span>` 標籤，您目前的 CSS 樣式完全不會受影響！

---

*此文件涵蓋 AnimatedNumber 組件的完整開發和使用指南。*
