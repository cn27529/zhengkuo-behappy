// usage-example.js - 使用範例和設定指南

import { EnhancedLogger } from "./indexedDB-enhanced.js";

/**
 * ==========================================
 * 📋 MongoDB Atlas 設定步驟
 * ==========================================
 *
 * 1. 登入 MongoDB Atlas
 *    https://cloud.mongodb.com
 *
 * 2. 進入你的專案
 *    Project ID: 632c16c128686c379ccac3c4
 *
 * 3. 建立或選擇 Cluster (M0 免費版)
 *    - 點擊 "Database" 選單
 *    - 如果還沒有 cluster，點擊 "Build a Database"
 *    - 選擇 "M0 Free" 方案
 *    - 選擇區域 (建議: Singapore ap-southeast-1)
 *    - 點擊 "Create"
 *
 * 4. 設定資料庫使用者
 *    - 點擊 "Database Access"
 *    - 點擊 "Add New Database User"
 *    - 設定帳號密碼 (記住這個，等下要用)
 *    - 權限選 "Read and write to any database"
 *
 * 5. 設定網路存取
 *    - 點擊 "Network Access"
 *    - 點擊 "Add IP Address"
 *    - 選擇 "Allow Access from Anywhere" (0.0.0.0/0)
 *    - 或只加入你的 IP
 *
 * 6. 取得連線字串
 *    - 回到 "Database"
 *    - 點擊你的 Cluster 的 "Connect"
 *    - 選擇 "Connect your application"
 *    - 選擇 "Driver: Node.js" 和版本
 *    - 複製連線字串，格式如下:
 *      mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
 *    - 將 <username> 和 <password> 替換成你的帳密
 */

// ==========================================
// 🚀 基本使用範例
// ==========================================

// 1. 安裝必要套件
// npm install mongodb

// 2. 初始化日誌管理器
const logger = new EnhancedLogger(
  "DirectusLogsDB", // IndexedDB 名稱
  1, // 版本號
  {
    // MongoDB 連線設定
    uri: "mongodb+srv://dbo:1q2w3e@cluster0.z2em3hn.mongodb.net/?appName=Cluster0", // 替換成你的連線字串
    dbName: "logEntryDB", // 資料庫名稱
    collectionName: "zk_client_logs", // 集合名稱
    batchSize: 50, // 批次上傳筆數
    syncInterval: 300000, // 自動同步間隔 (5分鐘)
    autoSync: false, // 啟用自動同步
    projectId: "5a090dd50bd66b458726ffa4", // 專案 ID
  },
);

// ==========================================
// 📝 記錄日誌範例
// ==========================================

// 記錄 API 請求日誌
async function logAPIRequest(endpoint, method, response) {
  await logger.addLog({
    endpoint,
    method,
    status: response.status,
    success: response.ok,
    responseTime: response.responseTime || 0,
    requestBody: response.requestBody,
    responseData: response.data,
    errorText: response.error,
    context: {
      service: "directus",
      operation: "fetch",
      userId: getCurrentUserId(),
    },
  });
}

// 使用範例
async function fetchData() {
  const startTime = Date.now();

  try {
    const response = await fetch("https://api.example.com/data");
    const data = await response.json();

    // 記錄成功的請求
    await logAPIRequest("/data", "GET", {
      status: response.status,
      ok: response.ok,
      responseTime: Date.now() - startTime,
      data,
    });

    return data;
  } catch (error) {
    // 記錄失敗的請求
    await logAPIRequest("/data", "GET", {
      status: 0,
      ok: false,
      responseTime: Date.now() - startTime,
      error: error.message,
    });

    throw error;
  }
}

// ==========================================
// 🔍 查詢日誌範例
// ==========================================

// 查詢本地日誌 (IndexedDB)
async function queryLocalLogs() {
  const logs = await logger.queryLogs({
    endpoint: "/api/items",
    method: "POST",
    status: 404,
    dateFrom: "2025-01-01",
    dateTo: "2025-01-31",
  });

  console.log("本地日誌:", logs);
  return logs;
}

