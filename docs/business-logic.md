# 業務邏輯說明

## 概述

zhengkuo-behappy 是一個專為寺廟設計的綜合管理系統，主要處理消災超度登記、每月贊助管理、活動管理和太歲點燈等宗教服務。本文檔詳細說明各項業務功能的邏輯流程。

---

## 1. 消災超度登記系統

### 業務概念

**消災** - 為在世人員祈求平安、消除災厄的宗教儀式
**超度** - 為往生者祈求超脫輪迴、往生淨土的宗教儀式

### 登記流程

```
開始 → 填寫聯絡人資訊 → 填寫消災人員 → 填寫超度資訊 → 確認提交 → 完成
```

#### 1.1 聯絡人資訊 (Contact)

**必填欄位：**

- `name` - 聯絡人姓名
- `relationship` - 與消災/超度對象的關係
- `phone` 或 `mobile` - 聯絡電話（市話或手機至少填一個）

**可選欄位：**

- `phone` - 市內電話
- `mobile` - 行動電話（格式：09開頭的10位數字）
- `otherRelationship` - 當關係選擇「其它」時的補充說明（必填）

**關係選項：**

- 本家 - 直系親屬
- 娘家 - 母系親屬
- 朋友 - 朋友關係
- 其它 - 其他關係（**選擇此項時必須填寫補充說明**）

**驗證規則：**

- 手機號碼必須符合台灣格式：09開頭，共10位數字
- 選擇「其它」關係時，必須填寫其他關係說明

#### 1.2 消災人員資訊 (Blessing)

**地址資訊：**

- `address` - 消災地址（與消災人員互為必填）

**人員清單：**
每位消災人員包含：

- `id` - 清單內唯一識別碼
- `name` - 姓名（必填）
- `zodiac` - 生肖（必填，十二生肖選項）
- `notes` - 備註說明（可選）
- `isHouseholdHead` - 是否為戶長

**業務規則：**

1. 消災地址與消災人員互為必填（有其中一項就必須填寫另一項）
2. 有消災人員時必須指定至少一位戶長
3. 戶長數量不得超過系統設定上限
4. 當有多筆消災人員時，所有條目的姓名和生肖都必須完整填寫
5. 生肖用於特定法會需求和統計分析

#### 1.3 超度資訊 (Salvation)

**地址資訊：**

- `address` - 超度地址（與祖先/陽上人互為必填）

**祖先清單 (Ancestors)：**

- `id` - 清單內唯一識別碼
- `surname` - 姓氏（必填）
- `notes` - 備註（如：祖父、祖母等關係說明）

**陽上人清單 (Survivors)：**

- `id` - 清單內唯一識別碼
- `name` - 姓名（必填）
- `zodiac` - 生肖（可選）
- `notes` - 備註說明

**業務邏輯：**

- 祖先清單記錄需要超度的往生者
- 陽上人清單記錄為往生者祈福的在世親屬
- 超度地址與祖先/陽上人互為必填（有其中一項就必須填寫另一項）
- **重要規則：有祖先時必須有陽上人**（宗教儀式要求）
- 祖先和陽上人數量都有系統設定上限
- 當有多筆記錄時，所有條目的必填欄位都必須完整填寫
- 整體服務要求：消災或超度至少要選擇其中一項

### 表單狀態管理

**狀態類型：**

- `draft` - 草稿狀態，可繼續編輯
- `submitted` - 已提交，等待處理
- `completed` - 已完成處理

**多表單支援：**

- 系統支援同時管理多張表單
- 每張表單有獨立的 `formId` 和 `formName`
- 支援表單間的切換和同步

---

## 2. 每月贊助管理系統

### 業務概念

每月贊助是信眾定期捐獻的管理機制，支援靈活的月份選擇和金額設定。

### 贊助結構

#### 2.1 贊助記錄 (MonthlyDonate)

**基本資訊：**

- `id` - 記錄唯一識別碼
- `name` - 贊助者姓名
- `registrationId` - 關聯的報名記錄（-1 表示無關聯）
- `donateId` - 贊助記錄識別碼
- `donateType` - 贊助類型分類
- `memo` - 備註說明
- `icon` - 顯示圖示

