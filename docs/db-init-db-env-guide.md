# init-db-env.js 使用說明

## 📖 概述

`init-db-env.js` 是一個**環境初始化腳本**，用於自動設置多客戶資料庫切換系統所需的目錄結構和配置文件。這個腳本會幫你快速建立開發環境，無需手動創建各種文件和目錄。

## 🎯 主要功能

1. ✅ 創建必要的目錄結構
2. ✅ 生成環境變數模板文件
3. ✅ 複製模板到實際配置文件
4. ✅ 驗證配置文件格式
5. ✅ 提供下一步操作指引

## 🚀 快速使用

### 基本用法

```bash
node scripts/init-db-env.js
```

### 在 package.json 中添加快捷命令

```json
{
  "scripts": {
    "init": "node scripts/init-db-env.js"
  }
}
```

然後可以簡單執行：

```bash
npm run init
```

## 📋 執行流程詳解

### 步驟 1：創建目錄結構

腳本會檢查並創建以下目錄（如果不存在）：

```
./
├── db/          # 存放所有資料庫文件
└── config/      # 存放配置文件
```

**終端輸出：**

```bash
📁 創建目錄結構...
  ✓ 創建: db
  ✓ 創建: config
```

**如果目錄已存在：**

```bash
📁 創建目錄結構...
  - 已存在: db
  - 已存在: config
```

### 步驟 2：檢查配置文件

檢查 `config/clients.json` 是否存在並驗證其格式：

**情況 A - 文件不存在：**

```bash
⚙️  檢查配置文件...
  ✗ clients.json 不存在
  💡 請先創建 config/clients.json
```

**情況 B - 文件存在且格式正確：**

```bash
⚙️  檢查配置文件...
  ✓ clients.json 存在
  ✓ 配置有效
  ✓ 當前客戶: 少林寺
  ✓ 客戶數量: 2
```

**情況 C - 文件存在但格式錯誤：**

```bash
⚙️  檢查配置文件...
  ✓ clients.json 存在
  ✗ 配置文件格式錯誤: Unexpected token } in JSON at position 123
```

### 步驟 3：創建環境變數模板

創建兩個 `.env.template` 文件作為環境變數的範本：

#### 📄 server/.env.template

```bash
# Directus JWT 設置
KEY="mT5qR8vW2tZ4cV7bN1mK3jH6gF9dA2sJ5hG8fD1kS4pX7yB0wM3rC6eU9iQ2"
SECRET="xLp9vW2tZ5cV8bN1mK4jH7gF0dA3sJ6hG9fD2kS5pX8yB1wM4rC7eU0iQ3tZ6vN1mK4jH7gF0dA3sJ6hG9fD2kS5pX8yB1wM4rC7eU0iQ3"

# 認證配置
ACCESS_TOKEN_TTL="24h"
REFRESH_TOKEN_TTL="30d"

# 資料庫配置（使用符號連結）
DB_CLIENT="sqlite3"
DB_FILENAME="../db/current.db"   # ← 關鍵：統一使用 current.db

# 伺服器配置
HOST="127.0.0.1"
PORT="8055"
PUBLIC_URL="http://localhost:8055"

# CORS 配置
CORS_ENABLED="true"
CORS_ORIGIN="http://localhost:5173"
```

#### 📄 rust-axum/.env.template

```bash
# Rust Axum Backend 配置
HOST=127.0.0.1
PORT=3000

# SQLite 數據庫配置（使用符號連結）
DATABASE_URL=sqlite:../db/current.db   # ← 關鍵：統一使用 current.db

# SQLite 連接池配置
DATABASE_MAX_CONNECTIONS=5
DATABASE_ACQUIRE_TIMEOUT=3

# SQLite 性能優化配置
SQLITE_JOURNAL_MODE=WAL
SQLITE_SYNCHRONOUS=NORMAL
SQLITE_BUSY_TIMEOUT=5

# JWT 配置（必須與 Directus 一致）
JWT_SECRET="xLp9vW2tZ5cV8bN1mK4jH7gF0dA3sJ6hG9fD2kS5pX8yB1wM4rC7eU0iQ3tZ6vN1mK4jH7gF0dA3sJ6hG9fD2kS5pX8yB1wM4rC7eU0iQ3"
JWT_EXPIRATION=604800

# CORS 配置
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:8055

# 日誌配置
RUST_LOG=debug
```

**終端輸出：**

```bash
📝 創建環境變數模板...
  ✓ 創建: server/.env.template
  ✓ 創建: rust-axum/.env.template
```

### 步驟 4：複製模板到實際配置

