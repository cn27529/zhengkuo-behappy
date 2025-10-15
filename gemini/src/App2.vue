<template>
  <el-menu mode="horizontal" :router="true">
    <el-menu-item index="/login">登入頁面</el-menu-item>
    <el-menu-item index="/contact">聯絡我們</el-menu-item>
  </el-menu>
  <main>
    <router-view></router-view>
  </main>
</template>

<style>
main {
  padding: 20px;
}
</style>