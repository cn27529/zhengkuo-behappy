# 參加記錄狀態控制台 - 開發指南

## 概述說明

參加記錄狀態控制台 (`JoinRecordStatesControl.vue`) 是一個專門用於批量管理參加記錄狀態的管理介面，允許管理員快速調整記錄的各項狀態。

## 功能特性

### 1. 狀態管理

控制台支援管理以下 7 個欄位：

| 欄位              | 說明     | 可選值                                                   |
| ----------------- | -------- | -------------------------------------------------------- |
| `needReceipt`     | 需要收據 | 0(否)、1(是)                                             |
| `notes`           | 備註     | 文字內容（點擊「...」按鈕編輯）                          |
| `state`           | 記錄狀態 | pending(待處理)、confirmed(已確認)、completed(已完成)    |
| `paymentState`    | 付款狀態 | unpaid(未付款)、paid(已付款)                             |
| `receiptIssued`   | 收據狀態 | 空(未打印)、standard(感謝狀)、stamp(收據)                |
| `accountingState` | 會計狀態 | pending(待處理)、reconciled(已對帳)                      |
| `paymentMethod`   | 付款方式 | 空(未選擇)、cash(現金)、transfer(銀行轉帳)、card(信用卡) |

**注意**：

- `receiptIssued` 於 2026-02-25 修改定義：空值表示未打印，`standard` 表示已打印感謝狀，`stamp` 表示已打印收據
- `needReceipt` 控制是否需要開立收據（開關按鈕）
- `receiptNumber` 為唯讀欄位，顯示已生成的收據編號（格式：`26029999` 或 `A26029999`）

### 2. 操作模式

#### 單筆操作

- 在表格中直接修改狀態下拉選單
- 點擊備註欄位的「...」按鈕可編輯備註內容（使用 `ElMessageBox.prompt`）
- 點擊該行的「保存」按鈕儲存變更
- 修改後按鈕會從「已保存」變為「保存」狀態

#### 批量操作

- 使用表格左側的多選框選擇多筆記錄
- 在批量操作區設定要更新的狀態
- 點擊「批量保存」一次更新所有選中的記錄

### 3. 查詢功能

支援以下查詢條件：

- 關鍵字搜尋（姓名、手機、電話、地址、關係、參加項目、備註）
- 項目類型篩選（超度/超薦、點燈、消災祈福等）

## 技術架構

### Store 擴展

在 `joinRecordQueryStore.js` 中新增：

```javascript
// 狀態欄位配置
const stateConfigs = computed(() => ({
  needReceipt: {
    label: "需要收據",
    options: [
      { value: "1", label: "是" },
      { value: "0", label: "否" }
    ]
  },
  state: {
    label: "記錄狀態",
    options: [
      { value: "", label: "未選擇" },
      { value: "pending", label: "待處理" },
      { value: "confirmed", label: "已確認" },
      { value: "completed", label: "已完成" }
    ]
  },
  paymentState: {
    label: "付款狀態",
    options: [
      { value: "", label: "未選擇" },
      { value: "unpaid", label: "未付款" },
      { value: "paid", label: "已付款" }
    ]
  },
  receiptIssued: {
    label: "己開立收據",
    options: [
      { value: "", label: "未選擇" },
      { value: "standard", label: "感謝狀" },
      { value: "stamp", label: "收據" }
    ]
  },
  accountingState: {
    label: "會計狀態",
    options: [
      { value: "", label: "未選擇" },
      { value: "pending", label: "待處理" },
      { value: "reconciled", label: "已對帳" }
    ]
  },
  paymentMethod: {
    label: "付款方式",
    options: [
      { value: "", label: "未選擇" },
      { value: "cash", label: "現金" },
      { value: "transfer", label: "銀行轉帳" },
      { value: "card", label: "信用卡" }
    ]
  }
}));

// 更新單筆記錄狀態
const updateRecordStates = async (recordId, updates) => { ... }

// 批量更新多筆記錄狀態
const batchUpdateRecordStates = async (recordIds, updates) => { ... }
```

### 組件結構

```
JoinRecordStatesControl.vue
├── 查詢區
│   ├── 搜尋輸入框
│   ├── 項目類型篩選
│   └── 查詢/清空按鈕
├── 批量操作區（選中記錄時顯示）
│   ├── 選中數量顯示
│   ├── 批量狀態設定下拉選單 x5
│   └── 批量保存按鈕
└── 結果表格
    ├── 多選框
    ├── 記錄ID + 需要收據開關
    ├── 聯絡人資訊
    ├── 參加項目
    ├── 備註（固定寬度100px，點擊「...」按鈕編輯）
    ├── 佛字第（唯讀，顯示已生成編號）
    ├── 收據狀態下拉選單（未打印/感謝狀/收據）
    ├── 付款狀態下拉選單
    ├── 會計狀態下拉選單
    ├── 付款方式下拉選單
    └── 單筆保存按鈕
```

## 使用流程

### 單筆更新流程

