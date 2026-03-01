# 活動參加記錄查詢功能開發指南

## 修改日期
2026-01-27

## 概述

本功能實現了"活動參加記錄查詢"，允許用戶查詢和管理已提交的活動參加記錄。

## 功能概述
`JoinRecordList.vue` 是參加記錄的查詢列表頁面，提供搜尋、篩選和分頁功能。

## 主要功能特點

### 1. 查詢功能
- **關鍵字搜尋：** 支援姓名、手機、電話、地址、關係、參加項目的模糊搜尋
- **狀態篩選：** 可依據記錄狀態（已確認、待處理、已取消）進行篩選
- **項目類型篩選：** 可依據參加項目類型進行篩選

### 2. 顯示內容
- **基本資訊：** 記錄ID、登記ID、聯絡人資訊
- **狀態標籤：** 使用不同顏色標籤顯示記錄狀態
- **參加項目詳情：** 顯示項目名稱、數量、金額、參加者、地址
- **總金額：** 顯示記錄總金額
- **建立時間：** 顯示記錄建立時間

### 3. 響應式設計
- **桌面版：** 完整表格顯示，支援分頁
- **手機版：** 適配小螢幕，顯示全部資料不分頁

## 新增檔案

### 1. JoinRecordList.vue

- **路徑**: `client/src/views/JoinRecordList.vue`
- **功能**: 活動參加記錄查詢頁面
- **特色**:
  - 支援多條件查詢（狀態、項目類型、關鍵字）
  - 響應式設計，支援手機和桌面設備
  - 分頁功能（桌面版）
  - 調試信息顯示（開發模式）
  - 列印和刪除操作（預留接口）

### 2. joinRecordQueryStore.js

- **路徑**: `client/src/stores/joinRecordQueryStore.js`
- **功能**: 參加記錄查詢的 Pinia store
- **特色**:
  - 支援 Mock 和 Directus 模式
  - 智能過濾邏輯
  - 分頁狀態管理
  - 響應式狀態更新

## 修改檔案

### 1. 路由配置

- **檔案**: `client/src/router/index.js`
- **新增路由**: `/join-record-list`
- **包含**: 路由守衛和頁面狀態清理

### 2. 選單配置

- **檔案**: `client/src/stores/menu.js`
- **新增選單項**: "參加記錄查詢"
- **圖標**: 🔍
- **順序**: 10

## 技術架構

### Store 整合
使用 `useJoinRecordQueryStore` 管理查詢狀態：
```javascript
const {
  searchResults,
  searchQuery,
  isLoading,
  hasSearched,
  currentPage,
  pageSize,
  stateFilter,
  itemsFilter,
  stateOptions,
  itemTypeOptions,
} = storeToRefs(queryStore);
```

### 查詢邏輯
```javascript
const handleSearch = async () => {
  queryStore.resetPagination();
  
  const queryData = {
    query: searchQuery.value?.trim() || "",
    state: stateFilter.value?.trim() || "",
    items: itemsFilter.value?.trim() || "",
  };
  
  const result = await queryStore.queryJoinRecordData(queryData);
  // 處理查詢結果...
};
```

### 分頁處理
```javascript
const paginatedResults = computed(() => {
  if (!Array.isArray(searchResults.value) || searchResults.value.length === 0) {
    return [];
  }
  
  // 手機設備返回所有結果不分頁
  if (isMobile.value) {
    return searchResults.value;
  }
  
  // 桌面設備分頁處理
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return searchResults.value.slice(start, end);
});
```

## 查詢功能

### 查詢條件

1. **通用搜尋**: 支援登記ID、姓名、項目等關鍵字搜尋
2. **狀態篩選**:
   - 全部狀態
   - 已確認 (confirmed)
   - 待處理 (pending)
   - 已取消 (cancelled)
