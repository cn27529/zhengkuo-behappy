// src/services/authService.js
import { authConfig, getApiUrl } from "../config/auth.js";
import userData from "../data/auth_user.json";

export class AuthService {
  constructor() {
    console.log(`AuthService 初始化: 當前模式為 ${authConfig.mode}`);
  }

  async login(username, password) {
    console.log(`登入請求 - 模式: ${authConfig.mode}, 用戶: ${username}`);

    // 在控制台輸出警告
    if (import.meta.env.VITE_DEV) {
      console.warn(
        "🚨 當前使用前端模擬認證，密碼為明碼儲存！\n" +
          "⚠️ 正式環境請切換到後端模式並移除密碼硬編碼。\n" +
          "🔒 可用帳號：admin, zkuser01, temple_staff, volunteer, user01"
      );
    }

    if (authConfig.mode === "mock") {
      return this.mockLogin(username, password);
    } else {
      return this.backendLogin(username, password);
    }
  }

  async logout() {
    if (authConfig.mode === "backend") {
      return this.backendLogout();
    }
    return { success: true };
  }

  async validateToken() {
    if (authConfig.mode === "mock") {
      return this.mockValidateToken();
    } else {
      return this.backendValidateToken();
    }
  }

  async refreshToken() {
    if (authConfig.mode === "mock") {
      return this.mockRefreshToken();
    } else {
      return this.backendRefreshToken();
    }
  }

  // ========== Mock 方法 ==========
  async mockLogin(username, password) {
    await this.mockDelay();

    // 對密碼進行簡單雜湊
    const hashPassword = (password) => {
      // 簡單的 base64 編碼（不是真正的安全，只是增加一點難度）
      return btoa(unescape(encodeURIComponent(password)));
    };

    const passwordMap = {
      admin: "password!123456",
      zkuser01: "zk!123456",
      temple_staff: "temple123",
      volunteer: "volunteer123",
      user01: "user0123",
    };

    const hashedInput = hashPassword(password);
    const storedHash = passwordMap[username];

    const isValidPassword =
      passwordMap[username] && passwordMap[username] === password;
    const userExists = userData.some((user) => user.username === username);

    //如果有用 passwordMap 的密碼有用 hashPassword 要走這段
    if (storedHash && storedHash === hashedInput) {
      // 登入成功
    }

    if (isValidPassword && userExists) {
      const foundUser = userData.find((user) => user.username === username);

      return {
        success: true,
        message: `模擬登入成功！歡迎 ${foundUser.displayName}`,
        data: {
          user: foundUser,
          token: `mock-token-${username}-${Date.now()}`,
          refreshToken: `mock-refresh-token-${username}-${Date.now()}`,
          expiresIn: 3600,
        },
      };
    } else {
      return {
        success: false,
        message: "用戶名或密碼錯誤",
        errorCode: "INVALID_CREDENTIALS",
      };
    }
  }

  async mockValidateToken() {
    await this.mockDelay();

    const savedUser = sessionStorage.getItem("auth-user");
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        return {
          success: true,
          data: { user },
        };
      } catch (error) {
        return {
          success: false,
          message: "Token 驗證失敗",
        };
      }
    }

    return {
      success: false,
      message: "未找到有效的 Token",
    };
  }

  async mockRefreshToken() {
    await this.mockDelay();

    const savedUser = sessionStorage.getItem("auth-user");
    if (savedUser) {
      const user = JSON.parse(savedUser);
      return {
        success: true,
        data: {
          token: `mock-token-${user.username}-${Date.now()}`,
          refreshToken: `mock-refresh-token-${user.username}-${Date.now()}`,
          expiresIn: 3600,
        },
      };
    }

    return {
      success: false,
      message: "刷新 Token 失敗",
    };
  }

  // ========== 後端 API 方法 ==========
  async backendLogin(username, password) {
    try {
      const response = await fetch(getApiUrl(authConfig.apiEndpoints.login), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        // 如果後端返回錯誤狀態碼
        const errorText = await response.text();
        throw new Error(`後端錯誤: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("後端登入請求失敗:", error);

      // 檢查是否是網路錯誤（後端服務未啟動）
      if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError")
      ) {
        return {
          success: false,
          message: "後端服務未啟動或網路連接失敗",
          errorCode: "BACKEND_NOT_AVAILABLE",
          details: "請確保後端服務正在運行，或切換到 Mock 模式進行測試",
        };
      }

      return {
        success: false,
        message: "後端服務錯誤",
        errorCode: "BACKEND_ERROR",
        details: error.message,
      };
    }
  }

  async backendLogout() {
    try {
      const token = sessionStorage.getItem("auth-token");

      // 如果沒有 token，直接返回成功
      if (!token) {
        return { success: true };
      }

      const response = await fetch(getApiUrl(authConfig.apiEndpoints.logout), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      // 即使後端登出失敗，也認為成功（因為前端狀態已經清除）
      if (!response.ok) {
        console.warn("後端登出失敗，但前端狀態已清除");
      }

      return { success: true };
    } catch (error) {
      console.error("後端登出請求失敗:", error);
      // 登出失敗不影響前端狀態清除
      return { success: true };
    }
  }

  async backendValidateToken() {
    try {
      const token = sessionStorage.getItem("auth-token");
      if (!token) {
        return { success: false, message: "未找到 Token" };
      }

      const response = await fetch(
        getApiUrl(authConfig.apiEndpoints.validate),
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Token 驗證失敗:", error);

      // 如果是網路錯誤，提供更友好的提示
      if (error.message.includes("Failed to fetch")) {
        return {
          success: false,
          message: "後端服務未啟動，無法驗證 Token",
          errorCode: "BACKEND_NOT_AVAILABLE",
        };
      }

      return {
        success: false,
        message: "Token 驗證失敗",
        errorCode: "VALIDATION_ERROR",
      };
    }
  }

  async backendRefreshToken() {
    try {
      const refreshToken = sessionStorage.getItem("auth-refresh-token");
      if (!refreshToken) {
        return { success: false, message: "未找到 Refresh Token" };
      }

      const response = await fetch(getApiUrl(authConfig.apiEndpoints.refresh), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Token 刷新失敗:", error);

      if (error.message.includes("Failed to fetch")) {
        return {
          success: false,
          message: "後端服務未啟動，無法刷新 Token",
          errorCode: "BACKEND_NOT_AVAILABLE",
        };
      }

      return {
        success: false,
        message: "Token 刷新失敗",
        errorCode: "REFRESH_ERROR",
      };
    }
  }

  // ========== 輔助方法 ==========
  async mockDelay() {
    return new Promise((resolve) => setTimeout(resolve, authConfig.mockDelay));
  }

  // 檢查後端連接狀態
  async checkBackendHealth() {
    try {
      const response = await fetch(getApiUrl("/health"), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      return {
        available: response.ok,
        status: response.status,
        statusText: response.statusText,
      };
    } catch (error) {
      return {
        available: false,
        error: error.message,
      };
    }
  }

  getCurrentMode() {
    return authConfig.mode;
  }

  setMode(mode) {
    if (["mock", "backend"].includes(mode)) {
      authConfig.mode = mode;
      console.log(`AuthService 模式已切換為: ${mode}`);

      // 如果是切換到後端模式，檢查後端狀態
      if (mode === "backend") {
        this.checkBackendHealth().then((health) => {
          if (!health.available) {
            console.warn("⚠️ 後端服務可能未啟動:", health);
          }
        });
      }
    } else {
      console.warn('無效的模式，請使用 "mock" 或 "backend"');
    }
  }
}

export const authService = new AuthService();
