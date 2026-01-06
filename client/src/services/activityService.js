// src/services/activitiesService.js
import { baseService } from "./baseService.js";
import { generateGitHashBrowser } from "../utils/generateGitHash.js";
import { DateUtils } from "../utils/dateUtils.js";

export class ActivityService {
  // ========== 建構函式 ==========
  constructor() {
    this.serviceName = "ActivityService";
    this.base = baseService;
    this.endpoint = `${this.base.apiBaseUrl}${this.base.apiEndpoints.itemsActivity}`;
    console.log(`ActivityService 初始化: 當前模式為 ${this.base.mode}`);
  }

  async getServerInfo() {
    return await this.base.serverInfo();
  }

  async getHealthCheck() {
    return await this.base.healthCheck();
  }

  // ========== 使用示例：不同的調用方式 ==========
  // 範例 1: 帶完整 context（會記錄日誌）
  async exampleWithContext() {
    const startTime = Date.now();
    const response = await fetch(url, { method: "GET" });

    const result = await this.base.handleDirectusResponse(
      response,
      "操作成功",
      {
        service: "ExampleService",
        operation: "getData",
        method: "GET",
        startTime: startTime,
        duration: Date.now() - startTime,
      }
    );
  }

  // 範例 2: 不帶 context（不會記錄日誌）
  async exampleWithoutContext() {
    const response = await fetch(url, { method: "GET" });

    const result = await baseService.handleDirectusResponse(
      response,
      "操作成功"
      // 沒有 context 參數
    );
  }

  // 範例 3: 帶部分 context（不會記錄日誌，因為缺少必要信息）
  async exampleWithPartialContext() {
    const response = await fetch(url, { method: "GET" });

    const result = await baseService.handleDirectusResponse(
      response,
      "操作成功",
      {
        method: "GET",
        // 缺少 service 和 operation
      }
    );
  }

  // ========== CRUD 操作 ==========

  /**
   * 創建新活動
   * @param {Object} activityData - 活動資料
   * @returns {Promise<Object>} 創建結果
   */
  async createActivity(activityData) {
    const createISOTime = DateUtils.getCurrentISOTime();

    if (this.base.getIsMock()) {
      console.warn("活動創建成功！⚠️ 當前模式不是 directus，無法創建數據");
      return {
        success: true,
        message: "活動創建成功！⚠️ 當前模式不是 directus，無法創建數據",
        data: {
          id: crypto.randomUUID(), // 標準且保證唯一
          ...activityData,
          createdAt: createISOTime,
        },
      };
    }

    // 準備提交數據
    const activityId = await generateGitHashBrowser(createISOTime);
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
    };

    // ✅ 在 try 外面定義，確保 catch 也能訪問
    const startTime = Date.now();
    const logContext = {
      service: this.serviceName,
      operation: "createActivity",
      method: "POST",
      startTime: startTime,
      endpoint: this.endpoint,
      requestBody: processedData, // ✅ 記錄請求 body
    };

