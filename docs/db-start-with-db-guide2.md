# start-with-db.js 使用說明

## 📖 概述

`start-with-db2.js` 是一個**互動式啟動腳本**，讓你在啟動服務前選擇要使用的客戶資料庫。這個腳本會：

1. ✅ 顯示當前資料庫狀態
2. ✅ 提供互動式選單選擇客戶
3. ✅ **安全移除舊的符號連結**
4. ✅ 創建新的資料庫連接
5. ✅ 啟動所有服務（Directus + Client + Rust-Axum）

## 🆕 新增功能

### 主要改進

相比原版本，新版本增加了：

| 功能              | 說明                               |
| ----------------- | ---------------------------------- |
| 🗑️ **移除舊連接** | 創建新連接前自動移除舊的符號連結   |
| ✅ **錯誤處理**   | 完善的錯誤處理和友好提示           |
| 🪟 **跨平台支持** | Windows、macOS、Linux 都能正常運行 |
| 📊 **狀態顯示**   | 顯示當前使用的資料庫               |
| 🎨 **美化輸出**   | 彩色輸出和更清晰的界面             |
| ⚠️ **失敗處理**   | 切換失敗時詢問是否繼續             |
| 🔍 **驗證機制**   | 驗證符號連結是否正確創建           |

## 🚀 快速使用

### 基本用法

```bash
node scripts/start-with-db.js
```

### 在 package.json 中添加快捷命令

```json
{
  "scripts": {
    "start": "node scripts/start-with-db.js",
    "dev:select": "node scripts/start-with-db.js"
  }
}
```

然後可以簡單執行：

```bash
npm start
# 或
npm run dev:select
```

## 🎬 執行示例

### 完整執行流程

```bash
$ node scripts/start-with-db.js

📊 當前資料庫: shaolin.db

==================================================
🏯 請選擇要啟動的客戶資料庫:
==================================================
  1. 少林寺 (shaolin.db)
  2. 紫雲寺 (ziyun.db)
  3. 鎮國寺 (zk.db)
  4. 預設資料庫 (data.db)
  0. 取消並退出
==================================================

請輸入選項 (0-4): 2

🔄 切換到 紫雲寺資料庫...
  🗑️  移除舊的符號連結: current.db
  ✓ 成功移除舊連接
  ✓ 符號連結創建成功
  ✓ 驗證成功: current.db → ziyun.db

==================================================
🚀 啟動所有服務...
==================================================

📦 服務列表:
  • Directus (port 8055)
  • Vue Client (port 5173)
  • Rust-Axum (port 3000)

💡 提示: 按 Ctrl+C 可停止所有服務

[DIRECTUS] Starting Directus...
[CLIENT] VITE ready in 1234ms
[RUST] Server running on http://127.0.0.1:3000
```

## 📋 功能詳解

### 1️⃣ 顯示當前資料庫狀態

腳本啟動時會自動檢查並顯示當前使用的資料庫：

```bash
📊 當前資料庫: shaolin.db
```

或如果尚未設定：

```bash
⚠️  尚未設定資料庫連接
```

### 2️⃣ 互動式選單

提供清晰的選單界面：

```
==================================================
🏯 請選擇要啟動的客戶資料庫:
==================================================
  1. 少林寺 (shaolin.db)
  2. 紫雲寺 (ziyun.db)
  3. 鎮國寺 (zk.db)
  4. 預設資料庫 (data.db)
  0. 取消並退出
==================================================
```

### 3️⃣ 安全移除舊連接

**核心改進**：在創建新連接前，會安全地移除舊的符號連結：

```javascript
function removeSymlink(linkPath) {
  try {
    if (fs.existsSync(linkPath)) {
      const stats = fs.lstatSync(linkPath);

      if (stats.isSymbolicLink()) {
        log(`🗑️  移除舊的符號連結: ${path.basename(linkPath)}`, "yellow");
      } else {
        log(`⚠️  發現非符號連結文件: ${path.basename(linkPath)}`, "yellow");
        log(`🗑️  移除舊文件`, "yellow");
      }

      // 安全移除
      fs.unlinkSync(linkPath);
      log(`✓ 成功移除舊連接`, "green");
    }
  } catch (error) {
    log(`✗ 移除連接失敗: ${error.message}`, "red");
  }
}
```

