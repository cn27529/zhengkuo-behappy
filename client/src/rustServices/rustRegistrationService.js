// src/rustServices/rustActivityService.js
import { baseRustService } from "./baseRustService.js";
import { DateUtils } from "../utils/dateUtils.js";

export class RustRegistrationService {
  constructor() {
    this.serviceName = "RustRegistrationService";
    this.base = baseRustService;
    this.endpoint = this.base.endpoints.registrations;
    console.log(`RustRegistrationService 初始化: 當前模式為 ${this.base.mode}`);
  }

  /**
   * 創建報名登記（與 Directus 接口兼容）
   */
  async createRegistration(registrationData, context = {}) {
    const processedData = {
      ...registrationData,
      createdAt: DateUtils.getCurrentISOTime(),
    };

    return await this.base.rustFetch(
      this.endpoint,
      {
        method: "POST",
        body: JSON.stringify(processedData),
      },
      {
        service: this.serviceName,
        operation: "createRegistration",
        ...context,
      },
    );
  }

  /**
   * 獲取所有報名登記（支持分頁、過濾、排序）
   */
  async getAllRegistrations(params = {}, context = {}) {
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
        operation: "getAllRegistrations",
        ...context,
      },
    );
  }

  /**
   * 獲取單個報名登記
   */
  async getRegistrationById(id, context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/${id}`,
      {
        method: "GET",
      },
      {
        operation: "getRegistrationById",
        id,
        ...context,
      },
    );
  }

  /**
   * 更新報名登記
   */
  async updateRegistration(id, registrationData, context = {}) {
    const updateData = {
      ...registrationData,
      updatedAt: DateUtils.getCurrentISOTime(),
      updatedUser: authService.getCurrentUser(),
    };

    return await this.base.rustFetch(
      `${this.endpoint}/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(updateData),
      },
      {
        service: this.serviceName,
        operation: "updateRegistration",
        id,
        ...context,
      },
    );
  }

  /**
   * 刪除報名登記
   */
  async deleteRegistration(id, context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/${id}`,
      {
        method: "DELETE",
      },
      {
        service: this.serviceName,
        operation: "deleteRegistration",
        id,
        ...context,
      },
    );
  }

  // 根據報名表 formId 查詢報名表
  async getRegistrationsByFormId(formId, context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/by-form-id/${formId}`,
      {
        method: "GET",
      },
      {
        operation: "getRegistrationsByFormId",
        formId,
        ...context,
      },
    );
  }

  // 根據狀態查詢報名表
  async getRegistrationsByState(state, context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/by-state/${state}`,
      {
        method: "GET",
      },
      {
        operation: "getRegistrationsByState",
        state,
        ...context,
      },
    );
  }

  // 根據用戶 ID 查詢報名表
  async getRegistrationsByUser(userId, context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/by-user/${userId}`,
      {
        method: "GET",
      },
      {
        operation: "getRegistrationsByUser",
        userId,
        ...context,
      },
    );
  }

  // 變更報名表狀態
  async submitRegistration(id, context = {}) {
    const updateData = {
      state: "submitted",
      updatedAt: DateUtils.getCurrentISOTime(),
    };

    return this.updateRegistration(
      id,
      {
        ...updateData,
      },
      {
        service: this.serviceName,
        operation: "submitRegistration",
        id,
        ...context,
      },
    );
  }

  // 變更報名表狀態
  async completeRegistration(id, context = {}) {
    const updateData = {
      state: "completed",
      updatedAt: DateUtils.getCurrentISOTime(),
    };

    return this.updateRegistration(
      id,
      {
        ...updateData,
      },
      {
        service: this.serviceName,
        operation: "completeRegistration",
        id,
        ...context,
      },
    );
  }

  async saveDraft(id, registrationData, context = {}) {
    const updateData = {
      ...registrationData,
      state: "saved",
      updatedAt: DateUtils.getCurrentISOTime(),
    };

    return this.updateRegistration(
      id,
      {
        ...updateData,
      },
      {
        service: this.serviceName,
        operation: "saveDraft",
        id,
        ...context,
      },
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
      },
    );
  }

  /**
   * 搜索報名登記（全文搜索）
   */
  async searchRegistrations(query, options = {}, context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/search`,
      {
        method: "POST",
        body: JSON.stringify({ query, ...options }),
      },
      {
        operation: "searchRegistrations",
        query,
        ...context,
      },
    );
  }

  /**
   * 導出數據
   */
  async exportRegistrations(format = "csv", params = {}, context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/export?format=${format}&${new URLSearchParams(params)}`,
      {
        method: "GET",
      },
      {
        operation: "exportRegistrations",
        format,
        ...context,
      },
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
    console.warn(`⚠️🦀 [Rust] 服務不支持切換模式，當前固定為 rust 模式`);
    return "rust";
  }

  // ========== 錯誤處理 ==========

  /**
   * Rust 特定的錯誤處理
   */
  handleRegistrationError(error) {
    return this.base.handleRustError(error);
  }
}

export const rustRegistrationService = new RustRegistrationService();
