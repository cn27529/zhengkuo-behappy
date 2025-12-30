// src/rustServices/baseRustService.js
import { DateUtils } from "../utils/dateUtils.js";

export class BaseRustService {
  constructor() {
    console.log("🦀 BaseRustService 初始化");

    // 配置
    this.rustApiBaseUrl =
      import.meta.env.VITE_RUST_API_URL || "http://localhost:3000";
    this.mode = import.meta.env.VITE_RUST_MODE || "mock"; // rust, mock, hybrid

    // API 端點（簡潔的 RESTful 風格）
    this.endpoints = {
      // 認證
      auth: {
        login: "/api/auth/login",
        logout: "/api/auth/logout",
        refresh: "/api/auth/refresh",
        me: "/api/auth/me",
      },

      // 數據資源
      activities: "/api/activities",
      registrations: "/api/registrations",
      monthlyDonates: "/api/monthly-donates",
      users: "/api/users",

      // 系統
      health: "/api/health",
      serverInfo: "/api/server/info",
      metrics: "/api/metrics",
    };

    // 性能監控
    this.metrics = {
      totalRequests: 0,
      successRequests: 0,
      avgResponseTime: 0,
    };
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
   * Rust 風格的 API 調用（與 Directus 不同）
   */
  async rustFetch(endpoint, options = {}, context = {}) {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    const defaultOptions = {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include", // 支持 Cookie 認證
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

    const url = this.getUrl(endpoint);

    // 日誌上下文
    const logContext = {
      timestamp: DateUtils.getCurrentISOTime(),
      service: "RustService",
      operation: context.operation || endpoint.split("/").pop() || "unknown",
      endpoint: url,
      method: finalOptions.method || "GET",
      startTime,
    };

    try {
      console.log(`🦀 [Rust] 請求: ${finalOptions.method || "GET"} ${url}`);

      // Mock 模式
      if (this.mode === "mock") {
        await this.mockDelay();
        return this.handleMockResponse(endpoint, finalOptions, logContext);
      }

      // 實際請求
      const response = await fetch(url, finalOptions);
      const duration = Date.now() - startTime;

      // 更新性能指標
      this.updateMetrics(duration, response.ok);

      // Rust 專用響應處理
      const result = await this.handleRustResponse(response, {
        ...logContext,
        duration,
      });

      return result;
    } catch (error) {
      console.error(`🦀 [Rust] 請求失敗:`, error);

      // 優雅降級：可以自動切換到 Directus 或返回模擬數據
      if (this.mode === "hybrid" && context.fallbackToDirectus !== false) {
        console.warn("🔄 降級到 Directus 服務");
        // 這裡可以調用原有的 Directus 服務
      }

      throw this.wrapRustError(error, logContext);
    }
  }

  /**
   * Rust 響應處理（與 Directus 格式不同）
   */
  async handleRustResponse(response, context) {
    const { duration } = context;

    if (!response.ok) {
      const errorData = await this.parseRustError(response);
      throw new Error(errorData.message || `Rust 錯誤: ${response.status}`);
    }

    // 處理不同類型的響應
    const contentType = response.headers.get("content-type") || "";

    if (response.status === 204) {
      return {
        success: true,
        data: null,
        message: "操作成功",
        duration,
      };
    }

    if (contentType.includes("application/json")) {
      const data = await response.json();

      // Rust 常見響應格式
      return {
        success: true,
        data: data.data || data,
        message: data.message || "成功",
        meta: data.meta || null,
        duration,
        rawResponse: data,
      };
    }

    // 其他類型響應
    const text = await response.text();
    return {
      success: true,
      data: text,
      message: "成功",
      duration,
    };
  }

  /**
   * Rust 錯誤解析
   */
  async parseRustError(response) {
    try {
      const text = await response.text();
      if (!text) {
        return {
          message: `HTTP ${response.status}: ${response.statusText}`,
          code: `HTTP_${response.status}`,
        };
      }

      // 嘗試解析為 JSON
      const json = JSON.parse(text);

      // Axum/Actix 常見錯誤格式
      if (json.error) {
        return {
          message: json.error,
          code: json.code || "RUST_ERROR",
          details: json.details,
        };
      }

      if (json.message) {
        return {
          message: json.message,
          code: "RUST_ERROR",
        };
      }

      return {
        message: text.substring(0, 200),
        code: "RUST_ERROR",
      };
    } catch {
      return {
        message: `HTTP ${response.status}: ${response.statusText}`,
        code: `HTTP_${response.status}`,
      };
    }
  }

  /**
   * 獲取 Rust 認證令牌
   */
  getRustToken() {
    // 優先使用 Rust 專用令牌
    return (
      sessionStorage.getItem("auth-token") ||
      localStorage.getItem("auth-token") ||
      sessionStorage.getItem("auth-token") || // 兼容原有令牌
      localStorage.getItem("auth-token")
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
   * 模擬響應（用於測試）
   */
  async handleMockResponse(endpoint, options, context) {
    await this.mockDelay();

    const mockData = this.generateMockData(endpoint, options);

    return {
      success: true,
      data: mockData,
      message: "模擬數據 (Rust Mock)",
      duration: context.duration || 100,
      isMock: true,
    };
  }

  /**
   * 生成模擬數據
   */
  generateMockData(endpoint, options) {
    const now = DateUtils.getCurrentISOTime();

    if (endpoint.includes("/activities")) {
      return {
        id: crypto.randomUUID(),
        name: "Rust 模擬活動",
        participants: Math.floor(Math.random() * 100),
        date: now,
        state: "upcoming",
        createdAt: now,
        updatedAt: now,
      };
    }

    if (endpoint.includes("/registrations")) {
      return {
        id: crypto.randomUUID(),
        activityId: "mock-activity-123",
        userName: "測試用戶",
        userPhone: "0912345678",
        createdAt: now,
      };
    }

    return { endpoint, options, timestamp: now };
  }

  /**
   * 模擬延遲
   */
  async mockDelay(ms = 300) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 錯誤包裝
   */
  wrapRustError(error, context) {
    const rustError = new Error(`🦀 [Rust] ${error.message}`);
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

    // 計算平均響應時間（加權移動平均）
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
}

export const baseRustService = new BaseRustService();
