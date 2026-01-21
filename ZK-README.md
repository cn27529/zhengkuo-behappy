# zhengkuo-behappy 專案說明

## 專案概述

**專案名稱：** zhengkuo-behappy  
**主要功能：** 消災超度登記系統（寺廟管理系統）  
**架構類型：** 全端應用程式  

## 專案結構

```
zhengkuo-behappy/
├── client/          # Vue.js 前端應用（消災超度登記系統 UI）
├── server/          # Directus 後端 API（資料串接）
├── rust-axum/       # Rust Axum 後端服務（高效能 API）
├── db/              # SQLite 資料庫
├── scripts/         # 測試腳本和工具
├── docker/          # Docker 容器化配置
└── requitements/    # 需求文件和範例圖片
```

## 技術棧

### 前端 (Client)
- **框架：** Vue.js 3 + Vite
- **狀態管理：** Pinia
- **主要 Store：**
  - `registrationStore` - 登記管理
  - `activityStore` - 活動管理
  - `monthlyDonateStore` - 月捐管理
  - `authStore` - 認證管理
  - `taisuiStore` - 太歲管理
- **特色：** 支援 Mock 和真實 API 模式切換

### 後端服務
1. **Directus CMS (Node.js)**
   - 內容管理系統
   - RESTful API
   - 使用者認證

2. **Rust Axum 服務**
   - 高效能 API 服務
   - SQLite 資料庫整合
   - 模組化設計

### 資料庫
- **主要：** SQLite
- **表結構：**
  - `registration` - 登記資料
  - `activity` - 活動資料
  - `monthly_donate` - 月捐資料
  - `mydata` - 個人資料

## 核心功能模組

### 1. 登記管理 (Registration)
- 消災超度登記
- 表單管理
- 狀態追蹤
- 使用者分組

### 2. 活動管理 (Activity)
- 法會活動管理
- 參與者管理
- 活動狀態控制
- 統計報表

### 3. 月捐管理 (MonthlyDonate)
- 定期捐款管理
- 捐款類型分類
- 統計分析
- 匯出功能

### 4. 認證系統 (Auth)
- 使用者登入驗證
- 權限管理
- Token 管理
- 2FA 支援

### 5. 資料管理 (Mydata)
- 個人資料管理
- 資料查詢
- 狀態管理

## 架構特色

### 雙後端架構
- **Directus：** 內容管理和快速開發
- **Rust Axum：** 高效能 API 服務
- **服務適配器：** 統一介面，可在不同後端間切換

### 服務模式切換
```javascript
// 支援三種模式
- Mock 模式：開發測試
- Directus 模式：CMS 功能
- Rust 模式：高效能服務
```

### 開發工具

#### 測試腳本 (`/scripts`)
- `test_rust_registration_api.sh` - 登記 API 測試
- `test_rust_activity_api.sh` - 活動 API 測試
- `test_mydata.sh` - 資料 API 測試
- `testMydata.js` - Directus 測試工具

#### 部署管理
```bash
# 開發環境啟動
npm run dev:full

# 部署流程
git checkout zk-client-netlify
git reset --hard zk-client-v2-1210
git push origin zk-client-netlify --force
```

## 開發指令

### 專案啟動
```bash
# 完整開發環境
npm run dev:full
```

### 專案結構查看
```bash
# 查看客戶端結構
tree -L 3 -I "node_modules|.git|dist" ./client > client-tree.txt

# 查看伺服器結構
tree -L 2 -I "node_modules|.git|dist" ./server > server-tree.txt

# 查看 Rust 結構
tree -L 3 -I "target|.lock" ./rust-axum > rust-axum-tree.txt
```

## 特殊功能

### 牌位系統
- 牌位模板設計
- PDF 生成功能
- 多種牌位樣式
- 自動排版

### 統計分析
- 登記統計
- 活動參與分析
- 捐款趨勢
- 月度報表

### 資料匯出
- Excel 匯出
- PDF 報表
- 批次操作
- 資料備份

## 容器化部署

### Docker 支援
- `docker-compose.yml` 配置
- Directus 容器化
- 資料庫持久化
- 日誌管理

### CI/CD
- GitHub Actions 自動化
- Netlify 部署
- 分支管理策略

## 相關資源

### 參考專案
- [axum-admin](https://github.com/orchid-admin/axum-admin/tree/main)
- [lingdu1234/axum_admin](https://github.com/lingdu1234/axum_admin)
- [axum-login 文件](https://docs.rs/axum-login/latest/axum_login/)

### 專案統計
- **總檔案數：** 4,410
- **程式碼行數：** 17,790
- **函數數量：** 354
- **類別/結構：** 41

---

*此文件由 Kiro AI 助手分析生成，基於專案程式碼結構和配置檔案。*
