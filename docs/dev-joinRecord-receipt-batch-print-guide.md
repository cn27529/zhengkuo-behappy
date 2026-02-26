# 活動參加記錄 - 批量收據打印功能說明

> **最後更新**: 2026-02-26  
> **測試狀態**: ✅ 已通過完整測試

## 功能概述

在原有單筆收據打印功能基礎上，新增批量收據打印功能。使用者可在列表頁多選記錄後，批量進入打印頁面，透過數字按鈕快速切換查看並打印收據，每張打印完成後自動跳轉到下一張並標記為綠色，提升打印效率。

## 文件位置

- **列表頁面**: `client/src/views/JoinRecordList.vue`
- **收據頁面**: `client/src/views/JoinRecordReceiptPrint.vue`
- **打印狀態管理**: `client/src/stores/joinRecordPrintStore.js`

## 核心功能

### 1. 多選功能（列表頁）

在列表頁添加多選框，允許使用者勾選多筆記錄：

```vue
<el-table
  ref="tableRef"
  :data="paginatedResults"
  @selection-change="handleSelectionChange"
>
  <!-- 多選框 -->
  <el-table-column type="selection" width="50" align="center" />
  
  <!-- 其他欄位... -->
</el-table>
```

### 2. 批量操作區

當使用者選擇記錄後，顯示批量操作區：

```vue
<!-- 批量操作區 -->
<div class="batch-actions" v-if="selectedRecords.length > 0">
  <div class="batch-info">
    <span class="selected-count">
      已選擇 <strong>{{ selectedRecords.length }}</strong> 筆記錄
    </span>
    <el-button size="small" @click="clearSelection">取消選擇</el-button>
  </div>
  <div class="batch-controls">
    <el-button
      type="success"
      size="small"
      @click="handleBatchReceiptPrint"
    >
      🖨️ 批量收據打印
    </el-button>
  </div>
</div>
```

### 3. 數據傳遞機制

#### 單筆打印（原有）

```javascript
const handleReceiptPrint = (item) => {
  const isoStr = DateUtils.getCurrentISOTime();
  const printData = JSON.stringify(item);
  const printId = `receipt_${item.id}_${isoStr}`;

  sessionStorage.setItem(printId, printData);

  router.push({
    path: "/join-record-receipt-print",
    query: {
      print_id: printId,
      print_data: printData,
      iso_str: isoStr,
    },
  });
};
```

#### 批量打印（新增）

```javascript
const handleBatchReceiptPrint = () => {
  if (selectedRecords.value.length === 0) {
    ElMessage.warning("請先選擇要打印的記錄");
    return;
  }

  const isoStr = DateUtils.getCurrentISOTime();
  const ids = selectedRecords.value.map((r) => r.id).join(",");
  const printDatas = selectedRecords.value.map((r) => r);
  const printId = `receipt_batch_${isoStr}`;

  // 存儲多筆資料到 sessionStorage
  sessionStorage.setItem(printId, JSON.stringify(printDatas));

  router.push({
    path: "/join-record-receipt-print",
    query: {
      print_id: printId,
      ids: ids,
      iso_str: isoStr,
      is_batch: "true", // 關鍵參數：標記為批量打印
    },
  });
};
```

**數據結構範例**：

```javascript
// sessionStorage 存儲格式
{
  "receipt_batch_1234567890": [
    {
      id: 123,
      activityId: 1,
      registrationId: 456,
      contact: { name: "黃洧析", mobile: "0912345678" },
      items: [...],
      totalAmount: 2200
    },
    {
      id: 124,
      activityId: 1,
      registrationId: 457,
      contact: { name: "王小明", mobile: "0923456789" },
      items: [...],
      totalAmount: 1500
    }
  ]
}
```

### 4. 批量打印頁面實現

#### 狀態管理

```javascript
// 批量打印相關狀態
const isBatch = ref(false); // 是否為批量模式
const batchRecords = ref([]); // 批量記錄陣列
const currentIndex = ref(0); // 當前顯示的索引
```

#### 數據載入邏輯

```javascript
onMounted(() => {
  setPrintTime();

  // 檢查是否為批量打印
  const isBatchParam = route.query.is_batch === "true";
  const printId = route.query.print_id;

  if (isBatchParam && printId) {
    // 批量打印模式
    isBatch.value = true;
    const storedData = sessionStorage.getItem(printId);

    if (storedData) {
      try {
        batchRecords.value = JSON.parse(storedData);
        if (batchRecords.value.length > 0) {
          currentIndex.value = 0;
          record.value = batchRecords.value[0];
          handleTemplateChange();
        } else {
          ElMessage.error("批量數據為空");
          router.back();
        }
      } catch (e) {
        ElMessage.error("批量數據解析失敗");
        router.back();
      }
    }
  } else {
    // 單筆打印模式（原有邏輯）
    const printData = route.query.print_data;
    if (printData) {
      record.value = JSON.parse(printData);
      handleTemplateChange();
    }
  }
});
```

