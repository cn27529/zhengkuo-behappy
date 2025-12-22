// src/services/activitiesService.js
import { baseService, getApiUrl } from "./baseService.js";
import { generateGitHashBrowser } from "../utils/generateGitHash.js";
import { DateUtils } from "../utils/dateUtils.js";

export class ActivityService {
  // ========== 建構函式 ==========
  constructor() {
    console.log(`ActivityService 初始化: 當前模式為 ${baseService.mode}`);
  }

  // ========== CRUD 操作 ==========

  /**
   * 創建新活動
   * @param {Object} activityData - 活動資料
   * @returns {Promise<Object>} 創建結果
   */
  async createActivity(activityData) {
    const createISOTime = DateUtils.getCurrentISOTime();

    if (baseService.mode !== "directus") {
      console.warn(
        "活動創建成功！⚠️ 當前模式不是 directus，無法創建數據，請切換到 directus 模式"
      );
      return {
        success: true,
        message: "活動創建成功！⚠️ 當前模式不是 directus，無法創建數據",
        data: {
          id: Date.now(),
          ...activityData,
          createdAt: createISOTime,
        },
      };
    }

    const startTime = new Date(DateUtils.formatDateTimeYMD(Date.now()));
    const context = {
      service: "ActivityService",
      operation: "createActivity",
      startTime,
    };

    try {
      // 先檢查連線
      const healthCheck = await baseService.checkConnection();
      if (!healthCheck.online) {
        return {
          success: false,
          online: false,
          message: healthCheck.message,
          data: null,
        };
      }
      console.log("✅ Directus 服務健康檢查通過");

      const activityId = await generateGitHashBrowser(createISOTime);
      // 準備提交數據
      const processedData = {
        activityId: activityId,
        name: activityData.name || "",
        item_type: activityData.item_type || "ceremony",
        participants: activityData.participants || 0,
        date: activityData.date || createISOTime,
        state: activityData.state || "upcoming",
        icon: activityData.icon || "🕯️",
        description: activityData.description || "",
        location: activityData.location || "",
        createdAt: createISOTime,
        createdUser: activityData.createdUser || "system",
        updatedAt: "",
        updatedUser: "",
      };

      const myHeaders = await baseService.getAuthJsonHeaders();
      const url = getApiUrl(baseService.apiEndpoints.itemsActivity);
      const apiUrl = `${url}`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: myHeaders,
        body: JSON.stringify(processedData),
      });

