// src/stores/auth.js
import { defineStore } from "pinia";
import { ref } from "vue";
import { authService } from "../services/authService.js";

export const useAuthStore = defineStore("auth", () => {
  const user = ref(null);
  const isAuthenticated = ref(false);
  const isLoading = ref(false);

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

  const login = async (username, password) => {
    isLoading.value = true;

    try {
      const result = await authService.login(username, password);

      if (result.success) {
        const userInfo = result.data.user;
        user.value = userInfo;
        isAuthenticated.value = true;

        // 儲存用戶信息和 Token
        sessionStorage.setItem("auth-user", JSON.stringify(userInfo));
        if (result.data.token) {
          sessionStorage.setItem("auth-token", result.data.token);
        }
        if (result.data.refreshToken) {
          sessionStorage.setItem(
            "auth-refresh-token",
            result.data.refreshToken
          );
        }

        resetInactivityTimer();
        setupActivityListeners();

        return {
          success: true,
          message: result.message || `登入成功！歡迎 ${userInfo.displayName}`,
          user: userInfo,
        };
      } else {
        const userExists = await checkUserExists(username);
        throw {
          success: false,
          message: result.message || "用戶名或密碼錯誤",
          suggestions: getLoginSuggestions(username, userExists),
          errorCode: result.errorCode,
        };
      }
    } catch (error) {
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = async () => {
    isLoading.value = true;

    try {
      // 呼叫後端登出（如果是後端模式）
      await authService.logout();
    } catch (error) {
      console.error("登出時發生錯誤:", error);
    } finally {
      // 無論如何都要清除前端狀態
      user.value = null;
      isAuthenticated.value = false;
      isLoading.value = false;

      // 清除計時器和監聽器
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        inactivityTimer = null;
      }

      // 清除本地存儲
      sessionStorage.removeItem("auth-user");
      sessionStorage.removeItem("auth-token");
      sessionStorage.removeItem("auth-refresh-token");

      console.log("用戶已退出登入");
    }
  };

  // 初始化時檢查認證狀態
  const initializeAuth = async () => {
    const savedUser = sessionStorage.getItem("auth-user");
    const savedToken = sessionStorage.getItem("auth-token");

    if (savedUser && savedToken) {
      try {
        // 驗證 Token 是否有效
        const validationResult = await authService.validateToken();

        if (validationResult.success) {
          user.value = JSON.parse(savedUser);
          isAuthenticated.value = true;

          console.log(
            "auth store 從本地存儲恢復用戶會話:",
            user.value.displayName
          );

          // 重新啟動閒置檢測
          resetInactivityTimer();
          setupActivityListeners();
        } else {
          // Token 無效，清除儲存
          console.log("Token 驗證失敗，強制登出");
          await logout();
        }
      } catch (error) {
        console.error("auth store 初始化失敗:", error);
        await logout();
      }
    }
  };

  // 檢查用戶是否存在（用於提供登入建議）
  const checkUserExists = async (username) => {
    if (authService.getCurrentMode() === "mock") {
      // 在 mock 模式下，我們可以直接檢查本地數據
      const userData = await import("../data/auth_user.json");
      return userData.default.some((user) => user.username === username);
    }
    // 在後端模式下，可能需要呼叫 API 檢查用戶是否存在
    return true; // 暫時返回 true，後端實現時再完善
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
  const getUsers = async () => {
    if (!hasRole("admin")) {
      throw new Error("權限不足");
    }

    if (authService.getCurrentMode() === "mock") {
      const userData = await import("../data/auth_user.json");
      return userData.default;
    } else {
      // 後端模式下需要呼叫 API
      throw new Error("後端獲取用戶列表功能尚未實現");
    }
  };

  // 獲取當前認證模式
  const getAuthMode = () => {
    return authService.getCurrentMode();
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    hasPermission,
    hasRole,
    getUsers,
    initializeAuth,
    resetInactivityTimer,
    getAuthMode,
  };
});

// 輔助函數：提供登入建議
function getLoginSuggestions(username, userExists) {
  const suggestions = [];

  if (!userExists) {
    suggestions.push("用戶名不存在");
    suggestions.push("可用的測試帳號: admin, temple_staff, volunteer, user01");
  } else {
    suggestions.push("用戶名存在，但密碼不正確");
    suggestions.push("請檢查密碼是否輸入正確");
  }

  return suggestions;
}

// 自動登出函數
const forceLogout = () => {
  const store = useAuthStore();
  store.logout();
};