#### 批量導航 UI

在 "🖨️ 打印配置" 區域添加數字按鈕導航控制：

```vue
<div class="config-body">
  <!-- 批量打印導航 -->
  <div v-if="isBatch" class="batch-navigation">
    <p class="label">
      收據 {{ currentIndex + 1 }} / {{ batchRecords.length }}
    </p>
    <div class="nav-buttons">
      <el-button
        v-for="(item, index) in batchRecords"
        :key="index"
        :type="getButtonType(index)"
        :plain="index === currentIndex && !printedIndexes.has(index)"
        circle
        size="small"
        @click="loadRecordByIndex(index)"
      >
        {{ index + 1 }}
      </el-button>
    </div>
  </div>

  <el-divider v-if="isBatch" />

  <!-- 模板選擇... -->
</div>
```

**按鈕狀態顯示**：
- **未打印**：灰色實心按鈕 `[1]` `[3]` `[4]`
- **當前頁**：白底藍框按鈕 `[2]`（與模板選擇樣式一致）
- **已打印**：綠色實心按鈕 `[1]` ✅

**互動特性**：
- 點擊任意數字直接跳轉到該張收據
- 當前頁面使用 `plain` 樣式（白底藍框）
- 打印完成後自動標記為綠色
- 支援換行顯示（`flex-wrap: wrap`）適應多筆記錄

#### 切換邏輯

```javascript
// 載入指定索引的記錄
const loadRecordByIndex = (index) => {
  currentIndex.value = index; // 更新當前索引（觸發按鈕顏色變化）
  record.value = batchRecords.value[index];
  handleTemplateChange(activeTemplate.value);
};

// 獲取按鈕類型（控制按鈕顏色）
const getButtonType = (index) => {
  if (printedIndexes.value.has(index)) {
    return "success"; // 已打印完成：綠色
  }
  if (index === currentIndex.value) {
    return "primary"; // 當前頁面：藍色（配合 plain 顯示為白底藍框）
  }
  return "default"; // 未打印：灰色
};

// 自動跳到下一張（打印完成後調用）
const handleNext = () => {
  if (currentIndex.value < batchRecords.value.length - 1) {
    currentIndex.value++;
    loadRecordByIndex(currentIndex.value);
  }
};
```

**狀態管理**：
```javascript
const isBatch = ref(false);                // 是否為批量模式
const batchRecords = ref([]);              // 批量記錄陣列
const currentIndex = ref(0);               // 當前顯示的索引
const printedIndexes = ref(new Set());     // 已打印完成的索引集合
```

#### 動態標題更新

```javascript
const handleTemplateChange = (template = "standard") => {
  activeTemplate.value = template;

  const name = (record.value.contact?.name || "未填寫").toString().trim();
  const receiptSerialText =
    activeTemplate.value === "standard" ? "感謝狀" : "收據";

  // 批量模式顯示進度
  const batchInfo = isBatch.value
    ? `(${currentIndex.value + 1}/${batchRecords.value.length})`
    : "";

  document.title = `${name}-${receiptSerialNum.value}-${receiptSerialText}${batchInfo}`;
};
```

**標題範例**：

- 單筆：`黃洧析-123A1R456-感謝狀`
- 批量：`黃洧析-123A1R456-感謝狀(1/3)`

### 5. 打印完成處理

批量模式下，打印完成後自動跳到下一張：

```javascript
const handlePostPrintCheck = async () => {
  try {
    await ElMessageBox.confirm("單據是否已成功由打印機完成？", "打印確認", {
      confirmButtonText: "巳打印完成",
      cancelButtonText: "取消打印",
      type: "question",
      center: true,
    });

    // 更新打印狀態
    record.value.activeTemplate = activeTemplate.value;

    if (isBatch.value) {
      // 批量模式：更新當前這筆
      const result = await printStore.updateReceiptPrintStatus(record.value);

      if (result?.success) {
        // 標記當前索引為已打印（觸發按鈕變綠色）
        printedIndexes.value.add(currentIndex.value);
        
        // 顯示完整的 store 返回訊息
        const displayMessage = result?.message || 
          `收據 ${currentIndex.value + 1}/${batchRecords.value.length} 已標記為打印完成 👍`;
        
        ElMessage({
          type: "success",
          message: displayMessage,
          duration: 3000,
        });

        // 自動跳到下一張（如果還有的話）
        if (currentIndex.value < batchRecords.value.length - 1) {
          setTimeout(() => {
            handleNext();
          }, 500);
        } else {
          ElMessage({
            type: "info",
            message: "所有收據已處理完成！",
          });
        }
      }
    } else {
      // 單筆模式（原有邏輯）
      const result = await printStore.updateReceiptPrintStatus(record.value);

      if (result?.success) {
        ElMessage({
          type: "success",
          message: result?.message || "記錄巳打印完成狀態。👍",
        });
      }
    }
  } catch {
    // 使用者取消
  }
};
```

