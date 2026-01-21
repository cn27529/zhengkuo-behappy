# 系統架構總覽

## 專案概述

**zhengkuo-behappy** 是一個完整的寺廟管理系統，主要功能包括消災超度登記、每月贊助管理、活動設置與太歲點燈服務。

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
- **端口**: 3001

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

### 資料庫設計

**SQLite 資料庫** - `data.db`

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

## 核心功能模組

### 1. 消災超度登記系統
- **功能**: 處理消災、超度報名
- **流程**: 填寫聯絡人 → 消災人員 → 祖先資料 → 提交
- **特色**: 支援戶長設定、生肖選擇、備註功能

### 2. 每月贊助管理
- **功能**: 管理定期贊助項目
- **特色**: 月份管理、金額統計、趨勢分析
- **支援**: 批量操作、匯出功能

### 3. 活動設置系統
- **功能**: 活動建立、參與者管理
- **特色**: 狀態追蹤、統計報表、月度分析

### 4. 太歲點燈服務
- **功能**: 太歲點燈登記與管理
- **特色**: 生肖對應、點燈狀態追蹤

## 服務適配器模式

**ServiceAdapter** 統一管理多種後端服務：

```javascript
// 自動切換後端
serviceAdapter.switchBackend('rust') // 或 'directus'

// 統一的服務調用
await serviceAdapter.registrationService().getAllRegistrations()
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
npm run dev:rust      # http://localhost:3001

# Directus 後端
npm run dev:server    # http://localhost:8055

# 全棧開發
npm run dev:full      # 同時啟動所有服務
```

### 生產環境
- **前端**: Netlify 部署 (分支: `zk-client-netlify`)
- **後端**: Docker 容器化部署
- **資料庫**: SQLite 文件存儲

## 開發工具與輔助功能

### 1. Mock 數據系統
- 完整的測試數據集
- 支援開發階段快速測試
- 位置: `./client/src/data/mock_*.json`

### 2. 日誌系統
- 前端日誌收集 (`IndexedDBLogger`)
- 後端請求追蹤
- 錯誤監控與報告

### 3. 開發者工具
- `DevTools.vue` - 開發調試面板
- `LogViewer.vue` - 日誌查看器
- Git Hash 生成器 - 版本追蹤

### 4. 測試腳本
- API 測試腳本 (`./scripts/`)
- 自動化測試工具
- 資料庫遷移腳本

## 安全性設計

### 認證機制
- JWT Token 認證
- 多重認證支援 (2FA)
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
   npm run dev:full
   ```

4. **訪問應用**
   - 前端: http://localhost:5173
   - Rust API: http://localhost:3001
   - Directus: http://localhost:8055

更詳細的部署指南請參考 `deployment-guide.md`。
