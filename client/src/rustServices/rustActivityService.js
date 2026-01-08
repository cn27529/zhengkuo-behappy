// src/rustServices/rustActivityService.js
import { baseRustService } from "./baseRustService.js";
import { generateGitHashBrowser } from "../utils/generateGitHash.js";
import { DateUtils } from "../utils/dateUtils.js";

export class RustActivityService {
  constructor() {
    this.serviceName = "RustActivityService";
    this.base = baseRustService;
    this.endpoint = this.base.endpoints.activities;
    console.log(`RustActivityService 初始化: 當前模式為 ${this.base.mode}`);
  }

  // ========== 核心 CRUD 方法 ==========

  /**
   * ✅ 創建活動（與 Directus 接口兼容）
   */
  async createActivity(activityData, additionalContext = {}) {
    // ✅ 在 try 外面定義，確保 catch 也能訪問
    const startTime = Date.now();
    const createISOTime = DateUtils.getCurrentISOTime();
    const activityId = await generateGitHashBrowser(createISOTime);
    const processedData = {
      activityId: activityId,
      ...activityData,
      createdAt: createISOTime,
    };

    const logContext = {
      service: this.serviceName,
      operation: "createActivity",
      method: "POST",
      startTime: startTime,
      endpoint: this.endpoint,
      requestBody: processedData, // ✅ 記錄請求 body
      ...additionalContext,
    };

    try {
      console.log("🦀 [Rust] 創建活動:", processedData);

      const result = await this.base.rustFetch(
        this.endpoint,
        {
          method: "POST",
          body: JSON.stringify(processedData),
        },
        logContext // ✅ 傳入完整的 context
      );

      return result;
    } catch (error) {
      console.error("❌ 創建活動失敗:", error);
      return this.handleRustError(error);
    }
  }

