<!-- src/views/LoginView.vue -->
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
        <label>當前模式: {{ authMode }}</label>
        <button @click="toggleAuthMode">
          切換到 {{ authMode === 'mock' ? '後端' : 'Mock' }} 模式
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { authService } from '../services/authService';

const isDevelopment = computed(() => import.meta.env.VITE_DEV);
const authMode = ref(authService.getCurrentMode());

const testAccounts = [
  { username: 'admin', password: 'password!123456', displayName: '阿德民', role: 'admin' },
  { username: 'temple_staff', password: 'temple123', displayName: '寺廟工作人員', role: 'staff' },
  { username: 'volunteer', password: 'volunteer123', displayName: '志工', role: 'volunteer' },
  { username: 'user01', password: 'user0123', displayName: '一般用戶01', role: 'user' }
];

const fillTestAccount = (account) => {
  // 填充表單數據
  form.username = account.username;
  form.password = account.password;
};

const toggleAuthMode = () => {
  const newMode = authMode.value === 'mock' ? 'backend' : 'mock';
  authService.setMode(newMode);
  authMode.value = newMode;
  alert(`已切換到 ${newMode} 模式`);
};
</script>