# zhengkuo-behappy — Windows 客戶端環境建置指南

> **文件路徑：** `docs/setup-SOP-guide.md`
> **適用系統：** Windows 10 (1903+) / Windows 11 64-bit
> **文件版本：** v1.0　｜　建立日期：2026-03-09

---

## 0. 系統概覽

**zhengkuo-behappy** 是一套寺廟管理系統，功能涵蓋消災超度登記、每月贊助管理、活動管理與太歲點燈服務。本文件為前往客戶端現場，在全新 Windows 環境中完整部署本系統的逐步作業指引。

### 服務端口一覽

| 服務名稱             | Port | 存取網址              | 說明                   |
| -------------------- | ---- | --------------------- | ---------------------- |
| 前端 (Vue 3 + Vite)  | 5173 | http://localhost:5173 | 主要使用者介面         |
| Rust Axum 後端       | 3000 | http://localhost:3000 | 主要 API 服務          |
| Directus 後端 (備用) | 8055 | http://localhost:8055 | Node.js / CMS 管理介面 |
| 文檔服務器           | 3001 | http://localhost:3001 | Markdown 文件瀏覽      |
| 日誌服務器           | 3002 | http://localhost:3002 | API 日誌收集與查詢     |

---

## 1. 環境需求與前置準備

### 1.1 硬體需求

| 項目     | 最低需求           | 建議配置              |
| -------- | ------------------ | --------------------- |
| CPU      | 雙核心 64-bit      | 四核心以上            |
| RAM      | 8 GB               | 16 GB 以上            |
| 磁碟空間 | 20 GB 可用         | 50 GB 以上 (SSD 較佳) |
| 作業系統 | Windows 10 (1903+) | Windows 11 22H2 以上  |
| 網路     | 有線或 Wi-Fi       | 有線網路（穩定）      |

### 1.2 必要軟體清單

在開始之前，請確認以下軟體均已備妥（安裝步驟詳見第 2 章）：

- [ ] Git for Windows — https://git-scm.com/download/win
- [ ] Node.js 20 LTS (含 npm) — https://nodejs.org
- [ ] Visual Studio Build Tools 2022 — Rust 編譯所需
- [ ] Rust Toolchain (rustup) — https://rustup.rs
- [ ] Docker Desktop for Windows — https://www.docker.com/products/docker-desktop （選用，Directus 備用後端使用）
- [ ] Windows Terminal 或 PowerShell 7 — 建議使用
- [ ] Google Chrome / Edge — 用於測試前端介面

> ⚠️ **注意：** 安裝 Node.js 時，務必勾選「Automatically install the necessary tools」，確保 Windows Build Tools 一併安裝。

---

## 2. 軟體安裝步驟

### 2.1 安裝 Git for Windows

1. 前往 https://git-scm.com/download/win 下載最新 64-bit 安裝程式
2. 執行安裝程式，選項保持預設值
3. 在「Adjusting your PATH environment」頁面選擇 **Git from the command line and also from 3rd-party software**
4. 完成後開啟 Terminal 驗證：

```bash
git --version
# 預期輸出：git version 2.x.x.windows.x
```

### 2.2 安裝 Node.js 20 LTS

1. 前往 https://nodejs.org 下載 Node.js 20 LTS 的 Windows Installer (.msi)
2. 執行安裝程式，確認勾選「**Add to PATH**」
3. 完成後，**開新的 Terminal 視窗**驗證：

```bash
node --version
# 預期輸出：v20.x.x

npm --version
# 預期輸出：10.x.x
```

> 📌 若版本未顯示，請關閉並重新開啟 Terminal（PATH 環境變數需重新載入）。

### 2.3 安裝 Visual Studio Build Tools 2022

> 📌 此步驟為 Rust 編譯 native code 所必需，即使不使用 Visual Studio IDE 也必須安裝 Build Tools。

1. 前往 https://visualstudio.microsoft.com/visual-cpp-build-tools/ 下載安裝程式
2. 執行安裝程式，在 Workloads 頁面勾選「**Desktop development with C++**」
3. 確認右側清單包含以下元件：
   - MSVC v143 - VS 2022 C++ x64/x86 build tools
   - Windows 11 SDK（或 Windows 10 SDK）
   - C++ CMake tools for Windows
4. 點擊「Install」，等待安裝完成（約 5-10 分鐘）

### 2.4 安裝 Rust Toolchain

1. 前往 https://rustup.rs 下載 `rustup-init.exe`
2. 執行，選擇選項 **1 (Proceed with installation)**
3. 安裝完成後，**重新開啟 Terminal** 驗證：

