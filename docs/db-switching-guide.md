# 客戶資料庫切換指南

## 📋 概述

本系統使用**符號連結（Symbolic Link）**技術來實現多客戶資料庫切換，簡單高效且完全兼容現有的 `npm run dev` 流程。

## 🏗️ 架構說明

```
db/
├── dbA.db           # 少林寺資料庫（實體檔案）
├── dbB.db           # 紫雲寺資料庫（實體檔案）
└── current.db       # 符號連結 -> 指向當前使用的資料庫
```

Directus 和 Rust-Axum 都統一連接 `db/current.db`，透過切換符號連結的指向來切換不同客戶的資料庫。

## 🚀 快速開始

### 1️⃣ 查看當前狀態

```bash
npm run client:status
```

顯示：

- 當前使用的客戶
- 資料庫檔案
- 符號連結狀態
- 可用客戶列表

### 2️⃣ 列出所有客戶

```bash
npm run client:list
```

### 3️⃣ 切換客戶資料庫

**方法一：使用切換命令**

```bash
npm run client:switch 少林寺
```

**方法二：一鍵切換並啟動**

```bash
npm run switch:少林寺
npm run switch:紫雲寺
```

這個命令會：

1. 切換到指定客戶的資料庫
2. 自動啟動所有服務（Directus + Client + Rust-Axum）

## 📝 使用場景

### 場景 1：日常開發

```bash
# 早上開始工作，切換到少林寺客戶
npm run switch:少林寺

# 下午切換到紫雲寺客戶
npm run switch:紫雲寺
```

### 場景 2：只切換不啟動

```bash
# 只切換資料庫，不啟動服務
npm run client:switch 少林寺

# 稍後再啟動
npm run dev
```

### 場景 3：檢查當前狀態

```bash
# 忘記當前使用哪個客戶了？
npm run client:status
```

## ⚙️ 配置管理

### 添加新客戶

編輯 `config/clients.json`：

```json
{
  "current_client": "少林寺",
  "clients": {
    "少林寺": {
      "id": "shaolin",
      "name": "少林寺",
      "database": "dbA.db",
      "display_name": "少林寺管理系統",
      "description": "客戶A資料庫"
    },
    "紫雲寺": {
      "id": "ziyun",
      "name": "紫雲寺",
      "database": "dbB.db",
      "display_name": "紫雲寺管理系統",
      "description": "客戶B資料庫"
    },
    "新客戶": {
      "id": "newclient",
      "name": "新客戶",
      "database": "dbC.db",
      "display_name": "新客戶管理系統",
      "description": "新客戶資料庫"
    }
  }
}
```

然後在 `package.json` 添加快捷命令：

```json
"switch:新客戶": "node scripts/switch-client.js switch 新客戶 && npm run dev"
```

## 🔧 技術細節

### 符號連結的優勢

1. **零性能開銷** - 作業系統層級的指標，沒有額外開銷
2. **透明化** - 應用程式完全不知道在使用符號連結
3. **原子操作** - 切換是瞬間完成的
4. **兼容性好** - 不需要修改 Directus 或 Rust-Axum 代碼

### 環境配置

**server/.env** (Directus):

```bash
DB_CLIENT="sqlite3"
DB_FILENAME="../db/current.db"  # 統一使用 current.db
```

**rust-axum/.env** (Rust-Axum):

```bash
DATABASE_URL=sqlite:../db/current.db  # 統一使用 current.db
```

## 🪟 Windows 用戶注意事項

### 方法一：以管理員身份運行（推薦）

在 Windows 上創建符號連結需要管理員權限：

1. 以管理員身份打開 PowerShell 或 CMD
2. 運行切換命令

```powershell
# 右鍵 PowerShell -> 以管理員身份執行
npm run client:switch 少林寺
```

### 方法二：使用開發者模式（Windows 10+）

1. 設定 → 更新與安全性 → 開發人員選項
2. 啟用「開發人員模式」
3. 之後可以不需要管理員權限創建符號連結

### 方法三：手動創建符號連結

```cmd
# 在 db 目錄下
cd db
mklink current.db dbA.db
```

## 🔒 安全與備份

### 資料隔離

每個客戶的資料庫是完全獨立的：

- ✅ dbA.db - 少林寺專用
- ✅ dbB.db - 紫雲寺專用
- ✅ 完全隔離，沒有交叉污染風險

### 備份建議

```bash
# 定期備份各客戶資料庫
cp db/dbA.db backups/dbA-$(date +%Y%m%d).db
cp db/dbB.db backups/dbB-$(date +%Y%m%d).db
```

### Git 管理

確保 `.gitignore` 包含：

```gitignore
# 排除符號連結
db/current.db

# 排除當前客戶記錄
db/.current-client

# 可選：排除實際資料庫（看是否需要版本控制）
db/dbA.db
db/dbB.db
```

## 🐛 常見問題

### Q: 切換後還是連接到舊資料庫？

**A:** 需要重啟服務：

```bash
# 停止所有服務（Ctrl+C）
# 重新啟動
npm run dev
```

### Q: 符號連結創建失敗？

**A:** 可能原因：

1. Windows 用戶需要管理員權限
2. 目標資料庫檔案不存在（腳本會自動創建）
3. 舊的 current.db 無法刪除（關閉所有使用中的服務）

### Q: 如何確認當前連接的是哪個資料庫？

**A:** 運行狀態檢查：

```bash
npm run client:status
```

### Q: 可以同時運行多個客戶嗎？

**A:** 不行。符號連結一次只能指向一個資料庫。如需同時運行，需要：

1. 使用不同的端口
2. 分別啟動 Directus 和 Rust-Axum 實例

## 📊 完整命令列表

| 命令                           | 說明                     |
| ------------------------------ | ------------------------ |
| `npm run client:status`        | 查看當前客戶和資料庫狀態 |
| `npm run client:list`          | 列出所有可用客戶         |
| `npm run client:switch 少林寺` | 切換到指定客戶           |
| `npm run switch:少林寺`        | 切換並啟動服務           |
| `npm run switch:紫雲寺`        | 切換並啟動服務           |
| `npm run dev`                  | 啟動所有服務             |

## 🎯 最佳實踐

1. **開始工作前** - 先運行 `npm run client:status` 確認客戶
2. **切換客戶時** - 使用 `npm run switch:客戶名` 一步到位
3. **結束工作後** - 資料庫會自動保存，無需特殊操作
4. **定期備份** - 重要資料定期備份到安全位置
5. **版本控制** - config/clients.json 加入 git，但 current.db 要排除

## 🆘 需要幫助？

如果遇到問題：

1. 查看本文檔的「常見問題」章節
2. 運行 `npm run client:status` 檢查狀態
3. 檢查 db/ 目錄下的檔案是否正確