      const duration =
        new Date(DateUtils.formatDateTimeYMD(Date.now())) - startTime;
      const result = await baseService.handleDirectusResponse(
        response,
        "成功創建活動",
        { ...context, duration }
      );
      // 現在 result 結構統一，更容易處理
      return result;
    } catch (error) {
      console.error("創建活動失敗:", error);
      return this.handleDirectusError(error);
    }
  }

  /**
   * 更新活動
   * @param {number|string} id - 活動 ID
   * @param {Object} activityData - 更新的活動資料
   * @returns {Promise<Object>} 更新結果
   */
  async updateActivity(id, activityData) {
    if (baseService.mode !== "directus") {
      console.warn("⚠️ 當前模式不是 directus，無法更新數據");
      return { success: false, message: "請切換到 directus 模式" };
    }

    try {
      const updateData = {
        ...activityData,
        updatedAt: DateUtils.getCurrentISOTime(),
        updatedUser: activityData.updatedUser || "system",
      };

      const myHeaders = await baseService.getAuthJsonHeaders();
      const url = `${getApiUrl(baseService.apiEndpoints.itemsActivity)}/${id}`;
      const apiUrl = `${url}`;
      const response = await fetch(apiUrl, {
        method: "PATCH",
        headers: myHeaders,
        body: JSON.stringify(updateData),
      });

      const result = await baseService.handleDirectusResponse(
        response,
        "成功更新活動"
      );
      return result;
    } catch (error) {
      console.error(`更新活動 (ID: ${id}) 失敗:`, error);
      return this.handleDirectusError(error);
    }
  }

  /**
   * 根據 ID 獲取活動
   * @param {number|string} id - 活動 ID
   * @returns {Promise<Object>} 活動資料
   */
  async getActivityById(id) {
    if (baseService.mode !== "directus") {
      console.warn("⚠️ 當前模式不是 directus，無法獲取數據");
      return { success: false, message: "請切換到 directus 模式" };
    }

    try {
      const myHeaders = await baseService.getAuthJsonHeaders();
      const url = `${getApiUrl(
        baseService.apiEndpoints.itemsActivity
      )}/${id}?fields=*`;
      const apiUrl = `${url}`;
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: myHeaders,
      });

      const result = await baseService.handleDirectusResponse(
        response,
        "成功獲取活動"
      );
      return result;
    } catch (error) {
      console.error(`獲取活動 (ID: ${id}) 失敗:`, error);
      return this.handleDirectusError(error);
    }
  }

  /**
   * 獲取所有活動
   * @param {Object} params - 查詢參數（過濾、排序等）
   * @returns {Promise<Object>} 活動列表
   */
  async getAllActivities(params = {}) {
    if (baseService.mode !== "directus") {
      console.warn("⚠️ 當前模式不是 directus，無法獲取數據");
      return { success: false, message: "請切換到 directus 模式" };
    }

    try {
      const queryParams = new URLSearchParams();
      queryParams.append("fields", "*");

      // 添加篩選條件
      if (params.filter) {
        Object.keys(params.filter).forEach((key) => {
          queryParams.append(`filter[${key}]`, params.filter[key]);
        });
      }

      // 添加排序
      if (params.sort) {
        queryParams.append("sort", params.sort);
      }

      // 添加分頁
      if (params.limit) {
        queryParams.append("limit", params.limit);
      }

      if (params.offset) {
        queryParams.append("offset", params.offset);
      }

      const url = getApiUrl(baseService.apiEndpoints.itemsActivity);
      const apiUrl = `${url}?${queryParams.toString()}`;
      console.log("📡 查詢 URL:", apiUrl);

      const myHeaders = await baseService.getAuthJsonHeaders();
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: myHeaders,
      });

      const result = await baseService.handleDirectusResponse(
        response,
        "成功獲取所有活動"
      );
      return result;
    } catch (error) {
      console.error("❌ 獲取活動列表失敗:", error);
      return this.handleDirectusError(error);
    }
  }

  /**
   * 刪除活動
   * @param {number|string} id - 活動 ID
   * @returns {Promise<Object>} 刪除結果
   */
  async deleteActivity(id) {
    if (baseService.mode !== "directus") {
      console.warn("⚠️ 當前模式不是 directus，無法刪除數據");
      return { success: false, message: "請切換到 directus 模式" };
    }

    try {
      const myHeaders = await baseService.getAuthJsonHeaders();
      const url = `${getApiUrl(baseService.apiEndpoints.itemsActivity)}/${id}`;
      const apiUrl = `${url}`;
      const response = await fetch(apiUrl, {
        method: "DELETE",
        headers: myHeaders,
      });

      const result = await baseService.handleDirectusResponse(
        response,
        "成功刪除活動"
      );
      return result;
    } catch (error) {
      console.error(`刪除活動 (ID: ${id}) 失敗:`, error);
      return this.handleDirectusError(error);
    }
  }

  // ========== 查詢方法 ==========

  /**
   * 根據活動 ID 獲取活動
   * @param {string} activityId - 活動 ID
   * @returns {Promise<Object>} 活動資料
   */
  async getActivitiesByActivityId(activityId) {
    return this.getAllActivities({
      filter: {
        activityId: { _eq: activityId },
      },
    });
  }

  /**
   * 根據類型獲取活動
   * @param {string} item_type - 活動類型
   * @returns {Promise<Object>} 活動列表
   */
  async getActivitiesByItemType(item_type) {
    return this.getAllActivities({
      filter: {
        type: { _eq: item_type },
      },
    });
  }

  /**
   * 根據狀態獲取活動
   * @param {string} state - 活動狀態
   * @returns {Promise<Object>} 活動列表
   */
  async getActivitiesByState(state) {
    return this.getAllActivities({
      filter: {
        state: { _eq: state },
      },
      sort: "-date", // 按日期降序排列
    });
  }

  /**
   * 獲取即將到來的活動
   * @returns {Promise<Object>} 活動列表
   */
  async getUpcomingActivities() {
    return this.getActivitiesByState("upcoming");
  }

  /**
   * 獲取已完成的活動
   * @returns {Promise<Object>} 活動列表
   */
  async getCompletedActivities() {
    return this.getActivitiesByState("completed");
  }

  /**
   * 根據日期範圍獲取活動
   * @param {string} startDate - 開始日期
   * @param {string} endDate - 結束日期
   * @returns {Promise<Object>} 活動列表
   */
  async getActivitiesByDateRange(startDate, endDate) {
    return this.getAllActivities({
      filter: {
        date: {
          _between: [startDate, endDate],
        },
      },
      sort: "date",
    });
  }

  // ========== 統計方法 ==========

  /**
   * 獲取月度統計
   * @returns {Promise<Object>} 月度統計數據
   */
  async getMonthlyStats() {
    if (baseService.mode !== "directus") {
      console.warn("⚠️ 當前模式不是 directus，返回模擬數據");
      return {
        success: true,
        data: this.getMockMonthlyStats(),
        message: "返回模擬月度統計數據",
      };
    }

    try {
      // 這裡可以實現從 Directus 獲取統計數據的邏輯
      // 暫時返回計算出的統計
      const activitiesResult = await this.getAllActivities();

      if (!activitiesResult.success) {
        return activitiesResult;
      }

      const stats = this.calculateMonthlyStats(activitiesResult.data);

      return {
        success: true,
        data: stats,
        message: "成功獲取月度統計",
      };
    } catch (error) {
      console.error("獲取月度統計失敗:", error);
      return this.handleDirectusError(error);
    }
  }

  /**
   * 計算月度統計
   * @param {Array} activities - 活動列表
   * @returns {Array} 月度統計數據
   */
  calculateMonthlyStats(activities) {
    const monthlyMap = new Map();
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

    // 初始化所有月份
    months.forEach((month) => {
      monthlyMap.set(month, { month, participants: 0, events: 0 });
    });

    // 統計每個月的數據
    activities.forEach((activity) => {
      const date = new Date(activity.date);
      const month = `${date.getMonth() + 1}月`;

      if (monthlyMap.has(month)) {
        const stats = monthlyMap.get(month);
        stats.participants += activity.participants || 0;
        stats.events += 1;
      }
    });

    return Array.from(monthlyMap.values());
  }

  /**
   * 獲取模擬月度統計數據
   * @returns {Array} 模擬數據
   */
  getMockMonthlyStats() {
    return [
      { month: "1月", participants: 320, events: 3 },
      { month: "2月", participants: 280, events: 2 },
      { month: "3月", participants: 350, events: 4 },
      { month: "4月", participants: 410, events: 3 },
      { month: "5月", participants: 380, events: 5 },
      { month: "6月", participants: 420, events: 4 },
      { month: "7月", participants: 480, events: 6 },
      { month: "8月", participants: 621, events: 5 },
      { month: "9月", participants: 289, events: 3 },
      { month: "10月", participants: 567, events: 4 },
      { month: "11月", participants: 342, events: 2 },
      { month: "12月", participants: 180, events: 1 },
    ];
  }

  // ========== 狀態管理 ==========

  /**
   * 更新活動參與人次
   * @param {number|string} id - 活動 ID
   * @param {number} participants - 參與人次
   * @returns {Promise<Object>} 更新結果
   */
  async updateParticipants(id, participants) {
    return this.updateActivity(id, {
      participants: participants,
      updatedAt: DateUtils.getCurrentISOTime(),
    });
  }

  /**
   * 完成活動
   * @param {number|string} id - 活動 ID
   * @returns {Promise<Object>} 更新結果
   */
  async completeActivity(id) {
    return this.updateActivity(id, {
      state: "completed",
      updatedAt: DateUtils.getCurrentISOTime(),
    });
  }

  /**
   * 取消活動
   * @param {number|string} id - 活動 ID
   * @returns {Promise<Object>} 更新結果
   */
  async cancelActivity(id) {
    return this.updateActivity(id, {
      state: "cancelled",
      updatedAt: DateUtils.getCurrentISOTime(),
    });
  }

  // ========== 錯誤處理 ==========
  handleDirectusError(error) {
    // 檢查網路錯誤
    if (
      error.message.includes("Failed to fetch") ||
      error.message.includes("NetworkError")
    ) {
      return {
        success: false,
        message: "Directus 服務未啟動或網路連接失敗",
        errorCode: "DIRECTUS_NOT_AVAILABLE",
        details: "請確保 Directus 服務正在運行",
      };
    }

    // 檢查認證錯誤
    if (error.message.includes("401") || error.message.includes("token")) {
      return {
        success: false,
        message: "認證失敗，請重新登入",
        errorCode: "UNAUTHORIZED",
        details: error.message,
      };
    }

    // 檢查權限錯誤
    if (error.message.includes("403")) {
      return {
        success: false,
        message: "沒有操作權限",
        errorCode: "FORBIDDEN",
        details: error.message,
      };
    }

    return {
      success: false,
      message: "Directus 操作失敗",
      errorCode: "DIRECTUS_ERROR",
      details: error.message,
    };
  }

  // ========== 模式管理 ==========
  getCurrentMode() {
    return baseService.mode;
  }

  setMode(mode) {
    if (["mock", "backend", "directus"].includes(mode)) {
      baseService.mode = mode;
      console.log(`ActivityService 模式已切換為: ${mode}`);
    } else {
      console.warn('無效的模式，請使用 "mock", "backend" 或 "directus"');
    }
  }
}

export const activityService = new ActivityService();
