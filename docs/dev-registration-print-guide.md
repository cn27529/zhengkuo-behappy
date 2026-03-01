# 祈福登記打印預覽功能開發指南

> **最後更新**: 2026-02-27  
> **文件路徑**: `client/src/views/RegistrationPrint.vue`

## 功能概述

祈福登記打印預覽頁面提供已提交表單的詳細內容查看和打印功能，支援多種格式下載（PDF、Excel、JSON、圖片、文字檔），採用響應式佈局設計。

## 核心功能

### 1. 打印預覽

- **完整內容展示**: 聯絡人信息、消災祈福、超度祈福
- **結構化顯示**: 使用表格清晰呈現各項資料
- **打印優化**: 專門的打印樣式，確保打印效果
- **響應式佈局**: 桌面版左右分欄，手機版上下堆疊

### 2. 打印功能

- **瀏覽器打印**: 使用 `window.print()` 觸發打印對話框
- **打印前後處理**: 自動隱藏控制欄，打印完成後恢復
- **自動標題**: 動態設置瀏覽器標題為「聯絡人姓名-祈福登記表」

### 3. 下載功能（預留）

- **PDF 下載**: 使用瀏覽器打印功能生成 PDF
- **Excel 下載**: 生成 CSV 格式的 Excel 檔案
- **JSON 下載**: 匯出完整的 JSON 數據
- **圖片下載**: 使用 html2canvas 生成 PNG 圖片
- **文字檔下載**: 生成純文字格式的 TXT 檔案

## 技術架構

### 頁面佈局

```vue
<div class="print-page-container">
  <!-- 左側預覽區 -->
  <div class="preview-section">
    <div class="print-registration">
      <div class="print-content" id="print-content">
        <!-- 打印內容 -->
      </div>
    </div>
  </div>

  <!-- 右側控制欄 -->
  <div class="config-sidebar">
    <div class="print-controls" v-if="!isPrinting">
      <!-- 操作按鈕 -->
    </div>
  </div>
</div>
```

### 數據載入

```javascript
const loadPrintData = () => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    printId.value = urlParams.get("print_id");
    printData.value = urlParams.get("print_data");

    if (!printId.value) {
      throw new Error("無效的列印ID");
    }

    // 從 sessionStorage 或 URL 參數獲取數據
    const storedData =
      sessionStorage.getItem(printId.value) ||
      decodeURIComponent(printData.value || "null");

    if (!storedData || storedData === "undefined") {
      ElMessage.error("找不到列印數據或資料無效，請返回重新操作");
      return;
    }

    // 解析 JSON 數據
    const parsed = JSON.parse(storedData);
    printContent.value = parsed;
    formId.value = printContent.value.formId;

    // 設置頁面標題
    const contactName = (printContent.value.contact?.name || "未填寫")
      .toString()
      .trim();
    document.title = `${contactName}-祈福登記表`;
  } catch (error) {
    console.error("載入列印數據失敗:", error);
    ElMessage.error("載入列印數據失敗，請返回重新操作");
  }
};
```

## 打印內容結構

### 1. 表頭

```vue
<div class="print-header">
  <h1>{{ printContent.contact?.name || "未填寫" }}-祈福登記表</h1>
  <div class="print-meta">
    <!-- 列印時間和編號（可選） -->
  </div>
</div>
```

### 2. 聯絡人信息

