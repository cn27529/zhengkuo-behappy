<template>
  <div class="print-page-container">
    <div class="preview-section">
      <div
        id="card-capture-area"
        class="card-canvas"
        :style="canvasStyle"
        @dragover.prevent
        @drop="handleDrop"
      >
        <img :src="currentBgImage" class="base-layer" />

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
          <!-- 垂直排列的文字 -->
          <div class="item-text">
            {{ item.text }}
          </div>

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

    <div class="config-sidebar">
      <h3>🖨️ 打印配置</h3>
      <el-divider />
      <p class="label">選擇打印模版</p>
      <el-radio-group
        v-model="selectedBg"
        size="large"
        @change="updateBg"
        class="template-radio"
      >
        <el-radio-button
          v-for="(config, key) in cardTemplates"
          :key="key"
          :label="key"
          border
        >
          {{ config.name }}
        </el-radio-button>
      </el-radio-group>

      <p class="label">可拖拽數據項目 (滑鼠拖入左側)</p>

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

      <div class="use-help">
        <h3>使用說明</h3>
        <ul>
          <li>從右側拖拽任意數據到左側卡片區域</li>
          <li>在卡片區域內拖拽元素可以調整位置</li>
          <li>鼠標懸停在元素上，點擊右上角刪除按鈕可以移除</li>
        </ul>
      </div>
      <el-divider />
      <div class="config-footer">
        <el-button
          type="success"
          @click="handlePrint"
          size="large"
          :loading="printing"
          >開始打印</el-button
        >
        <el-button @click="handleClose" size="large" class="full-width"
          >關閉頁面</el-button
        >
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import * as htmlToImage from "html-to-image";
import printJS from "print-js";

const route = useRoute();
const router = useRouter();
const record = ref(JSON.parse(route.query.print_data || "{}")); // 從列表傳來的數據
const printing = ref(false);

const contactName = ref(null);
const surname = ref(null);

// 牌位底圖的定義（請確保路徑與您的專案靜態資源資料夾一致）
const cardTemplates = {
  salvation_1: {
    name: "超度中牌_空白款",
    url: "/card-template-zk01a.png", // 超度中牌_空白款
    width: "95mm",
    height: "258mm",
  },
  salvation_2: {
    name: "超度中牌_中字款",
    url: "/card-template-zk02a.png", // 超度中牌_中字款
    width: "92mm",
    height: "258mm",
  },
  safe: {
    name: "合家平安",
    url: "/card-template-safe.png", //合家平安
    width: "93mm",
    height: "257mm",
  },
};

// 畫布與底圖設定
const selectedBg = ref("salvation_1");
// 響應式取得當前底圖路徑
const currentBgImage = computed(() => cardTemplates[selectedBg.value].url);

// 更新標題的函式，方便重複使用
const updateDocumentTitle = () => {
  const currentTemplate = cardTemplates[selectedBg.value];
  const templateName = currentTemplate?.name || "";

  const contactName = record.value?.contact?.name || "未知信眾";
  const contactTel =
    record.value?.contact?.phone || record.value?.contact?.mobile || "";
  // 提取姓氏 (根據您的資料結構)
  const salvationItem = record.value.items?.find((i) => i.type === "chaodu");
  //const surname = salvationItem?.sourceData?.[0]?.surname || "";

  // 組合成您要求的格式
  document.title = `${contactName}-${templateName}`;
};

onMounted(() => {
  console.log("record object:", record.value);
  updateDocumentTitle();
});

//切換模板時也要同步更新;
const updateBg = (val) => {
  console.log("當前選擇的牌位模板為:", val);
  // 這裡可以加入額外邏輯，例如切換底圖後自動清空畫布，或根據方丈指示微調預設座標
  selectedBg.value = val;
  updateDocumentTitle();
};

// 畫布尺寸 (以 93x257 為基準，可根據切換調整)
const canvasStyle = computed(() => ({
  // 響應式取得畫布尺寸設定
  //   width: cardTemplates[selectedBg.value].width,
  //   height: cardTemplates[selectedBg.value].height,
  width: "93mm",
  height: "257mm",
  position: "relative",
  backgroundColor: "transparent",
  transition: "all 0.3s ease", // 切換尺寸時的小動畫
}));

// 已放置在畫布上的項目
const droppedItems = ref([]);

