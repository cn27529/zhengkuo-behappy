// src/stores/taisui.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useTaiSuiStore = defineStore("taisui", () => {
  // 狀態
  const inputYear = ref(new Date().getFullYear());
  const analysisResult = ref(null);
  const urlYear = ref(null);

  // 常量數據
  const tiangans = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const dizhis = [
    "子",
    "丑",
    "寅",
    "卯",
    "辰",
    "巳",
    "午",
    "未",
    "申",
    "酉",
    "戌",
    "亥",
  ];
  const zodiacs = [
    "鼠",
    "牛",
    "虎",
    "兔",
    "龍",
    "蛇",
    "馬",
    "羊",
    "猴",
    "雞",
    "狗",
    "豬",
  ];
  const zodiacIcons = [
    "🐭",
    "🐂",
    "🐯",
    "🐰",
    "🐉",
    "🐍",
    "🐴",
    "🐏",
    "🐒",
    "🐓",
    "🐶",
    "🐷",
  ];

  // Getter
  const currentAnalysis = computed(() => analysisResult.value);
  const currentInputYear = computed(() => inputYear.value);
  const currentUrlYear = computed(() => urlYear.value);

  // 根據生肖文字獲取對應的圖標
  const getZodiacIcon = (zodiacText) => {
    const index = zodiacs.indexOf(zodiacText);
    return index !== -1 ? zodiacIcons[index] : "❓";
  };

  // 計算天干地支
  const getYearGanzhi = (year) => {
    const offset = year - 4; // 以甲子年公元4年為基準
    const tianganIndex = offset % 10;
    const dizhiIndex = offset % 12;
    const zodiacIcon = zodiacIcons[dizhiIndex];
    return {
      tiangan: tiangans[tianganIndex],
      dizhi: dizhis[dizhiIndex],
      zodiac: zodiacs[dizhiIndex],
      zodiacIcon: zodiacIcon,
    };
  };

  // 計算各種太歲類型
  const getTaiSuiTypes = (dizhi) => {
    const index = dizhis.indexOf(dizhi);
    return {
      valueTaiSui: zodiacs[index], // 值太歲(本命年)
      chongTaiSui: zodiacs[(index + 6) % 12], // 沖太歲(地支相沖+6)
      haiTaiSui: zodiacs[(index + 9) % 12], // 害太歲(+9，寅巳為害太歲例)
      poTaiSui: zodiacs[(index + 8) % 12], // 破太歲(+8)
      xingTaiSui: zodiacs[(index + 3) % 12], // 刑太歲(+3)
    };
  };

  /* 
  生成解釋說明
  2025年犯太歲的祈福說明，結合生肖特性與祈福燈選擇，更有信心迎接挑戰：
🐍 屬蛇即本命年，犯值太歲，宜點光明灯保平安。光明灯祈福範圍廣泛，因應需求包括平安灯、文昌灯、财神灯、药师灯、姻缘灯，幫助淨化煞氣，提升順遂運勢。
🐯 屬虎者，因與太歲生肖相害，易遭小人破壞，建議安光明灯化解，特別是平安灯與文昌灯可助增強智慧與人緣，财神灯助招財引吉。
🐒 屬猴者，因刑太歲而運勢不順，宜點光明灯緩和煞氣，其中文昌灯助學業事業，药师灯保健康，光明灯提供全面守護。
🐷 屬豬者沖太歲，宜安太岁灯化解沖擊，搭配光明灯的平安灯和财神灯，轉化波動運勢，導向平和與富足。
🐂 屬牛者犯破太歲，需注意破財及健康問題，可考慮安太岁灯，配搭药师灯祈求健康，平安灯保平穩，财神灯增財運，全面化解。
以上五種生肖因犯不同太歲煞氣，皆推薦採用光明燈與太歲燈結合的祈福方案，多方位化解災厄，招來福祿壽禧，讓新的一年平安、順利、興旺發達。
2025年乙巳蛇年專屬的祝福與守護，願喜迎福運，心想事成，健康美滿！，阿弥陀佛！
   */
  const generateExplanation = (yearInfo) => {
    const {
      zodiac,
      valueTaiSui,
      chongTaiSui,
      haiTaiSui,
      poTaiSui,
      xingTaiSui,
    } = yearInfo;

    const valueIcon = getZodiacIcon(valueTaiSui);
    const haiIcon = getZodiacIcon(haiTaiSui);
    const xingIcon = getZodiacIcon(xingTaiSui);
    const chongIcon = getZodiacIcon(chongTaiSui);
    const poIcon = getZodiacIcon(poTaiSui);

    return `
於${yearInfo.year}（${yearInfo.tiangan}${yearInfo.dizhi}）年犯太歲的祈福說明，結合生肖特性與祈福燈選擇，更有信心迎接挑戰：
${valueIcon}屬${valueTaiSui}即本命年，犯值太歲，宜點光明燈保平安。
${haiIcon}屬${haiTaiSui}者，因與太歲生肖相害，易遭小人破壞，建議安光明燈化解。
${xingIcon}屬${xingTaiSui}者，因刑太歲而運勢不順，宜點光明燈緩和煞氣。
${chongIcon}屬${chongTaiSui}者沖太歲，宜安太歲燈化解沖擊。
${poIcon}屬${poTaiSui}者犯破太歲，需注意破財及健康問題，可考慮安太歲燈。
以上五種生肖因犯不同太歲煞氣，皆推薦採用光明燈與太歲燈結合的祈福方案，多方位化解災厄，招來福祿壽禧，讓新的一年平安、順利、興旺發達。
${yearInfo.tiangan}${yearInfo.dizhi}${valueTaiSui}年專屬的祝福與守護，願喜迎福運，心想事成，健康美滿，阿弥陀佛！
    `.trim();
  };

  // 主要分析函數
  const analyzeYear = (year) => {
    const { tiangan, dizhi, zodiac, zodiacIcon } = getYearGanzhi(year);
    const taiSuiTypes = getTaiSuiTypes(dizhi);
    const explanation = generateExplanation({
      year,
      tiangan,
      dizhi,
      zodiac,
      ...taiSuiTypes,
    });
    return {
      year,
      tiangan,
      dizhi,
      zodiac,
      zodiacIcon,
      taiSuiTypes,
      explanation,
    };
  };

  // Actions
  const setInputYear = (year) => {
    inputYear.value = year;
  };

  const setUrlYear = (year) => {
    urlYear.value = year;
  };

  const setAnalysisResult = (result) => {
    analysisResult.value = result;
  };

  const performAnalysis = (year) => {
    if (!year || isNaN(year)) {
      throw new Error("請輸入有效的年份");
    }

    if (year < 1900 || year > 2100) {
      throw new Error("請輸入合理的年份（1900-2100）");
    }

    const result = analyzeYear(year);
    setAnalysisResult(result);
    return result;
  };

  const resetAnalysis = () => {
    inputYear.value = new Date().getFullYear();
    analysisResult.value = null;
    urlYear.value = null;
  };

  // 獲取所有生肖數據（用於顯示參考）
  const getAllZodiacs = () => {
    return zodiacs.map((zodiac, index) => ({
      name: zodiac,
      icon: zodiacIcons[index],
      dizhi: dizhis[index],
    }));
  };

  return {
    // 狀態
    inputYear,
    analysisResult,
    urlYear,

    // Getter
    currentAnalysis,
    currentInputYear,
    currentUrlYear,

    // Actions
    setInputYear,
    setUrlYear,
    setAnalysisResult,
    performAnalysis,
    resetAnalysis,
    getZodiacIcon,
    getAllZodiacs,
  };
});
