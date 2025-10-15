<template>
  <div>
    <h2>登入</h2>
    <form @submit.prevent="submit">
      <label>帳號
        <input v-model="form.username" placeholder="輸入帳號" />
      </label>
      <label>密碼
        <input v-model="form.password" type="password" placeholder="輸入密碼" />
      </label>
      <div v-if="error" class="error">{{ error }}</div>
      <button type="submit">登入</button>
      <div v-if="loading">驗證中…</div>
      <div v-if="token" class="success">登入成功！token: {{ token }}</div>
    </form>
    <p>測試帳號：<b>admin</b> / 密碼：<b>password</b></p>
  </div>
</template>

<script>
import { ref } from 'vue'
import api from '../services/mockApi'

export default {
  setup() {
    const form = ref({ username:'', password:'' })
    const loading = ref(false)
    const error = ref('')
    const token = ref('')

    async function submit() {
      error.value = ''
      token.value = ''
      loading.value = true
      try {
        const res = await api.login(form.value)
        token.value = res.token
      } catch (e) {
        error.value = e.message || '登入失敗'
      } finally {
        loading.value = false
      }
    }

    return { form, loading, error, submit, token }
  }
}
</script>