**輸出示例：**

```bash
🔄 切換到 紫雲寺資料庫...
  🗑️  移除舊的符號連結: current.db
  ✓ 成功移除舊連接
  ✓ 符號連結創建成功
```

### 4️⃣ 創建新連接（跨平台）

支持 Windows、macOS、Linux：

**Unix/Linux/macOS:**

```javascript
fs.symlinkSync(target, link);
```

**Windows:**

```javascript
// 嘗試 symlink
fs.symlinkSync(target, link, "file");

// 如果失敗，使用 mklink
execSync(`mklink "${link}" "${target}"`, { shell: true });
```

### 5️⃣ 驗證連接

創建符號連結後會驗證：

```bash
✓ 驗證成功: current.db → ziyun.db
```

### 6️⃣ 錯誤處理

如果切換失敗，會詢問是否繼續：

```bash
❌ 資料庫切換失敗
是否仍要啟動服務？可能會使用舊的資料庫連接。
繼續啟動? (y/N):
```

### 7️⃣ 啟動服務

使用 `concurrently` 同時啟動三個服務，並提供彩色輸出：

```bash
==================================================
🚀 啟動所有服務...
==================================================

📦 服務列表:
  • Directus (port 8055)
  • Vue Client (port 5173)
  • Rust-Axum (port 3000)

💡 提示: 按 Ctrl+C 可停止所有服務
```

## 🔧 與原版本的差異

### 原版本問題

```javascript
// ❌ 原版本：直接創建符號連結，可能失敗
execSync("ln -sf shaolin.db db/current.db", { stdio: "inherit" });
```

**問題：**

1. ❌ 不移除舊連接可能導致錯誤
2. ❌ 只支持 Unix 系統（`ln` 命令）
3. ❌ 沒有錯誤處理
4. ❌ 沒有驗證機制

### 新版本改進

```javascript
// ✅ 新版本：完整的處理流程
function switchDatabase(dbName, displayName) {
  // 1. 移除舊連接
  removeSymlink(CURRENT_DB);

  // 2. 創建新連接（跨平台）
  createSymlink(dbName, CURRENT_DB);

  // 3. 驗證連接
  verifySymlink(CURRENT_DB);
}
```

**改進：**

1. ✅ 安全移除舊連接
2. ✅ 跨平台支持（Windows/Unix）
3. ✅ 完善的錯誤處理
4. ✅ 驗證連接是否成功

## 📊 執行流程圖

```
開始
 │
 ├─ 顯示當前資料庫狀態
 │
 ├─ 顯示選單
 │
 ├─ 用戶選擇 (1-4, 0)
 │
 ├─ 選擇 0? ──Yes──> 退出
 │    │
 │   No
 │    │
 ├─ 切換資料庫
 │   │
 │   ├─ 檢查 db 目錄
 │   ├─ 移除舊連接 ───┐
 │   │                │
 │   │             成功?
 │   │                │
 │   │               Yes
 │   │                │
 │   ├─ 創建新連接 ───┤
 │   │                │
 │   │             成功?
 │   │                │
 │   ├─ 驗證連接  ────┘
 │   │
 │   └─ 成功? ──No──> 詢問是否繼續
 │        │              │
 │       Yes           No ──> 退出
 │        │              │
 │        └──────────────┘
 │
 └─ 啟動所有服務
     │
     ├─ Directus (8055)
     ├─ Vue Client (5173)
     └─ Rust-Axum (3000)
```

## 🪟 Windows 特殊處理

### 符號連結權限問題

Windows 創建符號連結需要：

**方法 1：管理員權限**

```bash
# 右鍵 PowerShell → 以管理員身份執行
npm start
```

**方法 2：開發者模式（Windows 10+）**

1. 設定 → 更新與安全性 → 開發人員選項
2. 啟用「開發者模式」
3. 重啟後可以正常創建符號連結

### Windows 錯誤提示

如果在 Windows 上失敗，腳本會提示：

```bash
❌ 創建符號連結失敗: ...
💡 提示: Windows 用戶可能需要:
   1. 以管理員身份運行
   2. 或啟用開發者模式
```

## 🎯 使用場景

### 場景 1：每日開發切換

