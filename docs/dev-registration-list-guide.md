# 祈福登記查詢列表功能開發指南

> **最後更新**: 2026-02-27  
> **文件路徑**: `client/src/views/RegistrationList.vue`

## 概述說明

祈福登記查詢列表頁面提供已提交的消災超度報名資料查詢功能，支援關鍵字搜尋、分頁顯示、查看詳情、編輯表單等操作。

## 核心功能

### 1. 查詢功能

- **關鍵字搜尋**: 支援姓名、手機、電話、地址的模糊搜尋
- **即時查詢**: Enter 鍵快速查詢
- **清空功能**: 一鍵清空查詢條件和結果
- **全部查詢**: 不輸入條件直接查詢所有資料

### 2. 列表顯示

- **表格展示**: 使用 Element Plus Table 組件
- **排序功能**: 支援按建立時間排序（預設降序）
- **響應式設計**: 桌面版完整顯示，手機版自適應
- **載入狀態**: 查詢時顯示 Loading 動畫

### 3. 操作功能

- **查看詳情** (👁️): 跳轉到打印預覽頁面
- **編輯表單** (📝): 跳轉到編輯頁面
- **卡片設計** (💳): 跳轉到卡片設計頁面（預留功能）
- **新增登記**: 快速跳轉到祈福登記表單

### 4. 分頁控制

- **桌面版**: 完整分頁控制器（總數、每頁筆數、頁碼、跳轉）
- **手機版**: 顯示全部資料不分頁
- **可調整每頁筆數**: 10/20/50/100 筆

## 技術架構

### Store 整合

使用 Pinia Store 管理查詢狀態：

```javascript
import { useQueryStore } from "../stores/registrationQueryStore.js";
import { usePageStateStore } from "../stores/pageStateStore.js";

const queryStore = useQueryStore();
const pageStateStore = usePageStateStore();

// 使用 storeToRefs 保持響應性
const {
  searchResults,
  searchQuery,
  isLoading,
  hasSearched,
  currentPage,
  pageSize,
} = storeToRefs(queryStore);
```

### 查詢邏輯

```javascript
const handleSearch = async () => {
  queryStore.resetPagination();

  const query = searchQuery.value ? searchQuery.value.trim() : "";

  try {
    const queryData = { query: query };
    const result = await queryStore.queryRegistrationData(queryData);

    if (result.success) {
      if (!result.data || result.data.length === 0) {
        ElMessage.info("查無符合條件的資料");
      } else {
        ElMessage.success(`找到 ${result.data.length} 筆資料`);
      }
    } else {
      ElMessage.error(result.message || "查詢失敗");
    }
  } catch (error) {
    console.error("查詢錯誤:", error);
    ElMessage.error("查詢過程中發生錯誤");
  }
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

const isMobile = computed(() => {
  return queryStore.isMobile();
});
```

## 操作功能實現

### 1. 編輯表單

```javascript
const handleEdit = async (item) => {
  try {
    if (!item.formId) {
      throw new Error("表單ID不存在");
    }

    // 儲存頁面狀態
    await pageStateStore.setPageState("registration", {
      action: "edit",
      formId: item.formId,
      id: item.id,
      source: "list",
    });

    router.push("/registration-edit");
  } catch (error) {
    console.error("編輯操作失敗:", error);
    ElMessage.error("編輯操作失敗，請重試");
  }
};
```

### 2. 查看詳情（打印預覽）

```javascript
const handlePrint = (item) => {
  try {
    const formId = item.formId;
    const printData = JSON.stringify(item);

    const printId = `print_registration_${formId}_${Math.floor(Math.random() * 1000)}`;

    // 存儲到 sessionStorage
    sessionStorage.setItem(printId, printData);

    router.push({
      path: "/registration-print",
      query: {
        print_id: printId,
        print_data: printData,
      },
    });
  } catch (error) {
    console.error("導航到列印頁面失敗:", error);
    ElMessage.error("導航到列印頁面失敗");
  }
};
```

