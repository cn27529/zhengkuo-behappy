<!-- src/views/MockLogin.vue -->
<template>
  <div class="login-container">
    <!-- 原有的登入表單 -->

    <!-- 開發模式下的測試工具 -->
    <div v-if="isDevelopment" class="dev-login-tools">
      <h4>測試帳號快速登入</h4>
      <div class="test-accounts">
        <button
          v-for="account in testAccounts"
          :key="account.username"
          @click="fillTestAccount(account)"
          class="test-btn"
        >
          {{ account.displayName }} ({{ account.role }})
        </button>
      </div>

      <div class="mode-switcher">
        <label>當前模式: {{ currentAuthMode }}</label>
        <div class="mode-buttons">
          <button
            @click="switchAuthMode('mock')"
            :class="{ active: currentAuthMode === 'mock' }"
          >
            Mock 模式
          </button>
          <button
            @click="switchAuthMode('backend')"
            :class="{ active: currentAuthMode === 'backend' }"
          >
            後端模式
          </button>
          <button
            @click="switchAuthMode('directus')"
            :class="{ active: currentAuthMode === 'directus' }"
          >
            Directus 模式
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { authService } from "../services/authService.js";

const isDevelopment = computed(() => import.meta.env.VITE_DEV === "true");
const currentAuthMode = ref(import.meta.env.VITE_AUTH_MODE || "directus");

const testAccounts = [
  {
    username: "admin",
    password: "admin@123456",
    displayName: "阿德民",
    role: "admin",
  },
  {
    username: "zkuser01",
    password: "zk!123456",
    displayName: "廣小明",
    role: "staff",
  },
  {
    username: "temple_staff",
    password: "zk!123456",
    displayName: "寺廟工作人員",
    role: "staff",
  },
  {
    username: "volunteer",
    password: "zk!123456",
    displayName: "志工",
    role: "volunteer",
  },
  {
    username: "user01",
    password: "zk!123456",
    displayName: "一般用戶01",
    role: "user",
  },
];

const fillTestAccount = (account) => {
  // 填充表單數據
  // 假設有 form 響應式對象
  if (window.form) {
    window.form.username = account.username;
    window.form.password = account.password;
  }
};

const switchAuthMode = (mode) => {
  if (mode === currentAuthMode.value) return;

  currentAuthMode.value = mode;

  // 保存到 sessionStorage
  sessionStorage.setItem("auth-mode", mode);

  // 更新服務
  if (authService && authService.setMode) {
    authService.setMode(mode);
  }

  // 顯示提示
  alert(`已切換到 ${getModeDisplayName(mode)} 模式`);

  // 重新加載頁面以應用新模式
  setTimeout(() => {
    window.location.reload();
  }, 500);
};

const getModeDisplayName = (mode) => {
  const modeNames = {
    mock: "Mock",
    backend: "後端",
    directus: "Directus",
  };
  return modeNames[mode] || mode;
};

onMounted(() => {
  // 從 sessionStorage 讀取保存的模式
  const savedMode = sessionStorage.getItem("auth-mode");
  if (savedMode && ["mock", "backend", "directus"].includes(savedMode)) {
    currentAuthMode.value = savedMode;
  }
});
</script>

<style scoped>
.dev-login-tools {
  margin-top: 30px;
  padding: 20px;
  border: 1px dashed #ccc;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.test-accounts {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 15px 0;
}

.test-btn {
  padding: 8px 12px;
  border: 1px solid #4caf50;
  border-radius: 4px;
  background-color: white;
  color: #4caf50;
  cursor: pointer;
  transition: all 0.3s;
}

.test-btn:hover {
  background-color: #4caf50;
  color: white;
}

.mode-switcher {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #ddd;
}

.mode-buttons {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.mode-buttons button {
  padding: 8px 16px;
  border: 1px solid #2196f3;
  border-radius: 4px;
  background-color: white;
  color: #2196f3;
  cursor: pointer;
  transition: all 0.3s;
}

.mode-buttons button:hover {
  background-color: #e3f2fd;
}

.mode-buttons button.active {
  background-color: #2196f3;
  color: white;
}
</style>
