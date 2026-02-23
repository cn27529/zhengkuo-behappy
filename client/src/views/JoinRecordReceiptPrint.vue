<template>
  <div class="print-wrapper">
    <div id="receipt-capture-area" class="receipt-content">
      <div class="receipt-canvas">
        <h1 class="title">感謝狀</h1>

        <div class="content-section">
          <div class="donor-info">
            兹收到 <span class="highlight">{{ contactName }}</span>
          </div>

          <div class="items-detail">
            功德項目：
            <span
              v-for="(item, idx) in record.items"
              :key="idx"
              class="highlight"
            >
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
        <div class="print-meta">
          <p>本表單由系統自動生成，列印時間：{{ printTime }}</p>
        </div>
      </div>
    </div>

    <div class="print-controls">
      <el-button
        type="success"
        @click="handlePrintWithHtmlToImage"
        size="large"
      >
        🖨️ 收據打印
      </el-button>
      <el-button @click="handleClose" size="large">關閉</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElLoading } from "element-plus";
import { appConfig } from "../config/appConfig.js";
import * as htmlToImage from "html-to-image"; // 需安裝：npm install html-to-image
import printJS from "print-js";

const route = useRoute();
const router = useRouter();
const record = ref({});
const printTime = ref("");

// 數據綁定邏輯 (保持與 JoinRecordReceipt.vue 一致)
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

// 設置列印時間
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
    if (digit !== 0) result += digits[digit] + unit;
    else if (result && !result.endsWith("零")) result += "零";
  }
  return result.replace(/零+$/, "");
};

const handlePrintWithHtmlToImage = async () => {
  const node = document.getElementById("receipt-capture-area");
  const loading = ElLoading.service({
    text: "正在生成高清收據圖像...",
    background: "rgba(255, 255, 255, 0.8)",
  });

  try {
    // 使用 html-to-image 生成 PNG
    // pixelRatio 設為 3 以確保 300dpi 以上的打印質量
    const dataUrl = await htmlToImage.toPng(node, {
      pixelRatio: 6,
      //backgroundColor: '#ffe6f0',
      backgroundColor: "#ffffff",
      cacheBust: true,
    });

    // 透過 Print.js 進行圖片打印
    printJS({
      printable: dataUrl,
      type: "image",
      style:
        "@page { size: 128mm 182mm; margin: 0 auto;  } img { width: 100%; height: 100%; }",
      imageStyle: "width:100%;",
    });

    ElMessage.success("收據生成成功");
  } catch (error) {
    console.error("html-to-image 出錯:", error);
    ElMessage.error("收據轉換失敗，請檢查瀏覽器兼容性");
  } finally {
    loading.close();
  }
};

const handleClose = () => router.back();

onMounted(() => {
  setPrintTime();
  const printData = route.query.print_data;
  if (printData) {
    try {
      record.value = JSON.parse(printData);
    } catch (e) {
      ElMessage.error("數據解析失敗");
    }
  }
  if (!record.value.id) router.back();
});
</script>

<style scoped>
@media screen {
  .print-wrapper {
    background: #e0e0e0;
    min-height: 100vh;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .receipt-content {
    background: #ffe6f0;
    /* background: #fff; */
    padding: 5mm;
    border: #333 solid 0px;
  }
}

/* 針對 128mm x 182mm 的物理尺寸進行嚴格定義 */
.receipt-canvas {
  width: 128mm;
  height: 182mm;
  padding: 12mm 12mm;
  box-sizing: border-box;
  position: relative;
  /* 傳統直向排版核心 */
  writing-mode: vertical-rl;
  -webkit-writing-mode: vertical-rl;
  font-family: "標楷體", "DFKai-SB", serif;
  border: #333 solid 1px;
}

.title {
  font-size: 28pt; /* 略微加大以匹配您的需求 */
  font-weight: bold;
  text-align: center;
  letter-spacing: 10px;
  margin-left: 5mm;
}

.content-section {
  font-size: 15pt;
  line-height: 1.5;
  margin-right: 0mm;
}

.highlight {
  font-weight: bold;
}

.temple-info {
  position: absolute;
  left: 10mm;
  bottom: 25mm;
  font-size: 9.5pt;
  border-right: 1.5px solid #000;
  padding-right: 4mm;
  line-height: 1.8;
}

.footer-info {
  position: absolute;
  left: 10mm;
  bottom: 8mm;
  writing-mode: horizontal-tb;
  font-size: 10pt;
  font-weight: bold;
}

.print-meta {
  position: absolute;
  left: 10mm;
  bottom: 5mm;
  writing-mode: horizontal-tb;
  color: #666;
  font-size: 6px;
}

.print-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  /* background: #f5f5f5; */
  border-radius: 5px;
  gap: 15px;
}

.print-controls {
  margin-top: 20px;
  display: flex;
  gap: 15px;
  justify-content: center;
}
</style>
