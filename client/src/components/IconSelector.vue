<template>
  <div class="icon-selector">
    <!-- 顯示當前選中的圖標 -->
    <div class="selected-icon" v-if="modelValue" style="display: none">
      <span class="icon-display">{{ modelValue }}</span>
      <el-button size="small" @click="clearSelection" circle>
        <el-icon><Close /></el-icon>
      </el-button>
    </div>

    <!-- 圖標網格選擇器 -->
    <div class="icon-grid">
      <div
        v-for="icon in availableIcons"
        :key="icon.emoji"
        class="icon-item"
        :class="{ active: modelValue === icon.emoji }"
        @click="selectIcon(icon.emoji)"
      >
        <span class="icon">{{ icon.emoji }}</span>
        <!-- <span class="icon-label">{{ icon.label }}</span> -->
      </div>
    </div>
  </div>
</template>

<script setup>
import { Close } from "@element-plus/icons-vue";

// Props
const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
});

// Emits
const emit = defineEmits(["update:modelValue"]);

// 從 mock_activities.json 整理出的唯一圖標
const availableIcons = [
  { emoji: "🕯️", label: "蠟燭" },
  { emoji: "🙏", label: "祈禱" },
  { emoji: "⛰️", label: "朝山" },
  { emoji: "🍚", label: "供品" },
  { emoji: "🌸", label: "花朵" },
  { emoji: "🧘", label: "禪修" },
  { emoji: "🏮", label: "燈籠" },
  { emoji: "🧧", label: "紅包" },
  { emoji: "🧨", label: "新年" },
  { emoji: "🥮", label: "月餅" },
  { emoji: "🐉", label: "龍舟" },
  { emoji: "🎊", label: "節慶" },
];

// const availableIcons = [
//   { emoji: "🕯️", label: "觀音,菩薩,成道,法會" },
//   { emoji: "🙏", label: "祈福,和平" },
//   { emoji: "⛰️", label: "朝山" },
//   { emoji: "🍚", label: "普度,祖先,祭祖,祭祀,清明,追思,中元" },
//   { emoji: "🌸", label: "浴佛" },
//   { emoji: "🧘", label: "禪修" },
//   { emoji: "🏮", label: "燈籠,元宵" },
//   { emoji: "🧧", label: "新春" },
//   { emoji: "🧨", label: "過年,新年" },
//   { emoji: "", label: "端午" },
//   { emoji: "", label: "中秋" },
//   { emoji: "", label: "冬至" },
//   { emoji: "", label: "節慶" },
// ];

// 方法
const selectIcon = (icon) => {
  emit("update:modelValue", icon);
};

const clearSelection = () => {
  emit("update:modelValue", "");
};
</script>

<style scoped>
.icon-selector {
  width: 100%;
}

.selected-icon {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: var(--el-fill-color-light);
  border-radius: 4px;
  margin-bottom: 1rem;
}

.icon-display {
  font-size: 1rem;
  line-height: 0;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  gap: 0.5rem;
  padding: 0.5rem;
  background: #ecf0f1;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  background: white;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.icon-item:hover {
  border-color: var(--el-color-primary);
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.icon-item.active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.icon {
  font-size: 1.5rem;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.icon-label {
  font-size: 0.75rem;
  color: #666;
  text-align: center;
}

/* 滾動條樣式 */
.icon-grid::-webkit-scrollbar {
  width: 6px;
}

.icon-grid::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.icon-grid::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.icon-grid::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
