# 參加記錄牌位打印 - 功能開發指南

> **最後更新**: 2026-03-07  
> **文件路徑**: `client/src/views/JoinRecordCardPrint.vue`

## 概述說明

參加記錄牌位打印頁面提供可視化拖拽式牌位設計功能，支援多種牌位模版切換、自由拖拽數據項目、調整字體大小與位置，並可高清打印輸出。

## 核心功能

### 1. 牌位模版系統

- **多模版支援**: 超度中牌空白款、超度中牌中字款、合家平安
- **動態切換**: 即時切換模版並保持已放置的數據項目
- **響應式尺寸**: 根據模版自動調整畫布尺寸（92-95mm × 257-258mm）

### 2. 拖拽式數據配置

- **數據項目自動解析**: 從參加記錄中提取聯絡人、祖先、陽上人、消災人員、點燈人員等
- **拖拽放置**: 從右側數據面板拖拽項目到左側牌位畫布
- **自由移動**: 點擊拖拽已放置的項目調整位置
- **滾輪調整字級**: 滑鼠滾輪放大縮小字體（最小 8pt）
- **刪除功能**: 懸停顯示刪除按鈕，點擊移除項目

### 3. 高清打印輸出

- **高清生成**: 使用 html-to-image 以 6 倍像素比生成 PNG
- **精確尺寸**: 打印樣式設定為 93mm × 257mm
- **無邊距打印**: 自動設定 @page margin: 0

## 技術架構

### 依賴套件

```bash
npm install html-to-image print-js
```

- **html-to-image**: 將 HTML 元素轉換為高清圖片
- **print-js**: 瀏覽器打印控制

### 數據結構

```javascript
// 從路由參數接收的記錄數據
const record = ref({
  contact: {
    name: "聯絡人姓名",
    phone: "家用電話",
    mobile: "手機號碼",
  },
  items: [
    {
      type: "chaodu", // 超度祈福
      sourceAddress: "地址",
      sourceData: [{ surname: "姓氏" }],
    },
    {
      type: "survivors", // 陽上人
      sourceData: [{ name: "姓名", zodiac: "生肖", notes: "備註" }],
    },
    {
      type: "qifu", // 消災祈福
      sourceAddress: "地址",
      sourceData: [{ name: "姓名", zodiac: "生肖", notes: "備註" }],
    },
    {
      type: "xiaozai", // 固定消災
      sourceAddress: "地址",
      sourceData: [{ name: "姓名", zodiac: "生肖", notes: "備註" }],
    },
    {
      type: "diandeng", // 點燈
      lampDetails: [{ personName: "姓名", lampTypeLabel: "燈種" }],
    },
  ],
});
```

### 牌位模版配置

```javascript
const cardTemplates = {
  salvation_1: {
    name: "超度中牌_空白款",
    url: "/card-template-zk01a.png",
    width: "95mm",
    height: "258mm",
  },
  salvation_2: {
    name: "超度中牌_中字款",
    url: "/card-template-zk02a.png",
    width: "92mm",
    height: "258mm",
  },
  safe: {
    name: "合家平安",
    url: "/card-template-safe.png",
    width: "93mm",
    height: "257mm",
  },
};
```

## 核心功能實現

### 1. 數據項目解析

```javascript
const availableTags = computed(() => {
  const tags = [];

  // 聯絡人
  if (record.value.contact) {
    tags.push({
      id: "c1",
      label: `聯絡人 ${record.value.contact.name}`,
      value: record.value.contact.name,
    });
  }

  // 祖先
  const salvationItem = record.value.items?.find((i) => i.type === "chaodu");
  if (salvationItem?.sourceData?.[0]?.surname) {
    tags.push({
      id: "s1",
      label: `祖先 ${salvationItem.sourceData[0].surname}`,
      value: salvationItem.sourceData[0].surname + "歷代祖先",
    });
  }

  // 陽上人
  const survivorItem = record.value.items?.find((i) => i.type === "survivors");
  if (survivorItem?.sourceData?.length > 0) {
    survivorItem.sourceData.forEach((s, idx) => {
      tags.push({
        id: `sur-${idx}`,
        label: `陽上人 ${s.name}${s.zodiac ? " (" + s.zodiac + ")" : ""} ${s.notes}`,
        value: s.name,
      });
    });
  }

  // 消災人員
  const qifuItem = record.value.items?.find((i) => i.type === "qifu");
  if (qifuItem?.sourceData?.length > 0) {
    qifuItem.sourceData.forEach((s, idx) => {
      tags.push({
        id: `qifu-${idx}`,
        label: `消災人員 ${s.name}${s.zodiac ? " (" + s.zodiac + ")" : ""} ${s.notes}`,
        value: s.name,
      });
    });
  }

  // 固定消災
  const xiaozaiItem = record.value.items?.find((i) => i.type === "xiaozai");
  if (xiaozaiItem?.sourceData?.length > 0) {
    xiaozaiItem.sourceData.forEach((s, idx) => {
      tags.push({
        id: `xiaozai-${idx}`,
        label: `固定消災人員 ${s.name}${s.zodiac ? " (" + s.zodiac + ")" : ""} ${s.notes}`,
        value: s.name,
      });
    });
  }

  // 點燈
  const diandengItem = record.value.items?.find((i) => i.type === "diandeng");
  if (diandengItem?.lampDetails?.length > 0) {
    diandengItem.lampDetails.forEach((s, idx) => {
      tags.push({
        id: `diandeng-${idx}`,
        label: `點燈人員 ${s.personName || ""} ${s.lampTypeLabel || ""}`,
        value: s.personName,
      });
    });
  }

  return tags;
});
```

