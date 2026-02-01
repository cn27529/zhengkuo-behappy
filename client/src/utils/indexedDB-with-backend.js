// indexedDB-with-backend.js - 配合後端 API 的增強版日誌管理器
import { IndexedDBLogger } from "./indexedDB.js";

/**
 * 透過後端 API 同步到 MongoDB 的日誌管理器
 * 這是更安全的做法，不會在前端暴露 MongoDB 連線資訊
 */
export class IndexedDBWithBackend extends IndexedDBLogger {
  constructor(dbName = "DirectusLogsDB", version = 1, backendConfig = {}) {
    super(dbName, version);

    const VITE_MONGODB_URI =
      import.meta.env.VITE_MONGODB_URI || "http://localhost:3002";
    const VITE_MONGODB_DB_NAME =
      import.meta.env.VITE_MONGODB_DB_NAME || "logEntryDB";
    const VITE_MONGODB_COLLECTION_NAME =
      import.meta.env.VITE_MONGODB_COLLECTION_NAME || "zk_client_logs";

    this.backendConfig = {
      baseURL: backendConfig.baseURL || VITE_MONGODB_URI,
      dbName: backendConfig.dbName || VITE_MONGODB_DB_NAME,
      collectionName:
        backendConfig.collectionName || VITE_MONGODB_COLLECTION_NAME,
      logEndpoint: backendConfig.logEndpoint || "/mongo/logentry/",
      statsEndpoint: backendConfig.statsEndpoint || "/mongo/stats",
      healthEndpoint: backendConfig.healthEndpoint || "/health",
      batchSize: backendConfig.batchSize || 50,
      syncInterval: backendConfig.syncInterval || 300000, // 5分鐘
      autoSync: backendConfig.autoSync !== false,
      timeout: backendConfig.timeout || 10000, // 10秒超時
    };

    this.uploadQueue = [];
    this.isSyncing = false;
    this.syncTimer = null;
    this.backendHealthy = false;

    // 檢查後端健康狀態
    this.checkBackendHealth();

    // 啟動自動同步
    if (this.backendConfig.autoSync) {
      this.startAutoSync();
    }
  }

  /**
   * 檢查後端服務器健康狀態
   */
  async checkBackendHealth() {
    try {
      const response = await fetch(
        `${this.backendConfig.baseURL}${this.backendConfig.healthEndpoint}`,
        {
          method: "GET",
          signal: AbortSignal.timeout(3000),
        },
      );

      if (response.ok) {
        this.backendHealthy = true;
        console.log("✅ 後端服務器健康檢查通過");
        return true;
      } else {
        this.backendHealthy = false;
        console.warn("⚠️ 後端服務器回應異常");
        return false;
      }
    } catch (error) {
      this.backendHealthy = false;
      console.warn("⚠️ 無法連接到後端服務器:", error.message);
      return false;
    }
  }

  /**
   * 覆寫 addLog 方法
   */
  async addLog(logEntry) {
    try {
      // 1. 先儲存到本地 IndexedDB
      const localResult = await super.addLog(logEntry);

      // 2. 加入上傳佇列（只上傳失敗或錯誤的日誌）
      const shouldUpload = !logEntry.success || logEntry.status >= 400;

      if (shouldUpload) {
        this.uploadQueue.push(logEntry);
        console.log(
          `📝 日誌已加入上傳佇列 (${this.uploadQueue.length}/${this.backendConfig.batchSize})`,
        );

        // 達到批次大小就立即同步
        if (this.uploadQueue.length >= this.backendConfig.batchSize) {
          this.syncToBackend();
        }
      }

      return localResult;
    } catch (error) {
      console.error("❌ 新增日誌失敗:", error);
      return false;
    }
  }

