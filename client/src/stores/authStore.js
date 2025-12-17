// src/stores/authStore.js
import { defineStore } from "pinia";
import { ref } from "vue";
import { authService } from "../services/authService.js";
import userData from "../data/auth_user.json";

export const useAuthStore = defineStore("auth", () => {
  const userInfo = ref(null);
  const isAuthenticated = ref(false);
  const isLoading = ref(false);

  const authMode = ref(authService.getCurrentMode());
  const isDev = ref(authService.getCurrentDev());

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

      console.log("登入結果:", JSON.stringify(result));

      if (result.success) {
        userInfo.value = result.data.user;
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

  // ========== 2FA 專用登入方法 ==========
  const loginWith2FA = async (username, password) => {
    isLoading.value = true;

    try {
      const result = await authService.directus2FALogin(username, password);

      console.log("2FA 登入結果:", JSON.stringify(result));

      // 如果需要 2FA 驗證
      if (result.requires2FA) {
        return {
          requires2FA: true,
          tempToken: result.tempToken,
          message: result.message || "需要兩步驟驗證",
        };
      }

      // 如果不需要 2FA，直接成功
      if (result.success) {
        userInfo.value = result.data.user;
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

  // ========== 2FA 驗證方法 ==========
  const verify2FA = async (tempToken, otpCode) => {
    isLoading.value = true;

    try {
      const result = await authService.verify2FA(tempToken, otpCode);

      console.log("2FA 驗證結果:", JSON.stringify(result));

      if (result.success) {
        userInfo.value = result.data.user;
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
          message: result.message || "兩步驟驗證成功！",
          user: userInfo,
        };
      } else {
        throw {
          success: false,
          message: result.message || "兩步驟驗證失敗",
          errorCode: result.errorCode,
          isRetryable: result.errorCode === "INVALID_OTP", // 標記是否可以重試
        };
      }
    } catch (error) {
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  // ========== 檢查 2FA 狀態的方法 ==========
  const check2FAStatus = async (username) => {
    try {
      // 這裡可以實現檢查用戶是否啟用了 2FA 的邏輯
      // 目前先返回模擬數據
      if (authService.getCurrentMode() === "mock") {
        // 模擬檢查：特定用戶需要 2FA
        const usersRequire2FA = ["admin", "zkuser01"];
        return {
          requires2FA: usersRequire2FA.includes(username),
          message: usersRequire2FA.includes(username)
            ? "此用戶需要兩步驟驗證"
            : "此用戶不需要兩步驟驗證",
        };
      }

      // 在實際環境中，這裡可以呼叫 API 檢查用戶的 2FA 狀態
      return {
        requires2FA: false,
        message: "2FA 狀態檢查功能待實現",
      };
    } catch (error) {
      console.error("檢查 2FA 狀態失敗:", error);
      return {
        requires2FA: false,
        message: "檢查 2FA 狀態時發生錯誤",
      };
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
      userInfo.value = null;
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
          userInfo.value = JSON.parse(savedUser);
          isAuthenticated.value = true;

          console.log(
            "auth store 從本地存儲恢復用戶會話:",
            userInfo.value.displayName
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
      return userData.default.some((user) => user.username === username);
    }
    // 在後端模式下，可能需要呼叫 API 檢查用戶是否存在
    return true; // 暫時返回 true，後端實現時再完善
  };

  // 檢查用戶權限
  const hasPermission = (permission) => {
    if (!userInfo.value || !userInfo.value.permissions) return false;
    return userInfo.value.permissions.includes(permission);
  };

  // 檢查用戶角色
  const hasRole = (role) => {
    if (!userInfo.value) return false;
    return userInfo.value.role === role;
  };

  // 獲取所有用戶（僅管理員權限）
  const getUsers = async () => {
    if (!hasRole("admin")) {
      throw new Error("權限不足");
    }

    if (authService.getCurrentMode() === "mock") {
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

  const getDev = () => {
    return authService.getCurrentDev();
  };

  // 检测是否为移动設备
  const isMobileDevice = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const screenWidth = window.innerWidth;
    const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

    const mobileKeywords = [
      "android",
      "iphone",
      "ipad",
      "ipod",
      "blackberry",
      "windows phone",
      "webos",
      "opera mini",
      "iemobile",
      "mobile",
    ];

    return (
      mobileKeywords.some((keyword) => userAgent.includes(keyword)) ||
      (screenWidth <= 768 && hasTouch)
    );
  };

  const detectDeviceType = () => {
    const userAgent = navigator.userAgent;
    const screenWidth = window.innerWidth;

    // 更精確的移動設備檢測
    const isMobile = {
      // User Agent 檢測
      byUA: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        userAgent
      ),
      // 屏幕尺寸 + 觸控
      byScreen:
        screenWidth <= 768 &&
        ("ontouchstart" in window || navigator.maxTouchPoints > 0),
      // 特定移動特徵
      byFeatures:
        !!userAgent.match(/iPhone|Android/i) && "ontouchstart" in window,
    };

    return isMobile.byUA || isMobile.byScreen || isMobile.byFeatures
      ? "mobile"
      : "desktop";
  };

  return {
    user: userInfo,
    isAuthenticated,
    isLoading,
    authMode,
    isDev,
    // 原有的登入方法
    login,
    // 新增的 2FA 方法
    loginWith2FA,
    verify2FA,
    check2FAStatus,
    logout,
    hasPermission,
    hasRole,
    getUsers,
    initializeAuth,
    resetInactivityTimer,
    getAuthMode,
    getDev,
    isMobileDevice,
    detectDeviceType,
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
