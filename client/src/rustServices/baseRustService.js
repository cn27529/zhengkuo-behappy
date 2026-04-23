// src/rustServices/baseRustService.js
import { DateUtils } from "../utils/dateUtils.js";
import { indexedDBLogger } from "../utils/indexedDB.js";

export class BaseRustService {
  constructor() {
    console.log(`BaseRustService 初始化: 當前模式為 ${this.mode}`);

    this.isMock = import.meta.env.VITE_MOCK === "true";
    // 是否為開發模式
    this.isDev = import.meta.env.VITE_DEV === "true";
    this.rustApiBaseUrl =
      import.meta.env.VITE_RUST_API_URL || "http://localhost:3000";
    this.mode = import.meta.env.VITE_RUST_MODE || "rust";

    // API 端點
    this.endpoints = {
      auth: {
        login: "/api/auth/login",
        logout: "/api/auth/logout",
        refresh: "/api/auth/refresh",
        me: "/api/auth/me",
      },
      directusUsers: "/api/directus-users", // DIRECTUS使用者
      activities: "/api/activities",
      registrations: "/api/registrations",
      monthlyDonates: "/api/monthly-donates",
      participationRecords: "/api/participation-records",
      receiptNumber: "/api/receipt-numbers", //收據與感謝狀取號
      priceConfig: "/api/price-configs", // 價格配置 by 20260331      
      joinRecords: "/api/join-records", // 參與紀錄 by 20260422
      myData: "/api/my-data",
      users: "/api/users",
      health: "/health",
      dbTest: "/db-test",
      serverInfo: "/server/info",
      serverPing: "/server/ping",
      metrics: "/api/metrics",
    };

    // ✅ 新增：日誌配置（與 baseService 一致）
    this.logConfig = {
      enabled: import.meta.env.VITE_LOG_RESPONSE === "true" || false,
      level: import.meta.env.VITE_LOG_LEVEL || "info",
      maxLength: 1000,
      onlyWithContext: true, // 只記錄有 context 的請求
    };

    // 性能監控
    this.metrics = {
      totalRequests: 0,
      successRequests: 0,
      avgResponseTime: 0,
    };
  }

  // ========== 日誌相關方法 ==========