#### 2.2 贊助項目 (DonateItems)

每筆贊助記錄可包含多個贊助項目：

- `donateItemsId` - 項目唯一識別碼
- `price` - 贊助金額
- `months` - 贊助月份陣列（格式：YYYYMM）
- `createdAt` - 建立時間
- `createdUser` - 建立者
- `updatedAt` - 更新時間
- `updatedUser` - 更新者

### 月份管理邏輯

#### 2.3 月份顯示配置

```javascript
monthDisplayConfig = {
  pastMonths: 0, // 顯示過去的月份數
  futureMonths: 12, // 顯示未來的月份數
  showAllMonths: false, // 是否顯示所有月份
  customStartDate: null, // 自定義開始日期
  customEndDate: null, // 自定義結束日期
};
```

**月份生成規則：**

1. 預設顯示未來 12 個月
2. 可配置顯示過去的月份
3. 支援自定義日期範圍
4. 月份格式統一為 YYYYMM

#### 2.4 贊助統計功能

**統計維度：**

- 月度贊助總額
- 贊助者人數統計
- 贊助趨勢分析
- 贊助類型分布

**計算邏輯：**

```javascript
// 計算指定月份的總贊助額
calculateMonthlyTotal(targetMonth) {
  return allDonates
    .flatMap(donate => donate.donateItems)
    .filter(item => item.months.includes(targetMonth))
    .reduce((sum, item) => sum + item.price, 0);
}
```

---

## 3. 活動管理系統

### 業務概念

活動管理涵蓋寺廟各種法會、慶典和宗教活動的組織與參與者管理。

### 活動結構

#### 3.1 活動基本資訊

- `activityId` - 活動唯一識別碼
- `activityName` - 活動名稱
- `itemType` - 活動類型（如：法會、慶典、共修等）
- `state` - 活動狀態
- `icon` - 活動圖示

#### 3.2 活動狀態管理

**狀態流程：**

```
planning → active → completed
    ↓
cancelled (可從任何狀態取消)
```

**狀態說明：**

- `planning` - 籌劃中，尚未開放報名
- `active` - 進行中，開放報名參與
- `completed` - 已完成
- `cancelled` - 已取消

#### 3.3 參與者管理

**參與者資訊：**

- `id` - 參與者識別碼
- `name` - 參與者姓名
- `registrationId` - 關聯的報名記錄
- `joinDate` - 參與日期
- `status` - 參與狀態（confirmed, pending, cancelled）

**參與邏輯：**

1. 參與者可以關聯到報名記錄
2. 支援批量參與者管理
3. 參與狀態可獨立管理

#### 3.4 月度統計

**統計項目：**

```javascript
monthlyStats = {
  "2026-01": {
    totalParticipants: 50, // 總參與人數
    newParticipants: 10, // 新參與人數
    revenue: 25000, // 收入金額
  },
};
```

**計算規則：**

- 按月統計參與人數和收入
- 區分新參與者和回流參與者
- 支援趨勢分析和比較

---

## 4. 參加記錄系統

### 業務概念

參加記錄是寺廟管理系統中的核心功能，用於記錄信眾參加各種宗教活動的詳細資訊，包括超度、消災、點燈等項目的選擇、費用計算、收據開立及帳務處理。

### 業務流程

```
選擇祈福登記表 → 選擇活動項目 → 費用計算 → 保存記錄 → 開立收據 → 帳務處理
```

#### 4.1 參加記錄結構

**基本資訊：**

- `id` - 記錄唯一識別碼
- `registrationId` - 對應的祈福登記表 ID
- `activityId` - 活動 ID
- `state` - 狀態 (`confirmed`, `pending`, `cancelled`)
- `contact` - 聯絡人資訊（來自祈福登記表）

**項目清單 (items)：**

每個參加項目包含：

- `type` - 項目類型（chaodu, survivors, diandeng, qifu, xiaozai, pudu）
- `label` - 項目名稱
- `price` - 單價
- `quantity` - 數量
- `subtotal` - 小計
- `source` - 資料來源（salvation.ancestors, salvation.survivors, blessing.persons）
- `sourceData` - 具體選擇的人員/祖先資料
- `sourceAddress` - 對應的地址（消災地址或超度地址）