如果 `.env` 文件不存在，會從 `.env.template` 複製：

**首次運行（文件不存在）：**

```bash
🔧 設置環境變數...
  ✓ 創建: server/.env
  ✓ 創建: rust-axum/.env
```

**已有配置文件（不會覆蓋）：**

```bash
🔧 設置環境變數...
  - 已存在: server/.env
  - 已存在: rust-axum/.env
```

⚠️ **重要**：如果 `.env` 已存在，腳本**不會覆蓋**，保護你的現有配置！

### 步驟 5：顯示操作指引

完成後顯示下一步操作提示：

```bash
✅ 初始化完成！

📋 下一步:
  1. 檢查 config/clients.json 配置
  2. 運行: npm run client:switch 少林寺
  3. 運行: npm run dev
```

## 🎬 完整執行示例

### 場景 1：全新環境（第一次初始化）

```bash
$ node scripts/init-db-env.js

🚀 初始化資料庫環境...

📁 創建目錄結構...
  ✓ 創建: db
  ✓ 創建: config

⚙️  檢查配置文件...
  ✗ clients.json 不存在
  💡 請先創建 config/clients.json

📝 創建環境變數模板...
  ✓ 創建: server/.env.template
  ✓ 創建: rust-axum/.env.template

🔧 設置環境變數...
  ✓ 創建: server/.env
  ✓ 創建: rust-axum/.env

✅ 初始化完成！

📋 下一步:
  1. 檢查 config/clients.json 配置
  2. 運行: npm run client:switch 少林寺
  3. 運行: npm run dev

```

### 場景 2：部分文件已存在

```bash
$ node scripts/init-db-env.js

🚀 初始化資料庫環境...

📁 創建目錄結構...
  - 已存在: db
  - 已存在: config

⚙️  檢查配置文件...
  ✓ clients.json 存在
  ✓ 配置有效
  ✓ 當前客戶: 少林寺
  ✓ 客戶數量: 2

📝 創建環境變數模板...
  - 已存在: server/.env.template
  - 已存在: rust-axum/.env.template

🔧 設置環境變數...
  - 已存在: server/.env
  - 已存在: rust-axum/.env

✅ 初始化完成！

📋 下一步:
  1. 檢查 config/clients.json 配置
  2. 運行: npm run client:switch 少林寺
  3. 運行: npm run dev

```

### 場景 3：配置文件格式錯誤

```bash
$ node scripts/init-db-env.js

🚀 初始化資料庫環境...

📁 創建目錄結構...
  - 已存在: db
  - 已存在: config

⚙️  檢查配置文件...
  ✓ clients.json 存在
  ✗ 配置文件格式錯誤: Unexpected token } in JSON at position 45

📝 創建環境變數模板...
  - 已存在: server/.env.template
  - 已存在: rust-axum/.env.template

🔧 設置環境變數...
  - 已存在: server/.env
  - 已存在: rust-axum/.env

✅ 初始化完成！

📋 下一步:
  1. 檢查 config/clients.json 配置
  2. 運行: npm run client:switch 少林寺
  3. 運行: npm run dev

```

## 📂 執行後的目錄結構

```
./
├── db/                          ← 新建目錄
│   ├── dbA.db                  # 少林寺資料庫（需手動創建或由應用生成）
│   ├── dbB.db                  # 紫雲寺資料庫（需手動創建或由應用生成）
│   └── current.db              # 符號連結（由 switch-client.js 創建）
│
├── config/                      ← 新建目錄
│   └── clients.json            # 客戶配置（需手動創建）
│
├── server/
│   ├── .env                    ← 新建文件（從模板複製）
│   └── .env.template           ← 新建模板
│
├── rust-axum/
│   ├── .env                    ← 新建文件（從模板複製）
│   └── .env.template           ← 新建模板
│
└── scripts/
    └── init-db-env.js          # 執行的腳本
```

## 🔑 關鍵特性

### 1. 安全性 - 不覆蓋現有文件

```javascript
// 腳本會先檢查文件是否存在
if (!fs.existsSync(serverEnv)) {
  fs.copyFileSync(serverEnvTemplate, serverEnv);
  // 只有不存在才創建
} else {
  // 已存在則跳過
}
```

這確保了：

- ✅ 不會意外覆蓋你的配置
- ✅ 可以安全地重複執行
- ✅ 適合團隊共享使用

### 2. 智能驗證

腳本會驗證 `clients.json` 的格式：

```javascript
try {
  const config = JSON.parse(fs.readFileSync(configFile, "utf8"));
  // 配置有效
} catch (error) {
  // 顯示錯誤訊息
}
```

### 3. 跨平台兼容

