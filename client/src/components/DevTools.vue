<!-- src/components/DevTools.vue -->
<template>
  <div v-if="isDevelopment" class="dev-tools">
    <div class="dev-panel">
      <h4>🔧 開發工具</h4>
      <div class="control-group">
        <label>認證模式:</label>
        <select :value="authMode" @change="handleModeChange">
          <option value="mock">Mock 模式</option>
          <option value="backend">後端模式</option>
        </select>
        <span class="status">{{ authMode }}</span>
      </div>
      <div class="control-group">
        <button @click="clearStorage">清除儲存</button>
        <button @click="reloadPage">重新載入</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { authService } from '../services/authService';

const isDevelopment = computed(() => import.meta.env.VITE_DEV);
const authMode = ref(authService.getCurrentMode());

const handleModeChange = (event) => {
  const newMode = event.target.value;
  authService.setMode(newMode);
  authMode.value = newMode;
  sessionStorage.setItem("auth-mode", newMode);
};

const clearStorage = () => {
  sessionStorage.clear();
  sessionStorage.removeItem('auth-user');
  sessionStorage.removeItem('auth-token');
  console.log('儲存已清除');
};

const reloadPage = () => {
  window.location.reload();
};

// 初始化時讀取保存的模式
if (isDevelopment.value) {
  const savedMode = sessionStorage.getItem("auth-mode");
  if (savedMode) {
    authService.setMode(savedMode);
    authMode.value = savedMode;
  }
}
</script>

<style scoped>
.dev-tools {
  position: fixed;
  top: 10px;
  right: 10px;
  z-index: 9999;
}

.dev-panel {
  background: #f5f5f5;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 12px;
  font-size: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.control-group {
  margin: 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-group label {
  font-weight: bold;
  min-width: 80px;
}

.status {
  padding: 2px 6px;
  border-radius: 4px;
  background: #e0e0e0;
  font-size: 10px;
}

button {
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 11px;
}

button:hover {
  background: #f0f0f0;
}
</style>