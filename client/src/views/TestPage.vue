<!-- src/views/TestPage.vue -->
<template>
  <div class="test-page">
    <h2>🔧 認證服務測試頁面</h2>
    
    <div class="controls">
      <div class="control-group">
        <h3>🔄 模式切換</h3>
        <div class="button-group">
          <button 
            :class="{ active: authMode === 'mock' }"
            @click="setMode('mock')"
          >
            🎭 Mock 模式
          </button>
          <button 
            :class="{ active: authMode === 'backend' }"
            @click="setMode('backend')"
          >
            🚀 後端模式
          </button>
        </div>
        <div class="mode-info">
          <span class="mode-indicator" :class="authMode">
            {{ authMode === 'mock' ? '🎭 模擬模式' : '🚀 後端模式' }}
          </span>
          <span v-if="authMode === 'backend'" class="backend-status" :class="backendHealth.available ? 'healthy' : 'unhealthy'">
            {{ backendHealth.available ? '✅ 後端服務正常' : '❌ 後端服務異常' }}
          </span>
        </div>
      </div>
      
      <div class="control-group">
        <h3>🧪 測試功能</h3>
        <div class="button-group">
          <button @click="testValidation" :disabled="testing">
            {{ testing ? '測試中...' : '測試 Token 驗證' }}
          </button>
          <button @click="testRefresh" :disabled="testing">
            {{ testing ? '測試中...' : '測試 Token 刷新' }}
          </button>
          <button @click="testBackendHealth" :disabled="testing">
            {{ testing ? '檢查中...' : '檢查後端狀態' }}
          </button>
          <button @click="clearAll" class="danger">
            🗑️ 清除所有儲存
          </button>
        </div>
      </div>

      <div class="control-group" v-if="testResult">
        <h3>📊 測試結果</h3>
        <div class="test-result" :class="testResult.success ? 'success' : 'error'">
          <pre>{{ testResult }}</pre>
        </div>
      </div>
    </div>
    
    <div class="status">
      <h3>📈 當前狀態</h3>
      <div class="status-grid">
        <div class="status-item">
          <label>認證模式:</label>
          <span>{{ authMode }}</span>
        </div>
        <div class="status-item">
          <label>認證狀態:</label>
          <span :class="authStore.isAuthenticated ? 'authenticated' : 'unauthenticated'">
            {{ authStore.isAuthenticated ? '✅ 已認證' : '❌ 未認證' }}
          </span>
        </div>
        <div class="status-item">
          <label>當前用戶:</label>
          <span>{{ authStore.user ? authStore.user.displayName : '無' }}</span>
        </div>
        <div class="status-item">
          <label>加載狀態:</label>
          <span>{{ authStore.isLoading ? '🔄 加載中' : '✅ 閒置' }}</span>
        </div>
      </div>
      
      <h4>📦 儲存狀態</h4>
      <pre class="storage-status">{{ storageStatus }}</pre>
    </div>

    <!-- 快速登入測試 -->
    <div class="control-group" v-if="authMode === 'mock'">
      <h3>👥 快速登入測試 (僅 Mock 模式)</h3>
      <div class="test-accounts">
        <button 
          v-for="account in testAccounts" 
          :key="account.username"
          @click="quickLogin(account)"
          class="account-btn"
          :class="account.role"
        >
          <strong>{{ account.displayName }}</strong>
          <small>({{ account.role }})</small>
        </button>
      </div>
    </div>

    <!-- 後端模式提示 -->
    <div v-if="authMode === 'backend' && !backendHealth.available" class="warning-banner">
      <h4>⚠️ 後端服務警告</h4>
      <p>後端服務可能未啟動或無法連接。請確保：</p>
      <ul>
        <li>後端服務正在運行在 {{ serviceConfig.apiBaseUrl }}</li>
        <li>沒有 CORS 問題</li>
        <li>網路連接正常</li>
      </ul>
      <p>或者切換到 <strong>Mock 模式</strong> 繼續測試前端功能。</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { authService } from '../services/authService.js';
import { serviceConfig } from '../config/serviceConfig.js';
import { useAuthStore } from '../stores/auth.js';

const authStore = useAuthStore();
const authMode = ref(authService.getCurrentMode());
const testing = ref(false);
const testResult = ref(null);
const backendHealth = ref({ available: false, checked: false });

const storageStatus = computed(() => ({
  authUser: sessionStorage.getItem("auth-user"),
  authToken: sessionStorage.getItem("auth-token"),
  authRefreshToken: sessionStorage.getItem("auth-refresh-token"),
  sessionStorageKeys: Object.keys(sessionStorage),
  localStorageKeys: Object.keys(localStorage)
}));

const testAccounts = [
  { username: 'admin', password: 'password!123456', displayName: '阿德民', role: 'admin' },
  { username: 'temple_staff', password: 'temple123', displayName: '寺廟工作人員', role: 'staff' },
  { username: 'volunteer', password: 'volunteer123', displayName: '志工', role: 'volunteer' },
  { username: 'user01', password: 'user0123', displayName: '一般用戶01', role: 'user' }
];