3. **項目類型篩選**:
   - 全部項目
   - 超度/超薦 (chaodu)
   - 點燈 (diandeng)
   - 消災祈福 (qifu)
   - 固定消災 (xiaozai)
   - 陽上人 (survivors)
   - 中元普度 (pudu)

### 過濾邏輯

- **狀態過濾**: 精確匹配記錄的 `state` 欄位
- **項目過濾**: 檢查 `items` 陣列中的 `type` 欄位
- **關鍵字搜尋**: 模糊匹配以下欄位：
  - registrationId
  - items[].label
  - items[].sourceData[].name
  - items[].sourceData[].surname
  - notes
- **陽上人過濾**: 自動過濾掉 `label` 為 "陽上人" 的項目（因為 `price` 為 0）

## 資料結構

### 參加記錄格式

```json
{
  "id": 4,
  "registrationId": 199,
  "activityId": -1,
  "state": "confirmed",
  "items": [
    {
      "type": "diandeng",
      "label": "點燈",
      "price": 600,
      "quantity": 2,
      "subtotal": 1200,
      "source": "blessing.persons",
      "sourceData": [...]
    }
  ],
  "totalAmount": 1400,
  "finalAmount": 1400,
  "createdAt": "2026-01-24T06:09:42.037Z"
}
```

## 資料顯示邏輯

### 聯絡人資訊顯示
```javascript
// 模板中的聯絡人資訊顯示
<div class="contact-info">
  <div class="contact-name">
    <strong>{{ row.contact?.name || "-" }}</strong>
  </div>
  <div class="contact-phone" v-if="row.contact?.mobile || row.contact?.phone">
    {{ row.contact?.mobile || row.contact?.phone }}
  </div>
  <div class="contact-relationship" v-if="row.contact?.relationship">
    {{ row.contact?.relationship }}
    <span v-if="row.contact?.otherRelationship" class="other-relationship">
      ({{ row.contact.otherRelationship }})
    </span>
  </div>
</div>
```

### 參加項目顯示
```javascript
// 參加項目列表顯示
<div class="items-list">
  <div v-for="(item, index) in row.items" :key="index" class="item-tag">
    <div class="item-header">
      <span class="item-label">{{ item.label }}</span>
      <span class="item-quantity">x{{ item.quantity }}</span>
      <span class="item-amount">NT${{ item.subtotal }}</span>
    </div>
    <div class="item-address" v-if="item.sourceAddress">
      <span class="address-label">地址：</span>
      <span class="address-text">{{ item.sourceAddress }}</span>
    </div>
    <div class="item-participants" v-if="item.sourceData && item.sourceData.length > 0">
      <span class="participants-label">參加者：</span>
      <span class="participants-list">
        {{ getParticipantNames(item.sourceData).join("、") }}
      </span>
    </div>
  </div>
</div>
```

### 狀態標籤處理
```javascript
const getStateText = (state) => {
  const statusMap = {
    confirmed: "已確認",
    pending: "待處理",
    cancelled: "已取消",
  };
  return statusMap[state] || state;
};

const getStateTagType = (state) => {
  const typeMap = {
    confirmed: "success",
    pending: "warning",
    cancelled: "danger",
  };
  return typeMap[state] || "info";
};
```

## 樣式設計

### 響應式表格
- 使用 Element Plus 的 `el-table` 組件
- 設定最小寬度確保內容完整顯示
- 手機版調整字體大小和間距

### 項目標籤樣式
```css
.item-tag {
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}
```

### 手機版優化
```css
@media (max-width: 768px) {
  .search-input-group {
    flex-direction: column;
  }
  
  .items-list {
    max-width: 200px;
  }
  
  .item-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
```

## 響應式設計

### 桌面版

- 完整的表格顯示
- 分頁控制器
- 多欄位顯示

### 手機版

- 簡化的表格顯示
- 無分頁（顯示全部）
- 優化的觸控操作

## 調試功能

開發模式下顯示調試信息：

