// src/stores/activityStore.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { generateGitHash } from "../utils/generateGitHash.js";
import { activityService } from "../services/activityService.js";
import { baseService, getCurrentISOTime } from "../services/baseService.js";
import mockActivities from "../data/mock_activities.json";

export const useActivityStore = defineStore("activity", () => {
  // ========== 狀態 ==========
  const allActivities = ref([]);
  const monthlyStats = ref([]);
  const loading = ref(false);
  const error = ref(null);

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
    // 1. 先過濾近一年的活動
    const filtered = activitiesList.filter((activity) => {
      if (!activity.date) return false;
      const activityDate = new Date(activity.date);
      return activityDate >= oneYearAgo;
    });

    // 2. 按日期排序（最新在前）
    return filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB - dateA; // 降序排序（最新在前）
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
    // 只使用近一年的數據計算統計
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
   * 獲取所有活動類型
   */
  const allActivityItemTypes = computed(() => {
    const types = new Set();
    allActivities.value.forEach((activity) => {
      const type = activity.item_type;
      if (type) {
        types.add(type);
      }
    });
    return Array.from(types).sort();
  });

  // ========== Actions - 方法 ==========

  /**
   * 從服務器或 Mock 數據獲取活動列表
   */
  const getAllActivities = async (params = {}) => {
    loading.value = true;
    error.value = null;

    try {
      // 如果不是 directus 模式，使用 Mock 數據
      if (baseService.mode !== "directus") {
        console.log("📦 使用 Mock 活動數據");
        // 處理 mock 數據，確保 type 欄位存在
        const processedActivities = mockActivities.map((activity) => ({
          ...activity,
          type: activity.item_type || "其他", // 將 item_type 映射到 type
        }));
        allActivities.value = processedActivities;
        return {
          success: true,
          data: processedActivities,
          message: "成功加載 Mock 活動數據",
        };
      }

      // 從服務器獲取數據
      console.log("🔄 從服務器獲取活動數據...");
      const result = await activityService.getAllActivities(params);

      if (result.success) {
        allActivities.value = result.data || [];
        console.log(`✅ 成功獲取 ${allActivities.value.length} 個活動`);
        return result;
      } else {
        error.value = result.message;
        console.error("❌ 獲取活動數據失敗:", result.message);
        // 失敗時使用 Mock 數據作為後備
        const processedActivities = mockActivities.map((activity) => ({
          ...activity,
          type: activity.item_type || "其他",
        }));
        allActivities.value = processedActivities;
        return result;
      }
    } catch (err) {
      error.value = err.message;
      console.error("❌ 獲取活動數據異常:", err);
      // 異常時使用 Mock 數據作為後備
      const processedActivities = mockActivities.map((activity) => ({
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
    console.log("獲取到的用戶信息:", userInfo);
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
      const createISOTime = getCurrentISOTime();
      const activity = {
        id: Math.max(...allActivities.value.map((a) => a.id), 0) + 1,
        activityId: generateGitHash(createISOTime),
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

      // 如果不是 directus 模式，只在本地添加
      if (baseService.mode !== "directus") {
        allActivities.value.push(activity);
        return {
          success: true,
          data: activity,
          message:
            "活動創建成功！⚠️ 當前模式不是 directus，無法創建數據，請切換到 directus 模式",
        };
      }

      // 從服務器創建活動
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
      // 在本地查找活動
      const activity = allActivities.value.find((a) => a.id === activityId);
      if (!activity) {
        throw new Error(`找不到 ID 為 ${activityId} 的活動`);
      }

      // 如果不是 directus 模式，只在本地更新
      if (baseService.mode !== "directus") {
        activity.participants = newParticipants;
        activity.updatedAt = new Date().toISOString();
        console.log("✅ Mock 模式：參與人次已更新");
        return {
          success: true,
          data: activity,
          message: "參與人次已更新（Mock 模式）",
        };
      }

      // 從服務器更新活動
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
      // 在本地查找活動
      const index = allActivities.value.findIndex((a) => a.id === activityId);
      if (index === -1) {
        throw new Error(`找不到 ID 為 ${activityId} 的活動`);
      }

      // 如果不是 directus 模式，只在本地更新
      if (baseService.mode !== "directus") {
        allActivities.value[index] = {
          ...allActivities.value[index],
          ...activityData,
          item_type: activityData.type, // 同步更新 item_type
          updatedAt: new Date().toISOString(),
        };
        console.log("✅ Mock 模式：活動已更新");
        return {
          success: true,
          data: allActivities.value[index],
          message: "活動已更新（Mock 模式）",
        };
      }

      // 從服務器更新活動
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

      // 如果不是 directus 模式，只在本地刪除
      if (baseService.mode !== "directus") {
        allActivities.value.splice(index, 1);
        console.log("✅ Mock 模式：活動已刪除");
        return {
          success: true,
          message: "活動已刪除（Mock 模式）",
        };
      }

      // 從服務器刪除活動
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

      // 如果不是 directus 模式，只在本地更新
      if (baseService.mode !== "directus") {
        activity.state = "completed";
        activity.updatedAt = new Date().toISOString();
        console.log("✅ Mock 模式：活動已標記為完成");
        return {
          success: true,
          data: activity,
          message: "活動已標記為完成（Mock 模式）",
        };
      }

      // 從服務器更新狀態
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
      // 如果不是 directus 模式，使用計算的統計數據
      if (baseService.mode !== "directus") {
        console.log("📊 使用本地計算的月度統計");
        monthlyStats.value = calculateMonthlyStatsFromActivities();
        return {
          success: true,
          data: monthlyStats.value,
          message: "成功獲取月度統計（本地計算）",
        };
      }

      // 從服務器獲取統計數據
      const result = await activityService.getMonthlyStats();

      if (result.success) {
        monthlyStats.value = result.data || [];
        console.log("✅ 成功獲取月度統計數據");
        return result;
      } else {
        error.value = result.message;
        console.error("❌ 獲取月度統計失敗:", result.message);
        // 失敗時使用本地計算
        monthlyStats.value = calculateMonthlyStatsFromActivities();
        return result;
      }
    } catch (err) {
      error.value = err.message;
      console.error("❌ 獲取月度統計異常:", err);
      // 異常時使用本地計算
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

    // 初始化所有月份
    months.forEach((month) => {
      statsMap.set(month, { month, participants: 0, events: 0 });
    });

    // 統計每個活動
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
      // 先在本地查找
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

      // 如果不是 directus 模式，只能本地查找
      if (baseService.mode !== "directus") {
        return {
          success: false,
          message: "找不到該活動（Mock 模式）",
        };
      }

      // 從服務器查找
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
  const getActivitiesByItemType = async (type) => {
    loading.value = true;
    error.value = null;

    try {
      // 如果不是 directus 模式，從本地過濾
      if (baseService.mode !== "directus") {
        const filtered = allActivities.value.filter(
          (a) => a.type === type || a.item_type === type
        );
        return {
          success: true,
          data: filtered,
          message: `找到 ${filtered.length} 個 ${type} 類型的活動（本地）`,
        };
      }

      // 從服務器獲取
      const result = await activityService.getActivitiesByItemType(type);

      if (result.success) {
        return result;
      } else {
        error.value = result.message;
        // 失敗時從本地過濾
        const filtered = allActivities.value.filter(
          (a) => a.type === type || a.item_type === type
        );
        return {
          success: true,
          data: filtered,
          message: `找到 ${filtered.length} 個 ${type} 類型的活動（本地後備）`,
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
      // 如果不是 directus 模式，從本地過濾
      if (baseService.mode !== "directus") {
        const filtered = allActivities.value.filter((a) => a.state === state);
        return {
          success: true,
          data: filtered,
          message: `找到 ${filtered.length} 個 ${state} 狀態的活動（本地）`,
        };
      }

      // 從服務器獲取
      const result = await activityService.getActivitiesByState(state);

      if (result.success) {
        return result;
      } else {
        error.value = result.message;
        // 失敗時從本地過濾
        const filtered = allActivities.value.filter((a) => a.state === state);
        return {
          success: true,
          data: filtered,
          message: `找到 ${filtered.length} 個 ${state} 狀態的活動（本地後備）`,
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

    // Getters
    totalParticipants,
    upcomingActivities,
    completedActivities,
    getActivityById,
    chartData,
    activitiesByItemType,
    activityItemTypeStats,
    allActivityItemTypes,

    // Actions
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
  };
});
