<!-- src/components/SupabaseLoginForm.vue -->
<template>
  <div class="supabase-login-form">
    <div v-if="showResetPassword" class="reset-password-section">
      <h3>重設密碼</h3>
      <form @submit.prevent="handleResetPassword">
        <div class="form-group">
          <label for="reset-email">電子郵件</label>
          <input
            id="reset-email"
            v-model="resetEmail"
            type="email"
            placeholder="請輸入您的電子郵件"
            required
          />
        </div>
        <div class="form-actions">
          <button 
            type="submit" 
            class="btn-primary"
            :disabled="authStore.isLoading"
          >
            {{ authStore.isLoading ? '發送中...' : '發送重設郵件' }}
          </button>
          <button 
            type="button" 
            class="btn-secondary" 
            @click="showResetPassword = false"
            :disabled="authStore.isLoading"
          >
            返回登入
          </button>
        </div>
      </form>
    </div>

    <div v-else class="login-section">
      <form @submit.prevent="handleEmailLogin" class="login-form">
        <div class="form-group">
          <label for="email">電子郵件</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="請輸入電子郵件"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">密碼</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="請輸入密碼"
            required
          />
        </div>

        <div class="form-options">
          <label class="checkbox-label">
            <input type="checkbox" v-model="rememberMe" />
            <span>記住我</span>
          </label>
          <a href="#" class="forgot-password" @click.prevent="showResetPassword = true">
            忘記密碼？
          </a>
        </div>

        <button 
          type="submit" 
          class="btn-primary login-btn"
          :disabled="authStore.isLoading"
        >
          {{ authStore.isLoading ? '登入中...' : '登入' }}
        </button>
      </form>

      <div class="social-login-section" style="display: none;">
        <div class="divider">
          <span>或使用以下方式登入</span>
        </div>

        <div class="social-buttons">
          <button 
            type="button" 
            class="btn-google"
            @click="handleSocialLogin('google')"
            :disabled="authStore.isLoading"
          >
            <span class="social-icon">🔍</span>
            Google 登入
          </button>

          <button 
            type="button" 
            class="btn-github"
            @click="handleSocialLogin('github')"
            :disabled="authStore.isLoading"
          >
            <span class="social-icon">🐙</span>
            GitHub 登入
          </button>
        </div>
      </div>
    </div>

    <!-- 消息提示 -->
    <div v-if="message" :class="['message', messageType]">
      {{ message }}
    </div>

    <!-- 開發測試提示 -->
    <div class="dev-note" v-if="isDevelopment">
      <p><strong>開發提示：</strong>請確保已配置 Supabase 環境變量, env={{ import.meta.env.VITE_MODE }}</p>
    </div>
  </div>
</template>

<script>
import { ref, computed } from "vue"
import { useSupabaseAuthStore } from "../stores/supabase-auth.js"
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";

export default {
  name: 'SupabaseLogin',
  setup() {
    const authStore = useSupabaseAuthStore()
    const router = useRouter();
    
    // 表單數據
    const email = ref('')
    const password = ref('')
    const rememberMe = ref(false)
    const resetEmail = ref('')
    
    // 狀態
    const showResetPassword = ref(false)
    const message = ref('')
    const messageType = ref('') // 'success' or 'error'
    const mode = ref(import.meta.env.VITE_MODE)

    // 環境判斷
    const isDevelopment = computed(() => mode.value === 'development')

    // 顯示消息
    const showMessage = (text, type = 'error') => {
      message.value = text
      messageType.value = type
      setTimeout(() => {
        message.value = ''
        messageType.value = ''
      }, 5000)
    }

    // 郵箱/密碼登入
    const handleEmailLogin = async () => {
      if (!email.value || !password.value) {
        showMessage('請填寫電子郵件和密碼')
        return
      }

      const result = await authStore.loginWithEmail(email.value, password.value)
      
      console.log('Supabase Login result:', result)

      if (result.success) {
        showMessage(result.message, 'success')
        // 登入成功後的處理，例如路由跳轉
        setTimeout(() => {
          // 這裡可以觸發父組件的登入成功事件或路由跳轉
          //window.location.href = '/dashboard'
          router.push("/dashboard");
        }, 500)
      } else {
        showMessage(result.message)
      }
    }

    // 第三方登入
    const handleSocialLogin = async (provider) => {
      const result = await authStore.loginWithOAuth(provider)
      if (!result.success) {
        showMessage(result.message)
      }
      // OAuth 登入會跳轉到供應商頁面，所以不需要額外處理
    }

    // 重設密碼
    const handleResetPassword = async () => {
      if (!resetEmail.value) {
        showMessage('請輸入電子郵件地址')
        return
      }

      const result = await authStore.resetPassword(resetEmail.value)
      
      if (result.success) {
        showMessage(result.message, 'success')
        resetEmail.value = ''
        showResetPassword.value = false
      } else {
        showMessage(result.message)
      }
    }

    return {
      authStore,
      email,
      password,
      rememberMe,
      resetEmail,
      showResetPassword,
      message,
      messageType,
      isDevelopment,
      handleEmailLogin,
      handleSocialLogin,
      handleResetPassword,
      mode,
    }
  }
}
</script>

<style scoped>
.supabase-login-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.forgot-password {
  color: #007bff;
  text-decoration: none;
}

.forgot-password:hover {
  text-decoration: underline;
}

.btn-primary {
  width: 100%;
  padding: 0.75rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
}

.btn-primary:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.btn-secondary {
  width: 100%;
  padding: 0.75rem;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 0.5rem;
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-btn {
  margin-bottom: 1.5rem;
}

.social-login-section {
  margin-top: 1.5rem;
}

.divider {
  text-align: center;
  position: relative;
  margin: 1.5rem 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background-color: #ddd;
}

.divider span {
  background: white;
  padding: 0 1rem;
  position: relative;
  color: #6c757d;
}

.social-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.btn-google,
.btn-github {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.btn-google:hover:not(:disabled),
.btn-github:hover:not(:disabled) {
  background-color: #f8f9fa;
}

.btn-google:disabled,
.btn-github:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.social-icon {
  font-size: 1.2rem;
}

.message {
  padding: 0.75rem;
  border-radius: 4px;
  margin-top: 1rem;
  text-align: center;
}

.message.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.reset-password-section h3 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #333;
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.dev-note {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
  color: #856404;
  font-size: 0.875rem;
}

.dev-note p {
  margin: 0;
}
</style>