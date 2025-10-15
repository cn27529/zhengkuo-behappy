import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

import App from './App.vue'
import './style.css'

// 导入视图组件
import Login from './views/Login.vue'
import Contact from './views/Contact.vue'

// 路由配置
const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  { path: '/contact', component: Contact }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 创建Pinia实例
const pinia = createPinia()

// 创建Vue应用
const app = createApp(App)

// 使用路由和状态管理
app.use(router)
app.use(pinia)

// 挂载应用
app.mount('#app')