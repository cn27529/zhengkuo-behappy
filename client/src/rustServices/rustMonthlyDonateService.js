// src/rustServices/rustActivityService.js
import { baseRustService } from "./baseRustService.js";
import { DateUtils } from "../utils/dateUtils.js";

export class RustMonthlyDonateService {
  constructor() {
    this.base = baseRustService;
    this.endpoint = this.base.endpoints.monthlyDonates;
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
  async getAllMonthlyDonates(params = {}, context = {}) {
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
        operation: "getAllMonthlyDonates",
        ...context,
      }
    );
  }

  /**
   * 獲取單個活動
   */
  async getMonthlyDonateById(id, context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/${id}`,
      {
        method: "GET",
      },
      {
        operation: "getMonthlyDonateById",
        id,
        ...context,
      }
    );
  }

  /**
   * 更新活動
   */
  async updateMonthlyDonate(id, donateData, context = {}) {
    const updateData = {
      ...donateData,
      updatedAt: DateUtils.getCurrentISOTime(),
    };

    return await this.base.rustFetch(
      `${this.endpoint}/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(updateData),
      },
      {
        operation: "updateMonthlyDonate",
        id,
        ...context,
      }
    );
  }

  /**
   * 刪除活動
   */
  async deleteMonthlyDonate(id, context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/${id}`,
      {
        method: "DELETE",
      },
      {
        operation: "deleteMonthlyDonate",
        id,
        ...context,
      }
    );
  }

  /**
   * 獲取活動統計（Rust 特有功能）
   */
  async getMonthlyDonateStats(timeRange = "month", context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/stats?range=${timeRange}`,
      {
        method: "GET",
      },
      {
        operation: "getMonthlyDonateStats",
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
  async searchMonthlyDonates(query, options = {}, context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/search`,
      {
        method: "POST",
        body: JSON.stringify({ query, ...options }),
      },
      {
        operation: "searchMonthlyDonates",
        query,
        ...context,
      }
    );
  }

  /**
   * 導出活動數據
   */
  async exportMonthlyDonates(format = "csv", params = {}, context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/export?format=${format}&${new URLSearchParams(params)}`,
      {
        method: "GET",
      },
      {
        operation: "exportMonthlyDonates",
        format,
        ...context,
      }
    );
  }
}

export const rustMonthlyDonateService = new RustMonthlyDonateService();
