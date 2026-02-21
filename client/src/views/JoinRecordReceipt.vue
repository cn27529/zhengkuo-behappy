<template>
  <div class="print-wrapper">
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
        地址：南投縣集集鎮廣明里鎮國巷101號<br />
        會址：南投縣集集鎮廣明里鎮國巷101號<br />
        電話：(049) 2762726<br />
        董事長：釋廣心（游天木）<br />
        經手人：釋徹空
      </div>

      <div class="footer-info">
        中華民國 {{ rocYear }} 年 {{ currentMonth }} 月 {{ currentDay }} 日
      </div>
    </div>

    <div class="print-actions">
      <el-button type="primary" @click="handlePrint" size="large"
        >🖨️ 打印</el-button
      >
      <el-button @click="handleClose" size="large">關閉</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { appConfig } from "../config/appConfig.js";
import printJS from "print-js";

const route = useRoute();
const router = useRouter();
const record = ref({});

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

const handlePrint = () => {
  printJS({
    printable: "receipt-canvas",
    type: "html",
    targetStyles: ["*"],
    style: `
      @page { size: 130mm 181mm; margin: 5mm; }
      .receipt-canvas {
        width: 130mm;
        height: 181mm;
        padding: 15mm;
        box-sizing: border-box;
        position: relative;
        font-family: "Kaiti", "STKaiti", "標楷體", "DFKai-SB", serif;
        writing-mode: vertical-rl;
        text-orientation: mixed;
        line-height: 2;
      }
    `,
  });
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
</script>

<style scoped>
@media screen {
  .print-wrapper {
    background: #e0e0e0;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
  }

  .receipt-canvas {
    background: #ffe6f0;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
    margin-bottom: 20px;
  }

  .print-actions {
    display: flex;
    gap: 1rem;
  }
}

@media print {
  @page {
    size: 130mm 181mm;
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
  width: 130mm;
  height: 181mm;
  padding: 8mm;
  box-sizing: border-box;
  position: relative;
  font-family: "Kaiti", "STKaiti", "標楷體", "DFKai-SB", serif;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  line-height: 2;
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
  left: 15mm;
  top: 70%;
  transform: translateY(-50%);
  font-size: 8pt;
  border-right: 1px solid #333;
  padding-right: 8mm;
  line-height: 1.8;
}

.footer-info {
  position: absolute;
  bottom: 10mm;
  left: 10mm;
  writing-mode: horizontal-tb;
  font-size: 8pt;
}
</style>