- searchResults.length
- paginatedResults.length
- hasSearched
- isLoading
- currentPage / pageSize
- isMobile
- stateFilter / itemsFilter

## 預留功能

### 列印功能

- 按鈕已預留
- 目前顯示提示信息
- 可在後續階段實現

### 刪除功能

- 按鈕已預留
- 包含確認對話框
- 目前顯示提示信息
- 可在後續階段實現

## 調試功能

開發模式下顯示調試信息：

- searchResults.length
- paginatedResults.length
- hasSearched
- isLoading
- currentPage / pageSize
- isMobile
- stateFilter / itemsFilter

## 預留功能

### 列印功能

- 按鈕已預留
- 目前顯示提示信息
- 可在後續階段實現

### 刪除功能

- 按鈕已預留
- 包含確認對話框
- 目前顯示提示信息
- 可在後續階段實現

## 功能擴展建議

### 1. 匯出功能
可考慮添加 Excel 或 PDF 匯出功能：
```javascript
const handleExport = () => {
  // 實現匯出邏輯
  ElMessage.info("匯出功能開發中");
};
```

### 2. 進階篩選
可添加日期範圍、金額範圍等篩選條件：
```javascript
const dateRange = ref([]);
const amountRange = ref([]);
```

### 3. 批量操作
可添加批量刪除、批量狀態更新等功能：
```javascript
const selectedRows = ref([]);
const handleBatchDelete = () => {
  // 批量刪除邏輯
};
```

## 使用方式

1. **訪問頁面**: 導航到 "參加記錄查詢" 選單項
2. **設定查詢條件**:
   - 輸入關鍵字（可選）
   - 選擇狀態篩選（可選）
   - 選擇項目類型篩選（可選）
3. **執行查詢**: 點擊 "查詢" 按鈕
4. **查看結果**: 瀏覽查詢結果列表
5. **分頁導航**: 使用分頁控制器（桌面版）

## 技術特色

### storeToRefs 使用

- 正確使用 `storeToRefs` 保持響應性
- 避免解構賦值導致的響應性丟失

### 分頁實現

- 桌面版：完整分頁功能
- 手機版：顯示全部資料
- 智能設備檢測

### 錯誤處理

- 完善的錯誤提示
- 載入狀態顯示
- 空結果處理

### 性能優化

- 計算屬性緩存
- 條件渲染
- 智能過濾

## 技術特色

### storeToRefs 使用

- 正確使用 `storeToRefs` 保持響應性
- 避免解構賦值導致的響應性丟失

### 分頁實現

- 桌面版：完整分頁功能
- 手機版：顯示全部資料
- 智能設備檢測

### 錯誤處理

- 完善的錯誤提示
- 載入狀態顯示
- 空結果處理

### 性能優化

- 計算屬性緩存
- 條件渲染
- 智能過濾

## 注意事項

1. **資料安全：** 刪除和列印功能目前未實作，避免誤操作
2. **效能考量：** 大量資料時考慮伺服器端分頁
3. **使用者體驗：** 手機版自動顯示全部資料，避免分頁操作複雜性
4. **錯誤處理：** 完善的載入狀態和錯誤提示機制

## 後續開發建議

1. **實現列印功能**: 整合現有的列印模組
2. **實現刪除功能**: 添加後端 API 調用
3. **添加匯出功能**: Excel/PDF 匯出
4. **優化搜尋**: 添加高級搜尋選項
5. **添加統計**: 顯示金額統計和數量統計

## 測試建議

1. **功能測試**: 測試各種查詢條件組合
2. **響應式測試**: 在不同設備尺寸下測試
3. **性能測試**: 測試大量資料的載入和過濾
4. **錯誤測試**: 測試網路錯誤和資料錯誤情況

## 相關文件
- `client/src/stores/joinRecordQueryStore.js` - 查詢狀態管理
- `client/src/services/joinRecordService.js` - API 服務層
- `client/src/utils/dateUtils.js` - 日期格式化工具
