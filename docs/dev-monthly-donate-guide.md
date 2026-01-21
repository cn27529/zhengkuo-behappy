# Monthly Donate（每月贊助）開發指南

## 功能概述

Monthly Donate 是寺廟管理系統中的每月贊助管理模組，專門處理信眾的定期月度贊助，支援預繳、不連續月份贊助、24個月視窗顯示等複雜業務邏輯。

## 使用者故事分析

### 核心業務邏輯

1. **每月基本單位**：預設100元/月，可調整（如調整為200元/月）
2. **預繳機制**：王小明贊助600元 = 6個月的贊助記錄
3. **不連續月份**：可選擇 2025年12月-2026年5月，跳過其他月份
4. **24個月視窗**：顯示過去12個月 + 未來12個月
5. **多筆贊助**：同一人可有多筆不同時間的贊助記錄

### 使用者操作流程

```
贊助人列表 → 點擊「加贊助」→ 彈出視窗
                              ↓
                    上方：查詢功能
                    左邊：全部贊助列表
                    右邊：輸入金額 + 勾選月份
```

## 系統架構

### 核心組件

- **前端：** `MonthlyDonate.vue` - 主要管理介面
- **狀態管理：** `monthlyDonateStore.js` - Pinia 狀態管理
- **服務層：** `monthlyDonateService.js` + `rustMonthlyDonateService.js`
- **適配器：** `serviceAdapter.js` - 統一服務介面
- **後端：** Rust Axum API + Directus CMS

## 資料結構設計

### 核心資料模型 (Rust)

```rust
pub struct MonthlyDonate {
    // 系統字段
    pub id: i64,
    pub user_created: Option<String>,
    pub date_created: Option<String>,
    pub user_updated: Option<String>,
    pub date_updated: Option<String>,

    // 業務字段
    pub name: Option<String>,                // 贊助人姓名
    pub registration_id: Option<i64>,        // 關聯登記表ID
    pub donate_id: Option<String>,           // 贊助唯一ID
    pub donate_type: Option<String>,         // 贊助類型
    pub donate_items: Option<String>,        // 贊助項目 (JSON)
    pub memo: Option<String>,                // 備註

    // 自定義時間戳
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}
```

### 前端資料結構

```javascript
// 贊助人資料結構
const monthlyDonate = {
  id: 1,
  name: "王小明", // 贊助人姓名
  registrationId: -1, // 關聯登記表ID
  donateId: "a8b9c0d", // 唯一識別碼
  donateType: "", // 贊助類型
  donateItems: [
    // 贊助項目陣列
    {
      donateItemsId: "e1f2g3h", // 項目ID
      price: 600, // 贊助金額
      months: [
        // 贊助月份陣列
        "202512", // 2025年12月
        "202601", // 2026年1月
        "202602", // 2026年2月
        "202603", // 2026年3月
        "202604", // 2026年4月
        "202605", // 2026年5月
      ],
      createdAt: "2025-10-01T08:00:00.000Z",
      createdUser: "admin",
    },
  ],
  memo: "2025年十二月贊助",
  icon: "🈷️",
};
```

### 24個月視窗資料結構

```javascript
// 月份顯示配置
const monthDisplayConfig = {
  pastMonths: 12, // 顯示過去12個月
  futureMonths: 12, // 顯示未來12個月
  showAllMonths: false, // 是否顯示所有月份
  customStartDate: null, // 自定義開始日期
  customEndDate: null, // 自定義結束日期
};

// 生成的月份列表
const monthList = [
  {
    yearMonth: "202412", // YYYYMM 格式
    display: "24年12", // 顯示格式
    isPast: true, // 是否為過去月份
    date: new Date(2024, 11, 1), // 日期物件
  },
  // ... 24個月份
];
```

## 核心功能實作

### 1. 24個月視窗生成

#### 月份列表生成邏輯

```javascript
const generateMonthList = (config = null) => {
  const configToUse = config || monthDisplayConfig.value;
  const { pastMonths, futureMonths } = configToUse;

  const months = [];
  const now = new Date();

  // 生成過去的月份
  for (let i = pastMonths; i > 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const yearMonth = `${year}${month.toString().padStart(2, "0")}`;

    months.push({
      yearMonth,
      display: `${year.toString().slice(-2)}年${month}`,
      isPast: true,
      date: new Date(date),
    });
  }

  // 生成未來的月份
  for (let i = 0; i < futureMonths; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const yearMonth = `${year}${month.toString().padStart(2, "0")}`;

    months.push({
      yearMonth,
      display: `${year.toString().slice(-2)}年${month}`,
      isPast: false,
      date: new Date(date),
    });
  }

  return months;
};
```

### 2. 贊助人資料合併

#### 同名贊助人合併邏輯

