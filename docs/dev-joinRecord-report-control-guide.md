# 參加記錄報表控制台開發文檔

## 概述

參加記錄報表控制台 (`JoinRecordReportControl.vue`) 提供多條件查詢、欄位自訂、多格式匯出功能。

## 功能特性

### 1. 多條件查詢

- **日期區間**：篩選指定時間範圍的記錄
- **記錄狀態**：待處理、已確認、已完成
- **付款狀態**：未付款、已付款
- **收據狀態**：未開立、已開立
- **會計狀態**：待處理、已對帳
- **付款方式**：現金、銀行轉帳、信用卡

### 2. 欄位選擇

使用者可自訂匯出欄位：

- 記錄ID
- 登記ID
- 聯絡人
- 手機
- 總金額
- 記錄狀態
- 付款狀態
- 付款方式
- 收據狀態
- 會計狀態
- 建立時間

### 3. 匯出格式

- **CSV**：逗號分隔，支援 Excel 開啟（已實現）
- **TXT**：Tab 分隔，純文字格式（已實現）

## 架構設計

### 獨立 Store (`joinRecordReportStore.js`)

報表功能已從 `joinRecordQueryStore` 分離為獨立 store：

```javascript
// 報表狀態
reportFilters: {
  dateRange: [],
  activityIds: [],
  accountingStates: [],
  receiptIssued: [],
  paymentStates: [],
  states: [],
  paymentMethods: []
}

// 欄位配置
availableColumns: [...],
selectedColumns: [...]

// 核心方法
fetchReportData()  // 查詢報表數據
exportCSV()        // 匯出 CSV
exportTXT()        // 匯出 TXT
resetFilters()     // 重置過濾條件

// 引用 queryStore
stateConfigs: queryStore.stateConfigs  // 狀態配置
queryJoinRecordData()                  // 查詢方法
```

### 組件結構

```
JoinRecordReportControl.vue
├── 引用 joinRecordReportStore (獨立 store)
├── 查詢條件區 (el-card)
│   ├── 日期區間選擇器
│   ├── 狀態多選下拉
│   └── 查詢/重置按鈕
├── 欄位選擇區 (el-card)
│   └── 勾選框群組
├── 結果表格 (el-card)
│   └── 動態欄位表格
└── 匯出按鈕
```

### Store 職責分離

- **joinRecordQueryStore** - 查詢、狀態控制
- **joinRecordReportStore** - 報表、匯出（本功能）

## 使用流程

### 1. 引入 Store

```javascript
import { useJoinRecordReportStore } from "@/stores/joinRecordReportStore";

const store = useJoinRecordReportStore();
```

### 2. 設定查詢條件

```javascript
// 選擇日期區間
store.reportFilters.dateRange = [startDate, endDate];

// 選擇狀態（多選）
store.reportFilters.states = ["confirmed", "completed"];
store.reportFilters.paymentStates = ["paid"];
```

### 3. 執行查詢

```javascript
const result = await store.fetchReportData();
// result.data 包含過濾後的記錄
```

### 4. 選擇欄位

```javascript
// 預設選擇 default: true 的欄位
store.selectedColumns = ["id", "contactName", "totalAmount"];
```

### 5. 匯出數據

```javascript
// CSV 格式
store.exportCSV();

// TXT 格式
store.exportTXT();
```

### 6. 重置條件

```javascript
// 使用內建方法重置所有過濾條件
store.resetFilters();
```

## 過濾邏輯

### 日期過濾

```javascript
if (reportFilters.value.dateRange?.length === 2) {
  const [start, end] = reportFilters.value.dateRange;
  filtered = filtered.filter((r) => {
    const date = new Date(r.createdAt);
    return date >= start && date <= end;
  });
}
```

### 狀態過濾

```javascript
// 多選狀態過濾
if (reportFilters.value.paymentStates?.length) {
  filtered = filtered.filter((r) =>
    reportFilters.value.paymentStates.includes(r.paymentState),
  );
}
```

## 數據轉換

### 欄位映射

```javascript
const extractValue = (record, key) => {
  const map = {
    contactName: record.contact?.name || "",
    contactMobile: record.contact?.mobile || "",
    totalAmount: record.totalAmount || 0,
    receiptIssued: record.receiptIssued ? "已開立" : "未開立",
    createdAt: new Date(record.createdAt).toLocaleString("zh-TW"),
  };
  return map[key] ?? record[key] ?? "";
};
```