```bash
rustup --version
cargo --version
rustc --version

# 確認 stable toolchain
rustup show
# 應顯示 stable-x86_64-pc-windows-msvc 為 active toolchain
```

> ⚠️ **注意：** 若出現 `linker 'link.exe' not found` 錯誤，代表 Visual Studio Build Tools 未安裝或安裝不完整，請重新執行步驟 2.3。

### 2.5 安裝 Docker Desktop（選用）

> 📌 僅在需要使用 Directus 備用後端時才需安裝。若僅使用 Rust 後端，可略過此步驟。

1. 前往 https://www.docker.com/products/docker-desktop 下載 Docker Desktop for Windows
2. 執行安裝，依提示重啟電腦
3. 啟動 Docker Desktop，確認狀態列顯示「Docker Desktop is running」

```bash
docker --version
docker compose version
```

---

## 3. 取得程式碼與安裝相依套件

### 3.1 複製專案程式碼

```bash
# 方式一：Git Clone（需有 repo 存取權限）
git clone <repository-url> zhengkuo-behappy
cd zhengkuo-behappy

# 方式二：USB 傳輸後切換目錄
cd C:\Users\<UserName>\Desktop\zhengkuo-behappy
```

> 📌 若客戶端環境無法直接存取 Git Repository，可改用 USB 傳輸方式，將整個專案資料夾複製至目標機器後，從步驟 3.2 開始執行。

### 3.2 安裝根目錄相依套件

```bash
npm install
```

### 3.3 安裝前端相依套件

```bash
cd client
npm install
cd ..
```

### 3.4 建置 Rust 後端

> 📌 首次建置需下載所有 crates 依賴，時間較長（約 5–15 分鐘），請確保網路連線穩定。

```bash
cd rust-axum
cargo build
# 最後應出現：Finished dev [unoptimized + debuginfo]
cd ..
```

> ⚠️ **注意：** 若出現網路相關錯誤（如 `registry fetch failed`），請確認防火牆或 Proxy 設定未封鎖 https://crates.io。

### 3.5 安裝日誌服務器相依套件

```bash
cd log-server
npm install
cd ..
```

### 3.6 安裝文檔服務器相依套件

```bash
cd docs
npm install
cd ..
```

---

## 4. 環境變數設定

### 4.1 建立前端環境變數

在 `client/` 目錄下建立 `.env.local`：

```env
# client/.env.local

# 後端 API 基底網址
VITE_API_BASE_URL=http://localhost:3000

# Directus 備用後端（選用）
VITE_DIRECTUS_URL=http://localhost:8055

# 日誌服務器
VITE_LOG_SERVER_URL=http://localhost:3002

# 服務模式：mock | directus | rust
VITE_SERVICE_MODE=rust
```

### 4.2 建立日誌服務器環境變數

在 `log-server/` 目錄下建立 `.env`：

```env
# log-server/.env

PORT=3002

# MongoDB Atlas 連線字串（若使用雲端日誌）
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>

# 若使用本地 MongoDB（Docker）
# MONGODB_URI=mongodb://localhost:27017/zk_logs
```

> 📌 若客戶端環境無法連接 MongoDB Atlas，日誌服務器仍可啟動，前端主要功能不受影響。

### 4.3 資料庫符號連結設定

`db/current.db` 是指向 `db/zk.db` 的符號連結。Windows 有三種處理方式：

**方式一：以管理員身分建立符號連結**

```cmd
# 以系統管理員身分開啟 Terminal，在 db/ 目錄執行：
cd db
mklink current.db zk.db
```

**方式二：啟用 Developer Mode（推薦開發機器）**

設定 → 更新與安全性 → 開發人員專用 → 啟用「開發人員模式」，重新開啟 Terminal 後即可建立符號連結。

**方式三：直接複製檔案（最簡單）**

```cmd
cd db
copy zk.db current.db
```

---

## 5. 服務啟動程序

### 5.1 全棧開發模式（建議）

```bash
# 在專案根目錄執行
# 同時啟動前端 (5173) + Rust 後端 (3000)
npm run dev:full
```

### 5.2 個別服務啟動

各服務需分別開啟 Terminal 視窗執行：

**前端開發服務器**

```bash
cd client
npm run dev
# 預期：VITE ready — http://localhost:5173/
```

**Rust Axum 後端**

```bash
cd rust-axum
cargo run
# 或：npm run dev:rust（在根目錄）
# 預期：Listening on 0.0.0.0:3000
```

**日誌服務器**

```bash
cd log-server
node mongoDBLogger.js
# 預期：Log server running on port 3002
```

