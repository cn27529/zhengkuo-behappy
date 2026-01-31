# IndexedDB + MongoDB 雙層日誌系統

> 本地儲存 + 雲端備份的完整日誌解決方案

## 📦 專案說明

這是一個結合 **IndexedDB (本地)** 和 **MongoDB Atlas (雲端)** 的雙層日誌系統，專為前端應用設計。

### ✨ 特色

- ✅ **雙層儲存**: 本地 IndexedDB + 遠程 MongoDB
- ✅ **智能同步**: 自動批次上傳，失敗自動重試
- ✅ **零成本**: 使用 MongoDB Atlas 免費方案 (M0)
- ✅ **高效能**: 非阻塞式上傳，不影響使用者體驗
- ✅ **容錯機制**: MongoDB 離線時仍可正常記錄
- ✅ **查詢功能**: 支援本地和遠程日誌查詢
- ✅ **自動清理**: 定期清理過期日誌

## 📋 目錄

1. [快速開始](#快速開始)
2. [MongoDB Atlas 設定](#mongodb-atlas-設定)
3. [使用範例](#使用範例)
4. [API 文件](#api-文件)
5. [最佳實踐](#最佳實踐)
6. [常見問題](#常見問題)

---

## 🚀 快速開始

### 1. 安裝依賴

```bash
npm install mongodb
```

### 2. 引入模組

```javascript
import { EnhancedLogger } from "./indexedDB-enhanced.js";
```

### 3. 初始化日誌管理器

```javascript
const logger = new EnhancedLogger(
  "DirectusLogsDB", // IndexedDB 資料庫名稱
  1, // 版本號
  {
    // MongoDB Atlas 連線設定
    uri: "mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/",
    dbName: "app_logs",
    collectionName: "response_logs",
    batchSize: 50, // 批次大小
    syncInterval: 300000, // 5分鐘同步一次
    autoSync: true, // 啟用自動同步
  },
);
```

### 4. 記錄日誌

```javascript
await logger.addLog({
  endpoint: "/api/items",
  method: "GET",
  status: 200,
  success: true,
  responseTime: 150,
  context: {
    service: "directus",
    operation: "fetch",
  },
});
```

---

## 🔧 MongoDB Atlas 設定

### 步驟 1: 登入 MongoDB Atlas

前往 https://cloud.mongodb.com 並登入你的帳號

你的 Project ID: `632c16c128686c379ccac3c4`

### 步驟 2: 建立免費 Cluster (如果還沒有)

1. 點擊左側選單 **"Database"**
2. 點擊 **"Build a Database"** 按鈕
3. 選擇 **"M0 FREE"** 方案
4. 選擇離你最近的區域 (建議: **Singapore - ap-southeast-1**)
5. Cluster Name 可以保持預設或自訂
6. 點擊 **"Create"** 按鈕

### 步驟 3: 建立資料庫使用者

1. 點擊左側選單 **"Database Access"**
2. 點擊 **"Add New Database User"**
3. 選擇 **"Password"** 驗證方式
4. 輸入使用者名稱和密碼 (務必記住!)
5. **Database User Privileges** 選擇 **"Read and write to any database"**
6. 點擊 **"Add User"**

### 步驟 4: 設定網路存取

1. 點擊左側選單 **"Network Access"**
2. 點擊 **"Add IP Address"**
3. 選擇 **"Allow Access from Anywhere"** (會自動填入 `0.0.0.0/0`)
   - 或者只加入你的當前 IP (更安全)
4. 點擊 **"Confirm"**

### 步驟 5: 取得連線字串

1. 回到 **"Database"** 選單
2. 找到你的 Cluster，點擊 **"Connect"** 按鈕
3. 選擇 **"Connect your application"**
4. Driver 選擇 **"Node.js"**
5. 複製連線字串，格式如下:

```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

6. 將 `<username>` 和 `<password>` 替換成你剛才建立的使用者帳密

### 範例連線字串

```javascript
// ❌ 錯誤 - 沒替換帳密
uri: "mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/";

// ✅ 正確
uri: "mongodb+srv://myuser:mypassword123@cluster0.abc12.mongodb.net/";
```

---

## 💡 使用範例

### 基本使用

```javascript
import { EnhancedLogger } from "./indexedDB-enhanced.js";

// 初始化
const logger = new EnhancedLogger("MyAppLogs", 1, {
  uri: "mongodb+srv://...",
  dbName: "app_logs",
});

// 記錄 API 請求
async function fetchData() {
  const startTime = Date.now();

  try {
    const response = await fetch("https://api.example.com/data");
    const data = await response.json();

    await logger.addLog({
      endpoint: "/data",
      method: "GET",
      status: response.status,
      success: response.ok,
      responseTime: Date.now() - startTime,
      responseData: data,
    });
  } catch (error) {
    await logger.addLog({
      endpoint: "/data",
      method: "GET",
      status: 0,
      success: false,
      errorText: error.message,
    });
  }
}
```

### 查詢日誌

```javascript
// 查詢本地日誌 (IndexedDB)
const localLogs = await logger.queryLogs({
  endpoint: "/api/items",
  status: 404,
  dateFrom: "2025-01-01",
});

// 查詢遠程日誌 (MongoDB)
const remoteResult = await logger.queryRemoteLogs(
  {
    success: false, // 只查詢失敗的請求
  },
  {
    limit: 20,
    skip: 0,
  },
);

console.log("遠程錯誤日誌:", remoteResult.data);
```

### 取得統計資料

```javascript
const stats = await logger.getFullStats();

console.log("本地:", stats.local);
// { count: 150, size: { bytes: 245760, formatted: "240 KB" } }

console.log("遠程:", stats.remote);
// { total: 45, errors: 12, last24h: 8, queueSize: 3 }
```

### 手動同步

```javascript
const result = await logger.syncToRemote();

if (result.success) {
  console.log(result.message);
  // "✅ 成功上傳 15 筆日誌到 MongoDB"
}
```

### 清理舊日誌

```javascript
// 清理 30 天前的日誌
await logger.cleanupOldLogs(30); // 本地
await logger.cleanupRemoteLogs(30); // 遠程
```

---

## 📚 API 文件

### EnhancedLogger

#### 建構子

```javascript
new EnhancedLogger(dbName, version, mongoConfig);
```

**參數:**

- `dbName` (string): IndexedDB 資料庫名稱
- `version` (number): IndexedDB 版本號
- `mongoConfig` (object): MongoDB 連線設定
  - `uri` (string): MongoDB Atlas 連線字串
  - `dbName` (string): 資料庫名稱
  - `collectionName` (string): 集合名稱
  - `batchSize` (number): 批次上傳筆數 (預設: 50)
  - `syncInterval` (number): 自動同步間隔 ms (預設: 300000)
  - `autoSync` (boolean): 是否啟用自動同步 (預設: true)

#### 方法

##### addLog(logEntry)

記錄日誌 (同時儲存到本地和加入遠程上傳佇列)

```javascript
await logger.addLog({
  endpoint: '/api/items',
  method: 'POST',
  status: 201,
  success: true,
  responseTime: 250,
  context: { ... }
});
```

##### syncToRemote()

手動同步日誌到 MongoDB

```javascript
const result = await logger.syncToRemote();
// { success: true, count: 15, message: "..." }
```

##### queryLogs(filter)

查詢本地 IndexedDB 日誌

```javascript
const logs = await logger.queryLogs({
  endpoint: "/api/items",
  method: "GET",
  status: 200,
  dateFrom: "2025-01-01",
  dateTo: "2025-01-31",
});
```

##### queryRemoteLogs(filter, options)

查詢遠程 MongoDB 日誌

```javascript
const result = await logger.queryRemoteLogs(
  {
    success: false,
    status: 500,
  },
  {
    limit: 50,
    skip: 0,
  },
);
```

##### getFullStats()

取得完整統計資料 (本地 + 遠程)

```javascript
const stats = await logger.getFullStats();
```

##### cleanupOldLogs(daysToKeep)

清理本地舊日誌

```javascript
const count = await logger.cleanupOldLogs(30);
```

##### cleanupRemoteLogs(daysToKeep)

清理遠程舊日誌

```javascript
const result = await logger.cleanupRemoteLogs(30);
```

##### close()

關閉所有連線

```javascript
await logger.close();
```

---

## 🎯 最佳實踐

### 1. 只上傳重要日誌

```javascript
// ✅ 好的做法 - 只上傳錯誤
// 預設行為已經實作: 只上傳 success: false 或 status >= 400

// ❌ 不好的做法 - 上傳所有日誌
// 會很快用完 512MB 空間
```

### 2. 適當的批次大小

```javascript
// ✅ 適中的批次大小 (50-100)
batchSize: 50;

// ❌ 太小 - 頻繁上傳，浪費流量
batchSize: 5;

// ❌ 太大 - 可能超過單次請求大小限制
batchSize: 1000;
```

### 3. 定期清理

```javascript
// 每天自動清理舊日誌
setInterval(
  async () => {
    await logger.cleanupOldLogs(30);
    await logger.cleanupRemoteLogs(90);
  },
  24 * 60 * 60 * 1000,
);
```

### 4. 錯誤處理

```javascript
try {
  await logger.addLog(logEntry);
} catch (error) {
  // 記錄失敗不應影響主要業務
  console.warn("日誌記錄失敗:", error);
}
```

### 5. 安全性考量

```javascript
// ❌ 不要在前端暴露連線字串
const logger = new EnhancedLogger("DB", 1, {
  uri: "mongodb+srv://username:password@...", // 危險!
});

// ✅ 透過環境變數
const logger = new EnhancedLogger("DB", 1, {
  uri: import.meta.env.VITE_MONGODB_URI,
});

// ✅ 更好的做法: 透過後端 API 代理
// 見 usage-example.js 中的 SecureLogger 範例
```

---

## 🐛 常見問題

### Q1: MongoDB 連線失敗怎麼辦?

**A:** 日誌仍會保存在本地 IndexedDB，不影響應用運作。下次連線成功時會自動同步。

檢查清單:

- [ ] 連線字串是否正確?
- [ ] 帳號密碼是否正確?
- [ ] IP 白名單是否已設定?
- [ ] Cluster 是否已啟動?

### Q2: 如何查看 MongoDB 中的資料?

**A:** 在 MongoDB Atlas 中:

1. 進入 "Database"
2. 點擊 Cluster 的 "Browse Collections"
3. 選擇你的資料庫和集合
4. 即可查看資料

### Q3: 免費方案的限制?

**A:** MongoDB Atlas M0 免費方案:

- 儲存空間: 512 MB
- 連線數: 最多 500
- 操作速率: 每秒 100 次
- 資料傳輸: 每 7 天 10GB 進 + 10GB 出
- 閒置 30 天會自動暫停 (可隨時恢復)

### Q4: 如何避免超過 512MB 限制?

**A:** 建議策略:

1. 只上傳錯誤日誌 (預設已實作)
2. 定期清理舊日誌 (保留 30-90 天)
3. 限制單筆日誌大小 (清理過大的 responseData)
4. 監控用量，快滿時手動清理

```javascript
// 每週檢查並清理
setInterval(
  async () => {
    const stats = await logger.getRemoteStats();
    if (stats.remote.total > 10000) {
      await logger.cleanupRemoteLogs(30);
    }
  },
  7 * 24 * 60 * 60 * 1000,
);
```

### Q5: 可以在多個專案中使用同一個 Cluster 嗎?

**A:** 可以! 建議做法:

1. 使用不同的資料庫名稱
2. 或使用不同的集合名稱

```javascript
// 專案 A
const loggerA = new EnhancedLogger("ProjectA", 1, {
  uri: "...",
  dbName: "project_a_logs",
});

// 專案 B
const loggerB = new EnhancedLogger("ProjectB", 1, {
  uri: "...",
  dbName: "project_b_logs",
});
```

---

## 📊 資料結構

### 日誌格式

```javascript
{
  "_id": ObjectId("..."),
  "id": "uuid-string",
  "endpoint": "/api/items",
  "method": "POST",
  "status": 201,
  "success": true,
  "responseTime": 250,
  "timestamp": "2025-01-31T10:30:00.000Z",
  "uploadedAt": "2025-01-31T10:35:00.000Z",
  "userAgent": "Mozilla/5.0...",
  "url": "https://example.com/page",
  "requestBody": {...},
  "responseData": {...},
  "errorText": null,
  "context": {
    "service": "directus",
    "operation": "create"
  },
  "source": "web-client",
  "projectId": "632c16c128686c379ccac3c4"
}
```

---

## 🔄 工作流程

```
使用者操作
    ↓
發送 API 請求
    ↓
記錄日誌 (addLog)
    ↓
    ├─→ 儲存到 IndexedDB (立即) ✅
    │
    └─→ 加入上傳佇列
          ↓
          累積到 50 筆 或 5 分鐘後
          ↓
          批次上傳到 MongoDB ☁️
          ↓
          成功 → 清空佇列
          失敗 → 保留在佇列，下次重試
```

---

## 📦 檔案結構

```
project/
├── indexedDB.js              # 原有的 IndexedDBLogger
├── mongoDBLogger.js          # MongoDB 遠程日誌模組
├── indexedDB-enhanced.js     # 整合版日誌管理器
├── usage-example.js          # 使用範例
├── package.json              # 依賴配置
└── README.md                 # 本文件
```

---

## 🎓 進階功能

### React Hook 整合

```javascript
import { useLogger } from "./usage-example.js";

function MyComponent() {
  const { showStats, syncLogs, queryLogs } = useLogger();

  const handleSync = async () => {
    const result = await syncLogs();
    alert(result.message);
  };

  return <button onClick={handleSync}>同步日誌</button>;
}
```

### 自訂過濾規則

```javascript
class CustomLogger extends EnhancedLogger {
  addToQueue(logEntry) {
    // 自訂規則: 只上傳特定 endpoint 的錯誤
    if (logEntry.endpoint.includes("/api/critical") && !logEntry.success) {
      this.remoteLogger.addToQueue(logEntry);
    }
  }
}
```

---

## 📝 版本歷史

- **v1.0.0** (2025-01-31)
  - 初始版本
  - 支援 IndexedDB + MongoDB 雙層儲存
  - 自動批次上傳
  - 完整查詢和統計功能

---

## 📄 授權

MIT License

---

## 🤝 貢獻

歡迎提交 Issue 或 Pull Request!

---

## 📮 聯絡方式

如有問題，請透過 GitHub Issues 反饋。

---

**Happy Logging! 🎉**