```vue
<div class="print-section">
  <h2 class="section-title">一、聯絡人信息</h2>
  <div class="section-content">
    <table class="info-table">
      <tbody>
        <tr>
          <td width="25%"><strong>聯絡人姓名：</strong></td>
          <td width="25%">{{ printContent.contact?.name || "未填寫" }}</td>
          <td width="25%"><strong>手機號碼：</strong></td>
          <td width="25%">{{ printContent.contact?.mobile || "未填寫" }}</td>
        </tr>
        <tr>
          <td><strong>家用電話：</strong></td>
          <td>{{ printContent.contact?.phone || "未填寫" }}</td>
          <td><strong>資料表屬性：</strong></td>
          <td>
            {{ printContent.contact?.relationship || "未填寫" }}
            <span v-if="printContent.contact?.otherRelationship">
              ({{ printContent.contact.otherRelationship }})
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

### 3. 消災祈福

```vue
<div class="print-section" v-if="printContent.blessing">
  <h2 class="section-title">二、消災祈福</h2>
  <div class="section-content">
    <!-- 地址 -->
    <table class="info-table">
      <tbody>
        <tr>
          <td width="20%"><strong>地址：</strong></td>
          <td width="80%">{{ printContent.blessing.address || "未填寫" }}</td>
        </tr>
      </tbody>
    </table>

    <!-- 消災人員列表 -->
    <div class="persons-list" v-if="availableBlessingPersons.length">
      <h3 class="sub-title">消災人員名單</h3>
      <table class="persons-table">
        <caption>
          <div class="persons-summary">
            共 {{ availableBlessingPersons.length }} 位人員
            <span v-if="currentHouseholdHeadsCount > 0">
              （{{ currentHouseholdHeadsCount }} 位戶長）
            </span>
          </div>
        </caption>
        <thead>
          <tr>
            <th width="5%">序號</th>
            <th width="20%">姓名</th>
            <th width="15%">生肖</th>
            <th width="50%">備註</th>
            <th width="10%">戶長</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(person, index) in availableBlessingPersons" :key="person.id">
            <td class="text-center">{{ index + 1 }}</td>
            <td class="text-center">{{ person.name || "未填寫" }}</td>
            <td class="text-center">{{ person.zodiac || "未選擇" }}</td>
            <td class="text-left">{{ person.notes || "無" }}</td>
            <td class="text-center">{{ person.isHouseholdHead ? "✓" : "" }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>
```

### 4. 超度祈福

```vue
<div class="print-section" v-if="printContent.salvation">
  <h2 class="section-title">三、超度祈福</h2>
  <div class="section-content">
    <!-- 地址 -->
    <table class="info-table">
      <tbody>
        <tr>
          <td width="20%"><strong>地址：</strong></td>
          <td width="80%">{{ printContent.salvation.address || "未填寫" }}</td>
        </tr>
      </tbody>
    </table>

    <!-- 歷代祖先 -->
    <div class="ancestors-list" v-if="availableAncestors.length">
      <h3 class="sub-title">歷代祖先</h3>
      <table class="persons-table">
        <caption>
          <div class="persons-summary">共 {{ availableAncestors.length }} 位祖先</div>
        </caption>
        <thead>
          <tr>
            <th width="10%">序號</th>
            <th width="40%">祖先姓氏</th>
            <th width="50%">備註</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(ancestor, index) in availableAncestors" :key="ancestor.id">
            <td class="text-center">{{ index + 1 }}</td>
            <td class="text-center">{{ ancestor.surname || "未填寫" }} 氏歷代祖先</td>
            <td class="text-left">{{ ancestor.notes || "無" }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 陽上人 -->
    <div class="survivors-list" v-if="availableSurvivors.length">
      <h3 class="sub-title">陽上人</h3>
      <table class="persons-table">
        <caption>
          <div class="persons-summary">共 {{ availableSurvivors.length }} 位陽上人</div>
        </caption>
        <thead>
          <tr>
            <th width="10%">序號</th>
            <th width="25%">姓名</th>
            <th width="15%">生肖</th>
            <th width="50%">備註</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(survivor, index) in availableSurvivors" :key="survivor.id">
            <td class="text-center">{{ index + 1 }}</td>
            <td class="text-center">{{ survivor.name || "未填寫" }}</td>
            <td class="text-center">{{ survivor.zodiac || "未選擇" }}</td>
            <td class="text-left">{{ survivor.notes || "無" }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>
```

### 5. 頁尾

```vue
<div class="print-footer">
  <p class="footer-note"></p>
  <div class="print-meta">
    <p>本表單由系統自動生成，列印時間：{{ printTime }}</p>
  </div>
</div>
```

## 計算屬性

### 過濾有效數據

```javascript
// 過濾有姓名的消災人員
const availableBlessingPersons = computed(() => {
  return (printContent.value.blessing?.persons || []).filter(
    (person) => person.name && person.name.trim() !== "",
  );
});

// 過濾有姓氏的祖先
const availableAncestors = computed(() => {
  return (printContent.value.salvation?.ancestors || []).filter(
    (ancestor) => ancestor.surname && ancestor.surname.trim() !== "",
  );
});

// 過濾有姓名的陽上人
const availableSurvivors = computed(() => {
  return (printContent.value.salvation?.survivors || []).filter(
    (survivor) => survivor.name && survivor.name.trim() !== "",
  );
});

// 統計戶長數量
const currentHouseholdHeadsCount = computed(() => {
  return availableBlessingPersons.value.filter(
    (person) => person.isHouseholdHead,
  ).length;
});
```

## 打印功能實現

### 打印處理

```javascript
const handlePrint = () => {
  isPrinting.value = true;

  // 延遲執行列印，確保樣式已應用
  setTimeout(() => {
    window.print();
    
    // 列印後恢復狀態
    setTimeout(() => {
      isPrinting.value = false;
    }, 1000);
  }, 500);
};

// 監聽列印事件
const beforePrint = () => (isPrinting.value = true);
const afterPrint = () => (isPrinting.value = false);

onMounted(() => {
  window.addEventListener("beforeprint", beforePrint);
  window.addEventListener("afterprint", afterPrint);
});

onUnmounted(() => {
  window.removeEventListener("beforeprint", beforePrint);
  window.removeEventListener("afterprint", afterPrint);
});
```

## 下載功能實現

### 1. PDF 下載

```javascript
const handleDownloadPDF = async () => {
  loading.value = true;
  showDownloadMenu.value = false;

  try {
    const printWindow = window.open("", "_blank");
    const printContent = document.getElementById("print-content").innerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${document.title}</title>
          <style>
            /* 打印樣式 */
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);

    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
      loading.value = false;
      ElMessage.success("PDF 下載已開始");
    }, 500);
  } catch (error) {
    console.error("PDF 下載失敗:", error);
    ElMessage.error("PDF 下載失敗");
    loading.value = false;
  }
};
```

### 2. Excel 下載

```javascript
const handleDownloadExcel = () => {
  loading.value = true;
  showDownloadMenu.value = false;

  try {
    let excelContent = `${document.title}\n\n`;
    
    // 聯絡人
    excelContent += "聯絡人:\n";
    excelContent += ",姓名,手機,電話,關係\n";
    excelContent += `,${printContent.value.contact?.name || "未填寫"},${
      printContent.value.contact?.mobile || "未填寫"
    },${printContent.value.contact?.phone || "未填寫"},${
      printContent.value.contact?.relationship || "未填寫"
    }\n`;

    // 消災人員
    excelContent += "\n消災人員:\n";
    excelContent += ",姓名,生肖,備註,戶長\n";
    availableBlessingPersons.value.forEach((person, index) => {
      excelContent += `${index + 1},${person.name || ""},${
        person.zodiac || ""
      },${person.notes || ""},${person.isHouseholdHead ? "是" : "否"}\n`;
    });

    // 歷代祖先
    excelContent += "\n歷代祖先:\n";
    excelContent += ",姓氏,備註\n";
    availableAncestors.value.forEach((ancestor, index) => {
      excelContent += `${index + 1},${ancestor.surname || ""},${
        ancestor.notes || ""
      }\n`;
    });

    // 陽上人
    excelContent += "\n陽上人:\n";
    excelContent += ",姓名,生肖,備註\n";
    availableSurvivors.value.forEach((survivor, index) => {
      excelContent += `${index + 1},${survivor.name || ""},${
        survivor.zodiac || ""
      },${survivor.notes || ""}\n`;
    });

    const blob = new Blob([excelContent], {
      type: "application/vnd.ms-excel;charset=utf-8",
    });
    downloadBlob(blob, `${document.title}_${formId.value}.xls`);
    ElMessage.success("Excel 檔案下載成功");
  } catch (error) {
    console.error("Excel 下載失敗:", error);
    ElMessage.error("Excel 下載失敗");
  } finally {
    loading.value = false;
  }
};
```

### 3. JSON 下載

```javascript
const handleDownloadJSON = () => {
  showDownloadMenu.value = false;

  try {
    const jsonData = {
      formId: formId.value,
      printTime: printTime.value,
      ...printContent.value,
    };

    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    downloadBlob(blob, `${document.title}_${formId.value}.json`);
    ElMessage.success("JSON 檔案下載成功");
  } catch (error) {
    console.error("JSON 下載失敗:", error);
    ElMessage.error("JSON 下載失敗");
  }
};
```

### 4. 圖片下載

```javascript
const handleDownloadImage = async () => {
  loading.value = true;
  showDownloadMenu.value = false;

  try {
    // 檢查是否已載入 html2canvas
    if (typeof html2canvas === "undefined") {
      await loadHtml2Canvas();
    }

    const element = document.getElementById("print-content");
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
    });

    canvas.toBlob((blob) => {
      downloadBlob(blob, `${document.title}_${formId.value}.png`);
      ElMessage.success("圖片下載成功");
      loading.value = false;
    });
  } catch (error) {
    console.error("圖片下載失敗:", error);
    ElMessage.error("圖片下載失敗，請稍後再試");
    loading.value = false;
  }
};

