# Activity（活動管理）功能說明

## 功能概述

Activity 是寺廟管理系統中的活動管理模組，專門用於管理各種宗教活動，包括法會、朝山、禪修、講座等寺廟活動的完整生命週期管理。

## 我理解的 Activity 功能重點：

### 🎯 核心特色

- **活動生命週期管理**：upcoming → completed → cancelled
- **智能篩選系統**：關鍵字搜尋 + 類型篩選 + 狀態篩選
- **時間智能**：自動篩選近一年活動，避免資料過載

### 📊 統計功能

- **參與人數統計**：累計所有活動的參與人次
- **活動分類統計**：按類型和狀態分組統計
- **卡片預覽**：即將到來和最近完成的活動快速預覽

### 🎨 使用者體驗

- **標籤式介面**：清楚區分即將舉行和已完成的活動
- **搜尋提示**：提供搜尋建議和操作提示
- **狀態視覺化**：用顏色和圖示清楚標示活動狀態

這個 Activity 模組設計得很實用，特別是那個「近一年活動篩選」的邏輯，避免了歷史資料過多造成的效能問題。而且搜尋功能很全面，可以搜尋活動名稱、描述、地點等多個欄位。

## 系統架構

### 三層架構設計

```
前端 Vue.js ←→ 服務適配器 ←→ 後端服務
                    ↓
            [Directus CMS / Rust Axum]
```

### 核心組件

- **前端：** `ActivityList.vue` - 活動列表管理介面
- **狀態管理：** `activityStore.js` - Pinia 狀態管理
- **服務層：** `activityService.js` + `rustActivityService.js`
- **適配器：** `serviceAdapter.js` - 統一服務介面
- **後端：** Rust Axum API + Directus CMS

## 資料結構

### 核心資料模型 (Rust)

```rust
pub struct Activity {
    // 系統字段
    pub id: i64,
    pub user_created: Option<String>,
    pub date_created: Option<String>,
    pub user_updated: Option<String>,
    pub date_updated: Option<String>,

    // 業務字段
    pub activity_id: Option<String>,     // 活動唯一ID
    pub name: Option<String>,            // 活動名稱
    pub item_type: Option<String>,       // 活動類型
    pub participants: Option<i32>,       // 參與人數
    pub date: Option<String>,            // 活動日期
    pub state: Option<String>,           // 活動狀態
    pub icon: Option<String>,            // 活動圖示 (預設: 🕯️)
    pub description: Option<String>,     // 活動描述
    pub location: Option<String>,        // 活動地點

    // 自定義時間戳
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}
```

### 前端資料結構

```javascript
const activity = {
  // 基本資訊
  id: 1,
  activityId: "a8b9c0d", // 唯一識別碼
  name: "2024年世界和平超度法會", // 活動名稱
  item_type: "ceremony", // 活動類型
  participants: 342, // 參與人數
  date: "2024-11-15T09:00:00.000Z", // 活動日期時間
  state: "completed", // 活動狀態
  icon: "🕯️", // 活動圖示
  description: "為世界和平祈福，超度歷代祖先", // 活動描述
  location: "大雄寶殿", // 活動地點

  // 時間戳記
  createdAt: "2024-10-01T08:00:00.000Z",
  createdUser: "admin",
  updatedAt: "2024-11-16T10:00:00.000Z",
  updatedUser: "admin",
};
```

## 核心功能

### 1. 活動狀態管理

#### 活動狀態流程

```
upcoming → completed → cancelled
   ↓          ↓          ↓
 即將舉行    已完成     已取消
```

### 2. 活動類型分類

- **ceremony：** 法會儀式
- **lecture：** 佛法講座
- **meditation：** 禪修活動
- **pilgrimage：** 朝山活動

### 3. CRUD 操作

#### 創建活動 (Create)

```javascript
async createActivity(activityData) {
    // 1. 健康檢查
    // 2. 生成唯一 activityId (Git Hash)
    // 3. 處理活動資料
    // 4. 提交到後端
    // 5. 返回結果
}
```

#### 查詢功能 (Read)

- `getAllActivities()` - 獲取所有活動
- `getActivityById(id)` - 根據ID查詢
- `getActivitiesByState(state)` - 根據狀態查詢
- `getActivitiesByItemType(itemType)` - 根據類型查詢

