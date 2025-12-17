// src/stores/monthlyDonateStore.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { generateGitHash } from "../utils/generateGitHash.js";
import { baseService } from "../services/baseService.js";
import { DateUtils } from "../utils/dateUtils.js";
import mockDatas from "../data/mock_monthlyDonates.json";
import { monthlyDonateService } from "../services/monthlyDonateService.js";

export const useMonthlyDonateStore = defineStore("monthlyDonate", () => {
  // ========== 狀態 ==========
  const allDonates = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // 搜尋與分頁狀態
  const searchQuery = ref("");
  const selectedTab = ref("all");
  const currentPage = ref(1);
  const pageSize = ref(10);

  // 贊助設定
  const monthlyUnitPrice = ref(100); // 每月基本單位金額，可調整

  // ✅ 新增：月份顯示設定
  const monthDisplayConfig = ref({
    pastMonths: 0, // 顯示過去的月份數
    futureMonths: 12, // 顯示未來的月份數
    showAllMonths: false, // 是否顯示所有月份（不限於24個月）
    customStartDate: null, // 自定義開始日期
    customEndDate: null, // 自定義結束日期
  });

  // ========== 工具函數 ==========

  /**
   * 生成月份列表（可配置過去和未來的月份數）
   */
  const generateMonthList = (config = null) => {
    const configToUse = config || monthDisplayConfig.value;
    const {
      pastMonths,
      futureMonths,
      showAllMonths,
      customStartDate,
      customEndDate,
    } = configToUse;

    const months = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11

    // 如果使用自定義日期範圍
    if (customStartDate && customEndDate && !showAllMonths) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);

      let current = new Date(start.getFullYear(), start.getMonth(), 1);
      const endDate = new Date(end.getFullYear(), end.getMonth(), 1);

      while (current <= endDate) {
        const year = current.getFullYear();
        const month = current.getMonth() + 1;
        const yearMonth = `${year}${month.toString().padStart(2, "0")}`;
        const isPast = current < new Date(now.getFullYear(), now.getMonth(), 1);

        months.push({
          yearMonth,
          //display: `${year}年${month}月`,
          display: `${year.toString().slice(-2)}年${month}`, //縮小為"25年9"字樣
          isPast,
          date: new Date(current),
        });

        current.setMonth(current.getMonth() + 1);
      }

      return months;
    }

    // 如果顯示所有月份（從最早的贊助開始到最晚的贊助結束）
    if (showAllMonths) {
      // 找出所有贊助中的最早和最晚月份
      let minDate = null;
      let maxDate = null;

      allDonates.value.forEach((donate) => {
        donate.donateItems.forEach((item) => {
          item.months.forEach((monthStr) => {
            const year = parseInt(monthStr.substring(0, 4));
            const month = parseInt(monthStr.substring(4, 6)) - 1;
            const date = new Date(year, month, 1);

            if (!minDate || date < minDate) minDate = date;
            if (!maxDate || date > maxDate) maxDate = date;
          });
        });
      });

      // 如果沒有贊助數據，使用預設範圍
      if (!minDate || !maxDate) {
        minDate = new Date(currentYear, currentMonth - pastMonths, 1);
        maxDate = new Date(currentYear, currentMonth + futureMonths, 1);
      } else {
        // 擴展範圍，顯示前後各3個月
        minDate.setMonth(minDate.getMonth() - 3);
        maxDate.setMonth(maxDate.getMonth() + 3);
      }

      let current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
      const endDate = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

      while (current <= endDate) {
        const year = current.getFullYear();
        const month = current.getMonth() + 1;
        const yearMonth = `${year}${month.toString().padStart(2, "0")}`;
        const isPast = current < new Date(now.getFullYear(), now.getMonth(), 1);

        months.push({
          yearMonth,
          //display: `${year}年${month}月`,
          display: `${year.toString().slice(-2)}年${month}`, //縮小為"25年9"字樣
          isPast,
          date: new Date(current),
        });

        current.setMonth(current.getMonth() + 1);
      }

      return months;
    }

    // 標準模式：過去X個月 + 未來Y個月
    // 過去月份
    for (let i = pastMonths; i >= 1; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const yearMonth = `${year}${month.toString().padStart(2, "0")}`;

      months.push({
        yearMonth,
        //display: `${year}年${month}月`,
        display: `${year.toString().slice(-2)}年${month}`, //縮小為"25年9"字樣
        isPast: true,
        date: date,
      });
    }

    // 當月
    const currentYearMonth = `${currentYear}${(currentMonth + 1)
      .toString()
      .padStart(2, "0")}`;
    months.push({
      yearMonth: currentYearMonth,
      //display: `${currentYear}年${currentMonth + 1}月`,
      display: `${currentYear.toString().slice(-2)}年${currentMonth + 1}`, //縮小為"25年9"字樣
      isPast: false,
      date: new Date(currentYear, currentMonth, 1),
    });

    // 未來月份
    for (let i = 1; i <= futureMonths; i++) {
      const date = new Date(currentYear, currentMonth + i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const yearMonth = `${year}${month.toString().padStart(2, "0")}`;

      months.push({
        yearMonth,
        //display: `${year}年${month}月`,
        display: `${year.toString().slice(-2)}年${month}`, //縮小為"25年9"字樣
        isPast: false,
        date: date,
      });
    }

    return months;
  };

  /**
   * ✅ 新增：獲取月份列表（兼容舊的24個月方法）
   */
  // const generate24MonthList = () => {
  //   return generateMonthList({
  //     pastMonths: 12,
  //     futureMonths: 12,
  //     showAllMonths: false,
  //   });
  // };

  /**
   * ✅ 新增：24個月方法（保持兼容性）
   */
  const generate24MonthList = () => {
    return generateStandardMonthRange(12, 12);
  };

  /**
   * ✅ 新增：測試月份生成函數
   */
  const testMonthGeneration = () => {
    console.group("🔧 測試月份生成");
    console.log("當前配置:", monthDisplayConfig.value);
    console.log("生成的 monthColumns:", monthColumns.value);
    console.groupEnd();
    return monthColumns.value;
  };

  /**
   * ✅ 新增：為特定贊助人生成相關的月份列表
   * @param {string} recordId - 資料庫ID
   */
  // const generateMonthsForDonator = (recordId) => {
  //   // 獲取贊助人的所有贊助月份
  //   const donatorMonths = getDonatorMonths(recordId);

  //   if (donatorMonths.length === 0) {
  //     return generateMonthList(); // 使用預設配置
  //   }

  //   // 找出最早和最晚的月份
  //   const dates = donatorMonths.map((monthStr) => {
  //     const year = parseInt(monthStr.substring(0, 4));
  //     const month = parseInt(monthStr.substring(4, 6)) - 1;
  //     return new Date(year, month, 1);
  //   });

  //   const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  //   const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

  //   // 擴展範圍：前後各加6個月
  //   minDate.setMonth(minDate.getMonth() - 6);
  //   maxDate.setMonth(maxDate.getMonth() + 6);

  //   return generateMonthList({
  //     customStartDate: minDate,
  //     customEndDate: maxDate,
  //     showAllMonths: false,
  //   });
  // };

  /**
   * ✅ 新增：為新增/編輯贊助生成月份列表
   */
  // const generateMonthsForDonation = (excludeMonths = []) => {
  //   const config = { ...monthDisplayConfig.value };

  //   // 如果需要，可以根據排除的月份調整顯示範圍
  //   if (excludeMonths.length > 0 && config.showAllMonths) {
  //     // 在顯示所有月份模式下，確保排除的月份也被考慮
  //     return generateMonthList(config);
  //   }

  //   return generateMonthList(config);
  // };

  /**
   * 計算可贊助的月份數量
   */
  const calculateMonthCount = (amount) => {
    return Math.floor(amount / monthlyUnitPrice.value);
  };

  /**
   * 根據金額和起始月份生成月份列表
   */
  const generateMonthsFromAmount = (amount, startYearMonth) => {
    const monthCount = calculateMonthCount(amount);
    const months = [];

    // 解析起始年月
    const startYear = parseInt(startYearMonth.substring(0, 4));
    const startMonth = parseInt(startYearMonth.substring(4, 6)) - 1; // 0-11

    for (let i = 0; i < monthCount; i++) {
      const date = new Date(startYear, startMonth + i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      months.push(`${year}${month.toString().padStart(2, "0")}`);
    }

    return months;
  };

  // ========== Getter - 計算屬性 ==========

  /**
   * 24個月的列表
   */
  const monthColumns = computed(() => {
    console.log("📅 monthColumns 計算，配置:", monthDisplayConfig.value);

    const {
      pastMonths,
      futureMonths,
      showAllMonths,
      customStartDate,
      customEndDate,
    } = monthDisplayConfig.value;

    // 如果使用自定義日期範圍
    if (customStartDate && customEndDate && !showAllMonths) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);

      console.log("使用自定義範圍:", start, "到", end);
      return generateCustomMonthRange(start, end);
    }

    // 如果顯示所有月份
    if (showAllMonths) {
      console.log("顯示所有月份模式");
      return generateAllMonthsRange();
    }

    // 標準模式：過去X個月 + 當前月 + 未來Y個月
    console.log(
      `標準模式: 過去${pastMonths}個月 + 當前月 + 未來${futureMonths}個月`
    );
    return generateStandardMonthRange(pastMonths, futureMonths);
  });

  /**
   * ✅ 新增：生成標準月份範圍
   */
  const generateStandardMonthRange = (pastMonths, futureMonths) => {
    const months = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11

    // 過去月份
    for (let i = pastMonths; i >= 1; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const yearMonth = `${year}${month.toString().padStart(2, "0")}`;

      months.push({
        yearMonth,
        //display: `${year}年${month}月`,
        display: `${year.toString().slice(-2)}年${month}`, //縮小為"25年9"字樣
        isPast: true,
        date: date,
      });
    }

    // 當月
    const currentYearMonth = `${currentYear}${(currentMonth + 1)
      .toString()
      .padStart(2, "0")}`;
    months.push({
      yearMonth: currentYearMonth,
      //display: `${currentYear}年${currentMonth + 1}月`,
      display: `${currentYear.toString().slice(-2)}年${currentMonth + 1}`, //縮小為"25年9"字樣
      isPast: false,
      date: new Date(currentYear, currentMonth, 1),
    });

    // 未來月份
    for (let i = 1; i <= futureMonths; i++) {
      const date = new Date(currentYear, currentMonth + i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const yearMonth = `${year}${month.toString().padStart(2, "0")}`;

      months.push({
        yearMonth,
        //display: `${year}年${month}月`,
        display: `${year.toString().slice(-2)}年${month}`, //縮小為"25年9"字樣
        isPast: false,
        date: date,
      });
    }

    console.log(`生成的月份範圍: ${months.length}個月`);
    if (months.length > 0) {
      console.log(
        `開始: ${months[0].display}, 結束: ${months[months.length - 1].display}`
      );
    }

    return months;
  };

  /**
   * ✅ 新增：生成自定義月份範圍
   */
  /**
   * ✅ 新增：生成自定義月份範圍
   */
  const generateCustomMonthRange = (startDate, endDate) => {
    const months = [];
    const now = new Date();

    let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

    while (current <= end) {
      const year = current.getFullYear();
      const month = current.getMonth() + 1;
      const yearMonth = `${year}${month.toString().padStart(2, "0")}`;
      const isPast = current < new Date(now.getFullYear(), now.getMonth(), 1);

      months.push({
        yearMonth,
        //display: `${year}年${month}月`,
        display: `${year.toString().slice(-2)}年${month}`, //縮小為"25年9"字樣
        isPast,
        date: new Date(current),
      });

      current.setMonth(current.getMonth() + 1);
    }

    console.log(`自定義範圍: ${months.length}個月`);
    return months;
  };

  /**
   * ✅ 新增：生成所有月份範圍
   */
  const generateAllMonthsRange = () => {
    const months = [];
    const now = new Date();

    // 找出所有贊助中的最早和最晚月份
    let minDate = null;
    let maxDate = null;

    allDonates.value.forEach((donate) => {
      donate.donateItems.forEach((item) => {
        item.months.forEach((monthStr) => {
          const year = parseInt(monthStr.substring(0, 4));
          const month = parseInt(monthStr.substring(4, 6)) - 1;
          const date = new Date(year, month, 1);

          if (!minDate || date < minDate) minDate = date;
          if (!maxDate || date > maxDate) maxDate = date;
        });
      });
    });

    // 如果沒有贊助數據，使用預設範圍（過去1年，未來1年）
    if (!minDate || !maxDate) {
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      minDate = new Date(currentYear, currentMonth - 12, 1);
      maxDate = new Date(currentYear, currentMonth + 12, 1);
    } else {
      // 擴展範圍，顯示前後各3個月
      minDate = new Date(minDate.getFullYear(), minDate.getMonth() - 3, 1);
      maxDate = new Date(maxDate.getFullYear(), maxDate.getMonth() + 3, 1);
    }

    console.log("所有月份範圍:", minDate, "到", maxDate);
    return generateCustomMonthRange(minDate, maxDate);
  };

  /**
   * ✅ 新增：詳細檢視用的月份列表
   */
  // const detailMonthColumns = computed(() => {
  //   return (recordId) => {
  //     if (!recordId) return generateMonthList();
  //     return generateMonthsForDonator(recordId);
  //   };
  // });

  /**
   * ✅ 新增：新增/編輯贊助用的月份列表
   */
  // const donationMonthColumns = computed(() => {
  //   return (excludeMonths = []) => {
  //     return generateMonthsForDonation(excludeMonths);
  //   };
  // });

  /**
   * ✅ 新增：獲取月份顯示配置
   */
  // const getMonthDisplayConfig = computed(() => {
  //   return monthDisplayConfig.value;
  // });

  /**
   * 處理後的贊助人列表（合併相同贊助人的資料）
   */
  const donateSummary = computed(() => {
    const summaryMap = new Map();
    const monthList = monthColumns.value.map((m) => m.yearMonth);

    allDonates.value.forEach((donate) => {
      const key = donate.name;

      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          id: donate.id,
          name: donate.name,
          registrationId: donate.registrationId,
          donateId: donate.donateId,
          icon: donate.icon || "💰",
          memo: donate.memo || "",
          months: monthList.reduce((acc, month) => {
            acc[month] = [];
            return acc;
          }, {}),
          allMonths: {}, // ✅ 新增：儲存所有月份的數據（不限於顯示範圍）
          totalAmount: 0,
          totalMonths: 0,
          donateItems: [],
          createdAt: donate.createdAt,
          createdUser: donate.createdUser,
          updatedAt: donate.updatedAt,
          updatedUser: donate.updatedUser,
        });
      }

      const summary = summaryMap.get(key);

      // 合併贊助項目
      if (donate.donateItems && donate.donateItems.length > 0) {
        donate.donateItems.forEach((item) => {
          summary.donateItems.push(item);
          summary.totalAmount += item.price;
          summary.totalMonths += item.months.length;

          // 標記有贊助的月份
          item.months.forEach((month) => {
            // 如果在顯示範圍內，添加到 months
            if (summary.months[month]) {
              summary.months[month].push({
                price: item.price,
                donateItemsId: item.donateItemsId,
                createdAt: item.createdAt,
              });
            }

            // ✅ 新增：無論是否在顯示範圍內，都添加到 allMonths
            if (!summary.allMonths[month]) {
              summary.allMonths[month] = [];
            }
            summary.allMonths[month].push({
              price: item.price,
              donateItemsId: item.donateItemsId,
              createdAt: item.createdAt,
            });
          });
        });
      }
    });

    return Array.from(summaryMap.values());
  });

  /**
   * ✅ 新增：為特定贊助人生成詳細數據
   */
  // const getDonatorDetail = computed(() => {
  //   return (donatorName) => {
  //     const summary = donateSummary.value.find((d) => d.name === donatorName);
  //     if (!summary) return null;

  //     // 獲取資料庫 ID
  //     const recordId = getDonateRecordIdByName(donatorName);
  //     if (!recordId) return null;

  //     const detailMonths = recordId;

  //     return {
  //       ...summary,
  //       detailMonths: detailMonths.map((month) => ({
  //         ...month,
  //         items: summary.allMonths[month.yearMonth] || [],
  //       })),
  //       // 計算詳細統計
  //       detailStats: {
  //         firstDonation: getFirstDonationMonth(summary),
  //         lastDonation: getLastDonationMonth(summary),
  //         continuousMonths: getContinuousMonths(summary),
  //         totalItems: summary.donateItems.length,
  //       },
  //     };
  //   };
  // });

  /**
   * 過濾後的贊助人列表
   */
  const filteredDonates = computed(() => {
    let filtered = donateSummary.value;

    // 關鍵字搜尋
    if (searchQuery.value) {
      const keyword = searchQuery.value.toLowerCase();
      filtered = filtered.filter(
        (donate) =>
          donate.name.toLowerCase().includes(keyword) ||
          donate.memo?.toLowerCase().includes(keyword)
      );
    }

    return filtered;
  });

  /**
   * 分頁後的贊助人列表
   */
  const paginatedDonates = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    return filteredDonates.value.slice(start, end);
  });

  /**
   * 根據 ID 獲取贊助人
   */
  const getDonateById = computed(() => {
    return (id) => allDonates.value.find((donate) => donate.id === id);
  });

  /**
   * 根據姓名獲取贊助人
   */
  const getDonateByName = computed(() => {
    return (name) => allDonates.value.filter((donate) => donate.name === name);
  });

  /**
   * 統計信息
   */
  const stats = computed(() => {
    const summary = donateSummary.value;
    return {
      totalDonators: summary.length,
      totalAmount: summary.reduce((sum, donate) => sum + donate.totalAmount, 0),
      totalMonths: summary.reduce((sum, donate) => sum + donate.totalMonths, 0),
      averagePerDonator:
        summary.length > 0
          ? Math.round(
              summary.reduce((sum, donate) => sum + donate.totalAmount, 0) /
                summary.length
            )
          : 0,
      // ✅ 新增：月份範圍統計
      monthRange: {
        start: monthColumns.value[0]?.display || "",
        end: monthColumns.value[monthColumns.value.length - 1]?.display || "",
        totalMonths: monthColumns.value.length,
      },
    };
  });

  /**
   * 每月贊助統計
   */
  const monthlyStats = computed(() => {
    const statsMap = new Map();
    const monthList = monthColumns.value;

    // 初始化統計
    monthList.forEach((month) => {
      statsMap.set(month.yearMonth, {
        yearMonth: month.yearMonth,
        display: month.display,
        totalAmount: 0,
        donatorCount: 0,
        isPast: month.isPast,
      });
    });

    // 計算統計
    donateSummary.value.forEach((donate) => {
      monthList.forEach((month) => {
        if (
          donate.months[month.yearMonth] &&
          donate.months[month.yearMonth].length > 0
        ) {
          const stat = statsMap.get(month.yearMonth);
          stat.totalAmount += donate.months[month.yearMonth].reduce(
            (sum, item) => sum + item.price,
            0
          );
          stat.donatorCount++;
        }
      });
    });

    return Array.from(statsMap.values());
  });

  // ========== 輔助函數 ==========

  /**
   * 通過姓名獲取資料庫 ID
   */
  const getDonateRecordIdByName = (donatorName) => {
    const donates = allDonates.value.filter((d) => d.name === donatorName);
    return donates.length > 0 ? donates[0].id : null;
  };

  /**
   * 通過應用層 donateId 獲取資料庫 ID
   */
  // const getDonateRecordIdByDonateId = (appDonateId) => {
  //   const donate = allDonates.value.find((d) => d.donateId === appDonateId);
  //   return donate ? donate.id : null;
  // };

  /**
   * 通過資料庫 ID 獲取應用層 donateId
   */
  // const getAppDonateIdByRecordId = (recordId) => {
  //   const donate = allDonates.value.find((d) => d.id === recordId);
  //   return donate ? donate.donateId : null;
  // };

  /**
   * ✅ 新增：獲取首次贊助月份
   */
  const getFirstDonationMonth = (donator) => {
    const months = Object.keys(donator.allMonths).sort();
    return months.length > 0 ? months[0] : null;
  };

  /**
   * ✅ 新增：獲取最後贊助月份
   */
  const getLastDonationMonth = (donator) => {
    const months = Object.keys(donator.allMonths).sort();
    return months.length > 0 ? months[months.length - 1] : null;
  };

  /**
   * ✅ 新增：獲取連續贊助月份數
   */
  const getContinuousMonths = (donator) => {
    const months = Object.keys(donator.allMonths)
      .map((monthStr) => {
        const year = parseInt(monthStr.substring(0, 4));
        const month = parseInt(monthStr.substring(4, 6));
        return year * 12 + month;
      })
      .sort((a, b) => a - b);

    if (months.length === 0) return 0;

    let maxContinuous = 1;
    let currentContinuous = 1;

    for (let i = 1; i < months.length; i++) {
      if (months[i] === months[i - 1] + 1) {
        currentContinuous++;
        maxContinuous = Math.max(maxContinuous, currentContinuous);
      } else {
        currentContinuous = 1;
      }
    }

    return maxContinuous;
  };

  // ========== Actions - 方法 ==========

  /**
   * ✅ 新增：設置月份顯示配置
   */
  const setMonthDisplayConfig = (config) => {
    monthDisplayConfig.value = {
      ...monthDisplayConfig.value,
      ...config,
    };
    console.log("📅 月份顯示配置已更新:", monthDisplayConfig.value);
  };

  /**
   * ✅ 新增：重置月份顯示配置
   */
  const resetMonthDisplayConfig = () => {
    monthDisplayConfig.value = {
      pastMonths: 12,
      futureMonths: 12,
      showAllMonths: false,
      customStartDate: null,
      customEndDate: null,
    };
  };

  /**
   * ✅ 新增：切換顯示所有月份
   */
  const toggleShowAllMonths = () => {
    monthDisplayConfig.value.showAllMonths =
      !monthDisplayConfig.value.showAllMonths;
    if (!monthDisplayConfig.value.showAllMonths) {
      monthDisplayConfig.value.customStartDate = null;
      monthDisplayConfig.value.customEndDate = null;
    }
  };

  /**
   * ✅ 新增：設置自定義日期範圍
   */
  const setCustomDateRange = (startDate, endDate) => {
    monthDisplayConfig.value.customStartDate = startDate;
    monthDisplayConfig.value.customEndDate = endDate;
    monthDisplayConfig.value.showAllMonths = false;
  };

  /**
   * 設置搜尋條件
   */
  const setSearchQuery = (query) => {
    searchQuery.value = query;
  };

  /**
   * 設置當前標籤
   */
  const setSelectedTab = (tab) => {
    selectedTab.value = tab;
  };

  /**
   * 設置當前頁碼
   */
  const setCurrentPage = (page) => {
    currentPage.value = page;
  };

  /**
   * 設置每頁數量
   */
  const setPageSize = (size) => {
    pageSize.value = size;
  };

  /**
   * 重置分頁
   */
  const resetPagination = () => {
    currentPage.value = 1;
  };

  /**
   * 清空搜尋條件
   */
  const clearSearch = () => {
    searchQuery.value = "";
    resetPagination();
  };

  /**
   * 設置每月單位金額
   */
  const setMonthlyUnitPrice = (price) => {
    monthlyUnitPrice.value = price;
  };

  // 獲取用戶信息
  const getCurrentUser = () => {
    const userInfo = sessionStorage.getItem("auth-user");
    if (userInfo) {
      const user = JSON.parse(userInfo);
      return user.id || user.username || user.displayName || "unknown";
    }
    return "anonymous";
  };

  /**
   * 從服務器或 Mock 數據獲取贊助列表
   */
  const getAllDonates = async (params = {}) => {
    loading.value = true;
    error.value = null;

    try {
      if (baseService.mode !== "directus") {
        console.warn("⚠️ 當前模式不為 Directus，成功加載 Mock 贊助數據");
        allDonates.value = mockDatas;
        return {
          success: true,
          data: mockDatas,
          message: "成功加載 Mock 贊助數據",
        };
      }

      // TODO: 未來串接 API
      console.log("📄 從服務器獲取贊助數據...");
      const result = await monthlyDonateService.getAllMonthlyDonates(params);
      if (result.success) {
        allDonates.value = result.data || [];
        console.log(`✅ 成功獲取 ${allDonates.value.length} 個贊助記錄`);
        return result;
      } else {
        error.value = result.message;
        allDonates.value = mockDatas;
        return result;
      }
    } catch (err) {
      error.value = err.message;
      console.error("❌ 獲取贊助數據異常:", err);
      allDonates.value = mockDatas;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 新增贊助人（包含贊助項目）
   */
  const submitDonate = async (donateData) => {
    loading.value = true;
    error.value = null;

    try {
      const createISOTime = DateUtils.getCurrentISOTime();

      const newDonate = {
        id: Math.max(...allDonates.value.map((d) => d.id), 0) + 1,
        name: donateData.name,
        registrationId: donateData.registrationId || -1,
        donateId: generateGitHash(createISOTime),
        donateType: donateData.donateType || "",
        donateItems: [
          {
            donateItemsId: generateGitHash(createISOTime + donateData.name),
            price: donateData.amount,
            months: donateData.selectedMonths || [],
            createdAt: createISOTime,
            createdUser: getCurrentUser(),
            updatedAt: "",
            updatedUser: "",
          },
        ],
        memo: donateData.memo || "",
        icon: donateData.icon || "💰",
        createdAt: createISOTime,
        createdUser: getCurrentUser(),
        updatedAt: "",
        updatedUser: "",
      };

      console.log("📦 添加新贊助:", newDonate);

      if (baseService.mode !== "directus") {
        allDonates.value.push(newDonate);
        console.warn("⚠️ 當前模式不為 Directus，成功創建數據");
        return {
          success: true,
          data: newDonate,
          message:
            "贊助創建成功！⚠️ 當前模式不是 directus，無法創建數據，請切換到 directus 模式",
        };
      }

      // TODO: 未來串接 API
      const result = await monthlyDonateService.createMonthlyDonate(newDonate);
      if (result.success) {
        allDonates.value.push(result.data);
        console.log("✅ 成功創建贊助:", result.data.name);
        return result;
      } else {
        error.value = result.message;
        console.error("❌ 創建贊助失敗:", result.message);
        return result;
      }
    } catch (err) {
      error.value = err.message;
      console.error("❌ 創建贊助異常:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 新增贊助項目（給現有贊助記錄）
   */
  const addDonateItem = async (donateId, itemData) => {
    loading.value = true;
    error.value = null;

    //console.log("📦 添加新贊助項目:", {donateId, itemData});

    try {
      const createISOTime = DateUtils.getCurrentISOTime();

      // 查找現有的贊助記錄
      const exDonateIndex = allDonates.value.findIndex(
        (d) => d.id === donateId || d.donateId === donateId
      );

      if (exDonateIndex === -1) {
        throw new Error(`找不到 donateId 為 ${donateId} 的贊助記錄`);
      }

      const exDonate = allDonates.value[exDonateIndex];

      const newDonateItem = {
        donateItemsId: generateGitHash(createISOTime + exDonate.name),
        price: itemData.amount || itemData.price || 0,
        months: itemData.selectedMonths || itemData.months || [],
        createdAt: createISOTime,
        createdUser: getCurrentUser(),
        updatedAt: "",
        updatedUser: "",
      };

      if (baseService.mode !== "directus") {
        // Mock 模式：直接更新本地數據
        exDonate.donateItems.push(newDonateItem);
        exDonate.updatedAt = createISOTime;
        exDonate.updatedUser = getCurrentUser();
        exDonate.memo = itemData.memo || exDonate.memo;

        console.log(
          `✅ Mock 模式：新增贊助項目給 ${exDonate.name}:`,
          newDonateItem
        );

        console.warn("⚠️ 當前模式不為 Directus，成功創建數據");

        return {
          success: true,
          data: exDonate,
          message: "成功新增贊助項目(Mock 模式)",
        };
      }

      // Directus 模式：調用 API
      // const result = await monthlyDonateService.addDonateItem(exDonate.id, {
      //   ...itemData,
      //   donateItemsId: newDonateItem.donateItemsId,
      //   price: newDonateItem.price,
      //   months: newDonateItem.months,
      // });

      // 更新本地數據
      exDonate.donateItems.push(newDonateItem);
      exDonate.updatedAt = createISOTime;
      exDonate.updatedUser = getCurrentUser();
      exDonate.memo = itemData.memo || exDonate.memo;

      // 更新贊助記錄備註
      const resultMonthlyDonate =
        await monthlyDonateService.updateMonthlyDonate(exDonate.id, exDonate);
      if (resultMonthlyDonate.success) {
        allDonates.value[exDonateIndex] = resultMonthlyDonate.data;
      }

      console.log(
        `✅ 成功新增贊助項目，目前贊助項目數量：${exDonate.newDonateItem.length}，${exDonate.id}`
      );
      return result;
    } catch (err) {
      error.value = err.message;
      console.error("❌ 新增贊助項目異常:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 更新贊助項目
   */
  const updateDonateItem = async (donateId, itemId, itemData) => {
    loading.value = true;
    error.value = null;

    try {
      const exDonateIndex = allDonates.value.findIndex(
        (d) => d.id === donateId || d.donateId === donateId
      );
      if (exDonateIndex === -1) {
        throw new Error(`找不到 donateId 為 ${donateId} 的贊助記錄`);
      }

      const exDonate = allDonates.value[exDonateIndex];
      const itemIndex = exDonate.donateItems.findIndex(
        (item) => item.donateItemsId === itemId
      );

      if (itemIndex === -1) {
        throw new Error(`找不到 donateItemsId 為 ${itemId} 的贊助項目`);
      }

      const updateISOTime = DateUtils.getCurrentISOTime();

      if (baseService.mode !== "directus") {
        // Mock 模式：更新本地數據
        exDonate.donateItems[itemIndex] = {
          ...exDonate.donateItems[itemIndex],
          ...itemData,
          updatedAt: updateISOTime,
          updatedUser: getCurrentUser(),
        };

        exDonate.updatedAt = updateISOTime;
        exDonate.updatedUser = getCurrentUser();

        console.warn("⚠️ 當前模式不為 Directus，成功更新數據");
        return {
          success: true,
          data: exDonate,
          message: "贊助項目已更新(Mock 模式)",
        };
      }

      // Directus 模式：調用 API
      const result = await monthlyDonateService.updateDonateItem(
        exDonate.id, // 使用數據庫中的 ID
        itemId,
        {
          ...itemData,
          updatedAt: updateISOTime,
          updatedUser: getCurrentUser(),
        }
      );

      if (result.success) {
        // 更新本地數據
        exDonate.donateItems[itemIndex] = {
          ...exDonate.donateItems[itemIndex],
          ...itemData,
          updatedAt: updateISOTime,
          updatedUser: getCurrentUser(),
        };

        exDonate.updatedAt = updateISOTime;
        exDonate.updatedUser = getCurrentUser();

        console.log("✅ 成功更新贊助項目");
        return result;
      } else {
        error.value = result.message;
        console.error("❌ 更新贊助項目失敗:", result.message);
        return result;
      }
    } catch (err) {
      error.value = err.message;
      console.error("❌ 更新贊助項目異常:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 刪除贊助項目
   */
  const deleteDonateItem = async (donateId, itemId) => {
    loading.value = true;
    error.value = null;

    try {
      const exDonateIndex = allDonates.value.findIndex(
        (d) => d.id === donateId || d.donateId === donateId
      );
      if (exDonateIndex === -1) {
        throw new Error(`找不到 donateId 為 ${donateId} 的贊助記錄`);
      }

      const exDonate = allDonates.value[exDonateIndex];
      const itemIndex = exDonate.donateItems.findIndex(
        (item) => item.donateItemsId === itemId
      );

      if (itemIndex === -1) {
        throw new Error(`找不到 donateItemsId 為 ${itemId} 的贊助項目`);
      }

      if (baseService.mode !== "directus") {
        // Mock 模式：刪除本地數據
        exDonate.donateItems.splice(itemIndex, 1);

        // 如果沒有其他贊助項目，刪除整個贊助記錄
        if (exDonate.donateItems.length === 0) {
          allDonates.value.splice(exDonateIndex, 1);
        }

        exDonate.updatedAt = DateUtils.getCurrentISOTime();
        exDonate.updatedUser = getCurrentUser();

        console.warn("⚠️ 當前模式不為 Directus，成功刪除數據");
        return {
          success: true,
          message: "贊助項目已刪除(Mock 模式)",
        };
      }

      // Directus 模式：調用 API
      const result = await monthlyDonateService.deleteDonateItem(
        exDonate.id, // 使用數據庫中的 ID
        itemId
      );

      if (result.success) {
        // 更新本地數據
        exDonate.donateItems.splice(itemIndex, 1);

        if (exDonate.donateItems.length === 0) {
          allDonates.value.splice(exDonateIndex, 1);
        }

        exDonate.updatedAt = DateUtils.getCurrentISOTime();
        exDonate.updatedUser = getCurrentUser();

        console.log("✅ 成功刪除贊助項目");
        return result;
      } else {
        error.value = result.message;
        console.error("❌ 刪除贊助項目失敗:", result.message);
        return result;
      }
    } catch (err) {
      error.value = err.message;
      console.error("❌ 刪除贊助項目異常:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 根據金額計算可贊助的月份
   */
  const calculateAvailableMonths = (amount, excludeMonths = []) => {
    const monthCount = calculateMonthCount(amount);
    const availableMonths = monthColumns.value
      .filter((month) => !excludeMonths.includes(month.yearMonth))
      .slice(0, monthCount)
      .map((month) => month.yearMonth);

    return availableMonths;
  };

  /**
   * 獲取贊助人的所有已贊助月份
   * @param {string|number} recordId 資料庫 ID
   */
  const getOccupiedMonths = (recordId) => {
    // 快速失敗檢查
    if (!allDonates.value?.length || !recordId) {
      console.warn("⚠️ getDonatorMonths: 參數無效", {
        hasData: !!allDonates.value,
        recordId,
      });
      return [];
    }

    // 使用 find 代替 filter（recordId 對應唯一記錄，找到即停止）
    const donate = allDonates.value.find((d) => d.id === recordId);

    if (!donate) {
      console.warn(`⚠️ 找不到 recordId=${recordId} 的贊助記錄`);
      return [];
    }

    // 使用 flatMap 扁平化提取所有月份，並用 Set 去重
    const months = [
      ...new Set(
        donate.donateItems?.flatMap((item) => item.months || []) || []
      ),
    ];

    console.log(`✅ recordId=${recordId} 已占用月份:`, months);
    return months;
  };

  /**
   * 通過 donateId 獲取贊助人的所有已贊助月份
   * @param {string} donateId 應用層 donateId
   * @returns {string[]} 去重後的月份數組
   */
  // const getDonatorMonthsByDonateId = (donateId) => {
  //   if (!allDonates.value?.length || !donateId) return [];

  //   // 可能有多筆相同 donateId 的記錄
  //   const months = [
  //     ...new Set(
  //       allDonates.value
  //         .filter((d) => d.donateId === donateId)
  //         .flatMap(
  //           (d) => d.donateItems?.flatMap((item) => item.months || []) || []
  //         )
  //     ),
  //   ];

  //   return months;
  // };

  /**
   * 高性能版本：適合數據量大的場景
   * 使用 reduce 一次遍歷完成所有操作
   */
  const getDonatorMonthsOptimized = (recordId) => {
    if (!allDonates.value?.length || !recordId) return [];

    const donate = allDonates.value.find((d) => d.id === recordId);
    if (!donate?.donateItems) return [];

    // 使用 reduce 配合 Set，避免重複的 flatMap 操作
    return Array.from(
      donate.donateItems.reduce((monthSet, item) => {
        item.months?.forEach((month) => monthSet.add(month));
        return monthSet;
      }, new Set())
    );
  };

  /**
   * 初始化 - 加載贊助數據
   */
  const initialize = async () => {
    console.log("🚀 初始化每月贊助 Store...");

    try {
      const result = await getAllDonates();

      console.log("📊 初始化結果:", {
        success: result.success,
        allDonatesLength: allDonates.value?.length,
        allDonatesIsArray: Array.isArray(allDonates.value),
        allDonatesValue: allDonates.value,
        donateSummaryLength: donateSummary.value?.length,
      });

      if (!allDonates.value || !Array.isArray(allDonates.value)) {
        console.error("❌ allDonates.value 不是有效的數組");
        throw new Error("數據初始化失敗");
      }

      console.log("✅ 每月贊助 Store 初始化完成");
      console.log("📦 全部贊助數據:", allDonates.value);

      return result;
    } catch (err) {
      console.error("❌ Store 初始化失敗:", err);
      throw err;
    }
  };

  /**
   * 清空錯誤信息
   */
  const clearError = () => {
    error.value = null;
  };

  // ========== 返回 Store 接口 ==========
  return {
    // 狀態
    allDonates,
    loading,
    error,
    searchQuery,
    selectedTab,
    currentPage,
    pageSize,
    monthlyUnitPrice,
    monthDisplayConfig, // ✅ 新增

    // Getters
    monthColumns,
    //detailMonthColumns, // ✅ 新增
    //donationMonthColumns, // ✅ 新增
    //getMonthDisplayConfig, // ✅ 新增
    //getDonatorDetail, // ✅ 新增
    donateSummary,
    filteredDonates,
    paginatedDonates,
    getDonateById,
    getDonateByName,
    stats,
    monthlyStats,

    // 工具函數
    getDonateRecordIdByName,
    //getDonatorMonthsByDonateId,
    //getDonateRecordIdByDonateId,
    //getAppDonateIdByRecordId,

    generateMonthList, // ✅ 新增
    generate24MonthList, // ✅ 新增
    generateStandardMonthRange, // ✅ 新增
    generateCustomMonthRange, // ✅ 新增
    generateAllMonthsRange, // ✅ 新增

    //generateMonthsForDonator, // ✅ 新增
    //generateMonthsForDonation, // ✅ 新增
    calculateMonthCount,
    generateMonthsFromAmount,

    // Actions
    testMonthGeneration, // ✅ 新增
    getAllDonates,
    submitDonate,
    addDonateItem,
    updateDonateItem,
    deleteDonateItem,
    calculateAvailableMonths,
    getOccupiedMonths,
    initialize,
    clearError,
    setSearchQuery,
    setSelectedTab,
    setCurrentPage,
    setPageSize,
    resetPagination,
    clearSearch,
    setMonthlyUnitPrice,
    // ✅ 新增：月份配置相關 Actions
    setMonthDisplayConfig,
    resetMonthDisplayConfig,
    toggleShowAllMonths,
    setCustomDateRange,
  };
});
