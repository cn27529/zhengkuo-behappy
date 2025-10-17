<template>
  <div class="login-container">
    <h2>寺廟活動管理系統 - 登入</h2>
    <el-form @submit.prevent="handleLogin" class="login-form">
      <el-form-item label="帳號">
        <el-input v-model="username" placeholder="請輸入帳號"></el-input>
      </el-form-item>
      <el-form-item label="密碼">
        <el-input v-model="password" type="password" placeholder="請輸入密碼"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" native-type="submit" style="width: 100%;">登入</el-button>
      </el-form-item>
    </el-form>
    <p>測試帳號：<b>admin</b>密碼：<b>password</b></p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';
import api from '../services/mockApi'; 

const username = ref('');
const password = ref('');
const router = useRouter();

const handleLogin = () => {
  if (!username.value || !password.value) {
    ElMessage.error('帳號與密碼為必填');
    return;
  }
  // 模擬 API 登入
  ElMessage.success('登入成功！');
  console.log('登入資料:', { username: username.value, password: password.value });
  router.push('/welcome');
};

async function submit() {
      // error.value = ''
      // token.value = ''
      // loading.value = true
      try {
        const res = await api.login(form.value)
        //token.value = res.token
      } catch (e) {
        //error.value = e.message || '登入失敗'
      } finally {
        //loading.value = false
      }
    }

</script>

<style scoped>
.login-container { max-width: 300px; margin: 50px auto; padding: 20px; border: 1px solid #ccc; border-radius: 10px; }
h2 { text-align: center; }
/* .login-container:hover {
  filter: drop-shadow(0 0 3em #42b883aa);
} */
</style>