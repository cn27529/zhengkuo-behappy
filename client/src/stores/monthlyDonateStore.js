// src/stores/monthlyDonateStore.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { generateGitHash } from "../utils/generateGitHash.js";
import { baseService } from "../services/baseService.js";
import { DateUtils } from "../utils/dateUtils.js";
import mockDatas from "../data/mock_monthlyDonate.json";

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

  const displayPrevMonth = ref(3);
  const displayLastMonth = ref(6);
  

  // 贊助設定
  const monthlyUnitPrice = ref(100); // 每月基本單位金額，可調整

  // ========== 工具函數 ==========

  /**
   * 生成 24 個月的列表（過去12個月 + 未來12個月）
   */
  const generate24MonthList = () => {
    const months = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11
    
    // 過去12個月
    for (let i = 3; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      months.push({
        yearMonth: `${year}${month.toString().padStart(2, '0')}`,
        display: `${year}年${month}月`,
        isPast: true
      });
    }
    
    // 未來12個月
    for (let i = 1; i <= 6; i++) {
      const date = new Date(currentYear, currentMonth + i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      months.push({
        yearMonth: `${year}${month.toString().padStart(2, '0')}`,
        display: `${year}年${month}月`,
        isPast: false
      });
    }
    
    return months;
  };

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
      months.push(`${year}${month.toString().padStart(2, '0')}`);
    }
    
    return months;
  };

  // ========== Getter - 計算屬性 ==========

  /**
   * 24個月的列表
   */
  const monthColumns = computed(() => {
    return generate24MonthList();
  });

  /**
   * 處理後的贊助人列表（合併相同贊助人的資料）
   */
  const donateSummary = computed(() => {
    const summaryMap = new Map();
    const monthList = monthColumns.value.map(m => m.yearMonth);
    
    allDonates.value.forEach(donate => {
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
          totalAmount: 0,
          totalMonths: 0,
          donateItems: [],
          createdAt: donate.createdAt,
          createdUser: donate.createdUser,
          updatedAt: donate.updatedAt,
          updatedUser: donate.updatedUser
        });
      }
      
      const summary = summaryMap.get(key);
      
      // 合併贊助項目
      if (donate.donateItems && donate.donateItems.length > 0) {
        donate.donateItems.forEach(item => {
          summary.donateItems.push(item);
          summary.totalAmount += item.price;
          summary.totalMonths += item.months.length;
          
          // 標記有贊助的月份
          item.months.forEach(month => {
            if (summary.months[month]) {
              summary.months[month].push({
                price: item.price,
                donateItemsId: item.donateItemsId,
                createdAt: item.createdAt
              });
            }
          });
        });
      }
    });
    
    return Array.from(summaryMap.values());
  });

  /**
   * 過濾後的贊助人列表
   */
  const filteredDonates = computed(() => {
    let filtered = donateSummary.value;

    // 關鍵字搜尋
    if (searchQuery.value) {
      const keyword = searchQuery.value.toLowerCase();
      filtered = filtered.filter((donate) =>
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
      averagePerDonator: summary.length > 0 
        ? Math.round(summary.reduce((sum, donate) => sum + donate.totalAmount, 0) / summary.length)
        : 0
    };
  });

  /**
   * 每月贊助統計
   */
  const monthlyStats = computed(() => {
    const statsMap = new Map();
    const monthList = monthColumns.value;
    
    // 初始化統計
    monthList.forEach(month => {
      statsMap.set(month.yearMonth, {
        yearMonth: month.yearMonth,
        display: month.display,
        totalAmount: 0,
        donatorCount: 0,
        isPast: month.isPast
      });
    });
    
    // 計算統計
    donateSummary.value.forEach(donate => {
      monthList.forEach(month => {
        if (donate.months[month.yearMonth] && donate.months[month.yearMonth].length > 0) {
          const stat = statsMap.get(month.yearMonth);
          stat.totalAmount += donate.months[month.yearMonth].reduce((sum, item) => sum + item.price, 0);
          stat.donatorCount++;
        }
      });
    });
    
    return Array.from(statsMap.values());
  });

  // ========== Actions - 方法 ==========

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
        console.log("📦 使用 Mock 贊助數據");
        allDonates.value = mockDatas;
        return {
          success: true,
          data: mockDatas,
          message: "成功加載 Mock 贊助數據",
        };
      }

      // TODO: 未來串接 API
      console.log("📄 從服務器獲取贊助數據...");
      // const result = await monthlyDonateService.getAllDonates(params);
      // if (result.success) {
      //   allDonates.value = result.data || [];
      //   console.log(`✅ 成功獲取 ${allDonates.value.length} 個贊助記錄`);
      //   return result;
      // } else {
      //   error.value = result.message;
      //   allDonates.value = mockDatas;
      //   return result;
      // }

      // 暫時使用 Mock 數據
      allDonates.value = mockDatas;
      return {
        success: true,
        data: mockDatas,
        message: "成功加載贊助數據",
      };
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
   * 新增贊助項目（給現有贊助人）
   */
  const addDonateItem = async (donatorName, donateData) => {
    loading.value = true;
    error.value = null;

    try {
      const createISOTime = DateUtils.getCurrentISOTime();
      
      // 查找是否已有該贊助人
      const existingDonate = allDonates.value.find(d => d.name === donatorName);
      
      const newDonateItem = {
        donateItemsId: generateGitHash(createISOTime + donatorName),
        price: donateData.amount,
        months: donateData.selectedMonths || [],
        createdAt: createISOTime,
        createdUser: getCurrentUser(),
        updatedAt: "",
        updatedUser: ""
      };

      if (existingDonate) {
        // 更新現有贊助人
        existingDonate.donateItems.push(newDonateItem);
        existingDonate.updatedAt = createISOTime;
        existingDonate.updatedUser = getCurrentUser();
        
        console.log(`✅ 新增贊助項目給 ${donatorName}:`, newDonateItem);
        
        return {
          success: true,
          data: existingDonate,
          message: "成功新增贊助項目",
        };
      } else {
        // 創建新的贊助人
        const newDonate = {
          id: Math.max(...allDonates.value.map(d => d.id), 0) + 1,
          name: donatorName,
          registrationId: -1,
          donateId: generateGitHash(createISOTime),
          donateType: "",
          donateItems: [newDonateItem],
          memo: donateData.memo || "",
          icon: donateData.icon || "💰",
          createdAt: createISOTime,
          createdUser: getCurrentUser(),
          updatedAt: "",
          updatedUser: ""
        };
        
        allDonates.value.push(newDonate);
        console.log(`✅ 創建新贊助人 ${donatorName}:`, newDonate);
        
        return {
          success: true,
          data: newDonate,
          message: "成功創建新贊助人並新增贊助項目",
        };
      }
    } catch (err) {
      error.value = err.message;
      console.error("❌ 新增贊助項目異常:", err);
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
        id: Math.max(...allDonates.value.map(d => d.id), 0) + 1,
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
            updatedUser: ""
          }
        ],
        memo: donateData.memo || "",
        icon: donateData.icon || "💰",
        createdAt: createISOTime,
        createdUser: getCurrentUser(),
        updatedAt: "",
        updatedUser: ""
      };

      console.log("📦 添加新贊助:", newDonate);

      if (baseService.mode !== "directus") {
        allDonates.value.push(newDonate);
        return {
          success: true,
          data: newDonate,
          message: "贊助創建成功！⚠️ 當前模式不是 directus，無法創建數據，請切換到 directus 模式",
        };
      }

      // TODO: 未來串接 API
      // const result = await monthlyDonateService.createDonate(newDonate);
      // if (result.success) {
      //   allDonates.value.push(result.data);
      //   console.log("✅ 成功創建贊助:", result.data.name);
      //   return result;
      // } else {
      //   error.value = result.message;
      //   console.error("❌ 創建贊助失敗:", result.message);
      //   return result;
      // }

      allDonates.value.push(newDonate);
      return {
        success: true,
        data: newDonate,
        message: "贊助創建成功(Mock 模式)",
      };
    } catch (err) {
      error.value = err.message;
      console.error("❌ 創建贊助異常:", err);
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
      const donateIndex = allDonates.value.findIndex(d => d.donateId === donateId);
      if (donateIndex === -1) {
        throw new Error(`找不到 donateId 為 ${donateId} 的贊助記錄`);
      }

      const donate = allDonates.value[donateIndex];
      const itemIndex = donate.donateItems.findIndex(item => item.donateItemsId === itemId);
      
      if (itemIndex === -1) {
        throw new Error(`找不到 donateItemsId 為 ${itemId} 的贊助項目`);
      }

      const updateISOTime = DateUtils.getCurrentISOTime();

      if (baseService.mode !== "directus") {
        donate.donateItems[itemIndex] = {
          ...donate.donateItems[itemIndex],
          ...itemData,
          updatedAt: updateISOTime,
          updatedUser: getCurrentUser()
        };
        
        donate.updatedAt = updateISOTime;
        donate.updatedUser = getCurrentUser();
        
        console.log("✅ Mock 模式：贊助項目已更新");
        return {
          success: true,
          data: donate,
          message: "贊助項目已更新(Mock 模式)",
        };
      }

      // TODO: 未來串接 API
      // const result = await monthlyDonateService.updateDonateItem(donateId, itemId, itemData);
      // if (result.success) {
      //   donate.donateItems[itemIndex] = {
      //     ...donate.donateItems[itemIndex],
      //     ...result.data
      //   };
      //   console.log("✅ 成功更新贊助項目");
      //   return result;
      // } else {
      //   error.value = result.message;
      //   console.error("❌ 更新贊助項目失敗:", result.message);
      //   return result;
      // }

      donate.donateItems[itemIndex] = {
        ...donate.donateItems[itemIndex],
        ...itemData,
        updatedAt: updateISOTime,
        updatedUser: getCurrentUser()
      };
      
      donate.updatedAt = updateISOTime;
      donate.updatedUser = getCurrentUser();
      
      return {
        success: true,
        data: donate,
        message: "贊助項目已更新(Mock 模式)",
      };
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
      const donateIndex = allDonates.value.findIndex(d => d.donateId === donateId);
      if (donateIndex === -1) {
        throw new Error(`找不到 donateId 為 ${donateId} 的贊助記錄`);
      }

      const donate = allDonates.value[donateIndex];
      const itemIndex = donate.donateItems.findIndex(item => item.donateItemsId === itemId);
      
      if (itemIndex === -1) {
        throw new Error(`找不到 donateItemsId 為 ${itemId} 的贊助項目`);
      }

      if (baseService.mode !== "directus") {
        donate.donateItems.splice(itemIndex, 1);
        
        // 如果沒有其他贊助項目，刪除整個贊助記錄
        if (donate.donateItems.length === 0) {
          allDonates.value.splice(donateIndex, 1);
        }
        
        console.log("✅ Mock 模式：贊助項目已刪除");
        return {
          success: true,
          message: "贊助項目已刪除(Mock 模式)",
        };
      }

      // TODO: 未來串接 API
      // const result = await monthlyDonateService.deleteDonateItem(donateId, itemId);
      // if (result.success) {
      //   donate.donateItems.splice(itemIndex, 1);
      //   
      //   if (donate.donateItems.length === 0) {
      //     allDonates.value.splice(donateIndex, 1);
      //   }
      //   
      //   console.log("✅ 成功刪除贊助項目");
      //   return result;
      // } else {
      //   error.value = result.message;
      //   console.error("❌ 刪除贊助項目失敗:", result.message);
      //   return result;
      // }

      donate.donateItems.splice(itemIndex, 1);
      
      if (donate.donateItems.length === 0) {
        allDonates.value.splice(donateIndex, 1);
      }
      
      return {
        success: true,
        message: "贊助項目已刪除(Mock 模式)",
      };
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
      .filter(month => !excludeMonths.includes(month.yearMonth))
      .slice(0, monthCount)
      .map(month => month.yearMonth);
    
    return availableMonths;
  };

  /**
   * 獲取贊助人的所有已贊助月份
   */
  const getDonatorMonths = (donatorName) => {
    const donates = allDonates.value.filter(d => d.name === donatorName);
    const months = new Set();
    
    donates.forEach(donate => {
      donate.donateItems.forEach(item => {
        item.months.forEach(month => {
          months.add(month);
        });
      });
    });
    
    return Array.from(months);
  };

  /**
   * 初始化 - 加載贊助數據
   */
  const initialize = async () => {
    console.log("🚀 初始化每月贊助 Store...");
    await getAllDonates();
    console.log("✅ 每月贊助 Store 初始化完成");
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

    // Getters
    monthColumns,
    donateSummary,
    filteredDonates,
    paginatedDonates,
    getDonateById,
    getDonateByName,
    stats,
    monthlyStats,

    // Actions
    getAllDonates,
    submitDonate,
    addDonateItem,
    updateDonateItem,
    deleteDonateItem,
    calculateAvailableMonths,
    getDonatorMonths,
    initialize,
    clearError,
    setSearchQuery,
    setSelectedTab,
    setCurrentPage,
    setPageSize,
    resetPagination,
    clearSearch,
    setMonthlyUnitPrice,
  };
});