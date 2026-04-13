# 參加記錄收據打印 - 功能說明

> **最後更新**: 2026-02-26  
> **測試狀態**: ✅ 已通過完整測試

## 概述說明

實現特殊尺寸（128mm x 182mm）直式收據打印功能，支援雙模版切換（感謝狀/收據），採用中文直書排版（writing-mode: vertical-rl），並使用 html-to-image 生成高清圖像打印。

本文檔涵蓋：

- **單筆打印**：從列表頁點擊單筆記錄進行打印
- **批量打印**：多選記錄後批量進入打印頁面，透過數字按鈕快速切換並打印，每張打印完成後自動跳轉到下一張

## 文件位置

- **收據頁面**: `client/src/views/JoinRecordReceiptPrint.vue`
- **列表頁面**: `client/src/views/JoinRecordList.vue`
- **路由配置**: `client/src/router/index.js`

## 技術規格

### 紙張尺寸

- **實測尺寸**: 128mm (寬) x 182mm (高)
- **對應標準**: JIS B6 (128mm x 182mm)
- **打印邊距**: 無 (None)

### 核心技術

- **圖像生成**: html-to-image (pixelRatio: 6)
- **打印庫**: Print.js
- **排版方式**: CSS `writing-mode: vertical-rl`（中文直書）
- **字體**: 標楷體 (Kaiti TC, Apple LiSung, 標楷體, DFKai-SB, Noto Serif TC)

## 使用流程

### 單筆打印流程

#### 1. 從列表頁觸發打印

在 `JoinRecordList.vue` 點擊單筆記錄的 🖨️ 按鈕（收據打印）：

```javascript
// 收據打印
const handleReceiptPrint = (item) => {
  try {
    const isoStr = DateUtils.getCurrentISOTime();
    const printData = JSON.stringify(item);
    const printId = `print_receipt_${item.id}`;

    sessionStorage.setItem(printId, printData);

    router.push({
      path: "/receipt-print",
      query: { print_id: printId, print_data: printData, iso_str: isoStr },
    });
  } catch (error) {
    console.error("導航到收據頁面失敗:", error);
    ElMessage.error("導航到收據頁面失敗");
  }
};
```

#### 2. 數據傳遞方式

同時使用 sessionStorage 和 URL 參數雙重保障：

```javascript
query: {
  print_id: "receipt_123_1234567890",
  print_data: JSON.stringify(record)
}
```

#### 3. 收據頁面載入數據

```javascript
onMounted(() => {
  // 開啟全螢幕 Loading
  const loading = ElLoading.service({
    lock: true,
    text: "正在準備收據資料...",
    background: "rgba(240, 242, 245, 1)",
  });

  setPrintTime();
  const printData = route.query.print_data;
  if (printData) {
    try {
      record.value = JSON.parse(printData);
      handleTemplateChange();
    } catch (e) {
      ElMessage.error("數據解析失敗");
    }
  }

  // 延遲 1.5 秒確保渲染完成
  setTimeout(() => {
    loading.close();
  }, 1500);

  if (!record.value.id) router.back();
});
```

#### 4. 單筆打印完整流程

1. 在列表頁點擊單筆記錄的 🖨️ 按鈕
2. 跳轉到收據打印頁面
3. 選擇模版（📜 感謝狀 / 🛡️ 收據）
4. 點擊「開始打印」按鈕
5. 打印對話框彈出，執行打印
6. 確認「打印完成」→ 更新後端狀態
7. 完成

### 批量打印流程

#### 1. 列表頁多選功能

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

#### 2. 批量操作區

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
      🖨️ 批量打印
    </el-button>
  </div>
