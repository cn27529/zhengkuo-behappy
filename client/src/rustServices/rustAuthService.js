// src/rustServices/rustAuthService.js
import { baseRustService } from "./baseRustService.js";
import userData from "../data/auth_user.json";

export class RustAuthService {
  constructor() {
    this.serviceName = "RustAuthService";
    this.base = baseRustService;
    this.endpoint = this.base.endpoints.auth;
    console.log(`RustAuthService 初始化: 當前模式為 ${this.base.mode}`);
  }

  /**
   * Rust 登入（可能使用不同於 Directus 的認證方式）
   */
  async backendLogin(credentials, context = {}) {
    const result = await this.base.rustFetch(
      this.endpoint.login,
      {
        method: "POST",
        body: JSON.stringify(credentials),
      },
      {
        operation: "login",
        ...context,
      },
    );

    // 保存 Rust 專用令牌
    if (result.data?.token) {
      this.base.setRustToken(result.data.token, credentials.remember || false);
    }

    return result;
  }

  /**
   * 登出
   */
  async logout(context = {}) {
    const result = await this.base.rustFetch(
      this.endpoint.logout,
      {
        method: "POST",
      },
      {
        operation: "logout",
        ...context,
      },
    );

    // 清除令牌
    this.base.clearRustToken();

    return result;
  }

  async validateToken() {
    const currentMode = this.getCurrentMode();
    console.log(`驗證 Token - 當前模式: ${currentMode}`);

    if (currentMode === "mock") {
      return this.mockValidateToken();
    } else  (currentMode === "directus") {
      return this.directusValidateToken();
    }
  }

