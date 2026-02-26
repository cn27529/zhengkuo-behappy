# 活動參加記錄 - 收據打印功能說明

## 功能概述

實現特殊尺寸（128mm x 182mm）直式收據打印功能，支援雙模板切換（感謝狀/收據），採用中文直書排版（writing-mode: vertical-rl），並使用 html-to-image 生成高清圖像打印。

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

### 1. 從列表頁觸發打印

在 `JoinRecordList.vue` 點擊 🖨️ 按鈕（收據打印）：

```javascript
// 收據打印
const handleReceiptPrint = (item) => {
  try {
    const isoStr = DateUtils.getCurrentISOTime();
    const printData = JSON.stringify(item);
    const printId = `receipt_${item.id}_${isoStr}`;

    sessionStorage.setItem(printId, printData);

    router.push({
      path: "/join-record-receipt-print",
      query: { print_id: printId, print_data: printData, iso_str: isoStr },
    });
  } catch (error) {
    console.error("導航到收據頁面失敗:", error);
    ElMessage.error("導航到收據頁面失敗");
  }
};
```

### 2. 數據傳遞方式

同時使用 sessionStorage 和 URL 參數雙重保障：

```javascript
query: {
  print_id: "receipt_123_1234567890",
  print_data: JSON.stringify(record)
}
```

### 3. 收據頁面載入數據

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

## 收據內容結構

### 雙模板設計

系統提供兩種收據模板：

1. **感謝狀模板** (`standard`)：簡潔版本，適用於一般捐款
2. **收據模板** (`stamp`)：正式版本，包含印信處，適用於需要蓋章的正式收據

### 模板切換功能

```html
<template>
  <div class="config-sidebar">
    <p class="label">選擇單據模板：</p>
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

### 感謝狀模板內容

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

### 收據模板內容（含印信處）

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
const handlePostPrintCheck = () => {
  ElMessageBox.confirm("單據是否已成功由打印機完成？", "打印確認", {
    confirmButtonText: "已完成",
    cancelButtonText: "取消打印",
    type: "question",
    center: true,
  })
    .then(() => {
      ElMessage({
        type: "success",
        message: "記錄巳打印完成狀態。",
      });
      // 可擴展：更新後端打印狀態
      // await updatePrintStatus(record.value.id);
    })
    .catch(() => {
      ElMessage({
        type: "info",
        message: "若打印失敗，請檢查打印機連線後重試。",
      });
    });
};
```

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
/* 印章模板專用 */
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
  color: #909399;
  font-size: 8px;
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

根據選擇的模板更新瀏覽器標題：

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
  path: "/join-record-receipt-print",
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

### Q3: 模板切換後樣式錯亂？

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

## 技術亮點

### 1. 雙模板架構

使用 `v-if` 條件渲染實現兩種收據模板，無需重複代碼：

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

巳打印完成後確認機制，可擴展為後端狀態更新：

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

## 未來優化方向

- [✅] 支援雙模板切換（感謝狀/收據）
- [✅] 使用 html-to-image 生成高清圖像
- [✅] 打印後確認機制
- [✅] 動態收據字號生成
- [ ] 支援批量打印多張收據
- [ ] 添加自定義收據編號規則
- [ ] 支援自定義寺廟資訊
- [ ] 添加 QR Code（捐款查詢）
- [ ] 更多收據模板（橫式、A4 等）
- [ ] 打印歷史記錄與狀態追蹤
- [ ] PDF 匯出功能
- [ ] 收據預覽縮放功能

## 相關文件

- [客製收據打印 Web 解決方案](./web-print-guide.md)
- [活動參加記錄系統](./dev-joinRecord-guide.md)
- [活動參加記錄列表](./dev-joinRecord-list-guide.md)
- [收據打印狀態更新](./dev-receipt-print-status-update.md)
