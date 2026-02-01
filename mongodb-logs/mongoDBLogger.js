// mongoDBLogger.js - MongoDB Atlas 遠程日誌整合模組
import { MongoClient } from "mongodb";

/**
 * MongoDB 遠程日誌管理器
 * 配合 IndexedDBLogger 使用，提供雲端備份和查詢功能
 */
export class MongoDBRemoteLogger {
  constructor(config) {
    this.config = {
      uri:
        "mongodb+srv://dbo:1q2w3e@cluster0.z2em3hn.mongodb.net/?appName=Cluster0" ||
        config.uri, // MongoDB Atlas 連線字串
      dbName: config.dbName || "logEntryDB",
      collectionName: config.collectionName || "zk_client_logs",
      batchSize: config.batchSize || 50, // 批次上傳數量
      syncInterval: config.syncInterval || 300000, // 同步間隔 (5分鐘)
      autoSync: config.autoSync !== false, // 自動同步開關
      projectId: config.projectId || "5a090dd50bd66b458726ffa4", // 專案 ID
    };

    this.client = null;
    this.db = null;
    this.collection = null;
    this.uploadQueue = [];
    this.isConnecting = false;
    this.isConnected = false;
    this.syncTimer = null;

    // 啟動自動同步
    if (this.config.autoSync) {
      this.startAutoSync();
    }
  }

  /**
   * 初始化 MongoDB 連線
   */
  async connect() {
    if (this.isConnected) return true;
    if (this.isConnecting) {
      // 等待連線完成
      await new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!this.isConnecting) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
      return this.isConnected;
    }

    this.isConnecting = true;