**文檔服務器**

```bash
npm run docs
# 或：cd docs && node docs-server.js
# 預期：Docs server running on port 3001
```

**Directus 備用後端（選用，需 Docker）**

```bash
cd docker
docker compose up -d
docker compose ps
# 確認 directus 容器狀態為 running，port 8055
```

---

## 6. 驗收測試

### 6.1 服務健康狀態確認

啟動所有服務後，依序確認各服務正常回應：

- [ ] http://localhost:5173 — 前端頁面正常載入，顯示登入畫面
- [ ] http://localhost:3000 — Rust API 有回應
- [ ] http://localhost:3001 — 文檔服務器顯示文件列表
- [ ] http://localhost:3002/health — 回應 `{"status":"ok"}`
- [ ] `db/current.db` 符號連結或檔案存在

### 6.2 API 功能測試腳本

> 📌 `.sh` 腳本需在 **Git Bash** 中執行（在專案目錄右鍵 → Git Bash Here）。

```bash
bash scripts/test_rust_registration_api.sh
bash scripts/test_rust_activity_api.sh
bash scripts/test_rust_mydata_api.sh
bash scripts/test_rust_receipt_number_api.sh
bash scripts/test_rust_participation_record_api.sh
```

### 6.3 日誌系統測試

```bash
cd log-server
node test-complete.js
```

### 6.4 功能驗收清單

- [ ] 使用者可正常登入
- [ ] 消災超度登記：可新增、查詢、列印
- [ ] 每月贊助：可查看和管理贊助記錄
- [ ] 活動管理：可查看活動列表與詳細資訊
- [ ] 太歲點燈：功能可正常操作
- [ ] 牌位列印：可預覽和列印牌位
- [ ] Dashboard：統計數據正常顯示

---

## 7. 常見問題排除

| 錯誤訊息 / 症狀                       | 可能原因                       | 解決方式                                                              |
| ------------------------------------- | ------------------------------ | --------------------------------------------------------------------- |
| `linker 'link.exe' not found`         | VS Build Tools 未安裝          | 安裝 Build Tools 2022，勾選 C++ Desktop Development                   |
| `cargo: command not found`            | Rust 未安裝或 PATH 未設定      | 重新執行 rustup-init.exe，重開 Terminal                               |
| `node: command not found`             | Node.js 未安裝或 PATH 未設定   | 重新安裝 Node.js，確認勾選 Add to PATH                                |
| `Port 3000 already in use`            | 其他程式佔用 Port              | `netstat -ano \| findstr :3000`，找出 PID 後 `taskkill /F /PID <PID>` |
| `EACCES: permission denied (symlink)` | Windows 符號連結需要管理員權限 | 以管理員開啟 Terminal 或啟用 Developer Mode                           |
| 前端空白頁面                          | Vite 未啟動或 API 連線失敗     | 確認 `npm run dev` 已執行，檢查 `.env.local` 設定                     |
| `registry fetch failed`               | 防火牆封鎖 crates.io           | 設定 Proxy 或開放 crates.io 的 443/80 Port                            |
| `database is locked`                  | SQLite 多進程衝突              | 確認只有一個 Rust 後端實例在執行                                      |
| `Cannot connect to MongoDB`           | MONGODB_URI 錯誤或網路問題     | 確認 `.env` 設定正確，或改用本地 MongoDB                              |
| `Module not found`                    | npm install 未完成             | 刪除 `node_modules` 重新執行 `npm install`                            |

### 完整重置（清除重裝）

> ⚠️ 以下命令會刪除所有已安裝的相依套件。

```powershell
# PowerShell 清除所有 node_modules
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force client\node_modules
Remove-Item -Recurse -Force log-server\node_modules
Remove-Item -Recurse -Force docs\node_modules

# 重新安裝
npm install
cd client && npm install && cd ..
cd log-server && npm install && cd ..
cd docs && npm install && cd ..

# 清除 Rust 建置快取
cd rust-axum && cargo clean && cargo build
```

---

## 8. Windows 特有注意事項

### 8.1 執行 Shell 腳本

`scripts/` 目錄下的 `.sh` 腳本無法在 CMD/PowerShell 直接執行，需使用 **Git Bash**：

```bash
# 在專案目錄右鍵 → Git Bash Here，然後執行：
bash scripts/test_rust_registration_api.sh
```

### 8.2 防毒軟體排除清單

部分企業防毒軟體可能干擾 Rust 編譯或封鎖 cargo 下載。建議將以下目錄加入排除清單：

