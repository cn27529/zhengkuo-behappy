<template>
  <div class='login-container'>
    <h2>登入頁面</h2>
    <form @submit.prevent='handleLogin'>
      <div>
        <label for='username'>帳號:</label>
        <input id='username' v-model='username' required />
      </div>
      <div>
        <label for='password'>密碼:</label>
        <input id='password' type='password' v-model='password' required />
      </div>
      <div>
        <button type='submit'>登入</button>
      </div>
      <p v-if='errorMessage' style='color: red;'>{{ errorMessage }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const username = ref('');
const password = ref('');
const errorMessage = ref('');
const router = useRouter();

const mockUser = { username: 'user1', password: 'pass123' };

function handleLogin() {
  if (username.value === mockUser.username && password.value === mockUser.password) {
    errorMessage.value = '';
    router.push('/contact');
  } else {
    errorMessage.value = '帳號或密碼錯誤';
  }
}
</script>

<style scoped>
.login-container {
  max-width: 300px;
  margin: 50px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
}
</style>
