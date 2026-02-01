# MongoDB 日誌服務器

本地 Node.js 日誌服務器，透過 `mongoDBLogger.js` 啟動，接收來自前端的日誌並存入雲端 MongoDB Atlas。

## ✨ 主要特色

- 🔄 **內建自動清理** - 每 7 天自動清理 90 天前的舊日誌
- 🔒 **防重入保護** - 避免清理任務重複執行
- 📊 **詳細統計** - 執行時間、刪除數量、空間節省等
- 🛑 **優雅關閉** - 正確處理程序終止信號
- ⚙️ **環境變數配置** - 可自訂清理頻率和保留時間
- 🧠 **智能檢查** - 少於 5 萬筆時跳過清理，節省資源

## 快速開始

### 1. 安裝依賴

```bash
cd log-server
npm install
```

### 2. 配置環境變數

```bash
cp .env.example .env
# 編輯 .env 文件，設定你的 MongoDB 連接字串
```

### 3. 啟動服務器

```bash
node mongoDBLogger.js
# 或使用 npm script
npm start
```

服務器將在 `http://localhost:3002` 啟動

## API 端點

### 日誌相關

- `POST /mongo/logentry/` - 接收單筆日誌
- `POST /mongo/logentry/batch` - 批次接收日誌
- `GET /mongo/logentry/` - 查詢日誌
- `GET /mongo/stats` - 統計資料
- `DELETE /mongo/cleanup/:days` - 清理舊日誌

### 系統相關

- `GET /health` - 健康檢查

## 🔄 自動清理功能

### 內建清理機制

服務器啟動時會自動啟用清理任務：

```
✅ 已啟用自動清理任務
   清理頻率: 每 7 天
   保留時間: 90 天
   下次清理: 2026-02-08 17:57:13
```

### 清理配置

可透過環境變數自訂：

```bash
# .env 文件
CLEANUP_INTERVAL_DAYS=7    # 清理頻率（天）
CLEANUP_RETAIN_DAYS=90     # 保留時間（天）
ENABLE_AUTO_CLEANUP=true   # 啟用自動清理
```

### 清理執行日誌

```
⏰ [2026-02-01T09:57:13.574Z] 開始自動清理...
   保留時間: 最近 90 天
📊 日誌數量較少 (8,766 筆)，跳過清理

# 或當日誌數量 ≥ 5 萬筆時
⏰ [2026-02-01T09:57:13.574Z] 開始自動清理...
   保留時間: 最近 90 天
✅ 清理完成！
   刪除: 1,234 筆
   剩餘: 8,766 筆
   節省: 約 3.61 MB
   耗時: 245ms
   下次: 2026-02-08 09:57:13
```

### 手動清理

```bash
# 清理 90 天前的日誌
curl -X DELETE http://localhost:3002/mongo/cleanup/90
```

## Client 端整合

前端透過 `baseService.js` 和 `baseRustService.js` 的 `sendToRemoteLog` 方法自動發送日誌：

### 環境變數配置

在 `client/.env` 中設定：

```bash
VITE_REMOTE_LOG_URL=http://localhost:3002
```

### 自動日誌發送

前端服務會自動將 API 請求日誌發送到日誌服務器：

```javascript
// baseService.js 和 baseRustService.js 中的實現
async sendToRemoteLog(logEntry) {
  const blob = new Blob([JSON.stringify(logEntry)], {
    type: "application/json",
  });
  
  const BASE_URL = import.meta.env.VITE_REMOTE_LOG_URL;
  const success = navigator.sendBeacon(`${BASE_URL}/mongo/logentry/`, blob);
  
  if (!success) {
    // fallback 使用 fetch
    await fetch(`${BASE_URL}/mongo/logentry/`, {
      method: "POST",
      body: JSON.stringify(logEntry),
      headers: { "Content-Type": "application/json" },
    });
  }
}
```

## 使用範例

### 發送單筆日誌

```javascript
const response = await fetch("http://localhost:3002/mongo/logentry/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    endpoint: "/api/items",
    method: "GET",
    status: 200,
    success: true,
    responseTime: 150,
    timestamp: new Date().toISOString(),
  }),
});
```

### 批次發送日誌

```javascript
const response = await fetch("http://localhost:3002/mongo/logentry/batch", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    logs: [
      { endpoint: "/api/items", method: "GET", status: 200, success: true },
      { endpoint: "/api/users", method: "POST", status: 404, success: false },
    ],
  }),
});
```

### 查詢日誌

```javascript
// 查詢失敗的日誌
const response = await fetch(
  "http://localhost:3002/mongo/logentry/?success=false&limit=50",
);

// 查詢特定端點的日誌
const response = await fetch(
  "http://localhost:3002/mongo/logentry/?endpoint=/api/items",
);

// 查詢日期範圍內的日誌
const response = await fetch(
  "http://localhost:3002/mongo/logentry/?dateFrom=2026-01-01&dateTo=2026-01-31",
);
```

## 特性

- ✅ 支援單筆和批次日誌接收
- ✅ 自動建立 MongoDB 索引提升查詢效能
- ✅ 大型資料自動截斷節省空間
- ✅ 完整的錯誤處理和日誌記錄
- ✅ 健康檢查和統計資料
- ✅ 優雅關閉處理
- ✅ CORS 支援跨域請求

## 注意事項

1. 確保 MongoDB Atlas 網路存取設定允許你的 IP
2. 檢查 MongoDB 連接字串格式正確
3. M0 免費版有 512MB 空間限制，建議定期清理舊日誌
4. 生產環境建議設定適當的安全性措施