使用 Node.js 的 `path` 模組確保路徑在 Windows、macOS、Linux 上都能正常工作。

## 📋 使用場景

### 場景 1：新專案設置

```bash
# 1. Clone 專案
git clone <repository>
cd zhengkuo-behappy

# 2. 安裝依賴
npm install

# 3. 初始化環境
node scripts/init-db-env.js

# 4. 創建客戶配置
cp clients.json config/

# 5. 切換到客戶
npm run client:switch 少林寺

# 6. 啟動服務
npm run dev
```

### 場景 2：新團隊成員入職

新成員可以快速建立開發環境：

```bash
# 一鍵初始化
npm run init

# 根據提示操作
# ...
```

### 場景 3：環境重置

如果環境配置混亂，可以重置：

```bash
# 刪除配置文件
rm server/.env
rm rust-axum/.env

# 重新初始化
npm run init
```

### 場景 4：CI/CD 部署

在自動化部署流程中使用：

```yaml
# .github/workflows/deploy.yml
- name: Initialize Environment
  run: node scripts/init-db-env.js
```

## ⚠️ 注意事項

### 1. 需要手動創建 clients.json

腳本**不會自動創建** `config/clients.json`，你需要：

```bash
# 複製範例配置
cp clients.json config/

# 或手動創建
nano config/clients.json
```

### 2. 模板與實際配置的關係

```
.env.template  (模板)  →  .env  (實際使用)
     ↓                      ↓
  版本控制               gitignore
  (提交到 Git)          (不提交)
```

- `.env.template` - 應該提交到 Git，供團隊共享
- `.env` - 不應提交到 Git，包含實際配置

### 3. JWT Secret 安全性

模板中的 JWT Secret 是範例值，生產環境應該：

```bash
# 生成新的隨機密鑰
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 替換到 .env 文件中
```

## 🔧 自定義配置

### 修改模板內容

編輯 `scripts/init-db-env.js` 中的模板字串：

```javascript
const serverEnvContent = `
# 你的自定義配置
DB_CLIENT="sqlite3"
DB_FILENAME="../db/current.db"
# ...
`;
```

### 添加更多環境變數

在模板中添加新的環境變數：

```javascript
const serverEnvContent = `
# 現有配置...

# 新增配置
EMAIL_FROM="noreply@example.com"
EMAIL_TRANSPORT="smtp"
`;
```

## 🆘 常見問題

### Q1: 執行後沒有創建 clients.json？

**A:** 這是正常的！`clients.json` 需要手動創建，因為它包含你的客戶資訊。

```bash
# 使用提供的範例
cp clients.json config/
```

### Q2: 可以重複執行嗎？

**A:** 可以！腳本設計為**冪等性**，多次執行不會造成問題，已存在的文件不會被覆蓋。

### Q3: .env 和 .env.template 有什麼區別？

**A:**

- `.env.template` - 範本，提交到 Git，供團隊共享
- `.env` - 實際配置，不提交到 Git，包含敏感資訊

### Q4: Windows 用戶需要特別注意什麼？

**A:** 腳本使用 Node.js 的 `path` 模組，自動處理路徑分隔符，Windows 用戶可以正常使用。

### Q5: 如果想修改資料庫路徑怎麼辦？

**A:** 編輯生成的 `.env` 文件即可：

```bash
# server/.env
DB_FILENAME="../db/custom-path.db"

# rust-axum/.env
DATABASE_URL=sqlite:../db/custom-path.db
```

## 📚 相關文檔

- [DATABASE-SWITCHING-GUIDE.md](./DATABASE-SWITCHING-GUIDE.md) - 資料庫切換完整指南
- [clients.json](../config/clients.json) - 客戶配置範例

## 🎓 進階使用

### 與其他腳本結合

```json
{
  "scripts": {
    "setup": "npm run init && npm run client:switch 少林寺",
    "reset": "rm server/.env rust-axum/.env && npm run init"
  }
}
```

### 在 Docker 中使用

```dockerfile
# Dockerfile
FROM node:18

WORKDIR /app
COPY . .

RUN npm install
RUN node scripts/init-db-env.js

CMD ["npm", "run", "dev"]
```

## ✅ 總結

`init-db-env.js` 是一個：

- 🎯 **自動化工具** - 減少手動配置工作
- 🛡️ **安全腳本** - 不會覆蓋現有配置
- 🔧 **環境準備** - 為多客戶系統建立基礎
- 📦 **開箱即用** - 新成員快速上手

執行這個腳本是設置多客戶資料庫切換系統的**第一步**，為後續的資料庫切換操作奠定基礎！
