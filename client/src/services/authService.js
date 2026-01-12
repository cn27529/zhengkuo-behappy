// src/services/authService.js
import { baseService } from "../services/baseService.js";
import userData from "../data/auth_user.json";

export class AuthService {
  constructor() {
    this.serverName = "AuthService";
    this.base = baseService;
    console.log(`AuthService 初始化: 當前模式為 ${this.base.mode}`);
  }

  // ========== 通用方法 ==========
  async handleDirectusResponse(response) {
    return await this.base.handleDirectusResponse(response);
  }

  async login(username, password) {
    console.log(`登入請求 - 模式: ${this.base.mode}, 用戶: ${username}`);

    // 在控制台輸出警告
    if (this.base.mode === "mock") {
      console.warn(
        "🚨 當前使用前端模擬認證，密碼為明碼儲存！\n" +
          "⚠️ 正式環境請切換到後端模式並移除密碼硬編碼。\n" +
          "🔒 可用帳號：admin, zkuser01, temple_staff, volunteer, user01"
      );

      return this.mockLogin(username, password);
    } else if (this.base.mode === "backend") {
      return this.backendLogin(username, password);
    } else if (this.base.mode === "directus") {
      return this.directusLogin(username, password);
    }
  }

  async logout() {
    if (this.base.mode === "backend") {
      return this.backendLogout();
    } else if (this.base.mode === "directus") {
      return this.directusLogout();
    }
    return { success: true };
  }

  async validateToken() {
    const currentMode = this.getCurrentMode();
    console.log(`驗證 Token - 當前模式: ${currentMode}`);

    if (currentMode === "mock") {
      return this.mockValidateToken();
    } else if (currentMode === "directus") {
      return this.directusValidateToken();
    } else {
      return this.backendValidateToken();
    }
  }

