// src/rustServices/rustAuthService.js
import { baseRustService } from "./baseRustService.js";

export class RustAuthService {
  constructor() {
    this.base = baseRustService;
    this.endpoint = this.base.endpoints.auth;
  }

  /**
   * Rust 登入（可能使用不同於 Directus 的認證方式）
   */
  async login(credentials, context = {}) {
    const result = await this.base.rustFetch(
      this.endpoint.login,
      {
        method: "POST",
        body: JSON.stringify(credentials),
      },
      {
        operation: "login",
        ...context,
      }
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
      }
    );

    // 清除令牌
    this.base.clearRustToken();

    return result;
  }

  /**
   * 獲取當前用戶信息
   */
  // async getCurrentUser(context = {}) {
  //   return await this.base.rustFetch(
  //     this.endpoint.me,
  //     {
  //       method: "GET",
  //     },
  //     {
  //       operation: "getCurrentUser",
  //       ...context,
  //     }
  //   );
  // }

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

  /**
   * 刷新令牌
   */
  async refreshToken(context = {}) {
    return await this.base.rustFetch(
      this.endpoint.refresh,
      {
        method: "POST",
      },
      {
        operation: "refreshToken",
        ...context,
      }
    );
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
      return {
        authenticated: false,
        error: error.message,
      };
    }
  }

  /**
   * 健康檢查
   */
  async getHealthCheck() {
    return await this.base.healthCheck();
  }

  /**
   * 獲取服務信息
   */
  async getServerInfo() {
    return await this.base.serverInfo();
  }
}

export const rustAuthService = new RustAuthService();
