<template>
  <div class="page login-container">
    <h2>系统登录</h2>
    <div class="welcome-message">
      <p>欢迎使用{{ appTitle }}，请登录用户</p>
    </div>
    
    <LoginForm />
  </div>
</template>

<script>
import LoginForm from "../components/LoginForm.vue"
import appConfig from "../config/appConfig.js"

export default {
  name: 'Login',
  setup() {
    
    return {
      appTitle: appConfig.title,
    }

  },
  components: {
    LoginForm
  }
}
</script>