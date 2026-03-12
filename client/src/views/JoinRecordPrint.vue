<!-- src/views/JoinRecordPrint.vue -->
<template>
  <div class="print-page-container">
    <div class="preview-section">
      <div class="print-join-record">
        <!-- 打印內容 -->
        <div class="print-content" id="print-content">
          <!-- 表頭 -->
          <div class="print-header">
            <h1>{{ printContent.contact?.name || "未填寫" }}-活動參加記錄表</h1>
            <div class="print-meta">
              <span>參加編號：{{ printContent.id || "未分配" }}、</span>
              <span>活動編號：{{ printContent.activityId || "未分配" }}、</span>
              <span
                >登記編號：{{ printContent.registrationId || "未分配" }}</span
              >
            </div>
          </div>

          <!-- 活動資訊 -->
          <div class="print-section" v-if="activityInfo">
            <h2 class="section-title">活動資訊</h2>
            <div class="section-content">
              <table class="info-table">
                <tbody>
                  <tr>
                    <td width="25%"><strong>活動名稱：</strong></td>
                    <td width="75%" colspan="3">
                      {{ activityInfo?.name || "未填寫" }}
                    </td>
                  </tr>
                  <tr v-if="activityInfo?.date">
                    <td><strong>活動日期：</strong></td>
                    <td colspan="3">{{ activityInfo.date }}</td>
                  </tr>
                </tbody>
              </table>
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
                        appConfig.formatCurrency(printContent.totalAmount) || 0
                      }}
                    </div>
                  </caption>
                  <thead>
                    <tr>
                      <th width="5%">序號</th>
                      <th width="15%">參加項目</th>
                      <th width="5%">數量</th>
                      <th width="15%">小計</th>
                      <th width="35%">地址</th>
                      <th width="25%">參加者</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(item, index) in printContent.items"
                      :key="index"
                    >
                      <td class="text-center">{{ index + 1 }}</td>
                      <td class="text-center">
                        {{ item.label || "未填寫" }}
                      </td>
                      <td class="text-center">{{ item.quantity || 0 }}</td>
                      <td class="text-center">
                        {{
                          item.subtotal >= 1
                            ? appConfig.formatCurrency(item.subtotal) || 0
                            : ""
                        }}
                      </td>
                      <td class="text-left">
                        {{
                          item.subtotal >= 1
                            ? item.sourceAddress || "未填寫"
                            : ""
                        }}
                      </td>
                      <td class="text-left">
                        {{
                          getParticipantNames(item.sourceData || []).join(
                            "、",
                          ) || "無"
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
              <p>
                本表單由系統自動生成，打印時間：{{ printTime }}｜打印編號：{{
                  printId
                }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="config-sidebar">
      <!-- 打印控制欄（僅在預覽時顯示） -->
      <div class="print-controls" v-if="!isPrinting">
        <div class="controls">
          <el-button type="primary" @click="handlePrint" size="large"
            >🖨️ 打印詳情</el-button
          >
        </div>
        <div class="controls">
          <div class="download-dropdown">
            <button @click="toggleDownloadMenu" class="download-btn">
              📥 下載
              <span class="dropdown-arrow">▼</span>
            </button>
            <div v-if="showDownloadMenu" class="download-menu">
              <button
                @click="handleDownloadPDF"
                class="download-option"
                v-if="false"
              >
                📄 下載為 PDF
              </button>
              <button @click="handleDownloadExcel" class="download-option">
                📊 下載為 Excel
              </button>
              <button @click="handleDownloadJSON" class="download-option">
                ⚙️ 下載為 JSON
              </button>
              <button @click="handleDownloadImage" class="download-option">
                🖼️ 下載為圖片
              </button>
              <button @click="handleDownloadText" class="download-option">
                📝 下載為文字檔
              </button>
            </div>
          </div>
        </div>
        <div class="controls">
          <el-button @click="handleBack" size="large">關閉</el-button>
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
import { DateUtils } from "../utils/dateUtils.js";
import html2canvas from "html2canvas";
import { parse } from "marked";

const activityStore = useActivityStore();
const router = useRouter();
const printContent = ref({});
const recordId = ref(0);
const isPrinting = ref(false);
const printTime = ref("");
const printTimestamp = ref("");
const printId = ref("");
const showDownloadMenu = ref(false);
const loading = ref(false);

// 根據 activityId 取得活動詳情
const activityInfo = computed(() => {
  const activityId = printContent.value.activityId;
  if (!activityId) return null;
  return activityStore.allActivities.find((a) => a.id === activityId);
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

// 載入打印數據
const loadPrintData = () => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    printId.value = urlParams.get("print_id");
    const printData = urlParams.get("print_data");

    console.log("打印數據，ID:", printId.value);
    console.log("打印數據，數據:", printData);

    if (!printId.value) {
      throw new Error("無效的打印ID");
    }

    const storedData =
      sessionStorage.getItem(printId.value) ||
      decodeURIComponent(printData || "null");

    console.log("獲取的打印數據:", storedData);

    if (!storedData || storedData === "undefined") {
      ElMessage.error("找不到打印數據或資料無效，請返回重新操作");
      return;
    }

    let parsed = {};
    try {
      parsed = JSON.parse(storedData);
      console.log("解析後的打印數據:", parsed);

      // // 排除陽上人的顯示，過濾掉 type 為 survivors 的項目
      // const filteredItems = parsed.items.filter(
      //   (item) => item.type !== "survivors",
      // );

      // // 如果你想更新原始物件中的 items
      // const updatedData = {
      //   ...parsed,
      //   items: filteredItems,
      // };

      printContent.value = parsed;
      recordId.value = printContent.value.id;

      if (!parsed || typeof parsed !== "object") {
        throw new Error("解析後的打印數據不是有效對象");
      }
    } catch (e) {
      console.error("解析打印數據失敗，可能格式錯誤", {
        printId: printId.value,
        storedData,
        error: e,
      });
      throw new Error("打印數據格式錯誤");
    }

    // 設定 document.title
    try {
      const contactName = (printContent.value.contact?.name || "未填寫")
        .toString()
        .trim();
      document.title = `${contactName}-活動參加記錄表_${recordId.value}`;
    } catch (e) {
      console.warn("設定 document.title 失敗:", e);
    }
  } catch (error) {
    console.error("載入打印數據失敗:", error);
    ElMessage.error("載入打印數據失敗，請返回重新操作");
  }
};

// 設置打印時間
const setPrintTime = () => {
  const now = new Date();
  printTime.value = DateUtils.formatDateTime(now);
  printTimestamp.value = DateUtils.getCurrentTimestamp(now);
};

// 切換下載選單
const toggleDownloadMenu = () => {
  showDownloadMenu.value = !showDownloadMenu.value;
};

// 1. 下載為 PDF（使用瀏覽器列印功能）
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
            body { font-family: "Microsoft JhengHei", "微軟正黑體", Arial, sans-serif; }
            .print-content { max-width: 21cm; margin: 20; }
            .print-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .print-section {page-break-inside: avoid;}
            .print-section { margin-bottom: 10px; }
            .section-title { font-size: 16pt; border-bottom: 1px solid #333; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .text-center { text-align: center; }
            .text-left { text-align: left; }
            @page { size: A4; margin: 1cm; }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
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

// 2. 下載為 Excel
const handleDownloadExcel = () => {
  loading.value = true;
  showDownloadMenu.value = false;

  try {
    let excelContent = `${document.title}\n\n`;

    excelContent += "聯絡人:\n";
    excelContent += ",姓名,手機,電話,關係\n";
    excelContent += `,${printContent.value.contact?.name || "未填寫"},${
      printContent.value.contact?.mobile || "未填寫"
    },${printContent.value.contact?.phone || "未填寫"},${
      printContent.value.contact?.relationship || "未填寫"
    }\n`;

    excelContent += "\n參加項目:\n";
    excelContent += ",項目,數量,小計,地址,參加者\n";
    (printContent.value.items || []).forEach((item, index) => {
      const participants = getParticipantNames(item.sourceData || []).join(
        "、",
      );
      excelContent += `${index + 1},${item.label || ""},${item.quantity || 0},${
        item.subtotal >= 1 ? item.subtotal : ""
      },${item.subtotal >= 1 ? item.sourceAddress || "" : ""},${participants}\n`;
    });

    const blob = new Blob([excelContent], {
      type: "application/vnd.ms-excel;charset=utf-8",
    });
    downloadBlob(blob, `${document.title}.xls`);
    ElMessage.success("Excel 檔案下載成功");
  } catch (error) {
    console.error("Excel 下載失敗:", error);
    ElMessage.error("Excel 下載失敗");
  } finally {
    loading.value = false;
  }
};

// 3. 下載為 JSON
const handleDownloadJSON = () => {
  showDownloadMenu.value = false;

  try {
    const jsonData = {
      printTime: printTime.value,
      ...printContent.value,
    };

    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    downloadBlob(blob, `${document.title}.json`);
    ElMessage.success("JSON 檔案下載成功");
  } catch (error) {
    console.error("JSON 下載失敗:", error);
    ElMessage.error("JSON 下載失敗");
  }
};

// 4. 下載為圖片（使用 html2canvas）
const handleDownloadImage = async () => {
  loading.value = true;
  showDownloadMenu.value = false;

  try {
    const element = document.getElementById("print-content");
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
    });

    canvas.toBlob((blob) => {
      downloadBlob(blob, `${document.title}.png`);
      ElMessage.success("圖片下載成功");
      loading.value = false;
    });
  } catch (error) {
    console.error("圖片下載失敗:", error);
    ElMessage.error("圖片下載失敗，請稍後再試");
    loading.value = false;
  }
};

// 5. 下載為文字檔
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

    textContent += "參加項目:\n";
    textContent += "-".repeat(30) + "\n";
    (printContent.value.items || []).forEach((item, index) => {
      const participants = getParticipantNames(item.sourceData || []).join(
        "、",
      );
      textContent += `${index + 1}. ${item.label || ""} x${item.quantity || 0}`;
      if (item.subtotal >= 1) {
        textContent += ` - ${appConfig.formatCurrency(item.subtotal)}`;
      }
      textContent += `\n   參加者: ${participants || "無"}\n`;
    });

    const blob = new Blob([textContent], {
      type: "text/plain;charset=utf-8",
    });
    downloadBlob(blob, `${document.title}.txt`);
    ElMessage.success("文字檔下載成功");
  } catch (error) {
    console.error("文字檔下載失敗:", error);
    ElMessage.error("文字檔下載失敗");
  }
};