```javascript
const donateSummary = computed(() => {
  const summary = {};

  // 按姓名分組
  allDonates.value.forEach((donate) => {
    const name = donate.name;
    if (!summary[name]) {
      summary[name] = {
        name,
        totalAmount: 0,
        totalMonths: new Set(),
        donateItems: [],
        latestCreatedAt: donate.createdAt,
      };
    }

    // 合併贊助項目
    donate.donateItems.forEach((item) => {
      summary[name].totalAmount += item.price;
      item.months.forEach((month) => {
        summary[name].totalMonths.add(month);
      });
      summary[name].donateItems.push(item);
    });
  });

  // 轉換為陣列並排序
  return Object.values(summary).map((item) => ({
    ...item,
    totalMonths: Array.from(item.totalMonths).sort(),
  }));
});
```

### 3. 月份選擇器

#### 金額計算與月份選擇

```javascript
// 根據金額計算可選月份數
const calculateAvailableMonths = (amount) => {
  return Math.floor(amount / monthlyUnitPrice.value);
};

// 過濾已贊助的月份
const getAvailableMonths = (donorName) => {
  const existingMonths = new Set();

  // 收集該贊助人已有的月份
  allDonates.value
    .filter((donate) => donate.name === donorName)
    .forEach((donate) => {
      donate.donateItems.forEach((item) => {
        item.months.forEach((month) => {
          existingMonths.add(month);
        });
      });
    });

  // 返回可用月份
  return monthList.value.filter(
    (month) => !existingMonths.has(month.yearMonth),
  );
};
```

### 4. CRUD 操作

#### 創建贊助記錄

```javascript
async createMonthlyDonate(donateData) {
    const createISOTime = DateUtils.getCurrentISOTime();
    const donateId = await generateGitHashBrowser(createISOTime);

    const processedData = {
        name: donateData.name,
        donateId,
        donateType: donateData.donateType || "monthly",
        donateItems: donateData.donateItems,
        memo: donateData.memo || "",
        createdAt: createISOTime
    };

    // 提交到後端
    const response = await fetch(this.endpoint, {
        method: "POST",
        headers: await this.base.getAuthJsonHeaders(),
        body: JSON.stringify(processedData)
    });

    return await this.base.handleDirectusResponse(response, "成功創建贊助記錄");
}
```

#### 新增贊助項目

```javascript
async addDonateItem(donorName, newItem) {
    // 查找現有贊助人記錄
    const existingDonate = allDonates.value.find(d => d.name === donorName);

    if (existingDonate) {
        // 更新現有記錄
        const updatedItems = [...existingDonate.donateItems, newItem];
        return await this.updateMonthlyDonate(existingDonate.id, {
            donateItems: updatedItems
        });
    } else {
        // 創建新記錄
        return await this.createMonthlyDonate({
            name: donorName,
            donateItems: [newItem]
        });
    }
}
```

## 使用者介面設計

### 主要區塊

#### 1. 贊助人列表表格

```html
<el-table :data="filteredDonates" style="width: 100%">
  <!-- 贊助人姓名 -->
  <el-table-column prop="name" label="贊助人" width="120" />

  <!-- 24個月份欄位 -->
  <el-table-column
    v-for="month in monthList"
    :key="month.yearMonth"
    :label="month.display"
    width="60"
    align="center"
  >
    <template #default="{ row }">
      <span v-if="hasMonthDonation(row, month.yearMonth)" class="month-donated">
        ✓
      </span>
    </template>
  </el-table-column>

  <!-- 操作欄 -->
  <el-table-column label="操作" width="200">
    <template #default="{ row }">
      <el-button size="small" @click="openAddDonationDialog(row)">
        加贊助
      </el-button>
      <el-button size="small" @click="viewDetails(row)"> 查看詳細 </el-button>
    </template>
  </el-table-column>
</el-table>
```

#### 2. 新增贊助彈窗

```html
<el-dialog v-model="addDonationVisible" title="新增贊助" width="80%">
  <div class="donation-dialog">
    <!-- 上方查詢區 -->
    <div class="dialog-header">
      <el-input v-model="dialogSearchQuery" placeholder="搜尋贊助人" />
    </div>

    <div class="dialog-content">
      <!-- 左邊：全部贊助列表 -->
      <div class="left-panel">
        <h4>全部贊助列表</h4>
        <el-table :data="allDonatesList" height="400">
          <el-table-column prop="name" label="姓名" />
          <el-table-column prop="totalAmount" label="總金額" />
          <el-table-column prop="totalMonths.length" label="月份數" />
        </el-table>
      </div>

      <!-- 右邊：輸入金額和選擇月份 -->
      <div class="right-panel">
        <h4>新增贊助</h4>
        <el-form :model="newDonation">
          <el-form-item label="金額">
            <el-input-number
              v-model="newDonation.amount"
              :step="monthlyUnitPrice"
              :min="monthlyUnitPrice"
            />
            <span>（可贊助 {{ availableMonthsCount }} 個月）</span>
          </el-form-item>

          <el-form-item label="選擇月份">
            <div class="month-selector">
              <el-checkbox-group v-model="newDonation.selectedMonths">
                <el-checkbox
                  v-for="month in availableMonths"
                  :key="month.yearMonth"
                  :label="month.yearMonth"
                  :disabled="selectedMonths.length >= availableMonthsCount && !selectedMonths.includes(month.yearMonth)"
                >
                  {{ month.display }}
                </el-checkbox>
              </el-checkbox-group>
            </div>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</el-dialog>
```