**費用資訊：**

- `totalAmount` - 總金額
- `discountAmount` - 折扣金額
- `finalAmount` - 最終金額
- `paidAmount` - 已付金額

**收據資訊：**

- `needReceipt` - 是否需要收據
- `receiptNumber` - 收據號碼（格式：RYYYYMMNNNN）
- `receiptIssued` - 收據是否已開立
- `receiptIssuedAt` - 收據開立日期
- `receiptIssuedBy` - 收據開立者

**付款資訊：**

- `paymentState` - 付款狀態 (`paid`, `partial`, `unpaid`, `waived`)
- `paymentMethod` - 付款方式 (`cash`, `transfer`)
- `paymentDate` - 付款日期
- `paymentNotes` - 付款備註

**會計資訊：**

- `accountingState` - 會計狀態 (`pending`, `reconciled`)
- `accountingDate` - 沖帳日期
- `accountingBy` - 沖帳者
- `accountingNotes` - 沖帳備註

#### 4.2 活動項目類型

系統支援以下活動項目：

| 項目代碼 | 項目名稱   | 單價 | 資料來源            | 說明                           |
| -------- | ---------- | ---- | ------------------- | ------------------------------ |
| chaodu   | 超度/超薦 | 1000 | salvation.ancestors | 祖先超度                       |
| survivors | 陽上人    | 0    | salvation.survivors | 陽上人登記（免費）             |
| qifu     | 消災祈福   | 300  | blessing.persons    | 消災祈福                       |
| diandeng | 點燈       | 600  | blessing.persons    | 點燈祈福，含燈種記錄           |
| xiaozai  | 固定消災   | 100  | blessing.persons    | 固定消災                       |
| pudu     | 中元普度   | 1200 | blessing.persons    | 中元普度法會                   |

**點燈燈種選項：**

| 燈種代碼 | 燈種名稱 | 價格 | 說明                       |
| -------- | -------- | ---- | -------------------------- |
| guangming | 光明燈  | 600  | 記錄用途，統一價格 $600    |
| taisui   | 太歲燈   | 800  | 記錄用途，統一價格 $800    |
| yuanchen | 元辰燈   | 1000 | 記錄用途，統一價格 $1000   |

**點燈業務規則：**

- 每位人員可選擇不同燈種
- 燈種選擇記錄在 `lampDetails` 中
- 總價格為所有人員選擇燈種價格的總和
- 支援個別人員的燈種查詢和統計

#### 4.3 費用計算邏輯

**基本計算：**

```javascript
// 單項小計
subtotal = price * quantity;

// 總金額
totalAmount = sum(items.map((item) => item.subtotal));

// 最終金額
finalAmount = totalAmount - discountAmount;
```

**點燈特殊計算：**

```javascript
// 點燈總價格
let totalPrice = 0;
sourceData.forEach((person) => {
  const lampType = getPersonLampType(person.id);
  const lampConfig = config.lampTypes[lampType];
  totalPrice += lampConfig.price;
});
```

#### 4.4 收據管理

**收據號碼生成規則：**

- 格式：`RYYYYMMNNNN`
- R：收據前綴
- YYYY：年份
- MM：月份
- NNNN：當月流水號（4 位數）

**開立收據流程：**

```javascript
issueReceipt(record) {
  record.receiptNumber = generateReceiptNumber();
  record.receiptIssued = true;
  record.receiptIssuedAt = new Date().toISOString();
  record.receiptIssuedBy = getCurrentUser();
}
```

#### 4.5 付款處理

**付款狀態轉換：**

```
unpaid → partial → paid
   ↓
waived (免付)
```

**付款記錄邏輯：**

```javascript
recordPayment(record, method, amount, notes) {
  record.paidAmount += amount;
  record.paymentMethod = method;
  record.paymentDate = new Date().toISOString();

  // 更新付款狀態
  if (record.paidAmount >= record.finalAmount) {
    record.paymentState = 'paid';
  } else if (record.paidAmount > 0) {
    record.paymentState = 'partial';
  }
}
```

#### 4.6 會計沖帳

