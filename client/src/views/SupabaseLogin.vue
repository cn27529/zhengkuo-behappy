<!-- src/views/SupabaseLogin.vue -->
<template>
  <div class="page login-container">
    <h2>系統登入</h2>
    <div class="welcome-message">
      <p>歡迎使用{{ appTitle }}，請選擇登入方式</p>
    </div>
    <SupabaseLoginForm />
  </div>
</template>

<script>
import { computed } from "vue";
import SupabaseLoginForm from "../components/SupabaseLoginForm.vue";
import appConfig from "../config/appConfig";

//const appTitle = ref(appConfig.title);
const appTitle = computed(() => appConfig.title);
</script>

<style scoped>
.login-options {
  text-align: center;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #eee;
}

.login-options a {
  color: #007bff;
  text-decoration: none;
}

.login-options a:hover {
  text-decoration: underline;
}
</style>
