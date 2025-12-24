<!-- src/components/EnvTest.vue -->
<template>
  <div>
    <h3>環境變量參數</h3>
    <p>VITE_SUPABASE_URL: {{ env.supabaseUrl }}</p>
    <p>VITE_SUPABASE_ANON_KEY:</p>
    <textarea
      v-model="env.supabaseAnonKey"
      rows="4"
      cols="50"
      readonly
    ></textarea>
    <p>VITE_SUPABASE_PUBLIC_KEY: {{ env.supabasePublicKey }}</p>
    <p>VITE_MODE: {{ env.mode }}</p>
    <p>VITE_APP_TITLE: {{ env.appTitle }}</p>
    <p>VITE_APP_VERSION: {{ env.appVersion }}</p>
    <p>VITE_AUTH_MODE: {{ env.authMode }}</p>
    <p>VITE_API_BASE_URL: {{ env.apiBaseUrl }}</p>
    <p>VITE_DEV: {{ env.dev }}</p>
    <p>VITE_APP_TIMEZONE: {{ env.appTimezone }}</p>
    <p>VITE_APP_LOCALE: {{ env.appLocale }}</p>
    <p>VITE_APP_HOUR12: {{ env.appHour12 }}</p>
    <p>VITE_LOG_RESPONSE: {{ env.logResponse }}</p>
    <p>VITE_LOG_LEVEL: {{ env.logLevel }}</p>
    <p>VITE_REMOTE_LOG_URL: {{ env.remoteLogUrl }}</p>
    <p>環境變量加載: {{ env.loaded ? "成功" : "失敗" }}</p>
  </div>
</template>

<script setup>
const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  supabasePublicKey: import.meta.env.VITE_SUPABASE_PUBLIC_KEY,
  mode: import.meta.env.VITE_MODE,
  appTitle: import.meta.env.VITE_APP_TITLE,
  appVersion: import.meta.env.VITE_APP_VERSION,
  authMode: import.meta.env.VITE_AUTH_MODE,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  dev: import.meta.env.VITE_DEV,
  appTimezone: import.meta.env.VITE_APP_TIMEZONE,
  appLocale: import.meta.env.VITE_APP_LOCALE,
  appHour12: import.meta.env.VITE_APP_HOUR12,
  logResponse: import.meta.env.VITE_LOG_RESPONSE,
  logLevel: import.meta.env.VITE_LOG_LEVEL,
  remoteLogUrl: import.meta.env.VITE_REMOTE_LOG_URL,
  // 判斷是否加載成功
  loaded: !!(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
  ),
};

console.log("環境變量:", env);
</script>