  /**
   * 刷新令牌
   */
  async refreshToken(context = {}) {
    if (this.base.mode === "mock") {
      return this.mockRefreshToken();
    } else {
      return this.directusValidateToken();
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
      admin: "admin@123456",
      zkuser01: "zk!123456",
      temple_staff: "zk!123456",
      volunteer: "zk!123456",
      user01: "zk!123456",
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

  async directusValidateToken() {
    try {
      const token = sessionStorage.getItem("auth-token");
      if (!token) {
        return { success: false, message: "未找到 Token" };
      }

      const response = await this.base.rustFetch(
        this.endpoint.me,
        {
          method: "GET",
        },
        // 沒有 context 參數
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.data) {
        return {
          success: true,
          data: {
            token: result.data.access_token,
            refreshToken: result.data.refresh_token,
            expiresIn: result.data.expires || 3600,
          },
        };
      } else {
        throw new Error("Rust 返回數據格式錯誤");
      }
    } catch (error) {
      console.error("Rust Token 刷新失敗:", error);

      if (error.message.includes("Failed to fetch")) {
        return {
          success: false,
          message: "Rust 服務未啟動，無法刷新 Token",
          errorCode: "RUST_NOT_AVAILABLE",
        };
      }

      return {
        success: false,
        message: "Rust Token 刷新失敗",
        errorCode: "RUST_VALIDATE_ERROR",
      };
    }
  }

  async directusRefreshToken(additionalContext = {}) {
    try {
      const refreshToken = sessionStorage.getItem("auth-refresh-token");
      if (!refreshToken) {
        return { success: false, message: "未找到 Refresh Token" };
      }

      const response = await this.base.rustFetch(
        this.endpoint.refresh,
        {
          method: "POST",
        },
        {
          operation: "refreshToken",
          ...context,
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.data) {
        return {
          success: true,
          data: {
            token: result.data.access_token,
            refreshToken: result.data.refresh_token,
            expiresIn: result.data.expires || 3600,
          },
        };
      } else {
        throw new Error("Rust 返回數據格式錯誤");
      }
    } catch (error) {
      console.error("Rust Token 刷新失敗:", error);

      if (error.message.includes("Failed to fetch")) {
        return {
          success: false,
          message: "Rust 服務未啟動，無法刷新 Token",
          errorCode: "RUST_NOT_AVAILABLE",
        };
      }

      return {
        success: false,
        message: "Rust Token 刷新失敗",
        errorCode: "RUST_REFRESH_ERROR",
      };
    }
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
  async directusLogin(username, password) {
    try {
      const apiUrl = `${this.base.apiBaseUrl}${this.base.apiEndpoints.authLogin}`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: username, // Directus 通常使用 email
          password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Directus 錯誤: ${response.status}`,
        );
      }

      const result = await response.json();

      // Directus 返回的數據結構
      if (result.data) {
        // Directus 返回的數據
        //console.log("Directus 返回的數據:", result.data);

        const { access_token, refresh_token, expires } = result.data;

        // 獲取用戶資訊
        const apiUrl = `${this.base.apiBaseUrl}${this.base.apiEndpoints.usersMe}`;
        const userResponse = await fetch(apiUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        });

        let userData = null;
        if (userResponse.ok) {
          const userResult = await userResponse.json();
          console.log("Directus 返回用戶資訊:", userResult.data);
          userData = userResult.data;
          // Directus 返回的用戶資訊沒有顯示名稱，displayName使用填寫的email
          userData.displayName = `${userResult.data.first_name}${userResult.data.last_name}`;
        } else {
          console.error("Directus 返回用戶資訊發生錯誤:", ...userResponse);
        }

        return {
          success: userResponse.ok,
          message: "Directus 登入成功",
          data: {
            user: userData || { username, displayName: username },
            token: access_token,
            refreshToken: refresh_token,
            expiresIn: expires || 3600,
          },
        };
      } else {
        throw new Error("Directus 返回數據格式錯誤");
      }
    } catch (error) {
      console.error("Directus 登入請求失敗:", error);

      // 檢查網路錯誤
      if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError")
      ) {
        return {
          success: false,
          message: "Directus 服務未啟動或網路連接失敗",
          errorCode: "DIRECTUS_NOT_AVAILABLE",
          details: "請確保 Directus 服務正在運行",
        };
      }

      return {
        success: false,
        message: error.message || "Directus 登入失敗",
        errorCode: "DIRECTUS_LOGIN_ERROR",
        details: error.message,
      };
    }
  }

  /**
   * 檢查認證狀態
   */
  async checkAuth(context = {}) {
    try {
      const user = await this.getCurrentUser(context);
      return {
        authenticated: true,
        user: user.data,
      };
    } catch (error) {
      console.error("檢查認證狀態失敗:", error);
      return {
        authenticated: false,
        error: error.message,
      };
    }
  }

  getToken() {
    try {
      const token = sessionStorage.getItem("auth-token");
      return token;
    } catch (error) {
      console.error("獲取 Token 失敗:", error);
      return null;
    }
  }

  // ========== 輔助方法 ==========
  async mockDelay() {
    return new Promise((resolve) => setTimeout(resolve, this.base.mockDelay));
  }

  handleAuthError(error) {
    return this.base.handleRustError(error);
  }

  getCurrentMode() {
    if (sessionStorage.getItem("auth-mode") !== null) {
      this.base.mode = sessionStorage.getItem("auth-mode");
    }
    console.log("getCurrentMode: ", this.base.mode);
    return this.base.mode;
  }

  getCurrentDev() {
    if (sessionStorage.getItem("auth-dev") !== null) {
      this.base.isDev = sessionStorage.getItem("auth-dev") === "true";
    }
    //console.log("getCurrentDev: ", this.base.isDev);
    return this.base.isDev;
  }

  // 修改 setDev 方法 ,用於設置是否為開發模式，可開啟調試模式
  setDev(isDev) {
    console.log("setDev: ", isDev);
    this.base.isDev = Boolean(isDev);
    sessionStorage.setItem("auth-dev", String(isDev));
    console.log(`🔧 開發模式已切換為: ${this.base.isDev} `);
  }

  // 修改 setMode 方法中的健康檢查
  setMode(mode) {
    this.base.mode = mode;
    console.log(`開發模式已切換為: ${mode}`);
    sessionStorage.setItem("auth-mode", mode);

    if (["mock", "backend", "directus"].includes(mode)) {
      // 健康檢查
      if (mode === "backend") {
        // 檢查後端連接狀態

        this.base.healthCheck().then((healthCheck) => {
          if (healthCheck.online) {
            console.log("✅ 後端服務健康檢查通過");
          } else {
            console.warn("⚠️ 後端服務可能未啟動:", healthCheck);
          }
        });
      } else if (mode === "directus") {
        // 檢查後端連接狀態
        this.base.healthCheck().then((healthCheck) => {
          if (healthCheck.online) {
            console.log("✅ Directus 服務健康檢查通過");
          } else {
            console.warn("⚠️ Directus 服務可能未啟動:", healthCheck);
          }
        });
      }
    } else {
      console.warn('無效的模式，請使用 "mock", "backend" 或 "directus"');
    }
  }

  /**
   * 獲取當前登錄用戶
   */
  async getCurrentUser() {
    try {
      const userInfo = sessionStorage.getItem("auth-user");
      if (userInfo) {
        const user = JSON.parse(userInfo);
        return user.id || user.username || user.displayName || "unknown";
      }
      return "anonymous";
    } catch (error) {
      console.error("獲取用戶信息失敗:", error);
      return "anonymous";
    }
  }

  getUserInfo() {
    try {
      const user = sessionStorage.getItem("auth-user");
      return JSON.parse(user);
    } catch (error) {
      console.error("獲取用戶資訊失敗:", error);
      return null;
    }
  }

  getUserName() {
    const user = this.getUserInfo();
    return user ? user.username || user.displayName || "unknown" : "unknown";
  }

  getCurrentUsers() {
    try {
      const allUsers = sessionStorage.getItem("allUsers");
      return JSON.parse(allUsers);
    } catch (error) {
      console.error("獲取用戶資訊失敗:", error);
      return null;
    }
  }
}

export const rustAuthService = new RustAuthService();