**沖帳流程：**

```javascript
reconcileAccounting(record, accountingBy, notes) {
  record.accountingState = 'reconciled';
  record.accountingDate = new Date().toISOString();
  record.accountingBy = accountingBy;
  record.accountingNotes = notes;
}
```

**業務規則：**

- 只有已付款的記錄才能沖帳
- 沖帳後不可修改金額
- 沖帳記錄需保留審計追蹤

#### 4.7 資料關聯

**與祈福登記表的關聯：**

- 通過 `registrationId` 關聯
- 自動帶入聯絡人資訊
- 根據登記表資料動態生成可選項目

**與活動的關聯：**

- 通過 `activityId` 關聯
- 支援無活動的獨立記錄（activityId = -1）
- 活動統計包含參加記錄資料

### 用戶介面特色

#### 4.8 響應式設計

- **桌面版**：左右分欄佈局（70%/30%）
- **平板版**：垂直堆疊佈局
- **手機版**：單欄顯示，活動項目改為單列

#### 4.9 浮動金額統計

- 固定在頁面右下角
- 即時顯示選擇項目和總金額
- 支援多種位置配置

#### 4.10 互動體驗

- 點擊活動標題可全選/取消全選
- 選擇狀態即時反饋
- 載入狀態提示

### 搜尋功能

支援以下欄位的模糊搜尋：

- 聯絡人姓名
- 手機號碼
- 電話號碼
- 地址
- 人員姓名
- 生肖
- 備註

### 資料驗證

#### 4.11 必要檢查

```javascript
// 必須選擇祈福登記表
if (!selectedRegistration.value) {
  errors.push("請選擇祈福登記表");
}

// 至少選擇一個活動項目
const hasSelectedItems = Object.values(selections.value).some(
  (items) => items.length > 0,
);
if (!hasSelectedItems) {
  errors.push("請至少選擇一個活動項目");
}

// 金額計算正確性
if (totalAmount !== calculateTotalAmount(items)) {
  errors.push("金額計算錯誤");
}
```

#### 4.12 業務規則驗證

- 超度項目僅在有祖先資料時顯示
- 陽上人項目價格為 0（免費）
- 點燈項目每位人員可選擇燈種
- 燈種選擇不影響價格統一性
- 各項目根據對應的人員資料動態生成

---

## 5. 太歲點燈系統

### 業務概念

太歲點燈是根據農曆年份和生肖，為信眾提供的消災祈福服務。

### 太歲邏輯

#### 5.1 生肖與太歲對應

**十二生肖循環：**
鼠、牛、虎、兔、龍、蛇、馬、羊、猴、雞、狗、豬

**犯太歲類型：**

- 值太歲 - 本命年
- 沖太歲 - 對沖生肖
- 刑太歲 - 相刑生肖
- 害太歲 - 相害生肖

#### 5.2 點燈管理

**點燈資訊：**

- 點燈者姓名和生肖
- 點燈類型和期間
- 點燈狀態追蹤
- 相關費用記錄

---

## 6. 認證與權限系統

### 認證機制

#### 6.1 多重認證支援

**認證方式：**

1. **Mock 認證** - 開發測試用
2. **Directus 認證** - 基於 Directus 的用戶系統
3. **Supabase 認證** - 雲端認證服務

#### 6.2 權限控制

**用戶角色：**

- `admin` - 系統管理員，完整權限
- `staff` - 工作人員，業務操作權限
- `user` - 一般用戶，查看和編輯自己的記錄

**權限檢查：**

```javascript
// 路由層級權限檢查
meta: {
  requiresAuth: true;
}

// 功能層級權限檢查
if (userRole !== "admin") {
  // 限制操作
}
```

---

## 7. 資料同步與狀態管理

### 前端狀態管理

#### 7.1 Pinia Store 架構

**Store 分工：**

- `registrationStore` - 報名表單狀態
- `monthlyDonateStore` - 贊助記錄狀態
- `activityStore` - 活動管理狀態
- `joinRecordStore` - 參加記錄狀態
- `authStore` - 認證狀態
- `configStore` - 系統配置

#### 7.2 資料同步機制

**雙向同步：**

