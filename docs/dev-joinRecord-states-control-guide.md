# 參加記錄狀態控制台開發指南

## 概述

參加記錄狀態控制台 (`JoinRecordStatesControl.vue`) 是一個專門用於批量管理參加記錄狀態的管理介面，允許管理員快速調整記錄的各項狀態。

## 功能特性

### 1. 狀態管理

控制台支援管理以下 5 個狀態欄位：

| 欄位 | 說明 | 可選值 |
|------|------|--------|
| `state` | 記錄狀態 | pending(待處理)、confirmed(已確認)、completed(已完成) |
| `paymentState` | 付款狀態 | unpaid(未付款)、paid(已付款) |
| `receiptIssued` | 收據狀態 | false(未開立)、true(已開立) |
| `accountingState` | 會計狀態 | pending(待處理)、reconciled(已對帳) |
| `paymentMethod` | 付款方式 | 空(未選擇)、cash(現金)、transfer(銀行轉帳)、card(信用卡) |

### 2. 操作模式

#### 單筆操作
- 在表格中直接修改狀態下拉選單
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
  state: { label: "記錄狀態", options: [...] },
  paymentState: { label: "付款狀態", options: [...] },
  receiptIssued: { label: "收據狀態", options: [...] },
  accountingState: { label: "會計狀態", options: [...] },
  paymentMethod: { label: "付款方式", options: [...] }
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
    ├── 記錄資訊欄位
    ├── 狀態下拉選單 x5
    └── 單筆保存按鈕
```

## 使用流程

### 單筆更新流程

1. 進入狀態控制台頁面
2. 輸入查詢條件，點擊「查詢」
3. 在表格中找到要修改的記錄
4. 直接修改該行的狀態下拉選單
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
  const index = searchResults.value.findIndex(r => r.id === recordId);
  if (index !== -1) {
    searchResults.value[index] = {
      ...searchResults.value[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
  }
  return { success: true, message: "狀態更新成功 (Mock 模式)" };
}
```

### Directus 模式

在 Directus 模式下，會調用 `joinRecordService.updateParticipationRecord()` 方法。

```javascript
// 單筆更新
const result = await joinRecordService.updateParticipationRecord(recordId, updates);

// 批量更新（並行調用）
const results = await Promise.all(
  recordIds.map(id => joinRecordService.updateParticipationRecord(id, updates))
);
```

## 路由配置

```javascript
{
  path: "/join-record-states",
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
  path: "/join-record-states",
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
  return authStore.hasRole('accountant') || authStore.hasRole('admin');
});
```

## 注意事項

1. **狀態一致性**：修改狀態時要注意業務邏輯的一致性，例如：
   - 收據已開立時，付款狀態應該是已付款
   - 會計已對帳時，付款狀態應該是已付款

2. **批量操作**：批量更新時只會更新選中的狀態欄位，未選擇的欄位保持原值

3. **修改追蹤**：每次狀態修改都會更新 `updatedAt` 時間戳

4. **分頁處理**：
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