    try {
      console.log("🚀 Directus 服務健康檢查中...");

      // 先檢查連接
      const healthCheck = await this.base.healthCheck();
      if (!healthCheck.online) {
        return {
          success: false,
          online: false,
          message: healthCheck.message,
          data: null,
        };
      }
      console.log("✅ 後端服務健康檢查通過");

      const myHeaders = await this.base.getAuthJsonHeaders();
      const apiUrl = `${this.endpoint}`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: myHeaders,
        body: JSON.stringify(processedData),
      });

      // 計算實際耗時
      const duration = Date.now() - startTime;
      const result = await this.base.handleDirectusResponse(
        response,
        "成功創建活動",
        { ...logContext, duration }
      );

      return result;
    } catch (error) {
      console.error("創建活動失敗:", error);
      return this.handleActivityDirectusError(error);
    }
  }

  /**
   * 更新活動
   * @param {number|string} recordId - 活動 ID
   * @param {Object} activityData - 更新的活動資料
   * @returns {Promise<Object>} 更新結果
   */
  async updateActivity(recordId, activityData) {
    if (this.base.getIsMock()) {
      console.warn("⚠️ 當前模式不是 directus，無法更新數據");
      return {
        success: false,
        message: "⚠️ 當前模式不是 directus，無法更新數據",
      };
    }

    const updateData = {
      ...activityData,
      updatedAt: DateUtils.getCurrentISOTime(),
    };

    // ✅ 同樣在 try 外面定義
    const startTime = Date.now();
    const logContext = {
      service: this.serviceName,
      operation: "updateActivity",
      method: "PATCH",
      startTime: startTime,
      endpoint: `${this.endpoint}/${recordId}`,
      requestBody: updateData, // ✅ 記錄請求 body
    };

    try {
      const myHeaders = await this.base.getAuthJsonHeaders();
      const apiUrl = `${this.endpoint}/${recordId}`;
      const response = await fetch(apiUrl, {
        method: "PATCH",
        headers: myHeaders,
        body: JSON.stringify(updateData),
      });

      const duration = Date.now() - startTime;
      const result = await this.base.handleDirectusResponse(
        response,
        "成功更新活動",
        { ...logContext, duration }
      );

      return result;
    } catch (error) {
      console.error(`❌ 更新活動失敗 (ID: ${recordId})`, error);
      return this.handleActivityDirectusError(error);
    }
  }

  /**
   * 刪除活動
   * @param {number|string} recordId - 活動 ID
   * @returns {Promise<Object>} 刪除結果
   */
  async deleteActivity(recordId) {
    if (this.base.getIsMock()) {
      console.warn("⚠️ 當前模式不是 directus，無法刪除數據");
      return {
        success: false,
        message: "⚠️ 當前模式不是 directus，無法刪除數據",
      };
    }

    const currentDelete = await this.getActivityById(recordId);
    if (!currentDelete) {
      return {
        success: false,
        message: `找不到 ID 為 ${recordId} 的活動`,
        data: null,
      };
    }

    const startTime = Date.now();
    const logContext = {
      service: this.serviceName,
      operation: "deleteActivity",
      method: "DELETE",
      startTime: startTime,
      endpoint: `${this.endpoint}/${recordId}`,
      requestBody: currentDelete, // 刪除的資料
    };

    try {
      const myHeaders = await this.base.getAuthJsonHeaders();
      const apiUrl = `${this.endpoint}/${recordId}`;
      const response = await fetch(apiUrl, {
        method: "DELETE",
        headers: myHeaders,
      });

      const duration = Date.now() - startTime;
      const result = await this.base.handleDirectusResponse(
        response,
        "成功刪除活動",
        { ...logContext, duration }
      );

      return result;
    } catch (error) {
      console.error(`❌ 刪除活動失敗 (ID: ${recordId})`, error);
      return this.handleActivityDirectusError(error);
    }
  }

  /**
   * 根據 ID 獲取活動
   * @param {number|string} recordId - 活動 ID
   * @returns {Promise<Object>} 活動資料
   */
  async getActivityById(recordId) {
    if (this.base.getIsMock()) {
      console.warn("⚠️ 當前模式不是 directus，無法獲取數據");
      return {
        success: false,
        message: "⚠️ 當前模式不是 directus，無法獲取數據",
      };
    }

    try {
      const myHeaders = await this.base.getAuthJsonHeaders();
      const apiUrl = `${this.endpoint}/${recordId}?fields=*`;
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: myHeaders,
      });

      const result = await this.base.handleDirectusResponse(
        response,
        "成功獲取活動"
      );

      return result;
    } catch (error) {
      console.error(`獲取活動 (ID: ${recordId}) 失敗:`, error);
      return this.handleActivityDirectusError(error);
    }
  }

  /**
   * 根據活動 ID 獲取活動（使用自定義 activityId 欄位）
   * @param {string} activityId - 活動的自定義 ID
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
   * 獲取所有活動
   * @param {Object} params - 查詢參數（過濾、排序等）
   * @returns {Promise<Object>} 活動列表
   */
  async getAllActivities(params = {}) {
    if (this.base.getIsMock()) {
      console.warn("⚠️ 當前模式不是 directus，無法獲取數據");
      return {
        success: false,
        message: "⚠️ 當前模式不是 directus，無法獲取數據",
      };
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

      const apiUrl = `${this.endpoint}?${queryParams.toString()}`;
      console.log("📡 查詢 URL:", apiUrl);

      const myHeaders = await this.base.getAuthJsonHeaders();
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: myHeaders,
      });

      const result = await this.base.handleDirectusResponse(
        response,
        "成功獲取所有活動"
      );
      return result;
    } catch (error) {
      console.error("❌ 獲取活動列表失敗:", error);
      return this.handleActivityDirectusError(error);
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
    if (this.base.getIsMock()) {
      console.warn("⚠️ 當前模式不是 directus，返回模擬月度統計數據");
      return {
        success: true,
        data: this.getMockMonthlyStats(),
        message: "⚠️ 當前模式不是 directus，返回模擬月度統計數據",
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
      return this.handleActivityDirectusError(error);
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
  handleActivityDirectusError(error) {
    return this.base.handleDirectusError(error);
  }

  // ========== 模式管理 ==========
  getCurrentMode() {
    if (sessionStorage.getItem("auth-mode") !== null) {
      this.base.mode = sessionStorage.getItem("auth-mode");
    }
    console.log("getCurrentMode: ", this.base.mode);
    return this.base.mode;
  }

  setMode(mode) {
    if (["mock", "backend", "directus"].includes(mode)) {
      this.base.mode = mode;
      console.log(`✅ 切換到 ${mode} 模式`);
    } else {
      console.warn('無效的模式，請使用 "mock", "backend" 或 "directus"');
    }
  }
}

export const activityService = new ActivityService();
