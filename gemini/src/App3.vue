<script setup>

</script>

<template>
  <el-menu mode="horizontal" :router="true">
    <el-menu-item index="/login">登入</el-menu-item>
    <el-menu-item index="/welcome">歡迎頁面</el-menu-item>
    <el-menu-item index="/contact">聯絡我們</el-menu-item>
  </el-menu>
  <main>
    <router-view></router-view>
  </main>
  <div style="display: none;">
    <a href="https://vite.dev" target="_blank">
      <img src="/vite.svg" class="logo" alt="Vite logo" />
    </a>
    <a href="https://vuejs.org/" target="_blank">
      <img src="./assets/vue.svg" class="logo vue" alt="Vue logo" />
    </a>
  </div>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