// 查詢遠程日誌 (MongoDB)
async function queryRemoteLogs() {
  const result = await logger.queryRemoteLogs(
    {
      endpoint: "/api/items",
      success: false,
    },
    {
      limit: 50,
      skip: 0,
    },
  );

  if (result.success) {
    console.log("遠程日誌:", result.data);
    return result.data;
  } else {
    console.error("查詢失敗:", result.message);
    return [];
  }
}

// ==========================================
// 📊 取得統計資料
// ==========================================

async function showStats() {
  const stats = await logger.getFullStats();

  console.log("=== 日誌統計 ===");
  console.log("本地 IndexedDB:");
  console.log("  - 數量:", stats.local.count);
  console.log("  - 大小:", stats.local.size.formatted);

  if (stats.remote) {
    console.log("遠程 MongoDB:");
    console.log("  - 總數:", stats.remote.total);
    console.log("  - 錯誤數:", stats.remote.errors);
    console.log("  - 24小時內:", stats.remote.last24h);
    console.log("  - 待上傳:", stats.remote.queueSize);
  }
}

// ==========================================
// 🗑️ 清理舊日誌
// ==========================================

async function cleanupOldLogs() {
  // 清理本地 30 天前的日誌
  const localCleaned = await logger.cleanupOldLogs(30);
  console.log(`本地清理了 ${localCleaned} 筆日誌`);

  // 清理遠程 30 天前的日誌
  const remoteResult = await logger.cleanupRemoteLogs(30);
  if (remoteResult.success) {
    console.log(remoteResult.message);
  }
}

// ==========================================
// 🔄 手動同步
// ==========================================

async function manualSync() {
  console.log("開始手動同步...");
  const result = await logger.syncToRemote();

  if (result.success) {
    console.log(result.message);
  } else {
    console.error("同步失敗:", result.message);
  }
}

// ==========================================
// 🎯 實際整合範例 (Directus API)
// ==========================================

class DirectusAPIClient {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const startTime = Date.now();
    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      // 記錄日誌
      await logger.addLog({
        endpoint,
        method: options.method || "GET",
        status: response.status,
        success: response.ok,
        responseTime,
        requestBody: options.body,
        responseData: data,
        context: {
          service: "directus",
          url,
        },
      });

      if (!response.ok) {
        throw new Error(data.errors?.[0]?.message || "API Error");
      }

      return data;
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // 記錄錯誤
      await logger.addLog({
        endpoint,
        method: options.method || "GET",
        status: 0,
        success: false,
        responseTime,
        requestBody: options.body,
        errorText: error.message,
        context: {
          service: "directus",
          url,
          error: error.stack,
        },
      });

      throw error;
    }
  }

  async getItems(collection, params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/items/${collection}${query ? "?" + query : ""}`);
  }

  async createItem(collection, data) {
    return this.request(`/items/${collection}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}

// 使用範例
const api = new DirectusAPIClient("https://your-directus.com", "your-token");

async function testDirectusAPI() {
  try {
    // 取得資料
    const items = await api.getItems("articles", {
      limit: 10,
      fields: "id,title,status",
    });
    console.log("取得文章:", items);

    // 新增資料
    const newItem = await api.createItem("articles", {
      title: "Test Article",
      content: "This is a test",
    });
    console.log("新增文章:", newItem);
  } catch (error) {
    console.error("API 錯誤:", error);
  }
}

// ==========================================
// 🎨 React 整合範例
// ==========================================

// React Hook 範例
import { useEffect, useCallback } from "react";

export function useLogger() {
  // 顯示統計資料
  const showStats = useCallback(async () => {
    const stats = await logger.getFullStats();
    console.log("日誌統計:", stats);
    return stats;
  }, []);

  // 手動同步
  const syncLogs = useCallback(async () => {
    return await logger.syncToRemote();
  }, []);

  // 查詢日誌
  const queryLogs = useCallback(async (filter, options) => {
    return await logger.queryRemoteLogs(filter, options);
  }, []);

  // 清理日誌
  const cleanup = useCallback(async (days = 30) => {
    await logger.cleanupOldLogs(days);
    await logger.cleanupRemoteLogs(days);
  }, []);

  // 關閉時清理
  useEffect(() => {
    return () => {
      logger.close();
    };
  }, []);

  return {
    showStats,
    syncLogs,
    queryLogs,
    cleanup,
  };
}

