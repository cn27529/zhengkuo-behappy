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
      { method: "GET" },
      { operation: "getAllPriceConfigs", ...context },
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
      { method: "GET" },
      { operation: "getPriceConfigById", id, ...context },
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
      startTime,
      endpoint: this.endpoint,
      requestBody: processedData,
      ...additionalContext,
    };

    if (this.base.getIsMock()) {
      console.warn("⚠️ 當前模式不為 Rust，PriceConfig 創建成功");
      return {
        success: true,
        data: { id: Date.now(), ...processedData },
        message: "Mock 模式：PriceConfig 創建成功",
      };
    }

    try {
      console.log("🦀 [Rust] 創建 PriceConfig:", processedData);
      return await this.base.rustFetch(
        this.endpoint,
        { method: "POST", body: JSON.stringify(processedData) },
        logContext,
      );
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
      { method: "PATCH", body: JSON.stringify(updateData) },
      { service: this.serviceName, operation: "updatePriceConfig", id, ...context },
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
      { method: "DELETE" },
      { service: this.serviceName, operation: "deletePriceConfig", id, ...context },
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
      { filter: { version: { _like: version } } },
      context,
    );
  }

  /**
   * 根據狀態獲取 PriceConfig（走專用路由 /by-state/:state）
   * @param {string} state - 狀態
   * @param {Object} context - 上下文信息
   */
  async getPriceConfigByState(state, context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/by-state/${state}`,
      { method: "GET" },
      { operation: "getPriceConfigByState", state, ...context },
    );
  }

  /**
   * 根據狀態批量獲取多種狀態的 PriceConfig
   * 使用並發請求取得各狀態結果，並合併回傳
   *
   * 注意：若需要單一 SQL 查詢 (IN operator)，
   * 需在 Rust handler 的 PriceConfigQuery 加入 states: Option<Vec<String>>
   * 並在 get_all_price_configs 加 WHERE state IN (...) 條件
   *
   * @param {string[]} states - 狀態陣列，例如 ["active", "draft"]
   * @param {Object} context - 上下文信息
   */
  async getPriceConfigsByState(states = [], context = {}) {
    if (!states || states.length === 0) {
      return { success: true, data: [], message: "未提供狀態條件" };
    }

    // 單一狀態直接走 by-state 路由
    if (states.length === 1) {
      return await this.getPriceConfigByState(states[0], context);
    }

    // 多狀態並發請求後合併
    const promises = states.map((state) =>
      this.getPriceConfigByState(state, context).catch((error) => ({
        success: false,
        state,
        error: error.message,
      })),
    );

    const results = await Promise.all(promises);
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    const mergedData = successful.flatMap((r) =>
      Array.isArray(r.data) ? r.data : [],
    );

    return {
      success: failed.length === 0,
      data: mergedData,
      failed: failed.length > 0 ? failed : undefined,
      message: failed.length > 0
        ? `部分狀態請求失敗: ${failed.map((f) => f.state).join(", ")}`
        : `共取得 ${mergedData.length} 筆記錄`,
    };
  }

  /**
   * 根據日期範圍獲取 PriceConfig（依 enableDate 過濾）
   *
   * 目前實作：拉取全量資料後在前端過濾（適合資料量小的場景）
   *
   * ⚠️ 若資料量大，建議在 Rust 端擴充：
   *   1. PriceConfigQuery struct 加入 enable_date_from / enable_date_to: Option<String>
   *   2. get_all_price_configs handler 加入：
   *      if let Some(from) = &params.enable_date_from {
   *          query.push_str(&format!(" AND enableDate >= '{}'", from));
   *      }
   *      if let Some(to) = &params.enable_date_to {
   *          query.push_str(&format!(" AND enableDate <= '{}'", to));
   *      }
   *
   * @param {string} dateFrom - 起始日期，ISO 8601 格式，例如 "2024-01-01"
   * @param {string} dateTo   - 結束日期，ISO 8601 格式，例如 "2024-12-31"
   * @param {Object} options  - 額外選項
   * @param {string} options.sort  - 排序，預設 "-id"
   * @param {number} options.limit - 筆數上限
   * @param {Object} context  - 上下文信息
   */
  async getPriceConfigByDate(dateFrom, dateTo, options = {}, context = {}) {
    if (!dateFrom && !dateTo) {
      return { success: false, data: [], message: "需提供 dateFrom 或 dateTo" };
    }

    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;

    if (from && isNaN(from.getTime())) {
      return { success: false, data: [], message: `dateFrom 格式無效: ${dateFrom}` };
    }
    if (to && isNaN(to.getTime())) {
      return { success: false, data: [], message: `dateTo 格式無效: ${dateTo}` };
    }

    // 拉取足夠多的資料供前端過濾
    const result = await this.getAllPriceConfigs(
      {
        sort: options.sort || "-id",
        limit: options.limit || 1000,
      },
      { operation: "getPriceConfigByDate", ...context },
    );

    if (!result.success || !Array.isArray(result.data)) {
      return result;
    }

    const filtered = result.data.filter((item) => {
      // 優先用 enableDate，fallback 到 date_created
      const raw = item.enableDate || item.enable_date || item.date_created;
      if (!raw) return false;

      const itemDate = new Date(raw);
      if (isNaN(itemDate.getTime())) return false;

      if (from && itemDate < from) return false;
      if (to && itemDate > to) return false;
      return true;
    });

    return {
      success: true,
      data: filtered,
      message: `日期範圍 [${dateFrom ?? "*"} ~ ${dateTo ?? "*"}] 共 ${filtered.length} 筆`,
    };
  }

  /**
   * 獲取 PriceConfig 歷史記錄
   * 依建立時間降序排列，支持依版本或狀態縮小範圍
   *
   * 注意：本方法使用現有 API 組合實現，無需修改 Rust 端
   *
   * @param {Object} options - 選項
   * @param {string} options.version  - 限定版本（模糊匹配）
   * @param {string} options.state    - 限定狀態
   * @param {number} options.limit    - 返回筆數，預設 50
   * @param {number} options.offset   - 偏移量，預設 0
   * @param {Object} context - 上下文信息
   */
  async getPriceHistory(options = {}, context = {}) {
    const { version, state, limit = 50, offset = 0 } = options;

    const filter = {};
    if (version) filter.version = { _like: version };
    if (state) filter.state = { _eq: state };

    const result = await this.getAllPriceConfigs(
      {
        sort: "-date_created",
        limit,
        offset,
        ...(Object.keys(filter).length > 0 ? { filter } : {}),
      },
      { operation: "getPriceHistory", ...context },
    );

    if (!result.success || !Array.isArray(result.data)) {
      return result;
    }

    // 為每筆記錄附加人類可讀的時間標籤，方便前端直接顯示
    const history = result.data.map((item, index) => ({
      ...item,
      _historyIndex: offset + index + 1,
      _createdLabel: item.date_created
        ? new Date(item.date_created).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })
        : null,
      _updatedLabel: item.date_updated
        ? new Date(item.date_updated).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })
        : null,
    }));

    return {
      success: true,
      data: history,
      meta: result.meta,
      message: `共取得 ${history.length} 筆歷史記錄`,
    };
  }

  /**
   * 獲取最新版本的 PriceConfig
   * @param {Object} context - 上下文信息
   */
  async getLatestPriceConfig(context = {}) {
    return await this.getAllPriceConfigs(
      { sort: "-id", limit: 1 },
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
        filter: { state: "active" },
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
    return await this.getAllPriceConfigs(
      { filter: { version: { _like: keyword } } },
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
      return { success: true, data: [], message: "沒有提供 ID" };
    }

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
      message: failed.length > 0 ? `部分請求失敗: ${failed.length} 個` : undefined,
    };
  }

  // ========== 版本管理 ==========

  /**
   * 獲取所有版本列表 (去重)
   * @param {Object} context - 上下文信息
   */
  async getAllVersions(context = {}) {
    const result = await this.getAllPriceConfigs(
      { sort: "-id", limit: 1000 },
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

  getCurrentMode() {
    return this.base.mode;
  }

  setMode(mode) {
    console.warn(`⚠️🦀 [Rust] 服務不支持切換模式，當前固定為 rust 模式`);
    return "rust";
  }
}

export const rustPriceConfigService = new RustPriceConfigService();