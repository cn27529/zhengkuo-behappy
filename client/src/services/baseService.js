// src/services/baseService.js
import { DateUtils } from "../utils/dateUtils.js";
import { indexedDBLogger } from "../utils/indexedDB.js";

export class BaseService {
  constructor() {
    console.log(`BaseService 初始化: 當前模式為 ${this.mode}`);

    this.isMock = import.meta.env.VITE_MOCK === "true";
    // 是否為開發模式
    this.isDev = import.meta.env.VITE_DEV === "true";
    // 可切換模式: 'mock' 或 'backend'
    this.mode = import.meta.env.VITE_AUTH_MODE || "mock";

    this.apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8055";

    this.apiEndpoints = {
      authLogin: "/auth/login", // Directus 登入
      authLogout: "/auth/logout", // Directus 登出
      authRefresh: "/auth/refresh", // Directus token 刷新
      authProfile: "/auth/profile", // 用戶信息
      authValidate: "/auth/validate", // token 驗證
      auth2FA: "/auth/tfa", // 2FA 驗證
      usersMe: "/users/me", // Directus 端點
      itemsMydata: "/items/mydata", // mydata測試
      itemsRegistration: "/items/registrationDB", // 新增 registrationDB 端點
      serverPing: "/server/ping", // 伺服器連接檢查端點
      serverInfo: "/server/info", // 伺服器資訊端點
      itemsActivity: "/items/activityDB", // 新增 activityDB 端點
      itemsJoinRecord: "/items/joinRecordDB", // 新增 joinRecordDB 端點
      itemsParticipationRecord: "/items/participationRecordDB", // 新增 participationRecordDB 端點
      itemsMonthlyDonate: "/items/monthlyDonateDB", // 新增 monthlyDonateDB 端點
      itemsReceiptNumber: "/items/receiptNumbersDB", // 新增 receiptNumbersDB 端點
    };

    // 模擬 API 延遲（毫秒）
    this.mockDelay = 500;

    // 新增日誌配置
    this.logConfig = {
      enabled: import.meta.env.VITE_LOG_RESPONSE === "true" || false,
      level: import.meta.env.VITE_LOG_LEVEL || "info", // 'debug', 'info', 'warn', 'error'
      maxLength: 1000, // 記錄的最大長度
      // ✅ 新增：只記錄有 context 的請求
      onlyWithContext: true,
    };
  }

  getIsMock() {
    return this.isMock;
  }

  /**
   * indexedDB 保存日誌條目
   * 改進版：條件式保存日誌
   */
  async saveLogEntry(logEntry) {
    // 如果日誌功能未啟用，直接返回
    if (!this.logConfig.enabled) {
      return;
    }

    // ✅ 新增：如果設置了 onlyWithContext，檢查 context
    if (this.logConfig.onlyWithContext) {
      // 檢查 context 有效的 service 和 operation
      const hasValidContext =
        logEntry.context &&
        logEntry.context.service !== "unknown" &&
        logEntry.context.operation !== "unknown";

      if (!hasValidContext) {
        console.log("⏭️ 跳過日誌記錄：缺少有效的 context");
        return;
      }
    }

    try {
      // 紀錄當前時間戳
      if (logEntry.context.duration) {
        logEntry.duration = logEntry.context.duration;
      } else {
        logEntry.duration = Date.now() - logEntry.context.startTime;
      }

      // 過濾敏感信息
      //const sanitizedLog = this.sanitizeLogEntry(logEntry);
      const sanitizedLog = { ...logEntry };
      // 保存到 IndexedDB
      await indexedDBLogger.addLog(sanitizedLog);

      // 如果配置了遠程日誌服務，也發送一份
      console.log(
        "⭐️ 發送日誌到遠程服務器:",
        import.meta.env.VITE_REMOTE_LOG_URL,
      );
      if (import.meta.env.VITE_REMOTE_LOG_URL) {
        await this.sendToRemoteLog(sanitizedLog);
      }

      // 開發模式下在控制台顯示
      if (this.isDev) {
        this.displayLogInConsole(sanitizedLog);
      }
    } catch (error) {
      console.warn("日誌保存失敗:", error);
    }
  }

