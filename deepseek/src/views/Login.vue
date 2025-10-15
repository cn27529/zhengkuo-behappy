<template>
  <div class="page login-container">
    <h2>系统登录</h2>
    <div class="welcome-message">
      <p>欢迎使用寺庙活动报名系统，请登录您的账户</p>
    </div>
    
    <LoginForm />
  </div>
</template>

<script>
import LoginForm from '../components/LoginForm.vue'

export default {
  name: 'Login',
  components: {
    LoginForm
  }
}
</script>