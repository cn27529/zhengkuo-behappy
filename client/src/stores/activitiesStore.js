// src/stores/activitiesStore.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { activitiesService } from "../services/activitiesService.js";
import { baseService } from "../services/baseService.js";
import mockActivities from "../data/mock_activities.json";

export const useActivitiesStore = defineStore("activities", () => {
  // ========== 狀態 ==========
  const activities = ref([]);
  const monthlyStats = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // ========== Getter - 計算屬性 ==========
  
  /**
   * 計算總參與人數
   */
  const totalParticipants = computed(() => {
    return activities.value.reduce(
      (sum, activity) => sum + (activity.participants || 0),
      0
    );
  });

  /**
   * 獲取即將到來的活動
   */
  const upcomingActivities = computed(() => {
    return activities.value.filter(
      (activity) => activity.status === "upcoming"
    );
  });

  /**
   * 獲取已完成的活動
   */
  const completedActivities = computed(() => {
    return activities.value.filter(
      (activity) => activity.status === "completed"
    );
  });

  /**
   * 根據 ID 獲取活動
   */
  const getActivityById = computed(() => {
    return (id) => activities.value.find((activity) => activity.id === id);
  });

  /**
   * 圖表數據
   */
  const chartData = computed(() => {
    return {
      labels: monthlyStats.value.map((stat) => stat.month),
      datasets: [
        {
          label: "法會參與人數",
          data: monthlyStats.value.map((stat) => stat.participants),
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
  const activitiesByType = computed(() => {
    const grouped = {};
    activities.value.forEach((activity) => {
      const type = activity.type || "other";
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
  const activityTypeStats = computed(() => {
    const stats = {};
    activities.value.forEach((activity) => {
      const type = activity.type || "other";
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

  // ========== Actions - 方法 ==========

  /**
   * 從服務器或 Mock 數據獲取活動列表
   */
  const fetchActivities = async (params = {}) => {
    loading.value = true;
    error.value = null;

    try {
      // 如果不是 directus 模式，使用 Mock 數據
      if (baseService.mode !== "directus") {
        console.log("📦 使用 Mock 活動數據");
        activities.value = JSON.parse(JSON.stringify(mockActivities));
        return {
          success: true,
          data: activities.value,
          message: "成功加載 Mock 活動數據",
        };
      }

      // 從服務器獲取數據
      console.log("🔄 從服務器獲取活動數據...");
      const result = await activitiesService.getAllActivities(params);

      if (result.success) {
        activities.value = result.data || [];
        console.log(`✅ 成功獲取 ${activities.value.length} 個活動`);
        return result;
      } else {
        error.value = result.message;
        console.error("❌ 獲取活動數據失敗:", result.message);
        // 失敗時使用 Mock 數據作為後備
        activities.value = JSON.parse(JSON.stringify(mockActivities));
        return result;
      }
    } catch (err) {
      error.value = err.message;
      console.error("❌ 獲取活動數據異常:", err);
      // 異常時使用 Mock 數據作為後備
      activities.value = JSON.parse(JSON.stringify(mockActivities));
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 添加新活動
   */
  const addActivity = async (newActivity) => {
    loading.value = true;
    error.value = null;

    try {
      // 如果不是 directus 模式，只在本地添加
      if (baseService.mode !== "directus") {
        const activity = {
          id: Math.max(...activities.value.map((a) => a.id), 0) + 1,
          activityId: activitiesService.generateActivityId(),
          ...newActivity,
          participants: newActivity.participants || 0,
          status: newActivity.status || "upcoming",
          createdAt: new Date().toISOString(),
          createdUser: "system",
          updatedAt: "",
          updatedUser: "",
        };
        activities.value.push(activity);
        console.log("✅ Mock 模式：活動已添加到本地");
        return {
          success: true,
          data: activity,
          message: "活動已添加（Mock 模式）",
        };
      }

      // 從服務器創建活動
      const result = await activitiesService.createActivity(newActivity);

      if (result.success) {
        activities.value.push(result.data);
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
   * 更新活動參與人數
   */
  const updateActivityParticipants = async (activityId, newParticipants) => {
    loading.value = true;
    error.value = null;

    try {
      // 在本地查找活動
      const activity = activities.value.find((a) => a.id === activityId);
      if (!activity) {
        throw new Error(`找不到 ID 為 ${activityId} 的活動`);
      }

      // 如果不是 directus 模式，只在本地更新
      if (baseService.mode !== "directus") {
        activity.participants = newParticipants;
        activity.updatedAt = new Date().toISOString();
        console.log("✅ Mock 模式：參與人數已更新");
        return {
          success: true,
          data: activity,
          message: "參與人數已更新（Mock 模式）",
        };
      }

      // 從服務器更新活動
      const result = await activitiesService.updateParticipants(
        activityId,
        newParticipants
      );

      if (result.success) {
        activity.participants = newParticipants;
        activity.updatedAt = result.data.updatedAt;
        console.log("✅ 成功更新參與人數");
        return result;
      } else {
        error.value = result.message;
        console.error("❌ 更新參與人數失敗:", result.message);
        return result;
      }
    } catch (err) {
      error.value = err.message;
      console.error("❌ 更新參與人數異常:", err);
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
      const index = activities.value.findIndex((a) => a.id === activityId);
      if (index === -1) {
        throw new Error(`找不到 ID 為 ${activityId} 的活動`);
      }

      // 如果不是 directus 模式，只在本地更新
      if (baseService.mode !== "directus") {
        activities.value[index] = {
          ...activities.value[index],
          ...activityData,
          updatedAt: new Date().toISOString(),
        };
        console.log("✅ Mock 模式：活動已更新");
        return {
          success: true,
          data: activities.value[index],
          message: "活動已更新（Mock 模式）",
        };
      }

      // 從服務器更新活動
      const result = await activitiesService.updateActivity(
        activityId,
        activityData
      );

      if (result.success) {
        activities.value[index] = {
          ...activities.value[index],
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
      const index = activities.value.findIndex((a) => a.id === activityId);
      if (index === -1) {
        throw new Error(`找不到 ID 為 ${activityId} 的活動`);
      }

      // 如果不是 directus 模式，只在本地刪除
      if (baseService.mode !== "directus") {
        activities.value.splice(index, 1);
        console.log("✅ Mock 模式：活動已刪除");
        return {
          success: true,
          message: "活動已刪除（Mock 模式）",
        };
      }

      // 從服務器刪除活動
      const result = await activitiesService.deleteActivity(activityId);

      if (result.success) {
        activities.value.splice(index, 1);
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
      const activity = activities.value.find((a) => a.id === activityId);
      if (!activity) {
        throw new Error(`找不到 ID 為 ${activityId} 的活動`);
      }

      // 如果不是 directus 模式，只在本地更新
      if (baseService.mode !== "directus") {
        activity.status = "completed";
        activity.updatedAt = new Date().toISOString();
        console.log("✅ Mock 模式：活動已標記為完成");
        return {
          success: true,
          data: activity,
          message: "活動已標記為完成（Mock 模式）",
        };
      }

      // 從服務器更新狀態
      const result = await activitiesService.completeActivity(activityId);

      if (result.success) {
        activity.status = "completed";
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
  const fetchMonthlyStats = async () => {
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
      const result = await activitiesService.getMonthlyStats();

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
      "1月", "2月", "3月", "4月", "5月", "6月",
      "7月", "8月", "9月", "10月", "11月", "12月"
    ];

    const statsMap = new Map();
    
    // 初始化所有月份
    months.forEach(month => {
      statsMap.set(month, { month, participants: 0, events: 0 });
    });

    // 統計每個活動
    activities.value.forEach(activity => {
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
  const getActivityByActivityId = async (activityId) => {
    loading.value = true;
    error.value = null;

    try {
      // 先在本地查找
      const localActivity = activities.value.find(
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
      const result = await activitiesService.getActivitiesByActivityId(
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
  const getActivitiesByType = async (type) => {
    loading.value = true;
    error.value = null;

    try {
      // 如果不是 directus 模式，從本地過濾
      if (baseService.mode !== "directus") {
        const filtered = activities.value.filter((a) => a.type === type);
        return {
          success: true,
          data: filtered,
          message: `找到 ${filtered.length} 個 ${type} 類型的活動（本地）`,
        };
      }

      // 從服務器獲取
      const result = await activitiesService.getActivitiesByType(type);

      if (result.success) {
        return result;
      } else {
        error.value = result.message;
        // 失敗時從本地過濾
        const filtered = activities.value.filter((a) => a.type === type);
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
  const getActivitiesByStatus = async (status) => {
    loading.value = true;
    error.value = null;

    try {
      // 如果不是 directus 模式，從本地過濾
      if (baseService.mode !== "directus") {
        const filtered = activities.value.filter((a) => a.status === status);
        return {
          success: true,
          data: filtered,
          message: `找到 ${filtered.length} 個 ${status} 狀態的活動（本地）`,
        };
      }

      // 從服務器獲取
      const result = await activitiesService.getActivitiesByStatus(status);

      if (result.success) {
        return result;
      } else {
        error.value = result.message;
        // 失敗時從本地過濾
        const filtered = activities.value.filter((a) => a.status === status);
        return {
          success: true,
          data: filtered,
          message: `找到 ${filtered.length} 個 ${status} 狀態的活動（本地後備）`,
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
    await fetchActivities();
    await fetchMonthlyStats();
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
    return activitiesService.getCurrentMode();
  };

  const setMode = (mode) => {
    activitiesService.setMode(mode);
  };

  // ========== 返回 Store 接口 ==========
  return {
    // 狀態
    activities,
    monthlyStats,
    loading,
    error,

    // Getters
    totalParticipants,
    upcomingActivities,
    completedActivities,
    getActivityById,
    chartData,
    activitiesByType,
    activityTypeStats,

    // Actions
    fetchActivities,
    addActivity,
    updateActivityParticipants,
    updateActivity,
    deleteActivity,
    completeActivity,
    fetchMonthlyStats,
    getActivityByActivityId,
    getActivitiesByType,
    getActivitiesByStatus,
    initialize,
    clearError,
    getCurrentMode,
    setMode,
  };
});