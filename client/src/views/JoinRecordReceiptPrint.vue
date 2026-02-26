<template>
  <div class="print-page-container">
    <div class="preview-section">
      <div id="receipt-capture-area" class="receipt-content">
        <div
          v-if="activeTemplate === 'standard'"
          class="receipt-canvas font-kaiti"
        >
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
              <span
                v-for="(item, idx) in record.items"
                :key="idx"
                class="highlight"
              >
                {{ item.label }}({{ item.subtotal }})&nbsp;&nbsp;
              </span>
            </div>
            <div class="total-amount">
              共計新台幣：<span class="highlight">{{
                totalAmountChinese
              }}</span>
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
          <div class="print-meta">
            <p>本表單由系統自動生成(收執聯)，打印時間：{{ printTime }}</p>
          </div>
        </div>

        <div v-else class="receipt-canvas font-kaiti stamp-layout">
          <div class="title-group">
            <h1 class="title">收據</h1>
            <div class="receipt-serial">佛字第 {{ receiptSerialNum }} 號</div>
          </div>

          <div class="content-section">
            <div class="donor-info">
              茲收到 <span class="highlight">{{ contactName }}</span> 大德
            </div>
            <div class="items-detail">
              功德項目：
              <span
                v-for="(item, idx) in record.items"
                :key="idx"
                class="highlight"
              >
                {{ item.label }}({{ item.subtotal }})&nbsp;&nbsp;
              </span>
            </div>
            <div class="total-amount">
              共計新台幣：<span class="highlight">{{
                totalAmountChinese
              }}</span>
            </div>
            <div v-if="contactAddress" class="address-info">
              住址：<span class="highlight">{{ contactAddress }}</span>
            </div>
            <div class="blessing">功德無量，特此致謝</div>
            <div class="seal-container">
              <div class="seal-box">財團法人鎮國基金會印信處</div>
            </div>
            <div class="temple-info">
              <span class="temple-subtitle highlight">財團法人鎮國基金會</span
              ><br />
              會址：南投縣集集鎮廣明里鎮國巷101號<br />
              電話：(O四九) 二七六二七二六<br />
              董事長：釋廣心（游天木）<br />
              經手人：釋徹空
            </div>
          </div>
          <div class="footer-info">
            中華民國 {{ rocYear }} 年 {{ currentMonth }} 月 {{ currentDay }} 日
          </div>
          <div class="print-meta">
            <p>本表單由系統自動生成(收執聯)，打印時間：{{ printTime }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="config-sidebar">
      <div class="config-header">
        <h3>🖨️ 打印配置</h3>
      </div>

      <div class="config-body">
        <p class="label">選擇單據模板：</p>
        <el-radio-group v-model="activeTemplate" class="template-radio">
          <el-radio
            @click="handleTemplateChange('standard')"
            label="standard"
            border
            >📜 感謝狀</el-radio
          >
          <el-radio @click="handleTemplateChange('stamp')" label="stamp" border
            >🛡️ 收據</el-radio
          >
        </el-radio-group>

        <el-divider />

        <div class="print-tips">
          <p><strong>提醒：</strong></p>
          <ul>
            <li>
              紙張：JIS B6 128mm (寬) x 182mm (高)與國際標準 ISO 216 的 B6
              (125mm x 176mm) 略有不同
            </li>
            <li>縮放：100%</li>
            <li>邊距：無 (None)</li>
          </ul>
        </div>
      </div>

      <el-divider />
      <div class="config-footer">
        <el-button
          type="success"
          @click="handlePrintWithHtmlToImage"
          :loading="printing"
          size="large"
          class="full-width"
        >
          開始打印
        </el-button>
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
import { ElMessage, ElLoading, ElMessageBox } from "element-plus";
import * as htmlToImage from "html-to-image";
import printJS from "print-js";
import { DateUtils } from "../utils/dateUtils.js";
import { useJoinRecordPrintStore } from "../stores/joinRecordPrintStore.js";

const printStore = useJoinRecordPrintStore();
// 模板切換狀態
const activeTemplate = ref("standard");
const printing = ref(false);

const route = useRoute();
const router = useRouter();
const record = ref({});
const printTime = ref("");

// 模擬收據字號（可改為從 API 獲取 record.id 或特定的編號規則）
const receiptSerialNum = computed(() => {
  return record.value.id
    ? `${record.value.id}A${record.value.activityId}R${record.value.registrationId}`
    : "00000000";
});

// 數據邏輯 (保持您的原始配置)
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

const setPrintTime = () => {
  printTime.value = DateUtils.getCurrentTimestamp();
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

const handleTemplateChange = (template = "standard") => {
  activeTemplate.value = template;

  const name = (record.value.contact?.name || "未填寫").toString().trim();
  const receiptSerialText =
    activeTemplate.value === "standard" ? "感謝狀" : "收據";
  document.title = `${name}-${receiptSerialNum.value}-${receiptSerialText}`;
};

const handlePrintWithHtmlToImage = async () => {
  const node = document.getElementById("receipt-capture-area");
  const loading = ElLoading.service({
    text: "正在生成高清圖像...",
    background: "rgba(240, 242, 245, 0.8)",
  });

  try {
    printing.value = true;
    await document.fonts.ready;
    await new Promise((resolve) => setTimeout(resolve, 400));

    const dataUrl = await htmlToImage.toPng(node, {
      pixelRatio: 6,
      backgroundColor: "#ffffff",
      cacheBust: true,
      includeGraphics: true,
    });

    loading.close();

    // 先執行打印
    printJS({
      printable: dataUrl,
      type: "image",
      style:
        "@page { size: 128mm 182mm; margin: 0; } img { width: 100%; height: 100%; }",
      imageStyle: "width:100%;",
    });

    // 重點：打印視窗跳出後，主視窗直接進入確認狀態
    // 不等回調，直接手動喚起彈窗
    setTimeout(() => {
      handlePostPrintCheck();
    }, 500); // 給予 500 毫秒讓打印視窗先彈出來，確認框會在它後方/下方準備好
  } catch (error) {
    console.error("打印失敗:", error);
    loading.close();
    ElMessage.error("轉換失敗，請重新嘗試");
  } finally {
    printing.value = false;
  }
};

/**
 * 打印視窗關閉後的確認邏輯
 */
const handlePostPrintCheck = async () => {
  try {
    await ElMessageBox.confirm("單據是否已成功由打印機完成？", "打印確認", {
      confirmButtonText: "巳打印完成",
      cancelButtonText: "取消打印",
      type: "question",
      center: true,
    });

    // 使用者確認巳打印完成，更新打印狀態
    record.value.activeTemplate = activeTemplate.value;
    // 更新收據打印狀態
    const result = await printStore.updateReceiptPrintStatus(record.value);

    if (result?.success) {
      ElMessage({
        type: "success",
        message: result?.message || "記錄巳打印完成狀態。👍",
      });
    } else {
      ElMessage({
        type: "warning",
        message: result?.message || "狀態更新失敗，但打印已完成。",
      });
    }
  } catch {
    // ElMessage({
    //   type: "info",
    //   message: "若打印失敗，請檢查打印機連線後重試。",
    // });
  }
};

const handleClose = () => router.back();

onMounted(() => {
  // // 1. 開啟全螢幕 Loading
  // const loading = ElLoading.service({
  //   lock: true,
  //   text: "正在準備收據資料...",
  //   background: "rgba(240, 242, 245, 1)", // 使用與背景相同的顏色，視覺更統一
  // });

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

  // // 3. 關鍵：設定 1.5 秒延遲
  // setTimeout(() => {
  //   //isPageReady.value = true;
  //   loading.close();
  // }, 1000); // 1500 毫秒 = 1.5 秒

  if (!record.value.id) router.back();
});
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
/* 頁面容器佈局 */
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
  padding: 20px;
  overflow-y: auto;
}

/* 右側側邊欄 */
.config-sidebar {
  width: 320px;
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

/* 印章模板特別樣式 */
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
  color: #909399;
  font-size: 8px;
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
</style>
