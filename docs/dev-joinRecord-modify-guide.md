# 參加記錄功能調適指南

## 修改日期
2026-01-27

## 修改項目

### 1. 修復點燈功能錯誤
**問題：** 點燈功能報錯 `lampTypeSelection is not defined`

**原因：** `joinRecordStore.js` 中的 `createParticipationItem` 函數使用了未定義的 `lampTypeSelection` 變數

**解決方案：**
- 修改 `createParticipationItem` 函數，移除對 `lampTypeSelection.value` 的引用
- 改為遍歷每個選中的人員，使用 `getPersonLampType(person.id)` 獲取各自的燈種選擇
- 計算每個人的燈種價格，並在返回物件中包含 `lampDetails` 陣列記錄詳細資訊

**修改文件：**
- `client/src/stores/joinRecordStore.js`

### 2. 活動選擇排序優化
**需求：** 活動下拉選項按日期降序排列，最新活動排在最前面

**修改內容：**
- 將 `availableActivities` 計算屬性中的排序邏輯從升序改為降序
- 修改：`new Date(a.date) - new Date(b.date)` → `new Date(b.date) - new Date(a.date)`

**修改文件：**
- `client/src/views/JoinRecord.vue` (第 731 行)

### 3. 保留活動選擇狀態
**需求：** 提交表單後不重置已選中的活動

**修改內容：**
- 在 `handleSubmitRecord` 函數中移除 `selectedActivityId.value = null;`
- 保留 `joinRecordStore.resetSelections();` 來重置其他選擇項目

**修改文件：**
- `client/src/views/JoinRecord.vue`

### 4. 添加提交確認對話框
**需求：** 提交前顯示確認對話框，並要求填寫備註

**實現功能：**
- 使用 `ElMessageBox.prompt` 顯示確認對話框
- 顯示活動名稱、聯絡人、總金額等資訊
- 強制要求填寫備註說明（必填驗證）
- 將備註傳遞給後端儲存

**修改內容：**
1. **前端 Vue 組件：**
   - 修改 `handleSubmitRecord` 函數，添加確認對話框
   - 添加備註驗證邏輯
   - 處理取消操作

2. **Store 層：**
   - 修改 `submitRecord` 方法接收 `notes` 參數
   - 在 payload 中添加 `notes` 欄位

**修改文件：**
- `client/src/views/JoinRecord.vue`
- `client/src/stores/joinRecordStore.js`

### 5. 後端 contact 欄位支援
**需求：** 在 Rust 後端添加 `contact` 欄位支援

**修改內容：**
1. **Model 層：**
   - 在 `ParticipationRecord` 結構體中添加 `contact` 欄位
   - 在各個請求/響應結構體中添加 `contact` 欄位
   - 使用與 `items` 相同的 JSON 序列化處理

2. **Handler 層：**
   - 在查詢語句中添加 `contact` 欄位
   - 在創建和更新邏輯中處理 `contact` 欄位

**修改文件：**
- `rust-axum/src/models/participation_record.rs`
- `rust-axum/src/handlers/participation_record.rs`

## 技術要點

### 點燈功能處理邏輯
```javascript
// 對於點燈類型，計算每個人的燈種價格
if (type === "diandeng") {
  let totalPrice = 0;
  const lampDetails = [];
  
  sourceData.forEach(person => {
    const lampType = getPersonLampType(person.id);
    const lampConfig = config.lampTypes[lampType];
    totalPrice += lampConfig.price;
    lampDetails.push({
      personId: person.id,
      personName: person.name,
      lampType: lampType,
      lampTypeLabel: lampConfig.label,
      price: lampConfig.price
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
    cancelButtonText: "取消",
    inputPlaceholder: "請輸入備註說明（必填）",
    inputValidator: (value) => {
      if (!value || value.trim() === "") {
        return "請填寫備註說明";
      }
      return true;
    },
    inputErrorMessage: "備註說明不能為空",
    type: "warning",
  }
);
```

## 測試建議

1. **點燈功能測試：**
   - 選擇不同人員的不同燈種
   - 確認價格計算正確
   - 驗證提交後資料完整性

2. **活動選擇測試：**
   - 確認活動按日期降序排列
   - 驗證提交後活動選擇保持不變

3. **確認對話框測試：**
   - 測試必填驗證
   - 測試取消操作
   - 確認備註正確傳遞到後端

4. **後端 contact 欄位測試：**
   - 驗證 contact 資料正確儲存
   - 確認查詢時 contact 資料正確回傳
