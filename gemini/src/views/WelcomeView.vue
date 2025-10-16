<template>
  
  <div class="common-layout">
    <el-container>
      <el-header>
        <el-menu mode="horizontal" :router="true">    
    <el-menu-item index="/login">登出</el-menu-item>    
  </el-menu>
      </el-header>
      <el-container>
        <el-aside width="100px">          
          <el-menu mode="vertical" :router="true">
    <el-menu-item index="/welcome">歡迎頁面</el-menu-item>
    <el-menu-item index="/contact">聯絡我們</el-menu-item>
  </el-menu>

        </el-aside>
        <el-main>
<div class="welcome-container">
    <h1>歡迎使用鎮國寺報名管理系統</h1>
    <p>您可以在此管理系統的各項功能。</p>
    <p>請點擊上方導覽列切換至不同功能頁面。</p>
  </div>

        </el-main>
      </el-container>
    </el-container>
  </div>

  

  

  
  

</template>

<style scoped>
.welcome-container {
  text-align: center;
  padding-top: 50px;
}
</style>

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


<script setup>

</script>