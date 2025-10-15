import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    isAuthenticated: false
  }),
  
  actions: {
    login(username, password) {
      // 模拟登录API调用
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (username === 'admin' && password === 'password') {
            this.user = { username, role: 'admin' }
            this.isAuthenticated = true
            resolve({ success: true, message: '登录成功' })
          } else {
            reject({ success: false, message: '用户名或密码错误' })
          }
        }, 1000)
      })
    },
    
    logout() {
      this.user = null
      this.isAuthenticated = false
    }
  }
})