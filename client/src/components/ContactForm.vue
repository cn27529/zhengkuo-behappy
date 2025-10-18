<template>
  <div>
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="name">姓名</label>
        <input 
          type="text" 
          id="name" 
          v-model="contactForm.name" 
          placeholder="请输入您的姓名"
          required>
        <div class="error" v-if="errors.name">{{ errors.name }}</div>
      </div>
      
      <div class="form-group">
        <label for="email">电子邮箱</label>
        <input 
          type="email" 
          id="email" 
          v-model="contactForm.email" 
          placeholder="请输入您的电子邮箱"
          required>
        <div class="error" v-if="errors.email">{{ errors.email }}</div>
      </div>
      
      <div class="form-group">
        <label for="phone">联系电话</label>
        <input 
          type="tel" 
          id="phone" 
          v-model="contactForm.phone" 
          placeholder="请输入您的联系电话"
          required>
        <div class="error" v-if="errors.phone">{{ errors.phone }}</div>
      </div>
      
      <div class="form-group">
        <label for="subject">主题</label>
        <select id="subject" v-model="contactForm.subject" required>
          <option value="" disabled selected>请选择主题</option>
          <option value="activity">活动咨询</option>
          <option value="donation">捐赠事宜</option>
          <option value="volunteer">志工服务</option>
          <option value="other">其他</option>
        </select>
        <div class="error" v-if="errors.subject">{{ errors.subject }}</div>
      </div>
      
      <div class="form-group">
        <label for="message">留言内容</label>
        <textarea 
          id="message" 
          v-model="contactForm.message" 
          rows="5" 
          placeholder="请输入您的留言内容"
          required></textarea>
        <div class="error" v-if="errors.message">{{ errors.message }}</div>
      </div>
      
      <button type="submit" class="btn btn-primary" :disabled="loading">
        {{ loading ? '提交中...' : '提交' }}
      </button>
    </form>
    
    <div v-if="success" class="success-message">
      感谢您的留言！我们已经收到您的信息，将尽快与您联系。
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'

export default {
  name: 'ContactForm',
  setup() {
    const contactForm = reactive({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    })
    
    const errors = reactive({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    })
    
    const success = ref(false)
    const loading = ref(false)
    
    const validateForm = () => {
      let isValid = true
      
      // 重置错误信息
      Object.keys(errors).forEach(key => errors[key] = '')
      
      // 姓名验证
      if (!contactForm.name.trim()) {
        errors.name = '请输入姓名'
        isValid = false
      }
      
      // 邮箱验证
      if (!contactForm.email.trim()) {
        errors.email = '请输入电子邮箱'
        isValid = false
      } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(contactForm.email)) {
        errors.email = '请输入有效的电子邮箱地址'
        isValid = false
      }
      
      // 电话验证
      if (!contactForm.phone.trim()) {
        errors.phone = '请输入联系电话'
        isValid = false
      } else if (!/^[0-9+\-\s()]{7,15}$/.test(contactForm.phone)) {
        errors.phone = '请输入有效的联系电话'
        isValid = false
      }
      
      // 主题验证
      if (!contactForm.subject) {
        errors.subject = '请选择主题'
        isValid = false
      }
      
      // 留言内容验证
      if (!contactForm.message.trim()) {
        errors.message = '请输入留言内容'
        isValid = false
      } else if (contactForm.message.length < 10) {
        errors.message = '留言内容至少需要10个字符'
        isValid = false
      }
      
      return isValid
    }
    
    const handleSubmit = () => {
      if (!validateForm()) return
      
      loading.value = true
      
      // 模拟API调用
      setTimeout(() => {
        console.log('提交的联系表单数据:', contactForm)
        
        // 显示成功消息
        success.value = true
        
        // 重置表单
        Object.keys(contactForm).forEach(key => contactForm[key] = '')
        
        // 3秒后隐藏成功消息
        setTimeout(() => {
          success.value = false
        }, 5000)
        
        loading.value = false
      }, 1500)
    }
    
    return {
      contactForm,
      errors,
      success,
      loading,
      handleSubmit
    }
  }
}
</script>