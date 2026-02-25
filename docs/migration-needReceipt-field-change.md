# needReceipt 欄位定義變更遷移計劃

## 變更概述

**變更日期**: 2026-02-25

**變更原因**: 需要區分不同類型的收據（感謝狀 vs 收據）

### 原始定義
- **類型**: Boolean / varchar(255)
- **預設值**: `false` 或 `"false"`
- **意義**: 是否需要收據

### 新定義
- **類型**: varchar(255)
- **預設值**: `null` 或空字串 `""`
- **可選值**:
  - `""` 或 `null`: 不需要收據
  - `"standard"`: 需要感謝狀
  - `"stamp"`: 需要收據

## 影響範圍分析

### 受影響文件清單（共 16 個文件）

#### 1. 前端 JavaScript/Vue 文件 (6 個)
- ✅ `client/src/services/joinRecordService.js`
- ✅ `client/src/rustServices/rustJoinRecordService.js`
- ✅ `client/src/stores/joinRecordStore.js`
- ✅ `client/src/stores/dashboardStore.js`
- ✅ `client/src/data/mock_participation_records.json`
- ⚠️ `client/src/views/JoinRecordStatesControl.vue` (新增)

#### 2. 後端 Rust 文件 (2 個)
- ✅ `rust-axum/src/models/participation_record.rs`
- ✅ `rust-axum/src/handlers/participation_record.rs`

#### 3. 資料庫遷移文件 (3 個)
- ✅ `rust-axum/migrations/sqlite_participationRecordDB_table_v2.sql`
- ✅ `rust-axum/migrations/sqlite_participationRecordDB_testdata_v2.sql`
- ✅ `rust-axum/migrations/directus_participationRecordDB_collection.json`

#### 4. 文檔文件 (5 個)
- ✅ `docs/mock-participationRecords.md`
- ✅ `docs/dev-joinRecord-guide.md`
- ✅ `docs/dev-joinRecordService-guide.md`
- ✅ `docs/dev-receipt-print-status-implementation.md`
- ✅ `docs/dev-receipt-print-status-update.md`
- ✅ `docs/business-logic.md`
- ✅ `docs/api-documentation.md`
- ✅ `docs/ai-talks.md`

## 遷移策略

### 階段 1: 資料庫層面（最優先）

#### 1.1 SQLite 資料庫遷移

```sql
-- 步驟 1: 備份現有資料
CREATE TABLE participationRecordDB_backup AS 
SELECT * FROM participationRecordDB;

-- 步驟 2: 創建新欄位（臨時）
ALTER TABLE participationRecordDB 
ADD COLUMN needReceipt_new varchar(255) NULL DEFAULT NULL;

-- 步驟 3: 資料遷移
-- 將 "true" 或 "1" 轉換為 "standard"（預設類型）
UPDATE participationRecordDB 
SET needReceipt_new = CASE 
    WHEN needReceipt IN ('true', '1', 'true', 'TRUE') THEN 'standard'
    WHEN needReceipt IN ('false', '0', 'false', 'FALSE', '') THEN NULL
    ELSE NULL
END;

-- 步驟 4: 刪除舊欄位
ALTER TABLE participationRecordDB DROP COLUMN needReceipt;

-- 步驟 5: 重命名新欄位
ALTER TABLE participationRecordDB 
RENAME COLUMN needReceipt_new TO needReceipt;

-- 步驟 6: 驗證資料
SELECT 
    needReceipt,
    COUNT(*) as count
FROM participationRecordDB
GROUP BY needReceipt;
```

#### 1.2 Directus 資料庫遷移

```json
{
  "field": "needReceipt",
  "type": "string",
  "meta": {
    "interface": "select-dropdown",
    "options": {
      "choices": [
        { "text": "不需要", "value": null },
        { "text": "感謝狀", "value": "standard" },
        { "text": "收據", "value": "stamp" }
      ]
    },
    "display": "labels",
    "display_options": {
      "choices": [
        { "text": "不需要", "value": null, "foreground": "#6B7280", "background": "#F3F4F6" },
        { "text": "感謝狀", "value": "standard", "foreground": "#059669", "background": "#D1FAE5" },
        { "text": "收據", "value": "stamp", "foreground": "#2563EB", "background": "#DBEAFE" }
      ]
    }
  },
  "schema": {
    "name": "needReceipt",
    "table": "participationRecordDB",
    "data_type": "varchar",
    "max_length": 255,
    "is_nullable": true,
    "default_value": null
  }
}
```

