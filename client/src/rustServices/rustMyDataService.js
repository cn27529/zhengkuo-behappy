// src/rustServices/rustMyDataService.js
import { baseRustService } from "./baseRustService.js";

export class RustMyDataService {
  constructor() {
    this.serviceName = "RustMyDataService";
    this.base = baseRustService;
    this.endpoint = this.base.endpoints.myData || "my-data";
    console.log(`RustMyDataService 初始化: 當前模式為 ${this.base.mode}`);
  }

  // ========== CRUD 操作 ==========

  /**
   * 獲取所有 MyData
   */
  async getAllMydata(params = {}, context = {}) {
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
        operation: "getAllMydata",
        ...context,
      },
    );
  }

  /**
   * 根據 ID 獲取單筆 MyData
   */
  async getMydataById(id, context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/${id}`,
      {
        method: "GET",
      },
      {
        operation: "getMydataById",
        id,
        ...context,
      },
    );
  }

  /**
   * 創建新的 MyData
   */
  async createMydata(mydataData, additionalContext = {}) {
    const processedData = {
      ...mydataData,
      state: mydataData.state || "draft",
    };

    const startTime = Date.now();
    const logContext = {
      service: this.serviceName,
      operation: "createMydata",
      method: "POST",
      startTime: startTime,
      endpoint: this.endpoint,
      requestBody: processedData,
      ...additionalContext,
    };

    if (this.base.getIsMock()) {
      console.warn("⚠️ 當前模式不為 Rust，MyData 創建成功");
      return {
        success: true,
        data: processedData,
        message: "Mock 模式：MyData 創建成功",
      };
    }

    try {
      console.log("🦀 [Rust] 創建 MyData:", processedData);
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
      console.error("❌ 創建 MyData 失敗:", error);
      throw error;
    }
  }

  /**
   * 更新 MyData
   */
  async updateMydata(id, mydataData, context = {}) {
    const updateData = {
      ...mydataData,
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
        operation: "updateMydata",
        id,
        ...context,
      },
    );
  }

  /**
   * 刪除 MyData
   */
  async deleteMydata(id, context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/${id}`,
      {
        method: "DELETE",
      },
      {
        service: this.serviceName,
        operation: "deleteMydata",
        id,
        ...context,
      },
    );
  }

  // ========== 高級查詢方法 ==========

  /**
   * 根據 formName 獲取 MyData
   */
  async getMydataByFormName(formName, context = {}) {
    return await this.getAllMydata(
      {
        filter: {
          formName: { _eq: formName },
        },
      },
      context,
    );
  }

  /**
   * 根據 state 獲取 MyData
   */
  async getMydataByState(state, context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/by-state/${state}`,
      {
        method: "GET",
      },
      {
        operation: "getMydataByState",
        state,
        ...context,
      },
    );
  }

  /**
   * 搜索 MyData
   */
  async searchMydata(keyword, context = {}) {
    return await this.getAllMydata(
      {
        filter: {
          formName: keyword,
        },
      },
      context,
    );
  }

  // ========== 錯誤處理 ==========

  /**
   * Rust 特定的錯誤處理
   */
  handleMydataError(error) {
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
   */
  setMode(mode) {
    console.warn(`⚠️🦀 [Rust] 服務不支持切換模式，當前固定為 rust 模式`);
    return "rust";
  }
}

export const rustMyDataService = new RustMyDataService();
