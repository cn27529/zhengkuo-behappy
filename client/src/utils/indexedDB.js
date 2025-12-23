// src/utils/indexedDB.js
import { DateUtils } from "./dateUtils.js";

export class IndexedDBLogger {
  constructor(dbName = "DirectusLogsDB", version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.storeName = "responseLogs";
    this._dbConnection = null;
    this._logQueue = [];

    // // 每小時自動清理一次
    // setInterval(() => {
    //   this.cleanupOldLogs(30);
    // }, 3600000);

  }



  async getConnection() {
    if (!this._dbConnection) {
      this._dbConnection = await this.openDatabase();
    }
    return this._dbConnection;
  }  

  // 開啟或創建數據庫
  async openDatabase() {
    return new Promise((resolve, reject) => {
      // 檢查瀏覽器支援
      if (!window.indexedDB) {
        console.warn("IndexedDB 此瀏覽器不支援");
        reject(new Error("IndexedDB 此瀏覽器不支援"));
        return;
      }

      // 開啟數據庫請求
      const request = indexedDB.open(this.dbName, this.version);

      // 處理錯誤
      request.onerror = (event) => {
        console.error("IndexedDB 資料庫開啟失敗:", event.target.error);
        // 提供更具體的錯誤信息
        if (error.name === "QuotaExceededError") {
          reject(new Error("儲存空間不足，請清理舊日誌"));
        } else if (error.name === "VersionError") {
          reject(new Error("資料庫版本衝突"));
        } else {
          reject(error);
        }
      };

      // 數據庫升級/創建時
      request.onupgradeneeded = (event) => {
        console.log("IndexedDB 資料庫升級/創建中...");
        const db = event.target.result;

        // 創建對象存儲（如果不存在）
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, {
            keyPath: "id",
            autoIncrement: true,
          });

          // 創建索引
          store.createIndex("timestamp", "timestamp", { unique: false });
          store.createIndex("status", "status", { unique: false });
          store.createIndex("endpoint", "endpoint", { unique: false });
          store.createIndex("success", "success", { unique: false });

          console.log(`對象存儲 "${this.storeName}" 創建成功`);
        }
      };

      // 成功開啟
      request.onsuccess = (event) => {
        const db = event.target.result;
        console.log("IndexedDB 資料庫開啟成功");
        resolve(db);
      };
    });
  }

  // 添加日誌條目
  async addLog(logEntry) {
    try {   

      const db = await this.openDatabase();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);

        const request = store.add({
          ...logEntry,
          //id: Date.now() + Math.random().toString(36).substr(2, 9),
          id: crypto.randomUUID(), // 標準且保證唯一
          //id: `${Date.now()}-${crypto.getRandomValues(new Uint32Array(1))[0]}`, // 或使用更安全的方式
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        });

        request.onsuccess = () => {
          console.log("日誌已保存到 IndexedDB");
          resolve(true);
        };

        request.onerror = (event) => {
          console.error("保存日誌失敗:", event.target.error);
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.warn("保存到 IndexedDB 失敗，使用備用方案:", error);
      return this.saveToLocalStorage(logEntry); // 降級方案
    }
  }

  async addLogs(logEntries) {
    // 批次新增
    const db = await this.getConnection();
    const tx = db.transaction([this.storeName], 'readwrite');
    
    for (const entry of logEntries) {
      tx.objectStore(this.storeName).add(entry);
    }
    
    await tx.complete;
  }

  async flushLogs() {
    if (this._logQueue.length === 0) return;
    
    const logs = [...this._logQueue];
    this._logQueue = [];
    
    // 批次寫入
    await this.addLogsBatch(logs);
  }

  // 查詢日誌
  async getLogs(options = {}) {
    try {
      const db = await this.openDatabase();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], "readonly");
        const store = transaction.objectStore(this.storeName);
        const index = store.index("timestamp");

        let request;

        // 根據條件查詢
        if (options.limit) {
          request = index.openCursor(null, "prev"); // 反向，最新在前
        } else {
          request = index.getAll();
        }

        const results = [];

        request.onsuccess = (event) => {
          const cursor = event.target.result;

          if (cursor && (!options.limit || results.length < options.limit)) {
            results.push(cursor.value);
            cursor.continue();
          } else {
            resolve(results);
          }
        };

        request.onerror = (event) => {
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error("查詢日誌失敗:", error);
      return [];
    }
  }

  // 根據條件查詢
  async queryLogs(filter) {
    try {
      const db = await this.openDatabase();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], "readonly");
        const store = transaction.objectStore(this.storeName);

        const request = store.getAll();
        request.onsuccess = () => {
          let results = request.result;

          // 過濾結果
          if (filter.search) {
            const searchTerm = filter.search.toLowerCase();
            results = results.filter(
              (log) =>
                log.endpoint?.toLowerCase().includes(searchTerm) ||
                log.context?.service?.toLowerCase().includes(searchTerm) ||
                log.context?.operation?.toLowerCase().includes(searchTerm) ||
                log.errorText?.toLowerCase().includes(searchTerm) ||
                JSON.stringify(log.requestBody || "")
                  .toLowerCase()
                  .includes(searchTerm)
            );
          }

          if (filter.endpoint) {
            results = results.filter((log) =>
              log.endpoint
                ?.toLowerCase()
                .includes(filter.endpoint.toLowerCase())
            );
          }

          if (filter.method) {
            results = results.filter((log) => log.method === filter.method);
          }

          if (filter.status) {
            results = results.filter(
              (log) => String(log.status) === String(filter.status)
            );
          }

          if (filter.dateFrom || filter.dateTo) {
            results = results.filter((log) => {
              const logDate = new Date(log.timestamp)
                .toISOString()
                .split("T")[0];

              if (filter.dateFrom && logDate < filter.dateFrom) return false;
              if (filter.dateTo && logDate > filter.dateTo) return false;
              return true;
            });
          }

          // 按時間倒序排序（最新在前）
          results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

          resolve(results);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("查詢日誌失敗:", error);
      return [];
    }
  }

  // 清理舊日誌
  async cleanupOldLogs(maxAgeDays = 30) {
    try {
      const db = await this.openDatabase();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);
        const index = store.index("timestamp");

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

        const range = IDBKeyRange.upperBound(cutoffDate.toISOString());
        const request = index.openCursor(range);

        let deletedCount = 0;

        request.onsuccess = (event) => {
          const cursor = event.target.result;

          if (cursor) {
            cursor.delete();
            deletedCount++;
            cursor.continue();
          } else {
            console.log(`已清理 ${deletedCount} 條舊日誌`);
            resolve(deletedCount);
          }
        };

        request.onerror = (event) => {
          console.error("清理日誌失敗:", event.target.error);
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error("清理日誌失敗:", error);
      return 0;
    }
  }

  // 清理全部日誌
  async clearAllLogs() {
    try {
      const db = await this.openDatabase();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);

        const request = store.clear();

        request.onsuccess = () => {
          console.log("已清理全部日誌");
          resolve(true);
        };

        request.onerror = (event) => {
          console.error("清理全部日誌失敗:", event.target.error);
          reject(event.target.error);
        };

        // 也清理備用的 localStorage 數據
        this.clearLocalStorageBackup();
      });
    } catch (error) {
      console.error("清理全部日誌失敗:", error);
      return false;
    }
  }

  // 統計日誌數量
  async countLogs() {
    try {
      const db = await this.openDatabase();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], "readonly");
        const store = transaction.objectStore(this.storeName);

        const request = store.count();

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = (event) => {
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error("統計日誌數量失敗:", error);
      return 0;
    }
  }

  // 清理備用 localStorage 數據
  clearLocalStorageBackup() {
    try {
      const logsKey = "directus_logs_fallback";
      localStorage.removeItem(logsKey);
      console.log("已清理 localStorage 備份數據");
      return true;
    } catch (error) {
      console.error("清理 localStorage 備份失敗:", error);
      return false;
    }
  }

  // 備用方案：保存到 localStorage
  saveToLocalStorage(logEntry) {
    try {
      const logsKey = "directus_logs_fallback";
      let logs = JSON.parse(localStorage.getItem(logsKey) || "[]");

      // 限制數量
      logs.unshift(logEntry);
      if (logs.length > 100) {
        logs = logs.slice(0, 100);
      }

      localStorage.setItem(logsKey, JSON.stringify(logs));
      return true;
    } catch (error) {
      console.error("備用儲存也失敗:", error);
      return false;
    }
  }

  // 獲取數據庫大小（估算）
  async getDatabaseSize() {
    try {
      const db = await this.openDatabase();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], "readonly");
        const store = transaction.objectStore(this.storeName);
        const request = store.getAll();

        request.onsuccess = () => {
          const data = request.result;
          const jsonString = JSON.stringify(data);
          const sizeInBytes = new Blob([jsonString]).size;

          // 格式化大小
          let sizeText;
          if (sizeInBytes < 1024) {
            sizeText = `${sizeInBytes} B`;
          } else if (sizeInBytes < 1024 * 1024) {
            sizeText = `${(sizeInBytes / 1024).toFixed(2)} KB`;
          } else {
            sizeText = `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
          }

          resolve({
            bytes: sizeInBytes,
            formatted: sizeText,
            count: data.length,
          });
        };

        request.onerror = (event) => {
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error("獲取數據庫大小失敗:", error);
      return { bytes: 0, formatted: "0 B", count: 0 };
    }
  }
}

// 導出單例
export const indexedDBLogger = new IndexedDBLogger();
