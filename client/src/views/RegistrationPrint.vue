<!-- src/views/PrintRegistration.vue -->
<template>
  <div class="print-registration">
    <!-- 列印控制欄（僅在預覽時顯示） -->
    <div class="print-controls" v-if="!isPrinting">
      <div class="controls-left">
        <button @click="handleBack" class="back-btn">← 返回</button>
      </div>
      <div class="controls-right">
        <div class="download-dropdown" style="display: none">
          <button @click="toggleDownloadMenu" class="download-btn">
            📥 下載
            <span class="dropdown-arrow">▼</span>
          </button>
          <div v-if="showDownloadMenu" class="download-menu">
            <button @click="handleDownloadPDF" class="download-option">
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
        <button @click="handlePrint" class="print-btn">🖨️ 列印</button>
      </div>
    </div>

    <!-- 列印內容 -->
    <div class="print-content" id="print-content">
      <!-- 表頭 -->
      <div class="print-header">
        <h1>{{ printContent.contact?.name || "未填寫" }}-忻福登記表</h1>
        <div class="print-meta">
          <!-- <p>｜列印時間：{{ printTime }}｜列印編號：{{ printId }}｜</p> -->
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

      <!-- 消災祈福 -->
      <div class="print-section" v-if="printContent.blessing">
        <h2 class="section-title">二、消災祈福</h2>
        <div class="section-content">
          <table class="info-table">
            <tbody>
              <tr>
                <td width="20%"><strong>地址：</strong></td>
                <td width="80%">
                  {{ printContent.blessing.address || "未填寫" }}
                </td>
              </tr>
            </tbody>
          </table>

          <!-- 消災人員列表 -->
          <div
            class="persons-list"
            v-if="
              printContent.blessing.persons &&
              printContent.blessing.persons.length
            "
          >
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
                <tr
                  v-for="(person, index) in availableBlessingPersons"
                  :key="person.id"
                >
                  <td class="text-center">{{ index + 1 }}</td>
                  <td class="text-center">{{ person.name || "未填寫" }}</td>
                  <td class="text-center">{{ person.zodiac || "未選擇" }}</td>
                  <td class="text-left">{{ person.notes || "無" }}</td>
                  <td class="text-center">
                    {{ person.isHouseholdHead ? "✓" : "" }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 超度祈福 -->
      <div class="print-section" v-if="printContent.salvation">
        <h2 class="section-title">三、超度祈福</h2>
        <div class="section-content">
          <table class="info-table">
            <tbody>
              <tr>
                <td width="20%"><strong>地址：</strong></td>
                <td width="80%">
                  {{ printContent.salvation.address || "未填寫" }}
                </td>
              </tr>
            </tbody>
          </table>

          <!-- 歷代祖先 -->
          <div
            class="ancestors-list"
            v-if="
              printContent.salvation.ancestors &&
              printContent.salvation.ancestors.length
            "
          >
            <h3 class="sub-title">歷代祖先</h3>
            <table class="persons-table">
              <caption>
                <div class="persons-summary">
                  共 {{ availableAncestors.length }} 位祖先
                </div>
              </caption>
              <thead>
                <tr>
                  <th width="10%">序號</th>
                  <th width="40%">祖先姓氏</th>
                  <th width="50%">備註</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(ancestor, index) in availableAncestors"
                  :key="ancestor.id"
                >
                  <td class="text-center">{{ index + 1 }}</td>
                  <td class="text-center">
                    {{ ancestor.surname || "未填寫" }} 氏歷代祖先
                  </td>
                  <td class="text-left">{{ ancestor.notes || "無" }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 陽上人 -->
          <div
            class="survivors-list"
            v-if="
              printContent.salvation.survivors &&
              printContent.salvation.survivors.length
            "
          >
            <h3 class="sub-title">陽上人</h3>
            <table class="persons-table">
              <caption>
                <div class="persons-summary">
                  共 {{ availableSurvivors.length }} 位陽上人
                </div>
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
                <tr
                  v-for="(survivor, index) in availableSurvivors"
                  :key="survivor.id"
                >
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

      <!-- 頁尾 -->
      <div class="print-footer">
        <p class="footer-note"></p>
        <div class="print-meta">
          <p>本表單由系統自動生成，列印時間：{{ printTime }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";

export default {
  name: "PrintRegistration",
  setup() {
    const router = useRouter();
    const printContent = ref({});
    const isPrinting = ref(false);
    const printTime = ref("");
    const formId = ref("");
    const printId = ref(""); // URL 參數中的列印 ID
    const printData = ref(""); // URL 參數中的列印數據
    const showDownloadMenu = ref(false);
    const loading = ref(false);

    // 計算屬性：過濾有效數據
    const availableBlessingPersons = computed(() => {
      return (printContent.value.blessing?.persons || []).filter(
        (person) => person.name && person.name.trim() !== ""
      );
    });

    const availableAncestors = computed(() => {
      return (printContent.value.salvation?.ancestors || []).filter(
        (ancestor) => ancestor.surname && ancestor.surname.trim() !== ""
      );
    });

    const availableSurvivors = computed(() => {
      return (printContent.value.salvation?.survivors || []).filter(
        (survivor) => survivor.name && survivor.name.trim() !== ""
      );
    });

    const currentHouseholdHeadsCount = computed(() => {
      return availableBlessingPersons.value.filter(
        (person) => person.isHouseholdHead
      ).length;
    });

    // 載入列印數據
    const loadPrintData = () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        printId.value = urlParams.get("print_id");
        printData.value = urlParams.get("print_data");

        console.log("列印數據，ID:", printId.value);
        console.log("列印數據，數據:", printData.value);

        if (!printId.value) {
          throw new Error("無效的列印ID");
        }

        const storedData =
          sessionStorage.getItem(printId.value) ||
          decodeURIComponent(printData.value || "null");

        console.log("獲取的列印數據:", storedData);

        // 驗證資料存在且不是字串 'undefined' 或空字串
        if (!storedData || storedData === "undefined") {
          ElMessage.error("找不到列印數據或資料無效，請返回重新操作");
        }

        let parsed = {};
        try {
          parsed = JSON.parse(storedData);
          console.log("解析後的列印數據:", parsed);
          printContent.value = parsed;
          if (!parsed || typeof parsed !== "object") {
            throw new Error("解析後的列印數據不是有效對象");
          }
          formId.value = printContent.value.formId;
        } catch (e) {
          console.error("解析列印數據失敗，可能格式錯誤", {
            printId,
            storedData,
            error: e,
          });
          throw new Error("列印數據格式錯誤");
        }

        // 成功載入資料後再設定 document.title，確保使用到最新資料
        try {
          const contactName = (printContent.value.contact?.name || "未填寫")
            .toString()
            .trim();
          document.title = `${contactName}-忻福登記表`;
        } catch (e) {
          // 如果意外錯誤，不阻斷流程
          console.warn("設定 document.title 失敗:", e);
        }
      } catch (error) {
        console.error("載入列印數據失敗:", error);
        // 可以顯示錯誤訊息或導回原頁面
        ElMessage.error("載入列印數據失敗，請返回重新操作");
        //handleBack()
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

    const closeDownloadMenu = (event) => {
      if (!event.target.closest(".download-dropdown")) {
        showDownloadMenu.value = false;
      }
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
        // 使用瀏覽器列印功能生成 PDF
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
        // 建立 Excel 內容
        let excelContent = `${document.title}\n\n`;
        // excelContent += `聯絡人: ${
        //   printContent.value.contact?.name || "未填寫"
        // }\n`;
        // excelContent += `手機: ${
        //   printContent.value.contact?.mobile || "未填寫"
        // }\n`;
        // excelContent += `電話: ${
        //   printContent.value.contact?.phone || "未填寫"
        // }\n`;
        // excelContent += `關係: ${
        //   printContent.value.contact?.relationship || "未填寫"
        // }\n\n`;

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

        excelContent += "\n歷代祖先:\n";
        excelContent += ",姓氏,備註\n";
        availableAncestors.value.forEach((ancestor, index) => {
          excelContent += `${index + 1},${ancestor.surname || ""},${
            ancestor.notes || ""
          }\n`;
        });

        excelContent += "\n陽上人:\n";
        excelContent += ",姓名,生肖,備註\n";
        availableSurvivors.value.forEach((survivor, index) => {
          excelContent += `${index + 1},${survivor.name || ""},${
            survivor.zodiac || ""
          },${survivor.notes || ""}\n`;
        });

        // 建立 Blob 並下載
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

    // 3. 下載為 JSON
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

    // 4. 下載為圖片（使用 html2canvas）
    const handleDownloadImage = async () => {
      loading.value = true;
      showDownloadMenu.value = false;

      try {
        // 檢查是否已載入 html2canvas
        if (typeof html2canvas === "undefined") {
          // 動態載入 html2canvas
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

    // 5. 下載為文字檔
    const handleDownloadText = () => {
      showDownloadMenu.value = false;

      try {
        let textContent = `${document.title}\n`;
        textContent += "=".repeat(50) + "\n\n";

        textContent += `聯絡人: ${
          printContent.value.contact?.name || "未填寫"
        }\n`;
        textContent += `手機: ${
          printContent.value.contact?.mobile || "未填寫"
        }\n`;
        textContent += `電話: ${
          printContent.value.contact?.phone || "未填寫"
        }\n`;
        textContent += `關係: ${
          printContent.value.contact?.relationship || "未填寫"
        }\n\n`;

        textContent += "消災人員:\n";
        textContent += "-".repeat(30) + "\n";
        availableBlessingPersons.value.forEach((person, index) => {
          textContent += `${index + 1}. ${person.name || ""} (${
            person.zodiac || ""
          }) - ${person.notes || ""} ${
            person.isHouseholdHead ? "[戶長]" : ""
          }\n`;
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

    // 返回表單頁面
    const handleBack = () => {
      // 清理本地存儲的列印數據（可選）
      if (printId.value) {
        sessionStorage.removeItem(printId.value);
        console.log("已清理列印數據，ID:", printId.value);
      }

      // 返回上一頁或指定頁面
      router.back();
      // 或者使用 router.push('/registration') 導航到特定頁面
    };

    // 列印處理
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

    // 關閉視窗
    const handleClose = () => {
      // 清理本地存儲的列印數據
      if (printId.value) {
        sessionStorage.removeItem(printId.value);
        console.log("已清理列印數據，ID:", printId.value);
      }
      window.close();
    };

    // 監聽列印事件
    const beforePrint = () => {
      isPrinting.value = true;
    };

    const afterPrint = () => {
      isPrinting.value = false;
    };

    onMounted(() => {
      setPrintTime();
      loadPrintData();

      // 添加列印事件監聽
      window.addEventListener("beforeprint", beforePrint);
      window.addEventListener("afterprint", afterPrint);
      //window.addEventListener('onbeforeunload', handleClose)
      //window.addEventListener('unload', handleClose)

      // 自動觸發列印（可選）
      //handlePrint()
    });

    onUnmounted(() => {
      // 清理事件監聽
      window.removeEventListener("beforeprint", beforePrint);
      window.removeEventListener("afterprint", afterPrint);
      //window.removeEventListener('onbeforeunload', handleClose)
      //window.removeEventListener('unload', handleClose)
    });

    return {
      printContent,
      isPrinting,
      printTime,
      formId,
      printId,
      printData,
      showDownloadMenu,
      loading,
      availableBlessingPersons,
      availableAncestors,
      availableSurvivors,
      currentHouseholdHeadsCount,
      handlePrint,
      handleClose,
      handleBack,
      toggleDownloadMenu,
      handleDownloadPDF,
      handleDownloadExcel,
      handleDownloadJSON,
      handleDownloadImage,
      handleDownloadText,
    };
  },
};
</script>

<style scoped>
/* 列印樣式 */
@media print {
  .print-controls {
    display: none !important;
  }

  .print-registration {
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
    margin: 1pt 0 0pt 0;
    color: #000;
  }

  .info-table {
    width: 98%;
    border-collapse: collapse;
    margin: 5pt 0;
    font-size: 11pt;
  }

  .info-table td {
    padding: 4pt 8pt;
    border: 1pt solid #ddd;
  }

  .persons-table {
    width: 98%;
    border-collapse: collapse;
    margin: 1pt 0;
    font-size: 10pt;
  }

  .persons-table th,
  .persons-table td {
    padding: 3pt 6pt;
    border: 1pt solid #ddd;
    text-align: center;
  }

  .persons-table th {
    background-color: #f5f5f5;
    font-weight: bold;
  }

  .text-center {
    text-align: center;
  }

  .text-left {
    text-align: left;
  }

  .persons-summary {
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

  /* 確保在列印時不會被分頁切斷 */
  .print-section {
    page-break-inside: avoid;
  }

  .persons-table {
    page-break-inside: avoid;
    width: 98%;
  }

  /* 橫向列印建議 */
  @page {
    size: A4;
    margin: 1cm;
  }
}

/* 螢幕預覽樣式 */
@media screen {
  .print-registration {
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

  .print-tips {
    color: #666;
    font-size: 14px;
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
    border-bottom: 0px solid #333;
    color: #333;
  }

  .sub-title {
    margin: 1pt 0 0pt 0;
    color: #333;
  }

  .info-table,
  .persons-table {
    width: 98%;
    border-collapse: collapse;
    margin: 5px 0;
  }

  .info-table td,
  .persons-table th,
  .persons-table td {
    border: 1px solid #ddd;
    padding: 8px 12px;
  }

  .persons-table th {
    background-color: #f8f9fa;
    font-weight: bold;
  }

  .persons-summary {
    font-size: 8pt;
    text-align: right;
    margin-top: 0pt;
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

/* 響應式設計 */
@media (max-width: 768px) {
  .print-controls {
    /* flex-direction: column;
    gap: 10px; */
  }

  .controls-left,
  .controls-right {
    /* width: 100%; */
    justify-content: center;
  }

  .print-tips {
    text-align: center;
    order: -1;
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

strong {
  font-weight: bold;
}
</style>