  /**
   * 同步日誌到後端
   */
  async syncToBackend() {
    // 避免重複同步
    if (this.isSyncing) {
      console.log("⏳ 同步進行中，請稍候...");
      return { success: false, message: "同步進行中" };
    }

    if (this.uploadQueue.length === 0) {
      return { success: true, count: 0, message: "沒有待上傳的日誌" };
    }

    this.isSyncing = true;

    try {
      // 先檢查後端健康狀態
      if (!this.backendHealthy) {
        await this.checkBackendHealth();
        if (!this.backendHealthy) {
          throw new Error("後端服務器不可用");
        }
      }

      // 取出待上傳的日誌
      const logsToUpload = [...this.uploadQueue];
      this.uploadQueue = [];

      console.log(`📤 正在上傳 ${logsToUpload.length} 筆日誌到後端...`);

      // 準備資料
      const preparedLogs = logsToUpload.map((log) => ({
        ...this.deepClean(log),
        uploadedAt: new Date().toISOString(),
        source: "web-client",
      }));

      // 發送到後端
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.backendConfig.timeout,
      );

      const response = await fetch(
        `${this.backendConfig.baseURL}${this.backendConfig.logEndpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            logs: preparedLogs,
            metadata: {
              timestamp: new Date().toISOString(),
              userAgent: navigator.userAgent,
              url: window.location.href,
            },
          }),
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      const message = `✅ 成功上傳 ${logsToUpload.length} 筆日誌到後端`;
      console.log(message);

      return {
        success: true,
        count: logsToUpload.length,
        message,
        response: result,
      };
    } catch (error) {
      console.error("❌ 同步到後端失敗:", error.message);

      // 失敗時將日誌放回佇列
      this.uploadQueue.unshift(...logsToUpload);

      // 標記後端為不健康
      if (error.name === "AbortError" || error.message.includes("fetch")) {
        this.backendHealthy = false;
      }

      return {
        success: false,
        message: `同步失敗: ${error.message}`,
        error: error.message,
      };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * 從後端取得統計資料
   */
  async getBackendStats() {
    try {
      const response = await fetch(
        `${this.backendConfig.baseURL}${this.backendConfig.statsEndpoint}`,
        {
          method: "GET",
          signal: AbortSignal.timeout(5000),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const stats = await response.json();

      return {
        success: true,
        stats,
      };
    } catch (error) {
      console.error("❌ 取得後端統計失敗:", error.message);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 取得完整統計（本地 + 後端）
   */
  async getFullStats() {
    const [localCount, localSize, backendStats] = await Promise.all([
      this.countLogs(),
      this.getDatabaseSize(),
      this.getBackendStats(),
    ]);

    return {
      local: {
        count: localCount,
        size: localSize,
        queueSize: this.uploadQueue.length,
      },
      backend: backendStats.success ? backendStats.stats : null,
      healthy: this.backendHealthy,
    };
  }

  /**
   * 啟動自動同步
   */
  startAutoSync() {
    if (this.syncTimer) return;

    this.syncTimer = setInterval(() => {
      if (this.uploadQueue.length > 0) {
        console.log("⏰ 自動同步觸發...");
        this.syncToBackend();
      }

      // 定期檢查後端健康狀態
      this.checkBackendHealth();
    }, this.backendConfig.syncInterval);

    console.log(
      `⚙️ 自動同步已啟動 (間隔: ${this.backendConfig.syncInterval / 1000}秒)`,
    );
  }

  /**
   * 停止自動同步
   */
  stopAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      console.log("⏹️ 自動同步已停止");
    }
  }

  /**
   * 手動同步（立即）
   */
  async manualSync() {
    console.log("🔄 手動同步中...");
    return await this.syncToBackend();
  }

  /**
   * 清理並關閉
   */
  async close() {
    // 先同步剩餘的日誌
    if (this.uploadQueue.length > 0) {
      console.log("📤 正在同步剩餘日誌...");
      await this.syncToBackend();
    }

    this.stopAutoSync();
    console.log("👋 日誌管理器已關閉");
  }
}

// 導出配置好的單例
export const logger = new IndexedDBWithBackend("DirectusLogsDB", 1, {
  baseURL: "http://localhost:3002",
  logEndpoint: "/mongo/logentry/",
  statsEndpoint: "/mongo/stats",
  healthEndpoint: "/health",
  batchSize: 50,
  syncInterval: 300000, // 5分鐘
  autoSync: true,
});

export default IndexedDBWithBackend;
