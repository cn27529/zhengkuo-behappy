<template>
  <div class="print-wrapper">
    <div id="receipt-container" class="receipt-content">
      <div id="receipt-canvas" class="receipt-canvas">
        <h1 class="title">感謝狀</h1>

        <div class="content-section">
          <div class="donor-info">
            兹收到 <span class="highlight">{{ contactName }}</span>
          </div>

          <div class="items-detail">
            功德項目：
            <span v-for="(item, idx) in record.items" :key="idx" class="highlight">
              {{ item.label }}({{ appConfig.dollarTitle }}{{ item.subtotal }})
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
          <span class="highlight">財團法人鎮國基金會</span><br />
          會址：南投縣集集鎮廣明里鎮國巷101號<br />
          電話：(049) 2762726<br />
          董事長：釋廣心（游天木）<br />
          經手人：釋徹空
        </div>

        <div class="footer-info">
          中華民國 {{ rocYear }} 年 {{ currentMonth }} 月 {{ currentDay }} 日
        </div>
      </div>
    </div>

    <div class="print-controls">
      <el-button type="primary" @click="handlePrintImage" :loading="printing" size="large">
        🖨️ 生成圖片並列印
      </el-button>
      <el-button @click="handleClose" size="large">關閉</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElLoading } from "element-plus";
import { appConfig } from "../config/appConfig.js";
import printJS from "print-js";

const route = useRoute();
const router = useRouter();
const record = ref({});
const printing = ref(false);

// 數據處理邏輯 (保持不變)
const contactName = computed(() => record.value.contact?.name || "未知");
const contactAddress = computed(() => {
  const items = record.value.items || [];
  return items.find((item) => item.sourceAddress)?.sourceAddress || "";
});
const totalAmountChinese = computed(() => {
  const amount = record.value.totalAmount || 0;
  return convertToChinese(amount) + "元整";
});
const rocYear = computed(() => new Date().getFullYear() - 1911);
const currentMonth = computed(() => new Date().getMonth() + 1);
const currentDay = computed(() => new Date().getDate());

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
    if (digit !== 0) { result += digits[digit] + unit; } 
    else if (result && !result.endsWith("零")) { result += "零"; }
  }
  return result.replace(/零+$/, "");
};

// 核心列印邏輯：轉圖片後列印
const handlePrintImage = async () => {
  const loading = ElLoading.service({ text: '正在渲染高解析度圖像...', background: 'rgba(0, 0, 0, 0.7)' });
  try {
    printing.value = true;
    await loadHtml2Canvas();
    await nextTick();

    const element = document.getElementById("receipt-canvas");
    
    // 將 DOM 轉為 Canvas
    const canvas = await window.html2canvas(element, {
      scale: 3, // 提高縮放倍率以確保打印字體不模糊
      useCORS: true,
      backgroundColor: "#ffe6f0", // 確保背景色被捕捉
      logging: false,
    });

    const imageData = canvas.toDataURL("image/png");

    // 使用 Print.js 打印生成的圖片
    printJS({
      printable: imageData,
      type: 'image',
      style: '@page { size: 128mm 182mm; margin: 0; } img { width: 100%; }',
      imageStyle: 'width:100%;'
    });

    ElMessage.success("渲染完成，請於彈窗確認列印設定");
  } catch (error) {
    console.error("列印失敗:", error);
    ElMessage.error("圖像渲染失敗，請重試");
  } finally {
    loading.close();
    printing.value = false;
  }
};

const loadHtml2Canvas = () => {
  return new Promise((resolve, reject) => {
    if (window.html2canvas) return resolve();
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const handleClose = () => router.back();

onMounted(() => {
  const printData = route.query.print_data;
  if (printData) record.value = JSON.parse(printData);
  //if (!record.value.id) router.back();
});
</script>

<style scoped>
/* 螢幕預覽樣式 */
@media screen {
  .print-wrapper {
    background: #525659;
    min-height: 100vh;
    padding: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .receipt-content {
    background: white;
    box-shadow: 0 0 20px rgba(0,0,0,0.5);
  }
}

/* 核心畫布樣式 - 嚴格遵守 128x182mm */
.receipt-canvas {
  width: 128mm;
  height: 182mm;
  background: #ffe6f0; /* 粉紅色底紙 */
  box-sizing: border-box;
  position: relative;
  font-family: "標楷體", "DFKai-SB", serif;
  writing-mode: vertical-rl;
  -webkit-writing-mode: vertical-rl;
  padding: 15mm 10mm;
}

.title {
  font-size: 28pt; /* 這裡的 28pt 會在轉圖片時被固定 */
  font-weight: bold;
  letter-spacing: 12px;
  margin-left: 15mm;
  text-align: center;
}

.content-section {
  font-size: 15pt;
  line-height: 2.2;
}

.highlight {
  font-weight: bold;
}

.temple-info {
  position: absolute;
  left: 15mm;
  bottom: 35mm;
  font-size: 9pt;
  border-right: 1px solid #333;
  padding-right: 3mm;
  line-height: 1.6;
}

.footer-info {
  position: absolute;
  left: 15mm;
  bottom: 10mm;
  writing-mode: horizontal-tb;
  font-size: 10pt;
}

.print-controls {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}
</style>