// 動態載入 html2canvas
const loadHtml2Canvas = () => {
  return new Promise((resolve, reject) => {
    if (typeof html2canvas !== "undefined") {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};
```

### 5. 文字檔下載

```javascript
const handleDownloadText = () => {
  showDownloadMenu.value = false;

  try {
    let textContent = `${document.title}\n`;
    textContent += "=".repeat(50) + "\n\n";

    textContent += `聯絡人: ${printContent.value.contact?.name || "未填寫"}\n`;
    textContent += `手機: ${printContent.value.contact?.mobile || "未填寫"}\n`;
    textContent += `電話: ${printContent.value.contact?.phone || "未填寫"}\n`;
    textContent += `關係: ${
      printContent.value.contact?.relationship || "未填寫"
    }\n\n`;

    textContent += "消災人員:\n";
    textContent += "-".repeat(30) + "\n";
    availableBlessingPersons.value.forEach((person, index) => {
      textContent += `${index + 1}. ${person.name || ""} (${
        person.zodiac || ""
      }) - ${person.notes || ""} ${person.isHouseholdHead ? "[戶長]" : ""}\n`;
    });

    textContent += "\n歷代祖先:\n";
    textContent += "-".repeat(30) + "\n";
    availableAncestors.value.forEach((ancestor, index) => {
      textContent += `${index + 1}. ${ancestor.surname || ""}氏歷代祖先 - ${
        ancestor.notes || ""
      }\n`;
    });

    textContent += "\n陽上人:\n";
    textContent += "-".repeat(30) + "\n";
    availableSurvivors.value.forEach((survivor, index) => {
      textContent += `${index + 1}. ${survivor.name || ""} (${
        survivor.zodiac || ""
      }) - ${survivor.notes || ""}\n`;
    });

    const blob = new Blob([textContent], {
      type: "text/plain;charset=utf-8",
    });
    downloadBlob(blob, `${document.title}_${formId.value}.txt`);
    ElMessage.success("文字檔下載成功");
  } catch (error) {
    console.error("文字檔下載失敗:", error);
    ElMessage.error("文字檔下載失敗");
  }
};
```

### 通用下載函數

```javascript
const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
```

## 樣式設計

### 響應式佈局

```css
/* 頁面容器 */
.print-page-container {
  display: flex;
  flex-direction: column; /* 手機模式預設為上下佈局 */
  min-height: 100vh;
  background-color: #333;
}

/* 桌面模式（寬度大於 768px）恢復左右佈局 */
@media screen and (min-width: 769px) {
  .print-page-container {
    flex-direction: row;
  }

  .preview-section {
    padding: 20px;
  }
  
  .config-sidebar {
    width: 320px;
  }
}
```

### 打印樣式

```css
@media print {
  .print-controls {
    display: none !important;
  }

  .print-registration {
    margin: 0;
    padding: 0;
    width: 100%;
  }

  .print-content {
    font-size: 12pt;
    line-height: 1.4;
    color: #000;
  }

  .print-header {
    text-align: center;
    margin-bottom: 20pt;
    padding-bottom: 10pt;
    border-bottom: 1pt solid #333;
  }

  .print-section {
    margin-bottom: 15pt;
    page-break-inside: avoid;
  }

  .section-title {
    font-size: 14pt;
    margin: 5pt 0;
    padding: 5pt 0;
    border-bottom: 1pt solid #333;
  }

  .info-table,
  .persons-table {
    width: 98%;
    border-collapse: collapse;
    margin: 5pt 0;
  }

  .info-table td,
  .persons-table th,
  .persons-table td {
    padding: 3pt 6pt;
    border: 1pt solid #ddd;
  }

  @page {
    size: A4;
    margin: 1cm;
  }
}
```

### 螢幕預覽樣式

```css
@media screen {
  .print-registration {
    max-width: 21cm;
    margin: 5px auto;
    padding: 30px;
    background: white;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }

  .print-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 20px;
    padding: 15px;
    gap: 15px;
  }
}
```

## 工具函數

### 設置打印時間

```javascript
const setPrintTime = () => {
  const now = new Date();
  printTime.value = now.toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};
```

### 返回上一頁

```javascript
const handleBack = () => {
  // 清理 sessionStorage
  if (printId.value) {
    sessionStorage.removeItem(printId.value);
  }

  router.back();
};
```

## 生命週期

```javascript
onMounted(() => {
  setPrintTime();
  loadPrintData();

  // 添加列印事件監聽
  window.addEventListener("beforeprint", beforePrint);
  window.addEventListener("afterprint", afterPrint);
});

onUnmounted(() => {
  // 清理事件監聽
  window.removeEventListener("beforeprint", beforePrint);
  window.removeEventListener("afterprint", afterPrint);
});
```

## 常見問題

### Q1: 為什麼使用 sessionStorage 而不是 localStorage？

**A**: sessionStorage 在瀏覽器關閉時自動清除，避免敏感數據長期存儲，更安全。

### Q2: 打印時如何隱藏控制欄？

**A**: 使用 `v-if="!isPrinting"` 條件渲染，配合 `@media print` CSS 規則雙重保障。

### Q3: 如何自定義打印樣式？

**A**: 修改 `@media print` 區塊的 CSS 樣式，調整字體大小、邊距、分頁等。

### Q4: 下載功能為什麼預留？

**A**: 下載功能已實現但默認隱藏（`v-if="false"`），可根據需求啟用。

### Q5: 如何處理大量數據的打印？

**A**: 使用 `page-break-inside: avoid` 防止表格被分頁切斷，確保內容完整性。

## 技術亮點

1. **雙重數據傳遞**: sessionStorage + URL 參數確保數據可靠性
2. **響應式佈局**: 桌面版左右分欄，手機版上下堆疊
3. **打印優化**: 專門的打印樣式和事件監聽
4. **多格式下載**: 支援 5 種格式匯出
5. **數據過濾**: 自動過濾空白數據，只顯示有效內容
6. **動態標題**: 根據聯絡人姓名自動設置頁面標題

## 相關文件

- [祈福登記查詢列表](./dev-registration-list-guide.md)
- [祈福登記表單功能](./dev-registration-guide.md)

## 未來優化

- [ ] 啟用下載功能（移除 `v-if="false"`）
- [ ] 添加打印預覽縮放功能
- [ ] 支援自定義打印模板
- [ ] 添加水印功能
- [ ] 支援批量打印多筆記錄
- [ ] 添加 QR Code（快速查詢）
- [ ] 支援橫向/直向打印切換
- [ ] 添加打印歷史記錄
