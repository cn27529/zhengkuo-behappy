// src/rustServices/rustActivityService.js
import { baseRustService } from "./baseRustService.js";
import { DateUtils } from "../utils/dateUtils.js";

export class RustActivityService {
  constructor() {
    this.base = baseRustService;
    this.endpoint = this.base.endpoints.activities;
  }

  // ========== 核心 CRUD 方法 ==========

  /**
   * 創建活動（與 Directus 接口兼容）
   */
  async createActivity(activityData, context = {}) {
    const processedData = {
      ...activityData,
      createdAt: DateUtils.getCurrentISOTime(),
    };

    return await this.base.rustFetch(
      this.endpoint,
      {
        method: "POST",
        body: JSON.stringify(processedData),
      },
      {
        operation: "createActivity",
        ...context,
      }
    );
  }

  /**
   * 獲取所有活動（支持分頁、過濾、排序）
   */
  async getAllActivities(params = {}, context = {}) {
    const queryParams = new URLSearchParams();
    queryParams.append("fields", "*");

    // 轉換 Directus 風格的參數到 Rust 風格
    if (params.filter) {
      Object.entries(params.filter).forEach(([key, value]) => {
        if (typeof value === "object") {
          // 處理 Directus 的查詢運算符
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

    return await this.base.rustFetch(
      endpoint,
      {
        method: "GET",
      },
      {
        operation: "getAllActivities",
        ...context,
      }
    );
  }

  /**
   * 獲取單個活動
   */
  async getActivityById(id, context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/${id}`,
      {
        method: "GET",
      },
      {
        operation: "getActivityById",
        id,
        ...context,
      }
    );
  }

  /**
   * 更新活動
   */
  async updateActivity(id, activityData, context = {}) {
    const updateData = {
      ...activityData,
      updatedAt: DateUtils.getCurrentISOTime(),
    };

    return await this.base.rustFetch(
      `${this.endpoint}/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(updateData),
      },
      {
        operation: "updateActivity",
        id,
        ...context,
      }
    );
  }

  /**
   * 刪除活動
   */
  async deleteActivity(id, context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/${id}`,
      {
        method: "DELETE",
      },
      {
        operation: "deleteActivity",
        id,
        ...context,
      }
    );
  }

  // ========== 查詢方法 ==========

  /**
   * 根據活動 ID 獲取活動（使用自定義 activityId 欄位）
   */
  async getActivitiesByActivityId(activityId, context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/by-activity-id/${activityId}`,
      {
        method: "GET",
      },
      {
        operation: "getActivitiesByActivityId",
        activityId,
        ...context,
      }
    );
  }

  /**
   * 根據類型獲取活動
   */
  async getActivitiesByItemType(item_type, context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/by-type/${item_type}`,
      {
        method: "GET",
      },
      {
        operation: "getActivitiesByItemType",
        item_type,
        ...context,
      }
    );
  }

  /**
   * 根據狀態獲取活動
   */
  async getActivitiesByState(state, context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/by-state/${state}`,
      {
        method: "GET",
      },
      {
        operation: "getActivitiesByState",
        state,
        ...context,
      }
    );
  }

  /**
   * 獲取即將到來的活動
   */
  async getUpcomingActivities(context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/upcoming`,
      {
        method: "GET",
      },
      {
        operation: "getUpcomingActivities",
        ...context,
      }
    );
  }

  /**
   * 獲取已完成的活動
   */
  async getCompletedActivities(context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/completed`,
      {
        method: "GET",
      },
      {
        operation: "getCompletedActivities",
        ...context,
      }
    );
  }

  /**
   * 根據日期範圍獲取活動
   */
  async getActivitiesByDateRange(startDate, endDate, context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/by-date-range`,
      {
        method: "POST",
        body: JSON.stringify({ startDate, endDate }),
      },
      {
        operation: "getActivitiesByDateRange",
        startDate,
        endDate,
        ...context,
      }
    );
  }

  // ========== 統計方法 ==========

  /**
   * 獲取月度統計
   */
  async getMonthlyStats(context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/stats/monthly`,
      {
        method: "GET",
      },
      {
        operation: "getMonthlyStats",
        ...context,
      }
    );
  }

  /**
   * 更新活動參與人次
   */
  async updateParticipants(id, participants, context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/${id}/participants`,
      {
        method: "PATCH",
        body: JSON.stringify({ participants }),
      },
      {
        operation: "updateParticipants",
        id,
        participants,
        ...context,
      }
    );
  }

  /**
   * 完成活動
   */
  async completeActivity(id, context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/${id}/complete`,
      {
        method: "PATCH",
      },
      {
        operation: "completeActivity",
        id,
        ...context,
      }
    );
  }

  /**
   * 取消活動
   */
  async cancelActivity(id, context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/${id}/cancel`,
      {
        method: "PATCH",
      },
      {
        operation: "cancelActivity",
        id,
        ...context,
      }
    );
  }

  // ========== Rust 特有功能 ==========

  /**
   * 獲取活動統計（Rust 特有功能）
   */
  async getActivityStats(timeRange = "month", context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/stats?range=${timeRange}`,
      {
        method: "GET",
      },
      {
        operation: "getActivityStats",
        timeRange,
        ...context,
      }
    );
  }

  /**
   * 批量操作（Rust 特有功能）
   */
  async batchOperations(operations, context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/batch`,
      {
        method: "POST",
        body: JSON.stringify({ operations }),
      },
      {
        operation: "batchOperations",
        count: operations.length,
        ...context,
      }
    );
  }

  /**
   * 搜索活動（全文搜索）
   */
  async searchActivities(query, options = {}, context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/search`,
      {
        method: "POST",
        body: JSON.stringify({ query, ...options }),
      },
      {
        operation: "searchActivities",
        query,
        ...context,
      }
    );
  }

  /**
   * 導出活動數據
   */
  async exportActivities(format = "csv", params = {}, context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/export?format=${format}&${new URLSearchParams(params)}`,
      {
        method: "GET",
      },
      {
        operation: "exportActivities",
        format,
        ...context,
      }
    );
  }

  /**
   * 獲取活動類型統計
   */
  async getActivityTypeStats(context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/stats/types`,
      {
        method: "GET",
      },
      {
        operation: "getActivityTypeStats",
        ...context,
      }
    );
  }

  /**
   * 獲取活動參與趨勢
   */
  async getParticipationTrend(period = "month", context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/stats/trend/${period}`,
      {
        method: "GET",
      },
      {
        operation: "getParticipationTrend",
        period,
        ...context,
      }
    );
  }

  // ========== 模式管理 ==========

  /**
   * 獲取當前模式
   */
  getCurrentMode() {
    return "rust"; // Rust 服務總是 rust 模式
  }

  /**
   * 設置模式（在 Rust 服務中無效，但保持接口兼容）
   */
  setMode(mode) {
    console.warn(`⚠️ Rust 服務不支持切換模式，當前固定為 rust 模式`);
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

  /**
   * 健康檢查
   */
  async healthCheck() {
    return await this.base.rustFetch(
      `${this.base.baseUrl}/health`,
      {
        method: "GET",
      },
      {
        operation: "healthCheck",
      }
    );
  }

  /**
   * 獲取服務信息
   */
  async getServiceInfo() {
    return await this.base.rustFetch(
      `${this.base.baseUrl}/info`,
      {
        method: "GET",
      },
      {
        operation: "getServiceInfo",
      }
    );
  }
}

export const rustActivityService = new RustActivityService();
