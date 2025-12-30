// src/rustServices/rustMonthlyDonateService.js
import { baseRustService } from "./baseRustService.js";
import { DateUtils } from "../utils/dateUtils.js";
import { generateGitHashBrowser } from "../utils/generateGitHash.js";

export class RustMonthlyDonateService {
  // ========== 建構函式 ==========
  constructor() {
    this.base = baseRustService;
    this.endpoint = this.base.endpoints.monthlyDonates || "monthly-donates";
  }

  // ========== 核心 CRUD 方法 ==========

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
      }
    );
  }

  /**
   * 創建新的百元贊助人
   */
  async createMonthlyDonate(donateData, context = {}) {
    const createISOTime = DateUtils.getCurrentISOTime();
    const donateId = await generateGitHashBrowser(createISOTime);
    
    const processedData = {
      ...donateData,
      donateId,
      createdAt: createISOTime,
    };

    if(this.base.mode !== 'rust') {
      // Mock 模式
      console.warn("⚠️ 當前模式不為 Rust，百元贊助人創建成功");
      return {
        success: true,
        data: processedData,
        message: "Mock 模式：百元贊助人創建成功",
      };
    }

    return await this.base.rustFetch(
      this.endpoint,
      {
        method: "POST",
        body: JSON.stringify(processedData),
      },
      {
        operation: "createMonthlyDonate",
        ...context,
      }
    );
  }

  /**
   * 更新百元贊助人
   */
  async updateMonthlyDonate(recordId, donateData, context = {}) {
    const updateData = {
      ...donateData,
      updatedAt: DateUtils.getCurrentISOTime(),
    };

    return await this.base.rustFetch(
      `${this.endpoint}/${recordId}`,
      {
        method: "PATCH",
        body: JSON.stringify(updateData),
      },
      {
        operation: "updateMonthlyDonate",
        id: recordId,
        ...context,
      }
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
        operation: "deleteMonthlyDonate",
        id: recordId,
        ...context,
      }
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
        operation: "getMonthlyDonateById",
        id: recordId,
        ...context,
      }
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
        operation: "getMonthlyDonateByDonateId",
        donateId,
        ...context,
      }
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
        operation: "getMonthlyDonateByRegistrationId",
        registrationId,
        ...context,
      }
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
        operation: "getMonthlyDonatesByDonateType",
        donateType,
        ...context,
      }
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
        operation: "addDonateItem",
        donateId,
        ...context,
      }
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
        operation: "updateDonateItem",
        recordId,
        donateItemsId,
        ...context,
      }
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
        operation: "deleteDonateItem",
        recordId,
        itemsId,
        ...context,
      }
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
        operation: "getMonthlyDonateStats",
        ...context,
      }
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
        operation: "getDonationStats",
        ...context,
      }
    );
  }

  /**
   * 獲取當前登錄用戶
   */
  async getCurrentUser() {
    try {
      const userInfo = sessionStorage.getItem("auth-user");
      if (userInfo) {
        const user = JSON.parse(userInfo);
        return user.id || user.username || user.displayName || "unknown";
      }
      return "anonymous";
    } catch (error) {
      console.error("獲取用戶信息失敗:", error);
      return "anonymous";
    }
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
        operation: "batchOperations",
        count: operations.length,
        ...context,
      }
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
        operation: "searchMonthlyDonates",
        query,
        ...context,
      }
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
        operation: "exportMonthlyDonates",
        format,
        ...context,
      }
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
        operation: "getDonationTypeStats",
        ...context,
      }
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
        operation: "getDonationTrend",
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
  handleDirectusError(error) {
    if (error.message.includes("NetworkError") || error.message.includes("Failed to fetch")) {
      return {
        success: false,
        message: "Rust 服務未啟動或網路連接失敗",
        errorCode: "RUST_NOT_AVAILABLE",
        details: "請確保 Rust 服務正在運行",
      };
    }

    if (error.message.includes("401") || error.message.includes("Unauthorized")) {
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

export const rustMonthlyDonateService = new RustMonthlyDonateService();