// React Component 範例
function LogViewerComponent() {
  const { showStats, syncLogs, queryLogs } = useLogger();
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const data = await showStats();
    setStats(data);
  }

  async function handleSync() {
    const result = await syncLogs();
    alert(result.message);
    loadStats();
  }

  async function loadLogs() {
    const result = await queryLogs({ success: false }, { limit: 20 });
    if (result.success) {
      setLogs(result.data);
    }
  }

  return (
    <div>
      <h2>日誌管理</h2>

      {stats && (
        <div>
          <h3>統計資料</h3>
          <p>
            本地: {stats.local.count} 筆 ({stats.local.size.formatted})
          </p>
          {stats.remote && (
            <p>
              遠程: {stats.remote.total} 筆 (錯誤: {stats.remote.errors})
            </p>
          )}
        </div>
      )}

      <button onClick={handleSync}>手動同步</button>
      <button onClick={loadLogs}>載入錯誤日誌</button>

      <div>
        {logs.map((log) => (
          <div key={log._id}>
            <strong>{log.endpoint}</strong> - {log.status}
            <br />
            <small>{new Date(log.timestamp).toLocaleString()}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 💡 最佳實踐建議
// ==========================================

/*
1. 只上傳重要日誌
   - 預設只上傳失敗 (success: false) 或錯誤狀態 (status >= 400) 的日誌
   - 成功的日誌只保留在本地 IndexedDB

2. 批次上傳
   - 累積 50 筆再一次上傳，減少 API 呼叫次數
   - 自動每 5 分鐘同步一次

3. 定期清理
   - 本地保留 30 天
   - 遠程保留 30-90 天 (根據需求調整)

4. 錯誤處理
   - MongoDB 連線失敗時，日誌仍會保存在本地
   - 下次連線成功時會自動同步

5. 監控用量
   - MongoDB M0 免費版限制: 512 MB
   - 定期檢查並清理舊日誌

6. 安全性
   - 不要在前端程式碼中直接寫入連線字串
   - 建議透過後端 API 代理連線
   - 或使用環境變數並在構建時注入
*/

// ==========================================
// 🔒 安全性建議：透過後端代理
// ==========================================

// 前端不直接連 MongoDB，改用後端 API
class SecureLogger extends EnhancedLogger {
  constructor(dbName, version, backendURL) {
    super(dbName, version); // 不傳 mongoConfig
    this.backendURL = backendURL;
  }

  async syncToRemote() {
    const logs = await this.getLogs({ limit: 50 });

    try {
      const response = await fetch(`${this.backendURL}/api/logs/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logs }),
      });

      if (response.ok) {
        return { success: true, message: "同步成功" };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

// 後端 API (Node.js Express 範例)
/*
import express from 'express';
import { MongoClient } from 'mongodb';

const app = express();
app.use(express.json());

const mongoClient = new MongoClient(process.env.MONGODB_URI);

app.post('/api/logs/sync', async (req, res) => {
  try {
    const { logs } = req.body;
    
    await mongoClient.connect();
    const collection = mongoClient.db('app_logs').collection('response_logs');
    
    const result = await collection.insertMany(logs);
    
    res.json({ 
      success: true, 
      count: result.insertedCount 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

app.listen(3000);
*/

// 輔助函數
function getCurrentUserId() {
  // 從你的應用取得當前使用者 ID
  return "user-123";
}

export {
  logger,
  queryLocalLogs,
  queryRemoteLogs,
  showStats,
  cleanupOldLogs,
  manualSync,
  DirectusAPIClient,
  useLogger,
  LogViewerComponent,
  SecureLogger,
};