const setMode = async (mode) => {
  authService.setMode(mode);
  authMode.value = mode;
  sessionStorage.setItem("auth-mode", mode);
  
  // 切換到後端模式時檢查健康狀態
  if (mode === 'backend') {
    await testBackendHealth();
  } else {
    backendHealth.value = { available: false, checked: false };
  }
  
  testResult.value = null;
};

const testValidation = async () => {
  testing.value = true;
  testResult.value = null;
  
  try {
    const result = await authService.validateToken();
    testResult.value = result;
    console.log('Token 驗證結果:', result);
  } catch (error) {
    testResult.value = {
      success: false,
      message: '測試過程中發生錯誤',
      error: error.message
    };
  } finally {
    testing.value = false;
  }
};

const testRefresh = async () => {
  testing.value = true;
  testResult.value = null;
  
  try {
    const result = await authService.refreshToken();
    testResult.value = result;
    console.log('Token 刷新結果:', result);
  } catch (error) {
    testResult.value = {
      success: false,
      message: '測試過程中發生錯誤',
      error: error.message
    };
  } finally {
    testing.value = false;
  }
};

const testBackendHealth = async () => {
  if (authMode.value !== 'backend') {
    testResult.value = {
      success: false,
      message: '此功能僅在後端模式下可用'
    };
    return;
  }
  
  testing.value = true;
  try {
    const health = await authService.checkBackendHealth();
    backendHealth.value = { ...health, checked: true };
    testResult.value = {
      success: health.available,
      message: health.available ? '後端服務正常' : '後端服務不可用',
      data: health
    };
  } catch (error) {
    testResult.value = {
      success: false,
      message: '檢查後端狀態時發生錯誤',
      error: error.message
    };
  } finally {
    testing.value = false;
  }
};

const quickLogin = async (account) => {
  if (authMode.value !== 'mock') {
    alert('快速登入僅在 Mock 模式下可用');
    return;
  }
  
  testing.value = true;
  try {
    const result = await authStore.login(account.username, account.password);
    testResult.value = {
      success: true,
      message: `快速登入成功: ${account.displayName}`,
      data: result
    };
  } catch (error) {
    testResult.value = {
      success: false,
      message: `快速登入失敗: ${account.displayName}`,
      error: error.message
    };
  } finally {
    testing.value = false;
  }
};

const clearAll = () => {
  sessionStorage.clear();
  sessionStorage.removeItem('auth-user');
  sessionStorage.removeItem('auth-token');
  sessionStorage.removeItem('auth-refresh-token');
  // 保留開發模式設置
  const devMode = sessionStorage.getItem("auth-mode");
  sessionStorage.clear();
  if (devMode) {
    sessionStorage.setItem("auth-mode", devMode);
  }
  window.location.reload();
};

// 初始化時檢查後端狀態
onMounted(async () => {
  if (authMode.value === 'backend') {
    await testBackendHealth();
  }
});
</script>

<style scoped>
.test-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.controls {
  margin-bottom: 30px;
}

.control-group {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #f9f9f9;
}

.control-group h3 {
  margin-top: 0;
  color: #333;
}

.button-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

button {
  padding: 8px 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

button:hover:not(:disabled) {
  background: #f0f0f0;
}

button.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

button.danger {
  background: #dc3545;
  color: white;
  border-color: #dc3545;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.mode-info {
  display: flex;
  gap: 15px;
  align-items: center;
}

.mode-indicator {
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: bold;
}

.mode-indicator.mock {
  background: #fff3cd;
  color: #856404;
}

.mode-indicator.backend {
  background: #d1ecf1;
  color: #0c5460;
}

.backend-status.healthy {
  color: #155724;
  background: #d4edda;
  padding: 4px 8px;
  border-radius: 4px;
}

.backend-status.unhealthy {
  color: #721c24;
  background: #f8d7da;
  padding: 4px 8px;
  border-radius: 4px;
}

.test-result {
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
}

.test-result.success {
  background: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
}

.test-result.error {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
}

.status-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 20px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  background: white;
  border-radius: 4px;
}

.status-item label {
  font-weight: bold;
}

.authenticated {
  color: #155724;
}

.unauthenticated {
  color: #721c24;
}

.storage-status {
  background: white;
  padding: 15px;
  border-radius: 4px;
  font-size: 12px;
  max-height: 200px;
  overflow: auto;
}

.test-accounts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}

.account-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
}

.account-btn.admin {
  background: #d4edda;
  border-color: #c3e6cb;
}

.account-btn.staff {
  background: #cce7ff;
  border-color: #b3d7ff;
}

.account-btn.volunteer {
  background: #fff3cd;
  border-color: #ffeaa7;
}

.account-btn.user {
  background: #f8f9fa;
  border-color: #e9ecef;
}

.warning-banner {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 15px;
  margin-top: 20px;
}

.warning-banner h4 {
  margin-top: 0;
  color: #856404;
}

.warning-banner ul {
  margin: 10px 0;
  padding-left: 20px;
}

pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>