# 系統架構總覽

## 專案概述

**zhengkuo-behappy** 是一個完整的寺廟管理系統，主要功能包括消災超度登記、每月贊助管理、活動管理與太歲點燈服務。

**專案統計：**
- 總檔案數：4,410
- 程式碼行數：17,790
- 函數數量：354
- 類別/結構：41

## 技術架構

### 整體架構圖

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API    │    │   Database      │
│   (Vue.js)      │◄──►│   (Dual Stack)   │◄──►│   (SQLite)      │
│                 │    │                  │    │                 │
│ • Vue 3 + Vite  │    │ • Rust Axum     │    │ • registrationDB│
│ • Pinia Store   │    │ • Node.js/Directus│  │ • activityDB    │
│ • Vue Router    │    │                  │    │ • monthlyDonateDB│
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                                               │
         │              ┌──────────────────┐            │
         └─────────────►│   Log Server     │◄───────────┘
                        │   (Node.js)      │
                        │                  │
                        │ • MongoDB Logger │
                        │ • Remote Logging │
                        │ • Cloud MongoDB  │
                        └──────────────────┘
                                 │
                        ┌──────────────────┐
                        │   Docs Server    │
                        │   (Express.js)   │
                        │                  │
                        │ • Markdown 渲染  │
                        │ • 文檔瀏覽界面   │
                        │ • 即時更新       │
                        └──────────────────┘
```

### 前端架構 (Frontend)

**技術棧：**

- **框架**: Vue 3 + Composition API
- **構建工具**: Vite
- **狀態管理**: Pinia
- **路由**: Vue Router
- **UI**: 自定義組件 + Element Plus

**目錄結構：**

```
client/src/
├── components/          # 可重用組件
├── views/              # 頁面組件
├── stores/             # Pinia 狀態管理
├── services/           # API 服務層
├── rustServices/       # Rust 後端服務
├── adapters/           # 服務適配器
├── router/             # 路由配置
├── utils/              # 工具函數
├── config/             # 配置文件
└── data/               # 模擬數據
```

**核心模組：**

1. **Registration Module** - 消災超度登記
   - `RegistrationStore` - 狀態管理
   - `RegistrationService` - API 服務
   - `Registration.vue` - 主要頁面

2. **MonthlyDonate Module** - 每月贊助
   - `MonthlyDonateStore` - 狀態管理
   - `MonthlyDonateService` - API 服務
   - `MonthlyDonate.vue` - 主要頁面

3. **Activity Module** - 活動管理
   - `ActivityStore` - 狀態管理
   - `ActivityService` - API 服務
   - `ActivityList.vue` - 主要頁面

4. **Auth Module** - 認證系統
   - `AuthStore` - 認證狀態
   - `AuthService` - 認證服務
   - 支援 Mock、Directus、Supabase 多種認證方式

### 後端架構 (Backend)

**雙後端策略：**

#### 1. Rust Axum 後端 (主要)

- **位置**: `./rust-axum/`
- **特點**: 高效能、類型安全、現代化
- **端口**: 3000

**架構層次：**

```
src/
├── main.rs             # 應用入口
├── db.rs               # 資料庫連接
├── handlers/           # 請求處理器
│   ├── registration.rs
│   ├── monthly_donate.rs
│   └── activity.rs
├── models/             # 數據模型
├── routes/             # 路由定義
└── utils/              # 工具函數
```

#### 2. Node.js/Directus 後端 (備用)

- **位置**: `./server/`
- **特點**: 快速開發、管理界面
- **端口**: 8055

#### 3. 日誌服務器 (Log Server)

- **位置**: `./log-server/`
- **特點**: 專門處理日誌收集與存儲
- **端口**: 3002
- **功能**: 接收前端日誌，存入雲端 MongoDB Atlas

#### 4. 文檔服務器 (Docs Server)

- **位置**: `./docs/docs-server.js`
- **特點**: Markdown 文檔渲染與瀏覽
- **端口**: 3001
- **功能**: 提供專案文檔的 Web 界面

**架構層次：**

```
log-server/
├── mongoDBLogger.js    # 主服務器文件
├── package.json        # 依賴配置
├── .env               # 環境變數
├── test-*.js          # 測試腳本
└── curl.txt           # API 測試命令
```

**文檔服務器架構：**

```
docs/docs-server.js     # 文檔服務器
docs/                   # 文檔目錄
├── architecture-overview.md
├── log-server-guide.md
├── log-test-guide.md
├── deployment-guide.md
└── *.md               # 其他文檔
```

### 資料庫設計

#### 主要資料庫 - SQLite (`data.db`)

**主要表格：**

1. **registrationDB** - 報名記錄

   ```sql
   - id (主鍵)
   - formId, formName, formSource
   - contact (JSON) - 聯絡人資訊
   - blessing (JSON) - 消災資訊
   - salvation (JSON) - 超度資訊
   - state, user_created, date_created
   ```

2. **monthlyDonateDB** - 每月贊助

   ```sql
   - id (主鍵)
   - name, registrationId
   - donateId, donateType
   - donateItems (JSON) - 贊助項目
   - memo, icon
   ```

3. **activityDB** - 活動記錄
   ```sql
   - id (主鍵)
   - activityId, activityName
   - itemType, state, icon
   - participants (JSON)
   - monthlyStats (JSON)
   ```

#### 日誌資料庫 - MongoDB Atlas

**集合：**

- **zk_client_logs** - 前端 API 請求日誌
  ```javascript
  {
    endpoint: String,      // API 端點
    method: String,        // HTTP 方法
    status: Number,        // 回應狀態碼
    success: Boolean,      // 是否成功
    responseTime: Number,  // 回應時間
    timestamp: Date,       // 時間戳
    context: Object,       // 請求上下文
    error: Object          // 錯誤資訊（如有）
  }
  ```

## 核心功能模組

### 1. 消災超度登記系統

- **功能**: 處理消災、超度報名
- **流程**: 填寫聯絡人 → 消災人員 → 祖先資料 → 提交
- **特色**: 支援戶長設定、生肖選擇、備註功能

### 2. 每月贊助管理

- **功能**: 管理定期贊助項目
- **特色**: 月份管理、金額統計、趨勢分析
- **支援**: 批量操作、匯出功能

### 3. 活動管理系統

- **功能**: 活動建立、參與者管理
- **特色**: 狀態追蹤、統計報表、月度分析

### 4. 太歲點燈服務

- **功能**: 太歲點燈登記與管理
- **特色**: 生肖對應、點燈狀態追蹤

### 5. 牌位系統

- **功能**: 牌位模板設計與PDF生成
- **特色**: 多種牌位樣式、自動排版

## 服務適配器模式

**ServiceAdapter** 統一管理多種後端服務：

```javascript
// 自動切換後端
serviceAdapter.switchBackend("rust"); // 或 'directus'

