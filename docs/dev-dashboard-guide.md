# Dashboard 開發指南

> **最後更新**: 2026-03-07  
> **文件路徑**: `client/src/views/Dashboard.vue`

## 概述說明

Dashboard（資訊牆）提供系統全面的數據概覽，包含業務統計、財務狀態、活動管理與近期記錄，讓管理人員即時掌握登記、金流與活動概況。

## 核心功能

### 1. 業務統計卡片

- **總參與人次**: 啟用至今累計參與人次（動畫數字）
- **祈福登記總數**: 累計登記數與近 7 日新增數
- **參加記錄總數**: 累計記錄數與近 7 日新增數
- **贊助者人數**: 累計贊助者與本月活躍人數

### 2. 狀態監控卡片

- **待處理付款**: 未付款與未收尾款的記錄數（警告狀態）
- **待開立收據/感謝狀**: 需要開立收據的記錄數，提供快速打印按鈕（危險狀態）
- **待沖帳**: 已付款但未沖帳的記錄數（資訊狀態）
- **待補齊資料**: 聯絡/消災/超度資料不完整的記錄數（警告狀態）

### 3. 贊助統計卡片

- **本月贊助總額**: 當月贊助金額與活躍贊助者人數
- **未來 6 個月排定贊助**: 提前掌握可預期月贊助額

### 4. 活動管理

- **即將到來活動**: 顯示活動名稱、日期、參與人次
- **已經完成活動**: 顯示活動名稱、日期、參與人次

### 5. 近期記錄

- **近期祈福登記**: 顯示聯絡人、電話、關係、建立時間
- **近期參加記錄**: 顯示聯絡人、金額、建立時間

### 6. 快速操作

- **收據打印按鈕**: 點擊 🖨 按鈕直接打印待開立收據的記錄

## 技術架構

### 依賴套件

```javascript
import { useDashboardStore } from "../stores/dashboardStore.js";
import { useJoinRecordStore } from "../stores/joinRecordStore.js";
import { DateUtils } from "../utils/dateUtils.js";
import AnimatedNumber from "../components/AnimatedNumber.vue";
import appConfig from "../config/appConfig.js";
```

### Store 整合

```javascript
const dashboardStore = useDashboardStore();
const joinRecordStore = useJoinRecordStore();

// 業務統計
const totalParticipants = computed(() => dashboardStore.totalParticipants);
const totalRegistrations = computed(() => dashboardStore.totalRegistrations);
const totalJoinRecords = computed(() => dashboardStore.totalJoinRecords);
const totalDonors = computed(() => dashboardStore.totalDonors);
const registrationsInLast7Days = computed(
  () => dashboardStore.registrationsInLast7Days,
);
const joinRecordsInLast7Days = computed(
  () => dashboardStore.joinRecordsInLast7Days,
);

// 贊助統計
const currentMonthDonateSummary = computed(
  () => dashboardStore.currentMonthDonateSummary,
);
const next6MonthsDonateTotal = computed(
  () => dashboardStore.next6MonthsDonateTotal,
);

// 狀態監控
const paymentSummary = computed(() => dashboardStore.paymentSummary);
const receiptPendingCount = computed(() => dashboardStore.receiptPendingCount);
const receiptPendingIds = computed(() => dashboardStore.receiptPendingIds);
const accountingPendingCount = computed(
  () => dashboardStore.accountingPendingCount,
);
const formsNeedAttentionCount = computed(
  () => dashboardStore.formsNeedAttentionCount,
);

// 活動與記錄
const upcomingActivityHighlights = computed(
  () => dashboardStore.upcomingActivityHighlights,
);
const completedActivityHighlights = computed(
  () => dashboardStore.completedActivityHighlights,
);
const recentRegistrations = computed(() => dashboardStore.recentRegistrations);
const recentJoinRecords = computed(() => dashboardStore.recentJoinRecords);

// 更新時間
const lastUpdatedAt = computed(() => dashboardStore.lastUpdatedAt);
```

## 核心功能實現

### 1. 數據初始化

```javascript
onMounted(async () => {
  await dashboardStore.initialize();
});
```

### 2. 快速收據打印

```javascript
const handleReceiptPrint = (record_id) => {
  try {
    const record = dashboardStore.getJoinRecordById(record_id);
    if (!record) {
      ElMessage.error("找不到對應的參加記錄");
      return;
    }

    const isoStr = DateUtils.getCurrentISOTime();
    const printData = JSON.stringify(record);
    const printId = `print_receipt_${record.id}`;
    sessionStorage.setItem(printId, printData);

    router.push({
      path: "/receipt-print",
      query: { 
        print_id: printId, 
        print_data: printData, 
        iso_str: isoStr, 
        print_type: appConfig.PRINT_TYPE.SINGLE,
      },
    });
  } catch (error) {
    console.error("導航到收據頁面失敗:", error);
    ElMessage.error("導航到收據頁面失敗");
  }
};
```

### 3. 日期格式化

```javascript
const formatDate = (value) => DateUtils.formatDate(value);
const formatDateTime = (value) => DateUtils.formatDateTime(value);
const formatRelativeOrDateTime = (value) =>
  DateUtils.formatRelativeOrDateTime(value);
```

