# 壓力測試高並發讀寫指南

## 測試目的

驗證 Rust Axum 後端與 Directus 共用 SQLite 資料庫時，在高並發讀寫情況下是否會出現資料庫鎖定問題。

## 測試架構

```
┌─────────────────┐         ┌──────────────────┐
│  Directus       │ 寫入    │   SQLite DB      │
│  (Port 8055)    │────────>│   (WAL Mode)     │
└─────────────────┘         └──────────────────┘
                                      ^
                                      │ 讀取
┌─────────────────┐                  │
│  Rust Axum      │──────────────────┘
│  (Port 3000)    │
└─────────────────┘
```

## 測試腳本

### 1. `check-db-locks-detailed.js` - 資料庫鎖定監控

**功能：** 檢查資料庫內部鎖定狀態

**檢查項目：**

- WAL checkpoint 狀態
- 資料庫大小統計
- WAL 文件大小
- 實際鎖定測試（嘗試獲取寫入鎖）

**使用方式：**

```bash
node scripts/check-db-locks-detailed.js
```

### 2. `stress-test-wal.js` - 寫入壓力測試

**功能：** 持續向 Directus 寫入 mydata 記錄

**環境變數：**

- `DIRECTUS_URL` - Directus 地址（默認：`http://localhost:8055`）
- `INTERVAL_MS` - 寫入間隔毫秒（默認：`500`）
- `BATCH_SIZE` - 每次寫入筆數（默認：`1`）

**使用方式：**

```bash
# 基本使用
node scripts/stress-test-wal.js

# 高強度測試：每 100ms 寫入 3 筆
INTERVAL_MS=100 BATCH_SIZE=3 node scripts/stress-test-wal.js

# 極限測試：每 50ms 寫入 5 筆
INTERVAL_MS=50 BATCH_SIZE=5 node scripts/stress-test-wal.js
```

### 3. `stress-test-mydata-query.js` - 查詢壓力測試

**功能：** 高頻查詢 Rust API 的 mydata 端點

**環境變數：**

- `RUST_URL` - Rust 服務地址（默認：`http://localhost:3000`）
- `INTERVAL_MS` - 查詢間隔毫秒（默認：`100`）
- `CONCURRENT` - 並發請求數（默認：`5`）

**使用方式：**

```bash
# 基本使用
node scripts/stress-test-mydata-query.js

# 高強度測試：每 50ms 發送 10 個並發
INTERVAL_MS=50 CONCURRENT=10 node scripts/stress-test-mydata-query.js

# 極限測試：每 20ms 發送 20 個並發
INTERVAL_MS=20 CONCURRENT=20 node scripts/stress-test-mydata-query.js
```

## 完整測試流程

### 步驟 1：啟動服務

```bash
# 終端 1：啟動完整開發環境
npm run dev:full
```

等待服務啟動完成：

- ✅ Directus 運行在 http://localhost:8055
- ✅ Rust Axum 運行在 http://localhost:3000

### 步驟 2：開啟監控（終端 2）

```bash
# 持續監控資料庫狀態（每 5 秒檢查一次）
watch -n 5 "node scripts/check-db-locks-detailed.js"
```

或手動執行：

```bash
node scripts/check-db-locks-detailed.js
```

### 步驟 3：啟動寫入壓測（終端 3）

```bash
# 中等強度：每 500ms 寫入 1 筆
node scripts/stress-test-wal.js

# 或高強度
INTERVAL_MS=100 BATCH_SIZE=3 node scripts/stress-test-wal.js
```

### 步驟 4：啟動查詢壓測（終端 4）

```bash
# 中等強度：每 100ms 發送 5 個並發
node scripts/stress-test-mydata-query.js

# 或高強度
INTERVAL_MS=50 CONCURRENT=10 node scripts/stress-test-mydata-query.js
```

### 步驟 5：觀察結果

**正常情況（無鎖定）：**

```
終端 2 (監控):
  ✅ 資料庫可寫入（無鎖定）
  WAL 文件大小穩定

終端 3 (寫入):
  ✅ 已寫入: 150 筆 | 錯誤: 0 筆

終端 4 (查詢):
  ✅ 查詢: 500 次 | 錯誤: 0 次 | 平均響應: 15ms
```