  /**
   * ✅ 更新活動
   */
  async updateActivity(id, activityData, additionalContext = {}) {
    const startTime = Date.now();

    const updateData = {
      ...activityData,
      updatedAt: DateUtils.getCurrentISOTime(),
    };

    const logContext = {
      service: this.serviceName,
      operation: "updateActivity",
      method: "PATCH",
      startTime: startTime,
      endpoint: `${this.endpoint}/${id}`,
      requestBody: updateData, // ✅ 記錄請求 body
      id,
      ...additionalContext,
    };

    try {
      console.log(`🦀 [Rust] 更新活動 (ID: ${id}):`, updateData);

      const result = await this.base.rustFetch(
        `${this.endpoint}/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
        },
        logContext
      );

      return result;
    } catch (error) {
      console.error(`❌ 更新活動失敗 (ID: ${id}):`, error);
      return this.handleRustError(error);
    }
  }

  /**
   * ✅ 刪除活動
   */
  async deleteActivity(id, additionalContext = {}) {
    const startTime = Date.now();

    const logContext = {
      service: this.serviceName,
      operation: "deleteActivity",
      method: "DELETE",
      startTime: startTime,
      endpoint: `${this.endpoint}/${id}`,
      id,
      ...additionalContext,
    };

    try {
      console.log(`🦀 [Rust] 刪除活動 (ID: ${id})`);

      // ✅ 可選：先獲取要刪除的數據（像 activityService 一樣）
      const currentActivity = await this.getActivityById(id, {
        operation: "getActivityBeforeDelete",
      });

      if (currentActivity.success && currentActivity.data) {
        logContext.requestBody = currentActivity.data; // ✅ 記錄被刪除的數據
      }

      const result = await this.base.rustFetch(
        `${this.endpoint}/${id}`,
        {
          method: "DELETE",
        },
        logContext
      );

      return result;
    } catch (error) {
      console.error(`❌ 刪除活動失敗 (ID: ${id}):`, error);
      return this.handleRustError(error);
    }
  }

  /**
   * 獲取單個活動（READ 操作，可選擇是否記錄日誌）
   */
  async getActivityById(id, additionalContext = {}) {
    // ✅ READ 操作通常不需要詳細日誌，但可以選擇性添加
    const shouldLog = additionalContext.forceLog || false;

    const logContext = shouldLog
      ? {
          service: this.serviceName,
          operation: additionalContext.operation || "getActivityById",
          method: "GET",
          startTime: Date.now(),
          endpoint: `${this.endpoint}/${id}`,
          id,
          ...additionalContext,
        }
      : {
          // 最小 context，不會被記錄（因為缺少必要信息）
          operation: additionalContext.operation || "getActivityById",
          id,
        };

    try {
      const result = await this.base.rustFetch(
        `${this.endpoint}/${id}`,
        {
          method: "GET",
        }
        // 沒有 context 參數
      );

      return result;
    } catch (error) {
      console.error(`❌ 獲取活動失敗 (ID: ${id}):`, error);
      return this.handleRustError(error);
    }
  }

  /**
   * 獲取所有活動（支持分頁、過濾、排序）
   */
  async getAllActivities(params = {}, additionalContext = {}) {
    console.log("🦀 [Rust] 服務器獲取活動數據...");

    // ✅ READ 操作可選日誌
    const shouldLog = additionalContext.forceLog || false;

    const queryParams = new URLSearchParams();
    queryParams.append("fields", "*");

    // 轉換 Directus 風格的參數到 Rust 風格
    if (params.filter) {
      Object.entries(params.filter).forEach(([key, value]) => {
        if (typeof value === "object") {
          if (value._eq) {
            queryParams.append(key, value._eq);
          } else if (value._between) {
            queryParams.append(`${key}_from`, value._between[0]);
            queryParams.append(`${key}_to`, value._between[1]);
          } else if (value._contains) {
            queryParams.append(`${key}_contains`, value._contains);
          }
        } else {
          queryParams.append(key, value);
        }
      });
    }

    if (params.sort) {
      queryParams.append("sort", params.sort);
    }

    if (params.limit) {
      queryParams.append("limit", params.limit);
    }

    if (params.offset) {
      queryParams.append("offset", params.offset);
    }

    const endpoint = queryParams.toString()
      ? `${this.endpoint}?${queryParams.toString()}`
      : this.endpoint;

    const logContext = shouldLog
      ? {
          service: this.serviceName,
          operation: "getAllActivities",
          method: "GET",
          startTime: Date.now(),
          endpoint: endpoint,
          queryParams: params,
          ...additionalContext,
        }
      : {
          service: this.serviceName,
          operation: "getAllActivities",
        };

    try {
      const result = await this.base.rustFetch(
        endpoint,
        {
          method: "GET",
        }
        // 沒有 context 參數
      );

      return result;
    } catch (error) {
      console.error("❌ 獲取活動列表失敗:", error);
      return this.handleRustError(error);
    }
  }

  // ========== 查詢方法 ==========

  /**
   * 根據活動 ID 獲取活動（使用自定義 activityId 欄位）
   */
  async getActivitiesByActivityId(activityId, additionalContext = {}) {
    const logContext = {
      operation: "getActivitiesByActivityId",
      activityId,
      ...additionalContext,
    };

    try {
      const result = await this.base.rustFetch(
        `${this.endpoint}/by-activity-id/${activityId}`,
        {
          method: "GET",
        }
        // 沒有 context 參數
      );

      return result;
    } catch (error) {
      console.error(`❌ 根據 activityId 獲取活動失敗 (${activityId}):`, error);
      return this.handleRustError(error);
    }
  }

  /**
   * 根據類型獲取活動
   */
  async getActivitiesByItemType(item_type, additionalContext = {}) {
    const logContext = {
      operation: "getActivitiesByItemType",
      item_type,
      ...additionalContext,
    };

    try {
      const result = await this.base.rustFetch(
        `${this.endpoint}/by-type/${item_type}`,
        {
          method: "GET",
        }
        // 沒有 context 參數
      );

      return result;
    } catch (error) {
      console.error(`❌ 根據類型獲取活動失敗 (${item_type}):`, error);
      return this.handleRustError(error);
    }
  }

  /**
   * 根據狀態獲取活動
   */
  async getActivitiesByState(state, additionalContext = {}) {
    const logContext = {
      operation: "getActivitiesByState",
      state,
      ...additionalContext,
    };

    try {
      const result = await this.base.rustFetch(
        `${this.endpoint}/by-state/${state}`,
        {
          method: "GET",
        }
        // 沒有 context 參數
      );

      return result;
    } catch (error) {
      console.error(`❌ 根據狀態獲取活動失敗 (${state}):`, error);
      return this.handleRustError(error);
    }
  }

  /**
   * 獲取即將到來的活動
   */
  async getUpcomingActivities(additionalContext = {}) {
    const logContext = {
      operation: "getUpcomingActivities",
      ...additionalContext,
    };

    try {
      const result = await this.base.rustFetch(
        `${this.endpoint}/upcoming`,
        {
          method: "GET",
        }
        // 沒有 context 參數
      );

      return result;
    } catch (error) {
      console.error("❌ 獲取即將到來的活動失敗:", error);
      return this.handleRustError(error);
    }
  }

  /**
   * 獲取已完成的活動
   */
  async getCompletedActivities(additionalContext = {}) {
    const logContext = {
      operation: "getCompletedActivities",
      ...additionalContext,
    };

    try {
      const result = await this.base.rustFetch(
        `${this.endpoint}/completed`,
        {
          method: "GET",
        }
        // 沒有 context 參數
      );

      return result;
    } catch (error) {
      console.error("❌ 獲取已完成的活動失敗:", error);
      return this.handleRustError(error);
    }
  }

  /**
   * 根據日期範圍獲取活動
   */
  async getActivitiesByDateRange(startDate, endDate, additionalContext = {}) {
    const startTime = Date.now();

    const requestBody = { startDate, endDate };

    const logContext = {
      service: this.serviceName,
      operation: "getActivitiesByDateRange",
      method: "POST",
      startTime: startTime,
      endpoint: `${this.endpoint}/by-date-range`,
      requestBody: requestBody,
      startDate,
      endDate,
      ...additionalContext,
    };

    try {
      const result = await this.base.rustFetch(
        `${this.endpoint}/by-date-range`,
        {
          method: "POST",
          body: JSON.stringify(requestBody),
        }
        // 沒有 context 參數
      );

      return result;
    } catch (error) {
      console.error("❌ 根據日期範圍獲取活動失敗:", error);
      return this.handleRustError(error);
    }
  }

  // ========== 統計方法 ==========

  /**
   * 獲取月度統計
   */
  async getMonthlyStats(additionalContext = {}) {
    console.log("📊 獲取月度統計數據...");

    try {
      // 首先獲取所有活動
      const activitiesResult = await this.getAllActivities(
        {},
        {
          ...additionalContext,
          operation: "getAllActivitiesForStats",
        }
      );

      if (!activitiesResult.success) {
        throw new Error("無法獲取活動數據用於統計");
      }

      const activities = activitiesResult.data;

      // 本地計算月度統計
      const monthlyStats = this.calculateMonthlyStats(activities);

      return {
        success: true,
        data: monthlyStats,
        message: "成功計算月度統計",
        isLocallyCalculated: true,
      };
    } catch (error) {
      console.error("❌ 獲取月度統計失敗:", error);

      // 返回默認統計或空數組
      return {
        success: true,
        data: [],
        message: "使用默認統計數據",
        isLocallyCalculated: true,
        error: error.message,
      };
    }
  }

  /**
   * 本地計算月度統計
   */
  calculateMonthlyStats(activities) {
    console.log("🧮 本地計算月度統計，活動數量:", activities.length);

    const monthNames = [
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

    const statsByMonth = {};
    monthNames.forEach((month) => {
      statsByMonth[month] = {
        month,
        participants: 0,
        events: 0,
        activities: [],
      };
    });

    activities.forEach((activity) => {
      if (!activity.date) return;

      try {
        const date = new Date(activity.date);
        const monthIndex = date.getMonth();
        const month = monthNames[monthIndex];

        if (month && statsByMonth[month]) {
          statsByMonth[month].participants += activity.participants || 0;
          statsByMonth[month].events += 1;
          statsByMonth[month].activities.push({
            id: activity.id,
            name: activity.name,
            date: activity.date,
            participants: activity.participants || 0,
          });
        }
      } catch (error) {
        console.warn("⚠️ 處理活動日期時出錯:", activity.date, error);
      }
    });

    const result = Object.values(statsByMonth)
      .filter((stat) => stat.events > 0)
      .map((stat) => ({
        ...stat,
        avgParticipants:
          stat.events > 0 ? Math.round(stat.participants / stat.events) : 0,
      }));

    console.log("📊 計算完成的統計數據:", result);
    return result;
  }

  // ========== 狀態管理方法（CUD 操作）==========

  /**
   * ✅ 更新活動參與人次
   */
  async updateParticipants(id, participants, additionalContext = {}) {
    const startTime = Date.now();

    const requestBody = { participants };

    const logContext = {
      service: this.serviceName,
      operation: "updateParticipants",
      method: "PATCH",
      startTime: startTime,
      endpoint: `${this.endpoint}/${id}/participants`,
      requestBody: requestBody,
      id,
      participants,
      ...additionalContext,
    };

    try {
      console.log(`🦀 [Rust] 更新參與人次 (ID: ${id}):`, participants);

      const result = await this.base.rustFetch(
        `${this.endpoint}/${id}/participants`,
        {
          method: "PATCH",
          body: JSON.stringify(requestBody),
        },
        logContext
      );

      return result;
    } catch (error) {
      console.error(`❌ 更新參與人次失敗 (ID: ${id}):`, error);
      return this.handleRustError(error);
    }
  }

  /**
   * ✅ 完成活動
   */
  async completeActivity(id, additionalContext = {}) {
    const startTime = Date.now();

    const logContext = {
      service: this.serviceName,
      operation: "completeActivity",
      method: "PATCH",
      startTime: startTime,
      endpoint: `${this.endpoint}/${id}/complete`,
      id,
      ...additionalContext,
    };

    try {
      console.log(`🦀 [Rust] 完成活動 (ID: ${id})`);

      const result = await this.base.rustFetch(
        `${this.endpoint}/${id}/complete`,
        {
          method: "PATCH",
        },
        logContext
      );

      return result;
    } catch (error) {
      console.error(`❌ 完成活動失敗 (ID: ${id}):`, error);
      return this.handleRustError(error);
    }
  }

  /**
   * ✅ 取消活動
   */
  async cancelActivity(id, additionalContext = {}) {
    const startTime = Date.now();

    const logContext = {
      service: this.serviceName,
      operation: "cancelActivity",
      method: "PATCH",
      startTime: startTime,
      endpoint: `${this.endpoint}/${id}/cancel`,
      id,
      ...additionalContext,
    };

    try {
      console.log(`🦀 [Rust] 取消活動 (ID: ${id})`);

      const result = await this.base.rustFetch(
        `${this.endpoint}/${id}/cancel`,
        {
          method: "PATCH",
        },
        logContext
      );

      return result;
    } catch (error) {
      console.error(`❌ 取消活動失敗 (ID: ${id}):`, error);
      return this.handleRustError(error);
    }
  }

  // ========== Rust 特有功能 ==========

  /**
   * 獲取活動統計（Rust 特有功能）
   */
  async getActivityStats(timeRange = "month", additionalContext = {}) {
    const logContext = {
      operation: "getActivityStats",
      timeRange,
      ...additionalContext,
    };

    try {
      const result = await this.base.rustFetch(
        `${this.endpoint}/stats?range=${timeRange}`,
        {
          method: "GET",
        }
        // 沒有 context 參數
      );

      return result;
    } catch (error) {
      console.error("❌ 獲取活動統計失敗:", error);
      return this.handleRustError(error);
    }
  }

  /**
   * ✅ 批量操作（Rust 特有功能）
   */
  async batchOperations(operations, additionalContext = {}) {
    const startTime = Date.now();

    const requestBody = { operations };

    const logContext = {
      service: this.serviceName,
      operation: "batchOperations",
      method: "POST",
      startTime: startTime,
      endpoint: `${this.endpoint}/batch`,
      requestBody: requestBody,
      count: operations.length,
      ...additionalContext,
    };

    try {
      console.log(`🦀 [Rust] 批量操作，數量: ${operations.length}`);

      const result = await this.base.rustFetch(
        `${this.endpoint}/batch`,
        {
          method: "POST",
          body: JSON.stringify(requestBody),
        }
        // 沒有 context 參數
      );

      return result;
    } catch (error) {
      console.error("❌ 批量操作失敗:", error);
      return this.handleRustError(error);
    }
  }

  /**
   * ✅ 搜索活動（全文搜索）
   */
  async searchActivities(query, options = {}, additionalContext = {}) {
    const startTime = Date.now();

    const requestBody = { query, ...options };

    const logContext = {
      service: this.serviceName,
      operation: "searchActivities",
      method: "POST",
      startTime: startTime,
      endpoint: `${this.endpoint}/search`,
      requestBody: requestBody,
      query,
      ...additionalContext,
    };

    try {
      console.log(`🦀 [Rust] 搜索活動: "${query}"`);

      const result = await this.base.rustFetch(
        `${this.endpoint}/search`,
        {
          method: "POST",
          body: JSON.stringify(requestBody),
        }
        // 沒有 context 參數
      );

      return result;
    } catch (error) {
      console.error("❌ 搜索活動失敗:", error);
      return this.handleRustError(error);
    }
  }

  /**
   * 導出活動數據
   */
  async exportActivities(format = "csv", params = {}, additionalContext = {}) {
    const logContext = {
      operation: "exportActivities",
      format,
      ...additionalContext,
    };

    try {
      const result = await this.base.rustFetch(
        `${this.endpoint}/export?format=${format}&${new URLSearchParams(
          params
        )}`,
        {
          method: "GET",
        }
        // 沒有 context 參數
      );

      return result;
    } catch (error) {
      console.error("❌ 導出活動數據失敗:", error);
      return this.handleRustError(error);
    }
  }

  /**
   * 獲取活動類型統計
   */
  async getActivityTypeStats(additionalContext = {}) {
    const logContext = {
      operation: "getActivityTypeStats",
      ...additionalContext,
    };

    try {
      const result = await this.base.rustFetch(
        `${this.endpoint}/stats/types`,
        {
          method: "GET",
        }
        // 沒有 context 參數
      );

      return result;
    } catch (error) {
      console.error("❌ 獲取活動類型統計失敗:", error);
      return this.handleRustError(error);
    }
  }

  /**
   * 獲取活動參與趨勢
   */
  async getParticipationTrend(period = "month", additionalContext = {}) {
    const logContext = {
      operation: "getParticipationTrend",
      period,
      ...additionalContext,
    };

    try {
      const result = await this.base.rustFetch(
        `${this.endpoint}/stats/trend/${period}`,
        {
          method: "GET",
        }
        // 沒有 context 參數
      );

      return result;
    } catch (error) {
      console.error("❌ 獲取參與趨勢失敗:", error);
      return this.handleRustError(error);
    }
  }

  // ========== 模式管理 ==========

  /**
   * 獲取當前模式
   */
  getCurrentMode() {
    return "rust";
  }

  /**
   * 設置模式（在 Rust 服務中無效，但保持接口兼容）
   */
  setMode(mode) {
    console.warn(`⚠️🦀 [Rust] 服務不支持切換模式，當前固定為 rust 模式`);
    return "rust";
  }

  // ========== 錯誤處理 ==========

  /**
   * Rust 特定的錯誤處理
   */
  handleRustError(error) {
    if (
      error.message.includes("NetworkError") ||
      error.message.includes("Failed to fetch")
    ) {
      return {
        success: false,
        message: "Rust 服務未啟動或網路連接失敗",
        errorCode: "RUST_NOT_AVAILABLE",
        details: "請確保 Rust 服務正在運行",
      };
    }

    if (
      error.message.includes("401") ||
      error.message.includes("Unauthorized")
    ) {
      return {
        success: false,
        message: "認證失敗，請重新登入",
        errorCode: "UNAUTHORIZED",
        details: error.message,
      };
    }

    if (error.message.includes("404")) {
      return {
        success: false,
        message: "資源不存在",
        errorCode: "NOT_FOUND",
        details: error.message,
      };
    }

    return {
      success: false,
      message: "Rust 服務操作失敗",
      errorCode: "RUST_ERROR",
      details: error.message,
    };
  }
}

export const rustActivityService = new RustActivityService();
