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
};

export default appConfig;
