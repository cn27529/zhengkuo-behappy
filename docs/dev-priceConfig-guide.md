# 金額設定模組開發文檔

> `dev-priceConfig-guide.md` — 最後更新：2026-04-01

---

## 概述說明

金額設定模組管理各類法會項目的收費金額，每次建立新設定時會自動將舊版本改為歷史記錄，確保任何時間點都只有一筆「生效中」的設定。

## 目錄

1. [模組概覽](#1-模組概覽)
2. [資料庫結構](#2-資料庫結構)
3. [資料模型](#3-資料模型)
4. [架構分層](#4-架構分層)
5. [Store API（priceConfigStore）](#5-store-apipriceConfigStore)
6. [Service API（rustPriceConfigService）](#6-service-apirustpriceconfigservice)
7. [後端路由（Rust Axum）](#7-後端路由rust-axum)
8. [Vue 組件（PriceConfig.vue）](#8-vue-組件priceconfigvue)
9. [狀態機：state 流轉](#9-狀態機state-流轉)
10. [版本管理機制](#10-版本管理機制)
11. [Mock 模式](#11-mock-模式)
12. [常見錯誤排查](#12-常見錯誤排查)

---

## 1. 模組概覽

金額設定模組管理各類法會項目的收費金額，每次建立新設定時會自動將舊版本改為歷史記錄，確保任何時間點都只有一筆「生效中」的設定。

**金額項目（共 11 項）：**

| Key                  | 中文名稱  | 預設金額 |
| -------------------- | --------- | -------- |
| `chaodu`             | 超度/超薦 | 1,000    |
| `survivors`          | 陽上人    | 0        |
| `diandeng`           | 點燈      | 600      |
| `qifu`               | 消災祈福  | 300      |
| `xiaozai`            | 固定消災  | 100      |
| `pudu`               | 中元普度  | 1,200    |
| `support_triple_gem` | 護持三寶  | 200      |
| `food_offering`      | 供齋      | 200      |
| `support_temple`     | 護持道場  | 200      |
| `sutra_printing`     | 助印經書  | 200      |
| `life_release`       | 放生      | 200      |

---

## 2. 資料庫結構

**表名：** `priceConfigDB`（SQLite）

```sql
CREATE TABLE "priceConfigDB" (
    "id"           integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    "user_created" char(36) NULL,        -- Directus 用戶 UUID
    "date_created" datetime NULL,        -- 系統建立時間（毫秒 unixepoch）
    "user_updated" char(36) NULL,        -- 最後更新者 UUID
    "date_updated" datetime NULL,        -- 系統更新時間
    "version"      varchar(255) NULL,    -- Git hash 或自訂版本號
    "state"        varchar(255) NULL,    -- 狀態：now | history
    "prices"       json NULL,            -- 金額 JSON 物件
    "notes"        varchar(255) NULL,    -- 備註
    "enableDate"   varchar(255) NULL,    -- 生效日期（ISO 8601）
    "createdAt"    varchar(255) NULL,    -- 業務建立時間（ISO 8601）
    "updatedAt"    varchar(255) NULL     -- 業務更新時間（ISO 8601）
);
```

> **注意：** `date_created` / `date_updated` 是 Directus 系統欄位，儲存格式為毫秒 unixepoch，Rust handler 查詢時會自動轉換為可讀字串。`createdAt` / `updatedAt` 是業務層自行寫入的 ISO 8601 字串，兩者並存。

---

## 3. 資料模型

### prices JSON 結構範例

```json
{
  "chaodu": 888,
  "survivors": 0,
  "diandeng": 600,
  "qifu": 300,
  "xiaozai": 100,
  "pudu": 1200,
  "support_triple_gem": 500,
  "food_offering": 200,
  "support_temple": 500,
  "sutra_printing": 200,
  "life_release": 200
}
```

### state 枚舉值

| 值        | 說明                             |
| --------- | -------------------------------- |
| `now`     | 當前生效中，全系統只允許一筆     |
| `history` | 歷史記錄，可查閱、可編輯、可刪除 |

---

## 4. 架構分層

```
PriceConfig.vue          ← 視圖層，UI 操作
    ↓
usePriceConfigStore      ← Pinia Store，狀態管理與業務邏輯
    ↓
serviceAdapter           ← 服務適配器，依環境變數路由到正確 service
    ↓
┌─────────────────────────────────┐
│  rustPriceConfigService (axum)  │  ← VITE_BACKEND_TYPE=axum
│  priceConfigService (directus)  │  ← VITE_BACKEND_TYPE=directus
└─────────────────────────────────┘
    ↓
Rust Axum API / Directus API
    ↓
SQLite priceConfigDB
```

### 環境變數

| 變數                 | 說明                                           |
| -------------------- | ---------------------------------------------- |
| `VITE_BACKEND_TYPE`  | `axum`（Rust）或 `directus`                    |
| `VITE_MOCK`          | `true` 時跳過所有 API 呼叫，使用本地 mock 資料 |
| `VITE_AUTO_FALLBACK` | `true` 時 axum 失敗自動降級至 directus         |
| `VITE_DEV`           | `true` 時顯示調試面板                          |

---

## 5. Store API（priceConfigStore）

**引入方式：**

```js
import { usePriceConfigStore, PRICE_ITEMS } from "@/stores/priceConfigStore.js";
const store = usePriceConfigStore();
```

### 狀態

| 屬性              | 型別                | 說明                                   |
| ----------------- | ------------------- | -------------------------------------- |
| `allPriceConfigs` | `Ref<Array>`        | 所有設定（依 id 降序）                 |
| `loading`         | `Ref<Boolean>`      | 載入狀態                               |
| `error`           | `Ref<String\|null>` | 最後一次錯誤訊息                       |
| `searchQuery`     | `Ref<String>`       | 搜尋關鍵字                             |
| `selectedState`   | `Ref<String>`       | 狀態篩選（`now` / `history` / 空字串） |
| `currentPage`     | `Ref<Number>`       | 當前頁碼                               |
| `pageSize`        | `Ref<Number>`       | 每頁筆數                               |

### Computed Getters

| 屬性                     | 說明                                       |
| ------------------------ | ------------------------------------------ |
| `currentConfig`          | state === `now` 的那一筆，唯一值           |
| `historyConfigs`         | state === `history` 的列表                 |
| `currentPrices`          | 當前生效的 prices 物件，無資料時回傳預設值 |
| `filteredConfigs`        | 套用搜尋/篩選後的列表，依 `createdAt` 降序 |
| `paginatedConfigs`       | 分頁後的列表（供 `el-table` 使用）         |
| `hasData`                | 是否有任何資料                             |
| `getAllPricesWithLabels` | 含中文 label 的完整金額陣列（供 UI 顯示）  |

### Actions

#### `initialize()`

初始化 store，呼叫 `getAllPriceConfigs()`。在 `onMounted` 時由 `PriceConfig.vue` 觸發。

```js
await store.initialize();
```

#### `getAllPriceConfigs(params?)`

從後端拉取全部資料，結果存入 `allPriceConfigs`。預設以 `sort: "-id"` 降序排列。Mock 模式下讀取 `mock_price_configs.json`，後端失敗時也會 fallback 到 mock。

```js
await store.getAllPriceConfigs();
await store.getAllPriceConfigs({ sort: "-id", limit: 20 });
```

#### `createPriceConfig(configData)`

建立新的金額設定。會自動呼叫 `priceConfigService.activateNewPriceConfig()`，由 Service 層負責將舊的 `now` 改為 `history`，再新增一筆 `now`。版本號自動由 Git hash 生成。

```js
const result = await store.createPriceConfig({
  prices: { chaodu: 1000, diandeng: 600, ... },
  notes: '2026 年更新',
  enableDate: '2026-04-01T00:00:00.000Z',
})
```

#### `updatePriceConfig(configId, configData)`

更新歷史記錄（state === `history`）。若嘗試更新 `now` 的設定會拋出錯誤。

```js
await store.updatePriceConfig(3, { notes: "更正備註" });
```

#### `deletePriceConfig(configId)`

刪除歷史記錄。`now` 的設定無法刪除。

```js
await store.deletePriceConfig(2);
```

#### `getPriceByActivityType(activityType)`

從 `currentPrices` 取得指定活動類型的金額，找不到回傳 `0`。

```js
const price = store.getPriceByActivityType("chaodu"); // 888
```

#### `fetchPriceConfigByDate(date)` / `fetchPriceHistory(priceKey)` / `fetchCurrentPriceConfig()`

進階查詢方法，透過 `serviceAdapter` 呼叫對應的 Service 方法。

---

## 6. Service API（rustPriceConfigService）

**路徑：** `src/rustServices/rustPriceConfigService.js`

所有方法透過 `serviceAdapter` 的 `callServiceMethod('priceConfig', methodName, ...args)` 路由進來，以下為直接呼叫的方法簽名。

### `getAllPriceConfigs(params, context?)`

```js
// params 支援的欄位
{
  sort: '-id',          // 排序，'-' 前綴為降序，預設 '-id'
  limit: 100,           // 筆數，預設 100
  offset: 0,            // 偏移量
  filter: {
    version: { _like: 'v2' },   // 模糊匹配
    state: { _eq: 'now' },      // 精確匹配
  }
}
```

> **重要：** `URLSearchParams` 只能處理扁平 key-value。`filter` 物件需手動 `.append()` 展開，不可直接 spread 展開給建構子。

### `getPriceConfigByDate(dateFrom, dateTo, options?, context?)`

前端過濾實作（依 `enableDate` 範圍），適合資料量少的場景（< 1000 筆）。若需後端過濾，需在 Rust handler 的 `PriceConfigQuery` 加入 `enable_date_from` / `enable_date_to` 欄位。

### `getPriceHistory(options?, context?)`

```js
await service.getPriceHistory({
  version: "v2", // 選填，模糊匹配
  state: "history", // 選填
  limit: 50,
  offset: 0,
});
```

回傳資料會附加 `_historyIndex`、`_createdLabel`、`_updatedLabel` 欄位（台北時區）。

### `getPriceConfigsByState(states[], context?)`

支援傳入多個狀態，單一狀態走 `/by-state/:state` 路由，多狀態並發請求後合併。

---

## 7. 後端路由（Rust Axum）

**路由定義：** `src/routes/price_config.rs`

| Method   | Path                                 | Handler                     | 說明                         |
| -------- | ------------------------------------ | --------------------------- | ---------------------------- |
| `GET`    | `/api/price-configs`                 | `get_all_price_configs`     | 查詢列表，支援排序/分頁/篩選 |
| `POST`   | `/api/price-configs`                 | `create_price_config`       | 建立新設定                   |
| `GET`    | `/api/price-configs/:id`             | `get_price_config_by_id`    | 查詢單筆                     |
| `PATCH`  | `/api/price-configs/:id`             | `update_price_config`       | 更新（部分欄位）             |
| `DELETE` | `/api/price-configs/:id`             | `delete_price_config`       | 刪除                         |
| `GET`    | `/api/price-configs/by-state/:state` | `get_price_config_by_state` | 依狀態查詢                   |

### Query 參數（GET /api/price-configs）

| 參數      | 型別      | 說明                                |
| --------- | --------- | ----------------------------------- |
| `sort`    | `string`  | 排序欄位，`-id` 為降序，`id` 為升序 |
| `limit`   | `integer` | 每頁筆數，預設 100                  |
| `offset`  | `integer` | 偏移量，預設 0                      |
| `version` | `string`  | 模糊匹配（`LIKE '%version%'`）      |
| `state`   | `string`  | 精確匹配                            |

> **SQL Injection 注意：** 目前 handler 使用字串拼接構建 `WHERE` 條件（`format!(" AND version LIKE '%{}%'", version)`），上線前建議改用 `sqlx` 的 bind 參數（`?` placeholder）防注入。

### 回應格式

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "total": 4,
    "limit": 100,
    "offset": 0
  },
  "message": null,
  "errors": null
}
```

---

## 8. Vue 組件（PriceConfig.vue）

**路徑：** `src/views/PriceConfig.vue`

### 組件狀態

| 狀態              | 說明                                                       |
| ----------------- | ---------------------------------------------------------- |
| `showAddModal`    | 控制新增/編輯 Dialog                                       |
| `showDetailModal` | 控制詳情 Dialog                                            |
| `isEditing`       | 區分新增/編輯模式                                          |
| `editingConfigId` | 編輯中的記錄 ID                                            |
| `submitting`      | 表單提交中狀態（防重複提交）                               |
| `formData`        | reactive 表單資料（version / prices / notes / enableDate） |

### 主要 UI 區塊

```
PriceConfig.vue
├── 調試面板（v-if="isDev"）
├── 當前設定卡片（v-if="currentConfig"）← 目前隱藏 display:none
├── 無設定提示（v-else）
├── 查詢區（目前隱藏 display:none）
├── 結果區
│   ├── 載入中 / 錯誤 / 無資料
│   └── el-table
│       ├── 資料時間、版本(v{id})、金額設定內容（2欄 grid）
│       ├── 備註、狀態 tag、生效日期、資料人員
│       └── 操作欄（目前隱藏 v-if="false"）
├── 新增/編輯 Dialog
│   └── 金額項目 2 欄 grid + 備註 textarea
└── 詳情 Dialog
```

### 版本欄位顯示規則

表格中版本欄顯示的是 `v${row.id}`（強制以 id 生成），並非資料庫中儲存的 `version` 欄位（Git hash）。這是有意為之，讓使用者看到可讀的流水號。

### 資料人員顯示

```js
const recordUserName = (recordUserId) => {
  const user = currentAllUsers.value.find((item) => item.id === recordUserId);
  return `${user?.firstName}${user?.lastName}` || "??";
};
```

顯示名稱從 `authService.getCurrentUsers()` 的快取中查找，以 `user_created` UUID 對應。

---

## 9. 狀態機：state 流轉

```
新增設定
    │
    ▼
[state: now] ──── 再新增設定 ────→ [state: history]
                                        │
                                   可編輯 / 可刪除
```

- 系統中任何時間點只允許一筆 `state === 'now'`
- 新增時由 `priceConfigService.activateNewPriceConfig()` 在單一操作中完成：舊 `now` → `history`，新建 `now`
- `state === 'now'` 的記錄**不可編輯、不可刪除**（Store 層會攔截並拋錯）

---

## 10. 版本管理機制

版本號（`version` 欄位）由前端在建立時自動生成：

```js
const createISOTime = DateUtils.getCurrentISOTime();
const newVersionId = await generateGitHashBrowser(createISOTime);
// 產生類似 "baaea8a" 的 Git 風格 hash
```

若生成失敗，fallback 順序為：`configData.version` → `` `v${Date.now()}` ``

---

## 11. Mock 模式

**觸發條件：** `VITE_MOCK=true`

**Mock 資料位置：** `src/data/mock_price_configs.json`

| 功能                      | Mock 行為                                                            |
| ------------------------- | -------------------------------------------------------------------- |
| `getAllPriceConfigs`      | 讀取 JSON 檔，套用 `normalizePriceConfig` 補全缺漏欄位               |
| `createPriceConfig`       | 本地操作：舊 `now` 改 `history`，`push` 新物件，`id` 取目前最大值 +1 |
| `updatePriceConfig`       | 直接修改 `allPriceConfigs` 陣列中對應 index                          |
| `deletePriceConfig`       | `splice` 移除對應 index                                              |
| `fetchCurrentPriceConfig` | 從本地陣列找 `state === 'now'`                                       |
| `fetchPriceConfigByDate`  | 本地排序後找 `enableDate <= date` 的最新一筆                         |
| `fetchPriceHistory`       | 從本地陣列過濾後排序                                                 |

---

## 12. 常見錯誤排查

### `Cannot read properties of undefined (reading 'getAllPriceConfigs')`

**原因：** `serviceAdapter` 的 `loadRustServices()` 沒有 import `rustPriceConfigService`，導致 `rust['priceConfig']` 為 `undefined`。

**修法：** 在 `serviceAdapter.js` 的 `loadRustServices()` 加入：

```js
const { rustPriceConfigService } = await import('../rustServices/rustPriceConfigService.js')
// rustServices 物件加入：
priceConfig: rustPriceConfigService,
```

---

### `TypeError: queryParams.append is not a function`

**原因：** `getAllPriceConfigs` 中使用了 `new URLSearchParams({...params}).toString()`，`.toString()` 讓變數變成字串而非 `URLSearchParams` 實例，後續 `.append()` 就炸了。另外 `params` 若含巢狀物件（如 `filter`），`URLSearchParams` 建構子也無法正確處理。

**修法：** 改用逐一 `.append()` 的寫法：

```js
const queryParams = new URLSearchParams();
queryParams.append("sort", params.sort || "-id");
if (params.limit) queryParams.append("limit", params.limit);
// ...
```

---

### `priceConfig.getAllPriceConfigs 失敗: TypeError: ...` + 自動重試 3 次

**原因：** `serviceAdapter.callServiceMethod` 有 `maxRetries = 2` 的重試機制，實際上會嘗試 3 次（attempt 0, 1, 2）。若每次都失敗，會在 console 看到 3 次錯誤 log。若 `VITE_AUTO_FALLBACK=true`，最後一次會嘗試降級到 directus。

---

### 資料排序不符預期（新建的記錄跑到最後）

**原因：** `getAllPriceConfigs` 沒有傳入 `sort` 參數，Rust handler 預設依 `date_created DESC`，但 `date_created` 是毫秒 unixepoch，新建資料若未設定此欄位則為 `NULL` 排在最後。

**修法：** 確認 Store 層傳入 `sort: "-id"`：

```js
const result = await serviceAdapter.getAllPriceConfigs({
  sort: "-id",
  ...safeParams,
});
```
