<template>
  <div class="login-page" @click="enterFullscreen">
    <div class="page login-container">
      <h1 class="title">{{ appTitle }}</h1>
      <div class="welcome-message" v-if="false">
        <p>欢迎使用，请登录用户</p>
      </div>
      <LoginForm />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from "vue";
import LoginForm from "../components/LoginForm.vue";
import appConfig from "../config/appConfig.js";

//const appTitle = ref(appConfig.title);
const appTitle = computed(() => appConfig.title);

// 進入全螢幕
const enterFullscreen = () => {
  const el = document.documentElement;

  if (el.requestFullscreen) {
    el.requestFullscreen();
  } else if (el.webkitRequestFullscreen) {
    el.webkitRequestFullscreen(); // Safari
  }
};
</script>

<style scoped>
/* ===== 背景 ===== */
.login-page {
  min-height: 100vh;
  background: url("/zk4-bg.webp") no-repeat center center;
  background-size: cover;

  display: flex;
  justify-content: center;
  align-items: center;
  justify-content: flex-end;
}

.login-container {
  width: 100%;
  max-width: 400px;
  padding: 40px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.15); /* 白底卡片 */
  margin-right: 12%;

  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
}

.title {
  font-size: 30px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  margin-bottom: 25px;
  text-align: center;
}

.welcome-message {
  color: #fff;
}

/* 手機版 → 完全不要這些 scoped 樣式效果 */
@media (max-width: 768px) {
  .login-page {
    background: none;
    display: block;
    padding: 20px;
  }

  .login-container {
    margin: 0;
    max-width: 100%;
    padding: 20px;

    background: #fff;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;

    box-shadow: none;
    border: none;
    color: #000;
  }

  h1 {
    text-shadow: none;
    color: #000;
  }
}
</style>