1. 進入狀態控制台頁面
2. 輸入查詢條件，點擊「查詢」
3. 在表格中找到要修改的記錄
4. 直接修改該行的狀態下拉選單，或點擊備註欄位的「...」按鈕編輯備註
5. 點擊該行的「保存」按鈕
6. 系統顯示更新成功訊息

### 批量更新流程

1. 進入狀態控制台頁面
2. 輸入查詢條件，點擊「查詢」
3. 勾選要批量更新的記錄（可多選）
4. 在批量操作區設定要更新的狀態（可設定多個狀態）
5. 點擊「批量保存」按鈕
6. 確認批量更新對話框
7. 系統顯示批量更新結果

## API 調用

### Mock 模式

在 Mock 模式下，狀態更新只會修改本地數據，不會實際調用後端 API。

```javascript
// Mock 模式更新
if (serviceAdapter.getIsMock()) {
  // 更新本地 searchResults
  const index = searchResults.value.findIndex((r) => r.id === recordId);
  if (index !== -1) {
    searchResults.value[index] = {
      ...searchResults.value[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
  }
  return { success: true, message: "狀態更新成功 (Mock 模式)" };
}
```

### Directus 模式

在 Directus 模式下，會調用 `joinRecordService.updateParticipationRecord()` 方法。

```javascript
// 單筆更新
const result = await joinRecordService.updateParticipationRecord(
  recordId,
  updates,
);

// 批量更新（並行調用）
const results = await Promise.all(
  recordIds.map((id) =>
    joinRecordService.updateParticipationRecord(id, updates),
  ),
);
```

## 路由配置

```javascript
{
  path: "/states-control",
  title: "參加記錄狀態控制台",
  name: "JoinRecordStatesControl",
  component: () => import("../views/JoinRecordStatesControl.vue"),
  beforeEnter: (to, from, next) => {
    const pageStateStore = usePageStateStore();
    pageStateStore.clearPageState("joinRecordStates");
    next();
  },
  meta: { requiresAuth: true }
}
```

## 菜單配置

```javascript
{
  id: 11,
  name: "狀態控制台",
  path: "/states-control",
  icon: "⚙️",
  component: "JoinRecordStatesControl",
  requiredAuth: true,
  order: 11,
  enabled: true,
  publish: true
}
```

## 權限控制

目前所有登入用戶都可以訪問狀態控制台。未來可以根據需求添加角色權限控制：

```javascript
// 未來可擴展的權限檢查
const canEditAccountingState = computed(() => {
  return authStore.hasRole("accountant") || authStore.hasRole("admin");
});
```

## 注意事項

1. **備註編輯**（2026-03-03 新增）：
   - 備註欄位固定寬度 100px，過長文字會自動截斷顯示
   - 點擊「...」按鈕會彈出 `ElMessageBox.prompt` 輸入框
   - 編輯後需點擊該行的「保存」按鈕才會實際更新到資料庫
   - 備註內容會與其他狀態欄位一起保存

2. **狀態一致性**：修改狀態時要注意業務邏輯的一致性，例如：
   - 收據已開立（`receiptIssued` 為 `standard` 或 `stamp`）時，付款狀態應該是已付款
   - 會計已對帳時，付款狀態應該是已付款
   - 需要收據（`needReceipt` 為 `1`）但未打印時，`receiptIssued` 應為空值

3. **收據狀態說明**（2026-02-25 更新）：
   - 空值（`""`）：未打印收據或感謝狀
   - `"standard"`：已打印感謝狀
   - `"stamp"`：已打印收據
   - 此欄位由打印頁面自動更新，不建議手動修改

4. **佛字第**：
   - `receiptNumber` 為唯讀欄位，由系統自動生成
   - 格式：收據 `26029999`（年月+流水號），感謝狀 `A26029999`（加前綴A）
   - 詳見 [收據編號生成機制說明](./dev-joinRecord-receiptNumber-guide.md)

5. **批量操作**：批量更新時只會更新選中的狀態欄位，未選擇的欄位保持原值

6. **修改追蹤**：每次狀態修改都會更新 `updatedAt` 時間戳

7. **分頁處理**：
   - 桌面版：支援分頁，預設每頁 10 筆
   - 手機版：顯示全部結果，不分頁

## 未來擴展

1. **狀態變更歷史**：記錄每次狀態變更的歷史
2. **批量匯出**：支援將查詢結果匯出為 Excel
3. **進階篩選**：增加日期範圍、金額範圍等篩選條件
4. **狀態統計**：顯示各狀態的統計數據
5. **權限細分**：不同角色可編輯不同的狀態欄位

## 相關文件

- [參加記錄資料結構說明](./mock-participationRecords.md)
- [參加記錄開發指南](./dev-joinRecord-guide.md)
- [參加記錄查詢開發指南](./dev-joinRecord-list-guide.md)
- [收據打印功能說明](./dev-joinRecord-receipt-print-guide.md)
- [收據編號生成機制說明](./dev-joinRecord-receiptNumber-guide.md) ⭐ 新增
