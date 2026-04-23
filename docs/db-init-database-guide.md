# 客戶資料庫初始化工具指南

## 概述說明

`scripts/init-database.js` 是專門用於初始化新客戶資料庫的工具。它會讀取 `db/databases.json` 配置檔案，自動識別未初始化的資料庫，並提供多種初始化方式。

## 功能特色

### 智慧配置讀取

- 自動尋找 `databases.json` 配置檔案（優先級順序與 start-with-db.js 相同）
- 解析配置並處理路徑格式
- 自動處理 `db/` 路徑前綴

### 資料庫狀態分析

- 檢查所有配置資料庫的初始化狀態
- 顯示檔案大小和存在狀態
- 自動過濾已完成初始化的資料庫

### 多種初始化方式

- **範本複製**：從已初始化的資料庫複製（推薦）
- **Directus 初始化**：全新建立並設定管理員帳號

## 使用方式

### 啟動初始化工具

```bash
node scripts/init-database.js
```

### 工具流程

1. **配置檢查**
   - 自動尋找並載入 `databases.json` 配置檔
   - 顯示專案根目錄和配置檔路徑

2. **資料庫狀態分析**
   - 掃描所有配置的客戶資料庫
   - 檢查基礎資料庫狀態
   - 顯示詳細的狀態報告

3. **選擇待初始化資料庫**
   - 只顯示未初始化的資料庫選項
   - 提供清楚的狀態說明

4. **選擇初始化方式**
   - 列出可用的範本資料庫
   - 提供 Directus 初始化選項

## 狀態顯示範例

```
📊 現有資料庫狀態:
============================================================
鎮國寺           zk.db                2.45 MB  ✓ 已初始化
紫雲寺           ziyun.db             N/A      ❌ 不存在
少林寺           shaolin.db           0.12 MB  ✗ 未初始化
基礎資料庫        data.db              1.23 MB  ✓ 已初始化
============================================================
```

## 初始化選單範例

```
🏗️ 請選擇要初始化的客戶資料庫:
==================================================
1. 紫雲寺 (ziyun.db) 🆕
   描述: 紫雲寺客戶資料庫
   狀態: 不存在，將建立

2. 少林寺 (shaolin.db) ⚠️
   描述: 少林寺客戶資料庫
   狀態: 未初始化

3. 取消操作
```

## 範本選擇範例

```
📋 請選擇範本資料庫:
==================================================
1. 鎮國寺 (zk.db)
   大小: 2.45 MB

2. 基礎資料庫 (data.db)
   大小: 1.23 MB

3. 使用 Directus 初始化（慢，需要設定管理員）
4. 取消
```

## 初始化方式

### 範本複製（推薦）

**優點**：

- 快速完成初始化
- 保留完整的資料結構和設定
- 包含預設資料和配置

**適用情況**：

- 需要與現有資料庫相同的結構
- 快速建立測試環境
- 標準化的客戶資料庫

**操作流程**：

1. 選擇要初始化的資料庫
2. 選擇範本資料庫
3. 自動複製並完成初始化

### Directus 初始化

**優點**：

- 全新乾淨的資料庫
- 可自訂管理員帳號
- 完整的 Directus 設定流程

**適用情況**：

- 需要全新的資料庫結構
- 特殊的客戶需求
- 測試不同的配置

**操作流程**：

1. 選擇要初始化的資料庫
2. 選擇 Directus 初始化
3. 建立臨時符號連結
4. 執行 `npx directus bootstrap`
5. 設定管理員帳號
6. 恢復原始連結

## 技術細節

### 資料庫檢查邏輯

```javascript
function isDatabaseInitialized(dbPath) {
  if (!fs.existsSync(dbPath)) {
    return false;
  }
  const stats = fs.statSync(dbPath);
  // 檔案大小 > 10KB 視為已初始化
  return stats.size > 10240;
}
```

### 符號連結管理

初始化過程中會：

1. 備份現有的 `db/current.db` 連結
2. 建立指向新資料庫的臨時連結
3. 執行初始化操作
4. 恢復原始連結

### 錯誤處理

- 配置檔案不存在或格式錯誤
- 範本資料庫損壞或不可讀
- Directus 初始化失敗
- 檔案權限問題

## 最佳實務

### 建議工作流程

1. **準備範本**

   ```bash
   # 確保有可用的範本資料庫
   node scripts/start-with-db.js  # 選擇基礎資料庫
   # 設定好基本資料和配置
   ```

2. **初始化新資料庫**

   ```bash
   node scripts/init-database.js
   # 選擇要初始化的資料庫
   # 選擇合適的範本
   ```

3. **切換並測試**
   ```bash
   node scripts/start-with-db.js
   # 選擇新初始化的資料庫
   # 測試功能是否正常
   ```

### 資料庫命名規範

在 `db/databases.json` 中：

```json
{
  "客戶代碼": {
    "path": "客戶代碼.db",
    "name": "客戶全名",
    "description": "客戶資料庫描述"
  }
}
```

### 備份建議

```bash
# 初始化前備份重要資料庫
cp db/important.db db/backup/important_$(date +%Y%m%d).db

# 初始化後驗證
ls -la db/
node scripts/start-with-db.js  # 測試切換功能
```

## 故障排除

### 配置檔案問題

```bash
# 檢查配置檔案格式
cat db/databases.json | jq .

# 修復路徑格式
# 確保 path 不包含 db/ 前綴
```

### 範本資料庫問題

```bash
# 檢查範本資料庫狀態
ls -la db/*.db
sqlite3 db/template.db ".tables"  # 檢查資料庫結構
```

### Directus 初始化失敗

```bash
# 檢查 Directus 環境
cd cms-server
npm list directus
npx directus --version

# 手動初始化
npx directus bootstrap --help
```

### 權限問題

```bash
# macOS/Linux 權限修復
chmod 644 db/*.db
chmod 755 db/

# 檢查符號連結權限
ls -la db/current.db
```

### 清理失敗的初始化

```bash
# 刪除損壞的資料庫檔案
rm db/failed.db

# 清理備份檔案
rm db/current.db.backup

# 重新初始化
node scripts/init-database.js
```

## 與其他工具的整合

### 與 start-with-db.js 配合

1. 使用 `init-database.js` 初始化新資料庫
2. 使用 `start-with-db.js` 切換到新資料庫
3. 進行開發和測試

### 自動化腳本範例

```bash
#!/bin/bash
# 批次初始化多個客戶資料庫

CLIENTS=("client1" "client2" "client3")

for client in "${CLIENTS[@]}"; do
  echo "初始化 $client 資料庫..."
  # 這裡需要手動操作，因為工具是互動式的
  # 可考慮開發非互動式版本
done
```

## 注意事項

1. **資料安全**：初始化會覆蓋現有檔案，請先備份
2. **範本選擇**：選擇合適的範本避免資料結構不匹配
3. **權限管理**：確保有足夠權限建立和修改檔案
4. **測試驗證**：初始化後務必測試資料庫功能
5. **版本控制**：不要將 `.db` 檔案加入版本控制
