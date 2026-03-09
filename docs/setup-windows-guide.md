# Windows 客戶端環境建置指南

> **目標**: 在全新的 Windows 環境中完成系統部署，並成功運行所有服務

## 📋 前置檢查清單

在開始之前，請確認：

- [ ] Windows 10/11 作業系統
- [ ] 管理員權限
- [ ] 穩定的網路連線
- [ ] 至少 10GB 可用硬碟空間

---

## 第一階段：基礎環境安裝

### 1.1 安裝 Node.js

**下載與安裝：**

1. 前往 [Node.js 官網](https://nodejs.org/)
2. 下載 **LTS 版本** (建議 v18.x 或 v20.x)
3. 執行安裝程式，使用預設設定
4. 勾選 "Automatically install the necessary tools" (自動安裝必要工具)

**驗證安裝：**

```powershell
# 開啟 PowerShell 或 CMD
node --version
npm --version
```

預期輸出：

```
v20.x.x
10.x.x
```

---

### 1.2 安裝 Rust 開發環境

**安裝 Rust：**

1. 前往 [Rust 官網](https://www.rust-lang.org/tools/install)
2. 下載 `rustup-init.exe`
3. 執行安裝程式
4. 選擇 `1) Proceed with installation (default)`

**安裝 Visual Studio Build Tools：**

Rust 在 Windows 上需要 C++ 編譯工具：

1. 前往 [Visual Studio 下載頁](https://visualstudio.microsoft.com/downloads/)
2. 下載 **Build Tools for Visual Studio 2022**
3. 安裝時勾選：
   - ✅ Desktop development with C++
   - ✅ MSVC v143 - VS 2022 C++ x64/x86 build tools
   - ✅ Windows 10/11 SDK

**驗證安裝：**

```powershell
rustc --version
cargo --version
```

預期輸出：

```
rustc 1.x.x
cargo 1.x.x
```

---

### 1.3 安裝 Git

**下載與安裝：**

1. 前往 [Git 官網](https://git-scm.com/download/win)
2. 下載 Windows 版本
3. 執行安裝程式，建議設定：
   - 編輯器：選擇你熟悉的編輯器
   - PATH 環境：選擇 "Git from the command line and also from 3rd-party software"
   - Line ending：選擇 "Checkout as-is, commit Unix-style line endings"

**驗證安裝：**

```powershell
git --version
```

---

### 1.4 安裝 MongoDB Compass (選用)

用於查看日誌資料庫：

1. 前往 [MongoDB Compass 下載頁](https://www.mongodb.com/try/download/compass)
2. 下載 Windows 版本
3. 執行安裝程式

---

## 第二階段：專案部署

### 2.1 取得專案程式碼

**克隆專案：**

```powershell
# 切換到工作目錄
cd C:\Projects

# 克隆專案
git clone <repository-url> zhengkuo-behappy
cd zhengkuo-behappy
```

**檢查專案結構：**

```powershell
dir
```

應該看到：

```
client/
rust-axum/
log-server/
docs/
server/
scripts/
package.json
README.md
```

---

### 2.2 安裝根目錄依賴

```powershell
npm install
```

這會安裝：

- `concurrently` - 同時運行多個服務
- `express` - 文檔服務器
- `marked` - Markdown 渲染
- `better-sqlite3` - SQLite 資料庫

---

### 2.3 安裝前端依賴

```powershell
cd client
npm install
cd ..
```

這會安裝 Vue.js 及相關套件。

---

### 2.4 編譯 Rust 後端

```powershell
cd rust-axum
cargo build --release
cd ..
```

⏱️ **注意**：首次編譯需要 5-15 分鐘，會下載並編譯所有依賴套件。

---

### 2.5 設定日誌服務器

**安裝依賴：**

```powershell
cd log-server
npm install
```

**設定環境變數：**

1. 複製環境變數範本：

```powershell
copy .env.development .env
```

2. 編輯 `.env` 檔案，填入 MongoDB 連線資訊：

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/
MONGODB_DB_NAME=zk_logs
MONGODB_COLLECTION=zk_client_logs
PORT=3002
```

**取得 MongoDB 連線字串：**

- 如果已有 MongoDB Atlas 帳號，從 Atlas 控制台取得連線字串
- 如果沒有，請聯繫專案管理員取得連線資訊

```powershell
cd ..
```

---

## 第三階段：資料庫準備

### 3.1 準備 SQLite 資料庫

專案使用 SQLite 作為主要資料庫。

**檢查資料庫檔案：**

```powershell
# 檢查是否有現有資料庫
dir rust-axum\current.db
```

**選項 A：使用現有資料庫**

如果專案已包含 `current.db`，可直接使用。

**選項 B：初始化新資料庫**

如果需要全新資料庫：

```powershell
# 使用初始化腳本
node scripts/init-database.js
```

或手動建立：

```powershell
# 在 rust-axum 目錄建立空資料庫
cd rust-axum
sqlite3 current.db < schema.sql
cd ..
```

---

### 3.2 Windows 符號連結設定 (重要)

Windows 上的符號連結需要特殊處理。

**檢查符號連結：**

```powershell
node scripts/windows-symlink-helper.js
```

**如果需要建立符號連結：**

```powershell
# 以管理員身份執行 PowerShell
# 建立符號連結
New-Item -ItemType SymbolicLink -Path "client\public\current.db" -Target "..\..\rust-axum\current.db"
```

**驗證符號連結：**

```powershell
# 檢查連結狀態
Get-Item client\public\current.db | Select-Object LinkType, Target
```

---

## 第四階段：服務啟動與驗證

### 4.1 啟動完整開發環境

**方式一：使用 npm 腳本 (推薦)**

```powershell
npm run dev
```

這會同時啟動：

- 前端開發服務器 (http://localhost:5173)
- Rust API 服務器 (http://localhost:3000)
- 日誌服務器 (http://localhost:3002)
- 文檔服務器 (http://localhost:3001)

**方式二：分別啟動各服務**

開啟多個 PowerShell 視窗：

```powershell
# 視窗 1: 前端
cd client
npm run dev

# 視窗 2: Rust 後端
cd rust-axum
cargo run --release

# 視窗 3: 日誌服務器
cd log-server
node mongoDBLogger.js

# 視窗 4: 文檔服務器
npm run start:docs
```

---

### 4.2 驗證各服務狀態

**檢查前端：**

1. 開啟瀏覽器訪問 http://localhost:5173
2. 應該看到系統登入頁面
3. 檢查瀏覽器控制台無錯誤訊息

**檢查 Rust API：**

```powershell
# 測試 API 健康檢查
curl http://localhost:3000/health
```

預期回應：

```json
{ "status": "ok" }
```

**檢查日誌服務器：**

```powershell
# 測試日誌服務器
curl http://localhost:3002/health
```

預期回應：

```json
{ "status": "healthy", "mongodb": "connected" }
```

**檢查文檔服務器：**

開啟瀏覽器訪問 http://localhost:3001

---

### 4.3 執行功能測試

**測試日誌系統：**

```powershell
cd log-server
node test-complete.js
```

應該看到所有測試通過。

**測試 Rust API：**

```powershell
# 測試登記 API
bash scripts/test_rust_registration_api.sh

# 測試活動 API
bash scripts/test_rust_activity_api.sh
```

如果沒有 bash，可以使用 Git Bash 或手動執行 curl 命令。

---

## 第五階段：常見問題排除

### 5.1 Node.js 相關問題

**問題：npm install 失敗**

```powershell
# 清除快取
npm cache clean --force

# 刪除 node_modules 重新安裝
Remove-Item -Recurse -Force node_modules
npm install
```

**問題：權限錯誤**

```powershell
# 以管理員身份執行 PowerShell
# 設定執行政策
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

### 5.2 Rust 編譯問題

**問題：找不到 C++ 編譯器**

確認已安裝 Visual Studio Build Tools，並重新啟動終端機。

**問題：編譯錯誤**

```powershell
# 清除編譯快取
cd rust-axum
cargo clean
cargo build --release
```

---

### 5.3 資料庫問題

**問題：資料庫鎖定**

```powershell
# 檢查資料庫鎖定狀態
node scripts/check-db-locks-detailed.js
```

**問題：符號連結失敗**

確認以管理員身份執行 PowerShell，並啟用開發者模式：

1. 設定 → 更新與安全性 → 開發人員選項
2. 啟用「開發人員模式」

---

### 5.4 日誌服務器問題

**問題：無法連線 MongoDB**

1. 檢查 `.env` 檔案中的連線字串
2. 確認網路可以訪問 MongoDB Atlas
3. 檢查 IP 白名單設定

**問題：端口被佔用**

```powershell
# 查看端口佔用
netstat -ano | findstr :3002

# 終止佔用端口的程序
taskkill /PID <PID> /F
```

---

### 5.5 防火牆設定

如果服務無法訪問，可能需要設定防火牆：

```powershell
# 允許 Node.js
New-NetFirewallRule -DisplayName "Node.js" -Direction Inbound -Program "C:\Program Files\nodejs\node.exe" -Action Allow

# 允許特定端口
New-NetFirewallRule -DisplayName "Dev Server" -Direction Inbound -LocalPort 5173,3000,3001,3002 -Protocol TCP -Action Allow
```

---

## 第六階段：生產環境準備

### 6.1 建置前端

```powershell
cd client
npm run build
```

建置完成後，檔案位於 `client/dist/`

---

### 6.2 建置 Rust 後端

```powershell
cd rust-axum
cargo build --release
```

執行檔位於 `rust-axum/target/release/rust-backend.exe`

---

### 6.3 部署檢查清單

- [ ] 所有服務可正常啟動
- [ ] 前端可以訪問並登入
- [ ] API 回應正常
- [ ] 資料庫讀寫正常
- [ ] 日誌系統運作正常
- [ ] 文檔服務器可訪問

---

## 附錄

### A. 服務端口對照表

| 服務            | 端口 | 用途              |
| --------------- | ---- | ----------------- |
| 前端開發服務器  | 5173 | Vue.js 開發環境   |
| Rust API        | 3000 | 主要 API 服務     |
| 文檔服務器      | 3001 | Markdown 文檔瀏覽 |
| 日誌服務器      | 3002 | MongoDB 日誌收集  |
| Directus (選用) | 8055 | CMS 管理界面      |

### B. 重要檔案路徑

```
zhengkuo-behappy/
├── rust-axum/current.db          # 主資料庫
├── client/public/current.db      # 資料庫符號連結
├── log-server/.env               # 日誌服務器設定
├── client/.env                   # 前端環境變數
└── rust-axum/.env                # Rust 後端環境變數
```

### C. 快速指令參考

```powershell
# 啟動完整開發環境
npm run dev

# 啟動文檔服務器
npm run start:docs

# 測試日誌系統
npm run test:logs

# 檢查日誌服務器
npm run check:logs

# 檢查資料庫鎖定
npm run check:db-locks

# 檢查符號連結
npm run check:symlink
```

### D. 聯絡資訊

如遇到無法解決的問題，請聯繫：

- 技術支援：[聯絡方式]
- 專案文檔：http://localhost:3001 (啟動文檔服務器後)

---

**文件版本**: 1.0  
**最後更新**: 2026-03-09  
**適用系統**: Windows 10/11  
**專案版本**: zhengkuo-behappy v1.0.0
