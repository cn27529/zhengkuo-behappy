import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Contact from '../views/Contact.vue'

const routes = [
  { path: '/', name: 'Login', component: Login },
  { path: '/contact', name: 'Contact', component: Contact }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