```bash
# 早上工作 - 少林寺客戶
$ npm start
選擇: 1
# 服務啟動...

# 下午切換 - 紫雲寺客戶
$ npm start
選擇: 2
# 自動移除舊連接，創建新連接
```

### 場景 2：Demo 演示

```bash
# 準備演示前快速切換
$ npm start
選擇: 3  # 鎮國寺 Demo 資料庫
```

### 場景 3：取消操作

```bash
$ npm start
選擇: 0
👋 已取消，退出程式
```

## ⚠️ 注意事項

### 1. 資料庫文件位置

確保資料庫文件在正確位置：

```
db/
├── shaolin.db    # 少林寺
├── ziyun.db      # 紫雲寺
├── zk.db         # 鎮國寺
├── data.db       # 預設
└── current.db    # 符號連結（由腳本創建）
```

### 2. 不存在的資料庫

如果選擇的資料庫文件不存在，腳本會自動創建空文件：

```bash
⚠️  目標資料庫不存在: ziyun.db
📝 創建空資料庫文件...
✓ 符號連結創建成功
```

### 3. 服務端口

確保端口未被占用：

- Directus: 8055
- Vue Client: 5173
- Rust-Axum: 3000

### 4. 停止服務

按 `Ctrl+C` 停止所有服務：

```bash
^C
👋 收到中斷信號，正在停止所有服務...
✅ 所有服務正常結束
```

## 🔍 問題排查

### Q1: 符號連結創建失敗？

**原因：**

- Windows: 缺少管理員權限
- Unix: 文件系統不支持符號連結

**解決：**

```bash
# Windows
以管理員身份運行

# Unix/Linux
確認文件系統支持 symlink
```

### Q2: 服務啟動失敗？

**檢查清單：**

```bash
# 1. 依賴是否安裝
npm install
cd server && npm install
cd ../client && npm install

# 2. concurrently 是否安裝
npm install -D concurrently

# 3. 各目錄是否存在
ls -la server/ client/ rust-axum/
```

### Q3: 切換後還是舊資料庫？

**原因：** 服務可能已經在運行，需要重啟

**解決：**

```bash
# 停止所有服務 (Ctrl+C)
# 重新運行
npm start
```

### Q4: 顏色輸出不正常？

某些終端可能不支持 ANSI 顏色，這不影響功能。

## 🆚 與 switch-client.js 的區別

| 特性       | start-with-db.js | switch-client.js     |
| ---------- | ---------------- | -------------------- |
| 互動式選單 | ✅ 啟動時選擇    | ❌ 需要指定參數      |
| 啟動服務   | ✅ 自動啟動      | ❌ 只切換，不啟動    |
| 配置文件   | ❌ 硬編碼        | ✅ 讀取 clients.json |
| 適用場景   | 快速開發         | 靈活管理             |

**建議：**

- 日常開發 → 使用 `start-with-db.js`（快速方便）
- 腳本自動化 → 使用 `switch-client.js`（靈活可配置）

## 📝 自定義配置

### 添加新客戶

編輯腳本，在選單中添加：

```javascript
console.log("  5. 新客戶 (newclient.db)");

// 在 switch 中添加
case "5":
  success = switchDatabase("newclient.db", "新客戶資料庫");
  break;
```

### 修改服務啟動命令

修改 `startServices()` 函數：

```javascript
const processes = spawn("npx", [
  "concurrently",
  "--kill-others",
  '"npm run start:server"',
  '"npm run start:client"',
  '"npm run start:rust"',
  // 添加更多服務...
]);
```

## 📚 相關文檔

- [DATABASE-SWITCHING-GUIDE.md](./DATABASE-SWITCHING-GUIDE.md) - 資料庫切換完整指南
- [init-db-env.md](./init-db-env.md) - 環境初始化說明
- [switch-client.js](../scripts/switch-client.js) - 配置化切換腳本

## ✅ 總結

`start-with-db.js` 是一個：

- 🎯 **一站式工具** - 選擇資料庫 + 啟動服務
- 🗑️ **安全切換** - 自動移除舊連接
- 🪟 **跨平台** - Windows/macOS/Linux 都支持
- 🎨 **友好界面** - 彩色輸出、清晰提示
- ⚡ **快速開發** - 適合日常開發使用

非常適合需要頻繁切換客戶資料庫的開發場景！