  /**
   * ✅ 生成日誌條目（與 baseService 統一格式）
   */
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
      duration: context.duration || 0,
      success: false,
      jsonParseError: false,
      parseError: "",
      error: false,
      errorText: "",
      errorMessage: "",
      noContent: false,
      // ✅ Rust 特有欄位
      isRustService: true,
      rustMode: this.mode,
    };
    return logEntry;
  }

  /**
   * ✅ 保存日誌條目（與 baseService 一致）
   */
  async saveLogEntry(logEntry) {
    if (!this.logConfig.enabled) {
      return;
    }

    // 檢查是否有有效的 context
    if (this.logConfig.onlyWithContext) {
      // 檢查 context 有效的 service 和 operation
      const hasValidContext =
        logEntry.context &&
        logEntry.context.service !== "unknown" &&
        logEntry.context.operation !== "unknown";

      if (!hasValidContext) {
        console.log("⭐️ 跳過日誌記錄：缺少有效的 context");
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
   * ✅ 過濾敏感信息
   */
  sanitizeLogEntry(logEntry) {
    const sanitized = { ...logEntry };
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
   * ✅ 發送到遠程日誌服務
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
      console.warn("遠程日誌發送失敗:", error);
    }
  }

  /**
   * ✅ 控制台顯示（開發用）
   */
  displayLogInConsole(logEntry) {
    const style = logEntry.error
      ? "background: #ffebee; color: #c62828; padding: 2px 4px; border-radius: 3px;"
      : "background: #e8f5e9; color: #2e7d32; padding: 2px 4px; border-radius: 3px;";

    console.groupCollapsed(
      `%c🦀 ${logEntry.endpoint} - ${logEntry.status}`,
      style,
    );
    console.log("上下文:", logEntry.context);
    console.log("耗時:", logEntry.duration, "ms");

    if (logEntry.errorText) {
      console.log("錯誤:", logEntry.errorText);
    }

    console.groupEnd();
  }

  // ========== 核心 Fetch 方法（改進版）==========

  /**
   * ✅ Rust 風格的 API 調用（整合日誌記錄）
   */
  async rustFetch(endpoint, options = {}, context = {}) {
    const startTime = Date.now();
    let logContext = {};
    let response = null;

    try {
      this.metrics.totalRequests++;

      // 準備請求選項
      const defaultOptions = {
        method: options.method || "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        mode: "cors",
        credentials: "omit",
        cache: "no-cache",
      };

      // 添加認證令牌
      const token = this.getRustToken();
      if (token) {
        defaultOptions.headers["Authorization"] = `Bearer ${token}`;
      }

      const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
          ...defaultOptions.headers,
          ...(options.headers || {}),
        },
      };

      // 清除 undefined 的頭部
      Object.keys(finalOptions.headers).forEach((key) => {
        if (finalOptions.headers[key] === undefined) {
          delete finalOptions.headers[key];
        }
      });

      const url = this.getUrl(endpoint);

      // ✅ 準備日誌上下文
      logContext = {
        timestamp: DateUtils.getCurrentISOTime(),
        service: context.service || "unknown",
        operation: context.operation || "unknown",
        endpoint: url,
        method: finalOptions.method || "GET",
        startTime,
        requestBody: finalOptions.body ? JSON.parse(finalOptions.body) : null,
        requestHeaders: { ...finalOptions.headers },
      };

      console.log("🦀 [Rust] Fetch詳細調試:", {
        rustApiBaseUrl: this.rustApiBaseUrl,
        endpoint: endpoint,
        fullUrl: url,
        method: finalOptions.method,
        mode: finalOptions.mode,
        credentials: finalOptions.credentials,
        headers: finalOptions.headers,
        hasBody: !!finalOptions.body,
      });

      console.log(`🦀 [Rust] 發送請求: ${finalOptions.method} ${url}`);

      // 發送請求
      response = await fetch(url, finalOptions);
      const duration = Date.now() - startTime;

      console.log("✅🦀 [Rust] 收到響應:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries([...response.headers.entries()]),
        duration: `${duration}ms`,
      });

      // ✅ 創建日誌條目
      let logEntry = this.generateLogEntry(response, {
        ...logContext,
        duration,
      });

      // ========== 錯誤處理 ==========
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌🦀 [Rust] 響應錯誤:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });

        // ✅ 記錄錯誤日誌
        logEntry.error = true;
        logEntry.errorText = errorText.substring(0, this.logConfig.maxLength);
        logEntry.errorMessage = this.extractErrorMessage(errorText);
        await this.saveLogEntry(logEntry);

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // ========== 成功響應處理 ==========

      // 處理 204 No Content
      if (response.status === 204) {
        logEntry.noContent = true;
        logEntry.success = true;
        await this.saveLogEntry(logEntry);

        return {
          success: true,
          data: null,
          message: "操作成功",
          duration,
        };
      }

      // 解析 JSON
      let jsonResult;
      try {
        jsonResult = await response.json();
      } catch (error) {
        console.error("JSON 解析失敗:", error);

        logEntry.jsonParseError = true;
        logEntry.parseError = error.message;
        await this.saveLogEntry(logEntry);

        throw new Error("服務器返回了無效的 JSON 格式");
      }

      console.log("📦🦀 [Rust] 響應數據結構:", {
        hasDataProperty: "data" in jsonResult,
        hasSuccessProperty: "success" in jsonResult,
        dataType: typeof jsonResult,
        isArray: Array.isArray(jsonResult),
        data: Array.isArray(jsonResult) ? jsonResult[0] : jsonResult.data,
      });

      // 適配不同的響應格式
      let result;
      if (jsonResult.success !== undefined) {
        result = {
          success: jsonResult.success,
          data: jsonResult.data || jsonResult,
          message: jsonResult.message || "成功",
          meta: jsonResult.meta || null,
          duration,
        };
      } else if (Array.isArray(jsonResult)) {
        result = {
          success: true,
          data: jsonResult,
          message: "成功",
          duration,
        };
      } else {
        result = {
          success: true,
          data: jsonResult,
          message: "成功",
          duration,
        };
      }

      // ✅ 記錄成功日誌
      logEntry.success = true;
      await this.saveLogEntry(logEntry);

      // 更新性能指標
      this.updateMetrics(duration, true);

      return result;
    } catch (error) {
      console.error(`🦀 [Rust] 請求失敗:`, error);

      // ✅ 確保錯誤也被記錄
      if (response) {
        const errorLogEntry = this.generateLogEntry(response, {
          ...logContext,
          duration: Date.now() - startTime,
        });
        errorLogEntry.error = true;
        errorLogEntry.errorMessage = error.message;
        await this.saveLogEntry(errorLogEntry);
      }

      // 優雅降級
      if (this.mode === "hybrid" && context.fallbackToDirectus !== false) {
        console.warn("🔄 降級到 Directus 服務");
      }

      throw this.wrapRustError(error, logContext);
    }
  }

  // ========== 輔助方法 ==========

  /**
   * Rust 特定的錯誤處理
   */
  handleRustError(error) {
    if (
      error.message.includes("NetworkError") ||
      error.message.includes("Failed to fetch")
    ) {
      return {
        success: false,
        message: "Rust 服務未啟動或網路連接失敗",
        errorCode: "RUST_NOT_AVAILABLE",
        details: "請確保 Rust 服務正在運行",
      };
    }

    if (
      error.message.includes("401") ||
      error.message.includes("Unauthorized")
    ) {
      return {
        success: false,
        message: "認證失敗，請重新登入",
        errorCode: "UNAUTHORIZED",
        details: error.message,
      };
    }

    if (error.message.includes("404")) {
      return {
        success: false,
        message: "資源不存在",
        errorCode: "NOT_FOUND",
        details: error.message,
      };
    }

    return {
      success: false,
      message: "Rust 服務操作失敗",
      errorCode: "RUST_ERROR",
      details: error.message,
    };
  }

  /**
   * ✅ 提取錯誤信息（與 baseService 一致）
   */
  extractErrorMessage(errorText) {
    if (!errorText) {
      return "無詳細錯誤信息";
    }

    try {
      const errorJson = JSON.parse(errorText);

      // Rust 錯誤格式
      if (errorJson.error) {
        return typeof errorJson.error === "string"
          ? errorJson.error
          : JSON.stringify(errorJson.error);
      }

      if (errorJson.message) {
        return errorJson.message;
      }

      if (Array.isArray(errorJson.errors) && errorJson.errors.length > 0) {
        return errorJson.errors
          .map((err) => err.message || err.toString())
          .join("; ");
      }

      return JSON.stringify(errorJson).substring(0, 200);
    } catch {
      return errorText.substring(0, 200);
    }
  }

  /**
   * 獲取完整的 API URL
   */
  getUrl(endpoint, id = null) {
    let url = `${this.rustApiBaseUrl}${endpoint}`;
    if (id !== null) {
      url += `/${id}`;
    }
    return url;
  }

  /**
   * 獲取 Rust 認證令牌
   */
  getRustToken() {
    return (
      sessionStorage.getItem("auth-token") || localStorage.getItem("auth-token")
    );
  }

  /**
   * 設置 Rust 令牌
   */
  setRustToken(token, remember = false) {
    if (remember) {
      localStorage.setItem("auth-token", token);
    } else {
      sessionStorage.setItem("auth-token", token);
    }
  }

  /**
   * 清除 Rust 令牌
   */
  clearRustToken() {
    sessionStorage.removeItem("auth-token");
    localStorage.removeItem("auth-token");
  }

  /**
   * 錯誤包裝
   */
  wrapRustError(error, context) {
    const rustError = new Error(`❌🦀 [Rust] ${error.message}`);
    rustError.context = context;
    rustError.isRustError = true;
    rustError.timestamp = DateUtils.getCurrentISOTime();
    return rustError;
  }

  /**
   * 更新性能指標
   */
  updateMetrics(duration, isSuccess) {
    if (isSuccess) {
      this.metrics.successRequests++;
    }
    this.metrics.avgResponseTime =
      this.metrics.avgResponseTime * 0.9 + duration * 0.1;
  }

  /**
   * 獲取性能報告
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate:
        this.metrics.totalRequests > 0
          ? (
              (this.metrics.successRequests / this.metrics.totalRequests) *
              100
            ).toFixed(2) + "%"
          : "0%",
      avgResponseTime: this.metrics.avgResponseTime.toFixed(2) + "ms",
    };
  }

  getIsMock() {
    return this.isMock;
  }

  // ========== 快捷方法 ==========

  async dbTest() {
    return await this.rustFetch(
      this.endpoints.dbTest,
      { method: "GET" },
      {
        service: "BaseRustService",
        operation: "dbTest",
      },
    );
  }

  async serverInfo() {
    return await this.rustFetch(
      this.endpoints.serverInfo,
      { method: "GET" },
      {
        service: "BaseRustService",
        operation: "serverInfo",
      },
    );
  }

  async serverPing() {
    return await this.rustFetch(
      this.endpoints.serverPing,
      { method: "GET" },
      {
        service: "BaseRustService",
        operation: "serverPing",
      },
    );
  }

  async healthCheck() {
    return await this.rustFetch(
      this.endpoints.health,
      { method: "GET" },
      {
        service: "BaseRustService",
        operation: "healthCheck",
      },
    );
  }
}

export const baseRustService = new BaseRustService();
