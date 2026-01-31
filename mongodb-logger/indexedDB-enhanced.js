// indexedDB-enhanced.js - 增強版 IndexedDBLogger (整合 MongoDB)
import { IndexedDBLogger } from "./indexedDB.js";
import { MongoDBRemoteLogger } from "./mongoDBLogger.js";

/**
 * 增強版日誌管理器 - 同時支援本地 IndexedDB 和遠程 MongoDB
 */
export class EnhancedLogger extends IndexedDBLogger {
  constructor(dbName = "DirectusLogsDB", version = 1, mongoConfig = null) {
    super(dbName, version);
    
    // 初始化 MongoDB 遠程日誌
    this.remoteLogger = null;
    if (mongoConfig) {
      this.initRemoteLogger(mongoConfig);
    }
  }

  /**
   * 初始化遠程日誌
   */
  initRemoteLogger(mongoConfig) {
    try {
      this.remoteLogger = new MongoDBRemoteLogger(mongoConfig);
      console.log('🌐 遠程日誌模組已初始化');
    } catch (error) {
      console.error('❌ 遠程日誌初始化失敗:', error);
    }
  }

  /**
   * 覆寫 addLog 方法 - 同時儲存到本地和遠程
   */
  async addLog(logEntry) {
    try {
      // 1. 先儲存到本地 IndexedDB (繼承原有功能)
      const localResult = await super.addLog(logEntry);

      // 2. 加入遠程上傳佇列 (非阻塞)
      if (this.remoteLogger) {
        this.remoteLogger.addToQueue(logEntry);
      }

      return localResult;
    } catch (error) {
      console.error('❌ 新增日誌失敗:', error);
      return false;
    }
  }

  /**
   * 手動同步到遠程
   */
  async syncToRemote() {
    if (!this.remoteLogger) {
      return { success: false, message: '遠程日誌未啟用' };
    }

    return await this.remoteLogger.syncNow();
  }

  /**
   * 從遠程查詢日誌
   */
  async queryRemoteLogs(filter = {}, options = {}) {
    if (!this.remoteLogger) {
      return { success: false, message: '遠程日誌未啟用' };
    }

    return await this.remoteLogger.queryLogs(filter, options);
  }

  /**
   * 獲取遠程統計資料
   */
  async getRemoteStats() {
    if (!this.remoteLogger) {
      return { success: false, message: '遠程日誌未啟用' };
    }

    return await this.remoteLogger.getStats();
  }

  /**
   * 清理遠程舊日誌
   */
  async cleanupRemoteLogs(daysToKeep = 30) {
    if (!this.remoteLogger) {
      return { success: false, message: '遠程日誌未啟用' };
    }

    return await this.remoteLogger.cleanup(daysToKeep);
  }

  /**
   * 取得完整統計 (本地 + 遠程)
   */
  async getFullStats() {
    const [localCount, localSize, remoteStats] = await Promise.all([
      this.countLogs(),
      this.getDatabaseSize(),
      this.getRemoteStats(),
    ]);

    return {
      local: {
        count: localCount,
        size: localSize,
      },
      remote: remoteStats.success ? remoteStats.stats : null,
    };
  }

  /**
   * 關閉所有連線
   */
  async close() {
    if (this.remoteLogger) {
      await this.remoteLogger.disconnect();
    }
  }
}

// 導出增強版單例
export const enhancedLogger = new EnhancedLogger();
