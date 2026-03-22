<template>
  <div class="login-page">
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

<style scoped></style>