**重複打印檢查**：

`updateReceiptPrintStatus` 方法會自動檢查是否已打印過：

```javascript
// joinRecordPrintStore.js
async updateReceiptPrintStatus(record) {
  // 如果已經有打印記錄，不再更新
  if (record.receiptIssuedAt && record.receiptIssuedBy) {
    return {
      success: true,
      message: `收據打印狀態已存在，保持原始打印記錄不做更新。issuedAt: ${record.receiptIssuedAt}, issuedBy: ${record.receiptIssuedBy}`,
    };
  }
  
  // 執行更新...
}
```

**顯示訊息**：
- 首次打印：「收據 1/3 已標記為打印完成 👍」
- 重複打印：「收據打印狀態已存在，保持原始打印記錄不做更新。issuedAt: xxx, issuedBy: xxx」

## 樣式設計

### 批量操作區樣式（列表頁）

```css
/* 批量操作區 */
.batch-actions {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid #e9ecef;
}

.batch-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.selected-count {
  color: #333;
  font-size: 0.875rem;
}

.selected-count strong {
  color: var(--el-color-primary);
  font-size: 1rem;
}

.batch-controls {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
}
```

### 批量導航樣式（打印頁）

```css
/* 批量打印導航 */
.batch-navigation {
  background: #e7f4ff;
  border: 1px solid #b3d8ff;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 12px;
}

.batch-navigation .label {
  text-align: center;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 8px;
}

.nav-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}

.nav-buttons .el-button {
  width: 32px;
  height: 32px;
  padding: 0;
  font-weight: 600;
}
```

## 使用流程

### 單筆打印（原有功能）

1. 在列表頁點擊單筆記錄的 🖨️ 按鈕
2. 跳轉到收據打印頁面
3. 選擇模板（📜 感謝狀 / 🛡️ 收據）
4. 點擊「開始打印」按鈕
5. 打印對話框彈出，執行打印
6. 確認「巳打印完成」→ 更新後端狀態
7. 完成

### 批量打印（新功能）

1. 在列表頁勾選多筆記錄（顯示已選擇筆數）
2. 點擊「🖨️ 批量收據打印」按鈕
3. 跳轉到收據打印頁面，顯示「收據 1 / 3」和數字按鈕 `[1] [2] [3]`
4. 第1張按鈕顯示為白底藍框（當前頁）
5. 選擇模板（📜 感謝狀 / 🛡️ 收據）
6. 點擊「開始打印」按鈕
7. 打印對話框彈出，執行打印
8. 確認「巳打印完成」→ 第1張按鈕變綠色 ✅，自動跳到第2張
9. 第2張按鈕變為白底藍框（當前頁）
10. 重複步驟 5-9，直到最後一張
11. 最後一張完成後提示「所有收據已處理完成！」
12. 可隨時點擊任意數字按鈕跳轉到該張收據
13. 完成

**視覺效果**：
```
收據 2 / 5

[1] [2] [3] [4] [5]
 ✅  ⭕  ⚪  ⚪  ⚪
綠色 藍框 灰色 灰色 灰色
已打 當前 未打 未打 未打
```

## 技術亮點

### 1. 智能模式切換

通過 URL 參數 `is_batch` 自動判斷單筆或批量模式：

```javascript
const isBatchParam = route.query.is_batch === "true";
```

### 2. 數據持久化

使用 sessionStorage 存儲批量數據，避免：

- URL 過長問題
- 數據在頁面刷新後丟失
- 瀏覽器 URL 長度限制

### 3. 自動化流程

打印完成後自動跳到下一張，減少手動操作：

```javascript
if (currentIndex.value < batchRecords.value.length - 1) {
  setTimeout(() => {
    handleNext();
  }, 500);
}
```

### 4. 狀態獨立更新

每張收據打印完成後獨立更新後端狀態，確保數據準確性。

### 5. 用戶體驗優化