## 頁面佈局

### HTML 結構

```vue
<template>
  <main class="dashboard2">
    <!-- 頁面標題 -->
    <section class="page-header">
      <div>
        <h2>資訊牆</h2>
        <p class="sub-title">即時掌握登記、金流與活動概況</p>
      </div>
      <div class="header-meta">
        <span class="meta-label">更新時間</span>
        <span class="meta-value">{{ formatDateTime(lastUpdatedAt) }}</span>
      </div>
    </section>

    <!-- 業務統計卡片 -->
    <el-row :gutter="24" class="summary-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="summary-card">
          <div class="summary-label">總參與人次</div>
          <AnimatedNumber :value="totalParticipants" :duration="2000" />
          <div class="summary-foot">啟用至今</div>
        </el-card>
      </el-col>
      <!-- 其他統計卡片... -->
    </el-row>

    <!-- 狀態監控卡片 -->
    <el-row :gutter="24" class="summary-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="status-card danger">
          <div class="status-title">待開立收據/感謝狀</div>
          <div class="status-value">{{ receiptPendingCount }}</div>
          <div class="status-foot">
            <!-- 快速打印按鈕 -->
            <el-button
              v-for="id in receiptPendingIds"
              :key="id"
              type="success"
              size="small"
              circle
              @click="handleReceiptPrint(id)"
            >
              🖨
            </el-button>
          </div>
        </el-card>
      </el-col>
      <!-- 其他狀態卡片... -->
    </el-row>

    <!-- 贊助統計卡片 -->
    <el-row :gutter="24" class="summary-row">
      <el-col :xs="24" :sm="12" :lg="12">
        <el-card shadow="hover" class="donate-card">
          <div class="card-title">本月贊助總額</div>
          <div class="card-value">
            {{ appConfig.formatCurrency(currentMonthDonateSummary.total) }}
          </div>
          <div class="card-foot">
            活躍贊助者 {{ currentMonthDonateSummary.donors }} 人
          </div>
        </el-card>
      </el-col>
      <!-- 未來贊助卡片... -->
    </el-row>

    <!-- 活動列表 -->
    <el-row :gutter="24" class="summary-row">
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="list-card">
          <div class="list-title">即將到來活動</div>
          <div v-if="upcomingActivityHighlights.length" class="list-body">
            <div
              v-for="activity in upcomingActivityHighlights"
              :key="activity.id"
              class="list-item"
            >
              <div class="list-main">
                <span class="list-icon">{{ activity.icon }}</span>
                <div>
                  <div class="list-label">{{ activity.name }}</div>
                  <div class="list-meta">{{ formatDate(activity.date) }}</div>
                </div>
              </div>
              <div class="list-value">
                {{ activity.participants || 0 }} 人次
              </div>
            </div>
          </div>
          <div v-else class="list-empty">暫無即將到來活動</div>
        </el-card>
      </el-col>
      <!-- 已完成活動... -->
    </el-row>

    <!-- 近期記錄 -->
    <el-row :gutter="24" class="summary-row">
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="list-card">
          <div class="list-title">近期祈福登記</div>
          <div v-if="recentRegistrations.length" class="list-body">
            <div
              v-for="registration in recentRegistrations"
              :key="registration.id"
              class="list-item"
            >
              <div class="list-main">
                <div class="list-label">
                  {{ registration.contact?.name || "未填聯絡人" }}
                </div>
                <div class="list-meta">
                  {{
                    registration.contact?.mobile || registration.contact?.phone
                  }}
                  {{ registration.contact?.relationship }}，
                  {{
                    formatRelativeOrDateTime(
                      registration.createdAt || registration.date_created,
                    )
                  }}
                </div>
              </div>
            </div>
          </div>
          <div v-else class="list-empty">暫無登記資料</div>
        </el-card>
      </el-col>
      <!-- 近期參加記錄... -->
    </el-row>
  </main>
</template>
```

## 樣式設計

### 頁面佈局

```css
.dashboard2 {
  padding: 1.5rem 2rem 2.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.summary-row {
  margin-bottom: 1.5rem;
}
```

### 業務統計卡片

```css
.summary-card {
  border-radius: 12px;
  padding: 0.5rem 0;
  min-height: 130px;
}

.summary-label {
  font-weight: 700;
  font-size: 0.95rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.summary-foot {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: #9aa0a6;
}
```

### 狀態監控卡片

```css
.status-card {
  border-radius: 12px;
  min-height: 120px;
}

.status-card.warning {
  border-left: 4px solid #f2b24c;
}

.status-card.danger {
  border-left: 4px solid #ef6c6c;
}

.status-card.info {
  border-left: 4px solid #5a9cfb;
}

.status-title {
  font-size: 0.95rem;
  color: #6b7280;
  margin-bottom: 0.35rem;
  font-weight: 700;
}

.status-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1f2937;
}
```

### 列表卡片