### 2. 拖拽功能實現

```javascript
// 開始拖拽
const handleDragStart = (event, tag) => {
  event.dataTransfer.setData("text/plain", JSON.stringify(tag));
};

// 放置到畫布
const handleDrop = (event) => {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const tagData = JSON.parse(event.dataTransfer.getData("text/plain"));

  droppedItems.value.push({
    text: tagData.value,
    top: y,
    left: x,
    fontSize: 16,
    writingMode: "vertical-rl",
  });
};
```

### 3. 項目移動與調整

```javascript
// 移動項目
const startMove = (event, index) => {
  if (printing.value) return;
  activeIndex.value = index;
  event.preventDefault();

  const startX = event.clientX;
  const startY = event.clientY;
  const initialTop = droppedItems.value[index].top;
  const initialLeft = droppedItems.value[index].left;

  const onMouseMove = (moveEvent) => {
    droppedItems.value[index].left = initialLeft + (moveEvent.clientX - startX);
    droppedItems.value[index].top = initialTop + (moveEvent.clientY - startY);
  };

  const onMouseUp = () => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
};

// 滾輪調整字級
const handleWheel = (event, index) => {
  if (printing.value) return;
  const delta = event.deltaY < 0 ? 1 : -1;
  const newSize = droppedItems.value[index].fontSize + delta;
  if (newSize >= 8) {
    droppedItems.value[index].fontSize = newSize;
  }
};

// 移除項目
const removeItem = (index) => {
  droppedItems.value.splice(index, 1);
};
```

### 4. 模版切換

```javascript
const updateBg = (val) => {
  selectedBg.value = val;
  updateDocumentTitle();
};

const updateDocumentTitle = () => {
  const currentTemplate = cardTemplates[selectedBg.value];
  const templateName = currentTemplate?.name || "";
  const contactName = record.value?.contact?.name || "未知信眾";
  document.title = `${contactName}-${templateName}`;
};
```

### 5. 高清打印

```javascript
const handlePrint = async () => {
  printing.value = true;
  const node = document.getElementById("card-capture-area");

  try {
    const dataUrl = await htmlToImage.toPng(node, {
      pixelRatio: 6, // 高清生成
    });

    printJS({
      printable: dataUrl,
      type: "image",
      style: `@page { size: 93mm 257mm; margin: 0; } img { width: 100%; }`,
    });
  } catch (error) {
    console.error("打印失敗", error);
  } finally {
    printing.value = false;
  }
};
```

## 頁面佈局

### HTML 結構

```vue
<template>
  <div class="print-page-container">
    <!-- 左側預覽區 -->
    <div class="preview-section">
      <div
        id="card-capture-area"
        class="card-canvas"
        :style="canvasStyle"
        @dragover.prevent
        @drop="handleDrop"
      >
        <!-- 底圖 -->
        <img :src="currentBgImage" class="base-layer" />

        <!-- 已放置的數據項目 -->
        <div
          v-for="(item, index) in droppedItems"
          :key="index"
          class="dropped-item"
          :style="{
            top: item.top + 'px',
            left: item.left + 'px',
            fontSize: item.fontSize + 'pt',
          }"
          @mousedown="startMove($event, index)"
          @wheel.prevent="handleWheel($event, index)"
        >
          <div class="item-text">{{ item.text }}</div>
          <div
            v-if="!printing"
            class="item-delete-btn"
            @click.stop="removeItem(index)"
          >
            🗑️
          </div>
        </div>
      </div>
    </div>

    <!-- 右側控制欄 -->
    <div class="config-sidebar">
      <h3>🖨️ 打印配置</h3>

      <!-- 模版選擇 -->
      <el-radio-group v-model="selectedBg" @change="updateBg">
        <el-radio-button
          v-for="(config, key) in cardTemplates"
          :key="key"
          :label="key"
        >
          {{ config.name }}
        </el-radio-button>
      </el-radio-group>

      <!-- 可拖拽數據項目 -->
      <div class="data-palette">
        <div
          v-for="tag in availableTags"
          :key="tag.id"
          class="draggable-tag"
          draggable="true"
          @dragstart="handleDragStart($event, tag)"
        >
          {{ tag.label }}
        </div>
      </div>

      <!-- 使用說明 -->
      <div class="use-help">
        <h3>使用說明</h3>
        <ul>
          <li>從右側拖拽任意數據到左側卡片區域</li>
          <li>在卡片區域內拖拽元素可以調整位置</li>
          <li>鼠標懸停在元素上，點擊右上角刪除按鈕可以移除</li>
        </ul>
      </div>

      <!-- 操作按鈕 -->
      <div class="config-footer">
        <el-button type="success" @click="handlePrint" :loading="printing">
          開始打印
        </el-button>
        <el-button @click="handleClose">關閉頁面</el-button>
      </div>
    </div>
  </div>
</template>
```

