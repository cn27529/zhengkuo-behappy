<template>
  <div class="app-container">
    <header>
      <div class="header-content">
        <div class="logo">
          <div class="logo-icon">🛕</div>
          <h1>寺庙活动报名系统</h1>
        </div>
        <nav>
          <ul>
            <li><router-link to="/login">登录</router-link></li>
            <li><router-link to="/contact">联系我们</router-link></li>
          </ul>
        </nav>
      </div>
    </header>
    
    <main>
      <router-view></router-view>
    </main>
    
    <footer>
      <p>© 2023 寺庙活动报名系统 | 弘扬佛法，服务众生</p>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>