### 階段 2: 後端 Rust 代碼

#### 2.1 Model 層 (`rust-axum/src/models/participation_record.rs`)

```rust
// 修改前
pub need_receipt: Option<bool>,

// 修改後
pub need_receipt: Option<String>, // "standard" | "stamp" | null
```

#### 2.2 Handler 層 (`rust-axum/src/handlers/participation_record.rs`)

```rust
// 添加驗證函數
fn validate_need_receipt(value: &str) -> bool {
    matches!(value, "standard" | "stamp" | "")
}

// 在創建/更新時驗證
if let Some(need_receipt) = &payload.need_receipt {
    if !need_receipt.is_empty() && !validate_need_receipt(need_receipt) {
        return Err(/* 錯誤處理 */);
    }
}
```

### 階段 3: 前端代碼

#### 3.1 Store 層

**`client/src/stores/joinRecordStore.js`**

```javascript
// 修改前
needReceipt: false, // 需要收據

// 修改後
needReceipt: "", // 收據類型: "" | "standard" | "stamp"
```

**`client/src/stores/dashboardStore.js`**

```javascript
// 修改前
const needReceiptCount = computed(() => {
  return joinRecords.value.filter(
    (record) =>
      normalizeBool(record?.needReceipt) &&
      !normalizeBool(record?.receiptIssued),
  ).length;
});

// 修改後
const needReceiptCount = computed(() => {
  return joinRecords.value.filter(
    (record) =>
      (record?.needReceipt === "standard" || record?.needReceipt === "stamp") &&
      !normalizeBool(record?.receiptIssued),
  ).length;
});
```

#### 3.2 Service 層

**`client/src/services/joinRecordService.js`**

```javascript
// 修改前
needReceipt: false, // 需要收據

// 修改後
needReceipt: "", // 收據類型: "" | "standard" | "stamp"

// 更新收據資料時
const updateData = {
  needReceipt: record.activeTemplate, // "standard" 或 "stamp"
  receiptNumber: `${record.id}A${record.activityId}R${record.registrationId}`,
  receiptIssued: "true",
  // ...
};
```

#### 3.3 狀態控制台

**`client/src/views/JoinRecordStatesControl.vue`** (新增欄位)

需要在狀態控制台添加 `needReceipt` 欄位的管理。

#### 3.4 Mock 資料

**`client/src/data/mock_participation_records.json`**

```json
// 修改前
"needReceipt": "0",

// 修改後
"needReceipt": "",        // 不需要
"needReceipt": "standard", // 感謝狀
"needReceipt": "stamp",    // 收據
```

### 階段 4: 文檔更新

所有文檔需要更新 `needReceipt` 的定義說明。

## 向後兼容性處理

### 前端兼容層

創建一個輔助函數處理舊資料：

```javascript
// client/src/utils/receiptUtils.js
export const ReceiptUtils = {
  /**
   * 標準化 needReceipt 值
   * @param {any} value - 原始值
   * @returns {string} 標準化後的值: "" | "standard" | "stamp"
   */
  normalizeNeedReceipt(value) {
    // 處理舊的 boolean 值
    if (value === true || value === "true" || value === "1") {
      return "standard"; // 預設轉換為感謝狀
    }
    
    // 處理 false 值
    if (value === false || value === "false" || value === "0" || value === null || value === undefined) {
      return "";
    }
    
    // 處理新的字串值
    if (value === "standard" || value === "stamp") {
      return value;
    }
    
    // 預設返回空字串
    return "";
  },

  /**
   * 檢查是否需要收據
   * @param {string} value - needReceipt 值
   * @returns {boolean}
   */
  isNeedReceipt(value) {
    const normalized = this.normalizeNeedReceipt(value);
    return normalized === "standard" || normalized === "stamp";
  },

  /**
   * 獲取收據類型標籤
   * @param {string} value - needReceipt 值
   * @returns {string}
   */
  getReceiptTypeLabel(value) {
    const normalized = this.normalizeNeedReceipt(value);
    const labels = {
      "": "不需要",
      "standard": "感謝狀",
      "stamp": "收據"
    };
    return labels[normalized] || "不需要";
  }
};
```

