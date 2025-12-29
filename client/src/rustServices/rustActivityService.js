// src/rustServices/rustActivityService.js
import { baseRustService } from "./baseRustService.js";
import { DateUtils } from "../utils/dateUtils.js";

export class RustActivityService {
  constructor() {
    this.base = baseRustService;
    this.endpoint = this.base.endpoints.activities;
  }

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

    // 轉換 Directus 風格的參數到 Rust 風格
    if (params.filter) {
      Object.entries(params.filter).forEach(([key, value]) => {
        if (typeof value === "object" && value._eq) {
          queryParams.append(key, value._eq);
        } else {
          queryParams.append(key, JSON.stringify(value));
        }
      });
    }

    if (params.sort) {
      queryParams.append("sort", params.sort);
    }

    if (params.limit) {
      queryParams.append("limit", params.limit);
    }

    if (params.page) {
      queryParams.append("page", params.page);
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
}

export const rustActivityService = new RustActivityService();
