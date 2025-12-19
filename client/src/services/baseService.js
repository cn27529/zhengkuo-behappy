// src/services/baseService.js
export class BaseService {
  constructor() {
    // 可切換模式: 'mock' 或 'backend'
    this.mode = import.meta.env.VITE_AUTH_MODE || "mock";

    // 是否為開發模式
    this.isDev = import.meta.env.VITE_DEV || false;

    this.apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8055";

    this.apiEndpoints = {
      login: "/auth/login", // Directus 登入
      logout: "/auth/logout", // Directus 登出
      refresh: "/auth/refresh", // Directus token 刷新
      profile: "/auth/profile", // 用戶信息
      validate: "/auth/validate", // token 驗證
      me: "/users/me", // Directus 端點
      itemsMydata: "/items/mydata", // mydata測試
      itemsRegistration: "/items/registrationDB", // 新增 registrationDB 端點
      serverPing: "/server/ping", // 伺服器連線檢查端點
      serverInfo: "/server/info", // 伺服器資訊端點
      itemsActivity: "/items/activityDB", // 新增 activityDB 端點
      itemsMonthlyDonate: "/items/monthlyDonateDB", // 新增 monthlyDonateDB 端點
    };

    // 模擬 API 延遲（毫秒）
    this.mockDelay = 500;
  }

  // 獲取伺服器資訊，返回伺服器資訊對象或 null
  async serverInfo() {
    try {
      const response = await fetch(getApiUrl(this.apiEndpoints.serverInfo), {
        method: "GET",
        timeout: 5000,
      });

      console.log("伺服器資訊回應狀態:", JSON.stringify(response));

      if (response.ok) {
        const result = await response.json();
        console.log("伺服器資訊:", result);
        return result;
      } else {
        console.warn("無法取得伺服器資訊");
        return null;
      }
    } catch (error) {
      console.error("取得伺服器資訊異常:", error);
      return null;
    }
  }

  // 檢查伺服器是否在線，返回布林值
  async serverPing() {
    try {
      const response = await fetch(getApiUrl(this.apiEndpoints.serverPing), {
        method: "GET",
        timeout: 5000,
      });

      console.log("Ping 伺服器回應狀態:", JSON.stringify(response));

      if (response.ok) {
        console.log("伺服器 Ping 成功");
        return true;
      } else {
        console.warn("伺服器 Ping 失敗");
        return false;
      }
    } catch (error) {
      console.error("伺服器 Ping 異常:", error);
      return false;
    }
  }

  // 檢查後端連接狀態，返回一個包含 success 和 message 的對象
  async checkConnection() {
    // Mock 模式總是返回成功
    if (this.mode !== "directus") {
      return {
        success: true,
        online: true,
        message: `${this.mode} 模式連線正常`,
      };
    }

    try {
      const response = await fetch(getApiUrl(this.apiEndpoints.serverInfo), {
        method: "GET",
        timeout: 5000,
      });

      console.log("檢查後端連接回應狀態:", JSON.stringify(response));

      if (response.ok) {
        console.log("伺服器連線正常");
        return {
          success: true,
          online: true,
          message: "伺服器連線正常",
        };
      } else {
        return {
          success: false,
          online: false,
          message: "伺服器無回應",
        };
      }
    } catch (error) {
      console.error("伺服器連線異常:", error);
      return {
        success: false,
        online: false,
        message: `伺服器連線異常: ${error.message}`,
      };
    }
  }

  /**
   * 獲取授權標頭
   */
  async getAuthHeaders() {
    try {
      const token = sessionStorage.getItem("auth-token");

      //console.log("獲取授權標頭:", token);

      if (!token) {
        throw new Error("未找到 Token，不存在的 auth-token");
        return { success: false, message: "未找到 Token，不存在的 auth-token" };
      }

      const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      };
      console.log("🔑 請求標頭:", headers);
      return headers;
    } catch (error) {
      console.error("獲取授權標頭失敗 auth-token:", error);
      throw error;
      return {
        "Content-Type": "application/json",
      };
    }
  }
}
export const baseService = new BaseService();

// 獲取完整的 API URL
export const getApiUrl = (endpoint) => {
  return `${baseService.apiBaseUrl}${endpoint}`;
};
