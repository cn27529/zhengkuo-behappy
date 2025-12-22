// src/utils/indexedDB.js
import { DateUtils } from "./dateUtils.js";

export class IndexedDBLogger {
  constructor(dbName = "DirectusLogsDB", version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.storeName = "responseLogs";
  }

  // 開啟或創建數據庫
  async openDatabase() {
    return new Promise((resolve, reject) => {
      // 檢查瀏覽器支援
      if (!window.indexedDB) {
        console.warn("此瀏覽器不支援 IndexedDB");
        reject(new Error("IndexedDB not supported"));
        return;
      }

      // 開啟數據庫請求
      const request = indexedDB.open(this.dbName, this.version);

      // 處理錯誤
      request.onerror = (event) => {
        console.error("IndexedDB 開啟失敗:", event.target.error);
        reject(event.target.error);
      };

      // 數據庫升級/創建時
      request.onupgradeneeded = (event) => {
        console.log("IndexedDB 升級/創建中...");
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
        console.log("IndexedDB 開啟成功");
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
          id: Date.now() + Math.random().toString(36).substr(2, 9),
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

        // 根據條件選擇索引
        let index;
        if (filter.endpoint) {
          index = store.index("endpoint");
          const request = index.getAll(filter.endpoint);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        } else if (filter.status) {
          index = store.index("status");
          const request = index.getAll(filter.status);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        } else {
          // 無條件獲取全部
          const request = store.getAll();
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        }
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

        const cutoffDate =
          DateUtils.formatDateTimeYMD(DateUtils.getCurrentISOTime()) ||
          new Date();
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
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error("清理日誌失敗:", error);
      return 0;
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
}

// 導出單例
export const indexedDBLogger = new IndexedDBLogger();