  /**
   * indexedDB 過濾敏感信息
   */
  sanitizeLogEntry(logEntry) {
    const sanitized = { ...logEntry };

    // 移除可能的敏感信息
    const sensitiveKeys = [
      "password",
      "token",
      "authorization",
      "cookie",
      "secret",
    ];

    if (sanitized.requestBody) {
      sensitiveKeys.forEach((key) => {
        if (sanitized.requestBody[key]) {
          sanitized.requestBody[key] = "[FILTERED]";
        }
      });
    }

    if (sanitized.requestHeaders) {
      sensitiveKeys.forEach((key) => {
        if (sanitized.requestHeaders[key]) {
          sanitized.requestHeaders[key] = "[FILTERED]";
        }
      });
    }

    return sanitized;
  }

  /**
   * indexedDB 發送到遠程日誌服務
   */
  async sendToRemoteLog(logEntry) {
    try {
      // 使用 sendBeacon API（離頁面時也能發送）
      const blob = new Blob([JSON.stringify(logEntry)], {
        type: "application/json",
      });

      // ✅ 本地 MongoDB 日誌服務器已啟動: http://localhost:3002
      // 📡 日誌接收端點: http://localhost:3002/mongo/logentry/
      // 📊 健康檢查: http://localhost:3002/health
      // 📈 統計資料: http://localhost:3002/mongo/stats
      let BASE_URL = `${import.meta.env.VITE_REMOTE_LOG_URL}`;
      const logServer = navigator.sendBeacon?.(
        `${BASE_URL}/mongo/logentry/`,
        blob,
      );

      console.log("logServer:", logServer);

      if (!logServer) {
        // fallback 使用 fetch
        await fetch(`${BASE_URL}/mongo/logentry/`, {
          method: "POST",
          body: JSON.stringify(logEntry),
          headers: { "Content-Type": "application/json" },
          keepalive: true,
        });
      }
    } catch (error) {
      // 靜默失敗，不影響主流程
      console.warn("遠程日誌發送失敗:", error);
    }
  }

  /**
   * indexedDB 控制台顯示（開發用）
   */
  displayLogInConsole(logEntry) {
    const style = logEntry.error
      ? "background: #ffebee; color: #c62828; padding: 2px 4px; border-radius: 3px;"
      : "background: #e8f5e9; color: #2e7d32; padding: 2px 4px; border-radius: 3px;";

    console.groupCollapsed(
      `%c${logEntry.endpoint} - ${logEntry.status}`,
      style,
    );
    console.log("上下文:", logEntry.context);
    console.log("耗時:", logEntry.duration, "ms");

    if (logEntry.errorText) {
      console.log("錯誤:", logEntry.errorText);
    }

    console.groupEnd();
  }

  generateLogEntry(response, context = {}) {
    const logEntry = {
      timestamp: DateUtils.getCurrentISOTime(),
      endpoint: response?.url || context.endpoint || "unknown",
      method: context.method || "GET",
      status: response?.status || 0,
      statusText: response?.statusText || "",
      context: {
        service: context.service || "unknown",
        operation: context.operation || "unknown",
        startTime: context.startTime || Date.now(),
        ...context,
      },
      //body: response?.body || null,
      duration: context.duration || 0,
      success: false,
      jsonParseError: false,
      parseError: "",
      error: false,
      errorText: "",
      errorMessage: "",
      noContent: false,
    };
    return logEntry;
  }

  // ========== 通用方法 ==========