    try {
      console.log("🔌 正在連線到 MongoDB Atlas...");

      this.client = new MongoClient(this.config.uri, {
        maxPoolSize: 10,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      await this.client.connect();

      this.db = this.client.db(this.config.dbName);
      this.collection = this.db.collection(this.config.collectionName);

      // 建立索引以提升查詢效能
      await this.createIndexes();

      this.isConnected = true;
      console.log("✅ MongoDB Atlas 連線成功！");
      return true;
    } catch (error) {
      console.error("❌ MongoDB 連線失敗:", error.message);
      this.isConnected = false;
      return false;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * 建立資料庫索引
   */
  async createIndexes() {
    try {
      await this.collection.createIndex({ timestamp: -1 });
      await this.collection.createIndex({ status: 1 });
      await this.collection.createIndex({ endpoint: 1 });
      await this.collection.createIndex({ success: 1 });
      await this.collection.createIndex({ uploadedAt: -1 });
      console.log("📊 索引建立成功");
    } catch (error) {
      console.warn("⚠️ 索引建立失敗:", error.message);
    }
  }

  /**
   * 新增日誌到上傳佇列
   */
  addToQueue(logEntry) {
    // 只上傳失敗或錯誤的日誌 (節省空間和流量)
    const shouldUpload = !logEntry.success || logEntry.status >= 400;

    if (shouldUpload) {
      this.uploadQueue.push(logEntry);
      console.log(
        `📝 日誌已加入佇列 (${this.uploadQueue.length}/${this.config.batchSize})`,
      );

      // 達到批次大小就立即同步
      if (this.uploadQueue.length >= this.config.batchSize) {
        this.syncNow();
      }
    }
  }

  /**
   * 立即同步日誌到 MongoDB
   */
  async syncNow() {
    if (this.uploadQueue.length === 0) {
      return { success: true, count: 0, message: "沒有待上傳的日誌" };
    }

    try {
      // 確保已連線
      if (!this.isConnected) {
        const connected = await this.connect();
        if (!connected) {
          return { success: false, message: "MongoDB 連線失敗" };
        }
      }

      // 取出待上傳的日誌
      const logsToUpload = [...this.uploadQueue];
      this.uploadQueue = [];

      // 準備資料
      const preparedLogs = logsToUpload.map((log) => ({
        ...this.cleanLogData(log),
        uploadedAt: new Date(),
        source: "web-client",
        projectId: "632c16c128686c379ccac3c4", // 你的 Project ID
      }));

      // 批次插入
      const result = await this.collection.insertMany(preparedLogs, {
        ordered: false, // 允許部分失敗
      });

      const message = `✅ 成功上傳 ${result.insertedCount} 筆日誌到 MongoDB`;
      console.log(message);

      return {
        success: true,
        count: result.insertedCount,
        message,
      };
    } catch (error) {
      console.error("❌ MongoDB 同步失敗:", error.message);

      // 失敗時將日誌放回佇列
      this.uploadQueue.unshift(...logsToUpload);

      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 清理日誌資料 (移除不必要的欄位)
   */
  cleanLogData(log) {
    const cleaned = { ...log };

    // 移除過大的欄位以節省空間
    if (
      cleaned.responseData &&
      JSON.stringify(cleaned.responseData).length > 10000
    ) {
      cleaned.responseData = "[Data too large]";
    }

    if (
      cleaned.requestBody &&
      JSON.stringify(cleaned.requestBody).length > 10000
    ) {
      cleaned.requestBody = "[Data too large]";
    }

    return cleaned;
  }

  /**
   * 查詢遠程日誌
   */
  async queryLogs(filter = {}, options = {}) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const query = this.buildQuery(filter);
      const limit = options.limit || 100;
      const skip = options.skip || 0;

      const logs = await this.collection
        .find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      return {
        success: true,
        data: logs,
        count: logs.length,
      };
    } catch (error) {
      console.error("❌ 查詢失敗:", error.message);
      return {
        success: false,
        message: error.message,
        data: [],
      };
    }
  }

  /**
   * 建立查詢條件
   */
  buildQuery(filter) {
    const query = {};

    if (filter.endpoint) {
      query.endpoint = { $regex: filter.endpoint, $options: "i" };
    }

    if (filter.method) {
      query.method = filter.method;
    }

    if (filter.status) {
      query.status = parseInt(filter.status);
    }

    if (filter.success !== undefined) {
      query.success = filter.success;
    }

    if (filter.dateFrom || filter.dateTo) {
      query.timestamp = {};
      if (filter.dateFrom) {
        query.timestamp.$gte = new Date(filter.dateFrom).toISOString();
      }
      if (filter.dateTo) {
        query.timestamp.$lte = new Date(filter.dateTo).toISOString();
      }
    }

    return query;
  }

  /**
   * 統計日誌數量
   */
  async getStats() {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const [total, errors, last24h] = await Promise.all([
        this.collection.countDocuments(),
        this.collection.countDocuments({ success: false }),
        this.collection.countDocuments({
          uploadedAt: {
            $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        }),
      ]);

      return {
        success: true,
        stats: {
          total,
          errors,
          last24h,
          queueSize: this.uploadQueue.length,
        },
      };
    } catch (error) {
      console.error("❌ 統計失敗:", error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * 清理舊日誌
   */
  async cleanup(daysToKeep = 30) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await this.collection.deleteMany({
        uploadedAt: { $lt: cutoffDate },
      });

      const message = `🗑️ 已清理 ${result.deletedCount} 筆舊日誌 (>${daysToKeep}天)`;
      console.log(message);

      return {
        success: true,
        deletedCount: result.deletedCount,
        message,
      };
    } catch (error) {
      console.error("❌ 清理失敗:", error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * 啟動自動同步
   */
  startAutoSync() {
    if (this.syncTimer) return;

    this.syncTimer = setInterval(() => {
      if (this.uploadQueue.length > 0) {
        console.log("⏰ 自動同步觸發...");
        this.syncNow();
      }
    }, this.config.syncInterval);

    console.log(
      `⚙️ 自動同步已啟動 (間隔: ${this.config.syncInterval / 1000}秒)`,
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
   * 關閉連線
   */
  async disconnect() {
    try {
      // 先同步剩餘的日誌
      if (this.uploadQueue.length > 0) {
        await this.syncNow();
      }

      this.stopAutoSync();

      if (this.client) {
        await this.client.close();
        this.client = null;
        this.isConnected = false;
        console.log("👋 MongoDB 連線已關閉");
      }
    } catch (error) {
      console.error("關閉連線時發生錯誤:", error.message);
    }
  }
}

export default MongoDBRemoteLogger;
