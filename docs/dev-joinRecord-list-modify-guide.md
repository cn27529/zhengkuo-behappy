# 參加記錄查詢功能調適指南

## 修改日期
2026-01-27

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

## 注意事項

1. **資料安全：** 刪除和列印功能目前未實作，避免誤操作
2. **效能考量：** 大量資料時考慮伺服器端分頁
3. **使用者體驗：** 手機版自動顯示全部資料，避免分頁操作複雜性
4. **錯誤處理：** 完善的載入狀態和錯誤提示機制

## 相關文件
- `client/src/stores/joinRecordQueryStore.js` - 查詢狀態管理
- `client/src/services/joinRecordService.js` - API 服務層
- `client/src/utils/dateUtils.js` - 日期格式化工具