### 3. 卡片設計（預留功能）

```javascript
const handleCardDesign = (item) => {
  try {
    if (!item.formId) {
      throw new Error("表單ID不存在");
    }

    // 儲存頁面狀態
    await pageStateStore.setPageState("registration", {
      action: "edit",
      formId: item.formId,
      id: item.id,
      source: "list",
    });

    router.push("/card-design");
  } catch (error) {
    console.error("卡片設計操作失敗:", error);
    ElMessage.error("卡片設計操作失敗，請重試");
  }
};
```

## 表格欄位說明

| 欄位     | 說明                           | 寬度  | 對齊     |
| -------- | ------------------------------ | ----- | -------- |
| 圖標     | 顯示 👤 圖標和 ID tooltip      | 50px  | 居中     |
| 聯絡人   | 聯絡人姓名                     | 100px | 居中     |
| 手機     | 手機號碼                       | 120px | 左對齊   |
| 電話     | 家用電話                       | 120px | 左對齊   |
| 關係     | 與登記人關係（含其他關係說明） | 100px | 左對齊   |
| 建立時間 | 記錄建立時間（可排序）         | 150px | 左對齊   |
| 操作     | 查看/編輯/卡片設計按鈕         | 200px | 居中固定 |

## 狀態顯示

### 載入狀態

```vue
<div class="loading-state" v-if="isLoading && !searchResults.length">
  <el-result icon="info" title="搜尋中">
    <template #extra>
      <el-button type="primary" :loading="true">載入中</el-button>
    </template>
  </el-result>
</div>
```

### 無結果提示

```vue
<div class="no-results" v-else-if="hasSearched && searchResults.length === 0">
  <el-empty description="查無符合條件的資料">
    <template #image>
      <div class="empty-icon">🔍</div>
    </template>
    <template #description>
      <div class="empty-content">
        <p class="empty-hint">請嘗試:</p>
        <ul class="empty-suggestions">
          <li>檢查關鍵字是否拼寫正確</li>
          <li>使用更簡單的關鍵字</li>
          <li>嘗試搜尋部分姓名或地址</li>
        </ul>
      </div>
    </template>
    <el-button type="primary" @click="handleClear">重新搜尋</el-button>
  </el-empty>
</div>
```

### 初始狀態

```vue
<div class="initial-state" v-else-if="!hasSearched">
  <el-empty description="請輸入查詢條件開始搜尋">
    <el-button type="primary" @click="handleSearch">查詢所有資料</el-button>
  </el-empty>
</div>
```

## 工具函數

### 日期格式化

```javascript
import { DateUtils } from "../utils/dateUtils.js";

const formatDateLong = (dateString) => {
  return DateUtils.formatDateLong(dateString);
};
```

### 地址截斷（未使用）

```javascript
const truncateAddress = (address) => {
  if (!address) return "-";
  return address.length > 10 ? address.substring(0, 10) + "..." : address;
};
```

## 調試功能

開發模式下顯示調試面板：

```vue
<div v-if="isDev" class="debug-panel">
  <h4>🔧 調試信息</h4>
  <hr />
  <div>searchResults.length: {{ searchResults.length }}</div>
  <div>paginatedResults.length: {{ paginatedResults.length }}</div>
  <div>hasSearched: {{ hasSearched }}</div>
  <div>isLoading: {{ isLoading }}</div>
  <div>currentPage: {{ currentPage }}</div>
  <div>pageSize: {{ pageSize }}</div>
  <div>isMoile: {{ isMobile }}</div>
</div>
```

啟用方式：

```javascript
import { authService } from "../services/authService";

onMounted(() => {
  isDev.value = authService.getCurrentDev();
});
```

## 樣式設計

### 響應式佈局

