import { createRouter, createWebHistory } from "vue-router";
import LoginView from "../views/LoginView.vue";
import ContactView from "../views/ContactView.vue";
import WelcomeView from "../views/WelcomeView.vue";

const routes = [
  { path: "/", redirect: "/welcome" },
  {
    path: "/login",
    name: "Login",
    component: LoginView,
    meta: { hiddenNavBar: true },
  },
  {
    path: "/welcome",
    name: "Welcome",
    component: WelcomeView,
  },
  { path: "/contact", name: "Contact", component: ContactView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
