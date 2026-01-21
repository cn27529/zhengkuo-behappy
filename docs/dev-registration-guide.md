# Registration（祈福登記）功能說明

## 功能概述

Registration 是「消災超度登記系統」的核心功能模組，提供完整的祈福登記表單管理，包含消災祈福、超度法會等宗教儀式的報名登記服務。

## 系統架構

### 三層架構設計

```
前端 Vue.js ←→ 服務適配器 ←→ 後端服務
                    ↓
            [Directus CMS / Rust Axum]
```

### 核心組件

- **前端：** `Registration.vue` - 主要表單介面
- **狀態管理：** `registrationStore.js` - Pinia 狀態管理
- **服務層：** `registrationService.js` + `rustRegistrationService.js`
- **適配器：** `serviceAdapter.js` - 統一服務介面
- **後端：** Rust Axum API + Directus CMS

## 資料結構

### 核心資料模型 (Rust)

```rust
pub struct Registration {
    // 系統字段
    pub id: i64,
    pub user_created: Option<String>,
    pub date_created: Option<String>,
    pub user_updated: Option<String>,
    pub date_updated: Option<String>,

    // 業務字段
    pub state: Option<String>,           // 表單狀態
    pub form_id: Option<String>,         // 表單唯一ID
    pub form_name: Option<String>,       // 表單名稱
    pub form_source: Option<String>,     // 表單來源

    // JSON 結構化資料
    pub salvation: Option<String>,       // 超度資訊
    pub contact: Option<String>,         // 聯絡人資訊
    pub blessing: Option<String>,        // 祈福資訊

    // 自定義時間戳
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}
```

### 前端資料結構

```javascript
const registrationForm = {
  // 基本資訊
  id: -1, // -1 表示新表單
  state: "creating", // 表單狀態
  formName: "", // 表單名稱
  formId: "", // 唯一識別碼
  formSource: "", // 表單來源

  // 聯絡人資訊
  contact: {
    name: "", // 聯絡人姓名
    phone: "", // 電話
    mobile: "", // 手機
    relationship: "", // 關係
    otherRelationship: "", // 其他關係說明
  },

  // 祈福資訊（消災人員）
  blessing: {
    address: "", // 地址
    persons: [
      {
        // 消災人員列表
        id: 1,
        name: "", // 姓名
        zodiac: "", // 生肖
        notes: "", // 備註
        isHouseholdHead: true, // 是否為戶長
      },
    ],
  },

  // 超度資訊
  salvation: {
    address: "", // 地址
    ancestors: [
      {
        // 祖先列表
        id: 1,
        surname: "", // 姓氏
        zodiac: "", // 生肖
        notes: "", // 備註
      },
    ],
    survivors: [
      {
        // 陽上人列表
        id: 1,
        name: "", // 姓名
        zodiac: "", // 生肖
        notes: "", // 備註
      },
    ],
  },
};
```

## 核心功能

### 1. 表單管理

#### 多表單支援

- **表單陣列：** 支援同時管理多張登記表
- **表單切換：** 標籤式介面，可在不同表單間切換
- **表單狀態：** 每張表單獨立的狀態管理

#### 表單狀態流程

```
creating → saved → submitted → completed
   ↓         ↓        ↓          ↓
 建立中    已儲存    已提交     已完成
```

### 2. CRUD 操作

#### 創建登記表 (Create)

```javascript
async createRegistration(registrationData) {
    // 1. 健康檢查
    // 2. 生成唯一 formId (Git Hash)
    // 3. 處理表單資料
    // 4. 提交到後端
    // 5. 返回結果
}
```

#### 查詢功能 (Read)

- `getAllRegistrations()` - 獲取所有登記表
- `getRegistrationById(id)` - 根據ID查詢
- `getRegistrationsByFormId(formId)` - 根據表單ID查詢
- `getRegistrationsByState(state)` - 根據狀態查詢
- `getRegistrationsByUser(userId)` - 根據使用者查詢

#### 更新操作 (Update)

- `updateRegistration(id, data)` - 更新登記表
- `saveDraft(id, data)` - 儲存草稿
- `submitRegistration(id)` - 提交表單
- `completeRegistration(id)` - 完成登記

#### 刪除功能 (Delete)

- `deleteRegistration(id)` - 刪除登記表
- 支援批次刪除操作

### 3. 服務模式切換

#### 三種運行模式

1. **Mock 模式：** 使用本地 JSON 資料，適合開發測試
2. **Directus 模式：** 連接 Directus CMS，適合內容管理
3. **Rust 模式：** 連接 Rust Axum API，適合高效能生產環境

#### 模式切換機制