// 統一的服務調用
await serviceAdapter.registrationService().getAllRegistrations();
```

**支援的模式：**

- `mock` - 使用本地模擬數據
- `directus` - 使用 Directus 後端
- `rust` - 使用 Rust Axum 後端

## 部署架構

### 開發環境

```bash
# 前端開發服務器
npm run dev:client    # http://localhost:5173

# Rust 後端
npm run dev:rust      # http://localhost:3000

# Directus 後端
npm run dev:server    # http://localhost:8055

# 日誌服務器
cd log-server && node mongoDBLogger.js  # http://localhost:3002

# 文檔服務器
npm run docs          # http://localhost:3001

# 全棧開發
npm run dev:full      # 同時啟動前端、Rust 後端、日誌服務器
```

### 生產環境

- **前端**: Netlify 部署 (分支: `zk-client-netlify`)
- **Rust 後端**: Docker 容器化部署
- **Directus 後端**: Docker 容器化部署
- **日誌服務器**: 本地/雲端部署
- **主資料庫**: SQLite 文件存儲
- **日誌資料庫**: MongoDB Atlas 雲端存儲

### 部署流程

```bash
# 切換到部署分支
git checkout zk-client-netlify

# 重設為與指定版本相同的分支內容
git reset --hard zk-client-v2-1210

