<template>
  <div class="page login-container">
    <h2>系统登录</h2>
    <div class="welcome-message">
      <p>欢迎使用{{ appTitle }}，请登录用户</p>
    </div>
    <LoginForm />
  </div>
</template>

<script setup>
import { computed } from "vue";
import LoginForm from "../components/LoginForm.vue";
import appConfig from "../config/appConfig.js";

//const appTitle = ref(appConfig.title);
const appTitle = computed(() => appConfig.title);
</script>