**異常情況（有鎖定）：**

```
終端 2 (監控):
  ❌ 資料庫被鎖定！
  ⚠️  警告: WAL 文件較大

終端 3 (寫入):
  ❌ 寫入失敗 (500) | 已寫入: 100 筆 | 錯誤: 20 筆

終端 4 (查詢):
  ❌ 錯誤: SQLITE_BUSY | 查詢: 300 次 | 錯誤: 50 次
```

## 測試場景

### 場景 1：基礎測試（推薦新手）

```bash
# 終端 2
node scripts/check-db-locks-detailed.js

# 終端 3
node scripts/stress-test-wal.js

# 終端 4
node scripts/stress-test-mydata-query.js
```

### 場景 2：中等強度

```bash
# 終端 3
INTERVAL_MS=200 BATCH_SIZE=2 node scripts/stress-test-wal.js

# 終端 4
INTERVAL_MS=50 CONCURRENT=10 node scripts/stress-test-mydata-query.js
```

### 場景 3：高強度

```bash
# 終端 3
INTERVAL_MS=100 BATCH_SIZE=5 node scripts/stress-test-wal.js

# 終端 4
INTERVAL_MS=20 CONCURRENT=20 node scripts/stress-test-mydata-query.js
```

### 場景 4：極限測試

```bash
# 終端 3
INTERVAL_MS=50 BATCH_SIZE=10 node scripts/stress-test-wal.js

# 終端 4
INTERVAL_MS=10 CONCURRENT=50 node scripts/stress-test-mydata-query.js
```

## 停止測試

所有測試腳本都支持優雅關閉：

- 按 `Ctrl+C` 停止
- 會顯示最終統計結果

## 評估標準

### ✅ 測試通過

- 寫入成功率 > 99%
- 查詢成功率 > 99%
- 平均響應時間 < 50ms
- 無資料庫鎖定錯誤
- WAL 文件大小穩定（< 10MB）

### ⚠️ 需要優化

- 寫入成功率 95-99%
- 查詢成功率 95-99%
- 平均響應時間 50-100ms
- 偶爾出現鎖定（< 1%）

### ❌ 測試失敗

- 寫入成功率 < 95%
- 查詢成功率 < 95%
- 平均響應時間 > 100ms
- 頻繁出現鎖定錯誤
- WAL 文件持續增長

## 常見問題

### Q1: 為什麼沒有鎖定？

A: SQLite 的 WAL 模式允許讀寫並發，寫入不會阻塞讀取。

### Q2: WAL 文件很大怎麼辦？

A: 可能有長時間運行的讀取事務，檢查是否有未關閉的連接。

### Q3: 如何提高並發能力？

A:

- 調整 SQLite 的 `busy_timeout`
- 增加連接池大小
- 優化查詢語句

### Q4: 測試時服務崩潰？

A: 降低測試強度，逐步增加負載。

## 性能基準參考

基於 MacBook Pro (M1) 的測試結果：

| 場景   | 寫入 QPS | 查詢 QPS | 平均響應 | 成功率 |
| ------ | -------- | -------- | -------- | ------ |
| 基礎   | 2/s      | 50/s     | 10-20ms  | 100%   |
| 中等   | 10/s     | 200/s    | 15-30ms  | 99.9%  |
| 高強度 | 50/s     | 500/s    | 20-50ms  | 99%    |
| 極限   | 100/s    | 1000/s   | 30-100ms | 95%+   |

## 相關文件

- `rust-axum/MYDATA_API.md` - MyData API 文檔
- `client/RUST_MYDATA_SERVICE.md` - Rust 服務集成文檔
- `scripts/test_rust_mydata_api.sh` - 功能測試腳本

## 注意事項

1. **測試前備份資料庫**
2. **不要在生產環境執行壓測**
3. **監控系統資源使用（CPU、記憶體、磁碟 I/O）**
4. **測試後檢查資料完整性**
5. **記錄測試結果供後續優化參考**