```javascript
// 表單陣列與當前表單的同步
watch(currentFormIndex, (newIndex) => {
  if (formArray.value[newIndex]) {
    loadFormToRegistration(formArray.value[newIndex]);
  }
});

// 當前表單變更時同步到陣列
watch(
  registrationForm,
  (newForm) => {
    if (formArray.value[currentFormIndex.value]) {
      formArray.value[currentFormIndex.value] = { ...newForm };
    }
  },
  { deep: true },
);
```

### 後端資料處理

#### 7.3 JSON 欄位處理

**複雜資料結構：**

- `contact` - JSON 格式儲存聯絡人資訊
- `blessing` - JSON 格式儲存消災資訊
- `salvation` - JSON 格式儲存超度資訊
- `donateItems` - JSON 陣列儲存贊助項目
- `participants` - JSON 陣列儲存參與者資訊

**序列化/反序列化：**

```rust
// Rust 端 JSON 處理
fn serialize_json_string<T: Serialize>(value: &T) -> String {
    serde_json::to_string(value).unwrap_or_default()
}

fn deserialize_json_string<T: DeserializeOwned>(json_str: &str) -> T {
    serde_json::from_str(json_str).unwrap_or_default()
}
```

---

## 8. 業務流程整合

### 完整業務流程

#### 8.1 新信眾服務流程

```
1. 信眾到訪 → 2. 填寫報名表 → 3. 選擇服務項目 → 4. 設定贊助計畫 → 5. 完成登記
```

#### 8.2 定期服務管理

```
1. 活動規劃 → 2. 開放報名 → 3. 參與者管理 → 4. 活動執行 → 5. 統計分析
```

#### 8.3 參加記錄完整流程

```
1. 選擇祈福登記表 → 2. 選擇活動項目 → 3. 費用計算 → 4. 保存記錄 → 5. 記錄付款 → 6. 開立收據 → 7. 會計沖帳
```

#### 8.4 資料關聯邏輯

**關聯關係：**

- 報名記錄 ↔ 每月贊助（通過 registrationId）
- 報名記錄 ↔ 活動參與（通過 registrationId）
- 報名記錄 ↔ 參加記錄（通過 registrationId）
- 參加記錄 ↔ 活動（通過 activityId）
- 用戶 ↔ 所有記錄（通過 user_created）

---

## 9. 特殊業務規則

### 9.1 驗證規則

**聯絡人資訊驗證：**

```javascript
// 聯絡人姓名（必填）
if (!contact.name.trim()) {
  errors.push("聯絡人姓名為必填");
}

// 聯絡人關係（必填）
if (!contact.relationship.trim()) {
  errors.push("資料表屬性為必填");
}

// 聯絡電話（市話或手機至少填一個）
if (!contact.phone.trim() && !contact.mobile.trim()) {
  errors.push("請填寫電話或手機其中之一");
}

// 手機號碼格式檢查（09開頭，共10位數字）
const mobileValue = contact.mobile.trim();
if (mobileValue && !/^09\d{8}$/.test(mobileValue)) {
  errors.push("手機號碼格式錯誤，請輸入09開頭的10位數字");
}

// 其它關係補充說明
if (contact.relationship === "其它" && !contact.otherRelationship.trim()) {
  errors.push("選擇『其它』時，請填寫其他關係說明");
}
```

**消災人員驗證：**

```javascript
// 戶長數量檢查
const householdHeads = blessing.persons.filter((p) => p.isHouseholdHead);
if (householdHeads.length > maxHouseholdHeads) {
  errors.push(`戶長數量超過限制 (${householdHeads.length}/${maxHouseholdHeads})`);
}

// 戶長必填檢查（有消災人員時）
if (hasNamedPersons && householdHeads.length === 0) {
  errors.push("請至少指定一位戶長");
}

// 消災地址與人員一致性
if (filledBlessingPersons > 0 && !blessingAddress.trim()) {
  errors.push("已填寫消災人員，消災地址為必填");
}
if (blessingAddress.trim() && filledBlessingPersons === 0) {
  errors.push("消災地址已填寫，請至少填寫一筆消災人員");
}

// 消災人員資料完整性（多筆時）
if (allBlessingPersons.length >= 2) {
  const hasIncompleteData = allBlessingPersons.some(p => 
    !p.name?.trim() || !p.zodiac?.trim()
  );
  if (hasIncompleteData) {
    errors.push("消災人員中有未填寫完整的條目，請填寫或刪除空白條目");
  }
}
```

