import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/Login.vue';
import Contact from '../views/Contact.vue';

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  { path: '/contact', component: Contact },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
