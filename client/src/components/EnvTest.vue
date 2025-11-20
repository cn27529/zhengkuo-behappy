<!-- src/components/EnvTest.vue -->
<template>
  <div>
    <h3>環境變量參數</h3>
    <p>VITE_SUPABASE_URL: {{ env.supabaseUrl }}</p>
    <p>VITE_SUPABASE_ANON_KEY:</p>
    <input type="text-area" v-model="env.supabaseAnonKey" />
    <p>VITE_SUPABASE_PUBLIC_KEY: {{ env.supabasePublicKey }}</p>
    <p>MODE: {{ env.mode }}</p>
    <p>应用标题: {{ env.appTitle }}</p>
    <p>应用版本: {{ env.appVersion }}</p>
    <p>环境变量加载: {{ env.loaded ? '成功' : '失败' }}</p>
  </div>
</template>

<script>
export default {
  setup() {
    const env = {
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      supabasePublicKey: import.meta.env.VITE_SUPABASE_PUBLIC_KEY,
      mode: import.meta.env.VITE_MODE,
      appTitle: import.meta.env.VITE_APP_TITLE,
      appVersion: import.meta.env.VITE_APP_VERSION,
      // 判断是否加载成功
      loaded: !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
    }
    
    console.log('环境变量:', env)
    
    return {
      env
    }
  }
}
</script>