**超度資訊驗證：**

```javascript
// 祖先數量限制
if (ancestorsCount > maxAncestors) {
  errors.push(`祖先數量超過限制 (${ancestorsCount}/${maxAncestors})`);
}

// 陽上人數量限制
if (survivorsCount > maxSurvivors) {
  errors.push(`陽上人數量超過限制 (${survivorsCount}/${maxSurvivors})`);
}

// 超度地址與資料一致性
if ((filledAncestors + filledSurvivors) > 0 && !salvationAddress.trim()) {
  errors.push("已填寫祖先或陽上人，超度地址為必填");
}
if (salvationAddress.trim() && filledAncestors === 0) {
  errors.push("超度地址已填寫，請至少填寫一筆歷代祖先");
}

// 祖先與陽上人關聯性（有祖先必須有陽上人）
if (filledAncestors > 0 && filledSurvivors === 0) {
  errors.push("已填寫祖先，請至少填寫一位陽上人");
}

// 資料完整性檢查（多筆時）
if (allAncestors.length >= 2) {
  const hasIncompleteSurname = allAncestors.some(a => !a.surname?.trim());
  if (hasIncompleteSurname) {
    errors.push("祖先名單中有未填寫姓氏的條目，請填寫或刪除空白條目");
  }
}

if (allSurvivors.length >= 2) {
  const hasIncompleteName = allSurvivors.some(s => !s.name?.trim());
  if (hasIncompleteName) {
    errors.push("陽上人名單中有未填寫姓名的條目，請填寫或刪除空白條目");
  }
}
```

**整體服務驗證：**

```javascript
// 至少要有消災或超度其中一項
const hasBlessing = availableBlessingPersons.length > 0;
const hasAncestors = availableAncestors.length > 0;
if (!hasBlessing && !hasAncestors) {
  errors.push("請至少填寫消災人員或歷代祖先其中一項");
}
```

### 9.2 資料完整性

**自動補全：**

- 自動生成 formId 和 donateId
- 自動設定建立時間和用戶
- 自動計算統計數據

**資料清理：**

- 移除空白的人員記錄
- 標準化日期格式
- 清理無效的月份資料

---

## 10. 錯誤處理與異常情況

### 10.1 常見業務異常

**資料不一致：**

- 報名記錄與贊助記錄關聯錯誤
- 月份資料格式不正確
- 參與者資訊缺失

**解決策略：**

- 資料驗證和清理
- 自動修復機制
- 錯誤日誌記錄

### 10.2 業務邏輯異常

**處理原則：**

1. 優雅降級 - 部分功能失效時保持核心功能
2. 資料保護 - 防止資料丟失
3. 用戶提示 - 清楚的錯誤訊息
4. 自動恢復 - 可能的情況下自動修復

---

## 11. 業務擴展性

### 11.1 模組化設計

**新功能擴展：**

- 新增服務類型（如：法會預約）
- 新增統計維度（如：地區分析）
- 新增通知機制（如：簡訊提醒）

### 11.2 客製化支援

**可配置項目：**

- 表單欄位和驗證規則
- 服務類型和價格
- 統計報表格式
- 用戶界面主題

---

## 總結

zhengkuo-behappy 系統通過模組化的設計，完整地涵蓋了寺廟管理的核心業務需求。每個模組都有清晰的業務邏輯和資料流程，同時保持了良好的擴展性和維護性。

系統的設計重點在於：

1. **業務流程的數位化** - 將傳統的紙本作業轉為數位化管理
2. **資料的結構化** - 建立完整的資料關聯和統計機制
3. **用戶體驗的優化** - 簡化操作流程，提高工作效率
4. **系統的可靠性** - 完善的錯誤處理和資料保護機制

這些業務邏輯的實現，使得寺廟能夠更有效地管理各項宗教服務，同時為信眾提供更好的服務體驗。
