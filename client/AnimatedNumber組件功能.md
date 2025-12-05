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
<AnimatedNumber 
  ref="numberRef"
  :value="count" 
  :autoplay="false"
/>

<button @click="numberRef.startAnimation()">開始</button>
<button @click="numberRef.reset()">重置</button>
```

## 💡 實用場景

活動卡片 - 展示參與人數
統計面板 - 顯示總人數、活動數等
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
