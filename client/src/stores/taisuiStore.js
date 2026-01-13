// src/stores/taisuiStore.js
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

  const dotLampNames = [
    {
      notes: ["太歲", "驚天", "劍峰"],
      numbers: [1, 13, 25, 37, 49, 61, 73, 85, 97],
      name: "太歲燈",
    },
    {
      notes: ["病符", "凶神"],
      numbers: [12, 24, 36, 48, 60, 72, 84, 96, 108],
      name: "元辰燈",
    },
    {
      notes: ["天狗", "八座", "吊客"],
      numbers: [11, 23, 35, 47, 59, 71, 83, 95, 107],
      name: "光明燈",
    },
    {
      notes: ["卷舌"],
      numbers: [10, 22, 34, 46, 58, 70, 82, 94, 106],
      name: "元辰燈",
    },
    {
      notes: ["白虎", "天殺", "地殺"],
      numbers: [9, 21, 33, 45, 57, 69, 81, 93, 105],
      name: "光明燈",
    },
    {
      notes: ["天厄"],
      numbers: [8, 20, 32, 44, 56, 68, 80, 92, 104],
      name: "元辰燈",
    },
    {
      notes: ["歲破", "大耗"],
      numbers: [7, 19, 31, 43, 55, 67, 79, 91, 103],
      name: "太歲燈",
    },
    {
      notes: ["死符", "小耗"],
      numbers: [6, 18, 30, 42, 54, 66, 78, 90, 102],
      name: "元辰燈",
    },
    {
      notes: ["五鬼", "官符"],
      numbers: [5, 17, 29, 41, 53, 65, 77, 89, 101],
      name: "光明燈",
    },
    {
      notes: ["勾絞", "羊刄", "空亡"],
      numbers: [4, 16, 28, 40, 52, 64, 76, 88, 100],
      name: "元辰燈",
    },
    {
      notes: ["喪門", "地喪"],
      numbers: [3, 15, 27, 39, 51, 63, 75, 87, 99],
      name: "光明燈",
    },
    {
      notes: ["天空", "劫殺"],
      numbers: [2, 14, 26, 38, 50, 62, 74, 86, 98],
      name: "光明燈",
    },
  ];

  // Getter
  const currentAnalysis = computed(() => analysisResult.value);
  const currentInputYear = computed(() => inputYear.value);
  const currentUrlYear = computed(() => urlYear.value);

  // 輸入生肖，根據生肖文字獲取對應的icon圖標，如果找不到則返回問號
  const getZodiacIcon = (zodiacText) => {
    const index = zodiacs.indexOf(zodiacText);
    return index !== -1 ? zodiacIcons[index] : "❓";
  };

  // 計算指定年份的天干地支和生肖信息
  // 基於中國傳統干支紀年法，以公元4年（甲子年）為基準進行計算
  const getYearGanzhi = (year) => {
    // 步驟1: 計算基準偏移量
    // 公元4年是甲子年，作為計算的基準點
    // offset 表示目標年份與基準年份的差值
    const offset = year - 4;

    // 步驟2: 計算天干索引（0-9循環）
    // 天干共有10個，使用模10運算確保在0-9範圍內循環
    // 對應關係：0=甲, 1=乙, 2=丙, 3=丁, 4=戊, 5=己, 6=庚, 7=辛, 8=壬, 9=癸
    const tianganIndex = offset % 10;

    // 步驟3: 計算地支索引（0-11循環）
    // 地支共有12個，使用模12運算確保在0-11範圍內循環
    // 對應關係：0=子(鼠), 1=丑(牛), 2=寅(虎), 3=卯(兔), 4=辰(龍), 5=巳(蛇)
    //          6=午(馬), 7=未(羊), 8=申(猴), 9=酉(雞), 10=戌(狗), 11=亥(豬)
    const dizhiIndex = offset % 12;

    // 步驟4: 獲取對應的生肖圖標
    // 地支索引與生肖圖標數組的索引一一對應
    const zodiacIcon = zodiacIcons[dizhiIndex];

    // 步驟5: 返回完整的干支生肖信息
    return {
      tiangan: tiangans[tianganIndex], // 天干文字（如："甲"、"乙"、"丙"等）
      dizhi: dizhis[dizhiIndex], // 地支文字（如："子"、"丑"、"寅"等）
      zodiac: zodiacs[dizhiIndex], // 生肖文字（如："鼠"、"牛"、"虎"等）
      zodiacIcon: zodiacIcon, // 生肖對應的表情圖標（如："🐭"、"🐂"、"🐯"等）
    };
  };

  // 輸入 計算各種太歲類型
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
  // 生成解釋說明 - 隨機版本（包含隨機祝福語）
  const generateExplanation = (yearInfo) => {
    const {
      zodiac,
      valueTaiSui, // 值太歲
      chongTaiSui, // 沖太歲
      haiTaiSui, // 害太歲
      poTaiSui, // 破太歲
      xingTaiSui, // 刑太歲
    } = yearInfo;

    const valueIcon = getZodiacIcon(valueTaiSui);
    const chongIcon = getZodiacIcon(chongTaiSui);
    const haiIcon = getZodiacIcon(haiTaiSui);
    const poIcon = getZodiacIcon(poTaiSui);
    const xingIcon = getZodiacIcon(xingTaiSui);

    // 值太歲隨機句子陣列
    const valueSentences = [
      `${valueIcon}屬${valueTaiSui}即本命年，犯值太歲，宜點光明燈保平安。`,
      `${valueIcon}屬${valueTaiSui}者值本命年，犯值太歲，宜點光明燈祈願元辰光彩、家運昌隆。`,
      `${valueIcon}屬${valueTaiSui}本命年犯太歲，謹啟平安燈，願燈火長明，化煞轉吉、歲歲平安。`,
      `${valueIcon}屬${valueTaiSui}值年太歲臨，安太歲燈虔心祈請，災厄遠離、福祿雙增、燈照前程。`,
      `${valueIcon}屬${valueTaiSui}今逢太歲年，敬點元辰燈，燈照心中善願，守家人康泰、事事如意。`,
      `${valueIcon}屬${valueTaiSui}流年犯太歲，燃起長明燈，護佑身家事，福壽綿長、順遂無礙。`,
    ];

    // 沖太歲隨機句子陣列
    const chongSentences = [
      `${chongIcon}屬${chongTaiSui}沖太歲，宜安太歲燈化解沖擊。`,
      `${chongIcon}屬${chongTaiSui}沖太歲，宜安太歲燈，祈求避開沖擊、事業順遂、家運昌隆。`,
      `${chongIcon}屬${chongTaiSui}今歲沖太歲，點光明燈祈願無恙、財運亨通、閤家平安。`,
      `${chongIcon}屬${chongTaiSui}者，燃平安燈助元神，願燈光穿霧、消沖煞、迎祥納福。`,
      `${chongIcon}屬${chongTaiSui}逢沖太歲，獻太歲燈，願歲歲平安、身心康泰、燈火長明。`,
      `${chongIcon}屬${chongTaiSui}流年沖太歲，敬點長明燈，祈願化沖為祥、福星高照、安穩如意。`,
    ];

    // 害太歲隨機句子陣列
    const haiSentences = [
      `${haiIcon}屬${haiTaiSui}者，因與太歲生肖相害，易遭小人破壞，建議安光明燈化解。`,
      `${haiIcon}屬${haiTaiSui}者，今逢犯害太歲，敬點光明燈以祈貴人扶助、小人遠離、萬事順遂。`,
      `${haiIcon}屬${haiTaiSui}值此流年，宜安太歲燈於神前，燈火長明，化解害煞、護佑平安。`,
      `${haiIcon}屬${haiTaiSui}今歲犯害太歲，特燃平安燈，願燈光遍照心間、破除障礙、迎福來。`,
      `${haiIcon}屬${haiTaiSui}者，宜於佛前點長明燈，祈求小人不近、家運昌隆、心燈明亮。`,
      `${haiIcon}屬${haiTaiSui}值害太歲，敬獻太歲燈於廟堂，願燈火映照，化煞轉吉、歲歲安然。`,
    ];

    // 破太歲隨機句子陣列
    const poSentences = [
      `${poIcon}屬${poTaiSui}者犯破太歲，需注意破財及健康問題，可考慮安太歲燈。`,
      `${poIcon}屬${poTaiSui}者，臨破太歲，宜點太歲燈以鎮破財凶煞、護佑健康、穩步前行。`,
      `${poIcon}屬${poTaiSui}今歲犯破太歲，虔心燃光明燈，願燈火照亮家門、化破為昌、歲歲有餘。`,
      `${poIcon}屬${poTaiSui}值破太歲，特於佛前安平安燈，祈願破中得成、福祿雙增、諸事如意。`,
      `${poIcon}屬${poTaiSui}者，宜點長明燈於壇前，願燈光不滅、破煞無形、福運光顯。`,
      `${poIcon}屬${poTaiSui}值破太歲，敬獻太歲燈，護佑吾家、轉危為安、財源滾滾、健康康泰。`,
    ];

    // 刑太歲隨機句子陣列
    const xingSentences = [
      `${xingIcon}屬${xingTaiSui}者，因刑太歲而運勢不順，宜點光明燈緩和煞氣。`,
      `${xingIcon}屬${xingTaiSui}者，因刑太歲而運勢不足，宜點光明燈助元神光彩、緩和煞氣、迎祥。`,
      `${xingIcon}屬${xingTaiSui}今逢刑太歲，壇安太歲燈，願燈光照亮前程、驅散陰煞、護佑平順。`,
      `${xingIcon}屬${xingTaiSui}者，宜燃長明燈，願此燈不熄、化刑為祥、事事皆吉。`,
      `${xingIcon}屬${xingTaiSui}逢刑太歲，虔心點平安燈，祈願煩憂散去、福壽綿長、家庭和樂。`,
      `${xingIcon}屬${xingTaiSui}因刑太歲，謹啟太歲燈於壇前，願燈火永明、護佑吾身、化難為安。`,
    ];

    // 祝福語隨機句子陣列
    const blessingSentences = [
      `${yearInfo.tiangan}${yearInfo.dizhi}${valueTaiSui}年專屬的祝福與守護，願喜迎福運，心想事成，健康美滿，阿弥陀佛！`,
      `祝${yearInfo.tiangan}${yearInfo.dizhi}${valueTaiSui}年，點亮光明燈，化解犯沖害破刑，太歲護佑、平安順遂，阿弥陀佛！`,
      `願${yearInfo.tiangan}${yearInfo.dizhi}${valueTaiSui}年，安太歲燈長明，化煞轉吉，諸太歲者皆平安喜樂、福運綿長，阿弥陀佛！`,
      `祝福${yearInfo.tiangan}${yearInfo.dizhi}${valueTaiSui}年，祈願破太歲、沖太歲、刑太歲、害太歲者皆逢凶化吉、阿弥陀佛！`,
      `願${yearInfo.tiangan}${yearInfo.dizhi}${valueTaiSui}年，長明燈光普照，太歲護佑，家人康泰、事業順心、福樂圓滿，阿弥陀佛！`,
      `祝${yearInfo.tiangan}${yearInfo.dizhi}${valueTaiSui}年，安太歲，化解太歲煞氣，平安喜樂、福壽綿延，阿弥陀佛！`,
      `${yearInfo.tiangan}${yearInfo.dizhi}${valueTaiSui}年，願太歲護佑，點亮光明燈，家宅平安、福運亨通、心想事成，阿弥陀佛！`,
      `祝${yearInfo.tiangan}${yearInfo.dizhi}${valueTaiSui}年，燈火長明，化解太歲煞氣，身心康泰、事業順遂、家庭和樂，阿弥陀佛！`,
      `願${yearInfo.tiangan}${yearInfo.dizhi}${valueTaiSui}年，安太歲燈於神前，照亮前程，消災解厄、財運亨通、平安喜樂，阿弥陀佛！`,
      `${yearInfo.tiangan}${yearInfo.dizhi}${valueTaiSui}年專屬祝福，燃平安燈祈願太歲護佑，福壽綿長、吉祥安康，阿弥陀佛！`,
      `祝${yearInfo.tiangan}${yearInfo.dizhi}${valueTaiSui}年，長明燈光普照，太歲護佑平安，喜迎福運、健康美滿、福慧增長，阿弥陀佛！`,
    ];

    // 隨機選擇函數
    const getRandomSentence = (sentences) => {
      const randomIndex = Math.floor(Math.random() * sentences.length);
      return sentences[randomIndex];
    };

    // 隨機選擇每種太歲的句子和祝福語
    const valueSentence = getRandomSentence(valueSentences);
    const chongSentence = getRandomSentence(chongSentences);
    const haiSentence = getRandomSentence(haiSentences);
    const poSentence = getRandomSentence(poSentences);
    const xingSentence = getRandomSentence(xingSentences);
    const blessingSentence = getRandomSentence(blessingSentences);

    return `
${yearInfo.tiangan}${yearInfo.dizhi}${valueTaiSui}年犯太歲的祈福說明，結合生肖特性與祈福選擇，更有信心迎接挑戰：

${valueSentence}
${chongSentence}
${haiSentence}
${poSentence}
${xingSentence}

以上五種生肖因犯不同太歲煞氣，皆推薦採用結合生肖特性的祈福，多方位化解災厄，招來福祿壽禧，讓新的一年平安、順利、興旺發達。

${blessingSentence}
  `.trim();
  };

  /* 主要分析函數
  year: 2025,           // 年份
  tiangan: "乙",        // 天干
  dizhi: "巳",          // 地支  
  zodiac: "蛇",         // 生肖
  zodiacIcon: "🐍",     // 生肖圖標
  taiSuiTypes: {        // 太歲類型
    valueTaiSui: "蛇",  // 值太歲（本命年）
    chongTaiSui: "豬",  // 沖太歲
    haiTaiSui: "虎",    // 害太歲
    poTaiSui: "牛",     // 破太歲
    xingTaiSui: "猴"    // 刑太歲
    explanation: "於2025（乙巳）年犯太歲的祈福說明..."
  */
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
    try {
      if (!year || isNaN(year)) {
        throw new Error("請輸入有效的年份");
      }

      if (year < 1900 || year > 2100) {
        throw new Error("請輸入合理的年份（1900-2100）");
      }

      const result = analyzeYear(year);
      setAnalysisResult(result);
      return result;
    } catch (error) {
      console.error("分析错误:", error);
      throw error;
    }
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

  // 获取指定年份的点灯表格数据（基于 TaisuiLamp.vue 的逻辑）
  const getDotLampTableData = (year) => {
    // 获取当前年份的天干地支信息
    const { tiangan, dizhi, zodiac, zodiacIcon } = getYearGanzhi(year);
    const dizhiIndex = dizhis.indexOf(dizhi);

    // 计算某栏位对应的 dotLampNames 索引
    const getDotLampIndex = (columnIndex) => {
      // 核心逻辑：从当前年份生肖开始，该生肖对应 dotLampNames[0]，顺序往后排
      const currentZodiacIndex = dizhiIndex;
      const offset = (columnIndex - currentZodiacIndex + 12) % 12;
      return offset;
    };

    // 获取某列的神煞注释
    const getNotesForColumn = (columnIndex) => {
      const dotLampIndex = getDotLampIndex(columnIndex);
      return dotLampNames[dotLampIndex]?.notes || [];
    };

    // 获取某列的流年数字
    const getNumbersForColumn = (columnIndex) => {
      const dotLampIndex = getDotLampIndex(columnIndex);
      return dotLampNames[dotLampIndex]?.numbers || [];
    };

    // 获取某列的灯种名称
    const getLampNamesForColumn = (columnIndex) => {
      const dotLampIndex = getDotLampIndex(columnIndex);
      const name = dotLampNames[dotLampIndex]?.name;
      return name ? [name] : [];
    };

    // 获取灯种的 CSS 类名
    const getLampClass = (lampName) => {
      if (lampName.includes("太歲燈")) return "lamp-taisui";
      if (lampName.includes("元辰燈")) return "lamp-yuanchen";
      if (lampName.includes("光明燈")) return "lamp-guangming";
      return "";
    };

    // 检查是否为当前年份对应的列
    const isCurrentYearColumn = (columnIndex) => {
      return columnIndex === dizhiIndex;
    };

    // 提供根據生肖查詢對應燈種的方法
    const getLampInfoByZodiac = (zodiac) => {
      // 找到生肖在表格中的索引位置
      const zodiacIndex = zodiacs.indexOf(zodiac);
      if (zodiacIndex === -1) return null;

      // 計算該生肖對應的 dotLampNames 索引
      const dotLampIndex = (zodiacIndex - dizhiIndex + 12) % 12;
      const dotLampItem = dotLampNames[dotLampIndex];

      if (!dotLampItem) return null;

      return {
        zodiac: zodiac,
        zodiacIcon: zodiacIcons[zodiacIndex],
        lampName: dotLampItem.name,
        notes: dotLampItem.notes,
        numbers: dotLampItem.numbers,

        // 完整的解釋信息
        explanation: `${zodiac}年（屬${zodiacs[zodiacIndex]}）對應點燈信息：
      - 燈種：${dotLampItem.name}
      - 神煞：${dotLampItem.notes.join("、")}
      - 流年數：${dotLampItem.numbers.join("、")}
      - 適用年齡：${dotLampItem.numbers.map((num) => `${num}歲`).join("、")}
      
      建議：${
        dotLampItem.name === "太歲燈"
          ? "適用於值太歲、歲破等重大煞氣，提供強力化解與護佑。"
          : dotLampItem.name === "元辰燈"
          ? "適用於病符、死符、天厄等健康與運勢煞氣，祈求身心安康。"
          : "適用於白虎、五鬼、喪門等一般煞氣，普遍化解、照亮前程。"
      }`,
      };
    };

    // 提供查詢所有生肖燈種信息的方法
    const getAllZodiacLampInfo = () => {
      return zodiacs.map((zodiac, index) => {
        const dotLampIndex = (index - dizhiIndex + 12) % 12;
        const dotLampItem = dotLampNames[dotLampIndex];

        return {
          zodiac,
          zodiacIcon: zodiacIcons[index],
          lampName: dotLampItem?.name || "未知",
          notes: dotLampItem?.notes || [],
          numbers: dotLampItem?.numbers || [],
          isCurrentYear: index === dizhiIndex, // 是否為當前年份的生肖
          dizhi: dizhis[index],
        };
      });
    };

    return {
      year,
      currentYearInfo: {
        tiangan,
        dizhi,
        zodiac,
        zodiacIcon,
        dizhiIndex,
      },

      // 生肖查詢燈種方法
      getLampInfoByZodiac,
      getAllZodiacLampInfo,

      // 表格基础数据
      tableHeader: [...dizhis], // 地支顺序排列
      zodiacRow: [...zodiacs], // 生肖顺序排列

      // 表格处理方法
      getNotesForColumn,
      getNumbersForColumn,
      getLampNamesForColumn,
      getLampClass,
      isCurrentYearColumn,

      // 常量数据（供页面使用）
      dizhis,
      zodiacs,
      dotLampNames,
      getZodiacIcon,
    };
  };

  // 完整的点灯表格分析
  const analyzeDotLampTable = (year) => {
    try {
      if (!year || isNaN(year)) {
        throw new Error("請輸入有效的年份");
      }

      if (year < 1900 || year > 2100) {
        throw new Error("請輸入合理的年份（1900-2100）");
      }

      return getDotLampTableData(year);
    } catch (error) {
      console.error("分析點燈表格錯誤:", error);
      throw error;
    }
  };

  return {
    // 新增点灯表格相关方法
    getDotLampTableData,
    analyzeDotLampTable,

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
