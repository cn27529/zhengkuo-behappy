<template>
  <div class="contact-container">
    <h2>聯絡我們</h2>
    <Form @submit="onSubmit" :validation-schema="schema" v-slot="{ isSubmitting }">
      <div class="form-group">
        <label for="name">姓名</label>
        <Field name="name" type="text" as="el-input" />
        <ErrorMessage name="name" class="error-msg" />
      </div>
      <div class="form-group">
        <label for="email">Email</label>
        <Field name="email" type="email" as="el-input" />
        <ErrorMessage name="email" class="error-msg" />
      </div>
      <div class="form-group">
        <label for="message">訊息內容</label>
        <Field name="message" as="el-input" type="textarea" :rows="4" />
        <ErrorMessage name="message" class="error-msg" />
      </div>
      <el-button type="primary" native-type="submit" :disabled="isSubmitting">送出</el-button>
    </Form>
  </div>
</template>

<script setup>
import { Form, Field, ErrorMessage, defineRule, configure } from 'vee-validate';
import { required, email } from '@vee-validate/rules';
import { localize, setLocale } from '@vee-validate/i18n';
import zh_TW from '@vee-validate/i18n/dist/locale/zh_TW.json';
import { ElMessage } from 'element-plus';

// --- Vee-Validate 設定 ---
// 定義規則
defineRule('required', required);
defineRule('email', email);

// 設定中文錯誤訊息
configure({
  generateMessage: localize({ zh_TW }),
});
setLocale('zh_TW');
// --- Vee-Validate 設定結束 ---

// 表單驗證結構
const schema = {
  name: 'required',
  email: 'required|email',
  message: 'required',
};

// 提交函式
const onSubmit = (values, { resetForm }) => {
  // 模擬送出到 API
  console.log('表單已送出:', values);
  ElMessage.success('訊息已成功送出！');
  resetForm(); // 清空表單
};
</script>

<style scoped>
.contact-container { 
  max-width: 500px; margin: 50px auto; padding: 20px; border: 1px solid #ccc; border-radius: 10px; }
.form-group { margin-bottom: 20px; }
.error-msg { color: red; font-size: 0.8em; }
label { display: block; margin-bottom: 5px; }
</style>