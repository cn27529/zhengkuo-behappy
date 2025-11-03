// 後端認證服務
import { axiosConfig, getApiUrl } from "../config/axiosConfig.js";
import { axiosService } from "./axiosService.js";
import userData from "../data/auth_user.json";

export class AuthService {
  constructor() {
    console.log(`AuthService 初始化: 當前模式為 ${axiosConfig.mode}`);
  }

  async login(username, password) {
    console.log(`登入請求 - 模式: ${axiosConfig.mode}, 用戶: ${username}`);

    // 在控制台輸出警告
    if (import.meta.env.VITE_DEV && axiosConfig.mode === "mock") {
      console.warn(
        "🚨 當前使用前端模擬認證，密碼為明碼儲存！\n" +
          "⚠️ 正式環境請切換到 Directus 模式。\n" +
          "🔒 可用帳號：admin, zkuser01, temple_staff, volunteer, user01"
      );
    }

    if (axiosConfig.mode === "mock") {
      return this.mockLogin(username, password);
    } else {
      return this.directusLogin(username, password);
    }
  }

  async logout() {
    if (axiosConfig.mode === "directus") {
      return this.directusLogout();
    }
    return { success: true };
  }

  async validateToken() {
    if (axiosConfig.mode === "mock") {
      return this.mockValidateToken();
    } else {
      return this.directusValidateToken();
    }
  }

  async refreshToken() {
    if (axiosConfig.mode === "mock") {
      return this.mockRefreshToken();
    } else {
      return this.directusRefreshToken();
    }
  }