// 通用下載函數
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

// 返回表單頁面
const handleBack = () => {
  if (printId.value) {
    sessionStorage.removeItem(printId.value);
    console.log("已清理打印數據，ID:", printId.value);
  }
  router.back();
};

// 打印處理
const handlePrint = () => {
  isPrinting.value = true;

  setTimeout(() => {
    window.print();
    setTimeout(() => {
      isPrinting.value = false;
    }, 1000);
  }, 500);
};

// 監聽打印事件
const beforePrint = () => (isPrinting.value = true);
const afterPrint = () => (isPrinting.value = false);

onMounted(async () => {
  setPrintTime();
  loadPrintData();
  await activityStore.getAllActivities();
  window.addEventListener("beforeprint", beforePrint);
  window.addEventListener("afterprint", afterPrint);
});

onUnmounted(() => {
  window.removeEventListener("beforeprint", beforePrint);
  window.removeEventListener("afterprint", afterPrint);
});
</script>

<style scoped>
/* 頁面容器佈局 */
.print-page-container {
  display: flex;
  flex-direction: column; /* 手機模式預設為上下佈局 */
  min-height: 100vh;
  background-color: #333;
}

/* 左側預覽區 */
.preview-section {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow-y: auto;
}

/* 右側側邊欄 */
.config-sidebar {
  background: #fff;
  border-left: 1px solid #dcdfe6;
  display: flex;
  flex-direction: column;
  padding: 24px;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.05);
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

