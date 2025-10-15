<template>
  <div>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="username">用户名</label>
        <input 
          type="text" 
          id="username" 
          v-model="loginForm.username" 
          placeholder="请输入用户名"
          required>
        <div class="error" v-if="errors.username">{{ errors.username }}</div>
      </div>
      
      <div class="form-group">
        <label for="password">密码</label>
        <input 
          type="password" 
          id="password" 
          v-model="loginForm.password" 
          placeholder="请输入密码"
          required>
        <div class="error" v-if="errors.password">{{ errors.password }}</div>
      </div>
      
      <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
        {{ loading ? '登录中...' : '登录' }}
      </button>
    </form>
    
    <div v-if="success" class="success-message">
      登录成功！正在跳转...
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

export default {
  name: 'LoginForm',
  setup() {
    const authStore = useAuthStore()
    const router = useRouter()
    
    const loginForm = reactive({
      username: '',
      password: ''
    })
    
    const errors = reactive({
      username: '',
      password: ''
    })
    
    const success = ref(false)
    const loading = ref(false)
    
    const validateForm = () => {
      let isValid = true
      
      // 重置错误信息
      Object.keys(errors).forEach(key => errors[key] = '')
      
      // 用户名验证
      if (!loginForm.username.trim()) {
        errors.username = '请输入用户名'
        isValid = false
      } else if (loginForm.username.length < 3) {
        errors.username = '用户名至少需要3个字符'
        isValid = false
      }
      
      // 密码验证
      if (!loginForm.password) {
        errors.password = '请输入密码'
        isValid = false
      } else if (loginForm.password.length < 6) {
        errors.password = '密码至少需要6个字符'
        isValid = false
      }
      
      return isValid
    }
    
    const handleLogin = async () => {
      if (!validateForm()) return
      
      loading.value = true
      
      try {
        await authStore.login(loginForm.username, loginForm.password)
        success.value = true
        
        // 模拟跳转延迟
        setTimeout(() => {
          alert('登录成功！在实际应用中，这里会跳转到仪表板页面。')
          success.value = false
        }, 1500)
      } catch (error) {
        alert(error.message)
      } finally {
        loading.value = false
      }
    }
    
    return {
      loginForm,
      errors,
      success,
      loading,
      handleLogin
    }
  }
}
</script>