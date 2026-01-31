# MongoDB 日誌服務器

這個服務器提供 REST API 接口，接收來自 client 端的日誌並存入 MongoDB。

## 快速開始

### 1. 安裝依賴

```bash
cd mongodb-logger
npm install
```

### 2. 配置環境變數

```bash
cp .env.example .env
# 編輯 .env 文件，設定你的 MongoDB 連接字串
```

### 3. 啟動服務器

```bash
npm start
# 或開發模式 (自動重啟)
npm run dev
```

服務器將在 `http://localhost:8080` 啟動

## API 端點

### 日誌相關

- `POST /mongo/logentry/` - 接收單筆日誌
- `POST /mongo/logentry/batch` - 批次接收日誌
- `GET /mongo/logentry/` - 查詢日誌
- `GET /mongo/stats` - 統計資料
- `DELETE /mongo/cleanup/:days` - 清理舊日誌

### 系統相關

- `GET /health` - 健康檢查

## Client 端配置

在 `client/.env` 中設定：

```bash
VITE_REMOTE_LOG_URL=http://localhost:8080/mongo/logentry/
```

## 使用範例

### 發送單筆日誌

```javascript
const response = await fetch('http://localhost:8080/mongo/logentry/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    endpoint: '/api/items',
    method: 'GET',
    status: 200,
    success: true,
    responseTime: 150,
    timestamp: new Date().toISOString()
  })
});
```

### 批次發送日誌

```javascript
const response = await fetch('http://localhost:8080/mongo/logentry/batch', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    logs: [
      { endpoint: '/api/items', method: 'GET', status: 200, success: true },
      { endpoint: '/api/users', method: 'POST', status: 404, success: false }
    ]
  })
});
```

### 查詢日誌

```javascript
// 查詢失敗的日誌
const response = await fetch('http://localhost:8080/mongo/logentry/?success=false&limit=50');

// 查詢特定端點的日誌
const response = await fetch('http://localhost:8080/mongo/logentry/?endpoint=/api/items');

// 查詢日期範圍內的日誌
const response = await fetch('http://localhost:8080/mongo/logentry/?dateFrom=2026-01-01&dateTo=2026-01-31');
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