/* 打印樣式 */
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
    color: #666;
    font-size: 8px;
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
    padding: 30px;
    background: white;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }

  .print-controls {
    display: grid;
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
    display: grid;
    gap: 15px;
    justify-content: center;
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

  /* 下載下拉選單樣式 */
  .download-dropdown {
    position: relative;
    display: inline-block;
  }

  .download-btn {
    padding: 10px 20px;
    border: 1px solid #007bff;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    background: #007bff;
    color: white;
    display: flex;
    align-items: center;
    gap: 5px;
    transition: all 0.3s;
  }

  .download-btn:hover {
    background: #0056b3;
    border-color: #0056b3;
  }

  .dropdown-arrow {
    font-size: 12px;
    transition: transform 0.3s;
  }

  .download-dropdown:hover .dropdown-arrow {
    transform: rotate(180deg);
  }

  .download-menu {
    position: absolute;
    top: 100%;
    left: 0;
    background: white;
    border: 1px solid #ddd;
    border-radius: 5px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    min-width: 200px;
    margin-top: 5px;
  }

  .download-option {
    display: block;
    width: 100%;
    padding: 10px 15px;
    border: none;
    background: white;
    cursor: pointer;
    text-align: left;
    font-size: 14px;
    transition: background 0.3s;
  }

  .download-option:hover {
    background: #f8f9fa;
  }

  .download-option:not(:last-child) {
    border-bottom: 1px solid #f0f0f0;
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
    font-size: 8px;
  }

  .print-section {
    margin-bottom: 15px;
  }

  .section-title {
    margin: 5px 0 5px 0;
    padding-bottom: 8px;
    border-bottom: 0px solid #333;
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