## 樣式設計

### 響應式佈局

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
  padding: 20px;
  overflow-y: auto;
}

.config-sidebar {
  width: 380px;
  background: #fff;
  border-left: 1px solid #dcdfe6;
  padding: 24px;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.05);
}
```

### 牌位畫布

```css
.card-canvas {
  width: 93mm;
  height: 257mm;
  position: relative;
  border: 1px dashed #ccc;
  overflow: hidden;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
}

.base-layer {
  width: 100%;
  height: 100%;
  pointer-events: none;
}
```

### 數據項目樣式

```css
.dropped-item {
  position: absolute;
  cursor: move;
  padding: 4px;
  border: 1px transparent dashed;
  writing-mode: vertical-rl;
  font-family: "Kaiti TC", "標楷體", serif;
}

.dropped-item:hover {
  border-color: #409eff;
}

.item-text {
  font-size: 1.5rem;
  font-family: 標楷體;
  color: #333;
  font-weight: bold;
  letter-spacing: 0.18rem;
}

.item-delete-btn {
  position: absolute;
  top: -12px;
  right: -12px;
  color: #f56c6c;
  cursor: pointer;
  font-size: 18px;
  display: none;
}

.dropped-item:hover .item-delete-btn {
  display: block;
}
```

### 拖拽標籤

```css
.draggable-tag {
  background: #f0f2f5;
  border: 2px dashed #ddd;
  padding: 8px;
  margin-bottom: 8px;
  cursor: grab;
  border-radius: 4px;
}
```

### 打印優化

```css
@media print {
  .item-delete-btn,
  .item-controls {
    display: none !important;
  }
}
```

## 路由參數

### 從列表頁傳遞數據

```javascript
// 在 JoinRecordList.vue 中
router.push({
  path: "/join-record-card-print",
  query: {
    print_data: JSON.stringify(record),
  },
});
```

### 接收數據

```javascript
// 在 JoinRecordCardPrint.vue 中
const route = useRoute();
const record = ref(JSON.parse(route.query.print_data || "{}"));
```

## 生命週期

```javascript
onMounted(() => {
  console.log("record object:", record.value);
  updateDocumentTitle();
});
```

## 常見問題

### Q1: 為什麼使用 html-to-image 而不是 html2canvas？

**A**: html-to-image 提供更好的 API 設計和更高的圖片品質，支援 pixelRatio 參數直接控制解析度。

### Q2: 如何調整打印尺寸？

**A**: 修改 `handlePrint` 函數中的 `@page { size: 93mm 257mm; }` 樣式。

### Q3: 為什麼使用直書模式？

**A**: 牌位傳統採用直書排版，使用 `writing-mode: vertical-rl` 實現從右到左的直書效果。

### Q4: 如何新增模版？

**A**: 在 `cardTemplates` 物件中新增模版配置，並將模版圖片放置在 `public` 資料夾。

### Q5: 拖拽項目如何保持在畫布內？

**A**: 目前未限制邊界，可在 `startMove` 函數中加入邊界檢查邏輯。

## 技術亮點

1. **可視化拖拽設計**: 直觀的拖拽式操作，無需手動輸入座標
2. **多模版支援**: 快速切換不同牌位樣式
3. **高清打印**: 6 倍像素比確保打印品質
4. **自由調整**: 滑鼠滾輪調整字級，拖拽調整位置
5. **智能數據解析**: 自動從記錄中提取所有可用數據項目
6. **直書排版**: 符合傳統牌位格式

## 相關文件

- [參加記錄列表功能](./dev-joinRecord-list-guide.md)
- [參加記錄收據打印功能](./dev-joinRecord-receipt-print-guide.md)
- [祈福登記打印預覽](./dev-registration-print-guide.md)

## 未來優化

- [ ] 新增批量打印功能（多筆記錄連續打印）
- [ ] 支援自定義模版上傳
- [ ] 新增預設佈局模版（快速套用常用配置）
- [ ] 支援項目對齊輔助線
- [ ] 新增配置保存與載入功能
- [ ] 支援橫書模式切換
- [ ] 新增邊界限制選項
- [ ] 支援圖片匯出（PNG/JPG）
