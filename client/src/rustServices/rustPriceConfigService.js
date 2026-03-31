// src/rustServices/rustPriceConfigService.js
import { baseRustService } from "./baseRustService.js";

export class RustPriceConfigService {
  constructor() {
    this.serviceName = "RustPriceConfigService";
    this.base = baseRustService;
    this.endpoint = this.base.endpoints.priceConfig || "price-configs";
    console.log(`RustPriceConfigService 初始化: 當前模式為 ${this.base.mode}`);
  }

  // ========== CRUD 操作 ==========

  /**
   * 獲取所有 PriceConfig
   * @param {Object} params - 查詢參數
   * @param {string} params.sort - 排序字段，例如 "id" 或 "-id" (降序)
   * @param {number} params.limit - 每頁數量
   * @param {number} params.offset - 偏移量
   * @param {Object} params.filter - 過濾條件
   * @param {string} params.filter.version - 版本 (LIKE 查詢)
   * @param {string} params.filter.state - 狀態 (精確匹配)
   * @param {Object} context - 上下文信息
   */
  async getAllPriceConfigs(params = {}, context = {}) {
    const queryParams = new URLSearchParams();

    if (params.sort) {
      queryParams.append("sort", params.sort);
    }

    if (params.limit) {
      queryParams.append("limit", params.limit);
    }

    if (params.offset) {
      queryParams.append("offset", params.offset);
    }

    if (params.filter) {
      Object.entries(params.filter).forEach(([key, value]) => {
        if (typeof value === "object") {
          if (value._eq) {
            queryParams.append(key, value._eq);
          } else if (value._like) {
            queryParams.append(key, value._like);
          }
        } else {
          queryParams.append(key, value);
        }
      });
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
        operation: "getAllPriceConfigs",
        ...context,
      },
    );
  }

  /**
   * 根據 ID 獲取單筆 PriceConfig
   * @param {number} id - 配置 ID
   * @param {Object} context - 上下文信息
   */
  async getPriceConfigById(id, context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/${id}`,
      {
        method: "GET",
      },
      {
        operation: "getPriceConfigById",
        id,
        ...context,
      },
    );
  }

  /**
   * 創建新的 PriceConfig
   * @param {Object} priceConfigData - 配置數據
   * @param {string} priceConfigData.version - 版本號
   * @param {string} priceConfigData.state - 狀態
   * @param {Object} priceConfigData.prices - 價格 JSON 對象
   * @param {string} priceConfigData.notes - 備註
   * @param {string} priceConfigData.enable_date - 啟用日期
   * @param {string} priceConfigData.created_at - 創建時間
   * @param {string} priceConfigData.updated_at - 更新時間
   * @param {Object} additionalContext - 額外上下文
   */
  async createPriceConfig(priceConfigData, additionalContext = {}) {
    const processedData = {
      ...priceConfigData,
      state: priceConfigData.state || "draft",
    };

    const startTime = Date.now();
    const logContext = {
      service: this.serviceName,
      operation: "createPriceConfig",
      method: "POST",
      startTime: startTime,
      endpoint: this.endpoint,
      requestBody: processedData,
      ...additionalContext,
    };

    if (this.base.getIsMock()) {
      console.warn("⚠️ 當前模式不為 Rust，PriceConfig 創建成功");
      return {
        success: true,
        data: {
          id: Date.now(),
          ...processedData,
        },
        message: "Mock 模式：PriceConfig 創建成功",
      };
    }

    try {
      console.log("🦀 [Rust] 創建 PriceConfig:", processedData);
      const result = await this.base.rustFetch(
        this.endpoint,
        {
          method: "POST",
          body: JSON.stringify(processedData),
        },
        logContext,
      );

      return result;
    } catch (error) {
      console.error("❌ 創建 PriceConfig 失敗:", error);
      throw error;
    }
  }

  /**
   * 更新 PriceConfig
   * @param {number} id - 配置 ID
   * @param {Object} priceConfigData - 要更新的數據
   * @param {Object} context - 上下文信息
   */
  async updatePriceConfig(id, priceConfigData, context = {}) {
    const updateData = {
      ...priceConfigData,
      user_updated: context.user_updated || "system",
    };

    return await this.base.rustFetch(
      `${this.endpoint}/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(updateData),
      },
      {
        service: this.serviceName,
        operation: "updatePriceConfig",
        id,
        ...context,
      },
    );
  }

  /**
   * 刪除 PriceConfig
   * @param {number} id - 配置 ID
   * @param {Object} context - 上下文信息
   */
  async deletePriceConfig(id, context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/${id}`,
      {
        method: "DELETE",
      },
      {
        service: this.serviceName,
        operation: "deletePriceConfig",
        id,
        ...context,
      },
    );
  }

  // ========== 高級查詢方法 ==========

  /**
   * 根據版本獲取 PriceConfig
   * @param {string} version - 版本號 (支持模糊匹配)
   * @param {Object} context - 上下文信息
   */
  async getPriceConfigByVersion(version, context = {}) {
    return await this.getAllPriceConfigs(
      {
        filter: {
          version: { _like: version },
        },
      },
      context,
    );
  }

  /**
   * 根據狀態獲取 PriceConfig
   * @param {string} state - 狀態
   * @param {Object} context - 上下文信息
   */
  async getPriceConfigByState(state, context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/by-state/${state}`,
      {
        method: "GET",
      },
      {
        operation: "getPriceConfigByState",
        state,
        ...context,
      },
    );
  }

  /**
   * 獲取最新版本的 PriceConfig
   * @param {Object} context - 上下文信息
   */
  async getLatestPriceConfig(context = {}) {
    return await this.getAllPriceConfigs(
      {
        sort: "-id",
        limit: 1,
      },
      context,
    );
  }

  /**
   * 獲取當前啟用的 PriceConfig
   * @param {Object} context - 上下文信息
   */
  async getActivePriceConfig(context = {}) {
    return await this.getAllPriceConfigs(
      {
        filter: {
          state: "active",
        },
        sort: "-date_created",
        limit: 1,
      },
      context,
    );
  }

  /**
   * 搜索 PriceConfig
   * @param {string} keyword - 搜索關鍵詞 (搜索 version 和 notes)
   * @param {Object} context - 上下文信息
   */
  async searchPriceConfig(keyword, context = {}) {
    // 由於後端目前只支持單一字段過濾，這裡使用 version 進行模糊搜索
    // 如需同時搜索多個字段，可以在後端添加對應的搜索接口
    return await this.getAllPriceConfigs(
      {
        filter: {
          version: { _like: keyword },
        },
      },
      context,
    );
  }

  // ========== 批量操作 ==========

  /**
   * 批量獲取 PriceConfig
   * @param {number[]} ids - ID 數組
   * @param {Object} context - 上下文信息
   */
  async getPriceConfigsByIds(ids, context = {}) {
    if (!ids || ids.length === 0) {
      return {
        success: true,
        data: [],
        message: "沒有提供 ID",
      };
    }

    // 由於後端目前不支持批量查詢，這裡使用並發請求
    // 注意：如果 ID 數量較多，建議後端添加批量查詢接口
    const promises = ids.map((id) =>
      this.getPriceConfigById(id, context).catch((error) => ({
        success: false,
        id,
        error: error.message,
      })),
    );

    const results = await Promise.all(promises);
    const successful = results.filter((r) => r.success).map((r) => r.data);
    const failed = results.filter((r) => !r.success);

    return {
      success: failed.length === 0,
      data: successful,
      failed: failed.length > 0 ? failed : undefined,
      message:
        failed.length > 0 ? `部分請求失敗: ${failed.length} 個` : undefined,
    };
  }

  // ========== 版本管理 ==========

  /**
   * 獲取所有版本列表 (去重)
   * @param {Object} context - 上下文信息
   */
  async getAllVersions(context = {}) {
    const result = await this.getAllPriceConfigs(
      {
        sort: "-id",
        limit: 1000, // 獲取足夠多的數據
      },
      context,
    );

    if (result.success && result.data) {
      const versions = [
        ...new Set(result.data.map((item) => item.version).filter(Boolean)),
      ];
      return {
        success: true,
        data: versions,
        message: `找到 ${versions.length} 個版本`,
      };
    }

    return result;
  }

  // ========== 錯誤處理 ==========

  /**
   * Rust 特定的錯誤處理
   * @param {Error} error - 錯誤對象
   */
  handlePriceConfigError(error) {
    return this.base.handleRustError(error);
  }

  // ========== 模式管理 ==========

  /**
   * 獲取當前模式
   */
  getCurrentMode() {
    return this.base.mode;
  }

  /**
   * 設置模式（在 Rust 服務中無效，但保持接口兼容）
   * @param {string} mode - 模式名稱
   */
  setMode(mode) {
    console.warn(`⚠️🦀 [Rust] 服務不支持切換模式，當前固定為 rust 模式`);
    return "rust";
  }
}

export const rustPriceConfigService = new RustPriceConfigService();