</div>
```

#### 3. 批量數據傳遞

```javascript
const handleBatchReceiptPrint = () => {
  if (selectedRecords.value.length === 0) {
    ElMessage.warning("請先選擇要打印的記錄");
    return;
  }

  const isoStr = DateUtils.getCurrentISOTime();
  const ids = selectedRecords.value.map((r) => r.id).join(",");
  const printDatas = JSON.stringify(selectedRecords.value.map((r) => r));
  const printId = `print_receipt_${ids}`;

  // 存儲多筆資料到 sessionStorage
  sessionStorage.setItem(printId, printDatas);

  router.push({
    path: "/receipt-print",
    query: {
      print_id: printId,
      ids: ids,
      iso_str: isoStr,
      is_batch: "true", // 關鍵參數：標記為批量打印
      is_merged: "false",
      print_type: "batch_print",
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

#### 4. 批量模式數據載入

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

#### 5. 批量導航 UI

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

  <!-- 模版選擇... -->
</div>
```

**按鈕狀態顯示**：

- **未打印**：灰色實心按鈕 `[1]` `[3]` `[4]`
- **當前頁**：白底藍框按鈕 `[2]`（與模版選擇樣式一致）
- **已打印**：綠色實心按鈕 `[1]` ✅

**互動特性**：

- 點擊任意數字直接跳轉到該張收據
- 當前頁面使用 `plain` 樣式（白底藍框）
- 打印完成後自動標記為綠色
- 支援換行顯示（`flex-wrap: wrap`）適應多筆記錄

#### 6. 切換邏輯

```javascript
// 批量打印相關狀態
const isBatch = ref(false); // 是否為批量模式
const batchRecords = ref([]); // 批量記錄陣列
const currentIndex = ref(0); // 當前顯示的索引
const printedIndexes = ref(new Set()); // 已打印完成的索引集合

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

#### 7. 動態標題更新

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

#### 8. 批量打印完整流程

1. 在列表頁勾選多筆記錄（顯示已選擇筆數）
2. 點擊「🖨️ 批量打印」按鈕
3. 跳轉到收據打印頁面，顯示「收據 1 / 3」和數字按鈕 `[1] [2] [3]`
4. 第1張按鈕顯示為白底藍框（當前頁）
5. 選擇模版（📜 感謝狀 / 🛡️ 收據）
6. 點擊「開始打印」按鈕
7. 打印對話框彈出，執行打印
8. 確認「打印完成」→ 第1張按鈕變綠色 ✅，自動跳到第2張
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

## 收據內容結構

### 雙模版設計

系統提供兩種收據模版：

1. **感謝狀模版** (`standard`)：簡潔版本，適用於一般捐款
2. **收據模版** (`stamp`)：正式版本，包含印信處，適用於需要蓋章的正式收據

### 模版切換功能

```html
<template>
  <div class="config-sidebar">
    <p class="label">選擇單據模版：</p>
    <el-radio-group v-model="activeTemplate" class="template-radio">
      <el-radio
        @click="handleTemplateChange('standard')"
        label="standard"
        border
      >
        📜 感謝狀
      </el-radio>
      <el-radio @click="handleTemplateChange('stamp')" label="stamp" border>
        🛡️ 收據
      </el-radio>
    </el-radio-group>
  </div>
</template>

<script setup>
  const activeTemplate = ref("standard");

  const handleTemplateChange = (template = "standard") => {
    activeTemplate.value = template;
    const name = (record.value.contact?.name || "未填寫").toString().trim();
    const receiptSerialText =
      activeTemplate.value === "standard" ? "感謝狀" : "收據";
    document.title = `${name}-${receiptSerialNum.value}-${receiptSerialText}`;
  };
</script>
```

### 感謝狀模版內容

```html
<div v-if="activeTemplate === 'standard'" class="receipt-canvas font-kaiti">
  <div class="title-group">
    <h1 class="title">感謝狀</h1>
    <div class="receipt-serial">佛字第 {{ receiptSerialNum }} 號</div>
  </div>

  <div class="content-section">
    <div class="donor-info">
      茲收到 <span class="highlight">{{ contactName }}</span>
    </div>
    <div class="items-detail">
      功德項目：
      <span v-for="(item, idx) in record.items" :key="idx" class="highlight">
        {{ item.label }}({{ item.subtotal }})&nbsp;&nbsp;
      </span>
    </div>
    <div class="total-amount">
      共計新台幣：<span class="highlight">{{ totalAmountChinese }}</span>
    </div>
    <div v-if="contactAddress" class="address-info">
      住址：<span class="highlight">{{ contactAddress }}</span>
    </div>
    <div class="blessing">功德無量，特此致謝</div>
  </div>

  <div class="temple-info">
    <span class="temple-subtitle highlight">鎮國寺</span><br />
    地址：南投縣集集鎮廣明里鎮國巷101號<br />
    電話：(O四九) 二七六二七二六<br />
    經手人：釋徹空
  </div>

  <div class="footer-info">
    中華民國 {{ rocYear }} 年 {{ currentMonth }} 月 {{ currentDay }} 日
  </div>
</div>
```

### 收據模版內容（含印信處）

```html
<div v-else class="receipt-canvas font-kaiti stamp-layout">
  <!-- 標題與字號 -->
  <div class="title-group">
    <h1 class="title">收據</h1>
    <div class="receipt-serial">佛字第 {{ receiptSerialNum }} 號</div>
  </div>

  <div class="content-section">
    <div class="donor-info">
      茲收到 <span class="highlight">{{ contactName }}</span> 大德
    </div>
    <!-- 功德項目、金額、地址等內容同感謝狀 -->

    <!-- 印信處 -->
    <div class="seal-container">
      <div class="seal-box">財團法人鎮國基金會印信處</div>
    </div>

    <div class="temple-info">
      <span class="temple-subtitle highlight">財團法人鎮國基金會</span><br />
      會址：南投縣集集鎮廣明里鎮國巷101號<br />
      電話：(O四九) 二七六二七二六<br />
      董事長：釋廣心（游天木）<br />
      經手人：釋徹空
    </div>
  </div>
</div>
```

### 收據字號生成

```javascript
const receiptSerialNum = computed(() => {
  return record.value.id
    ? `${record.value.id}A${record.value.activityId}R${record.value.registrationId}`
    : "00000000";
});
```

**範例**：`123A1R456` (參加ID: 123, 活動ID: 1, 登記ID: 456)

## 核心功能實現

### 1. html-to-image 高清打印

使用 html-to-image 將 HTML 轉換為高清圖像後打印，確保字體和排版完美呈現：

```javascript
import * as htmlToImage from "html-to-image";
import printJS from "print-js";

const handlePrintWithHtmlToImage = async () => {
  const node = document.getElementById("receipt-capture-area");
  const loading = ElLoading.service({
    text: "正在生成高清圖像...",
    background: "rgba(240, 242, 245, 1)",
  });

  try {
    printing.value = true;
    await document.fonts.ready; // 等待字體載入
    await new Promise((resolve) => setTimeout(resolve, 400)); // Mac 渲染延遲

    const dataUrl = await htmlToImage.toPng(node, {
      pixelRatio: 6, // 高清晰度
      backgroundColor: "#ffffff",
      cacheBust: true,
      includeGraphics: true,
    });

    printJS({
      printable: dataUrl,
      type: "image",
      style:
        "@page { size: 128mm 182mm; margin: 0; } img { width: 100%; height: 100%; }",
      imageStyle: "width:100%;",
      onPrintDialogClose: () => {
        handlePostPrintCheck();
      },
    });

    ElMessage.success("已傳送至打印預覽");
  } catch (error) {
    console.error("打印失敗:", error);
    ElMessage.error("轉換失敗，請重新嘗試");
  } finally {
    loading.close();
    printing.value = false;
  }
};
```

### 2. 打印後確認機制

```javascript
const handlePostPrintCheck = async () => {
  try {
    await ElMessageBox.confirm("單據是否已成功由打印機完成？", "打印確認", {
      confirmButtonText: "打印完成",
      //cancelButtonText: "取消打印",
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
        const displayMessage =
          result?.message ||
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
          message: result?.message || "記錄打印完成狀態。👍",
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

### 3. 金額轉中文大寫

```javascript
const convertToChinese = (num) => {
  const digits = ["零", "壹", "貳", "參", "肆", "伍", "陸", "柒", "捌", "玖"];
  const units = ["", "拾", "佰", "仟", "萬"];

  if (num === 0) return "零";

  const str = num.toString();
  let result = "";
  let len = str.length;

  for (let i = 0; i < len; i++) {
    const digit = parseInt(str[i]);
    const unit = units[len - i - 1];

    if (digit !== 0) {
      result += digits[digit] + unit;
    } else if (result && !result.endsWith("零")) {
      result += "零";
    }
  }

  return result.replace(/零+$/, "");
};

// 使用範例
const totalAmountChinese = computed(() => {
  const amount = record.value.totalAmount || 0;
  return convertToChinese(amount) + "元整";
});
```

**轉換範例**：

- 1200 → 壹仟貳佰元整
- 2500 → 貳仟伍佰元整
- 10000 → 壹萬元整

### 4. 民國紀年計算

```javascript
const rocYear = computed(() => new Date().getFullYear() - 1911);
const currentMonth = computed(() => new Date().getMonth() + 1);
const currentDay = computed(() => new Date().getDate());
```

**範例**：2026-02-24 → 中華民國 115 年 2 月 24 日

### 5. 打印時間戳記

```javascript
import { DateUtils } from "../utils/dateUtils.js";

const printTime = ref("");

const setPrintTime = () => {
  printTime.value = DateUtils.getCurrentTimestamp();
};
```

## CSS 樣式設計

### 字體設定

```css
/* 全域字體定義 */
@import url("https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@700&display=swap");

.font-kaiti {
  font-family:
    "Kaiti TC", "Apple LiSung", "標楷體", "DFKai-SB", "Noto Serif TC", serif !important;
}

/* 確保收據內所有元素繼承楷體 */
.receipt-canvas * {
  font-family: inherit !important;
}
```

### 頁面佈局

```css
/* 雙欄佈局：左側預覽 + 右側配置 */
.print-page-container {
  display: flex;
  min-height: 100vh;
  background-color: #333;
}

/* 左側預覽區 */
.preview-section {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  overflow-y: auto;
}

/* 右側配置側邊欄 */
.config-sidebar {
  width: 320px;
  background: #fff;
  border-left: 1px solid #dcdfe6;
  display: flex;
  flex-direction: column;
  padding: 24px;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.05);
}
```

### 收據畫布

```css
.receipt-canvas {
  width: 128mm;
  height: 182mm;
  padding: 12mm 10mm;
  box-sizing: border-box;
  position: relative;
  writing-mode: vertical-rl; /* 垂直書寫，從右到左 */
  -webkit-writing-mode: vertical-rl;
  border: 0.2pt solid #333;
  background-color: #ffffff;
}
```

### 標題與字號佈局

```css
.title-group {
  display: grid;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  margin-left: 10mm;
  margin-right: 5mm;
  height: 100%;
}

.title {
  font-size: 28pt;
  font-weight: bold;
  text-align: center;
  letter-spacing: 12px;
  margin: 0;
}

.receipt-serial {
  font-size: 10pt;
  margin-top: 100mm; /* 標題與字號間距 */
  letter-spacing: 2px;
  font-weight: normal;
  white-space: nowrap;
}
```

### 印信處樣式

```css
/* 印章模版專用 */
.seal-container {
  position: absolute;
  left: 10mm;
  top: 55mm;
}

.seal-box {
  width: 35mm;
  height: 35mm;
  border: 0.5pt dashed #f6a7a7;
  color: #f6a7a7;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 14pt;
  opacity: 0.5;
  padding: 5px;
}
```

### 寺廟資訊與頁腳

```css
/* 寺廟資訊（左側邊欄） */
.temple-info {
  position: absolute;
  left: 10mm;
  bottom: 28mm;
  font-size: 9.5pt;
  border-right: 1.5px solid #000;
  padding-right: 3mm;
  line-height: 1.6;
}

.temple-subtitle {
  font-size: 14pt;
  font-weight: bold;
  text-align: center;
  letter-spacing: 5px;
}

/* 日期（底部） */
.footer-info {
  position: absolute;
  left: 10mm;
  bottom: 10mm;
  writing-mode: horizontal-tb; /* 日期橫向顯示 */
  font-size: 10pt;
  font-weight: bold;
}

/* 打印時間戳記 */
.print-meta {
  position: absolute;
  left: 10mm;
  bottom: 5mm;
  writing-mode: horizontal-tb;
  font-size: 8px;
  color: #666;
}
```

### 配置側邊欄

```css
.template-radio {
  margin: 20px 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.print-tips {
  background: #fdf6ec;
  border: 1px solid #faecd8;
  padding: 12px;
  border-radius: 4px;
  font-size: 13px;
  color: #e6a23c;
  line-height: 1.6;
}

.config-footer {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.full-width {
  width: 100%;
  margin-left: 0 !important;
}
```

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

## 打印機設定

### 推薦設定

在打印對話框中設定：

- **紙張尺寸**: JIS B6 (128mm x 182mm)
- **方向**: 直向
- **邊距**: 無 (None)
- **縮放**: 100%
- **背景圖形**: 啟用

### 自定義紙張尺寸（若無 JIS B6 選項）

1. 點擊「開始打印」按鈕
2. 在打印對話框選擇「更多設定」
3. 紙張尺寸選擇「自訂」
4. 輸入尺寸：
   - 寬度：128mm
   - 高度：182mm
5. 確認打印

## 使用者體驗優化

### 1. 載入動畫

頁面載入時顯示 1.5 秒 Loading，確保字體和樣式完全渲染：

```javascript
onMounted(() => {
  const loading = ElLoading.service({
    lock: true,
    text: "正在準備收據資料...",
    background: "rgba(240, 242, 245, 1)",
  });

  setTimeout(() => {
    loading.close();
  }, 1500);
});
```

### 2. 打印前等待

確保字體載入和 Mac 渲染完成：

```javascript
await document.fonts.ready;
await new Promise((resolve) => setTimeout(resolve, 400));
```

### 3. 動態標題

根據選擇的模版更新瀏覽器標題：

```javascript
const handleTemplateChange = (template) => {
  activeTemplate.value = template;
  const name = record.value.contact?.name || "未填寫";
  const receiptSerialText = template === "standard" ? "感謝狀" : "收據";
  document.title = `${name}-${receiptSerialNum.value}-${receiptSerialText}`;
};
```

### 4. 打印提示

右側配置欄提供清晰的打印設定提示：

```html
<div class="print-tips">
  <p><strong>提醒：</strong></p>
  <ul>
    <li>紙張：JIS B6 128mm (寬) x 182mm (高)</li>
    <li>縮放：100%</li>
    <li>邊距：無 (None)</li>
  </ul>
</div>
```

## 路由配置

```javascript
// router/index.js
{
  path: "/receipt-print",
  title: "收據打印",
  component: () => import("../views/JoinRecordReceiptPrint.vue"),
  meta: { requiresAuth: true }
}
```

## 依賴套件

```json
{
  "dependencies": {
    "html-to-image": "^1.11.11",
    "print-js": "^1.6.0"
  }
}
```

安裝指令：

```bash
npm install html-to-image print-js
```

## 數據結構

### 輸入數據格式

```javascript
{
  id: 123,
  activityId: 1,
  registrationId: 456,
  contact: {
    name: "黃洧析",
    mobile: "0912345678",
    relationship: "本人"
  },
  items: [
    {
      label: "點燈",
      quantity: 1,
      subtotal: 1200,
      sourceAddress: "彰化縣員林市新生路..."
    },
    {
      label: "新春法會",
      quantity: 1,
      subtotal: 1000
    }
  ],
  totalAmount: 2200,
  createdAt: "2026-02-24T13:00:00Z"
}
```

## 常見問題

### 單筆打印相關

### Q1: 為什麼使用 html-to-image 而不是直接打印 HTML？

**A**: html-to-image 可以：

- 確保字體完美呈現（特別是標楷體）
- 避免瀏覽器打印時的樣式差異
- 生成高清圖像（pixelRatio: 6）
- 更好的跨平台兼容性（Mac/Windows）

### Q2: 打印時顯示空白或模糊？

**A**:

1. 確認 `receipt-capture-area` ID 正確
2. 檢查 `pixelRatio` 設定（建議 6）
3. 確保 `await document.fonts.ready` 執行完成
4. Mac 用戶增加延遲時間（400ms）

### Q3: 模版切換後樣式錯亂？

**A**: 使用 `v-if` 而非 `v-show` 確保 DOM 完全重新渲染：

```html
<div v-if="activeTemplate === 'standard'">...</div>
<div v-else>...</div>
```

### Q4: 印信處位置不正確？

**A**: 調整 `.seal-container` 的 `left` 和 `top` 屬性：

```css
.seal-container {
  position: absolute;
  left: 10mm; /* 調整左右位置 */
  top: 55mm; /* 調整上下位置 */
}
```

### Q5: 打印後確認對話框沒有出現？

**A**: 確認 Print.js 配置包含 `onPrintDialogClose` 回調：

```javascript
printJS({
  // ...其他配置
  onPrintDialogClose: () => {
    handlePostPrintCheck();
  },
});
```

### Q6: 字體沒有顯示為標楷體？

**A**:

1. 確認 CSS 使用 `!important` 覆蓋全域樣式
2. 檢查字體 fallback 順序
3. Mac 使用 "Kaiti TC" 或 "Apple LiSung"
4. Windows 使用 "標楷體" 或 "DFKai-SB"

### 批量打印相關

### Q7: 批量打印時可以跳過某張嗎？

**A**: 可以。使用者可以：

1. 點擊「取消打印」跳過當前這張
2. 手動點擊數字按鈕跳到其他張
3. 跳過的記錄不會更新打印狀態（保持灰色）

### Q8: 批量打印中途可以返回列表嗎？

**A**: 可以。點擊「關閉頁面」按鈕返回列表，已打印完成的記錄狀態已更新，未打印的記錄保持原狀態。

### Q9: 批量打印時可以切換模版嗎？

**A**: 可以。每張收據可以獨立選擇「感謝狀」或「收據」模版，不影響其他張。

### Q10: sessionStorage 數據何時清除？

**A**:

- 瀏覽器關閉時自動清除
- 建議在打印完成後手動清除：
  ```javascript
  sessionStorage.removeItem(printId);
  ```

### Q11: 批量打印最多支持多少筆？

**A**:

- 技術上無限制
- 建議單次不超過 50 筆，避免：
  - sessionStorage 容量限制（通常 5-10MB）
  - 使用者操作疲勞
  - 瀏覽器性能問題

### Q12: 如何處理打印失敗的情況？

**A**:

1. 使用者點擊「取消打印」
2. 記錄不會更新狀態
3. 可以手動返回該張重新打印
4. 或在列表頁重新選擇該筆記錄單獨打印

## 技術亮點

### 1. 雙模版架構

使用 `v-if` 條件渲染實現兩種收據模版，無需重複代碼：

```html
<div v-if="activeTemplate === 'standard'" class="receipt-canvas font-kaiti">
  <!-- 感謝狀內容 -->
</div>
<div v-else class="receipt-canvas font-kaiti stamp-layout">
  <!-- 收據內容 -->
</div>
```

### 2. 高清圖像生成

使用 `pixelRatio: 6` 生成 6 倍解析度圖像，確保打印品質：

```javascript
const dataUrl = await htmlToImage.toPng(node, {
  pixelRatio: 6,
  backgroundColor: "#ffffff",
  cacheBust: true,
  includeGraphics: true,
});
```

### 3. 字體載入等待

確保字體完全載入後再生成圖像：

```javascript
await document.fonts.ready;
await new Promise((resolve) => setTimeout(resolve, 400));
```

### 4. 打印狀態追蹤

打印完成後確認機制，可擴展為後端狀態更新：

```javascript
const handlePostPrintCheck = () => {
  ElMessageBox.confirm("單據是否已成功由打印機完成？", "打印確認", {
    // ...配置
  }).then(() => {
    // 可擴展：await updatePrintStatus(record.value.id);
  });
};
```

### 5. 響應式側邊欄

左右分欄佈局，左側預覽、右側配置，提升使用體驗：

```css
.print-page-container {
  display: flex;
  min-height: 100vh;
}

.preview-section {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.config-sidebar {
  width: 320px;
  background: #fff;
}
```

### 6. 智能模式切換

通過 URL 參數 `is_batch` 自動判斷單筆或批量模式：

```javascript
const isBatchParam = route.query.is_batch === "true";
```

### 7. 數據持久化

使用 sessionStorage 存儲批量數據，避免：

- URL 過長問題
- 數據在頁面刷新後丟失
- 瀏覽器 URL 長度限制

### 8. 自動化流程

打印完成後自動跳到下一張，減少手動操作：

```javascript
if (currentIndex.value < batchRecords.value.length - 1) {
  setTimeout(() => {
    handleNext();
  }, 500);
}
```

### 9. 狀態獨立更新

每張收據打印完成後獨立更新後端狀態，確保數據準確性。

## 未來優化方向

- [✅] 支援雙模版切換（感謝狀/收據）
- [✅] 使用 html-to-image 生成高清圖像
- [✅] 打印後確認機制
- [✅] 動態收據字號生成
- [✅] 支援批量打印多張收據
- [✅] 數字按鈕導航（圓形按鈕，點擊直接跳轉）
- [✅] 響應式狀態管理（灰色/白底藍框/綠色）
- [✅] 自動化打印流程（打印完成自動跳下一張）
- [✅] 獨立狀態更新
- [✅] 重複打印保護（顯示原始打印記錄訊息）
- [ ] 添加「全部打印」按鈕（一次性打印所有收據）
- [ ] 支援批量匯出 PDF
- [ ] 添加打印歷史記錄（哪些已打印、哪些跳過）
- [ ] 支援自定義打印順序（拖拽排序）
- [ ] 添加打印預覽縮略圖（快速瀏覽所有收據）
- [ ] 支援鍵盤快捷鍵（← → 切換收據，Enter 打印）
- [ ] 添加批量打印進度條
- [ ] 支援打印失敗自動重試
- [ ] 添加自定義收據編號規則
- [ ] 支援自定義寺廟資訊
- [ ] 添加 QR Code（捐款查詢）
- [ ] 更多收據模版（橫式、A4 等）
- [ ] 打印歷史記錄與狀態追蹤
- [ ] PDF 匯出功能
- [ ] 收據預覽縮放功能

## 相關文件

- [客製收據打印 Web 解決方案](./web-print-guide.md)
- [參加記錄系統](./dev-joinRecord-guide.md)
- [參加記錄列表](./dev-joinRecord-list-guide.md)
- [收據打印狀態更新](./dev-receipt-print-status-update.md)

## 更新日誌

- **2026-02-26**: 合併單筆與批量打印功能文檔
  - 單筆打印功能 ✅
  - 批量打印功能 ✅
  - 列表頁多選功能 ✅
  - 批量數據傳遞機制 ✅
  - 數字按鈕導航（圓形按鈕，點擊直接跳轉）✅
  - 響應式狀態管理（灰色/白底藍框/綠色）✅
  - 自動化打印流程（打印完成自動跳下一張）✅
  - 獨立狀態更新 ✅
  - 重複打印保護（顯示原始打印記錄訊息）✅
  - 完整測試通過 ✅
