# 收據打印狀態更新 - 實現總結

## 修改文件清單

### 1. Service 層

#### ✅ client/src/services/joinRecordService.js

- 新增 `updateByReceiptPrint(record)` 方法
- 導入 `authService` 用於獲取當前用戶

#### ✅ client/src/rustServices/rustJoinRecordService.js

- 新增 `updateByReceiptPrint(record, context)` 方法
- 導入 `authService` 用於獲取當前用戶

### 2. Adapter 層

#### ✅ client/src/adapters/serviceAdapter.js

- 在 `joinRecordMethods` 陣列中新增 `"updateByReceiptPrint"`
- 在 `joinRecordService` proxy 的 methods 中新增 `"updateByReceiptPrint"`

### 3. Store 層

#### ✅ client/src/stores/joinRecordPrintStore.js (新建)

- 定義 `joinRecordPrint` store
- 實現 `updateReceiptPrintStatus(record)` action
- 實現 `resetState()` action
- 狀態管理：`isUpdating`, `lastUpdateResult`

### 4. View 層

#### ✅ client/src/views/JoinRecordReceiptPrint.vue

- 導入 `useJoinRecordPrintStore`
- 更新 `handlePostPrintCheck()` 方法實現狀態更新
- 添加錯誤處理和用戶反饋

### 5. 文檔

#### ✅ docs/dev-receipt-print-status-update.md (新建)

- 功能概述
- 資料庫欄位說明
- 實現架構
- 收據編號規則
- 更新流程圖
- 錯誤處理
- 測試要點

## 功能流程

```
使用者點擊「開始打印」
    ↓
打印對話框顯示
    ↓
使用者完成打印並關閉對話框
    ↓
觸發 onPrintDialogClose 回調
    ↓
顯示確認對話框：「單據是否已成功由打印機完成？」
    ↓
使用者點擊「已完成」
    ↓
調用 printStore.updateReceiptPrintStatus(record)
    ↓
通過 serviceAdapter 調用對應的 service
    ↓
更新資料庫欄位：
  - needReceipt: "false" 是否需要收據
  - receiptNumber: "{id}A{activityId}R{registrationId}"
  - receiptIssued: "" 收據已開立。經20260225決定修改定義默認為空值，值等於 "standard" 是 "感謝狀", "stamp" 是 "收據"，空值表示：未打印"收據"或"感謝狀"。
  - receiptIssuedAt: ISO 時間戳
  - receiptIssuedBy: 當前用戶
    ↓
顯示成功訊息
```

## 更新的欄位

| 欄位            | 更新值                               | 說明           |
| --------------- | ------------------------------------ | -------------- |
| needReceipt     | "true"                               | 是否需要收據   |
| receiptNumber   | "{id}A{activityId}R{registrationId}" | 收據編號       |
| receiptIssued   | "stamp"                              | 標記收據已開立 |
| receiptIssuedAt | ISO 時間戳                           | 收據開立時間   |
| receiptIssuedBy | 當前用戶                             | 收據開立者     |

## 收據編號範例

```javascript
// record.id = 123
// record.activityId = 1
// record.registrationId = 456
// 生成: "123A1R456"
```

## 雙後端支援

### Directus 後端

- 使用 `joinRecordService.updateByReceiptPrint(record)`
- 通過 `updateParticipationRecord(id, data)` 更新

### Rust Axum 後端

- 使用 `rustJoinRecordService.updateByReceiptPrint(record, context)`
- 通過 `updateParticipationRecord(id, data, context)` 更新
- 額外傳遞 `operation: "updateByReceiptPrint"` 用於日誌

## 錯誤處理

### 1. 記錄 ID 缺失

```javascript
if (!record?.id) {
  return { success: false, message: "缺少記錄 ID" };
}
```

### 2. 更新失敗

```javascript
if (result?.success) {
  ElMessage.success("已記錄打印完成狀態。");
} else {
  ElMessage.warning(result?.message || "狀態更新失敗，但打印已完成。");
}
```

### 3. 使用者取消

```javascript
.catch(() => {
  ElMessage.info("若打印失敗，請檢查打印機連線後重試。");
});
```

## 測試檢查清單

- [ ] 打印完成後確認對話框正常顯示
- [ ] 點擊「已完成」後資料庫欄位正確更新
- [ ] 收據編號格式正確（{id}A{activityId}R{registrationId}）
- [ ] 時間戳記使用 ISO 格式
- [ ] 正確記錄當前操作者
- [ ] 點擊「取消打印」不更新資料
- [ ] 更新失敗時顯示警告訊息
- [ ] Directus 後端正常運作
- [ ] Rust Axum 後端正常運作
- [ ] Store 狀態正確管理（isUpdating, lastUpdateResult）

## 使用範例

### 在 Vue 組件中使用

```vue
<script setup>
import { useJoinRecordPrintStore } from "../stores/joinRecordPrintStore.js";

const printStore = useJoinRecordPrintStore();
const record = ref({ id: 123, activityId: 1, registrationId: 456 });

// 更新收據狀態
const updateStatus = async () => {
  const result = await printStore.updateReceiptPrintStatus(record.value);

  if (result?.success) {
    console.log("更新成功");
  } else {
    console.error("更新失敗:", result?.message);
  }
};

// 重置狀態
const reset = () => {
  printStore.resetState();
};
</script>
```

### 直接使用 serviceAdapter

```javascript
import { serviceAdapter } from "../adapters/serviceAdapter.js";

const record = { id: 123, activityId: 1, registrationId: 456 };
const result = await serviceAdapter.updateByReceiptPrint(record);
```

## 相關文件

- [收據打印功能說明](./dev-joinRecord-receipt-print-guide.md)
- [收據打印狀態更新](./dev-receipt-print-status-update.md)
- [活動參加記錄系統](./dev-joinRecord-guide.md)
