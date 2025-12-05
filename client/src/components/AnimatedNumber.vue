<template>
  <span :class="className">{{ displayNumber }}</span>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';

// Props 定義
const props = defineProps({
  // 目標數字
  value: {
    type: Number,
    required: true,
    default: 0
  },
  // 動畫持續時間（毫秒）
  duration: {
    type: Number,
    default: 2000
  },
  // 是否使用緩動函數（easing）
  useEasing: {
    type: Boolean,
    default: true
  },
  // 小數位數
  decimals: {
    type: Number,
    default: 0
  },
  // 千分位分隔符
  separator: {
    type: String,
    default: ','
  },
  // 小數點符號
  decimal: {
    type: String,
    default: '.'
  },
  // 前綴（如貨幣符號）
  prefix: {
    type: String,
    default: ''
  },
  // 後綴（如單位）
  suffix: {
    type: String,
    default: ''
  },
  // 自定義 class
  className: {
    type: String,
    default: ''
  },
  // 是否在掛載時自動開始動畫
  autoplay: {
    type: Boolean,
    default: true
  },
  // 延遲開始時間（毫秒）
  delay: {
    type: Number,
    default: 0
  }
});

// 響應式數據
const displayNumber = ref('0');
const currentValue = ref(0);
let animationFrame = null;
let startTime = null;

// 緩動函數（easeOutExpo）
const easeOutExpo = (t, b, c, d) => {
  return c * (-Math.pow(2, -10 * t / d) + 1) * 1024 / 1023 + b;
};

// 線性函數
const linear = (t, b, c, d) => {
  return c * t / d + b;
};

// 格式化數字（添加千分位和小數）
const formatNumber = (num) => {
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  
  // 處理小數位數
  let fixedNum = absNum.toFixed(props.decimals);
  
  // 分離整數和小數部分
  const parts = fixedNum.split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];
  
  // 添加千分位分隔符
  if (props.separator) {
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, props.separator);
  }
  
  // 組合結果
  let result = integerPart;
  if (decimalPart) {
    result += props.decimal + decimalPart;
  }
  
  // 添加負號、前綴和後綴
  return (isNegative ? '-' : '') + props.prefix + result + props.suffix;
};

// 動畫函數
const animate = (timestamp) => {
  if (!startTime) {
    startTime = timestamp;
  }
  
  const progress = timestamp - startTime;
  const duration = props.duration;
  
  if (progress < duration) {
    // 計算當前值
    const easingFunction = props.useEasing ? easeOutExpo : linear;
    currentValue.value = easingFunction(progress, 0, props.value, duration);
    
    // 更新顯示
    displayNumber.value = formatNumber(currentValue.value);
    
    // 繼續動畫
    animationFrame = requestAnimationFrame(animate);
  } else {
    // 動畫結束，設置為最終值
    currentValue.value = props.value;
    displayNumber.value = formatNumber(props.value);
    startTime = null;
  }
};

// 開始動畫
const startAnimation = () => {
  // 取消之前的動畫
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }
  
  // 重置狀態
  startTime = null;
  currentValue.value = 0;
  
  // 開始新動畫
  if (props.delay > 0) {
    setTimeout(() => {
      animationFrame = requestAnimationFrame(animate);
    }, props.delay);
  } else {
    animationFrame = requestAnimationFrame(animate);
  }
};

// 監聽 value 變化
watch(() => props.value, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    startAnimation();
  }
});

// 組件掛載時
onMounted(() => {
  if (props.autoplay) {
    startAnimation();
  } else {
    // 不自動播放時，直接顯示目標值
    displayNumber.value = formatNumber(props.value);
  }
});

// 暴露方法給父組件使用
defineExpose({
  startAnimation,
  reset: () => {
    currentValue.value = 0;
    displayNumber.value = formatNumber(0);
  }
});
</script>

<style scoped>
/* 可選：添加一些視覺效果 */
span {
  display: inline-block;
  font-variant-numeric: tabular-nums;
  transition: color 0.3s ease;
}

/* 數字跳動時的顏色變化效果（可選） */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}
</style>