# 參加記錄 - 功能開發指南

## 修改日期

2026-01-27

## 概述說明

「參加記錄」是寺廟管理系統中的核心功能，用於記錄信眾參加各種宗教活動的詳細資訊，包括超度、消災、點燈等項目的選擇、費用計算、收據開立及帳務處理。

## 業務流程

### 主要使用情境

1. **選擇祈福登記表**: 寺廟操作者從已提交的祈福登記表中選擇特定信眾的資料
2. **活動項目選擇**: 根據信眾需求選擇參加的活動項目（超度、消災、點燈等）
3. **費用計算**: 系統自動計算各項目費用並統計總金額
4. **記錄保存**: 保存參加記錄，包含所有選擇項目和費用資訊
5. **收據開立**: 根據需要開立收據給信眾
6. **帳務處理**: 後續與會計系統進行帳務串接或沖帳

## 修改項目

### 1. 修復祖先資料驗證邏輯

**問題：** 祈福登記 id=108 沒有填寫祖先名稱和地址，但仍然在"活動參加項目選擇"中顯示超度和消災祈福選項

**原因：** 原本的條件只檢查 `selectedRegistration.salvation.ancestors.length > 0`，但沒有驗證祖先名稱和地址是否有實際內容

**解決方案：**

- 新增 `hasValidAncestors` 函數來檢查祖先資料的有效性
- 同時驗證祖先地址 (`salvation.address`) 和祖先名稱 (`ancestors[].surname`) 是否非空
- 將超度/超薦和消災祈福區塊的顯示條件從 `v-if="selectedRegistration.salvation.ancestors.length > 0"` 改為 `v-if="hasValidAncestors(selectedRegistration)"`

**修改內容：**

```javascript
// 檢查是否有有效的祖先資料
const hasValidAncestors = (registration) => {
  if (!registration || !registration.salvation) return false;

  // 檢查是否有祖先地址
  const hasAddress =
    registration.salvation.address &&
    registration.salvation.address.trim() !== "";

  // 檢查是否有有效的祖先名稱
  const hasValidAncestorNames =
    registration.salvation.ancestors &&
    registration.salvation.ancestors.length > 0 &&
    registration.salvation.ancestors.some(
      (ancestor) => ancestor.surname && ancestor.surname.trim() !== "",
    );

  return hasAddress && hasValidAncestorNames;
};
```

**修改文件：**

- `client/src/views/JoinRecord.vue`

### 2. 修復點燈功能錯誤

**問題：** 點燈功能報錯 `lampTypeSelection is not defined`

**原因：** `joinRecordStore.js` 中的 `createParticipationItem` 函數使用了未定義的 `lampTypeSelection` 變數

**解決方案：**

- 修改 `createParticipationItem` 函數，移除對 `lampTypeSelection.value` 的引用
- 改為遍歷每個選中的人員，使用 `getPersonLampType(person.id)` 獲取各自的燈種選擇
- 計算每個人的燈種價格，並在返回物件中包含 `lampDetails` 陣列記錄詳細資訊

**修改文件：**

- `client/src/stores/joinRecordStore.js`

### 3. 活動選擇排序優化

**需求：** 活動下拉選項按日期降序排列，最新活動排在最前面

**修改內容：**

- 將 `availableActivities` 計算屬性中的排序邏輯從升序改為降序
- 修改：`new Date(a.date) - new Date(b.date)` → `new Date(b.date) - new Date(a.date)`

**修改文件：**

- `client/src/views/JoinRecord.vue` (第 731 行)

### 4. 保留活動選擇狀態

**需求：** 提交表單後不重置已選中的活動

**修改內容：**

- 在 `handleSubmitForm` 函數中移除 `selectedActivityId.value = null;`
- 保留 `joinRecordStore.resetSelections();` 來重置其他選擇項目

**修改文件：**

- `client/src/views/JoinRecord.vue`

### 5. 添加提交確認對話框

**需求：** 提交前顯示確認對話框，並要求填寫備註

**實現功能：**

- 使用 `ElMessageBox.prompt` 顯示確認對話框
- 顯示活動名稱、聯絡人、總金額等資訊
- 強制要求填寫備註說明（必填驗證）
- 將備註傳遞給後端儲存

**修改內容：**

1. **前端 Vue 組件：**
   - 修改 `handleSubmitForm` 函數，添加確認對話框
   - 添加備註驗證邏輯
   - 處理取消操作

2. **Store 層：**
   - 修改 `submitRecord` 方法接收 `notes` 參數
   - 在 payload 中添加 `notes` 欄位

**修改文件：**

- `client/src/views/JoinRecord.vue`
- `client/src/stores/joinRecordStore.js`

### 6. 後端 contact 欄位支援

**需求：** 在 Rust 後端添加 `contact` 欄位支援

**修改內容：**

1. **Model 層：**
   - 在 `JoinRecord` 結構體中添加 `contact` 欄位
   - 在各個請求/響應結構體中添加 `contact` 欄位
   - 使用與 `items` 相同的 JSON 序列化處理

