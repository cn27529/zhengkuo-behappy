// src/stores/auth.js
import { defineStore } from "pinia";
import { ref } from "vue";

export const useAuthStore = defineStore("auth", () => {
  const user = ref(null);
  const isAuthenticated = ref(false);

  const login = (username, password) => {
    // 模拟登录API调用
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (username === "admin" && password === "password") {
          user.value = { username, role: "admin" };
          isAuthenticated.value = true;
          resolve({ success: true, message: "登录成功" });
        } else {
          reject({ success: false, message: "用户名或密码错误" });
        }
      }, 1000);
    });
  };

  const logout = () => {
    // 清除用户数据
    user.value = null;
    isAuthenticated.value = false;

    // 可选：清除本地存储中的认证信息
    localStorage.removeItem("auth-token");
    localStorage.removeItem("user-info");

    console.log("用户已退出登录");
  };

  return {
    user,
    isAuthenticated,
    login,
    logout,
  };
});
