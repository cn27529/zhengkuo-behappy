export const appConfig = {
  title: "鎮國寺祈福登記系統",
  dollarTitle: "NT$ ", //NT$, 💰
  formatCurrency: (value) => {
    const currencyAmount = new Intl.NumberFormat("zh-TW", {
      style: "currency",
      currency: "TWD",
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);
    return currencyAmount;
  },
  // 打印類型列舉
  PRINT_TYPE: Object.freeze({
    SINGLE: "single_print",
    BATCH: "batch_print",
    MERGED: "merged_print",
  }),
  //收據打印類型列舉，收據"stamp" 或 感謝狀"standard"
  RECEIPT_TYPE: Object.freeze({
    STAMP: "stamp",
    STANDARD: "standard",    
  }),

  // 根據參加類型對應的配置（標籤、價格、來源）：超度/超薦、陽上人、點燈(光明燈)、祈福、固定消災、中元普度、護持三寶、供齋、護持道場、助印經書、放生
  JOIN_RECORD_TYPE: Object.freeze({
    CHAODU: "chaodu",
    SURVIVORS: "survivors",
    DIANDENG: "diandeng",
    QIFU: "qifu",
    XIAOZAI: "xiaozai",
    PUDU: "pudu",
    SUPPORT_TRIPLE_GEM: "support_triple_gem",
    FOOD_OFFERING: "food_offering",
    SUTRA_PRINTING: "sutra_printing",
    LIFE_RELEASE: "life_release",
  }),

};

export default appConfig;