### 後端兼容層

```rust
// rust-axum/src/utils/receipt_utils.rs
pub fn normalize_need_receipt(value: &str) -> String {
    match value {
        "true" | "1" | "TRUE" => "standard".to_string(),
        "false" | "0" | "FALSE" | "" => "".to_string(),
        "standard" | "stamp" => value.to_string(),
        _ => "".to_string(),
    }
}
```

## 遷移執行步驟

### 步驟 1: 準備階段（1 天）
1. ✅ 完整備份資料庫
2. ✅ 在測試環境執行遷移腳本
3. ✅ 驗證測試環境資料正確性

### 步驟 2: 代碼更新階段（2-3 天）
1. ✅ 創建 `receiptUtils.js` 輔助函數
2. ✅ 更新後端 Rust 代碼
3. ✅ 更新前端 Store 層
4. ✅ 更新前端 Service 層
5. ✅ 更新狀態控制台
6. ✅ 更新 Mock 資料
7. ✅ 更新所有文檔

### 步驟 3: 測試階段（2 天）
1. ✅ 單元測試
2. ✅ 整合測試
3. ✅ 向後兼容性測試（舊資料讀取）
4. ✅ UI 測試

### 步驟 4: 部署階段（1 天）
1. ✅ 維護模式公告
2. ✅ 資料庫備份
3. ✅ 執行資料庫遷移
4. ✅ 部署新代碼
5. ✅ 驗證生產環境
6. ✅ 監控錯誤日誌

### 步驟 5: 監控階段（1 週）
1. ✅ 監控錯誤日誌
2. ✅ 收集用戶反饋
3. ✅ 修復發現的問題

## 風險評估

### 高風險項目
1. **資料庫遷移失敗** - 風險等級: 🔴 高
   - 緩解措施: 完整備份 + 測試環境驗證
   
2. **舊資料無法正確讀取** - 風險等級: 🟡 中
   - 緩解措施: 向後兼容層 + 資料標準化

3. **前後端不同步** - 風險等級: 🟡 中
   - 緩解措施: 同時部署前後端

### 中風險項目
1. **UI 顯示錯誤** - 風險等級: 🟢 低
   - 緩解措施: 充分測試 + 快速修復

2. **文檔不一致** - 風險等級: 🟢 低
   - 緩解措施: 統一更新所有文檔

## 回滾計劃

如果遷移失敗，執行以下回滾步驟：

1. 停止服務
2. 恢復資料庫備份
3. 部署舊版本代碼
4. 重啟服務
5. 驗證系統正常

## 驗證清單

### 資料庫驗證
- [ ] 所有舊的 `true` 值已轉換為 `"standard"`
- [ ] 所有舊的 `false` 值已轉換為 `null` 或 `""`
- [ ] 沒有無效的值存在
- [ ] 資料總數與遷移前一致

### 功能驗證
- [ ] 創建新記錄時可以選擇收據類型
- [ ] 舊記錄可以正確顯示
- [ ] 狀態控制台可以修改收據類型
- [ ] 列印功能根據收據類型正確顯示
- [ ] 儀表板統計正確

### 性能驗證
- [ ] 查詢性能沒有明顯下降
- [ ] 更新操作正常
- [ ] 沒有記憶體洩漏

## 相關文件

- [參加記錄資料結構說明](./mock-participationRecords.md)
- [收據列印狀態實現](./dev-receipt-print-status-implementation.md)
- [收據列印狀態更新](./dev-receipt-print-status-update.md)

## 變更歷史

| 日期 | 版本 | 變更內容 | 負責人 |
|------|------|----------|--------|
| 2026-02-25 | 1.0 | 初始版本 | - |