```javascript
// 服務適配器自動選擇後端
const serviceAdapter = {
  registrationService:
    getCurrentBackend() === "rust"
      ? rustRegistrationService
      : directusRegistrationService,
};
```

### 4. 資料驗證

#### 前端驗證

- **必填欄位檢查：** 聯絡人姓名、手機等
- **格式驗證：** 電話號碼、生肖選項等
- **邏輯驗證：** 至少一位消災人員或祖先

#### 後端驗證

- **資料完整性：** SQL 約束檢查
- **業務邏輯：** 狀態轉換規則
- **安全性：** 防止 SQL 注入

### 5. 狀態同步機制

#### 雙向資料綁定

```javascript
// 監聽表單變化，自動同步到表單陣列
watch(
  () => registrationForm.value,
  (newValue) => {
    formArray.value[currentFormIndex.value] = JSON.parse(
      JSON.stringify(newValue),
    );
  },
  { deep: true },
);
```

#### 表單切換同步

- 切換表單時自動載入對應資料
- 編輯時即時同步回表單陣列
- 防止資料遺失

## 使用者介面

### 主要區塊

#### 1. 表單切換器

- 標籤式介面顯示多張表單
- 顯示表單狀態和基本資訊
- 支援新增、刪除表單

#### 2. 聯絡人資訊區

- 聯絡人姓名（必填）
- 電話、手機號碼
- 關係選項（配偶、子女、朋友等）

#### 3. 祈福資訊區（消災人員）

- 地址資訊
- 人員列表管理
- 生肖選擇
- 戶長標記

#### 4. 超度資訊區

- 祖先資料管理
- 陽上人資料管理
- 姓氏、生肖、備註

### 操作功能

#### 表單操作

- **新增表單：** 建立新的登記表
- **複製表單：** 基於現有表單建立副本
- **刪除表單：** 移除不需要的表單
- **儲存草稿：** 暫存未完成的表單
- **提交表單：** 正式提交登記申請

#### 人員管理

- **新增人員：** 動態新增消災人員或祖先
- **刪除人員：** 移除不需要的人員記錄
- **批次操作：** 支援批次新增、刪除

## 技術特色

### 1. 響應式設計

- Vue 3 Composition API
- Pinia 狀態管理
- 深度監聽資料變化

### 2. 服務適配器模式

- 統一的服務介面
- 支援多種後端切換
- 降低前後端耦合

### 3. 錯誤處理機制

- 網路連線檢查
- 詳細錯誤訊息
- 優雅降級處理

### 4. 效能優化

- 懶載入資料
- 防抖動處理
- 記憶體管理

## 資料庫設計

### 表結構 (SQLite)

```sql
CREATE TABLE "registrationDB" (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `user_created` varchar(36) NOT NULL DEFAULT null,
    `date_created` datetime NULL,
    `user_updated` char(36) NULL,
    `date_updated` datetime NULL,
    `state` varchar(255) NULL,
    `formId` varchar(255) NULL,
    `formName` varchar(255) NULL,
    `formSource` varchar(255) NULL,
    `salvation` json NULL,      -- 超度資訊 JSON
    `contact` json NULL,        -- 聯絡人資訊 JSON
    `blessing` json NULL,       -- 祈福資訊 JSON
    `createdAt` varchar(255) null,
    `updatedAt` varchar(255) null
);
```

### 索引設計

- 主鍵索引：`id`
- 業務索引：`formId`, `state`, `user_created`
- 時間索引：`date_created`, `date_updated`

## API 設計

### RESTful 端點

```
GET    /registrations           # 獲取所有登記表
GET    /registrations/:id       # 獲取特定登記表
POST   /registrations           # 創建新登記表
PATCH  /registrations/:id       # 更新登記表
DELETE /registrations/:id       # 刪除登記表
```

### 查詢參數

- `state` - 按狀態篩選
- `formId` - 按表單ID篩選
- `user_created` - 按建立者篩選
- `limit` - 限制返回數量
- `offset` - 分頁偏移

## 開發工具

### Mock 資料

- `mock_registrations.json` - 測試用登記資料
- 支援開發模式快速載入

### 測試腳本

- `test_rust_registration_api.sh` - API 測試腳本
- 自動化測試各種操作場景

### 調試功能

- 開發模式調試面板
- 即時狀態顯示
- 資料結構檢視

## 部署考量

### 環境配置

- 開發環境：Mock 模式
- 測試環境：Directus 模式
- 生產環境：Rust 模式

### 效能監控

- API 回應時間
- 資料庫查詢效能
- 前端渲染效能

### 安全性

- 使用者認證
- 資料加密傳輸
- SQL 注入防護

---

_此文件基於程式碼分析生成，涵蓋 Registration 功能的完整技術架構和使用說明。_
