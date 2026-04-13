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
  // 輔助方法：驗證並取得有效的 print_type
  getValidPrintType: (printTypeFromUrl) => {
    const validValues = Object.values(appConfig.PRINT_TYPE);
    if (validValues.includes(printTypeFromUrl)) {
      return printTypeFromUrl;
    }
    return appConfig.PRINT_TYPE.SINGLE; // 預設單筆打印
  },
  // 輔助方法：檢查是否為有效打印類型
  isValidPrintType: (printType) => {
    return Object.values(appConfig.PRINT_TYPE).includes(printType);
  },
};

export default appConfig;
