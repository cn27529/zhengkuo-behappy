# 客戶資料庫管理工具指南

## 概述

本專案使用多資料庫架構，支援不同客戶的獨立資料庫管理。透過 `scripts/start-with-db.js` 腳本可以輕鬆切換和管理不同的資料庫，並自動啟動所有開發服務。

## 資料庫配置

### 配置檔案位置（優先級順序）

腳本會按以下順序尋找配置檔：

1. `db/databases.json` - 推薦位置
2. `databases.json` - 專案根目錄
3. `當前目錄/db/databases.json`
4. `當前目錄/databases.json`

### 配置結構

```json
{
  "active_database": "data.db",
  "databases": {
    "zk": {
      "path": "zk.db",
      "name": "鎮國寺",
      "description": "鎮國寺客戶資料庫"
    },
    "ziyun": {
      "path": "ziyun.db",
      "name": "紫雲寺",
      "description": "紫雲寺客戶資料庫"
    }
  }
}
```

**注意**：`active_database` 路徑會自動處理 `db/` 前綴，建議直接使用檔名如 `data.db`。

## 使用方式

### 啟動資料庫管理工具

```bash
node scripts/start-with-db.js
```

### 工具流程

1. **配置檢查**
   - 自動尋找並載入 `databases.json` 配置檔
   - 顯示配置摘要和當前資料庫狀態

2. **連結管理**
   - 詢問是否解除當前的 `db/current.db` 連結
   - 顯示當前連結狀態（符號連結或實體檔案）

3. **資料庫選擇**
   - 顯示所有可用的客戶資料庫
   - 顯示基礎資料庫選項
   - 提供「使用當前設定」選項

4. **服務啟動**
   - 自動啟動 Directus (port 8055)
   - 自動啟動 Vue Client (port 5173)
   - 自動啟動 Rust-Axum (port 3000)

### 互動式選單範例

```
🏯 請選擇要啟動的客戶資料庫:
==================================================
1. 鎮國寺 (zk.db) ✅
   描述: 鎮國寺客戶資料庫
   大小: 2.45 MB

2. 紫雲寺 (ziyun.db) ❌
   描述: 紫雲寺客戶資料庫
   狀態: 不存在，將從 data.db 複製建立

3. 基礎資料庫 (data.db) ✅
   描述: 系統預設基礎資料庫
   大小: 1.23 MB

4. 使用當前設定 (不更改)
   描述: 保持現有連結不變
```

## 功能特色

### 智慧資料庫管理

1. **自動建立資料庫**
   - 選擇不存在的資料庫時，自動從基礎資料庫複製建立
   - 顯示檔案大小和建立狀態

2. **符號連結管理**
   - 自動建立 `db/current.db` 符號連結
   - Windows 環境自動降級為檔案複製
   - 支援強制重建損壞的連結

3. **狀態監控**
   - 即時顯示資料庫檔案存在狀態
   - 顯示檔案大小資訊
   - 檢查符號連結完整性

### 多服務啟動

使用 `concurrently` 同時啟動三個服務：

- **Directus**: 後端 CMS (port 8055)
- **Vue Client**: 前端應用 (port 5173)
- **Rust-Axum**: API 服務 (port 3000)

支援 `Ctrl+C` 優雅停止所有服務。

## 資料庫管理

### 新增客戶資料庫

1. 在 `db/databases.json` 中新增配置：

```json
"new_client": {
    "path": "db/new_client.db",
    "name": "新客戶名稱",
    "description": "新客戶資料庫描述"
}
```

2. 重新執行腳本，選擇新資料庫會自動建立

### 資料庫備份與恢復

```bash
# 備份特定客戶資料庫
cp db/zk.db db/backup/zk_backup_$(date +%Y%m%d).db

# 恢復資料庫
cp db/backup/zk_backup_20240101.db db/zk.db
```

### 重置資料庫

```bash
# 刪除客戶資料庫，重新執行腳本會自動重建
rm db/zk.db
node scripts/start-with-db.js
```

## 故障排除

### 配置檔案問題

```bash
# 檢查配置檔案格式
cat db/databases.json | jq .

# 建立基本配置檔案
echo '{"active_database": "data.db", "databases": {}}' > db/databases.json
```

### 符號連結問題

```bash
# 檢查當前連結狀態
ls -la db/current.db

# 手動重建符號連結
cd db && ln -sf target.db current.db
```

### 服務啟動問題

```bash
# 檢查依賴安裝
npm install
npm install -g concurrently

# 檢查各服務目錄
ls -la server/ client/ rust-axum/
```

### 權限問題

```bash
# macOS/Linux 權限修復
chmod 644 db/*.db
chmod 755 db/

# Windows 符號連結權限
# 需要管理員權限或開發者模式
```

## 技術細節

### 路徑處理

- 自動移除配置中的 `db/` 前綴
- 支援相對路徑和絕對路徑
- 跨平台路徑相容性

### 錯誤處理

- 完整的錯誤訊息和建議
- 優雅的降級處理（Windows 符號連結）
- 詳細的狀態回報

### 顏色輸出

- 使用 ANSI 顏色碼提升使用體驗
- 狀態圖示清楚標示檔案狀態
- 結構化的資訊顯示
