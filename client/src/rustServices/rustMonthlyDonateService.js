// src/rustServices/rustMonthlyDonateService.js
import { baseRustService } from "./baseRustService.js";
import { DateUtils } from "../utils/dateUtils.js";
import { generateGitHashBrowser } from "../utils/generateGitHash.js";

export class RustMonthlyDonateService {
  // ========== 建構函式 ==========
  constructor() {
    this.serviceName = "RustMonthlyDonateService";
    this.base = baseRustService;
    this.endpoint = this.base.endpoints.monthlyDonates || "monthly-donates";
    console.log(
      `RustMonthlyDonateService 初始化: 當前模式為 ${this.base.mode}`,
    );
  }

  // ========== 核心 CRUD 方法 ==========

  /**
   * 創建新的百元贊助人
   */
  async createMonthlyDonate(donateData, additionalContext = {}) {
    // ✅ 在 try 外面定義，確保 catch 也能訪問
    const createISOTime = DateUtils.getCurrentISOTime();
    const donateId = await generateGitHashBrowser(createISOTime);

    const processedData = {
      ...donateData,
      donateId: donateId,
      createdAt: createISOTime,
    };

    const startTime = Date.now();
    const logContext = {
      service: this.serviceName,
      operation: "createMonthlyDonate",
      method: "POST",
      startTime: startTime,
      endpoint: this.endpoint,
      requestBody: processedData, // ✅ 記錄請求 body
      ...additionalContext,
    };

    if (this.base.getIsMock()) {
      // Mock 模式
      console.warn("⚠️ 當前模式不為 Rust，百元贊助人創建成功");
      return {
        success: true,
        data: processedData,
        message: "Mock 模式：百元贊助人創建成功",
      };
    }

    try {
      console.log("🦀 [Rust] 創建百元贊助人:", processedData);
      const result = await this.base.rustFetch(
        this.endpoint,
        {
          method: "POST",
          body: JSON.stringify(processedData),
        },
        logContext, // ✅ 傳入完整的 context
      );

      return result;
    } catch (error) {
      console.error("❌ 創建百元贊助人失敗:", error);
    }
  }

  /**
   * 更新百元贊助人
   */
  async updateMonthlyDonate(recordId, donateData, context = {}) {
    const updateData = {
      ...donateData,
      updatedAt: DateUtils.getCurrentISOTime(),
      user_updated: context.user_updated || "system",
    };

    return await this.base.rustFetch(
      `${this.endpoint}/${recordId}`,
      {
        method: "PATCH",
        body: JSON.stringify(updateData),
      },
      {
        service: this.serviceName,
        operation: "updateMonthlyDonate",
        id: recordId,
        ...context,
      },
    );
  }

