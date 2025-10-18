// src/main.js
import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import "./style.css";

// 导入路由配置
import router from "./router";

// 创建Pinia实例
const pinia = createPinia();

// 创建Vue应用
const app = createApp(App);

// 使用路由和状态管理
app.use(router);
app.use(pinia);
app.use(ElementPlus); // 使用Element Plus组件库

// 挂载应用
app.mount("#app");
