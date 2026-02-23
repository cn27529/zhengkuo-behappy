<template>
  <div class="print-wrapper">
    <div id="receipt-content" class="receipt-content">
      <div id="receipt-canvas" class="receipt-canvas">
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
      </div>
    </div>

    <div class="print-controls">
      <el-button type="primary" @click="handlePrint" size="large"
        >🖨️ 收據打印</el-button
      >
      <el-button @click="handleClose" size="large">關閉</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { appConfig } from "../config/appConfig.js";
import printJS from "print-js";

const route = useRoute();
const router = useRouter();
const record = ref({});
const printing = ref(false);

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

    if (digit !== 0) {
      result += digits[digit] + unit;
    } else if (result && !result.endsWith("零")) {
      result += "零";
    }
  }

  return result.replace(/零+$/, "");
};

const handlePrint = async () => {
  try {
    printing.value = true;

    // 使用 Element Plus 消息提示
    ElMessage({
      message: "正在生成收據，請稍候...",
      type: "info",
      duration: 2000,
    });

    // // 檢查是否已載入 html2canvas
    // if (typeof window.html2canvas === "undefined") {
    //   // 動態載入 html2canvas（與 RegistrationPrint.vue 相同的方式）
    //   await loadHtml2Canvas();
    // }

    // 等待下一個渲染周期確保所有元素都已渲染
    await nextTick();

    // // 方法1：直接捕捉卡片背景區域（最準確）
    // const printElement = document.querySelector(".receipt-content");

    // console.log("開始捕捉收據...", printElement);

    // const canvas = await window.html2canvas(printElement, {
    //   backgroundColor: null, // 設置為null以保持透明背景
    //   scale: 2, // 提高分辨率
    //   useCORS: true,
    //   allowTaint: true,
    //   logging: true, // 開啟日誌
    //   removeContainer: true,
    //   width: printElement.clientWidth,
    //   height: printElement.clientHeight,
    //   x: 0,
    //   y: 0,
    //   scrollX: 0,
    //   scrollY: 0,
    //   ignoreElements: (element) => {
    //     // 忽略不需要的元素
    //     return element.classList.contains("print-controls");
    //   },
    // });

    // // 創建下載鏈接
    // const link = document.createElement("a");
    // link.download = `收據_${new Date().toISOString().slice(0, 10)}.png`;
    // link.href = canvas.toDataURL("image/png");
    // link.click();

    ElMessage({
      message: "收據已下載成功！",
      type: "success",
      duration: 3000,
    });

    printJS({
      printable: "receipt-content",
      type: "html",
      targetStyles: ["*"],
      style: `
      @page { size: 128mm 182mm; margin: 0 auto; }
    `,
    });
  } catch (error) {
    console.error("生成圖片時出錯:", error);

    let errorMessage = "生成圖片時出錯，請重試";
    if (error.message === "html2canvas 加載失敗") {
      errorMessage = "html2canvas 庫加載失敗，請檢查網絡連接";
    }

    ElMessage({
      message: errorMessage,
      type: "error",
      duration: 3000,
    });
  } finally {
    printing.value = false;
  }
};

const handleClose = () => {
  router.back();
};

onMounted(() => {
  const printId = route.query.print_id;
  const printData = route.query.print_data;

  if (printData) {
    try {
      record.value = JSON.parse(printData);
    } catch (error) {
      console.error("解析打印數據失敗:", error);
      ElMessage.error("無法載入收據數據");
    }
  } else if (printId) {
    const data = sessionStorage.getItem(printId);
    if (data) {
      try {
        record.value = JSON.parse(data);
        sessionStorage.removeItem(printId);
      } catch (error) {
        console.error("解析打印數據失敗:", error);
        ElMessage.error("無法載入收據數據");
      }
    }
  }

  if (!record.value.id) {
    ElMessage.error("無效的收據數據");
    router.back();
  }
});

// 動態加載 html2canvas（與 RegistrationPrint.vue 相同的方式）
const loadHtml2Canvas = () => {
  return new Promise((resolve, reject) => {
    // 檢查是否已經加載
    if (typeof window.html2canvas !== "undefined") {
      resolve();
      return;
    }

    // 創建 script 元素動態加載
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
    script.onload = () => {
      console.log("html2canvas 加載成功");
      resolve();
    };
    script.onerror = (error) => {
      console.error("html2canvas 加載失敗:", error);
      reject(new Error("html2canvas 加載失敗"));
    };
    document.head.appendChild(script);
  });
};
</script>

<style scoped>
@media screen {
  .print-wrapper {
    background: #e0e0e0;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 30px;
  }

  .receipt-canvas {
    background: #ffe6f0;
    padding-top: 10mm;
    box-shadow: 0 0 0px rgba(0, 0, 0, 0.2);
    border: #333 solid 1px;
    /* 如果找不到系統楷體，則使用思源宋體，至少保持莊重感 */
    font-family: "標楷體", "DFKai-SB", "Kaiti TC", "Noto Serif TC", serif;
  }

  .receipt-content {
    background: #ffe6f0;
    padding: 5mm;
  }

  .print-controls {
    margin-top: 30px;
    display: flex;
    gap: 1rem;
    justify-content: center;
  }
}

@media print {
  @page {
    size: 128mm 182mm;
    margin: 5mm;
  }

  body * {
    visibility: hidden;
  }

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

.receipt-canvas {
  width: 128mm;
  height: 182mm;
  padding-top: 10mm;
  position: relative;
  /* 如果找不到系統楷體，則使用思源宋體，至少保持莊重感 */
  font-family: "標楷體", "DFKai-SB", "Kaiti TC", "Noto Serif TC", serif;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  line-height: 2;
  border: #333 solid 1px;
}

.receipt-content {
  background: #ffe6f0;
  padding: 5mm;
}

.title {
  font-size: 28pt;
  text-align: center;
  letter-spacing: 10px;
  margin-left: 10mm;
  font-weight: bold;
}

.content-section {
  font-size: 14pt;
  margin-right: 10mm;
}

.donor-info,
.items-detail,
.total-amount,
.address-info,
.blessing {
  margin-bottom: 0em;
}

.highlight {
  font-size: 14pt;
  font-weight: bold;
  /* text-decoration: underline; */
}

.item-line {
  margin-bottom: 0.5em;
}

.temple-info {
  position: absolute;
  left: 13mm;
  bottom: 30mm;
  /* transform: translateY(-50%); */
  font-size: 8pt;
  border-right: 1px solid #333;
  /* padding-right: 4mm;
  line-height: 1.8; */
  max-height: 300px;
}

.footer-info {
  position: absolute;
  left: 13mm;
  bottom: 10mm;
  writing-mode: horizontal-tb;
  font-size: 8pt;
}
</style>
