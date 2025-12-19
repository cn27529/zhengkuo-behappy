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

  // ========== 通用方法 ==========

  /**
   * 處理 Directus API 回應，加強版
   * @param {*} response
   * @result {Object}
   */
  async handleDirectusResponse(response) {
    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `HTTP Directus 錯誤:${response.status}: ${response.statusText}`,
        errorText
      );

      // 根據不同的狀態碼返回更詳細的錯誤信息
      switch (response.status) {
        case 400:
          throw new Error(
            `請求錯誤 (400): ${
              this.extractErrorMessage(errorText) || "無效的請求格式或參數"
            }`
          );

        case 401:
          throw new Error(
            `未經授權 (401): ${
              this.extractErrorMessage(errorText) || "請檢查認證令牌"
            }`
          );

        case 403:
          throw new Error(
            `權限拒絕 (403): ${
              this.extractErrorMessage(errorText) || "您沒有權限訪問此資源"
            }`
          );

        case 404:
          throw new Error(
            `資源不存在 (404): ${
              this.extractErrorMessage(errorText) || "請求的端點或資源不存在"
            }`
          );

        case 405:
          throw new Error(
            `方法不允許 (405): ${
              this.extractErrorMessage(errorText) || "不支援的 HTTP 方法"
            }`
          );

        case 408:
          throw new Error(
            `請求超時 (408): ${
              this.extractErrorMessage(errorText) || "請求處理時間過長"
            }`
          );

        case 409:
          throw new Error(
            `資源衝突 (409): ${
              this.extractErrorMessage(errorText) || "資源狀態衝突，請檢查數據"
            }`
          );

        case 422:
          throw new Error(
            `數據驗證失敗 (422): ${
              this.extractErrorMessage(errorText) || "請求數據無法處理"
            }`
          );

        case 429:
          throw new Error(
            `請求過於頻繁 (429): ${
              this.extractErrorMessage(errorText) || "請稍後再試"
            }`
          );

        case 500:
          throw new Error(
            `伺服器內部錯誤 (500): ${
              this.extractErrorMessage(errorText) || "伺服器發生錯誤"
            }`
          );

        case 502:
          throw new Error(
            `閘道錯誤 (502): ${
              this.extractErrorMessage(errorText) || "後端服務無回應"
            }`
          );

        case 503:
          throw new Error(
            `服務不可用 (503): ${
              this.extractErrorMessage(errorText) || "服務暫時不可用"
            }`
          );

        case 504:
          throw new Error(
            `閘道超時 (504): ${
              this.extractErrorMessage(errorText) || "請求超時"
            }`
          );

        default:
          throw new Error(
            `HTTP 錯誤 ${response.status}: ${response.statusText || "未知錯誤"}`
          );
      }
    }

    // 修正：檢查回應是否有內容
    let result = null;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      try {
        result = await response.json();
      } catch (error) {
        console.error("解析 JSON 回應失敗:", error);
        throw new Error("伺服器返回了無效的 JSON 格式");
      }
    } else if (response.status === 204) {
      // 204 No Content 是正常的
      return {
        success: true,
        data: null,
        message: null,
      };
    }

    // 修正：根據 Directus API 的回應模式調整
    return {
      success: true,
      data: result ? result.data : null,
      message: result ? result.message : null,
      meta: result ? result.meta : null, // 如果有分頁信息
      errors: result ? result.errors : null, // 如果有錯誤信息（非 HTTP 錯誤）
    };
  }

  // 新增輔助方法：從錯誤回應中提取錯誤信息
  extractErrorMessage(errorText) {
    try {
      // 嘗試解析為 JSON
      const errorJson = JSON.parse(errorText);

      // Directus 錯誤格式通常是 { errors: [...] }
      if (
        errorJson.errors &&
        Array.isArray(errorJson.errors) &&
        errorJson.errors.length > 0
      ) {
        return errorJson.errors.map((err) => err.message).join(", ");
      }

      // 或者直接有 message 字段
      if (errorJson.message) {
        return errorJson.message;
      }

      return errorText.substring(0, 200); // 限制長度
    } catch {
      // 如果不是 JSON，返回原始文本的前200個字符
      return errorText ? errorText.substring(0, 200) : "無詳細錯誤信息";
    }
  }

  // async handleDirectusResponse(response) {
  //   if (!response.ok) {
  //     throw new Error(
  //       `HTTP Directus 錯誤:${response.status}: ${response.statusText}`
  //     );
  //   }

  //   // 詳細的 HTTP 狀態碼處理
  //   if (response.status === 403) {
  //     const errorText = await response.text();
  //     console.error("❌ 403 權限拒絕詳細信息:", errorText);
  //     throw new Error(`權限拒絕 (403): ${errorText}`);
  //   }

  //   if (response.status === 401) {
  //     const errorText = await response.text();
  //     console.error("❌ 401 未經授權詳細信息:", errorText);
  //     throw new Error("未經授權 (401): 請檢查認證令牌");
  //   }

  //   // 修正：檢查回應是否有內容
  //   let result = null;
  //   const contentType = response.headers.get("content-type");
  //   if (contentType && contentType.includes("application/json")) {
  //     result = await response.json();
  //   }

  //   // 修正：根據 Directus API 的回應模式調整
  //   return {
  //     success: true,
  //     data: result ? result.data : null,
  //     message: result ? result.message : null,
  //   };

  //   // if (!response.ok) {
  //   //   const errorData = await response.json().catch(() => ({}));
  //   //   throw new Error(errorData.message || `Directus 錯誤: ${response.status}`);
  //   // }
  //   // const result = await response.json();
  //   // return result.data;
  // }

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
