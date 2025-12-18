// src/stores/activityStore.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { generateGitHashBrowser } from "../utils/generateGitHash.js";
import { activityService } from "../services/activityService.js";
import { baseService } from "../services/baseService.js";
import { DateUtils } from "../utils/dateUtils.js";
import mockDatas from "../data/mock_activities.json";

export const useActivityStore = defineStore("activity", () => {
  // ========== 狀態 ==========
  const allActivities = ref([]);
  const monthlyStats = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // ✅ 新增：搜尋與分頁狀態
  const searchQuery = ref("");
  const selectedItemTypes = ref([]);
  const selectedTab = ref("upcoming");
  const currentPage = ref(1);
  const pageSize = ref(10);

  // ========== 工具函數 ==========

  /**
   * 計算一年前的日期
   */
  const getOneYearAgo = () => {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return oneYearAgo;
  };

  /**
   * 過濾近一年的活動
   */
  const filterRecentActivities = (activitiesList) => {
    const oneYearAgo = getOneYearAgo();
    const filtered = activitiesList.filter((activity) => {
      if (!activity.date) return false;
      const activityDate = new Date(activity.date);
      return activityDate >= oneYearAgo;
    });

    return filtered.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA;
    });
  };

  // ========== Getter - 計算屬性 ==========

  /**
   * 只顯示近一年的活動
   */
  const activities1Year = computed(() => {
    let myActivityies = filterRecentActivities(allActivities.value);
    return myActivityies;
  });

  /**
   * 計算總參與人次
   */
  const totalParticipants = computed(() => {
    return activities1Year.value.reduce(
      (sum, activity) => sum + (activity.participants || 0),
      0
    );
  });

  /**
   * 獲取即將到來的活動
   */
  const upcomingActivities = computed(() => {
    return activities1Year.value.filter((activity) => {
      return activity.state === "upcoming";
    });
  });

  /**
   * 獲取已完成的活動
   */
  const completedActivities = computed(() => {
    return activities1Year.value.filter((activity) => {
      return activity.state === "completed";
    });
  });

  const upcomingCardActivities = computed(() => {
    // 取得即將到來的活動，日期排序最近的兩筆
    return activities1Year.value
      .filter((activity) => {
        return activity.state === "upcoming";
      })
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA;
      })
      .slice(0, 2);
  });
  const completedCardActivities = computed(() => {
    // 取得已完成的活動，日期排序最近的兩筆
    return activities1Year.value
      .filter((activity) => {
        return activity.state === "completed";
      })
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA;
      })
      .slice(0, 2);
  });

  /**
   * ✅ 新增：過濾後的即將到來活動
   */
  const upcomingFiltered = computed(() => {
    let filtered = upcomingActivities.value;

    // 類型篩選
    if (selectedItemTypes.value.length > 0) {
      filtered = filtered.filter((activity) =>
        selectedItemTypes.value.includes(activity.item_type)
      );
    }

    // 關鍵字搜尋
    if (searchQuery.value) {
      const keyword = searchQuery.value.toLowerCase();
      filtered = filtered.filter(
        (activity) =>
          activity.name.toLowerCase().includes(keyword) ||
          activity.description?.toLowerCase().includes(keyword) ||
          activity.location.toLowerCase().includes(keyword) ||
          activity.createdUser?.toLowerCase().includes(keyword)
      );
    }

    return filtered;
  });

  /**
   * ✅ 新增：過濾後的已完成活動
   */
  const completedFiltered = computed(() => {
    let filtered = completedActivities.value;

    // 類型篩選
    if (selectedItemTypes.value.length > 0) {
      filtered = filtered.filter((activity) =>
        selectedItemTypes.value.includes(activity.item_type)
      );
    }

    // 關鍵字搜尋
    if (searchQuery.value) {
      const keyword = searchQuery.value.toLowerCase();
      filtered = filtered.filter(
        (activity) =>
          activity.name.toLowerCase().includes(keyword) ||
          activity.description?.toLowerCase().includes(keyword) ||
          activity.location.toLowerCase().includes(keyword) ||
          activity.createdUser?.toLowerCase().includes(keyword)
      );
    }

    return filtered;
  });

  /**
   * ✅ 新增：分頁後的即將到來活動
   */
  const upcomingPaginated = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    return upcomingFiltered.value.slice(start, end);
  });

  /**
   * ✅ 新增：分頁後的已完成活動
   */
  const completedPaginated = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    return completedFiltered.value.slice(start, end);
  });

  /**
   * 根據 ID 獲取活動
   */
  const getActivityById = computed(() => {
    return (id) => activities1Year.value.find((activity) => activity.id === id);
  });

  /**
   * 圖表數據
   */
  const chartData = computed(() => {
    const recentStats = calculateMonthlyStatsFromRecentActivities();
    return {
      labels: recentStats.value.map((stat) => stat.month),
      datasets: [
        {
          label: "法會參與人次",
          data: recentStats.value.map((stat) => stat.participants),
          backgroundColor: "rgba(139, 69, 19, 0.6)",
          borderColor: "rgba(139, 69, 19, 1)",
          borderWidth: 2,
        },
      ],
    };
  });

  /**
   * 根據類型分組的活動
   */
  const activitiesByItemType = computed(() => {
    const grouped = {};
    activities1Year.value.forEach((activity) => {
      const type = activity.item_type || "other";
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(activity);
    });
    return grouped;
  });

  /**
   * 活動類型統計
   */
  const activityItemTypeStats = computed(() => {
    const stats = {};
    activities1Year.value.forEach((activity) => {
      const type = activity.item_type || "other";
      if (!stats[type]) {
        stats[type] = {
          count: 0,
          participants: 0,
        };
      }
      stats[type].count++;
      stats[type].participants += activity.participants || 0;
    });
    return stats;
  });

  /**
   * 獲取已建立活動的所有類型
   */
  const allActivityItemTypes = computed(() => {
    const item_types = new Set();
    Object.keys(getAllItemTypes()).forEach((type) => item_types.add(type));
    return Array.from(item_types).sort();
  });

  const getAllItemTypes = () => {
    const item_type = {
      ceremony: "法會",
      lecture: "講座",
      meditation: "禪修",
      festival: "節慶",
      volunteer: "志工",
      pudu: "普度",
      other: "其他",
    };
    return item_type;
  };

  // ========== Actions - 方法 ==========

  /**
   * ✅ 新增：設置搜尋條件
   */
  const setSearchQuery = (query) => {
    searchQuery.value = query;
  };

  /**
   * ✅ 新增：設置類型篩選
   */
  const setSelectedItemTypes = (types) => {
    selectedItemTypes.value = types;
  };

  /**
   * ✅ 新增：設置當前標籤
   */
  const setSelectedTab = (tab) => {
    selectedTab.value = tab;
  };

  /**
   * ✅ 新增：設置當前頁碼
   */
  const setCurrentPage = (page) => {
    currentPage.value = page;
  };

  /**
   * ✅ 新增：設置每頁數量
   */
  const setPageSize = (size) => {
    pageSize.value = size;
  };

  /**
   * ✅ 新增：重置分頁
   */
  const resetPagination = () => {
    currentPage.value = 1;
  };

  /**
   * ✅ 新增：清空搜尋條件
   */
  const clearSearch = () => {
    searchQuery.value = "";
    selectedItemTypes.value = [];
    resetPagination();
  };

  // 獲得 Mock 數據
  const loadMockData = async () => {
    try {
      if (!mockDatas || mockDatas.length === 0) {
        console.error("Mock 數據為空或未找到");
        return false;
      }
      let mockData = null;
      const randomIndex = Math.floor(Math.random() * mockDatas.length);
      mockData = mockDatas[randomIndex];
      return mockData;
    } catch (error) {
      console.error("載入 Mock 數據失敗:", error);
      return null;
    }
  };

  /**
   * 從服務器或 Mock 數據獲取活動列表
   */
  const getAllActivities = async (params = {}) => {
    loading.value = true;
    error.value = null;

    try {
      if (baseService.mode !== "directus") {
        console.warn("⚠️ 當前模式不為 Directus，將使用 Mock 數據");
        const processedActivities = mockDatas.map((activity) => ({
          ...activity,
          type: activity.item_type || "其他",
        }));
        allActivities.value = processedActivities;
        return {
          success: true,
          data: processedActivities,
          message: "成功加載 Mock 活動數據",
        };
      }

      console.log("📄 從服務器獲取活動數據...");
      const result = await activityService.getAllActivities(params);

      if (result.success) {
        allActivities.value = result.data || [];
        console.log(`✅ 成功獲取 ${allActivities.value.length} 個活動`);
        return result;
      } else {
        error.value = result.message;
        console.error("❌ 獲取活動數據失敗:", result.message);
        const processedActivities = mockDatas.map((activity) => ({
          ...activity,
          type: activity.item_type || "其他",
        }));
        allActivities.value = processedActivities;
        return result;
      }
    } catch (err) {
      error.value = err.message;
      console.error("❌ 獲取活動數據異常:", err);
      const processedActivities = mockDatas.map((activity) => ({
        ...activity,
        type: activity.item_type || "其他",
      }));
      allActivities.value = processedActivities;
      throw err;
    } finally {
      loading.value = false;
    }
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
   * 添加新活動
   */
  const submitActivity = async (newActivity) => {
    loading.value = true;
    error.value = null;

    try {
      const createISOTime = DateUtils.getCurrentISOTime();
      const activityId = await generateGitHashBrowser(createISOTime);
      const activity = {
        id: Math.max(...allActivities.value.map((a) => a.id), 0) + 1,
        activityId: activityId,
        ...newActivity,
        item_type: newActivity.item_type,
        participants: newActivity.participants || 0,
        state: newActivity.state || "upcoming",
        createdAt: createISOTime,
        createdUser: getCurrentUser(),
        updatedAt: "",
        updatedUser: "",
      };

      console.log("📦 添加新活動:", activity);

      if (baseService.mode !== "directus") {
        allActivities.value.push(activity);
        return {
          success: true,
          data: activity,
          message:
            "活動創建成功！⚠️ 當前模式不是 directus，無法創建數據，請切換到 directus 模式",
        };
      }

      const result = await activityService.createActivity(newActivity);

      if (result.success) {
        allActivities.value.push(result.data);
        console.log("✅ 成功創建活動:", result.data.name);
        return result;
      } else {
        error.value = result.message;
        console.error("❌ 創建活動失敗:", result.message);
        return result;
      }
    } catch (err) {
      error.value = err.message;
      console.error("❌ 創建活動異常:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 更新活動參與人次
   */
  const updateActivityParticipants = async (activityId, newParticipants) => {
    loading.value = true;
    error.value = null;

    try {
      const activity = allActivities.value.find((a) => a.id === activityId);
      if (!activity) {
        throw new Error(`找不到 ID 為 ${activityId} 的活動`);
      }

      if (baseService.mode !== "directus") {
        activity.participants = newParticipants;
        activity.updatedAt = DateUtils.getCurrentISOTime();
        console.warn("⚠️ 當前模式不為 Directus，參與人次已更新");
        return {
          success: true,
          data: activity,
          message: "參與人次已更新(Mock 模式)",
        };
      }

      const result = await activityService.updateParticipants(
        activityId,
        newParticipants
      );

      if (result.success) {
        activity.participants = newParticipants;
        activity.updatedAt = result.data.updatedAt;
        console.log("✅ 成功更新參與人次");
        return result;
      } else {
        error.value = result.message;
        console.error("❌ 更新參與人次失敗:", result.message);
        return result;
      }
    } catch (err) {
      error.value = err.message;
      console.error("❌ 更新參與人次異常:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 更新活動
   */
  const updateActivity = async (activityId, activityData) => {
    loading.value = true;
    error.value = null;

    try {
      const index = allActivities.value.findIndex((a) => a.id === activityId);
      if (index === -1) {
        throw new Error(`找不到 ID 為 ${activityId} 的活動`);
      }

      if (baseService.mode !== "directus") {
        allActivities.value[index] = {
          ...allActivities.value[index],
          ...activityData,
          item_type: activityData.type,
          updatedAt: DateUtils.getCurrentISOTime(),
        };
        console.warn("⚠️ 當前模式不為 Directus，活動已更新");
        return {
          success: true,
          data: allActivities.value[index],
          message: "活動已更新(Mock 模式)",
        };
      }

      const result = await activityService.updateActivity(
        activityId,
        activityData
      );

      if (result.success) {
        allActivities.value[index] = {
          ...allActivities.value[index],
          ...result.data,
        };
        console.log("✅ 成功更新活動");
        return result;
      } else {
        error.value = result.message;
        console.error("❌ 更新活動失敗:", result.message);
        return result;
      }
    } catch (err) {
      error.value = err.message;
      console.error("❌ 更新活動異常:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 刪除活動
   */
  const deleteActivity = async (activityId) => {
    loading.value = true;
    error.value = null;

    try {
      const index = allActivities.value.findIndex((a) => a.id === activityId);
      if (index === -1) {
        throw new Error(`找不到 ID 為 ${activityId} 的活動`);
      }

      if (baseService.mode !== "directus") {
        allActivities.value.splice(index, 1);
        console.warn("⚠️ 當前模式不為 Directus，活動已刪除");
        return {
          success: true,
          message: "活動已刪除(Mock 模式)",
        };
      }

      const result = await activityService.deleteActivity(activityId);

      if (result.success) {
        allActivities.value.splice(index, 1);
        console.log("✅ 成功刪除活動");
        return result;
      } else {
        error.value = result.message;
        console.error("❌ 刪除活動失敗:", result.message);
        return result;
      }
    } catch (err) {
      error.value = err.message;
      console.error("❌ 刪除活動異常:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 完成活動
   */
  const completeActivity = async (activityId) => {
    loading.value = true;
    error.value = null;

    try {
      const activity = allActivities.value.find((a) => a.id === activityId);
      if (!activity) {
        throw new Error(`找不到 ID 為 ${activityId} 的活動`);
      }

      if (baseService.mode !== "directus") {
        activity.state = "completed";
        activity.updatedAt = DateUtils.getCurrentISOTime();
        console.warn("⚠️ 當前模式不為 Directus，活動已標記為完成");
        return {
          success: true,
          data: activity,
          message: "活動已標記為完成(Mock 模式)",
        };
      }

      const result = await activityService.completeActivity(activityId);

      if (result.success) {
        activity.state = "completed";
        activity.updatedAt = result.data.updatedAt;
        console.log("✅ 成功標記活動為完成");
        return result;
      } else {
        error.value = result.message;
        console.error("❌ 標記活動完成失敗:", result.message);
        return result;
      }
    } catch (err) {
      error.value = err.message;
      console.error("❌ 標記活動完成異常:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 獲取月度統計數據
   */
  const getMonthlyStats = async () => {
    loading.value = true;
    error.value = null;

    try {
      if (baseService.mode !== "directus") {
        console.warn("⚠️ 當前模式不為 Directus，使用本地計算的月度統計");
        monthlyStats.value = calculateMonthlyStatsFromActivities();
        return {
          success: true,
          data: monthlyStats.value,
          message: "成功獲取月度統計(本地計算)",
        };
      }

      const result = await activityService.getMonthlyStats();

      if (result.success) {
        monthlyStats.value = result.data || [];
        console.log("✅ 成功獲取月度統計數據");
        return result;
      } else {
        error.value = result.message;
        console.error("❌ 獲取月度統計失敗:", result.message);
        monthlyStats.value = calculateMonthlyStatsFromActivities();
        return result;
      }
    } catch (err) {
      error.value = err.message;
      console.error("❌ 獲取月度統計異常:", err);
      monthlyStats.value = calculateMonthlyStatsFromActivities();
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 從活動數據計算月度統計
   */
  const calculateMonthlyStatsFromActivities = () => {
    const months = [
      "1月",
      "2月",
      "3月",
      "4月",
      "5月",
      "6月",
      "7月",
      "8月",
      "9月",
      "10月",
      "11月",
      "12月",
    ];

    const statsMap = new Map();
    months.forEach((month) => {
      statsMap.set(month, { month, participants: 0, events: 0 });
    });

    allActivities.value.forEach((activity) => {
      const date = new Date(activity.date);
      const monthIndex = date.getMonth();
      const month = months[monthIndex];
      const stats = statsMap.get(month);
      stats.participants += activity.participants || 0;
      stats.events += 1;
    });

    return Array.from(statsMap.values());
  };

  /**
   * 根據活動 ID 獲取活動
   */
  const getByActivityId = async (activityId) => {
    loading.value = true;
    error.value = null;

    try {
      const localActivity = allActivities.value.find(
        (a) => a.activityId === activityId
      );
      if (localActivity) {
        return {
          success: true,
          data: localActivity,
          message: "從本地獲取活動",
        };
      }

      if (baseService.mode !== "directus") {
        console.warn("⚠️ 當前模式不為 Directus，使用本地獲取活動");
        return {
          success: false,
          message: "找不到該活動(Mock 模式)",
        };
      }

      const result = await activityService.getActivitiesByActivityId(
        activityId
      );

      if (result.success && result.data && result.data.length > 0) {
        return {
          success: true,
          data: result.data[0],
          message: "成功獲取活動",
        };
      } else {
        return {
          success: false,
          message: "找不到該活動",
        };
      }
    } catch (err) {
      error.value = err.message;
      console.error("❌ 獲取活動異常:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 根據類型獲取活動
   */
  const getActivitiesByItemType = async (item_type) => {
    loading.value = true;
    error.value = null;

    try {
      if (baseService.mode !== "directus") {
        const filtered = allActivities.value.filter(
          (a) => a.type === item_type || a.item_type === item_type
        );
        console.warn("⚠️ 當前模式不為 Directus，使用本地獲取活動");
        return {
          success: true,
          data: filtered,
          message: `找到 ${filtered.length} 個 ${item_type} 類型的活動(本地)`,
        };
      }

      const result = await activityService.getActivitiesByItemType(item_type);

      if (result.success) {
        return result;
      } else {
        error.value = result.message;
        const filtered = allActivities.value.filter(
          (a) => a.type === item_type || a.item_type === item_type
        );
        return {
          success: true,
          data: filtered,
          message: `找到 ${filtered.length} 個 ${item_type} 類型的活動(本地後備)`,
        };
      }
    } catch (err) {
      error.value = err.message;
      console.error("❌ 根據類型獲取活動異常:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 根據狀態獲取活動
   */
  const getActivitiesByState = async (state) => {
    loading.value = true;
    error.value = null;

    try {
      if (baseService.mode !== "directus") {
        const filtered = allActivities.value.filter((a) => a.state === state);
        console.warn("⚠️ 當前模式不為 Directus，使用本地獲取活動");
        return {
          success: true,
          data: filtered,
          message: `找到 ${filtered.length} 個 ${state} 狀態的活動(本地)`,
        };
      }

      const result = await activityService.getActivitiesByState(state);

      if (result.success) {
        return result;
      } else {
        error.value = result.message;
        const filtered = allActivities.value.filter((a) => a.state === state);
        return {
          success: true,
          data: filtered,
          message: `找到 ${filtered.length} 個 ${state} 狀態的活動(本地後備)`,
        };
      }
    } catch (err) {
      error.value = err.message;
      console.error("❌ 根據狀態獲取活動異常:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 初始化 - 加載活動和統計數據
   */
  const initialize = async () => {
    console.log("🚀 初始化活動 Store...");
    await getAllActivities();
    await getMonthlyStats();
    console.log("✅ 活動 Store 初始化完成");
  };

  /**
   * 清空錯誤信息
   */
  const clearError = () => {
    error.value = null;
  };

  /**
   * 模式管理
   */
  const getCurrentMode = () => {
    return activityService.getCurrentMode();
  };

  const setMode = (mode) => {
    activityService.setMode(mode);
  };

  // ========== 返回 Store 接口 ==========
  return {
    // 狀態
    activities: activities1Year,
    allActivities,
    monthlyStats,
    loading,
    error,
    // ✅ 新增：搜尋與分頁狀態
    searchQuery,
    selectedItemTypes,
    selectedTab,
    currentPage,
    pageSize,

    // Getters
    totalParticipants,
    upcomingActivities,
    completedActivities,
    upcomingCardActivities,
    completedCardActivities,
    // ✅ 新增：過濾與分頁計算屬性
    upcomingFiltered,
    completedFiltered,
    upcomingPaginated,
    completedPaginated,
    getActivityById,
    chartData,
    activitiesByItemType,
    activityItemTypeStats,
    allActivityItemTypes,

    // Actions
    getAllItemTypes,
    getAllActivities,
    submitActivity,
    updateActivityParticipants,
    updateActivity,
    deleteActivity,
    completeActivity,
    getMonthlyStats,
    getByActivityId,
    getActivitiesByItemType,
    getActivitiesByState,
    initialize,
    clearError,
    getCurrentMode,
    setMode,
    loadMockData,
    // ✅ 新增：搜尋與分頁方法
    setSearchQuery,
    setSelectedItemTypes,
    setSelectedTab,
    setCurrentPage,
    setPageSize,
    resetPagination,
    clearSearch,
  };
});
