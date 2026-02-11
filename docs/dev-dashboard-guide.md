# Dashboard 開發指南

## 概述

本系統提供三個版本的 Dashboard 頁面，分別針對不同的展示需求設計。

## Dashboard 版本比較

### Dashboard.vue（原版）
**定位：** 活動統計儀表板

**展示內容：**
- 總參與人次（動畫數字）
- 即將到來的活動（2筆）
- 已完成的活動（2筆）
- 活動狀態統計卡片

**適用場景：**
- 活動管理人員查看活動概況
- 關注參與人數和活動進度

**數據來源：**
- `activityStore.js`

---

### Dashboard3.vue（新版）
**定位：** 系統綜合資訊牆

**展示內容：**

#### 財務概覽
- 本月收入（已付款總額）
- 待收款項（未付款/部分付款金額與筆數）
- 已沖帳（完成會計處理的總額）
- 待處理（待沖帳記錄數）

#### 業務統計
- 本月登記（新增祈福登記表數量）
- 消災人數（本月消災人員總數）
- 超度人數（本月祖先超度總數）
- 待開收據（需要開立收據的記錄數）

#### 動態信息
- 即將到來的活動（最近3場）
- 最新登記記錄（最近5筆）
- 最新參加記錄（最近5筆，含付款狀態）

**適用場景：**
- 管理人員全面掌握系統運作狀況
- 快速發現待處理事項
- 財務與業務數據一目了然

**數據來源：**
- `dashboardStore3.js`（匯總 registrations、joinRecords、activities）

---

## 技術架構

### Dashboard.vue
```javascript
// Store
import { useActivityStore } from "../stores/activityStore.js";

// 主要 Computed
- totalParticipants: 總參與人次
- upcomingActivities: 即將到來的活動
- completedActivities: 已完成的活動
- upcomingCardActivities: 卡片顯示的即將到來活動（2筆）
- completedCardActivities: 卡片顯示的已完成活動（2筆）
```

### Dashboard3.vue
```javascript
// Store
import { useDashboardStore3 } from "../stores/dashboardStore3.js";

// 主要 Computed（財務）
- monthlyIncome: 本月收入
- pendingPayments: 待收款項
- pendingPaymentCount: 待收款記錄數
- reconciledAmount: 已沖帳金額
- pendingAccountingCount: 待沖帳數

// 主要 Computed（業務）
- monthlyRegistrations: 本月登記數
- monthlyBlessingCount: 消災人數
- monthlySalvationCount: 超度人數
- pendingReceiptCount: 待開收據數

// 主要 Computed（動態）
- upcomingActivities: 即將到來的活動（3筆）
- recentRegistrations: 最新登記記錄（5筆）
- recentJoinRecords: 最新參加記錄（5筆）
```

---

## Store 設計

### dashboardStore3.js 核心邏輯

#### 數據初始化
```javascript
const initialize = async () => {
  // 支援 Mock 模式與 Directus 模式
  if (serviceAdapter.getIsMock()) {
    // 載入 Mock 數據
    registrations.value = mockRegistrations;
    joinRecords.value = mockJoinRecords;
    activities.value = mockActivities;
  } else {
    // 從 API 獲取數據
    const [regResult, joinResult, actResult] = await Promise.all([
      serviceAdapter.getAllRegistrations(),
      serviceAdapter.getAllParticipationRecords(),
      serviceAdapter.getAllActivities(),
    ]);
  }
};
```

#### 本月數據計算
```javascript
const getCurrentMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
};

// 範例：本月新增登記數
const monthlyRegistrations = computed(() => {
  const { start, end } = getCurrentMonthRange();
  return registrations.value.filter((r) => {
    const date = new Date(r.createdAt);
    return date >= start && date <= end;
  }).length;
});
```

#### 財務數據計算
```javascript
// 本月收入（已付款）
const monthlyIncome = computed(() => {
  const { start, end } = getCurrentMonthRange();
  return joinRecords.value
    .filter((r) => {
      const date = new Date(r.createdAt);
      return date >= start && date <= end && r.paymentState === "paid";
    })
    .reduce((sum, r) => sum + (r.finalAmount || 0), 0);
});

// 待收款項
const pendingPayments = computed(() => {
  return joinRecords.value
    .filter((r) => r.paymentState === "unpaid" || r.paymentState === "partial")
    .reduce((sum, r) => sum + (r.finalAmount - r.paidAmount || 0), 0);
});
```

---

## 使用方式

### 在路由中配置

```javascript
// router/index.js
{
  path: '/dashboard',
  name: 'Dashboard',
  component: () => import('../views/Dashboard.vue'),
  meta: { requiresAuth: true }
},
{
  path: '/dashboard3',
  name: 'Dashboard3',
  component: () => import('../views/Dashboard3.vue'),
  meta: { requiresAuth: true }
}
```

### 在組件中使用

```vue
<script setup>
import { onMounted } from "vue";
import { useDashboardStore3 } from "../stores/dashboardStore3.js";

const store = useDashboardStore3();

onMounted(async () => {
  await store.initialize();
});
</script>
```

---

## 樣式設計

### 卡片顏色標識

```css
/* 財務相關 */
.stat-card.financial { border-left: 4px solid #4caf50; } /* 綠色 - 收入 */
.stat-card.pending { border-left: 4px solid #ff9800; }   /* 橙色 - 待收 */
.stat-card.reconciled { border-left: 4px solid #2196f3; } /* 藍色 - 已沖帳 */
.stat-card.warning { border-left: 4px solid #f44336; }   /* 紅色 - 待處理 */
```

### 付款狀態標籤

```css
.status.success { background: #4caf50; } /* 已付款 */
.status.warning { background: #ff9800; } /* 部分付款 */
.status.danger { background: #f44336; }  /* 未付款 */
.status.info { background: #2196f3; }    /* 免付 */
```

---

## 擴展建議

### 未來可新增功能

1. **圖表視覺化**
   - 月度收入趨勢圖
   - 活動參與人數統計圖
   - 消災/超度比例圓餅圖

2. **快速操作入口**
   - 新增登記按鈕
   - 新增參加記錄按鈕
   - 快速開立收據

3. **提醒通知**
   - 待收款超過N天提醒
   - 待沖帳數量警告
   - 即將到來的活動提醒

4. **數據導出**
   - 匯出本月財務報表
   - 匯出活動統計報表

---

## 開發注意事項

### 數據一致性
- 確保 `createdAt` 欄位格式統一（ISO 8601）
- 付款狀態枚舉值：`paid`, `partial`, `unpaid`, `waived`
- 會計狀態枚舉值：`pending`, `reconciled`

### 效能優化
- 使用 `computed` 避免重複計算
- 大量數據時考慮分頁或虛擬滾動
- 初始化時使用 `Promise.all` 並行載入數據

### 錯誤處理
- 數據載入失敗時顯示友善提示
- Mock 模式與 API 模式無縫切換
- 空數據時顯示 `el-empty` 組件

---

## 測試建議

### 單元測試
- 測試本月日期範圍計算
- 測試財務數據計算邏輯
- 測試數據過濾與排序

### 整合測試
- 測試 Mock 模式數據載入
- 測試 API 模式數據載入
- 測試數據更新後的響應式更新

### UI 測試
- 測試響應式佈局（手機/平板/桌面）
- 測試卡片懸停效果
- 測試空數據狀態顯示

---

## 相關文件

- [業務邏輯說明](./business-logic.md)
- [API 文檔](./api-documentation.md)
- [Store 設計指南](./store-design-guide.md)

---

**最後更新：** 2026-02-11  
**維護者：** 開發團隊
