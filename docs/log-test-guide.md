# MongoDB 日誌系統測試指南

## 🎯 測試目的

驗證本地 Node.js 服務器可以成功將日誌資料寫入雲端 MongoDB Atlas。

## 📋 前置條件

1. ✅ Node.js 服務器已啟動 (`npm start`)
2. ✅ MongoDB Atlas 已連接（看到 "✅ 遠程 MongoDB 連接成功！"）
3. ✅ 服務器運行在 http://localhost:3002

## 🧪 測試腳本說明

### 1️⃣ test-single-log.js - 單筆日誌寫入測試

**用途**: 測試寫入單筆日誌到 MongoDB

**執行方式**:

```bash
cd log-server
node test-single-log.js
```

**預期結果**:

```
✅ 成功寫入日誌！
📊 回應結果:
{
  "success": true,
  "id": "...",
  "message": "日誌已儲存"
}
🎉 日誌 ID: 67c9d1234567890abcdef123
```

---

### 2️⃣ test-batch-logs.js - 批次日誌寫入測試

**用途**: 測試批次寫入多筆日誌（預設 10 筆）

**執行方式**:

```bash
cd log-server
# 寫入 10 筆測試資料
node test-batch-logs.js

# 寫入指定數量（例如 50 筆）
node test-batch-logs.js 50

# 寫入 100 筆
node test-batch-logs.js 100
```

**預期結果**:

```
✅ 批次寫入成功！
📊 回應結果:
{
  "success": true,
  "count": 10,
  "message": "成功儲存 10 筆日誌"
}
⏱️  耗時: 250ms
📈 平均每筆: 25.00ms
```

---

### 3️⃣ test-query-stats.js - 查詢和統計測試

**用途**: 測試查詢日誌和統計資料功能

**執行方式**:

```bash
cd log-server
node test-query-stats.js
```

**測試項目**:

- ✅ 健康檢查
- ✅ 統計資料查詢
- ✅ 查詢最新日誌
- ✅ 查詢錯誤日誌
- ✅ 特定端點查詢
- ✅ 日期範圍查詢

**預期結果**:

```
✅ 健康檢查回應:
{
  "status": "ok",
  "mongodb": "connected",
  ...
}

📊 統計資料:
{
  "total": 125,
  "errors": 25,
  "last24h": 50,
  "errorRate": "20.00%"
}
```

---

### 4️⃣ test-complete.js - 完整測試套件 ⭐ 推薦

**用途**: 執行完整的測試流程，包含所有功能

**執行方式**:

```bash
cd log-server
node test-complete.js
```

**測試流程**:

1. 健康檢查
2. 寫入單筆日誌
3. 批次寫入 20 筆日誌
4. 查詢統計資料
5. 查詢最新日誌
6. 查詢錯誤日誌
7. 測試特定條件查詢

**預期結果**:

```
╔══════════════════════════════════════════════════════════╗
║          🧪 MongoDB 日誌系統完整測試                     ║
╚══════════════════════════════════════════════════════════╝

=== 測試總結 ===
✅ 所有測試步驟完成！

📊 測試結果:
   ✓ 健康檢查: 通過
   ✓ 單筆寫入: 成功 (ID: ...)
   ✓ 批次寫入: 成功 20 筆

📈 資料庫統計:
   - 總日誌數: 145
   - 錯誤數: 29
   - 24小時內: 70
   - 錯誤率: 20.00%

🎉 測試完成！所有功能正常運作。
```

---

## 🚀 快速測試流程

### 方案 1: 快速驗證（推薦新手）

```bash
# 1. 啟動服務器（在一個終端機）
cd log-server
node mongoDBLogger.js

# 2. 執行完整測試（在另一個終端機）
cd log-server
node test-complete.js
```

### 方案 2: 逐步測試（推薦開發除錯）

```bash
cd log-server
# 1. 測試單筆寫入
node test-single-log.js

# 2. 測試批次寫入
node test-batch-logs.js 20

# 3. 測試查詢功能
node test-query-stats.js
```

### 方案 3: 壓力測試

```bash
cd log-server
# 寫入大量測試資料
node test-batch-logs.js 100   # 100 筆
node test-batch-logs.js 500   # 500 筆
node test-batch-logs.js 1000  # 1000 筆

# 查看統計
node test-query-stats.js
```

---

