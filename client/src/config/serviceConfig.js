// src/config/serviceConfig.js
export class ServiceConfig {
  constructor() {
    // 主後端配置
    this.primaryBackend = import.meta.env.VITE_BACKEND_TYPE || "directus";

    // 備援後端配置
    this.fallbackBackend = import.meta.env.VITE_FALLBACK_BACKEND || "directus";

    // 自動降級開關
    this.autoFallback = import.meta.env.VITE_AUTO_FALLBACK === "true";

    // 健康檢查配置
    this.healthCheck = {
      enabled: true,
      interval: 30000, // 30秒
      timeout: 5000, // 5秒超時
      retries: 3, // 重試次數
    };

    // 當前使用的後端
    this.currentBackend = this.primaryBackend;

    // 後端健康狀態
    this.backendHealth = {
      directus: { status: "unknown", lastCheck: null, failCount: 0 },
      axum: { status: "unknown", lastCheck: null, failCount: 0 },
    };
  }

  /**
   * 獲取當前應使用的後端
   */
  getCurrentBackend() {
    return this.currentBackend;
  }

  /**
   * 檢查後端健康狀態
   */
  async checkHealth(backend) {
    const urls = {
      directus: import.meta.env.VITE_API_BASE_URL + "/server/ping",
      axum: import.meta.env.VITE_RUST_API_URL + "/health",
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.healthCheck.timeout
      );

      const response = await fetch(urls[backend], {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const isHealthy = response.ok;
      this.backendHealth[backend] = {
        status: isHealthy ? "healthy" : "unhealthy",
        lastCheck: new Date().toISOString(),
        failCount: isHealthy ? 0 : this.backendHealth[backend].failCount + 1,
      };

      return isHealthy;
    } catch (error) {
      console.error(`❌ ${backend} 健康檢查失敗:`, error);
      this.backendHealth[backend] = {
        status: "unhealthy",
        lastCheck: new Date().toISOString(),
        failCount: this.backendHealth[backend].failCount + 1,
      };
      return false;
    }
  }

  /**
   * 自動降級邏輯
   */
  async handleFailure(backend) {
    if (!this.autoFallback) {
      console.warn("⚠️ 自動降級未啟用");
      return false;
    }

    const failCount = this.backendHealth[backend].failCount;

    // 連續失敗3次觸發降級
    if (failCount >= this.healthCheck.retries) {
      console.warn(
        `⚠️ ${backend} 連續失敗 ${failCount} 次，嘗試降級到 ${this.fallbackBackend}`
      );

      // 檢查備援後端是否健康
      const fallbackHealthy = await this.checkHealth(this.fallbackBackend);

      if (fallbackHealthy) {
        this.currentBackend = this.fallbackBackend;
        console.log(`✅ 已降級到 ${this.fallbackBackend}`);

        // 通知用戶（可選）
        this.notifyUser("系統已切換到備援服務，功能正常");

        return true;
      } else {
        console.error("❌ 備援後端也不可用");
        this.notifyUser("服務暫時不可用，請稍後再試", "error");
        return false;
      }
    }

    return false;
  }

  /**
   * 定期健康檢查
   */
  startHealthCheck() {
    if (!this.healthCheck.enabled) return;

    setInterval(async () => {
      const primaryHealthy = await this.checkHealth(this.primaryBackend);

      // 如果主後端恢復健康，且當前使用備援，則切回主後端
      if (primaryHealthy && this.currentBackend === this.fallbackBackend) {
        console.log(`✅ ${this.primaryBackend} 已恢復，切換回主後端`);
        this.currentBackend = this.primaryBackend;
        this.notifyUser("系統已恢復正常");
      }

      // 如果主後端不健康，觸發降級檢查
      if (!primaryHealthy && this.currentBackend === this.primaryBackend) {
        await this.handleFailure(this.primaryBackend);
      }
    }, this.healthCheck.interval);
  }

  /**
   * 手動切換後端（用於測試）
   */
  async switchBackend(backend) {
    if (!["directus", "axum"].includes(backend)) {
      throw new Error("無效的後端類型");
    }

    const isHealthy = await this.checkHealth(backend);

    if (isHealthy) {
      this.currentBackend = backend;
      console.log(`✅ 手動切換到 ${backend}`);
      return true;
    } else {
      console.error(`❌ ${backend} 不可用，無法切換`);
      return false;
    }
  }

  /**
   * 通知用戶
   */
  notifyUser(message, type = "info") {
    // 這裡可以整合你的通知系統
    console.log(`[${type.toUpperCase()}] ${message}`);

    // 示例：使用 Element Plus 通知
    // if (window.ElMessage) {
    //   window.ElMessage[type](message)
    // }
  }

  /**
   * 獲取後端狀態報告
   */
  getStatusReport() {
    return {
      current: this.currentBackend,
      primary: this.primaryBackend,
      fallback: this.fallbackBackend,
      autoFallback: this.autoFallback,
      health: this.backendHealth,
    };
  }
}

export const serviceConfig = new ServiceConfig();

// 啟動健康檢查
if (typeof window !== "undefined") {
  serviceConfig.startHealthCheck();
}
