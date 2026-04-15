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
};

export default appConfig;