  /**
   * 處理 Directus API 回應，加強版，改進版本的 handleDirectusResponse
   * @param {*} response
   * @param {*} returnMessage
   * @returns
   */
  async handleDirectusResponse(response, returnMessage = null, context = {}) {
    try {
      // 創建日誌對象
      // ✅ 正確創建日誌對象 - 傳入 response 和 context
      let logEntry = this.generateLogEntry(response, context);

      // console.log("📡 Response:", response);
      // console.log("📝 Log Entry:", logEntry);

      // ========== 錯誤處理 ==========
      if (!response.ok) {
        const errorText = await response.text();

        console.error(
          `HTTP Directus 錯誤 ${response.status}: ${response.statusText}`,
          errorText,
        );

        // 記錄錯誤日誌
        logEntry.error = true;
        logEntry.errorText = errorText.substring(0, this.logConfig.maxLength);
        logEntry.errorMessage = this.extractErrorMessage(errorText);
        // 保存日誌
        await this.saveLogEntry(logEntry);

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
        logEntry.noContent = true;
        await this.saveLogEntry(logEntry);

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

        logEntry.nonJson = true;
        logEntry.contentType = contentType;
        logEntry.success = true;
        await this.saveLogEntry(logEntry);

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

        logEntry.jsonParseError = true;
        logEntry.parseError = error.message;
        await this.saveLogEntry(logEntry);

        throw new Error("伺服器返回了無效的 JSON 格式");
      }

      // 記錄成功的日誌
      logEntry.success = true;
      await this.saveLogEntry(logEntry);

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

  async serverInfo() {
    try {
      const apiUrl = `${this.apiBaseUrl}${this.apiEndpoints.serverInfo}`;
      const response = await fetch(apiUrl, {
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
      const apiUrl = `${this.apiBaseUrl}${this.apiEndpoints.serverPing}`;
      const response = await fetch(apiUrl, {
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
  async healthCheck() {
    if (this.isMock) {
      return {
        success: true,
        online: true,
        message: `${this.mode} Mock模式連接正常`,
      };
    }

    try {
      const apiUrl = `${this.apiBaseUrl}${this.apiEndpoints.serverInfo}`;
      const response = await fetch(apiUrl, {
        method: "GET",
        timeout: 5000,
      });

      console.log("檢查後端服務連接回應狀態:", JSON.stringify(response));

      if (response.ok) {
        console.log("服務連接正常");
        return {
          success: true,
          online: true,
          message: "服務連接正常",
        };
      } else {
        return {
          success: false,
          online: false,
          message: "服務連接異常",
        };
      }
    } catch (error) {
      console.error("服務連接異常:", error);
      return {
        success: false,
        online: false,
        message: `服務連接異常: ${error.message}`,
      };
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

  async getAccessTokenJsonHeaders() {
    try {
      const token = sessionStorage.getItem("auth-token");
      if (!token) throw new Error("未找到 Token，不存在的 auth-token");

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      console.log("🔑 AuthJsonHeaders 請求標頭:", headers);
      return headers;
    } catch (error) {
      console.error("獲取授權標頭失敗 auth-token:", error);
      throw error;
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

      console.log("🔑 AuthJsonHeaders 請求標頭:", headers);
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

      console.log("🔑 TokenHeaders 請求標頭:", headers);
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

      console.log("🔑 JsonHeaders 請求標頭:", headers);
      return headers;
    } catch (error) {
      console.error("獲取授權標頭失敗 auth-token:", error);
      throw error;
    }
  }

  handleDirectusError(error) {
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

    // 檢查認證錯誤
    if (error.message.includes("401") || error.message.includes("token")) {
      return {
        success: false,
        message: "認證失敗，請重新登入",
        errorCode: "UNAUTHORIZED",
        details: error.message,
      };
    }

    // 檢查權限錯誤
    if (error.message.includes("403")) {
      return {
        success: false,
        message: "沒有操作權限",
        errorCode: "FORBIDDEN",
        details: error.message,
      };
    }

    return {
      success: false,
      message: "Directus 操作失敗",
      errorCode: "DIRECTUS_ERROR",
      details: error.message,
    };
  }
}

export const baseService = new BaseService();

// // 獲取完整的 API URL
// export const getApiUrl = (endpoint) => {
//   return `${baseService.apiBaseUrl}${endpoint}`;
// };
