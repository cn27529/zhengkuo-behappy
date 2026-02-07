# 驗證 WAL 機制是否生效

生成 stress-test-wal.js 調用 scripts/testMydata.js 頻繁寫入，然後我停止服務來驗證 WAL 機制是否生效

# 現在可以用以下方式測試 WAL checkpoint 機制：

使用方式：

bash

# 1. 啟動服務（包含 Directus 和 Rust）

npm run db # 選擇資料庫

# 或

npm run dev

# 2. 在另一個終端執行壓力測試

npm run test:wal

# 3. 觀察寫入情況（預設每 500ms 寫入 1 筆）

# 會顯示：✅ 已寫入: 123 筆 | 錯誤: 0 筆

# 4. 按 Ctrl+C 停止測試

# 5. 停止 Rust 服務（Ctrl+C）

# 6. 檢查 db/ 目錄下的 WAL 檔案

ls -lh db/_.db_

自訂參數：

bash

# 更頻繁寫入（每 100ms）

INTERVAL_MS=100 npm run test:wal

# 每次寫入多筆（每 500ms 寫入 5 筆）

BATCH_SIZE=5 npm run test:wal

# 組合使用（每 200ms 寫入 3 筆）

INTERVAL_MS=200 BATCH_SIZE=3 npm run test:wal

驗證重點：

- 測試過程中會產生 zk.db-wal 和 zk.db-shm 檔案
- 停止 Rust 服務後，如果 checkpoint 正常運作，這些檔案應該會被清理
- 如果檔案還在，表示 checkpoint 沒有生效