// 解析數據為可拖拽標籤
const availableTags = computed(() => {
  const tags = [];

  // 聯絡人
  if (record.value.contact) {
    contactName.value = record.value.contact.name;
    tags.push({
      id: "c1",
      label: `聯絡人 ${record.value.contact.name}`,
      value: record.value.contact.name,
    });
  }
  // 提取祖先
  const salvationItem = record.value.items?.find((i) => i.type === "chaodu");
  if (salvationItem?.sourceData?.[0]?.surname) {
    surname.value = salvationItem.sourceData[0].surname + "歷代祖先";
    tags.push({
      id: "s1",
      label: `祖先 ${salvationItem.sourceData[0].surname}`,
      value: salvationItem.sourceData[0].surname + "歷代祖先",
    });
  }
  // 提取地址
  const address = record.value.items?.[0]?.sourceAddress;
  if (address) {
    tags.push({
      id: "chaodu_a1",
      label: `超度地址 ${address}`,
      value: address,
    });
  }

  // 提取陽上人
  // 在 items 陣列中尋找 type 為 survivors 的項目
  const survivorItem = record.value.items?.find((i) => i.type === "survivors");
  if (survivorItem?.sourceData?.length > 0) {
    // const names = survivorItem.sourceData.map((s) => s.name).join("、");
    // tags.push({
    //   id: "sur1",
    //   label: "陽上人名單",
    //   value: names,
    // });

    // 如果您希望每個人名都是獨立標籤，可以改用：
    survivorItem.sourceData.forEach((s, idx) => {
      tags.push({
        id: `sur-${idx}`,
        label: `陽上人 ${s.name}${s.zodiac ? " (" + s.zodiac + ")" : ""} ${s.notes}`,
        value: s.name,
      });
    });
  }

  // 消災祈福
  const qifuItem = record.value.items?.find((i) => i.type === "qifu");
  if (qifuItem?.sourceData?.length > 0) {
    // 如果您希望每個人名都是獨立標籤，可以改用：
    qifuItem.sourceData.forEach((s, idx) => {
      tags.push({
        id: `qifu-${idx}`,
        label: `消災人員 ${s.name}${s.zodiac ? " (" + s.zodiac + ")" : ""} ${s.notes}`,
        value: s.name,
      });
    });

    // 提取地址
    const address = qifuItem.sourceAddress;
    if (address) {
      tags.push({
        id: "qifu_a1",
        label: `消災地址 ${address}`,
        value: address,
      });
    }
  }

  // 固定消災
  const xiaozaiItem = record.value.items?.find((i) => i.type === "xiaozai");
  if (xiaozaiItem?.sourceData?.length > 0) {
    xiaozaiItem.sourceData.forEach((s, idx) => {
      tags.push({
        id: `qifu-${idx}`,
        label: `固定消災人員 ${s.name}${s.zodiac ? " (" + s.zodiac + ")" : ""} ${s.notes}`,
        value: s.name,
      });
    });

    // 提取地址
    const address = xiaozaiItem.sourceAddress;
    if (address) {
      tags.push({
        id: "xiaozai_a1",
        label: `固定消災地址 ${address}`,
        value: address,
      });
    }
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

    // 點燈不用地址
  }

  return tags;
});

const activeIndex = ref(null);

/**
 * 移除已放置在畫布上的數據項目
 * @param {Number} index - 陣列索引
 */
const removeItem = (index) => {
  droppedItems.value.splice(index, 1);
  console.log("已移除項目，剩餘數量:", droppedItems.value.length);
};

// 在 dropped-item 加入此事件：@wheel.prevent="handleWheel($event, index)"
const handleWheel = (event, index) => {
  if (printing.value) return;
  // 向上捲動增加字級，向下減少，最小 8pt
  const delta = event.deltaY < 0 ? 1 : -1;
  const newSize = droppedItems.value[index].fontSize + delta;
  if (newSize >= 8) {
    droppedItems.value[index].fontSize = newSize;
  }
};

