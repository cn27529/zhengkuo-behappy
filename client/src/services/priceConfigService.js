// src/services/priceConfigService.js
import { baseService } from "./baseService.js";
import { DateUtils } from "../utils/dateUtils.js";
import { authService } from "./authService.js";

export class PriceConfigService {
  // ========== 建構函式 ==========
  constructor() {
    this.serviceName = "PriceConfigService";
    this.base = baseService;
    this.endpoint = `${this.base.apiBaseUrl}${this.base.apiEndpoints.itemsPriceConfig}`;
    console.log(`PriceConfigService 初始化: 當前模式為 ${this.base.mode}`);
  }

  // ========== CRUD 操作 ==========

  /**
   * 創建新的價格配置
   * @param {Object} priceConfigData - 價格配置資料
   * @returns {Promise<Object>} 創建結果
   */
  async createPriceConfig(priceConfigData) {
    const createISOTime = DateUtils.getCurrentISOTime();

    if (this.base.getIsMock()) {
      console.warn("價格配置創建成功！⚠️ 當前模式不是 directus，無法創建數據");
      return {
        success: true,
        message: "價格配置創建成功！⚠️ 當前模式不是 directus，無法創建數據",
        data: {
          id: crypto.randomUUID(),
          ...priceConfigData,
          createdAt: createISOTime,
        },
      };
    }

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

      // 準備提交數據
      const processedData = {
        version: priceConfigData.version || "v1",
        state: priceConfigData.state || "history",
        prices: priceConfigData.prices || {},
        notes: priceConfigData.notes || "",
        enableDate: priceConfigData.enableDate || createISOTime,
        createdAt: createISOTime,
        createdUser: authService.getCurrentUser(),
        ...(priceConfigData.user_created && {
          user_created: priceConfigData.user_created,
        }),
      };

      const startTime = Date.now();
      const myHeaders = await this.base.getAuthJsonHeaders();
      const apiUrl = `${this.endpoint}`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: myHeaders,
        body: JSON.stringify(processedData),
      });

      const logContext = {
        service: this.serviceName,
        operation: "createPriceConfig",
        method: "POST",
        startTime: startTime,
        endpoint: `${this.endpoint}`,
        requestBody: processedData,
      };

      const duration = Date.now() - startTime;
      const result = await this.base.handleDirectusResponse(
        response,
        "成功創建價格配置",
        { ...logContext, duration },
      );

      return result;
    } catch (error) {
      console.error("創建價格配置失敗:", error);
      return this.handlePriceConfigError(error);
    }
  }

  /**
   * 更新價格配置
   * @param {number|string} recordId - 配置記錄 ID
   * @param {Object} priceConfigData - 價格配置資料
   * @returns {Promise<Object>} 更新結果
   */
  async updatePriceConfig(recordId, priceConfigData) {
    if (this.base.getIsMock()) {
      console.warn("⚠️ 當前模式不是 directus，無法更新數據");
      return {
        success: false,
        message: "⚠️ 當前模式不是 directus，無法更新數據",
      };
    }

    try {
      const processedData = {
        ...priceConfigData,
        updatedAt: DateUtils.getCurrentISOTime(),
        updatedUser: authService.getCurrentUser(),
      };

      const startTime = Date.now();
      const myHeaders = await this.base.getAuthJsonHeaders();
      const apiUrl = `${this.endpoint}/${recordId}`;
      const response = await fetch(apiUrl, {
        method: "PATCH",
        headers: myHeaders,
        body: JSON.stringify(processedData),
      });

      const logContext = {
        service: this.serviceName,
        operation: "updatePriceConfig",
        method: "PATCH",
        startTime: startTime,
        endpoint: `${this.endpoint}/${recordId}`,
        requestBody: processedData,
      };

      const duration = Date.now() - startTime;
      const result = await this.base.handleDirectusResponse(
        response,
        "成功更新價格配置",
        { ...logContext, duration },
      );

      return result;
    } catch (error) {
      console.error(`❌ 更新價格配置失敗 (ID: ${recordId})`, error);
      return this.handlePriceConfigError(error);
    }
  }

  /**
   * 刪除價格配置
   * @param {number|string} recordId - 配置記錄 ID
   * @returns {Promise<Object>} 刪除結果
   */
  async deletePriceConfig(recordId) {
    if (this.base.getIsMock()) {
      console.warn("⚠️ 當前模式不是 directus，無法刪除數據");
      return {
        success: false,
        message: "⚠️ 當前模式不是 directus，無法刪除數據",
      };
    }

    try {
      const currentConfig = await this.getPriceConfigById(recordId);
      if (!currentConfig) {
        return {
          success: false,
          message: `找不到 ID 為 ${recordId} 的價格配置`,
          data: null,
        };
      }

      console.log("服務器返回的價格配置數據:", currentConfig);

      let processedData = null;
      if (currentConfig.success && currentConfig.data) {
        const configData = currentConfig.data;
        processedData = {
          ...configData,
          deletedAt: DateUtils.getCurrentISOTime(),
          deletedUser: authService.getCurrentUser(),
        };
      }

      const startTime = Date.now();
      const myHeaders = await this.base.getAuthJsonHeaders();
      const apiUrl = `${this.endpoint}/${recordId}`;
      const response = await fetch(apiUrl, {
        method: "DELETE",
        headers: myHeaders,
      });

      const logContext = {
        service: this.serviceName,
        operation: "deletePriceConfig",
        method: "DELETE",
        startTime: startTime,
        endpoint: `${this.endpoint}/${recordId}`,
        requestBody: processedData,
      };

      const duration = Date.now() - startTime;
      const result = await this.base.handleDirectusResponse(
        response,
        "成功刪除價格配置",
        { ...logContext, duration },
      );

      return result;
    } catch (error) {
      console.error(`❌ 刪除價格配置失敗 (ID: ${recordId})`, error);
      return this.handlePriceConfigError(error);
    }
  }

  /**
   * 根據 ID 獲取價格配置
   * @param {number|string} recordId - 配置記錄 ID
   * @returns {Promise<Object>} 價格配置資料
   */
  async getPriceConfigById(recordId) {
    if (this.base.getIsMock()) {
      console.warn("⚠️ 當前模式不是 directus，無法獲取數據");
      return {
        success: false,
        message: "⚠️ 當前模式不是 directus，無法獲取數據",
      };
    }

    try {
      const startTime = Date.now();
      const myHeaders = await this.base.getAuthJsonHeaders();
      const apiUrl = `${this.endpoint}/${recordId}?fields=*`;
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: myHeaders,
      });

      const result = await this.base.handleDirectusResponse(
        response,
        "成功獲取價格配置",
      );

      return result;
    } catch (error) {
      console.error(`獲取價格配置 (ID: ${recordId}) 失敗:`, error);
      return this.handlePriceConfigError(error);
    }
  }

  /**
   * 獲取所有價格配置
   * @param {Object} params - 查詢參數（過濾、排序等）
   * @returns {Promise<Object>} 價格配置列表
   */
  async getAllPriceConfigs(params = {}) {
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
          const filterValue = params.filter[key];
          if (typeof filterValue === "object") {
            Object.keys(filterValue).forEach((operator) => {
              queryParams.append(
                `filter[${key}][${operator}]`,
                filterValue[operator],
              );
            });
          } else {
            queryParams.append(`filter[${key}]`, filterValue);
          }
        });
      }

      // 添加排序
      if (params.sort) {
        queryParams.append("sort", params.sort);
      } else {
        queryParams.append("sort", "-createdAt"); // 預設按創建時間降序
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
        "成功獲取所有價格配置",
      );
      return result;
    } catch (error) {
      console.error("❌ 獲取價格配置列表失敗:", error);
      return this.handlePriceConfigError(error);
    }
  }

  // ========== 查詢方法 ==========

  /**
   * 根據版本獲取價格配置
   * @param {string} version - 版本號
   * @returns {Promise<Object>} 價格配置資料
   */
  async getPriceConfigByVersion(version) {
    return this.getAllPriceConfigs({
      filter: {
        version: { _eq: version },
      },
    });
  }

  /**
   * 根據狀態獲取價格配置
   * @param {string} state - 狀態（history/now）
   * @returns {Promise<Object>} 價格配置列表
   */
  async getPriceConfigsByState(state) {
    return this.getAllPriceConfigs({
      filter: {
        state: { _eq: state },
      },
      sort: "-enableDate", // 按啟用日期降序排列
    });
  }

  /**
   * 獲取當前生效的價格配置
   * @returns {Promise<Object>} 當前價格配置
   */
  async getCurrentPriceConfig() {
    const result = await this.getAllPriceConfigs({
      filter: {
        state: { _eq: "now" },
      },
      limit: 1,
    });

    if (result.success && result.data && result.data.length > 0) {
      return {
        success: true,
        data: result.data[0],
        message: "成功獲取當前價格配置",
      };
    }

    return {
      success: false,
      data: null,
      message: "找不到當前生效的價格配置",
    };
  }

  /**
   * 獲取歷史價格配置
   * @returns {Promise<Object>} 歷史價格配置列表
   */
  async getHistoryPriceConfigs() {
    return this.getPriceConfigsByState("history");
  }

  /**
   * 獲取指定日期生效的價格配置
   * @param {string} date - 日期（ISO 格式）
   * @returns {Promise<Object>} 價格配置資料
   */
  async getPriceConfigByDate(date) {
    const result = await this.getAllPriceConfigs({
      filter: {
        enableDate: { _lte: date },
        state: { _neq: "disabled" },
      },
      sort: "-enableDate",
      limit: 1,
    });

    if (result.success && result.data && result.data.length > 0) {
      return {
        success: true,
        data: result.data[0],
        message: "成功獲取指定日期的價格配置",
      };
    }

    return {
      success: false,
      data: null,
      message: `找不到 ${date} 生效的價格配置`,
    };
  }

  /**
   * 獲取特定價格項目的歷史價格
   * @param {string} priceKey - 價格項目標識（如 chaodu, diandeng 等）
   * @returns {Promise<Object>} 價格歷史記錄
   */
  async getPriceHistory(priceKey) {
    const result = await this.getAllPriceConfigs({
      filter: {
        state: { _in: ["history", "now"] },
      },
      sort: "enableDate",
    });

    if (!result.success || !result.data) {
      return {
        success: false,
        data: null,
        message: "獲取價格歷史失敗",
      };
    }

    const history = result.data
      .map((config) => ({
        version: config.version,
        price: config.prices?.[priceKey] || null,
        enableDate: config.enableDate,
        notes: config.notes,
      }))
      .filter((item) => item.price !== null);

    return {
      success: true,
      data: history,
      message: "成功獲取價格歷史",
    };
  }

  // ========== 價格計算方法 ==========

  /**
   * 計算指定項目的價格
   * @param {string} priceKey - 價格項目標識
   * @param {string} date - 計算日期（可選，預設為當前日期）
   * @returns {Promise<Object>} 價格計算結果
   */
  async getPrice(priceKey, date = DateUtils.getCurrentISOTime()) {
    const configResult = await this.getPriceConfigByDate(date);

    if (!configResult.success || !configResult.data) {
      return {
        success: false,
        price: null,
        message: configResult.message || "找不到適用的價格配置",
      };
    }

    const price = configResult.data.prices?.[priceKey];

    if (price === undefined || price === null) {
      return {
        success: false,
        price: null,
        message: `找不到價格項目: ${priceKey}`,
      };
    }

    return {
      success: true,
      price: price,
      config: configResult.data,
      message: "成功獲取價格",
    };
  }

  /**
   * 批量獲取多個項目的價格
   * @param {Array<string>} priceKeys - 價格項目標識列表
   * @param {string} date - 計算日期（可選）
   * @returns {Promise<Object>} 價格列表
   */
  async getPrices(priceKeys, date = DateUtils.getCurrentISOTime()) {
    const configResult = await this.getPriceConfigByDate(date);

    if (!configResult.success || !configResult.data) {
      return {
        success: false,
        prices: {},
        message: configResult.message || "找不到適用的價格配置",
      };
    }

    const prices = {};
    const missingKeys = [];

    priceKeys.forEach((key) => {
      if (configResult.data.prices?.[key] !== undefined) {
        prices[key] = configResult.data.prices[key];
      } else {
        missingKeys.push(key);
      }
    });

    return {
      success: true,
      prices: prices,
      missingKeys: missingKeys,
      config: configResult.data,
      message:
        missingKeys.length > 0
          ? `成功獲取 ${Object.keys(prices).length} 個價格，缺失: ${missingKeys.join(", ")}`
          : "成功獲取所有價格",
    };
  }

  /**
   * 獲取完整的價格配置（包含所有項目）
   * @param {string} date - 日期（可選）
   * @returns {Promise<Object>} 完整價格配置
   */
  async getFullPriceConfig(date = DateUtils.getCurrentISOTime()) {
    const configResult = await this.getPriceConfigByDate(date);

    if (!configResult.success || !configResult.data) {
      return {
        success: false,
        data: null,
        message: configResult.message || "找不到適用的價格配置",
      };
    }

    return {
      success: true,
      data: configResult.data,
      prices: configResult.data.prices,
      message: "成功獲取完整價格配置",
    };
  }

  // ========== 版本管理 ==========

  /**
   * 啟用新的價格配置
   * @param {Object} priceConfigData - 新價格配置資料
   * @returns {Promise<Object>} 創建結果
   */
  async activateNewPriceConfig(priceConfigData) {
    // 先將現有的 "now" 狀態配置改為 "history"
    const currentConfig = await this.getCurrentPriceConfig();

    if (currentConfig.success && currentConfig.data) {
      await this.updatePriceConfig(currentConfig.data.id, {
        state: "history",
        updatedAt: DateUtils.getCurrentISOTime(),
      });
    }

    // 創建新的 "now" 狀態配置
    const newConfigData = {
      ...priceConfigData,
      state: "now",
      enableDate: DateUtils.getCurrentISOTime(),
    };

    return this.createPriceConfig(newConfigData);
  }

  /**
   * 比較兩個版本的價格差異
   * @param {number|string} versionId1 - 版本1 ID
   * @param {number|string} versionId2 - 版本2 ID
   * @returns {Promise<Object>} 價格差異比較結果
   */
  async comparePriceVersions(versionId1, versionId2) {
    const [version1Result, version2Result] = await Promise.all([
      this.getPriceConfigById(versionId1),
      this.getPriceConfigById(versionId2),
    ]);

    if (!version1Result.success || !version2Result.success) {
      return {
        success: false,
        message: "無法獲取指定版本的價格配置",
      };
    }

    const prices1 = version1Result.data.prices || {};
    const prices2 = version2Result.data.prices || {};

    const differences = {};
    const allKeys = new Set([...Object.keys(prices1), ...Object.keys(prices2)]);

    allKeys.forEach((key) => {
      const price1 = prices1[key];
      const price2 = prices2[key];

      if (price1 !== price2) {
        differences[key] = {
          old: price1 || null,
          new: price2 || null,
          change: price1 && price2 ? price2 - price1 : null,
          changePercent:
            price1 && price2
              ? (((price2 - price1) / price1) * 100).toFixed(2)
              : null,
        };
      }
    });

    return {
      success: true,
      data: {
        version1: version1Result.data,
        version2: version2Result.data,
        differences: differences,
      },
      message: "成功比較版本差異",
    };
  }

  // ========== 錯誤處理 ==========
  handlePriceConfigError(error) {
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

export const priceConfigService = new PriceConfigService();