```css
/* 桌面版 */
.search-input-group .el-input {
  flex: 1;
}

.pagination {
  display: flex;
  justify-content: center;
  padding: 1.5rem 0;
}

/* 手機版 */
@media (max-width: 768px) {
  .results-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .search-input-group .el-button {
    width: 100%;
  }

  :deep(.el-table) {
    font-size: 0.875rem;
  }

  :deep(.el-table__cell) {
    padding: 8px 4px;
  }
}

/* 極小螢幕 */
@media (max-width: 480px) {
  :deep(.el-table) {
    font-size: 0.75rem;
  }

  :deep(.el-pagination__sizes),
  :deep(.el-pagination__jump) {
    display: none;
  }
}
```

### 空狀態樣式

```css
.loading-state,
.no-results,
.initial-state {
  background: white;
  padding: 3rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-suggestions {
  text-align: left;
  max-width: 300px;
  margin: 1rem auto;
  list-style: none;
  padding: 0;
}

.empty-suggestions li::before {
  content: "• ";
  color: var(--el-color-primary);
  font-weight: bold;
  margin-right: 0.5rem;
}
```

## 生命週期

```javascript
onMounted(() => {
  console.log("✅ RegistrationList 組件已載入");

  // 清除頁面狀態
  pageStateStore.clearPageState("registration");

  // 啟用調試模式
  isDev.value = authService.getCurrentDev();
});
```

## 數據流程

```
用戶輸入查詢條件
  ↓
點擊查詢按鈕 / Enter 鍵
  ↓
handleSearch() 調用 queryStore.queryRegistrationData()
  ↓
Store 發送 API 請求
  ↓
更新 searchResults 狀態
  ↓
paginatedResults 計算屬性自動更新
  ↓
表格顯示查詢結果
  ↓
用戶點擊操作按鈕
  ↓
handleEdit() / handlePrint() / handleCardDesign()
  ↓
保存狀態到 pageStateStore / sessionStorage
  ↓
路由跳轉到目標頁面
```

## 常見問題

### Q1: 為什麼手機版不分頁？

**A**: 手機螢幕較小，分頁控制器操作不便，直接顯示全部資料提供更好的滾動體驗。

### Q2: 如何自定義每頁顯示筆數？

**A**: 修改 `page-sizes` 屬性：

```vue
<el-pagination :page-sizes="[10, 20, 50, 100]" ... />
```

### Q3: 查詢結果如何持久化？

**A**: 查詢結果存儲在 Pinia Store 中，頁面刷新後會丟失。如需持久化，可在 Store 中添加 localStorage 支援。

### Q4: 如何添加更多操作按鈕？

**A**: 在操作欄位的 template 中添加：

```vue
<el-tooltip content="新操作" placement="top">
  <el-button circle @click="handleNewAction(row)">
    🆕
  </el-button>
</el-tooltip>
```

## 技術亮點

1. **響應式狀態管理**: 使用 `storeToRefs` 保持 Pinia Store 響應性
2. **智能分頁**: 根據設備類型自動切換分頁模式
3. **錯誤處理**: 完善的 try-catch 和用戶提示
4. **數據傳遞**: sessionStorage + URL 參數雙重保障
5. **調試友好**: 開發模式下顯示詳細調試信息
6. **用戶體驗**: 多種空狀態提示和操作引導

## 相關文件

- [祈福登記打印功能](./dev-registration-print-guide.md)
- [祈福登記表單功能](./dev-registration-guide.md)
- [查詢 Store 說明](./dev-registration-query-store-guide.md)

## 未來優化

- [ ] 添加高級篩選（日期範圍、狀態篩選）
- [ ] 支援批量操作（批量刪除、批量匯出）
- [ ] 添加匯出功能（Excel、PDF）
- [ ] 支援自定義欄位顯示
- [ ] 添加收藏/標記功能
- [ ] 支援拖拽排序
- [ ] 添加快速預覽（Drawer/Modal）
