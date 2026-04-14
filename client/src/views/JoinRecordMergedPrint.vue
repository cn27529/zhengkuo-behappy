<template>
  <div class="print-page-container">
    <div class="preview-section">
      <div id="receipt-capture-area" class="receipt-content">
        <div
          v-if="activeTemplate === 'standard'"
          class="receipt-canvas font-kaiti"
        >
          <div class="title-group">
            <h1 class="title-text">感謝狀</h1>
            <div class="receipt-serial">佛字第 {{ receiptSerialNum }} 號</div>
          </div>

          <div class="content-section">
            <div class="donor-info">
              茲收到 <span class="highlight">{{ contactName }}</span> 大德
            </div>
            <div class="items-detail">
              功德項目：
              <span
                v-for="(item, idx) in currentRecord.items"
                :key="idx"
                class="highlight"
              >
                {{
                  item.subtotal > 0
                    ? item.label +
                      "(" +
                      appConfig.formatCurrency(item.subtotal) +
                      ")&nbsp;&nbsp;"
                    : ""
                }}
              </span>
            </div>
            <div class="total-amount">
              共計新台幣：<span class="highlight">{{
                displayAmountChinese
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
            經手人：{{ receiptIssuedBy }}
          </div>
          <div class="footer-info">
            中華民國 {{ rocYear }} 年 {{ currentMonth }} 月 {{ currentDay }} 日
          </div>
          <div class="print-meta">
            <p style="display: none">
              本表單由系統自動生成(收執聯)，打印時間：{{
                printTime
              }}｜打印編號：{{ reqPrintId }}
            </p>
          </div>
        </div>

        <div v-else class="receipt-canvas font-kaiti stamp-layout">
          <div class="title-group">
            <h1 class="title-text">收據</h1>
            <div class="receipt-serial">佛字第 {{ receiptSerialNum }} 號</div>
          </div>

          <div class="content-section">
            <div class="donor-info">
              茲收到 <span class="highlight">{{ contactName }}</span> 大德
            </div>
            <div class="items-detail">
              <!-- 護持三寶、供齋、護持道場、助印經書、放生、其它： -->
              <p>
                <span
                  v-for="(item, idx) in currentRecord.items"
                  :key="idx"
                  class="highlight"
                >
                  {{
                    item.subtotal > 0
                      ? item.label +
                        "(" +
                        appConfig.formatCurrency(item.subtotal) +
                        ")&nbsp;&nbsp;"
                      : ""
                  }}
                </span>
              </p>
            </div>
            <div class="total-amount">
              共計新台幣：<span class="highlight">{{
                displayAmountChinese
              }}</span>
            </div>
            <div v-if="contactAddress" class="address-info">
              住址：<span class="highlight">{{ contactAddress }}</span>
            </div>
            <div class="blessing">功德無量，特此致謝</div>
            <div class="seal-container">
              <div class="seal-box">{{ sealBoxText }}</div>
            </div>
            <div class="temple-info">
              <span class="temple-subtitle highlight">財團法人鎮國基金會</span
              ><br />
              核准字號：(90) 投府民宗字第九OOO七八八七號<br />
              會址：南投縣集集鎮廣明里鎮國巷101號<br />
              電話：(O四九) 二七六二七二六<br />
              董事長：釋廣心（游天木）<br />
              經手人：{{ receiptIssuedBy }}
            </div>
          </div>
          <div class="footer-info">
            中華民國 {{ rocYear }} 年 {{ currentMonth }} 月 {{ currentDay }} 日
          </div>
          <div class="print-meta">
            <p style="display: none">
              本表單由系統自動生成(收執聯)，打印時間：{{
                printTime
              }}｜打印編號：{{ reqPrintId }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="config-sidebar">
      <div class="config-header">
        <h3>🖨️ 打印配置</h3>
      </div>

      <div class="config-body">
        <p class="label" v-if="isMergedPrint">合併打印 {{ 1 }} 張</p>
        <!-- 批量打印導航 -->
        <div v-if="isMergedPrint" class="batch-navigation">
          <el-button
            v-for="(item, index) in manyRecord"
            :key="index"
            :type="getButtonType(index)"
            :plain="index === currentIndex && !printedIndexes.has(index)"
            circle
            size="mini"
          >
            <el-tooltip :content="`${item.id}`" placement="top" size="mini">
              <span>{{ index + 1 }}</span>
            </el-tooltip>
          </el-button>
        </div>

        <el-divider v-if="isMergedPrint" />

        <p class="label">選擇打印模版</p>
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

        <p class="label">修改大德</p>
        <el-input
          v-if="currentRecord.contact"
          v-model="currentRecord.contact.name"
          placeholder="請輸入大德姓名"
          size="large"
          clearable
          @input="handleNameChange"
        />
        <el-input v-else disabled placeholder="載入中..." size="large" />

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
          @click="handleMergedPrintWithHtmlToImage"
          :loading="printing"
          size="large"
          class="full-width"
        >
          合併打印
        </el-button>
        <el-button @click="handleClose" size="large" class="full-width"
          >關閉頁面</el-button
        >
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElLoading, ElMessageBox } from "element-plus";
import * as htmlToImage from "html-to-image";
import printJS from "print-js";
import { DateUtils } from "../utils/dateUtils.js";
import { useJoinRecordPrintStore } from "../stores/joinRecordPrintStore.js";
import { useReceiptNumberStore } from "../stores/receiptNumberStore.js";
import appConfig from "../config/appConfig.js";
import { serviceAdapter } from "../adapters/serviceAdapter.js"; // R用適配器

// 確保已引入所需的 Store
import { useJoinRecordStore } from "../stores/joinRecordStore.js";
import { usePageStateStore } from "../stores/pageStateStore.js";

const joinRecordStore = useJoinRecordStore();
const pageStateStore = usePageStateStore();

const printStore = useJoinRecordPrintStore();
const receiptStore = useReceiptNumberStore(); // 生成編號的 store

// 模版切換狀態
const activeTemplate = ref("stamp");
const printing = ref(false);

const route = useRoute();
const router = useRouter();

// 打印相關
const currentRecord = ref({}); //目前打印
const printTime = ref("");
const receiptId = ref(null); // 儲存領取的正式編號 ID，以便後續更新狀態
const reqPrintId = computed(() => route.query.print_id);
const reqPrintRecord = computed(() => route.query.print_data); //單筆打印
const sealBoxText = ref("印信處"); //財團法人鎮國基金會印信處

const manyRecord = ref([]); //批量打印
const currentIndex = ref(0);
const printedIndexes = ref(new Set()); // 追蹤已打印完成的索引

// 打印類型
const reqPrintType = computed(() => route.query.print_type);
// 檢查是否為批量打印
const isBatchPrint = computed(() =>
  String(route.query.print_type === appConfig.PRINT_TYPE.BATCH),
);
// 是否為合併打印
const isMergedPrint = computed(() =>
  String(reqPrintType.value === appConfig.PRINT_TYPE.MERGED),
);

/**
 * 當大德姓名修改時的處理
 */
const handleNameChange = () => {
  // 重新觸發標題更新，確保列印存檔時的檔名同步
  handleTemplateChange(activeTemplate.value);
};

// 模擬收據字號（可改為從 API 獲取 record.id 或特定的編號規則）
const receiptSerialNum = computed(() => {
  // return record.value.id
  //   ? `${record.value.id}A${record.value.activityId}R${record.value.registrationId}`
  //   : "00000000";

  // 優先使用 record 中的真實編號，若無則顯示暫存 ID，最後才顯示 0000
  if (currentRecord.value.receiptNumber)
    return currentRecord.value.receiptNumber;
  return currentRecord.value.id ? `TEMP-${currentRecord.value.id}` : "00000000";
});

// 數據邏輯 (保持您的原始配置) 修正 contactName 的安全性
const contactName = computed(() => {
  // 增加安全檢查，防止讀取 undefined 的 name 屬性
  return currentRecord.value?.contact?.name || "載入中...";
});

const contactAddress = computed(() => {
  const items = currentRecord.value.items || [];
  return items.find((item) => item.sourceAddress)?.sourceAddress || "";
});

// 經手人顯示邏輯：優先顯示 record 中的 receiptIssuedBy，若無則顯示 getUserName 的使用者名稱
const receiptIssuedBy = computed(() => {
  return currentRecord.value?.receiptIssuedBy || receiptStore.getUserName();
});

const displayAmountChinese = computed(() => {
  const allAmount = currentRecord.value.finalAmount || 0;
  return convertToChinese(allAmount) + "元整";
});
const rocYear = computed(() => new Date().getFullYear() - 1911);
const currentMonth = computed(() => new Date().getMonth() + 1);
const currentDay = computed(() => new Date().getDate());

const setPrintTime = () => {
  const now = new Date();
  printTime.value = DateUtils.formatDateTime(now);
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

//
const handleTemplateChange = (template) => {
  if (template) {
    activeTemplate.value = template;
  }

  const name = (currentRecord.value.contact?.name || "未填寫")
    .toString()
    .trim();
  const receiptSerialText =
    activeTemplate.value === "standard" ? "感謝狀" : "收據";
  const batchInfo = isBatchPrint.value
    ? `(${currentIndex.value + 1}/${manyRecord.value.length})`
    : "";
  document.title = `${name}-${receiptSerialNum.value}-${receiptSerialText}${batchInfo}`;
};

// 批量打印導航
const handlePrevious = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    loadRecordByIndex(currentIndex.value);
  }
};

const handleNext = () => {
  if (currentIndex.value < manyRecord.value.length - 1) {
    currentIndex.value++;
    loadRecordByIndex(currentIndex.value);
  }
};

const loadRecordByIndex = (index) => {
  currentIndex.value = index; // 更新當前索引
  currentRecord.value = manyRecord.value[index];
  handleTemplateChange(activeTemplate.value);
};

// 獲取按鈕類型
const getButtonType = (index) => {
  if (printedIndexes.value.has(index)) {
    return "success"; // 已打印完成：綠色
  }
  if (index === currentIndex.value) {
    return "primary"; // 當前頁面：藍色
  }
  return "default"; // 未打印：灰色
};

// 合併打印
const handleMergedPrintWithHtmlToImage = async () => {
  // ✅ 0. 打印前確認 — 在領號之前先讓操作者確認內容
  const templateLabel =
    activeTemplate.value === "standard" ? "📜 感謝狀" : "🛡️ 收據";
  const itemsText = (currentRecord.value.items || [])
    .map(
      (item) => `${item.label}（${appConfig.formatCurrency(item.subtotal)}）`,
    )
    .join("、");

  try {
    await ElMessageBox.confirm(
      `
        <div style="line-height:2; font-size:15px;">
          <div>🙏 大德：<strong>${contactName.value}</strong></div>
          <div>📋 合併打印類型：<strong style="color:#409EFF;">${templateLabel}</strong></div>
          <div>💰 功德項目：<strong>${itemsText}</strong></div>
          <div>💵 總金額：<strong style="color:#E6A23C;">${displayAmountChinese.value}</strong></div>
          <hr style="margin:12px 0; border-color:#eee;"/>
          <div style="color:#F56C6C; font-size:15px;">
            ⚠️ 確認後將領取「佛字第」請確認打印詳情。
          </div>
        </div>
      `,
      "請確認合併打印詳情",
      {
        dangerouslyUseHTMLString: true,
        confirmButtonText: "✅ 確認，開始合併打印",
        type: "warning",
        center: true,
        distinguishCancelAndClose: true,
      },
    );
  } catch {
    // 操作者點「返回修改」或關閉 → 中止，不做任何動作
    return;
  }

  const node = document.getElementById("receipt-capture-area");

  // ✅ 1. 在擷取圖片前，先確認是否已有正式編號，若無則即時向 Rust 領取
  if (!currentRecord.value.receiptNumber) {
    const fetchLoading = ElLoading.service({ text: "正在領取佛字第..." }); //

    try {
      //
      if (serviceAdapter.getIsMock()) {
        console.warn("⚠️ 當前模式不為 Directus，將使用 Mock 數據");
        handleTemplateChange(); // 觸發標題更新，確保列印存檔時的檔名同步
        // 🔥 重要：等待 Vue 完成 DOM 更新，確保擷取到的 HTML 內含新編號
        await nextTick();
        await new Promise((resolve) => setTimeout(resolve, 300)); // 給予字體渲染緩衝
      } else {
        /*
        recordIds,
    receiptType,
    state,
    voidReason,
        */

        // 🔥 核心：向 receiptNumberStore 請求生成正式編號，並傳遞必要的上下文
        const result = await receiptStore.generateMergedReceiptNumber(
          currentRecord.value.ids,
          activeTemplate.value,
          currentRecord.value.state,
          currentRecord.value.voidReason,
        );

        if (result.success) {
          // 更新本地響應式數據，觸發 receiptSerialNum 計算屬性
          currentRecord.value.receiptNumber = result.data.receiptNumber; //
          currentRecord.value.receiptIssued = activeTemplate.value;
          receiptId.value = result.data.id; // 儲存編號 ID 以便後續狀態更新

          console.log(
            "合併打印正式編號領取成功:",
            currentRecord.value.receiptNumber,
            "合併打印編號 ID:",
            receiptId.value,
          );

          handleTemplateChange(); // 觸發標題更新，確保列印存檔時的檔名同步

          // 🔥 重要：等待 Vue 完成 DOM 更新，確保擷取到的 HTML 內含新編號
          await nextTick();
          await new Promise((resolve) => setTimeout(resolve, 300)); // 給予字體渲染緩衝
        } else {
          throw new Error(result.message);
        }
      }
    } catch (error) {
      ElMessage.error("合併打印正式編號領取失敗: " + error.message);
      fetchLoading.close();
      return; // 領號失敗則中止列印，避免印出 TEMP 編號
    } finally {
      fetchLoading.close();
    }
  }

  // ✅ 2. 圖像擷取與打印流程
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
      handleConfirmPostPrint();
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
const handleConfirmPostPrint = async () => {
  try {
    await ElMessageBox.confirm("單據是否已成功由打印機完成？", "打印確認", {
      confirmButtonText: "打印完成",
      cancelButtonText: "取消合併打印",
      type: "question",
      center: true,
    });

    // 使用者確認打印完成，更新打印狀態
    currentRecord.value.activeTemplate = activeTemplate.value;

    if (isMergedPrint.value) {
      //還沒弄好XD
      //已由/merge的服務處理完畢UI不用再handle
      const displayMessage = `${manyRecord.value.length} 筆參加記錄，合併打印 👍`;
      ElMessage({
        type: "success",
        message: displayMessage,
        duration: 3000,
      });

      // 同步更新編號狀態為合併打印完成
      if (receiptId.value) {
        // 🔥 重要：將 stateReceiptNumber 的調用放在這裡，確保只有在確認打印完成後才更新編號狀態
        const stateResult = await receiptStore.stateReceiptNumber(
          receiptId.value,
          "合併打印完成",
          "merged printed",
        );
        if (stateResult?.success) {
          console.log("「合併打印」更新成功");
        } else {
          console.warn("「合併打印」更新失敗:", stateResult?.message);
        }
      } else {
        console.warn("缺少 receiptId，無法更新編號狀態");
      }
    }
  } catch (error) {
    // 這裡攔截「取消打印」的觸發
    if (error === "cancel") {
      console.log("使用者取消合併");

      if (isMergedPrint.value) {
        const fetchLoading = ElLoading.service({ text: "正在領取佛字第..." }); //

        try {
          //
          if (serviceAdapter.getIsMock()) {
            console.warn("⚠️ 當前模式不為 Directus，將使用 Mock 數據");
            handleTemplateChange(); // 觸發標題更新，確保列印存檔時的檔名同步
            // 🔥 重要：等待 Vue 完成 DOM 更新，確保擷取到的 HTML 內含新編號
            await nextTick();
            await new Promise((resolve) => setTimeout(resolve, 300)); // 給予字體渲染緩衝
          } else {
            /*
              receiptNumber,
              state,
              receiptType,
              voidReason,
              recordIds,
              */

            const state = "remove merged";

            //調用取消的服務/merge/remove，還沒弄好XD
            // 🔥 核心：向 receiptNumberStore 請求生成正式編號，並傳遞必要的上下文
            const result = await receiptStore.removeMergedReceiptNumber(
              currentRecord.value.receiptNumber,
              state,
              currentRecord.value.receiptType,
              currentRecord.value.voidReason,
              currentRecord.value.ids,
            );

            if (result.success) {
              console.log(
                "取消合併成功:",
                currentRecord.value.receiptNumber,
                "取消合併編號 ID:",
                receiptId.value,
              );

              handleTemplateChange(); // 觸發標題更新，確保列印存檔時的檔名同步

              // 🔥 重要：等待 Vue 完成 DOM 更新，確保擷取到的 HTML 內含新編號
              await nextTick();
              await new Promise((resolve) => setTimeout(resolve, 300)); // 給予字體渲染緩衝
            } else {
              throw new Error(result.message);
            }
          }
        } catch (error) {
          ElMessage.error("取消合併失敗: " + error.message);
          fetchLoading.close();
          return; // 領號失敗則中止列印，避免印出 TEMP 編號
        } finally {
          fetchLoading.close();
        }

        if (receiptId.value) {
          // 🔥 重要：將 stateReceiptNumber 的調用放在這裡，確保只有在確認打印完成後才更新編號狀態
          const stateResult = await receiptStore.stateReceiptNumber(
            receiptId.value,
            "取消打印",
            "merged unprinted",
          ); // 同步更新編號狀態為未打印
          if (stateResult?.success) {
            console.log("「取消合併打印」成功");
          } else {
            console.warn("「取消合併打印」失敗:", stateResult?.message);
          }
        } else {
          console.warn("缺少 receiptId，無法更新編號狀態");
        }

        ElMessage({
          type: "info",
          message: "已取消狀態更新，記錄維持原樣。",
        });

        // 可以在這裡加入額外邏輯，例如：
        // 1. 如果是批量打印，是否需要停留在當前頁面不跳轉？（目前邏輯本來就不會跳轉）
        // 2. 是否需要記錄該編號雖然領取但未實際打印？
      }
    }
  }
};

// 刷新保存記錄
const updateSavedRecords = (result) => {
  console.log("刷新保存記錄:", result);

  // 獲取導航來源
  const printState = pageStateStore.getPageState("receiptPrint");
  const source = printState?.from;

  const reqData = {
    source: source,
    receiptNumber: result.data.receiptNumber,
    receiptIssued: result.data.receiptIssued,
    receiptIssuedAt: result.data.receiptIssuedAt,
    receiptIssuedBy: result.data.receiptIssuedBy,
  };
  console.log("檢查「刷新保存記錄」需要的參數:", reqData);

  // 來源是參加頁面執行savedRecords同步
  if (
    source === "joinRecord" &&
    result.data.receiptNumber &&
    result.data.receiptIssued &&
    result.data.receiptIssuedAt &&
    result.data.receiptIssuedBy
  ) {
    console.log(`來源是 ${source} 頁面，更新 ${source} 頁面，側邊欄的緩存數據`);
    const index = joinRecordStore.savedRecords.findIndex(
      (r) => r.id === result.data.id,
    );
    console.log("保存記錄的索引:", index);
    if (index !== -1) {
      console.log("己找到的保存記錄項目:", joinRecordStore.savedRecords[index]);

      joinRecordStore.savedRecords[index] = {
        ...joinRecordStore.savedRecords[index],
        receiptNumber: result.data.receiptNumber,
        receiptIssued: result.data.receiptIssued,
        receiptIssuedAt: result.data.receiptIssuedAt,
        receiptIssuedBy: result.data.receiptIssuedBy,
      };
      console.log(`已同步更新 ${source} 頁面的 Pinia Store`);
      console.log(
        `savedRecords[${index}]:`,
        joinRecordStore.savedRecords[index],
      );
    }
  }
};

const handleClose = () => {
  // 告知 List 頁面需要重新查詢
  sessionStorage.setItem("joinRecordListNeedsRefresh", "true");
  router.back();
};

/**
 * 合併打印：將多筆 manyRecord 的 items 依 type 群組加總 subtotal，
 * 回傳以第一筆為基底、僅更新 items 與 finalAmount 的新 currentRecord。
 *
 * @param {Array} records - manyRecord.value
 * @returns {Object} 合併後的 currentRecord
 */
const buildMergedRecordContext = (records) => {
  const baseRecord = { ...records[0] };

  // 以 type 為 key 做 subtotal 累加；第一次出現時淺拷貝整個 item 保留所有欄位
  const mergedItemsMap = new Map();
  for (const record of records) {
    for (const item of record.items) {
      if (mergedItemsMap.has(item.type)) {
        mergedItemsMap.get(item.type).subtotal += item.subtotal;
      } else {
        mergedItemsMap.set(item.type, { ...item });
      }
    }
  }

  const mergedItems = Array.from(mergedItemsMap.values());
  const mergedFinalAmount = mergedItems.reduce(
    (sum, item) => sum + item.subtotal,
    0,
  );

  //取得 records 的 id 陣列
  const mergedIds = [];
  records.forEach((item, idx) => {
    mergedIds.push(item.id);
  });

  return {
    ...baseRecord,
    items: mergedItems,
    finalAmount: mergedFinalAmount,
    ids: mergedIds,
  };
};

onMounted(() => {
  setPrintTime();

  // 合併打印
  if (!isMergedPrint && !reqPrintId.value) {
    return;
  }

  manyRecord.value = JSON.parse(sessionStorage.getItem(reqPrintId.value));
  if (manyRecord.value) {
    try {
      if (manyRecord.value.length > 0) {
        currentIndex.value = 0;

        /*
          合併打印內容的實現邏輯：
          目前要實現將的合併打印的 "items" 內容併成一份，以 "items"的"type" 做群組將 "subtotal" 做加總然後更新"finalAmount"欄位，currentRecord.value 除了"items"與 "finalAmount" 被更新以外，其餘的資料不變的。
          合併打印只使用第一筆數據來渲染，要實現將合併打印的所有數據都渲染在同一張收據上，
          需要在模板中對 currentRecord.value 進行調整，讓它包含 manyRecord.value 中的所有數據，而不只是第一筆。
          這樣在 handleTemplateChange 和打印時，就能夠使用完整的合併數據來生成收據內容。
          */
        // currentRecord.value = manyRecord.value[0];
        // 合併打印內容實現
        currentRecord.value = buildMergedRecordContext(manyRecord.value);

        handleTemplateChange();
      } else {
        ElMessage.error("合併打印數據為空");
        router.back();
      }
    } catch (e) {
      ElMessage.error("合併打印數據解析失敗");
      router.back();
    }
  } else {
    ElMessage.error("找不到合併打印數據");
    router.back();
  }

  if (!currentRecord.value.id) router.back();
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
  top: 34mm;
  z-index: 0; /* 🔥 在最上層 */
}
/* 財團法人鎮國基金會印信處 */
.seal-box {
  width: 35mm;
  height: 55mm;
  /* border: 0.1pt dashed #f6a7a7; */
  color: #f7cccc;

  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 14pt;

  opacity: 0.5;
  padding: 30px;

  /* background-image: url("/zk-in-bg.png");
  background-repeat: no-repeat;
  background-position: center; */

  /* 核心關鍵 ↓ */
  background-size: contain;
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

.title-text {
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

/* 每行間距 */
.content-section {
  font-size: 15pt;
  line-height: 1.6;
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
  font-size: 16pt;
  font-weight: bold;
  text-align: center;
  letter-spacing: 6px;
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
</style>
