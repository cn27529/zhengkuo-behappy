# 活動參加記錄 - 收據打印功能說明

## 功能概述

實現特殊尺寸（130mm x 181mm）直式感謝狀收據打印功能，採用中文直書排版（writing-mode: vertical-rl）。

## 文件位置

- **收據頁面**: `client/src/views/JoinRecordReceipt.vue`
- **列表頁面**: `client/src/views/JoinRecordList.vue`
- **路由配置**: `client/src/router/index.js`

## 技術規格

### 紙張尺寸
- **實測尺寸**: 130mm (寬) x 181mm (高)
- **對應標準**: 接近 JIS B6 (128mm x 182mm)
- **打印邊距**: 5mm

### 核心技術
- **打印庫**: Print.js
- **排版方式**: CSS `writing-mode: vertical-rl`（中文直書）
- **字體**: 標楷體 (Kaiti, STKaiti, 標楷體, DFKai-SB)

## 使用流程

### 1. 從列表頁觸發打印

在 `JoinRecordList.vue` 點擊 📄 按鈕：

```javascript
const handleReceipt = (item) => {
  const printData = JSON.stringify(item);
  const printId = `receipt_${item.id}_${Date.now()}`;
  
  sessionStorage.setItem(printId, printData);
  
  router.push({
    path: "/join-record-receipt",
    query: { print_id: printId }
  });
};
```

### 2. 數據傳遞方式

支援兩種方式：

**方式一：sessionStorage**
```javascript
query: { print_id: "receipt_123_1234567890" }
```

**方式二：URL 參數**
```javascript
query: { print_data: JSON.stringify(record) }
```

### 3. 收據頁面載入數據

```javascript
onMounted(() => {
  const printId = route.query.print_id;
  const printData = route.query.print_data;

  if (printData) {
    record.value = JSON.parse(printData);
  } else if (printId) {
    const data = sessionStorage.getItem(printId);
    record.value = JSON.parse(data);
    sessionStorage.removeItem(printId);
  }
});
```

## 收據內容結構

### 顯示欄位

```vue
<div class="receipt-canvas">
  <!-- 標題 -->
  <h1 class="title">感謝狀</h1>

  <!-- 主要內容 -->
  <div class="content-section">
    <!-- 捐款人姓名 -->
    <div class="donor-info">
      兹收到 <span class="highlight">{{ contactName }}</span>
    </div>

    <!-- 功德項目明細 -->
    <div class="items-detail">
      功德項目：
      <span v-for="item in record.items">
        {{ item.label }}({{ item.subtotal }})
      </span>
    </div>

    <!-- 總金額（中文大寫） -->
    <div class="total-amount">
      共計新台幣：<span class="highlight">{{ totalAmountChinese }}</span>
    </div>

    <!-- 地址 -->
    <div class="address-info">
      住址：{{ contactAddress }}
    </div>

    <!-- 祝福語 -->
    <div class="blessing">功德無量，特此致謝</div>
  </div>

  <!-- 寺廟資訊 -->
  <div class="temple-info">
    財團法人鎮國基金會<br />
    地址：南投縣集集鎮廣明里鎮國巷101號<br />
    電話：(049) 2762726<br />
    董事長：釋廣心（游天木）<br />
    經手人：釋徹空
  </div>

  <!-- 日期（民國紀年） -->
  <div class="footer-info">
    中華民國 {{ rocYear }} 年 {{ currentMonth }} 月 {{ currentDay }} 日
  </div>
</div>
```

## 核心功能實現

### 1. 金額轉中文大寫

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

### 2. 民國紀年計算

```javascript
const rocYear = computed(() => new Date().getFullYear() - 1911);
const currentMonth = computed(() => new Date().getMonth() + 1);
const currentDay = computed(() => new Date().getDate());
```

**範例**：2026-02-21 → 中華民國 115 年 2 月 21 日

### 3. Print.js 打印配置

```javascript
const handlePrint = () => {
  printJS({
    printable: "receipt-canvas",  // 指定打印區域 ID
    type: "html",                 // 打印類型
    targetStyles: ["*"],          // 保留所有樣式
    style: `
      @page { 
        size: 130mm 181mm; 
        margin: 5mm; 
      }
      .receipt-canvas {
        width: 130mm;
        height: 181mm;
        padding: 15mm;
        font-family: "Kaiti", "STKaiti", "標楷體", "DFKai-SB", serif;
        writing-mode: vertical-rl;
        text-orientation: mixed;
        line-height: 2;
      }
    `
  });
};
```