```css
.list-card {
  border-radius: 12px;
}

.list-title {
  font-size: 1rem;
  font-weight: 700;
  color: #374151;
  margin-bottom: 0.75rem;
}

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.65rem;
  border-bottom: 1px solid #eef1f4;
}

.list-main {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.list-icon {
  font-size: 1.4rem;
}

.list-label {
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.15rem;
  white-space: nowrap;
}

.list-meta {
  font-size: 0.85rem;
  color: #9aa0a6;
}
```

### 響應式設計

```css
@media (max-width: 768px) {
  .dashboard2 {
    padding: 1.25rem 1rem 2rem;
  }

  .header-meta {
    text-align: left;
  }

  .summary-card,
  .status-card,
  .finance-card,
  .donate-card,
  .list-card {
    min-height: auto;
  }
}
```

## Store 設計

### dashboardStore.js 核心邏輯

#### 數據初始化

```javascript
const initialize = async () => {
  // 支援 Mock 模式與 Directus 模式
  if (serviceAdapter.getIsMock()) {
    registrations.value = mockRegistrations;
    joinRecords.value = mockJoinRecords;
    activities.value = mockActivities;
  } else {
    const [regResult, joinResult, actResult] = await Promise.all([
      serviceAdapter.getAllRegistrations(),
      serviceAdapter.getAllParticipationRecords(),
      serviceAdapter.getAllActivities(),
    ]);
  }

  lastUpdatedAt.value = new Date().toISOString();
};
```

#### 業務統計計算

```javascript
// 總參與人次
const totalParticipants = computed(() => {
  return joinRecords.value.reduce((sum, record) => {
    return (
      sum +
      (record.items?.reduce((itemSum, item) => {
        return itemSum + (item.quantity || 0);
      }, 0) || 0)
    );
  }, 0);
});

// 近 7 日新增登記數
const registrationsInLast7Days = computed(() => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return registrations.value.filter((r) => {
    const date = new Date(r.createdAt || r.date_created);
    return date >= sevenDaysAgo;
  }).length;
});
```

#### 狀態監控計算

```javascript
// 待開立收據記錄
const receiptPendingIds = computed(() => {
  return joinRecords.value
    .filter((r) => r.needReceipt && !r.receiptIssued)
    .map((r) => r.id);
});

const receiptPendingCount = computed(() => receiptPendingIds.value.length);

// 待沖帳記錄
const accountingPendingCount = computed(() => {
  return joinRecords.value.filter(
    (r) => r.paymentState === "paid" && r.accountingState !== "reconciled",
  ).length;
});
```

#### 贊助統計計算

```javascript
// 本月贊助總額
const currentMonthDonateSummary = computed(() => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const monthlyDonations = joinRecords.value.filter((r) => {
    const date = new Date(r.createdAt || r.date_created);
    return date >= startOfMonth && date <= endOfMonth;
  });

  return {
    total: monthlyDonations.reduce((sum, r) => sum + (r.finalAmount || 0), 0),
    donors: new Set(monthlyDonations.map((r) => r.contact?.name)).size,
  };
});
```

## 常見問題

### Q1: 如何新增自定義統計卡片？

**A**: 在 dashboardStore.js 中新增 computed 屬性，然後在 Dashboard.vue 中新增對應的卡片組件。

### Q2: 快速打印按鈕如何工作？

**A**: 點擊按鈕後，從 store 中獲取記錄數據，存入 sessionStorage，然後導航到收據打印頁面。

### Q3: 如何調整近期記錄顯示數量？

**A**: 在 dashboardStore.js 中修改 `recentRegistrations` 和 `recentJoinRecords` 的 `.slice()` 參數。

### Q4: 動畫數字如何實現？

**A**: 使用 `AnimatedNumber` 組件，傳入 `value` 和 `duration` 屬性即可。

### Q5: 如何隱藏財務相關卡片？

**A**: 在對應的 `<el-row>` 標籤上加入 `v-if="false"` 條件渲染。

## 技術亮點

1. **動畫數字效果**: 使用 AnimatedNumber 組件提升視覺體驗
2. **響應式佈局**: 支援桌面、平板、手機多種設備
3. **快速操作入口**: 待開立收據直接提供打印按鈕
4. **狀態顏色標識**: 不同狀態使用不同顏色邊框區分
5. **相對時間顯示**: 近期記錄使用相對時間（如「3 小時前」）
6. **數據即時更新**: 使用 computed 屬性自動響應數據變化

## 相關文件

- [dashboardStore 狀態管理](./dev-dashboardStore-guide.md)
- [參加記錄收據打印功能](./dev-joinRecord-receipt-print-guide.md)
- [AnimatedNumber 組件](./dev-animated-number-guide.md)

## 未來優化

- [ ] 新增圖表視覺化（月度收入趨勢圖、活動參與統計圖）
- [ ] 新增快速操作入口（新增登記、新增參加記錄）
- [ ] 新增提醒通知（待收款超期提醒、活動提醒）
- [ ] 新增數據導出功能（匯出財務報表、活動統計報表）
- [ ] 新增自定義儀表板配置（用戶可選擇顯示哪些卡片）
- [ ] 新增數據刷新按鈕（手動刷新數據）
- [ ] 新增數據篩選功能（按日期範圍篩選）