### 4. 統計分析

#### 基本統計

```javascript
// 總參與人次
const totalParticipants = computed(() => {
  return activities.value.reduce(
    (sum, activity) => sum + (activity.participants || 0),
    0,
  );
});

// 近一年活動篩選
const activities1Year = computed(() => {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  return allActivities.value.filter((activity) => {
    const activityDate = new Date(activity.date);
    return activityDate >= oneYearAgo;
  });
});
```

### 5. 智能篩選系統

#### 多維度篩選

```javascript
// 即將到來的活動
const upcomingActivities = computed(() => {
  return activities1Year.value.filter(
    (activity) => activity.state === "upcoming",
  );
});

// 已完成的活動
const completedActivities = computed(() => {
  return activities1Year.value.filter(
    (activity) => activity.state === "completed",
  );
});

// 關鍵字搜尋
const searchActivities = (keyword) => {
  return activities.value.filter(
    (activity) =>
      activity.name.toLowerCase().includes(keyword) ||
      activity.description?.toLowerCase().includes(keyword) ||
      activity.location.toLowerCase().includes(keyword),
  );
};
```

## 使用者介面

### 主要區塊

#### 1. 搜尋與篩選區

- **關鍵字搜尋：** 支援活動名稱、描述、地點搜尋
- **類型篩選：** 多選活動類型篩選
- **即時搜尋：** 輸入關鍵字即時篩選結果

#### 2. 活動列表展示

- **標籤切換：** 即將舉行 / 已完成
- **卡片展示：** 活動資訊卡片式呈現
- **狀態標識：** 清楚的狀態顏色標識

#### 3. 統計儀表板

- **總活動數：** 顯示活動總數
- **總參與人次：** 累計參與人數
- **即將活動：** 近期活動預覽

### 操作功能

#### 活動管理

- **新增活動：** 建立新的活動
- **編輯活動：** 修改活動資訊
- **刪除活動：** 移除不需要的活動
- **狀態變更：** 完成/取消活動

## 資料庫設計

### 表結構 (SQLite)

```sql
CREATE TABLE "activityDB" (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `user_created` char(36) NULL,
    `date_created` datetime NULL,
    `user_updated` char(36) NULL,
    `date_updated` datetime NULL,
    `activityId` varchar(255) NULL,      -- 活動唯一ID
    `name` varchar(255) NULL,            -- 活動名稱
    `item_type` varchar(255) NULL,       -- 活動類型
    `participants` integer NULL DEFAULT '0', -- 參與人數
    `date` varchar(255) NULL,            -- 活動日期
    `state` varchar(255) NULL,           -- 活動狀態
    `icon` varchar(255) NULL DEFAULT '🕯️', -- 活動圖示
    `description` text NULL,             -- 活動描述
    `location` varchar(255) NULL,        -- 活動地點
    `createdAt` varchar(255) NULL,
    `updatedAt` varchar(255) NULL
);
```

## API 設計

### RESTful 端點

```
GET    /activities              # 獲取所有活動
GET    /activities/:id          # 獲取特定活動
POST   /activities              # 創建新活動
PATCH  /activities/:id          # 更新活動
DELETE /activities/:id          # 刪除活動
```

### 查詢參數

- `state` - 按狀態篩選
- `item_type` - 按類型篩選
- `limit` - 限制返回數量
- `offset` - 分頁偏移

## 技術特色

### 1. 響應式設計

- Vue 3 Composition API
- Pinia 狀態管理
- 計算屬性自動更新

### 2. 服務適配器模式

- 統一的服務介面
- 支援 Mock/Directus/Rust 模式切換
- 降低前後端耦合

### 3. 時間處理

- 自動篩選近一年活動
- 日期格式化統一處理
- 時區支援

## 開發工具

### Mock 資料

- `mock_activities.json` - 測試用活動資料
- 包含各種活動類型和狀態的範例

### 測試腳本

- `test_rust_activity_api.sh` - API 測試腳本
- 自動化測試各種操作場景

---

_此文件基於程式碼分析生成，涵蓋 Activity 功能的完整技術架構和使用說明。_