- 整個 `zhengkuo-behappy` 專案資料夾
- `%USERPROFILE%\.cargo`
- `%USERPROFILE%\.rustup`
- `%APPDATA%\npm-cache`

### 8.3 啟用 Windows 長路徑支援

Rust crates 有時會超過 Windows 預設的 260 字元路徑限制，建議開啟長路徑支援：

```powershell
# 以系統管理員身分在 PowerShell 執行（需重啟生效）：
New-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem' `
  -Name 'LongPathsEnabled' -Value 1 -PropertyType DWORD -Force
```

---

## 9. 專案結構說明

### 頂層目錄

| 目錄 / 檔案    | 說明                             |
| -------------- | -------------------------------- |
| `client/`      | Vue 3 前端應用程式               |
| `rust-axum/`   | Rust Axum 主要後端 API           |
| `server/`      | Node.js / Directus 備用後端      |
| `log-server/`  | 日誌收集服務器（MongoDB）        |
| `docs/`        | 文檔服務器（Markdown 瀏覽）      |
| `db/`          | SQLite 資料庫檔案                |
| `docker/`      | Docker Compose 配置              |
| `scripts/`     | 開發輔助腳本（API 測試、部署等） |
| `nginx/`       | Nginx 反向代理配置（生產環境）   |
| `netlify.toml` | Netlify 前端部署配置             |

### 前端核心結構

```
client/src/
├── components/     # 可重用 UI 組件
├── views/          # 頁面組件（Registration、Dashboard、TaiSui 等）
├── stores/         # Pinia 狀態管理
├── services/       # Directus API 服務層
├── rustServices/   # Rust 後端 API 服務層
├── adapters/       # serviceAdapter.js — 統一切換後端
├── router/         # Vue Router 路由配置
├── utils/          # 工具函數
├── config/         # 應用配置
└── data/           # 模擬測試數據 (mock_*.json)
```

### Rust 後端結構

```
rust-axum/src/
├── main.rs                  # 應用入口，CORS 設定
├── db.rs                    # SQLite 連接池
├── handlers/                # 業務邏輯處理器
│   ├── registration.rs      # 消災超度登記 CRUD
│   ├── activity.rs          # 活動管理 CRUD
│   ├── monthly_donate.rs    # 每月贊助 CRUD
│   ├── my_data.rs           # 個人資料 CRUD
│   ├── participation_record.rs
│   └── receipt_number.rs    # 收據編號管理
├── models/                  # 資料結構定義
├── routes/                  # HTTP 路由定義
└── utils/                   # 工具函數
```

### 服務適配器模式

前端透過 `serviceAdapter.js` 統一切換後端：

```javascript
// 切換後端模式
serviceAdapter.switchBackend("rust"); // 使用 Rust 後端（預設）
serviceAdapter.switchBackend("directus"); // 使用 Directus 後端
serviceAdapter.switchBackend("mock"); // 使用本地模擬數據

// 統一的服務呼叫方式
await serviceAdapter.registrationService().getAllRegistrations();
```

---

## 10. 部署完成驗收清單

### 環境安裝

- [ ] `git --version` 回應版本號
- [ ] `node --version` 顯示 v20.x.x
- [ ] `cargo --version` 回應版本號
- [ ] `rustup show` 顯示 stable-x86_64-pc-windows-msvc

### 程式碼與相依套件

- [ ] 專案程式碼已取得（git clone 或 USB 傳輸）
- [ ] 根目錄 `npm install` 完成
- [ ] `client/npm install` 完成
- [ ] `log-server/npm install` 完成
- [ ] `docs/npm install` 完成
- [ ] `rust-axum/cargo build` 完成，無錯誤
- [ ] `db/current.db` 符號連結或檔案存在
- [ ] `client/.env.local` 已建立
- [ ] `log-server/.env` 已建立

### 服務運作

- [ ] http://localhost:5173 前端頁面正常
- [ ] http://localhost:3000 Rust API 有回應
- [ ] http://localhost:3001 文檔服務器正常
- [ ] http://localhost:3002/health 回應 ok
- [ ] 使用者可登入，進入主畫面
- [ ] 消災超度登記功能正常
- [ ] 每月贊助功能正常
- [ ] 活動管理功能正常
- [ ] 太歲點燈功能正常
- [ ] Dashboard 統計正常
- [ ] API 測試腳本全數通過

---

> 技術人員：**\*\***\_\_\_\_**\*\***　　日期：**\*\***\_\_\_\_**\*\***
>
> 客戶確認：**\*\***\_\_\_\_**\*\***　　日期：**\*\***\_\_\_\_**\*\***