### CSV 格式化

```javascript
// 處理包含逗號的欄位
const val = extractValue(record, key);
return typeof val === "string" && val.includes(",") ? `"${val}"` : val;
```

## 路由配置

### 路由定義 (`router/index.js`)

```javascript
{
  path: "/report-control",
  title: "參加記錄報表",
  name: "JoinRecordReportControl",
  component: () => import("../views/JoinRecordReportControl.vue"),
  meta: { requiresAuth: true },
}
```

### 菜單配置 (`stores/menu.js`)

```javascript
{
  id: 12,
  name: "參加記錄報表",
  path: "/report-control",
  icon: "📊",
  component: "JoinRecordReportControl",
  requiredAuth: true,
  order: 12,
  enabled: true,
  publish: true,
}
```

## 檔案下載

### 下載實作

```javascript
const downloadFile = (content, filename, type) => {
  // UTF-8 BOM 確保中文正確顯示
  const blob = new Blob(["\ufeff" + content], {
    type: `${type};charset=utf-8;`,
  });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};
```

### 檔名格式

- CSV: `report_1739612345678.csv`
- TXT: `report_1739612345678.txt`

## 擴展建議

以下為未來可能的功能擴展方向：

### 1. 新增活動過濾

```javascript
// Store 中已預留 activityIds
if (reportFilters.value.activityIds?.length) {
  filtered = filtered.filter((r) =>
    reportFilters.value.activityIds.includes(r.activityId),
  );
}
```

### 2. 新增登記表過濾

```javascript
// 在 reportFilters 中新增
formIds: [];

// 過濾邏輯
if (reportFilters.value.formIds?.length) {
  filtered = filtered.filter((r) =>
    reportFilters.value.formIds.includes(r.formId),
  );
}
```

### 3. 新增統計資訊

```javascript
const reportStats = computed(() => ({
  totalRecords: reportData.value.length,
  totalAmount: reportData.value.reduce((sum, r) => sum + r.totalAmount, 0),
  paidCount: reportData.value.filter((r) => r.paymentState === "paid").length,
}));
```

### 4. 新增 Excel 匯出（未實現）

如需原生 Excel 格式，可使用 `xlsx` 套件：

```javascript
// 需先安裝: npm install xlsx
import * as XLSX from "xlsx";

const exportExcel = () => {
  const ws = XLSX.utils.json_to_sheet(reportData.value);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "報表");
  XLSX.writeFile(wb, `report_${Date.now()}.xlsx`);
};
```

> 注意：目前 CSV 格式已可被 Excel 正常開啟，是否需要原生 Excel 格式可視需求決定。

## 注意事項

1. **Store 分離**：報表功能已獨立為 `joinRecordReportStore`，不影響原有查詢功能
2. **UTF-8 BOM**：匯出時加入 `\ufeff` 確保 Excel 正確識別中文
3. **逗號處理**：CSV 中包含逗號的欄位需用雙引號包裹
4. **日期格式**：使用 `toLocaleString('zh-TW')` 顯示本地化時間
5. **記憶體釋放**：下載後呼叫 `URL.revokeObjectURL()` 釋放資源
6. **空值處理**：使用 `??` 和 `||` 處理 null/undefined

## 測試建議

### 功能測試

```javascript
// 1. 測試空查詢
await store.fetchReportData();

// 2. 測試日期過濾
store.reportFilters.dateRange = [
  new Date("2026-01-01"),
  new Date("2026-12-31"),
];
await store.fetchReportData();

// 3. 測試多狀態過濾
store.reportFilters.states = ["confirmed", "completed"];
store.reportFilters.paymentStates = ["paid"];
await store.fetchReportData();

// 4. 測試匯出
store.exportCSV();
store.exportTXT();
```

### 邊界測試

- 無數據時匯出
- 單筆數據匯出
- 大量數據匯出（1000+ 筆）
- 特殊字符處理（逗號、換行、引號）

## 相關文件

- [參加記錄查詢文檔](./dev-joinRecord-list-guide.md)
- [狀態控制台文檔](./dev-joinRecord-states-control-guide.md)

## 檔案清單

- `client/src/stores/joinRecordReportStore.js` - 報表 Store
- `client/src/views/JoinRecordReportControl.vue` - 報表控制台組件
- `client/src/router/index.js` - 路由配置
- `client/src/stores/menu.js` - 菜單配置