2. **Handler 層：**
   - 在查詢語句中添加 `contact` 欄位
   - 在創建和更新邏輯中處理 `contact` 欄位

**修改文件：**

- `rust-axum/src/models/participation_record.rs`
- `rust-axum/src/handlers/participation_record.rs`

## 資料結構

### 參加記錄 (Participation Record)

```json
{
  "id": 1,
  "registrationId": 1,           // 對應的祈福登記表ID
  "activityId": "w4x5y6z",       // 活動ID
  "registeredAt": "2025-01-16T09:00:00.000Z",
  "registeredBy": "王大明",       // 登記者
  "state": "confirmed",          // 狀態: confirmed/pending/completed
  "items": [...],                // 參加項目清單
  "totalAmount": 2200,           // 總金額
  "discountAmount": 200,         // 折扣金額
  "finalAmount": 2000,           // 最終金額
  "paidAmount": 2000,            // 已付金額
  "needReceipt": "",           // 是否需要收據
  "receiptIssued": "",  // 經20260225決定修改定義默認為空值，值等於 "standard" 是 "感謝狀", "stamp" 是 "收據"，空值表示：未打印"收據"或"感謝狀"。
  "receiptNumber": "R2025010001", // 佛字第
  "paymentState": "paid",        // 付款狀態
  "accountingState": "reconciled" // 會計狀態
}
```

### 參加項目 (Participation Item)

```json
{
  "type": "chaodu",              // 項目類型
  "label": "超度/超薦",           // 項目名稱
  "price": 1000,                 // 單價
  "quantity": 1,                 // 數量
  "subtotal": 1000,              // 小計
  "source": "salvation.ancestors", // 資料來源
  "sourceData": [...]            // 具體選擇的人員/祖先資料
}
```

## 活動項目類型

系統支援以下活動項目：

| 項目代碼  | 項目名稱  | 單價 | 資料來源            | 說明                 |
| --------- | --------- | ---- | ------------------- | -------------------- |
| chaodu    | 超度/超薦 | 1000 | salvation.ancestors | 祖先超度             |
| survivors | 陽上人    | 0    | salvation.survivors | 陽上人登記           |
| qifu      | 消災祈福  | 300  | blessing.persons    | 消災祈福             |
| diandeng  | 點燈      | 600  | blessing.persons    | 點燈祈福，含燈種記錄 |
| xiaozai   | 固定消災  | 100  | blessing.persons    | 固定消災             |
| pudu      | 中元普度  | 1200 | blessing.persons    | 中元普度法會         |

### 點燈燈種選項

| 燈種代碼  | 燈種名稱 | 說明                    |
| --------- | -------- | ----------------------- |
| guangming | 光明燈   | 記錄用途，統一價格 $600 |
| taisui    | 太歲燈   | 記錄用途，統一價格 $600 |
| yuanchen  | 元辰燈   | 記錄用途，統一價格 $600 |

## 技術架構

### 前端組件結構

```
JoinRecord.vue (主要視圖)
├── 左側面板 (70%)
│   ├── 已選擇登記表資訊
│   ├── 活動項目選擇區
│   └── 操作按鈕
└── 右側面板 (30%)
    ├── 查詢區
    ├── 登記表列表
    └── 已保存記錄
```

### 狀態管理 (Pinia Store)

- **joinRecordStore.js**: 管理參加記錄的所有狀態和業務邏輯
  - `activityConfigs`: 活動項目配置
  - `selections`: 當前選擇狀態
  - `selectedRegistration`: 已選擇的登記表
  - `totalAmount`: 計算總金額

### 服務層

- **joinRecordService.js**: 處理參加記錄相關的API調用
  - `saveRecord()`: 保存參加記錄
  - 支援多種模式：mock/backend/directus

## 核心功能實現

### 1. 登記表選擇

- 從右側列表選擇祈福登記表
- 支援姓名、手機、電話、地址搜尋
- 顯示登記表基本資訊（聯絡人、祖先數量、消災人數等）

### 2. 活動項目選擇

- 根據登記表資料動態顯示可選項目
- 支援單項選擇和全選功能
- 點燈項目包含燈種選擇（光明燈、太歲燈、元辰燈）
- 燈種選擇為記錄用途，不影響統一價格計算
- 即時計算費用並顯示統計

### 3. 費用計算

- 自動計算各項目小計
- 支援折扣功能
- 浮動顯示總金額統計

### 4. 記錄保存

- 驗證必要欄位
- 生成完整的參加記錄資料
- 支援收據開立和帳務處理

## 用戶介面特色

### 響應式設計

- 桌面版：左右分欄佈局 (70%/30%)
- 平板版：垂直堆疊佈局
- 手機版：單欄顯示，活動項目改為單列

### 浮動金額統計

- 固定在頁面右下角
- 即時顯示選擇項目和總金額
- 支援多種位置配置

### 互動體驗