## 📊 驗證結果

### ✅ 成功指標

1. **所有測試腳本執行成功** (exit code 0)
2. **可以在 MongoDB Atlas 看到資料**
   - 登入 https://cloud.mongodb.com
   - 進入你的 Project
   - Database → Browse Collections
   - 選擇資料庫 `logEntryDB`
   - 選擇集合 `zk_client_logs`
   - 應該可以看到測試寫入的日誌

3. **統計資料正確**
   - total > 0
   - errors 和 last24h 有合理數值

### ❌ 常見問題排除

**問題 1: 連接失敗**

```
❌ 請求失敗: fetch failed
```

**解決方案**:

- 確認服務器是否運行 (`cd log-server && node mongoDBLogger.js`)
- 檢查端口是否正確 (3002)

**問題 2: MongoDB 未連接**

```
❌ MongoDB 未連接
```

**解決方案**:

- 檢查 `.env` 檔案中的 `MONGODB_URI` 是否正確
- 確認 MongoDB Atlas 的 IP 白名單設定
- 確認使用者帳號密碼正確

**問題 3: 寫入失敗但服務器正常**

```
❌ 儲存日誌失敗: ...
```

**解決方案**:

- 查看服務器終端機的錯誤訊息
- 檢查 MongoDB Atlas 是否有空間配額問題
- 確認資料格式是否正確

---

## 📱 在 MongoDB Atlas 查看資料

### 步驟 1: 登入 MongoDB Atlas

前往 https://cloud.mongodb.com

### 步驟 2: 進入 Database

1. 選擇你的 Project (ID: 632c16c128686c379ccac3c4)
2. 點擊左側 "Database"
3. 點擊你的 Cluster 的 "Browse Collections"

### 步驟 3: 查看資料

1. 資料庫: `logEntryDB`
2. 集合: `zk_client_logs`
3. 你應該會看到所有測試寫入的日誌

### 步驟 4: 查詢資料

在 MongoDB Atlas 界面，你可以使用 Filter 功能：

**查詢所有測試日誌**:

```json
{ "context.test": true }
```

**查詢錯誤日誌**:

```json
{ "success": false }
```

**查詢特定端點**:

```json
{ "endpoint": { "$regex": "/api/test" } }
```

---

## 🧹 清理測試資料

如果你想清理測試產生的資料：

### 方法 1: 透過 API（保留真實日誌）

```bash
# 刪除所有測試日誌（包含 context.test: true 的）
curl -X DELETE "http://localhost:3002/mongo/cleanup/0"
```

### 方法 2: 在 MongoDB Atlas 手動刪除

1. 進入 Browse Collections
2. 選擇 `zk_client_logs`
3. 使用 Filter: `{ "context.test": true }`
4. 全選並刪除

---

## 📈 效能基準

在一般情況下，你應該會看到：

- **單筆寫入**: < 100ms
- **批次寫入 (50筆)**: < 500ms (平均 < 10ms/筆)
- **查詢**: < 200ms
- **統計**: < 300ms

如果超過這些數值，可能需要檢查：

- 網路連線速度
- MongoDB Atlas 區域（建議選擇離你較近的區域）
- 資料庫索引是否正確建立

---

## 🎓 進階測試

### 測試並發寫入

```bash
# 同時執行多個測試（Mac/Linux）
node test-batch-logs.js 50 &
node test-batch-logs.js 50 &
node test-batch-logs.js 50 &
wait

# 查看結果
node test-query-stats.js
```

### 測試大量資料寫入

```bash
# 寫入 1000 筆
node test-batch-logs.js 1000

# 寫入 5000 筆（注意 MongoDB M0 免費版 512MB 限制）
node test-batch-logs.js 5000
```

---

## ✅ 驗證清單

完成測試後，請確認：

- [ ] `node test-single-log.js` 執行成功
- [ ] `node test-batch-logs.js` 執行成功
- [ ] `node test-query-stats.js` 執行成功
- [ ] `node test-complete.js` 執行成功
- [ ] 在 MongoDB Atlas 可以看到測試資料
- [ ] 統計資料顯示正確
- [ ] 可以查詢和過濾日誌

---

## 🆘 需要協助？

如果測試失敗，請提供：

1. 錯誤訊息截圖
2. 服務器終端機的輸出
3. 執行的測試指令

---

**祝測試順利！🎉**