  /**
   * 刪除百元贊助人
   */
  async deleteMonthlyDonate(recordId, context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/${recordId}`,
      {
        method: "DELETE",
      },
      {
        service: this.serviceName,
        operation: "deleteMonthlyDonate",
        id: recordId,
        ...context,
      },
    );
  }

  /**
   * 獲取所有百元贊助記錄
   */
  async getAllMonthlyDonates(params = {}, context = {}) {
    const queryParams = new URLSearchParams();

    // 轉換 Directus 風格的參數到 Rust 風格
    if (params.sort) {
      queryParams.append("sort", params.sort);
    }

    if (params.limit) {
      queryParams.append("limit", params.limit);
    }

    if (params.offset) {
      queryParams.append("offset", params.offset);
    }

    // 處理篩選條件
    if (params.filter) {
      Object.entries(params.filter).forEach(([key, value]) => {
        if (typeof value === "object") {
          if (value._eq) {
            queryParams.append(key, value._eq);
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
        operation: "getAllMonthlyDonates",
        ...context,
      },
    );
  }

  /**
   * 根據 ID 獲取單筆百元贊助人
   */
  async getMonthlyDonateById(recordId, context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/${recordId}`,
      {
        method: "GET",
      },
      {
        //service: this.serviceName,
        operation: "getMonthlyDonateById",
        id: recordId,
        ...context,
      },
    );
  }

  /**
   * 根據 donateId 獲取百元贊助人
   */
  async getMonthlyDonateByDonateId(donateId, context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/by-donate-id/${donateId}`,
      {
        method: "GET",
      },
      {
        //service: this.serviceName,
        operation: "getMonthlyDonateByDonateId",
        donateId,
        ...context,
      },
    );
  }

  /**
   * 根據 registrationId 獲取百元贊助人
   */
  async getMonthlyDonateByRegistrationId(registrationId, context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/by-registration/${registrationId}`,
      {
        method: "GET",
      },
      {
        //service: this.serviceName,
        operation: "getMonthlyDonateByRegistrationId",
        registrationId,
        ...context,
      },
    );
  }

  /**
   * 根據 donateType 獲取百元贊助人
   */
  async getMonthlyDonatesByDonateType(donateType, context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/by-type/${donateType}`,
      {
        method: "GET",
      },
      {
        //service: this.serviceName,
        operation: "getMonthlyDonatesByDonateType",
        donateType,
        ...context,
      },
    );
  }

  // ========== donateItems 操作方法 ==========

  /**
   * 新增指定贊助記錄
   */
  async addDonateItem(donateId, itemData, context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/${donateId}/items`,
      {
        method: "POST",
        body: JSON.stringify(itemData),
      },
      {
        service: this.serviceName,
        operation: "addDonateItem",
        donateId,
        ...context,
      },
    );
  }

  /**
   * 更新指定贊助記錄
   */
  async updateDonateItem(recordId, donateItemsId, itemData, context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/${recordId}/items/${donateItemsId}`,
      {
        method: "PATCH",
        body: JSON.stringify(itemData),
      },
      {
        service: this.serviceName,
        operation: "updateDonateItem",
        recordId,
        donateItemsId,
        ...context,
      },
    );
  }

  /**
   * 刪除指定贊助記錄
   */
  async deleteDonateItem(recordId, itemsId, context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/${recordId}/items/${itemsId}`,
      {
        method: "DELETE",
      },
      {
        service: this.serviceName,
        operation: "deleteDonateItem",
        recordId,
        itemsId,
        ...context,
      },
    );
  }

  /**
   * 獲取月度統計
   */
  async getMonthlyDonateStats(context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/stats/monthly`,
      {
        method: "GET",
      },
      {
        //service: this.serviceName,
        operation: "getMonthlyDonateStats",
        ...context,
      },
    );
  }

  /**
   * 獲取捐贈統計
   */
  async getDonationStats(context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/stats/donation`,
      {
        method: "GET",
      },
      {
        //service: this.serviceName,
        operation: "getDonationStats",
        ...context,
      },
    );
  }

  /**
   * 生成 Mock 資料
   */
  generateMockData() {
    return {
      id: -1,
      name: "王小明",
      registrationId: -1,
      donateId: "mock_donate_id",
      donateType: "",
      donateItems: [],
      memo: "mock data",
      createdAt: "1911-11-11T08:00:00.000Z",
      createdUser: "mock user",
      updatedAt: "1911-11-11T08:00:00.000Z",
      updatedUser: "mock user",
    };
  }

  // ========== Rust 特有功能 ==========

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
        //service: this.serviceName,
        operation: "batchOperations",
        count: operations.length,
        ...context,
      },
    );
  }

  /**
   * 搜索贊助記錄（全文搜索）
   */
  async searchMonthlyDonates(query, options = {}, context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/search`,
      {
        method: "POST",
        body: JSON.stringify({ query, ...options }),
      },
      {
        //service: this.serviceName,
        operation: "searchMonthlyDonates",
        query,
        ...context,
      },
    );
  }

  /**
   * 導出贊助數據
   */
  async exportMonthlyDonates(format = "csv", params = {}, context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/export?format=${format}&${new URLSearchParams(params)}`,
      {
        method: "GET",
      },
      {
        //service: this.serviceName,
        operation: "exportMonthlyDonates",
        format,
        ...context,
      },
    );
  }

  /**
   * 獲取捐贈類型統計
   */
  async getDonationTypeStats(context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/stats/types`,
      {
        method: "GET",
      },
      {
        //service: this.serviceName,
        operation: "getDonationTypeStats",
        ...context,
      },
    );
  }

  /**
   * 獲取捐贈趨勢
   */
  async getDonationTrend(period = "month", context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/stats/trend/${period}`,
      {
        method: "GET",
      },
      {
        //service: this.serviceName,
        operation: "getDonationTrend",
        period,
        ...context,
      },
    );
  }

  // ========== 模式管理 ==========

  /**
   * 獲取當前模式
   */
  getCurrentMode() {
    //return "rust"; // Rust 服務總是 rust 模式
    return this.base.mode;
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
  handleMonthlyDonateError(error) {
    return this.base.handleRustError(error);
  }
}

export const rustMonthlyDonateService = new RustMonthlyDonateService();
