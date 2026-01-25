<!-- src/components/DevTools.vue -->
<template>
  <div v-if="isDev" class="dev-tools">
    <div class="dev-panel">
      <h4>🔧 開發工具</h4>
      <div class="control-group">
        <label>認證模式:</label>
        <select :value="authMode" @change="handleModeChange">
          <option value="mock">Mock 模式</option>
          <option value="backend">後端模式</option>
          <option value="directus">Directus 模式</option>
        </select>
        <span class="status" :class="authMode">
          {{ getModeDisplayName(authMode) }}
        </span>
      </div>

      <div class="control-group">
        <button @click="togglePanel">隱藏/顯示</button>
        <button @click="clearStorage">清除儲存</button>
        <button @click="reloadPage">重新載入</button>
      </div>

      <div class="info-group">
        <div class="env-info">
          <span>環境: {{ envMode }}</span>
          <span>版本: {{ appVersion }}</span>
          <span>API: {{ apiBaseUrl }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { authService } from "../services/authService.js";

const isDev = computed(() => import.meta.env.VITE_DEV || false);
const envMode = import.meta.env.VITE_MODE || "development";
const appVersion = import.meta.env.VITE_APP_VERSION || "unknown";
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";

// 初始化模式，優先使用 sessionStorage 中的設置
const authMode = computed(() => {
  const savedMode = sessionStorage.getItem("auth-mode");
  return savedMode || import.meta.env.VITE_AUTH_MODE || "directus";
});

const handleModeChange = (event) => {
  const newMode = event.target.value;
  if (newMode === authMode.value) return;

  authMode.value = newMode;

  // 更新服務
  if (authService && authService.setMode) {
    authService.setMode(newMode);
  }
  // 保存到 sessionStorage
  sessionStorage.setItem("auth-mode", newMode);
  console.log(`切換到 ${getModeDisplayName(newMode)} 模式`);
};

const getModeDisplayName = (mode) => {
  const modeNames = {
    mock: "Mock",
    backend: "後端",
    directus: "Directus",
  };
  return modeNames[mode] || mode;
};

const clearStorage = () => {
  sessionStorage.clear();
  sessionStorage.removeItem("auth-user");
  sessionStorage.removeItem("auth-token");
  localStorage.clear();
  console.log("所有儲存已清除");
};

const reloadPage = () => {
  window.location.reload();
};

const togglePanel = () => {
  const panel = document.querySelector(".dev-panel");
  if (panel) {
    panel.style.display = panel.style.display === "none" ? "block" : "none";
  }
};

// 初始化時確保模式一致
onMounted(() => {
  const savedMode = sessionStorage.getItem("auth-mode");
  if (savedMode && ["mock", "backend", "directus"].includes(savedMode)) {
    if (authService && authService.setMode) {
      authService.setMode(savedMode);
    }
  } else if (import.meta.env.VITE_AUTH_MODE) {
    // 使用環境變量設置的默認模式
    sessionStorage.setItem("auth-mode", import.meta.env.VITE_AUTH_MODE);
  }
});
</script>

<style scoped>
.dev-tools {
  position: fixed;
  top: 10px;
  right: 10px;
  z-index: 9999;
}

.dev-panel {
  background: #2c3e50;
  border: 1px solid #34495e;
  border-radius: 8px;
  padding: 12px;
  font-size: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  color: #ecf0f1;
  min-width: 280px;
}

.dev-panel h4 {
  margin: 0 0 10px 0;
  color: #3498db;
  font-size: 14px;
}

.control-group {
  margin: 10px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.control-group label {
  font-weight: bold;
  min-width: 80px;
  color: #bdc3c7;
}

select {
  padding: 4px 8px;
  border: 1px solid #7f8c8d;
  border-radius: 4px;
  background: #34495e;
  color: white;
  font-size: 11px;
}

.status {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
}

.status.mock {
  background: #f39c12;
  color: #2c3e50;
}

.status.backend {
  background: #27ae60;
  color: white;
}

.status.directus {
  background: #3498db;
  color: white;
}

button {
  padding: 5px 10px;
  border: 1px solid #7f8c8d;
  border-radius: 4px;
  background: #34495e;
  color: #ecf0f1;
  cursor: pointer;
  font-size: 11px;
  transition: all 0.2s;
}

button:hover {
  background: #3c556e;
  border-color: #95a5a6;
}

.info-group {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #34495e;
}

.env-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 10px;
  color: #95a5a6;
}

.env-info span {
  display: inline-block;
  margin-right: 10px;
}
</style>
