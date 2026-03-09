# 客戶端主機環境建置指南 (Windows 全新環境)

**文件版本**: 1.0  
**適用系統**: Windows 10/11 全新環境  
**專案名稱**: 寺廟管理系統 - zhengkuo-behappy  
**建立日期**: 2026-03-09

---

## 目錄

1. [文件目的](#1-文件目的)
2. [環境檢查清單](#2-環境檢查清單)
3. [基礎軟體安裝](#3-基礎軟體安裝)
4. [專案取得與結構確認](#4-專案取得與結構確認)
5. [資料庫配置](#5-資料庫配置)
6. [後端服務啟動](#6-後端服務啟動)
7. [前端服務啟動](#7-前端服務啟動)
8. [日誌服務器配置](#8-日誌服務器配置)
9. [文檔服務器配置](#9-文檔服務器配置)
10. [功能驗證](#10-功能驗證)
11. [常見問題排除](#11-常見問題排除)
12. [附錄：專案完整樹狀結構](#12-附錄專案完整樹狀結構)

---

## 1. 文件目的

本文件旨在協助技術人員在客戶端全新 Windows 環境中，完整部署並運行 zhengkuo-behappy 寺廟管理系統，確保所有架構組件正常運作。

### 1.1 系統架構概覽

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API    │    │   Database      │
│   (Vue.js)      │◄──►│   (Dual Stack)   │◄──►│   (SQLite)      │
│   Port: 5173    │    │   Port: 3000     │    │   current.db    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                                               │
         │              ┌──────────────────┐            │
         └─────────────►│   Log Server     │◄───────────┘
                        │   Port: 3002     │
                        │   MongoDB Atlas  │
                        └──────────────────┘
                                 │
                        ┌──────────────────┐
                        │   Docs Server    │
                        │   Port: 3001     │
                        └──────────────────┘
```

---

## 2. 環境檢查清單

開始安裝前，請確認以下項目：

- [ ] Windows 10/11 專業版或企業版
- [ ] 至少 8GB RAM（建議 16GB）
- [ ] 硬碟可用空間 10GB 以上
- [ ] 網路連線正常（用以下載軟體）
- [ ] 系統管理員權限
- [ ] 防火牆允許以下連接埠：3000、3001、3002、5173、8055

---

## 3. 基礎軟體安裝

### 3.1 安裝 Node.js

1. 下載 Node.js LTS 版本（18.x 或 20.x）
   - 網址：https://nodejs.org/

2. 執行安裝程式，建議使用預設路徑 `C:\Program Files\nodejs\`

3. 安裝時勾選「Automatically install the necessary tools」

4. 安裝完成後，開啟命令提示字元（CMD）或 PowerShell，驗證安裝：

```bash
node --version
npm --version
```

預期輸出：

```
v20.11.0 (版本可能不同)
10.2.4 (版本可能不同)
```

### 3.2 安裝 Rust 開發環境

1. 下載 Rust 安裝程式（rustup-init.exe）
   - 網址：https://rustup.rs/

2. 執行安裝程式，選擇預設安裝選項（1）

3. 安裝完成後，重新開啟命令提示字元，驗證安裝：

```bash
rustc --version
cargo --version
```

預期輸出：

```
rustc 1.84.0 (或其他版本)
cargo 1.84.0 (或其他版本)
```

### 3.3 安裝 Git

1. 下載 Git for Windows
   - 網址：https://git-scm.com/download/win

2. 執行安裝程式，使用預設選項即可

3. 安裝完成後，驗證安裝：

```bash
git --version
```

### 3.4 安裝 MongoDB Compass（可選，用於查看日誌）

1. 下載 MongoDB Compass
   - 網址：https://www.mongodb.com/products/compass

2. 執行安裝程式，使用預設選項

### 3.5 安裝 SQLite 瀏覽器（可選）

1. 下載 DB Browser for SQLite
   - 網址：https://sqlitebrowser.org/dl/

2. 選擇 Windows 安裝程式版本

---

## 4. 專案取得與結構確認

### 4.1 取得專案程式碼

```bash
# 建立工作目錄（建議使用不含空白的路徑）
mkdir C:\zk-behappy
cd C:\zk-behappy

# 克隆專案（請向專案負責人索取倉庫網址）
git clone <repository-url> .
```

如果沒有 Git 倉庫，請直接複製專案資料夾到 `C:\zk-behappy`

### 4.2 確認專案結構

執行以下指令查看專案結構：

```bash
cd C:\zk-behappy
dir /b
```

確認以下重要目錄存在：

- `client/` - 前端程式
- `rust-axum/` - Rust 後端
- `server/` - Directus 後端（備用）
- `log-server/` - 日誌服務器
- `docs/` - 文檔服務器
- `db/` - 資料庫檔案
- `scripts/` - 輔助腳本

### 4.3 完整的專案樹狀結構

詳細結構請參考本文件第12章

---

## 5. 資料庫配置

### 5.1 SQLite 資料庫檢查

專案使用 SQLite 作為主要資料庫，檔案位於 `db/zk.db`

```bash
cd C:\zk-behappy\db
dir *.db
```

確認存在 `zk.db` 或 `current.db`（符號連結）

如果沒有資料庫檔案，執行初始化腳本：

```bash
cd C:\zk-behappy
node scripts\init-database.js
```

### 5.2 資料庫連線測試

使用 SQLite 瀏覽器開啟 `db\zk.db`，確認以下表格存在：

- `registrationDB`
- `monthlyDonateDB`
- `activityDB`
- `participationRecordDB`
- `receiptNumbersDB`
- `myData`
- `directus_users`

---

## 6. 後端服務啟動

### 6.1 Rust Axum 後端（主要後端）

#### 6.1.1 安裝依賴

```bash
cd C:\zk-behappy\rust-axum
cargo build
```

首次建置可能需要 5-10 分鐘，請耐心等待。

#### 6.1.2 配置環境變數

建立 `.env` 檔案：

```bash
echo DATABASE_URL="sqlite:../db/zk.db" > .env
echo SERVER_PORT=3000 >> .env
echo RUST_LOG=info >> .env
```

#### 6.1.3 啟動服務

```bash
cargo run
```

預期輸出：

```
Starting server on http://127.0.0.1:3000
```

服務啟動後，請保留此命令提示字元視窗，另開新視窗進行後續操作。

#### 6.1.4 驗證服務

開啟新命令提示字元：

```bash
curl http://localhost:3000/health
```

預期回應：

```json
{ "status": "ok" }
```

### 6.2 Directus 後端（備用，可選）

如果需要使用 Directus 管理界面：

```bash
cd C:\zk-behappy\server
npm install
npx directus start
```

服務將運行於 http://localhost:8055

---

## 7. 前端服務啟動

### 7.1 安裝依賴

```bash
cd C:\zk-behappy\client
npm install
```

### 7.2 配置環境變數

建立 `.env` 檔案：

```bash
echo VITE_API_URL=http://localhost:3000 > .env
echo VITE_LOG_SERVER_URL=http://localhost:3002 >> .env
echo VITE_USE_MOCK=false >> .env
```

### 7.3 啟動開發服務器

```bash
npm run dev
```

預期輸出：

```
VITE v5.0.0 ready in 500 ms
➜  Local:   http://localhost:5173/
➜  Network: http://192.168.x.x:5173/
```

### 7.4 驗證前端

開啟瀏覽器，訪問 http://localhost:5173

應該能看到系統登入頁面或儀表板。

---

## 8. 日誌服務器配置

### 8.1 安裝依賴

```bash
cd C:\zk-behappy\log-server
npm install
```

### 8.2 配置 MongoDB Atlas 連線

建立 `.env` 檔案：

```bash
echo MONGODB_URI="mongodb+srv://<username>:<password>@cluster.mongodb.net/zk_logs?retryWrites=true&w=majority" > .env
echo PORT=3002 >> .env
echo LOG_LEVEL=info >> .env
```

**重要**：請向專案負責人索取 MongoDB Atlas 連線字串，或使用本地 MongoDB：

```bash
# 如果使用本地 MongoDB
echo MONGODB_URI="mongodb://localhost:27017/zk_logs" > .env
```

### 8.3 啟動日誌服務器

```bash
node mongoDBLogger.js
```

預期輸出：

```
MongoDB Logger Server running on port 3002
Connected to MongoDB Atlas
```

### 8.4 驗證日誌服務器

```bash
curl http://localhost:3002/health
```

預期回應：

```json
{ "status": "healthy", "timestamp": "..." }
```

### 8.5 測試日誌寫入

```bash
cd C:\zk-behappy\log-server
node test-single-log.js
```

---

## 9. 文檔服務器配置

### 9.1 安裝依賴

```bash
cd C:\zk-behappy\docs
npm install
```

### 9.2 啟動文檔服務器

```bash
node docs-server.js
```

預期輸出：

```
📚 文檔服務器運行中：
📄 http://localhost:3001
📁 掃描到 15 個 Markdown 文件
```

### 9.3 驗證文檔服務器

開啟瀏覽器，訪問 http://localhost:3001

應該能看到文檔瀏覽界面，包含本文件（architecture-overview.md）在內的所有文檔。

---

## 10. 功能驗證

完成所有服務啟動後，請依序驗證以下功能：

### 10.1 服務狀態檢查表

| 服務            | 網址                         | 預期狀態               | 檢查結果 |
| --------------- | ---------------------------- | ---------------------- | -------- |
| Rust 後端       | http://localhost:3000/health | `{"status":"ok"}`      | ⬜       |
| 前端            | http://localhost:5173        | 頁面正常載入           | ⬜       |
| 日誌服務器      | http://localhost:3002/health | `{"status":"healthy"}` | ⬜       |
| 文檔服務器      | http://localhost:3001        | 文檔列表               | ⬜       |
| Directus (選用) | http://localhost:8055        | 登入頁面               | ⬜       |

### 10.2 核心功能驗證

#### 10.2.1 消災超度登記

1. 進入「登記」頁面
2. 填寫聯絡人資訊
3. 填寫消災人員
4. 填寫祖先資料
5. 提交表單
6. 確認資料寫入資料庫

#### 10.2.2 每月贊助管理

1. 進入「每月贊助」頁面
2. 新增贊助項目
3. 查看統計圖表

#### 10.2.3 活動管理

1. 進入「活動列表」頁面
2. 建立新活動
3. 新增參與者

#### 10.2.4 日誌功能驗證

1. 執行前端操作
2. 訪問 http://localhost:3002/logs?limit=10
3. 確認有日誌記錄

### 10.3 批次啟動腳本（選用）

為方便後續啟動，可以使用批次檔同時啟動所有服務：

建立 `C:\zk-behappy\start-all.bat`：

```batch
@echo off
echo 啟動所有服務...

start "Rust Backend" cmd /k "cd /d C:\zk-behappy\rust-axum && cargo run"
timeout /t 5
start "Log Server" cmd /k "cd /d C:\zk-behappy\log-server && node mongoDBLogger.js"
timeout /t 3
start "Docs Server" cmd /k "cd /d C:\zk-behappy\docs && node docs-server.js"
timeout /t 3
start "Frontend" cmd /k "cd /d C:\zk-behappy\client && npm run dev"

echo 所有服務啟動指令已執行
echo 前端: http://localhost:5173
echo Rust API: http://localhost:3000
echo 日誌服務器: http://localhost:3002
echo 文檔服務器: http://localhost:3001
pause
```

---

## 11. 常見問題排除

### 11.1 連接埠被佔用

**問題**：啟動服務時顯示 `Error: listen EADDRINUSE: address already in use :::3000`

**解決方案**：

```bash
# 查看佔用該埠的程式
netstat -ano | findstr :3000

# 終止該程式（替換 PID 為實際進程 ID）
taskkill /PID <PID> /F
```

### 11.2 Rust 編譯失敗

**問題**：`cargo build` 失敗，顯示缺少依賴

**解決方案**：

```bash
# 更新 Rust
rustup update

# 清理快取後重新編譯
cargo clean
cargo build
```

### 11.3 SQLite 資料庫鎖定

**問題**：後端顯示 `database is locked`

**解決方案**：

```bash
# 檢查是否有其他進程佔用資料庫
cd C:\zk-behappy\scripts
node check-db-locks.js

# 如果無法解決，複製資料庫檔案
copy C:\zk-behappy\db\zk.db C:\zk-behappy\db\zk_backup.db
```

### 11.4 MongoDB 連線失敗

**問題**：日誌服務器無法連線到 MongoDB Atlas

**解決方案**：

1. 確認網路連線正常
2. 檢查防火牆設定
3. 在 MongoDB Atlas 中將目前 IP 加入白名單
4. 使用本地 MongoDB 作為替代

### 11.5 前端無法連線後端

**問題**：前端顯示 API 請求失敗

**解決方案**：

1. 確認 Rust 後端正在運行
2. 檢查 `.env` 中的 `VITE_API_URL` 是否正確
3. 確認 CORS 設定：
   - Rust 後端應允許來自 `http://localhost:5173` 的請求

### 11.6 Windows 路徑問題

**問題**：路徑包含中文或空白導致錯誤

**解決方案**：

1. 確保專案放在不含中文和空白的路徑，如 `C:\zk-behappy`
2. 使用 8.3 格式的短名稱：`C:\ZK-BEH~1`

---

## 12. 附錄：專案完整樹狀結構

以下是從 `all-tree.txt` 整理的重要目錄結構：

```
C:\zk-behappy\
├── client/                          # 前端應用
│   ├── index.html
│   ├── package.json
│   ├── public/                      # 靜態資源
│   │   ├── ban1.png
│   │   ├── card-template-_.png
│   │   └── tools/                   # 輔助工具
│   └── src/
│       ├── App.vue
│       ├── adapters/                # 服務適配器
│       │   └── serviceAdapter.js
│       ├── components/              # UI 組件
│       ├── config/                  # 配置文件
│       ├── data/                    # 模擬數據
│       │   ├── mock_activities.json
│       │   ├── mock_registrations.json
│       │   └── ...
│       ├── router/                  # 路由
│       ├── rustServices/            # Rust 後端服務
│       │   ├── baseRustService.js
│       │   ├── rustRegistrationService.js
│       │   └── ...
│       ├── services/                # 一般服務
│       ├── stores/                  # Pinia 狀態管理
│       │   ├── authStore.js
│       │   ├── registrationStore.js
│       │   └── ...
│       ├── utils/                   # 工具函數
│       │   ├── indexedDB.js         # 本地日誌存儲
│       │   └── ...
│       └── views/                   # 頁面組件
│           ├── Registration.vue
│           ├── MonthlyDonate.vue
│           ├── ActivityList.vue
│           └── ...
│
├── rust-axum/                       # Rust 後端
│   ├── Cargo.toml
│   ├── migrations/                  # 資料庫遷移
│   └── src/
│       ├── main.rs
│       ├── db.rs                    # 資料庫連線
│       ├── handlers/                # 請求處理器
│       │   ├── registration.rs
│       │   ├── activity.rs
│       │   └── ...
│       ├── models/                  # 資料模型
│       └── routes/                  # 路由定義
│
├── log-server/                      # 日誌服務器
│   ├── mongoDBLogger.js             # 主服務器
│   ├── package.json
│   ├── public/                      # 靜態界面
│   ├── test-*.js                    # 測試腳本
│   └── utils/
│       └── dateUtils.js
│
├── docs/                            # 文檔服務器
│   ├── docs-server.js
│   ├── package.json
│   ├── public/                      # 文檔界面
│   └── *.md                         # Markdown 文檔
│       ├── architecture-overview.md
│       ├── deployment-guide.md
│       └── ...
│
├── server/                          # Directus 後端（備用）
│   ├── Dockerfile
│   ├── package.json
│   └── extensions/
│
├── db/                              # 資料庫
│   ├── zk.db                        # 主資料庫
│   ├── current.db -> zk.db          # 符號連結
│   └── sqlite___table.sql           # 表格定義
│
├── scripts/                         # 輔助腳本
│   ├── init-database.js
│   ├── start-all.js
│   ├── test_rust_*.sh               # API 測試腳本
│   └── testMydata.js
│
├── docker/                          # Docker 配置
│   └── docker-compose.yml
│
├── nginx/                           # Nginx 配置（生產環境）
│
├── package.json                     # 根目錄依賴
└── netlify.toml                     # Netlify 部署配置
```

### 12.1 重要檔案說明

| 檔案/目錄                               | 說明             |
| --------------------------------------- | ---------------- |
| `client/src/adapters/serviceAdapter.js` | 後端服務切換核心 |
| `client/src/utils/indexedDB.js`         | 前端本地日誌存儲 |
| `rust-axum/src/db.rs`                   | 資料庫連線配置   |
| `log-server/mongoDBLogger.js`           | 日誌收集服務     |
| `db/zk.db`                              | SQLite 主資料庫  |
| `docs/architecture-overview.md`         | 系統架構說明     |

---

## 附錄 A：快速參考指令

### 啟動順序（建議）

```bash
# 1. Rust 後端
cd C:\zk-behappy\rust-axum && cargo run

# 2. 日誌服務器（新視窗）
cd C:\zk-behappy\log-server && node mongoDBLogger.js

# 3. 文檔服務器（新視窗）
cd C:\zk-behappy\docs && node docs-server.js

# 4. 前端（新視窗）
cd C:\zk-behappy\client && npm run dev
```

### 驗證指令

```bash
# 測試所有服務
curl http://localhost:3000/health
curl http://localhost:3002/health
curl http://localhost:3001
```

### 停止服務

按下 `Ctrl + C` 終止各命令視窗中的服務。

---

## 附錄 B：客戶交付檢查表

交付給客戶前，請確認：

- [ ] 所有服務可一鍵啟動（使用 `start-all.bat`）
- [ ] 瀏覽器可正常訪問前端
- [ ] 可完成一筆消災登記
- [ ] 日誌服務正常記錄
- [ ] 文檔服務可正常瀏覽
- [ ] 建立桌面捷徑：
  - 前端：http://localhost:5173
  - 文檔：http://localhost:3001
  - 啟動腳本：`C:\zk-behappy\start-all.bat`

---

**文件結束**

本文件依據實際專案結構撰寫，如有更新請參考 `docs/architecture-overview.md`