# 推送覆蓋遠端（⚠️ 小心使用）
git push origin zk-client-netlify --force
```

### 容器化部署

- **Docker 支援**: `docker-compose.yml` 配置
- **Directus 容器化**: 完整的 CMS 容器
- **資料庫持久化**: 數據卷管理
- **CI/CD**: GitHub Actions 自動化

## 開發工具與輔助功能

### 1. Mock 數據系統

- 完整的測試數據集
- 支援開發階段快速測試
- 位置: `./client/src/data/mock_*.json`

### 2. 日誌系統

#### 前端日誌收集
- **IndexedDB 本地存儲** (`IndexedDBLogger`)
- **自動遠程發送** (`sendToRemoteLog`)
- **API 請求追蹤** (baseService.js, baseRustService.js)

#### 日誌服務器
- **本地 Node.js 服務** (`mongoDBLogger.js`)
- **雲端 MongoDB Atlas 存儲**
- **RESTful API 接口**
- **批次處理支援**

#### 日誌功能
- 單筆/批次日誌寫入
- 日誌查詢與過濾
- 統計資料分析
- 健康檢查監控
- 自動清理舊日誌

### 3. 文檔系統

#### 文檔服務器
- **Express.js 服務** (`docs-server.js`)
- **Markdown 即時渲染**
- **文檔瀏覽界面**
- **自動文檔掃描**

#### 文檔功能
- 專案架構說明
- API 使用指南
- 部署操作手冊
- 測試腳本說明
- 開發者指南

### 4. 開發者工具

- `DevTools.vue` - 開發調試面板
- `LogViewer.vue` - 日誌查看器
- Git Hash 生成器 - 版本追蹤

### 5. 測試腳本

- API 測試腳本 (`./scripts/`)
  - `test_rust_registration_api.sh` - 登記 API 測試
  - `test_rust_activity_api.sh` - 活動 API 測試
  - `test_mydata.sh` - 資料 API 測試
  - `testMydata.js` - Directus 測試工具
- 自動化測試工具
- 資料庫遷移腳本

### 6. 專案結構查看工具

```bash
# 查看客戶端結構
tree -L 3 -I "node_modules|.git|dist" ./client > client-tree.txt

# 查看伺服器結構
tree -L 2 -I "node_modules|.git|dist" ./server > server-tree.txt

# 查看 Rust 結構
tree -L 3 -I "target|.lock" ./rust-axum > rust-axum-tree.txt
```

## 安全性設計

### 認證機制
- JWT Token 認證
- Session 管理

### 資料保護

- 輸入驗證與清理
- SQL 注入防護 (使用 SQLx)
- CORS 配置

### 錯誤處理

- 統一錯誤響應格式
- 錯誤日誌記錄
- 用戶友好的錯誤提示

## 效能優化

### 前端優化

- Vue 3 Composition API
- 組件懶加載
- Pinia 狀態管理優化

### 後端優化

- Rust 高效能處理
- 資料庫連接池
- 異步處理機制

### 資料庫優化

- 適當的索引設計
- JSON 欄位優化
- 查詢效能監控

---

## 快速開始

1. **環境準備**

   ```bash
   git clone <repository>
   cd zhengkuo-behappy
   ```

2. **安裝依賴**

   ```bash
   npm install
   cd client && npm install
   cd ../rust-axum && cargo build
   ```

3. **啟動開發環境**

   ```bash
   # 啟動全棧開發（前端 + Rust 後端）
   npm run dev:full
   
   # 啟動日誌服務器（另開終端機）
   cd log-server && node mongoDBLogger.js
   ```

4. **訪問應用**
   - 前端: http://localhost:5173
   - Rust API: http://localhost:3000
   - Directus: http://localhost:8055
   - 日誌服務器: http://localhost:3002
   - 文檔服務器: http://localhost:3001

5. **查看專案文檔**
   ```bash
   npm run docs
   ```

6. **測試日誌系統**
   ```bash
   cd log-server
   node test-complete.js
   ```

更詳細的部署指南請參考 `deployment-guide.md`。

## 相關資源

### 參考專案
- [axum-admin](https://github.com/orchid-admin/axum-admin/tree/main)
- [lingdu1234/axum_admin](https://github.com/lingdu1234/axum_admin)
- [axum-login 文件](https://docs.rs/axum-login/latest/axum_login/)

---

*此文件整合了專案架構總覽與專案說明，提供完整的系統架構資訊。*
