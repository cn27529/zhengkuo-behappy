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
      authLogin: "/auth/login", // Directus 登入
      authLogout: "/auth/logout", // Directus 登出
      authRefresh: "/auth/refresh", // Directus token 刷新
      authProfile: "/auth/profile", // 用戶信息
      authValidate: "/auth/validate", // token 驗證
      auth2FA: "/auth/tfa", // 2FA 驗證
      authMe: "/users/me", // Directus 端點
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
   * 處理 Directus API 回應，加強版，改進版本的 handleDirectusResponse
   * @param {*} response
   * @param {*} returnMessage
   * @returns
   */
  async handleDirectusResponse(response, returnMessage = null) {
    try {
      // ========== 錯誤處理 ==========
      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `HTTP Directus 錯誤 ${response.status}: ${response.statusText}`,
          errorText
        );

        const errorMessage = this.extractErrorMessage(errorText);

        // 使用映射表簡化錯誤處理
        const errorMessages = {
          400: `請求錯誤 (400): ${errorMessage || "無效的請求格式或參數"}`,
          401: `未經授權 (401): ${errorMessage || "請檢查認證令牌"}`,
          403: `權限拒絕 (403): ${errorMessage || "您沒有權限訪問此資源"}`,
          404: `資源不存在 (404): ${errorMessage || "請求的端點或資源不存在"}`,
          405: `方法不允許 (405): ${errorMessage || "不支援的 HTTP 方法"}`,
          408: `請求超時 (408): ${errorMessage || "請求處理時間過長"}`,
          409: `資源衝突 (409): ${errorMessage || "資源狀態衝突，請檢查數據"}`,
          413: `請求體過大 (413): ${errorMessage || "上傳的資料超過大小限制"}`,
          422: `數據驗證失敗 (422): ${errorMessage || "請求數據無法處理"}`,
          429: `請求過於頻繁 (429): ${errorMessage || "請稍後再試"}`,
          500: `伺服器內部錯誤 (500): ${errorMessage || "伺服器發生錯誤"}`,
          502: `閘道錯誤 (502): ${errorMessage || "後端服務無回應"}`,
          503: `服務不可用 (503): ${errorMessage || "服務暫時不可用"}`,
          504: `閘道超時 (504): ${errorMessage || "請求超時"}`,
        };

        const errorMsg =
          errorMessages[response.status] ||
          `HTTP 錯誤 ${response.status}: ${response.statusText || "未知錯誤"}`;

        throw new Error(errorMsg);
      }

      // ========== 成功響應處理 ==========

      // 處理 204 No Content
      if (response.status === 204) {
        return {
          success: true,
          data: null,
          message: returnMessage || "操作成功",
          meta: null,
          errors: null,
        };
      }

      // 檢查 Content-Type
      const contentType = response.headers.get("content-type");

      // 非 JSON 響應處理
      if (!contentType || !contentType.includes("application/json")) {
        console.warn("回應不是 JSON 格式:", contentType);
        return {
          success: true,
          data: null,
          message: returnMessage || "操作成功（非 JSON 響應）",
          meta: null,
          errors: null,
        };
      }

      // 解析 JSON
      let result;
      try {
        result = await response.json();
      } catch (error) {
        console.error("解析 JSON 回應失敗:", error);
        throw new Error("伺服器返回了無效的 JSON 格式");
      }

      // 返回標準化結果
      return {
        success: true,
        data: result?.data ?? null, // 使用 nullish coalescing 更清晰
        message: result?.message ?? returnMessage ?? null,
        meta: result?.meta ?? null,
        errors: result?.errors ?? null,
      };
    } catch (error) {
      console.error("Directus 回應處理異常:", error);
      throw error;
    }
  }

  // 改進的錯誤信息提取方法
  extractErrorMessage(errorText) {
    if (!errorText) {
      return "無詳細錯誤信息";
    }

    try {
      const errorJson = JSON.parse(errorText);

      // Directus 錯誤格式: { errors: [...] }
      if (Array.isArray(errorJson.errors) && errorJson.errors.length > 0) {
        return errorJson.errors
          .map((err) => err.message || err.toString())
          .join("; "); // 使用分號更清晰
      }

      // 直接的 message 字段
      if (errorJson.message) {
        return errorJson.message;
      }

      // 其他可能的錯誤字段
      if (errorJson.error) {
        return typeof errorJson.error === "string"
          ? errorJson.error
          : JSON.stringify(errorJson.error);
      }

      // 返回整個 JSON（限制長度）
      return JSON.stringify(errorJson).substring(0, 200);
    } catch {
      // 不是 JSON，返回原始文本
      return errorText.substring(0, 200);
    }
  }

  // 處理 Directus API 回應
  // async handleDirectusResponse(response) {
  //   try {
  //     if (!response.ok) {
  //       throw new Error(
  //         `HTTP Directus 錯誤:${response.status}: ${response.statusText}`
  //       );
  //     }

  //     // 詳細的 HTTP 狀態碼處理
  //     if (response.status === 403) {
  //       const errorText = await response.text();
  //       console.error("❌ 403 權限拒絕詳細信息:", errorText);
  //       throw new Error(`權限拒絕 (403): ${errorText}`);
  //     }

  //     if (response.status === 401) {
  //       const errorText = await response.text();
  //       console.error("❌ 401 未經授權詳細信息:", errorText);
  //       throw new Error("未經授權 (401): 請檢查認證令牌");
  //     }

  //     // 修正：檢查回應是否有內容
  //     let result = null;
  //     const contentType = response.headers.get("content-type");
  //     if (contentType && contentType.includes("application/json")) {
  //       result = await response.json();
  //     }

  //     // 修正：根據 Directus API 的回應模式調整
  //     return {
  //       success: true,
  //       data: result ? result.data : null,
  //       message: result ? result.message : null,
  //     };

  //     // if (!response.ok) {
  //     //   const errorData = await response.json().catch(() => ({}));
  //     //   throw new Error(errorData.message || `Directus 錯誤: ${response.status}`);
  //     // }
  //     // const result = await response.json();
  //     // return result.data;
  //   } catch (error) {
  //     console.error("Directus 回應異常:", error);
  //     throw error;
  //   }
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
  async getAuthJsonHeaders() {
    try {
      const token = sessionStorage.getItem("auth-token");
      if (!token) throw new Error("未找到 Token，不存在的 auth-token");

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      console.log("🔑 請求標頭:", headers);
      return headers;
    } catch (error) {
      console.error("獲取授權標頭失敗 auth-token:", error);
      throw error;
    }
  }

  /**
   * 獲取TOKEN授權標頭
   */
  async getTokenHeaders() {
    try {
      const token = sessionStorage.getItem("auth-token");
      if (!token) throw new Error("未找到 Token，不存在的 auth-token");

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      console.log("🔑 請求標頭:", headers);
      return headers;
    } catch (error) {
      console.error("獲取授權標頭失敗 auth-token:", error);
      throw error;
    }
  }

  /**
   * 獲取JSON授權標頭
   * @returns
   */
  async getJsonHeaders() {
    try {
      const token = sessionStorage.getItem("auth-token");
      if (!token) throw new Error("未找到 Token，不存在的 auth-token");

      const headers = {
        "Content-Type": "application/json",
      };

      console.log("🔑 請求標頭:", headers);
      return headers;
    } catch (error) {
      console.error("獲取授權標頭失敗 auth-token:", error);
      throw error;
    }
  }
}

export const baseService = new BaseService();

// 獲取完整的 API URL
export const getApiUrl = (endpoint) => {
  return `${baseService.apiBaseUrl}${endpoint}`;
};
