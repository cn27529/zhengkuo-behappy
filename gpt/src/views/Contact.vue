<template>
  <div>
    <h2>聯絡我們</h2>
    <form @submit.prevent="submit">
      <label>姓名
        <input v-model="form.name" placeholder="您的大名" />
      </label>
      <label>電話
        <input v-model="form.phone" placeholder="手機或聯絡電話" />
      </label>
      <label>電子郵件
        <input v-model="form.email" placeholder="example@mail.com" />
      </label>
      <label>內容
        <textarea v-model="form.message" rows="6" placeholder="寫下您的問題或建議"></textarea>
      </label>

      <div v-if="error" class="error">{{ error }}</div>
      <div v-if="success" class="success">{{ success }}</div>

      <button type="submit" :disabled="submitting">{{ submitting ? '送出中…' : '送出' }}</button>
    </form>
    <div style="margin-top:12px;">
      <strong>注意：</strong>目前為 Demo，表單會使用假資料接口回應（不會送到外網）。
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import api from '../services/mockApi'

export default {
  setup() {
    const form = ref({ name:'', phone:'', email:'', message:'' })
    const error = ref('')
    const success = ref('')
    const submitting = ref(false)

    function validate() {
      if (!form.value.name) return '請輸入姓名'
      if (!form.value.phone && !form.value.email) return '請至少提供電話或電子郵件'
      if (!form.value.message) return '請輸入內容'
      return ''
    }

    async function submit() {
      error.value = ''
      success.value = ''
      const v = validate()
      if (v) { error.value = v; return }
      submitting.value = true
      try {
        await api.submitContact(form.value)
        success.value = '送出成功，我們會儘快回覆您（Demo）'
        form.value = { name:'', phone:'', email:'', message:'' }
      } catch (e) {
        error.value = e.message || '送出失敗'
      } finally {
        submitting.value = false
      }
    }

    return { form, error, success, submit, submitting }
  }
}
</script>
