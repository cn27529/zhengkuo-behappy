// src/stores/auth.js
import { defineStore } from "pinia";
import { ref } from "vue";
import userData from "../data/auth_user.json";

export const useAuthStore = defineStore("auth", () => {
  const user = ref(null);
  const isAuthenticated = ref(false);

  const lastActivity = ref(null);
  let inactivityTimer = null;

  const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15分鐘自動登出

  const resetInactivityTimer = () => {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }

    inactivityTimer = setTimeout(() => {
      console.log("閒置超時，自動登出");
      forceLogout();
    }, INACTIVITY_TIMEOUT);

    lastActivity.value = Date.now();
  };

  const setupActivityListeners = () => {
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
    ];
    events.forEach((event) => {
      document.addEventListener(event, resetInactivityTimer, true);
    });
  };

  const login = (username, password) => {
    // 導入模擬用戶數據
    console.log("模擬用戶數據:", userData);

    // 模拟登录API调用
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 在用戶數據中查找匹配的用戶
        const foundUser = userData.find(
          (user) => user.username === username && user.password === password
        );

        if (foundUser) {
          // 登入成功，設置用戶信息（不包含密碼）
          const { password: _, ...userInfo } = foundUser;
          user.value = userInfo;
          isAuthenticated.value = true;

          // 主要使用 sessionStorage
          sessionStorage.setItem("auth-user", JSON.stringify(user.value));

          // 可選：保存到localStorage
          localStorage.setItem("auth-user", JSON.stringify(userInfo));
          localStorage.setItem("auth-token", "mock-token-" + Date.now());
          // 可選：在localStorage存一個標記，用於顯示"記住我"功能
          localStorage.setItem("last-login-user", username);

          resetInactivityTimer();
          setupActivityListeners();

          resolve({
            success: true,
            message: `登入成功！歡迎 ${userInfo.nickname}`,
            user: userInfo,
          });
        } else {
          // 登入失敗
          reject({
            success: false,
            message: "用戶名或密碼錯誤",
            suggestions: getLoginSuggestions(username, userData),
          });
        }
      }, 100);
    });
  };

  const logout = () => {
    // 清除用戶數據
    user.value = null;
    isAuthenticated.value = false;

    // 清除計時器和監聽器
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }

    // 清除本地存儲中的認證信息
    localStorage.removeItem("auth-token");
    localStorage.removeItem("auth-user");

    console.log("用户已退出登录");
  };

  // 初始化時檢查本地存儲
  const initializeAuth = () => {
    const savedUser = localStorage.getItem("auth-user");
    if (savedUser) {
      try {
        user.value = JSON.parse(savedUser);
        isAuthenticated.value = true;

        console.log("auth store isAuthenticated:", isAuthenticated.value);

        // 重新啟動閒置檢測
        resetInactivityTimer();
        setupActivityListeners();

        console.log("auth store 從本地存儲恢復用戶會話:", user.value.nickname);
      } catch (error) {
        console.error("auth store 解析保存的用戶數據失敗:", error);
        logout();
      }
    }
  };

  // 檢查用戶權限
  const hasPermission = (permission) => {
    if (!user.value || !user.value.permissions) return false;
    return user.value.permissions.includes(permission);
  };

  // 檢查用戶角色
  const hasRole = (role) => {
    if (!user.value) return false;
    return user.value.role === role;
  };

  // 獲取所有用戶（僅管理員權限）
  const getUsers = () => {
    if (!hasRole("admin")) {
      throw new Error("權限不足");
    }
    return userData.map(({ password, ...user }) => user); // 移除密碼字段
  };

  return {
    user,
    isAuthenticated,
    login,
    logout,
    hasPermission,
    hasRole,
    getUsers,
    initializeAuth,
    resetInactivityTimer, // 暴露給組件使用
  };
});

// 輔助函數：提供登入建議
function getLoginSuggestions(username, userData) {
  const suggestions = [];

  // 檢查用戶名是否存在
  const usernameExists = userData.some((user) => user.username === username);

  if (!usernameExists) {
    suggestions.push("用戶名不存在");
    suggestions.push("可用的測試帳號: admin, temple_staff, volunteer, user01");
  } else {
    suggestions.push("用戶名存在，但密碼不正確");
    suggestions.push("請檢查密碼是否輸入正確");
  }

  return suggestions;
}