- 點擊活動標題可全選/取消全選
- 選擇狀態即時反饋
- 載入狀態提示

## 搜尋功能

支援以下欄位的模糊搜尋：

- 聯絡人姓名
- 手機號碼
- 電話號碼
- 地址
- 人員姓名
- 生肖
- 備註

## 資料驗證

### 必要檢查

- 必須選擇祈福登記表
- 至少選擇一個活動項目
- 金額計算正確性

### 業務規則

- 超度項目僅在有祖先資料時顯示
- 陽上人項目價格為0（免費）
- 點燈項目每位人員可選擇燈種（光明燈/太歲燈/元辰燈）
- 燈種選擇不影響價格，統一為 $600/位
- 各項目根據對應的人員資料動態生成

## 技術要點

### 祖先資料驗證邏輯

```javascript
const hasValidAncestors = (registration) => {
  if (!registration || !registration.salvation) return false;

  // 檢查是否有祖先地址
  const hasAddress =
    registration.salvation.address &&
    registration.salvation.address.trim() !== "";

  // 檢查是否有有效的祖先名稱
  const hasValidAncestorNames =
    registration.salvation.ancestors &&
    registration.salvation.ancestors.length > 0 &&
    registration.salvation.ancestors.some(
      (ancestor) => ancestor.surname && ancestor.surname.trim() !== "",
    );

  return hasAddress && hasValidAncestorNames;
};
```

### 點燈功能處理邏輯

```javascript
// 對於點燈類型，計算每個人的燈種價格
if (type === "diandeng") {
  let totalPrice = 0;
  const lampDetails = [];

  sourceData.forEach((person) => {
    const lampType = getPersonLampType(person.id);
    const lampConfig = config.lampTypes[lampType];
    totalPrice += lampConfig.price;
    lampDetails.push({
      personId: person.id,
      personName: person.name,
      lampType: lampType,
      lampTypeLabel: lampConfig.label,
      price: lampConfig.price,
    });
  });

  return {
    // ... 其他欄位
    subtotal: totalPrice,
    lampDetails: lampDetails,
  };
}
```

### 確認對話框實現

```javascript
const { value: notes } = await ElMessageBox.prompt(
  `確認提交以下參加記錄？\n\n活動：${selectedActivity.value?.name}\n聯絡人：${selectedRegistration.value.contact.name}\n總金額：NT$${totalAmount.value}\n\n請在下方備註欄填寫相關說明：`,
  "確認提交參加記錄",
  {
    confirmButtonText: "確認提交",
    //cancelButtonText: "取消",
    inputPlaceholder: "請輸入備註說明（必填）",
    inputValidator: (value) => {
      if (!value || value.trim() === "") {
        return "請填寫備註說明";
      }
      return true;
    },
    inputErrorMessage: "備註說明不能為空",
    type: "warning",
  },
);
```

## 開發注意事項

### 資料同步

- Store狀態與UI保持同步
- 選擇變更時即時更新金額
- 重置功能清空所有選擇

### 效能考量

- 大量資料時使用虛擬滾動
- 搜尋功能防抖處理
- 適當的資料快取策略

### 錯誤處理

- 網路請求失敗處理
- 資料格式驗證
- 用戶友好的錯誤提示

## 未來擴展

### 計劃功能

- 批量處理多筆記錄
- 更多付款方式支援
- 詳細的報表功能
- 與會計系統深度整合

### 技術優化

- 更好的快取策略
- 離線功能支援
- 更豐富的統計圖表
- 行動端專用介面

## 測試建議

1. **祖先資料驗證測試：**
   - 測試 id=108 等沒有填寫祖先名稱和地址的記錄，確認不顯示超度和消災祈福選項
   - 測試有完整祖先資料的記錄，確認正常顯示相關選項
   - 驗證邊界情況：只有地址沒有祖先名稱，或只有祖先名稱沒有地址

2. **點燈功能測試：**
   - 選擇不同人員的不同燈種
   - 確認價格計算正確
   - 驗證提交後資料完整性

3. **活動選擇測試：**
   - 確認活動按日期降序排列
   - 驗證提交後活動選擇保持不變

4. **確認對話框測試：**
   - 測試必填驗證
   - 測試取消操作
   - 確認備註正確傳遞到後端

5. **後端 contact 欄位測試：**
   - 驗證 contact 資料正確儲存
   - 確認查詢時 contact 資料正確回傳

## 相關檔案

### 核心檔案

- `./client/src/views/JoinRecord.vue` - 主要視圖組件
- `./client/src/stores/joinRecordStore.js` - 狀態管理
- `./client/src/services/joinRecordService.js` - 服務層
- `./client/src/data/mock_join_records.json` - 模擬資料

### 配置檔案

- `./client/src/router/index.js` - 路由配置
- `./client/src/stores/menu.js` - 選單配置

### 文件

- `./docs/user-story-參加記錄.md` - 用戶故事
- `./docs/dev-joinRecord-guide.md` - 本開發指南