const startMove = (event, index) => {
  if (printing.value) return;
  activeIndex.value = index;

  // 阻止預設行為，避免觸發瀏覽器原生的拖拽
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

// 拖拽處理邏輯
const handleDragStart = (event, tag) => {
  event.dataTransfer.setData("text/plain", JSON.stringify(tag));
};

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

// 打印功能實作
const handlePrint = async () => {
  printing.value = true;
  const node = document.getElementById("card-capture-area");
  try {
    const dataUrl = await htmlToImage.toPng(node, { pixelRatio: 6 }); // 高清生成
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

const handleClose = () => {
  // 告知 List 頁面需要重新查詢
  //sessionStorage.setItem("joinRecordListNeedsRefresh", "true");
  router.back();
};
</script>

<style>
/* 全域字體定義 */
@import url("https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@700&display=swap");

/* 在組件的 <style> 標籤內 */
.font-kaiti {
  /* 使用 !important 確保壓過 style.css 裡的 * 全域設定 */
  font-family:
    "Kaiti TC", "Apple LiSung", "標楷體", "DFKai-SB", "Noto Serif TC", serif !important;
}

/* 確保收據內的所有子元素都繼承這個楷體，而不是去抓全域的正黑體 */
.receipt-canvas * {
  font-family: inherit !important;
}
</style>

<style scoped>
.item-text {
  font-size: 1.5rem;
  font-family: 標楷體;
  color: #333;
  text-align: center;
  margin: -5px;
  border: 0px solid #333;
  font-weight: bold;
  letter-spacing: 0.18rem;
}
.template-radio {
  margin: 5px 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  /* 桌面版 2 列 */
  gap: 1rem;
}

.use-help {
  background-color: #e7f3ff;
  border-radius: 8px;
  padding: 18px;
  margin-top: 25px;
  margin-bottom: 25px;
  border-left: 4px solid #007bff;
}

.use-help h3 {
  color: #007bff;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.use-help ul {
  padding-left: 20px;
}

.use-help li {
  margin-bottom: 8px;
  line-height: 1.5;
}

.card-canvas {
  border: 1px dashed #ccc;
  overflow: hidden;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
}
.base-layer {
  width: 100%;
  height: 100%;
  pointer-events: none; /* 底圖不干擾拖拽 */
}
/* 數據項目的容器樣式 */
.dropped-item {
  position: absolute;
  cursor: move;
  padding: 4px;
  border: 1px transparent dashed;
  transition: border-color 0.2s;
  writing-mode: vertical-rl;
  font-family: "Kaiti TC", "標楷體", serif;
}

/* 懸停時顯示虛線框與刪除按鈕 */
.dropped-item:hover {
  border-color: #409eff; /* 編輯時的對齊輔助線 */
}

.item-delete-btn {
  position: absolute;
  top: -12px;
  right: -12px;
  color: #f56c6c;
  cursor: pointer;
  font-size: 18px;
  display: none; /* 平時隱藏 */
}

.dropped-item:hover .item-delete-btn {
  display: block; /* 懸停時才出現，避免畫面太亂 */
}

.draggable-tag {
  background: #f0f2f5;
  border: 2px dashed #ddd;
  padding: 8px;
  margin-bottom: 8px;
  cursor: grab;
  border-radius: 4px;
}

/* 批量打印導航 */
.batch-navigation {
  /* border: 1px solid #b3d8ff;
  background: #e7f4ff;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 12px; */
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

/* 頁面容器佈局 */
.print-page-container {
  display: flex;
  min-height: 100vh;
  /* background-color: #333; */
}

/* 左側預覽區 */
.preview-section {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  overflow-y: auto;
}

/* 右側側邊欄 */
.config-sidebar {
  width: 380px;
  background: #fff;
  border-left: 1px solid #dcdfe6;
  display: flex;
  flex-direction: column;
  padding: 24px;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.05);
}

/* 核心畫布區域 */
.receipt-content {
  background: #ffffff;
  padding: 0;
  line-height: 0;
}

.receipt-canvas {
  width: 128mm;
  height: 182mm;
  padding: 12mm 10mm;
  box-sizing: border-box;
  position: relative;
  writing-mode: vertical-rl;
  -webkit-writing-mode: vertical-rl;
  border: 0.2pt solid #333;
  background-color: #ffffff;
}

/* 印章模版特別樣式 */
.seal-container {
  position: absolute;
  left: 10mm;
  top: 55mm;
}
/* 印信處 */
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

/* 修改標題群組佈局 */
.title-group {
  display: grid;
  flex-direction: column; /* 在直書模式下，這會處理水平方向的排列 */
  align-items: center; /* 確保兩者在垂直軸線上對齊 */
  justify-content: flex-start;
  margin-left: 10mm; /* 調整整組標題與左側內容的間距 */
  margin-right: 5mm;
  height: 100%; /* 讓它撐滿高度以方便置中 */
}

.title {
  font-size: 28pt;
  font-weight: bold;
  text-align: center;
  letter-spacing: 12px;
  margin: 0; /* 移除原本可能干擾的 margin */
}

/* 調整字號樣式 */
.receipt-serial {
  font-size: 10pt;
  margin-top: 100mm; /* 這會控制「標題」與「字號」之間的間距 */
  letter-spacing: 2px;
  /* 移除原本的 position: absolute; */
  letter-spacing: 1px;
  font-weight: normal;
  white-space: nowrap; /* 確保字號不會意外換行 */
}

.content-section {
  font-size: 15pt;
  line-height: 1.8;
  margin-right: 2mm;
}

.highlight {
  font-weight: bold;
}

/* 寺廟資訊 */
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

/* 頁腳資訊 */
.footer-info {
  position: absolute;
  left: 10mm;
  bottom: 10mm;
  writing-mode: horizontal-tb;
  font-size: 10pt;
  font-weight: bold;
}

.print-meta {
  position: absolute;
  left: 10mm;
  bottom: 5mm;
  writing-mode: horizontal-tb;
  font-size: 8px;
  color: #666;
}

.config-body {
  /* flex: 1; */
  margin-top: 20px;
}

.label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 12px;
}

.template-radio {
  margin: 20px 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  /* 桌面版 2 列 */
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

/* 🔒 強制打印時隱藏所有控制項 */
@media print {
  .item-delete-btn,
  .item-controls {
    display: none !important;
  }
}

/* 針對 html-to-image 的導出優化 */
#card-capture-area .item-delete-btn {
  /* 在生成圖片時，我們會手動切換 printing 狀態來隱藏此處 */
}
</style>
