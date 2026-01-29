# 資料庫管理指南

## 概述

本專案使用多資料庫架構，支援不同客戶的獨立資料庫管理。透過 `scripts/start-with-json-db.js` 腳本可以輕鬆切換和管理不同的資料庫。

## 資料庫配置

### 配置檔案位置
- `db/databases.json` - 資料庫配置檔案
- `db/current.db` - 當前使用的資料庫（符號連結）

### 配置結構
```json
{
    "active_database": "db/data.db",
    "databases": {
        "zk": {
            "path": "db/zk.db",
            "name": "鎮國寺",
            "description": "鎮國寺客戶資料庫"
        },
        "ziyun": {
            "path": "db/ziyun.db",
            "name": "紫雲寺",
            "description": "紫雲寺客戶資料庫"
        },
        "shaolin": {
            "path": "db/shaolin.db",
            "name": "少林寺",
            "description": "少林寺客戶資料庫"
        }
    }
}
```

## 使用方式

### 啟動資料庫選擇器
```bash
node scripts/start-with-json-db.js
```

### 互動式選單
腳本會顯示可用的資料庫選項：
```
🏯 請選擇要啟動的客戶資料庫:
1. 鎮國寺 (zk.db)
2. 紫雲寺 (ziyun.db)
3. 少林寺 (shaolin.db)
4. 使用當前設定（data.db）不更改資料庫
```

### 功能說明

1. **資料庫切換**
   - 選擇 1-3：切換到指定的客戶資料庫
   - 選擇 4：使用當前預設資料庫

2. **自動資料庫建立**
   - 如果選擇的資料庫不存在，會自動從 `active_database` 複製建立

3. **符號連結管理**
   - 自動建立 `db/current.db` 符號連結指向選擇的資料庫

4. **開發服務啟動**
   - 完成資料庫設定後自動執行 `npm run dev`

## 資料庫管理

### 新增資料庫
1. 在 `db/databases.json` 中新增配置：
```json
"new_client": {
    "path": "db/new_client.db",
    "name": "新客戶名稱",
    "description": "新客戶資料庫描述"
}
```

2. 重新執行腳本即可看到新選項

### 資料庫備份
- 各客戶資料庫檔案獨立存放在 `db/` 目錄
- 可直接複製 `.db` 檔案進行備份

### 資料庫重置
- 刪除對應的 `.db` 檔案
- 重新執行腳本會自動從預設資料庫複製

## 注意事項

1. **資料隔離**：每個客戶的資料完全獨立，避免資料混淆
2. **開發便利**：可快速切換不同客戶環境進行測試
3. **資料安全**：誤操作只影響當前選擇的資料庫
4. **符號連結**：應用程式統一使用 `db/current.db`，無需修改程式碼

## 故障排除

### 符號連結問題
```bash
# 手動重建符號連結
ln -sf target_database.db db/current.db
```

### 資料庫損壞
```bash
# 從備份或預設資料庫恢復
cp db/data.db db/damaged_client.db
```

### 權限問題
```bash
# 確保資料庫檔案有適當權限
chmod 644 db/*.db
```
