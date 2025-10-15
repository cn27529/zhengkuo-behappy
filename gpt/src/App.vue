<template>
  <div class="app">
    <header>
      <h1>Temple 活動報名（Demo）</h1>
      <nav>
        <router-link to="/">Login</router-link> |
        <router-link to="/contact">聯絡我們</router-link>
      </nav>
    </header>
    <main>
      <router-view />
    </main>
  </div>
</template>

<style>
body { font-family: Arial, Helvetica, sans-serif; margin:0; padding:0; }
.app { padding: 20px; max-width:900px; margin:0 auto; }
header { margin-bottom: 20px; }
form { max-width:600px; background:#fafafa; padding:16px; border-radius:8px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
label { display:block; margin-top:8px; }
input, textarea { width:100%; padding:8px; margin-top:4px; box-sizing:border-box; }
button { margin-top:12px; padding:8px 12px; border:none; border-radius:6px; cursor:pointer; }
.success { color: green; }
.error { color: red; }
</style>
