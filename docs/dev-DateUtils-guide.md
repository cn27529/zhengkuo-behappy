# DateUtils 日期時間工具函數說明文檔

## 概述說明

`DateUtils` 提供統一的日期時間處理接口，自動處理 UTC 時間與本地時區轉換。

**位置：** `client/src/utils/dateUtils.js`

## 配置

```javascript
const DEFAULT_CONFIG = {
  timeZone: "Asia/Taipei", // 可透過 VITE_APP_TIMEZONE 環境變數設定
  locale: "zh-TW", // 可透過 VITE_APP_LOCALE 環境變數設定
  hour12: false, // 可透過 VITE_APP_HOUR12 環境變數設定
};
```

## API 參考

### 時間戳與 ISO 格式

#### `getCurrentTimestamp(date?)`

獲取時間戳記（毫秒）

```javascript
getCurrentTimestamp(); // 當前時間戳
getCurrentTimestamp("2026-02-26T06:36:28.000Z"); // 轉換 ISO 字串為時間戳
```

#### `getCurrentISOTime()`

獲取當前時間的 ISO 格式字串

```javascript
getCurrentISOTime(); // "2026-03-05T10:22:32.956Z"
```

### 格式化函數

#### `formatFullTime(dateString)`

格式化完整時間（含秒）

```javascript
formatFullTime("2026-03-05T10:22:32.956Z"); // "2026/03/05 18:22:32"
```

#### `formatDateTime(dateString)`

格式化日期時間（不含秒）

```javascript
formatDateTime("2026-03-05T10:22:32.956Z"); // "2026/03/05 18:22"
```

#### `formatDate(dateString)`

格式化日期

```javascript
formatDate("2026-03-05T10:22:32.956Z"); // "2026/03/05"
```

#### `formatDateLong(dateString)`

格式化日期時間（長格式）

```javascript
formatDateLong("2026-03-05T10:22:32.956Z"); // "2026/03/05 18:22"
```

#### `formatTime(dateString)`

格式化時間

```javascript
formatTime("2026-03-05T10:22:32.956Z"); // "18:22:32"
```

#### `formatDateYMD(date)`

格式化日期為 YYYY-MM-DD

```javascript
formatDateYMD(new Date()); // "2026-03-05"
```

#### `formatDateTimeYMD(date)`

格式化日期時間為 YYYY-MM-DD HH:mm

```javascript
formatDateTimeYMD(new Date()); // "2026-03-05 18:22"
```

#### `formatRelativeOrDateTime(dateString, daysThreshold?)`

智能相對時間顯示

**參數：**

- `dateString`: UTC 格式日期字串
- `daysThreshold`: 天數閾值（預設 3 天）

**顯示規則：**

- 1小時內：顯示 "剛剛"
- 1天內：顯示 "10小時前"
- 1-3天內：顯示 "2天前"
- 超過3天：顯示完整日期時間

```javascript
formatRelativeOrDateTime("2026-03-05T08:00:00.000Z"); // "10小時前"
formatRelativeOrDateTime("2026-03-03T10:00:00.000Z"); // "2天前"
formatRelativeOrDateTime("2026-03-01T10:00:00.000Z"); // "2026/03/01 18:00"
formatRelativeOrDateTime("2026-03-04T10:00:00.000Z", 5); // "1天前" (自訂閾值為5天)
```

### 日期計算

#### `getOneYearAgo()`

計算一年前的日期

```javascript
getOneYearAgo(); // Date 物件
```

#### `getMonthsAgo(months)`

計算 N 個月前的日期

```javascript
getMonthsAgo(3); // 3個月前的 Date 物件
```

#### `getDaysAgo(days)`

計算 N 天前的日期

```javascript
getDaysAgo(7); // 7天前的 Date 物件
```

### 日期驗證

#### `isValidDate(dateString)`

檢查日期是否有效

```javascript
isValidDate("2026-03-05"); // true
isValidDate("invalid"); // false
```

#### `isWithinMonths(dateString, months?)`

檢查日期是否在指定月份範圍內

```javascript
isWithinMonths("2026-01-01", 12); // true (預設 12 個月)
```

#### `isWithinDays(dateString, days?)`

檢查日期是否在指定天數範圍內

```javascript
isWithinDays("2026-03-01", 30); // true (預設 30 天)
```

## 使用範例

### 在 Vue 組件中使用

```vue
<script setup>
import { DateUtils } from "@/utils/dateUtils.js";

const formatDateTime = (value) => DateUtils.formatDateTime(value);
const formatRelativeOrDateTime = (value) =>
  DateUtils.formatRelativeOrDateTime(value);
</script>

<template>
  <div>
    <p>建立時間：{{ formatDateTime(record.createdAt) }}</p>
    <p>最後更新：{{ formatRelativeOrDateTime(record.updatedAt) }}</p>
  </div>
</template>
```

### 在 Store 中使用

```javascript
import { DateUtils } from "@/utils/dateUtils.js";

export const useMyStore = defineStore("myStore", {
  actions: {
    filterRecentRecords() {
      return this.records.filter((record) =>
        DateUtils.isWithinDays(record.createdAt, 7),
      );
    },
  },
});
```

## 注意事項

1. **時區轉換**：所有格式化函數自動將 UTC 時間轉換為本地時區
2. **空值處理**：傳入空值時返回 `"-"`
3. **錯誤處理**：格式化失敗時返回原始字串
4. **不可變性**：`DateUtils` 物件使用 `Object.freeze()` 確保不可變

## 更新日誌

- **2026-03-05**: 新增 `formatRelativeOrDateTime` 智能相對時間顯示功能