## CSS 樣式設計

### 直式排版核心

```css
.receipt-canvas {
  writing-mode: vertical-rl;      /* 垂直書寫，從右到左 */
  text-orientation: mixed;        /* 文字方向混合 */
  line-height: 2;                 /* 行高 */
}
```

### 螢幕預覽樣式

```css
@media screen {
  .print-wrapper {
    background: #e0e0e0;          /* 灰色背景 */
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
  }

  .receipt-canvas {
    background: #ffe6f0;          /* 粉紅色收據底色 */
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
  }
}
```

### 打印樣式

```css
@media print {
  @page {
    size: 130mm 181mm;
    margin: 5mm;
  }

  /* 隱藏頁面其他元素 */
  body * {
    visibility: hidden;
  }

  /* 只顯示收據區塊 */
  .receipt-canvas,
  .receipt-canvas * {
    visibility: visible;
  }

  .receipt-canvas {
    position: absolute;
    left: 0;
    top: 0;
    box-shadow: none;
  }
}
```

### 佈局定位

```css
/* 標題 */
.title {
  font-size: 28pt;
  letter-spacing: 10px;
  margin-left: 10mm;
}

/* 主要內容 */
.content-section {
  font-size: 14pt;
  margin-right: 10mm;
}

/* 寺廟資訊（左側邊欄） */
.temple-info {
  position: absolute;
  left: 15mm;
  top: 70%;
  transform: translateY(-50%);
  font-size: 8pt;
  border-right: 1px solid #333;
  padding-right: 8mm;
}

/* 日期（底部） */
.footer-info {
  position: absolute;
  bottom: 10mm;
  left: 10mm;
  writing-mode: horizontal-tb;    /* 日期橫向顯示 */
  font-size: 8pt;
}
```

## 打印機設定

### 自定義紙張尺寸

1. 點擊「🖨️ 打印」按鈕
2. 在打印對話框選擇「更多設定」
3. 紙張尺寸選擇「自訂」
4. 輸入尺寸：
   - 寬度：130mm
   - 高度：181mm
5. 確認打印

### 建議設定

- **方向**: 直向
- **邊距**: 最小邊距或無邊距
- **縮放**: 100%
- **背景圖形**: 啟用（如需粉紅底色）

## 路由配置

```javascript
// router/index.js
{
  path: "/join-record-receipt",
  title: "收據打印",
  component: () => import("../views/JoinRecordReceipt.vue"),
  meta: { requiresAuth: true }
}
```

## 依賴套件

```json
{
  "dependencies": {
    "print-js": "^1.6.0"
  }
}
```

安裝指令：
```bash
npm install print-js
```

## 數據結構

### 輸入數據格式

```javascript
{
  id: 123,
  activityId: 1,
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
  createdAt: "2026-02-21T13:00:00Z"
}
```

## 常見問題

### Q1: 打印時顯示空白？
**A**: 確認 `receipt-canvas` 有設定 `id` 屬性，且 Print.js 正確導入。

### Q2: 直式排版沒有生效？
**A**: 檢查 CSS 是否包含 `writing-mode: vertical-rl` 和 `text-orientation: mixed`。

### Q3: 紙張尺寸不正確？
**A**: 在打印對話框手動設定自定義紙張尺寸為 130mm x 181mm。

### Q4: 金額轉換錯誤？
**A**: 檢查 `convertToChinese()` 函數邏輯，確保數字格式正確。

### Q5: 寺廟資訊位置偏移？
**A**: 調整 `.temple-info` 的 `top` 和 `transform` 屬性。

## 未來優化方向

- [ ] 支援批量打印多張收據
- [ ] 添加收據編號（流水號）
- [ ] 支援自定義寺廟資訊
- [ ] 添加 QR Code（捐款查詢）
- [ ] 支援不同收據模板切換
- [ ] 打印歷史記錄
- [ ] PDF 匯出功能

## 相關文件

- [客製收據打印 Web 解決方案](./print-130mm-181mm-guide.md)
- [活動參加記錄系統](./dev-joinRecord-guide.md)
