<!-- src/views/JoinRecordPrint.vue -->
<template>
  <div class="print-join-record">
    <!-- 列印控制欄（僅在預覽時顯示） -->
    <div class="print-controls" v-if="!isPrinting">
      <div class="controls-left">
        <button @click="handleBack" class="back-btn">← 返回</button>
      </div>
      <div class="controls-right">
        <button @click="handlePrint" class="print-btn">🖨️ 列印</button>
      </div>
    </div>

    <!-- 列印內容 -->
    <div class="print-content" id="print-content">
      <!-- 表頭 -->
      <div class="print-header">
        <h1>{{ printContent.contact?.name || "未填寫" }}-活動參加記錄表</h1>
        <div class="print-meta">
          <span>參加ID：{{ printContent.id || "未分配" }}、</span>
          <span>活動ID：{{ printContent.activityId || "未分配" }}、</span>
          <span>登記ID：{{ printContent.registrationId || "未分配" }}</span>
        </div>
      </div>

      <!-- 聯絡人信息 -->
      <div class="print-section">
        <h2 class="section-title">一、聯絡人信息</h2>
        <div class="section-content">
          <table class="info-table">
            <tbody>
              <tr>
                <td width="25%"><strong>聯絡人姓名：</strong></td>
                <td width="25%">
                  {{ printContent.contact?.name || "未填寫" }}
                </td>
                <td width="25%"><strong>手機號碼：</strong></td>
                <td width="25%">
                  {{ printContent.contact?.mobile || "未填寫" }}
                </td>
              </tr>
              <tr>
                <td><strong>家用電話：</strong></td>
                <td>{{ printContent.contact?.phone || "未填寫" }}</td>
                <td><strong>關係：</strong></td>
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

      <!-- 參加項目 -->
      <div
        class="print-section"
        v-if="
          printContent.items &&
          Array.isArray(printContent.items) &&
          printContent.items.length
        "
      >
        <h2 class="section-title">二、參加項目</h2>
        <div class="section-content">
          <!-- 項目列表 -->
          <div class="items-list">
            <table class="items-table">
              <caption>
                <div class="items-summary">
                  共 {{ printContent.items.length }} 個項目，總金額：{{
                    appConfig.dollarTitle
                  }}{{ printContent.totalAmount || 0 }}
                </div>
              </caption>
              <thead>
                <tr>
                  <th width="5%">序號</th>
                  <th width="15%">項目名稱</th>
                  <th width="5%">數量</th>
                  <th width="15%">小計</th>
                  <th width="35%">地址</th>
                  <th width="25%">參加者</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in printContent.items" :key="index">
                  <td class="text-center">{{ index + 1 }}</td>
                  <td class="text-center">{{ item.label || "未填寫" }}</td>
                  <td class="text-center">{{ item.quantity || 0 }}</td>
                  <td class="text-center">
                    {{ appConfig.dollarTitle }}{{ item.subtotal || 0 }}
                  </td>
                  <td class="text-left">
                    {{ item.sourceAddress || "未填寫" }}
                  </td>
                  <td class="text-left">
                    {{
                      getParticipantNames(item.sourceData || []).join("、") ||
                      "無"
                    }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 詳細參加者資料 -->
          <div
            v-for="(item, itemIndex) in printContent.items || []"
            :key="itemIndex"
            class="item-details"
            v-if="
              item &&
              item.sourceData &&
              Array.isArray(item.sourceData) &&
              item.sourceData.length
            "
          >
            <h3 class="sub-title">{{ item.label }} - 詳細參加者資料</h3>
            <table class="participants-table">
              <thead>
                <tr>
                  <th width="5%">序號</th>
                  <th width="20%">姓名/姓氏</th>
                  <th width="15%">生肖</th>
                  <th width="50%">備註</th>
                  <th width="10%">戶長</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(participant, index) in item.sourceData || []"
                  :key="index"
                >
                  <td class="text-center">{{ index + 1 }}</td>
                  <td class="text-center">
                    {{
                      participant.name ||
                      (participant.surname
                        ? `${participant.surname}氏`
                        : "未填寫")
                    }}
                  </td>
                  <td class="text-center">
                    {{ participant.zodiac || "未選擇" }}
                  </td>
                  <td class="text-left">{{ participant.notes || "無" }}</td>
                  <td class="text-center">
                    {{ participant.isHouseholdHead ? "✓" : "" }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 頁尾 -->
      <div class="print-footer">
        <div class="print-meta">
          <p>本表單由系統自動生成，列印時間：{{ printTime }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { appConfig } from "../config/appConfig.js";
import { useActivityStore } from "../stores/activityStore.js";

const router = useRouter();
const activityStore = useActivityStore();
const printContent = ref({});
const isPrinting = ref(false);
const printTime = ref("");
const printId = ref("");

// 根據 activityId 取得活動詳情
const activityInfo = computed(() => {
  const activityId = printContent.value.activityId;
  if (!activityId) return null;
  return activityStore.activities.find((a) => a.id === activityId);
});

// 獲取參加者姓名列表
const getParticipantNames = (sourceData) => {
  if (!sourceData || !Array.isArray(sourceData)) return [];

  return sourceData
    .map((item) => {
      if (item.name) return `${item.name}(${item.zodiac || "未知"})`; // 使用姓名（生肖）
      if (item.surname) return `${item.surname}氏歷代祖先`;
      return "未知";
    })
    .filter((name) => name && name !== "未知");
};

// 載入列印數據
const loadPrintData = () => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    printId.value = urlParams.get("print_id");
    const printData = urlParams.get("print_data");

    console.log("列印數據，ID:", printId.value);
    console.log("列印數據，數據:", printData);

    if (!printId.value) {
      throw new Error("無效的列印ID");
    }

    const storedData =
      sessionStorage.getItem(printId.value) ||
      decodeURIComponent(printData || "null");

    console.log("獲取的列印數據:", storedData);

    if (!storedData || storedData === "undefined") {
      ElMessage.error("找不到列印數據或資料無效，請返回重新操作");
      return;
    }

    let parsed = {};
    try {
      parsed = JSON.parse(storedData);
      console.log("解析後的列印數據:", parsed);
      printContent.value = parsed;
      if (!parsed || typeof parsed !== "object") {
        throw new Error("解析後的列印數據不是有效對象");
      }
    } catch (e) {
      console.error("解析列印數據失敗，可能格式錯誤", {
        printId: printId.value,
        storedData,
        error: e,
      });
      throw new Error("列印數據格式錯誤");
    }

    // 設定 document.title
    try {
      const contactName = (printContent.value.contact?.name || "未填寫")
        .toString()
        .trim();
      document.title = `${contactName}-活動參加記錄表`;
    } catch (e) {
      console.warn("設定 document.title 失敗:", e);
    }
  } catch (error) {
    console.error("載入列印數據失敗:", error);
    ElMessage.error("載入列印數據失敗，請返回重新操作");
  }
};

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

// 返回表單頁面
const handleBack = () => {
  if (printId.value) {
    sessionStorage.removeItem(printId.value);
    console.log("已清理列印數據，ID:", printId.value);
  }
  router.back();
};

// 列印處理
const handlePrint = () => {
  isPrinting.value = true;

  setTimeout(() => {
    window.print();
    setTimeout(() => {
      isPrinting.value = false;
    }, 1000);
  }, 500);
};

// 監聽列印事件
const beforePrint = () => (isPrinting.value = true);
const afterPrint = () => (isPrinting.value = false);

onMounted(async () => {
  setPrintTime();
  loadPrintData();

  window.addEventListener("beforeprint", beforePrint);
  window.addEventListener("afterprint", afterPrint);
});

onUnmounted(() => {
  window.removeEventListener("beforeprint", beforePrint);
  window.removeEventListener("afterprint", afterPrint);
});
</script>

<style scoped>
/* 列印樣式 */
@media print {
  .print-controls {
    display: none !important;
  }

  .print-join-record {
    margin: 0;
    padding: 0;
    width: 100%;
    font-family: "Microsoft JhengHei", "微軟正黑體", Arial, sans-serif;
  }

  .print-content {
    font-size: 12pt;
    line-height: 1.4;
    color: #000;
    margin: 20;
  }

  .print-header {
    text-align: center;
    margin-bottom: 20pt;
    padding-bottom: 10pt;
    border-bottom: 1pt solid #333;
  }

  .print-header h1 {
    font-size: 18pt;
    margin: 0 0 10pt 0;
    color: #000;
  }

  .print-meta {
    font-size: 10pt;
    color: #666;
  }

  .print-section {
    margin-bottom: 15pt;
    page-break-inside: avoid;
  }

  .section-title {
    font-size: 14pt;
    margin: 5pt 0 5pt 0;
    padding: 5pt 0;
    border-bottom: 1pt solid #333;
    color: #000;
  }

  .sub-title {
    font-size: 12pt;
    margin: 10pt 0 5pt 0;
    color: #000;
  }

  .info-table,
  .items-table,
  .participants-table {
    width: 98%;
    border-collapse: collapse;
    margin: 5pt 0;
    font-size: 10pt;
  }

  .info-table td,
  .items-table th,
  .items-table td,
  .participants-table th,
  .participants-table td {
    padding: 3pt 6pt;
    border: 1pt solid #ddd;
    text-align: center;
  }

  .items-table th,
  .participants-table th {
    background-color: #f5f5f5;
    font-weight: bold;
  }

  .text-center {
    text-align: center;
  }

  .text-left {
    text-align: left;
  }

  .items-summary {
    font-size: 8pt;
    text-align: right;
    margin-top: 0pt;
    color: #666;
  }

  .print-footer {
    text-align: center;
    margin-top: 20pt;
    padding-top: 10pt;
    border-top: 1pt solid #333;
    font-size: 10pt;
    color: #666;
  }

  .print-section {
    page-break-inside: avoid;
  }

  .items-table,
  .participants-table {
    page-break-inside: avoid;
  }

  @page {
    size: A4;
    margin: 1cm;
  }
}

/* 螢幕預覽樣式 */
@media screen {
  .print-join-record {
    max-width: 21cm;
    margin: 5px auto;
    padding: 10px;
    background: white;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }

  .print-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 15px;
    background: #f5f5f5;
    border-radius: 5px;
    gap: 15px;
  }

  .controls-left {
    display: flex;
    align-items: center;
  }

  .controls-right {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .back-btn {
    padding: 10px 20px;
    border: 1px solid #ddd;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    background: white;
    color: #333;
  }

  .back-btn:hover {
    background: #f0f0f0;
  }

  .print-btn {
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    font-weight: bold;
    background: #4caf50;
    color: white;
  }

  .print-btn:hover {
    background: #45a049;
  }

  .print-content {
    font-family: "Microsoft JhengHei", "微軟正黑體", Arial, sans-serif;
    line-height: 1.6;
    margin: 20;
  }

  .print-header {
    text-align: center;
    margin-bottom: 30px;
    padding-bottom: 15px;
    border-bottom: 1px solid #333;
  }

  .print-header h1 {
    margin: 0 0 5px 0;
    color: #333;
  }

  .print-meta {
    color: #666;
    font-size: 14px;
  }

  .print-section {
    margin-bottom: 15px;
  }

  .section-title {
    margin: 5px 0 5px 0;
    padding-bottom: 8px;
    border-bottom: 1px solid #333;
    color: #333;
  }

  .sub-title {
    margin: 15px 0 5px 0;
    color: #333;
  }

  .info-table,
  .items-table,
  .participants-table {
    width: 98%;
    border-collapse: collapse;
    margin: 5px 0;
  }

  .info-table td,
  .items-table th,
  .items-table td,
  .participants-table th,
  .participants-table td {
    border: 1px solid #ddd;
    padding: 8px 12px;
  }

  .items-table th,
  .participants-table th {
    background-color: #f8f9fa;
    font-weight: bold;
  }

  .items-summary {
    font-size: 12px;
    text-align: right;
    margin-top: 0px;
    color: #666;
  }

  .print-footer {
    text-align: center;
    margin-top: 30px;
    padding-top: 15px;
    border-top: 1px solid #333;
    color: #666;
  }
}

/* 通用樣式 */
.print-content {
  color: #333;
  margin: 20;
}

.section-content {
  margin-left: 10px;
}

.item-details {
  margin-top: 20px;
}

strong {
  font-weight: bold;
}
</style>
