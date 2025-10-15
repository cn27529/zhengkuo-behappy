<template>
  <div class='contact-container'>
    <h2>連絡我們</h2>
    <form @submit.prevent='handleSubmit'>
      <div>
        <label for='name'>姓名:</label>
        <input id='name' v-model='form.name' required />
      </div>
      <div>
        <label for='phone'>電話:</label>
        <input id='phone' v-model='form.phone' pattern='\\d{8,15}' required />
      </div>
      <div>
        <label for='email'>電子郵件:</label>
        <input id='email' type='email' v-model='form.email' required />
      </div>
      <div>
        <label for='message'>訊息內容:</label>
        <textarea id='message' v-model='form.message' required></textarea>
      </div>
      <button type='submit'>送出</button>
      <p v-if='submitMessage' style='color: green;'>{{ submitMessage }}</p>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';

const form = reactive({
  name: '',
  phone: '',
  email: '',
  message: ''
});
const submitMessage = ref('');

function handleSubmit() {
  // 模擬假資料接口成功送出
  setTimeout(() => {
    submitMessage.value = '您的訊息已成功送出，感謝聯絡！';
    form.name = '';
    form.phone = '';
    form.email = '';
    form.message = '';
  }, 800);
}
</script>

<style scoped>
.contact-container {
  max-width: 400px;
  margin: 30px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
}
</style>