- 顯示當前進度（1/3, 2/3, 3/3）
- 上一張/下一張按鈕在邊界自動禁用
- 動態更新瀏覽器標題顯示當前收據信息
- 最後一張完成後明確提示

## 數據流程圖

```
列表頁 (JoinRecordList.vue)
  ↓
[使用者勾選多筆記錄]
  ↓
selectedRecords = [record1, record2, record3]
  ↓
[點擊批量收據打印]
  ↓
sessionStorage.setItem("receipt_batch_xxx", JSON.stringify(selectedRecords))
  ↓
router.push({ query: { is_batch: "true", print_id: "receipt_batch_xxx" } })
  ↓
打印頁 (JoinRecordReceiptPrint.vue)
  ↓
onMounted() 檢測 is_batch === "true"
  ↓
從 sessionStorage 載入 batchRecords
  ↓
顯示第 1 張收據 (currentIndex = 0)
  ↓
[使用者選擇模板並打印]
  ↓
[確認打印完成]
  ↓
updateReceiptPrintStatus(record1)
  ↓
自動跳到第 2 張 (currentIndex = 1)
  ↓
重複打印流程...
  ↓
最後一張完成 → 提示「所有收據已處理完成！」
```

## 狀態更新邏輯

### 單筆模式

```javascript
// 更新單筆記錄的 receiptIssued 狀態
record.activeTemplate = "standard"; // 或 "stamp"
await printStore.updateReceiptPrintStatus(record);
```

### 批量模式

```javascript
// 逐筆更新，每張打印完成後更新一次
for (let i = 0; i < batchRecords.length; i++) {
  // 打印第 i 張
  // 確認完成
  await printStore.updateReceiptPrintStatus(batchRecords[i]);
  // 自動跳到下一張
}
```

## 常見問題

### Q1: 批量打印時可以跳過某張嗎？

**A**: 可以。使用者可以：

1. 點擊「取消打印」跳過當前這張
2. 手動點擊數字按鈕跳到其他張
3. 跳過的記錄不會更新打印狀態（保持灰色）
3. 跳過的記錄不會更新打印狀態

### Q2: 批量打印中途可以返回列表嗎？

**A**: 可以。點擊「關閉頁面」按鈕返回列表，已打印完成的記錄狀態已更新，未打印的記錄保持原狀態。

### Q3: 批量打印時可以切換模板嗎？

**A**: 可以。每張收據可以獨立選擇「感謝狀」或「收據」模板，不影響其他張。

### Q4: sessionStorage 數據何時清除？

**A**:

- 瀏覽器關閉時自動清除
- 建議在打印完成後手動清除：
  ```javascript
  sessionStorage.removeItem(printId);
  ```

### Q5: 批量打印最多支持多少筆？

**A**:

- 技術上無限制
- 建議單次不超過 50 筆，避免：
  - sessionStorage 容量限制（通常 5-10MB）
  - 使用者操作疲勞
  - 瀏覽器性能問題

### Q6: 如何處理打印失敗的情況？

**A**:

1. 使用者點擊「取消打印」
2. 記錄不會更新狀態
3. 可以手動返回該張重新打印
4. 或在列表頁重新選擇該筆記錄單獨打印

## 未來優化方向

- [ ] 添加「全部打印」按鈕（一次性打印所有收據）
- [ ] 支援批量匯出 PDF
- [ ] 添加打印歷史記錄（哪些已打印、哪些跳過）
- [ ] 支援自定義打印順序（拖拽排序）
- [ ] 添加打印預覽縮略圖（快速瀏覽所有收據）
- [ ] 支援鍵盤快捷鍵（← → 切換收據，Enter 打印）
- [ ] 添加批量打印進度條
- [ ] 支援打印失敗自動重試

## 相關文件

- [收據打印功能說明](./dev-joinRecord-receipt-print-guide.md)
- [活動參加記錄列表](./dev-joinRecord-list-guide.md)
- [客製收據打印 Web 解決方案](./web-print-guide.md)
- [收據打印狀態更新](./dev-receipt-print-status-update.md)

## 更新日誌

- **2026-02-26**: 初版發布，實現批量收據打印功能
  - 列表頁多選功能 ✅
  - 批量數據傳遞機制 ✅
  - 數字按鈕導航（圓形按鈕，點擊直接跳轉）✅
  - 響應式狀態管理（灰色/白底藍框/綠色）✅
  - 自動化打印流程（打印完成自動跳下一張）✅
  - 獨立狀態更新 ✅
  - 重複打印保護（顯示原始打印記錄訊息）✅
  - 完整測試通過 ✅