  async refreshToken() {
    if (this.base.mode === "mock") {
      return this.mockRefreshToken();
    } else if (this.base.mode === "directus") {
      return this.directusRefreshToken();
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
        console.error("驗證 Token 失敗:", error);
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

  // ========== Mock 2FA 方法 ==========
  async mockVerify2FA(tempToken, otpCode) {
    await this.mockDelay();

    console.log("模擬 2FA 驗證:", { tempToken, otpCode });

    // 模擬 2FA 驗證（在實際環境中應該驗證正確的 OTP）
    if (otpCode === "123456" || otpCode === "000000") {
      // 模擬驗證成功
      const mockUser = userData.default[0];

      return {
        success: true,
        message: "模擬 2FA 驗證成功",
        data: {
          user: mockUser,
          token: `mock-2fa-token-${Date.now()}`,
          refreshToken: `mock-2fa-refresh-token-${Date.now()}`,
          expiresIn: 3600,
        },
      };
    } else {
      return {
        success: false,
        message: "驗證碼錯誤，請嘗試 123456 或 000000",
        errorCode: "INVALID_OTP",
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

  // ========== Directus 方法 ==========
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
          errorData.message || `Directus 錯誤: ${response.status}`
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
          //userData.displayName = `${userResult.data.first_name}${userResult.data.last_name}`;
          userData.displayName = `${userResult.data.title}(${userResult.data.first_name}${userResult.data.last_name})`;
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

  // ========== Directus 2FA 登入流程 ==========
  async directus2FALogin(username, password) {
    try {
      console.log("開始 Directus 2FA 登入流程");

      const apiUrl = `${this.base.apiBaseUrl}${this.base.apiEndpoints.authLogin}`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: username,
          password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Directus 錯誤: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("Directus 登入回應:", result);

      // 檢查是否需要 2FA
      if (result.data && result.data.tfa === "required" && result.data.token) {
        console.log("檢測到需要 2FA 驗證");
        return {
          success: false,
          requires2FA: true,
          tempToken: result.data.token,
          message: "需要兩步驟驗證，請輸入驗證碼",
        };
      }

      // 不需要 2FA，直接成功
      if (result.data && result.data.access_token) {
        console.log("不需要 2FA，直接登入成功");
        return await this.handleDirectusLoginSuccess(result.data, username);
      }

      // 其他情況
      throw new Error("Directus 返回數據格式錯誤");
    } catch (error) {
      console.error("Directus 2FA 登入請求失敗:", error);

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

  async directusVerify2FA(tempToken, otpCode) {
    try {
      console.log("開始 Directus 2FA 驗證");

      const apiUrl = `${this.base.apiBaseUrl}${this.base.apiEndpoints.auth2FA}`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: tempToken,
          otp: otpCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // 特別處理 OTP 錯誤
        if (response.status === 400 || response.status === 401) {
          return {
            success: false,
            message: "驗證碼錯誤或已過期，請重新輸入",
            errorCode: "INVALID_OTP",
          };
        }

        throw new Error(
          errorData.message || `2FA 驗證錯誤: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("Directus 2FA 驗證回應:", result);

      if (result.data && result.data.access_token) {
        console.log("2FA 驗證成功");
        return await this.handleDirectusLoginSuccess(result.data, "2FA User");
      } else {
        throw new Error("兩步驟驗證失敗：返回數據格式錯誤");
      }
    } catch (error) {
      console.error("Directus 2FA 驗證失敗:", error);
      return {
        success: false,
        message: error.message || "兩步驟驗證失敗",
        errorCode: "2FA_VERIFICATION_FAILED",
      };
    }
  }

  // ========== 2FA 專用方法 ==========
  async verify2FA(tempToken, otpCode) {
    const currentMode = this.getCurrentMode();

    if (currentMode === "directus") {
      return this.directusVerify2FA(tempToken, otpCode);
    } else {
      // 對於 mock 和 backend 模式，模擬 2FA 驗證
      return this.mockVerify2FA(tempToken, otpCode);
    }
  }

  // ========== 共用方法 ==========
  async handleDirectusLoginSuccess(authData, username) {
    const { access_token, refresh_token, expires } = authData;

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
      //userData.displayName = `${userResult.data.first_name}${userResult.data.last_name}`;
      userData.displayName = `${userResult.data.title}(${userResult.data.first_name}${userResult.data.last_name})`;
    } else {
      console.error("Directus 返回用戶資訊發生錯誤:", userResponse.status);
    }

    return {
      success: true,
      message: "Directus 登入成功",
      data: {
        user: userData || { username, displayName: username },
        token: access_token,
        refreshToken: refresh_token,
        expiresIn: expires || 3600,
      },
    };
  }

  async directusLogout() {
    try {
      const refreshToken = sessionStorage.getItem("auth-refresh-token");
      const token = sessionStorage.getItem("auth-token");

      // 如果沒有 token，直接返回成功
      if (!token) {
        return { success: true };
      }

      // Directus 登出請求
      const apiUrl = `${this.base.apiBaseUrl}${this.base.apiEndpoints.authLogout}`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      });

      // 即使 Directus 登出失敗，也認為成功（因為前端狀態已經清除）
      if (!response.ok) {
        console.warn("Directus 登出失敗，但前端狀態已清除");
      }

      return { success: true };
    } catch (error) {
      console.error("Directus 登出請求失敗:", error);
      // 登出失敗不影響前端狀態清除
      return { success: true };
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

  getUserInfo() {
    try {
      const user = sessionStorage.getItem("auth-user");
      return JSON.parse(user);
    } catch (error) {
      console.error("獲取用戶資訊失敗:", error);
      return null;
    }
  }

  async directusValidateToken() {
    try {
      const token = sessionStorage.getItem("auth-token");
      if (!token) {
        return { success: false, message: "未找到 Token" };
      }

      // 使用 /users/me 端點驗證 token
      const apiUrl = `${this.base.apiBaseUrl}${this.base.apiEndpoints.usersMe}`;
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      return {
        success: true,
        data: {
          user: result.data,
        },
      };
    } catch (error) {
      console.error("Directus Token 驗證失敗:", error);

      // 檢查網路錯誤
      if (error.message.includes("Failed to fetch")) {
        return {
          success: false,
          message: "Directus 服務未啟動，無法驗證 Token",
          errorCode: "DIRECTUS_NOT_AVAILABLE",
        };
      }

      return {
        success: false,
        message: "Directus Token 驗證失敗",
        errorCode: "DIRECTUS_VALIDATION_ERROR",
      };
    }
  }

  async directusRefreshToken() {
    try {
      const refreshToken = sessionStorage.getItem("auth-refresh-token");
      if (!refreshToken) {
        return { success: false, message: "未找到 Refresh Token" };
      }

      const apiUrl = `${this.base.apiBaseUrl}${this.base.apiEndpoints.authRefresh}`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      });

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
        throw new Error("Directus 返回數據格式錯誤");
      }
    } catch (error) {
      console.error("Directus Token 刷新失敗:", error);

      if (error.message.includes("Failed to fetch")) {
        return {
          success: false,
          message: "Directus 服務未啟動，無法刷新 Token",
          errorCode: "DIRECTUS_NOT_AVAILABLE",
        };
      }

      return {
        success: false,
        message: "Directus Token 刷新失敗",
        errorCode: "DIRECTUS_REFRESH_ERROR",
      };
    }
  }

  // ========== 後端 API 方法 ==========
  async backendLogin(username, password) {
    try {
      const apiUrl = `${this.base.apiBaseUrl}${this.base.apiEndpoints.authLogin}`;
      const response = await fetch(apiUrl, {
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

      const apiUrl = `${this.base.apiBaseUrl}${this.base.apiEndpoints.authLogout}`;
      const response = await fetch(apiUrl, {
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

      const apiUrl = `${this.base.apiBaseUrl}${this.base.apiEndpoints.authValidate}`;
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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

      const apiUrl = `${this.base.apiBaseUrl}${this.base.apiEndpoints.authRefresh}`;
      const response = await fetch(apiUrl, {
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
    return new Promise((resolve) => setTimeout(resolve, this.base.mockDelay));
  }

  handleAuthError(error) {
    return this.base.handleDirectusError(error);
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
      this.base.isDev = sessionStorage.getItem("auth-dev");
    }
    //console.log("getCurrentDev: ", this.base.isDev);
    return this.base.isDev === "true" ? true : false;
  }

  // 修改 setDev 方法 ,用於設置是否為開發模式，可開啟調試模式
  setDev(isDev) {
    console.log("setDev: ", isDev);
    this.base.isDev = isDev;
    sessionStorage.setItem("auth-dev", isDev);
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

  getCurrentUser = () => {
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
  };
}

export const authService = new AuthService();