### 操作功能

#### 1. 新增贊助人

- 輸入姓名和金額
- 系統自動計算可贊助月份數
- 選擇要贊助的月份
- 提交後在表格中顯示

#### 2. 為現有贊助人新增贊助

- 點擊「加贊助」按鈕
- 輸入金額並選擇可用月份
- 系統自動過濾已贊助的月份

#### 3. 查看詳細資訊

- 顯示所有贊助項目列表
- 顯示月份分佈圖
- 統計總金額和總月份數

## 技術特色

### 1. 動態月份視窗

```javascript
// 可配置的月份顯示範圍
const monthDisplayConfig = ref({
  pastMonths: 12, // 過去12個月
  futureMonths: 12, // 未來12個月
  showAllMonths: false, // 或顯示所有有資料的月份
});
```

### 2. 智能月份選擇

- 根據金額自動計算可選月份數
- 自動過濾已贊助的月份
- 防止重複選擇相同月份

### 3. 資料合併顯示

- 同名贊助人自動合併顯示
- 保留原始多筆贊助記錄
- 統計總金額和總月份數

### 4. 彈性單位金額

```javascript
const monthlyUnitPrice = ref(100); // 可調整的每月基本金額

// 金額驗證
const isValidAmount = (amount) => {
  return amount > 0 && amount % monthlyUnitPrice.value === 0;
};
```

## 資料庫設計

### 表結構 (SQLite)

```sql
CREATE TABLE "monthlyDonateDB" (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `user_created` char(36) NULL,
    `date_created` datetime NULL,
    `user_updated` char(36) NULL,
    `date_updated` datetime NULL,
    `name` varchar(255) null,           -- 贊助人姓名
    `registrationId` integer null default '-1', -- 關聯登記表
    `donateId` varchar(255) null,       -- 贊助唯一ID
    `donateType` varchar(255) null,     -- 贊助類型
    `donateItems` json null,            -- 贊助項目JSON
    `memo` text null,                   -- 備註
    `createdAt` varchar(255) null,
    `updatedAt` varchar(255) null
);
```

### JSON 結構設計

```json
{
  "donateItems": [
    {
      "donateItemsId": "e1f2g3h",
      "price": 600,
      "months": ["202512", "202601", "202602", "202603", "202604", "202605"],
      "createdAt": "2025-10-01T08:00:00.000Z",
      "createdUser": "admin"
    }
  ]
}
```

## API 設計

### RESTful 端點

```
GET    /monthly-donates           # 獲取所有贊助記錄
GET    /monthly-donates/:id       # 獲取特定贊助記錄
POST   /monthly-donates           # 創建新贊助記錄
PATCH  /monthly-donates/:id       # 更新贊助記錄
DELETE /monthly-donates/:id       # 刪除贊助記錄
```

### 查詢參數

- `name` - 按贊助人姓名篩選
- `donate_type` - 按贊助類型篩選
- `month` - 按特定月份篩選
- `registration_id` - 按關聯登記表篩選

## 業務邏輯驗證

### 1. 金額驗證

```javascript
// 金額必須是單位金額的倍數
const validateAmount = (amount) => {
  if (amount <= 0) return "金額必須大於0";
  if (amount % monthlyUnitPrice.value !== 0) {
    return `金額必須是${monthlyUnitPrice.value}的倍數`;
  }
  return null;
};
```

### 2. 月份驗證

```javascript
// 選擇的月份數不能超過金額允許的數量
const validateMonthSelection = (selectedMonths, amount) => {
  const allowedCount = Math.floor(amount / monthlyUnitPrice.value);
  if (selectedMonths.length > allowedCount) {
    return `最多只能選擇${allowedCount}個月份`;
  }
  return null;
};
```

### 3. 重複月份檢查

```javascript
// 檢查是否有重複的月份贊助
const checkDuplicateMonths = (donorName, newMonths) => {
  const existingMonths = getExistingMonths(donorName);
  const duplicates = newMonths.filter((month) =>
    existingMonths.includes(month),
  );

  if (duplicates.length > 0) {
    return `以下月份已有贊助記錄：${duplicates.join(", ")}`;
  }
  return null;
};
```

## 開發工具

### Mock 資料

- `mock_monthlyDonates.json` - 測試用贊助資料
- 包含多筆贊助項目的複雜範例

### 測試腳本

- API 測試腳本
- 業務邏輯單元測試
- 月份計算邏輯測試

### 調試功能

- 開發模式調試面板
- 即時統計資訊顯示
- 月份分佈視覺化

## 部署考量

### 效能優化

- 大量月份欄位的渲染優化
- 資料合併計算的快取機制
- 分頁載入大量贊助記錄

### 使用者體驗

- 月份選擇的視覺回饋
- 金額計算的即時提示
- 操作結果的明確反饋

---

_此文件基於使用者故事和程式碼分析生成，涵蓋 Monthly Donate 功能的完整開發指南。_