  // ========== Mock 方法 ==========
  async mockLogin(username, password) {
    await this.mockDelay();

    const passwordMap = {
      admin: "password!123456",
      zkuser01: "zk!123456",
      temple_staff: "temple123",
      volunteer: "volunteer123",
      user01: "user0123",
    };

    const isValidPassword =
      passwordMap[username] && passwordMap[username] === password;
    const userExists = userData.some((user) => user.username === username);

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

  // ========== Directus API 方法 ==========
  async directusLogin(username, password) {
    try {
      // Directus 登入 API: POST /auth/login
      const response = await axiosService.post(axiosConfig.apiEndpoints.login, {
        email: username, // Directus 使用 email 欄位
        password: password,
      });

      if (response.data?.data) {
        const { access_token, refresh_token, expires } = response.data.data;

        // 儲存 tokens
        axiosService.setToken(access_token);
        axiosService.setRefreshToken(refresh_token);

        // 獲取用戶資料
        const userResponse = await axiosService.get(
          axiosConfig.apiEndpoints.profile
        );
        const user = userResponse.data?.data;

        // 儲存用戶資料
        const storage =
          axiosConfig.directus.tokenStorage === "local"
            ? localStorage
            : sessionStorage;
        storage.setItem("auth-user", JSON.stringify(user));

        return {
          success: true,
          message: `登入成功！歡迎 ${user.first_name || user.email}`,
          data: {
            user: {
              id: user.id,
              username: user.email,
              email: user.email,
              displayName: user.first_name
                ? `${user.first_name} ${user.last_name || ""}`.trim()
                : user.email,
              role: user.role?.name || "user",
              avatar: user.avatar,
              ...user,
            },
            token: access_token,
            refreshToken: refresh_token,
            expiresIn: expires,
          },
        };
      }

      return {
        success: false,
        message: "登入失敗：無效的響應格式",
        errorCode: "INVALID_RESPONSE",
      };
    } catch (error) {
      console.error("Directus 登入失敗:", error);

      // 處理不同的錯誤情況
      if (error.response) {
        // 伺服器返回錯誤
        const status = error.response.status;
        const errorData = error.response.data;

        if (status === 401) {
          return {
            success: false,
            message: "用戶名或密碼錯誤",
            errorCode: "INVALID_CREDENTIALS",
          };
        }

        return {
          success: false,
          message: errorData?.errors?.[0]?.message || "登入失敗",
          errorCode: "LOGIN_ERROR",
          details: errorData,
        };
      } else if (error.request) {
        // 請求發送但沒有收到響應
        return {
          success: false,
          message: "無法連接到 Directus 伺服器",
          errorCode: "DIRECTUS_NOT_AVAILABLE",
          details: "請確保 Directus 服務正在運行",
        };
      } else {
        // 其他錯誤
        return {
          success: false,
          message: "登入時發生錯誤",
          errorCode: "UNKNOWN_ERROR",
          details: error.message,
        };
      }
    }
  }

  async directusLogout() {
    try {
      const refreshToken = axiosService.getRefreshToken();

      if (refreshToken) {
        // Directus 登出 API: POST /auth/logout
        await axiosService.post(axiosConfig.apiEndpoints.logout, {
          refresh_token: refreshToken,
        });
      }

      // 清除本地儲存
      axiosService.clearTokens();

      return {
        success: true,
        message: "登出成功",
      };
    } catch (error) {
      console.error("Directus 登出失敗:", error);
      // 即使登出失敗，也清除本地 token
      axiosService.clearTokens();
      return {
        success: true,
        message: "登出成功（本地）",
      };
    }
  }

  async directusValidateToken() {
    try {
      const token = axiosService.getToken();
      if (!token) {
        return {
          success: false,
          message: "未找到 Token",
          errorCode: "NO_TOKEN",
        };
      }

      // Directus 使用 /users/me 驗證 token
      const response = await axiosService.get(axiosConfig.apiEndpoints.validate);

      if (response.data?.data) {
        const user = response.data.data;

        // 更新本地用戶資料
        const storage =
          axiosConfig.directus.tokenStorage === "local"
            ? localStorage
            : sessionStorage;
        storage.setItem("auth-user", JSON.stringify(user));

        return {
          success: true,
          data: {
            user: {
              id: user.id,
              username: user.email,
              email: user.email,
              displayName: user.first_name
                ? `${user.first_name} ${user.last_name || ""}`.trim()
                : user.email,
              role: user.role?.name || "user",
              avatar: user.avatar,
              ...user,
            },
          },
        };
      }

      return {
        success: false,
        message: "Token 驗證失敗：無效的響應",
        errorCode: "INVALID_RESPONSE",
      };
    } catch (error) {
      console.error("Token 驗證失敗:", error);

      // 清除無效的 token
      if (error.response?.status === 401) {
        axiosService.clearTokens();
      }

      return {
        success: false,
        message:
          error.response?.status === 401
            ? "Token 已過期或無效"
            : "Token 驗證失敗",
        errorCode:
          error.response?.status === 401 ? "TOKEN_EXPIRED" : "VALIDATION_ERROR",
      };
    }
  }

  async directusRefreshToken() {
    try {
      const refreshToken = axiosService.getRefreshToken();
      if (!refreshToken) {
        return {
          success: false,
          message: "未找到 Refresh Token",
          errorCode: "NO_REFRESH_TOKEN",
        };
      }

      // Directus 刷新 token API: POST /auth/refresh
      const response = await axiosService.post(
        axiosConfig.apiEndpoints.refresh,
        {
          refresh_token: refreshToken,
          mode: "json", // Directus 要求指定模式
        }
      );

      if (response.data?.data) {
        const { access_token, refresh_token, expires } = response.data.data;

        // 更新 tokens
        axiosService.setToken(access_token);
        axiosService.setRefreshToken(refresh_token);

        return {
          success: true,
          data: {
            token: access_token,
            refreshToken: refresh_token,
            expiresIn: expires,
          },
        };
      }

      return {
        success: false,
        message: "Token 刷新失敗：無效的響應",
        errorCode: "INVALID_RESPONSE",
      };
    } catch (error) {
      console.error("Token 刷新失敗:", error);

      // 如果 refresh token 也失效，清除所有 token
      if (error.response?.status === 401) {
        axiosService.clearTokens();
      }

      return {
        success: false,
        message: "Token 刷新失敗",
        errorCode:
          error.response?.status === 401
            ? "REFRESH_TOKEN_EXPIRED"
            : "REFRESH_ERROR",
      };
    }
  }

  // ========== 輔助方法 ==========
  async mockDelay() {
    return new Promise((resolve) => setTimeout(resolve, axiosConfig.mockDelay));
  }

  // 檢查 Directus 連接狀態
  async checkDirectusHealth() {
    return await axiosService.checkHealth();
  }

  getCurrentMode() {
    return axiosConfig.mode;
  }

  setMode(mode) {
    if (["mock", "directus"].includes(mode)) {
      axiosConfig.mode = mode;
      console.log(`AuthService 模式已切換為: ${mode}`);

      // 如果是切換到 Directus 模式，檢查服務狀態
      if (mode === "directus") {
        this.checkDirectusHealth().then((health) => {
          if (!health.available) {
            console.warn("⚠️ Directus 服務可能未啟動:", health);
          } else {
            console.log("✅ Directus 服務運行正常");
          }
        });
      }
    } else {
      console.warn('無效的模式，請使用 "mock" 或 "directus"');
    }
  }

  // 獲取當前用戶
  getCurrentUser() {
    const storage =
      axiosConfig.directus.tokenStorage === "local"
        ? localStorage
        : sessionStorage;
    const userStr = storage.getItem("auth-user");
    return userStr ? JSON.parse(userStr) : null;
  }
}

export const authService = new AuthService();
