// src/services/mydataService.js
import { commonService, getApiUrl } from "../services/urlService.js";

export class MydataService {
  constructor() {
    console.log(`MydataService 初始化: 當前模式為 ${commonService.mode}`);
  }

  // ========== 通用方法 ==========
  async getAuthHeaders() {
    const token = sessionStorage.getItem("auth-token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async handleDirectusResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Directus 錯誤: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  }

  // ========== CRUD 操作 ==========
  async getAllMydata(params = {}) {
    if (commonService.mode !== "directus") {
      console.warn("⚠️ 當前模式不是 directus，無法獲取數據");
      return { success: false, message: "請切換到 directus 模式" };
    }

    try {
      // 構建查詢參數
      const queryParams = new URLSearchParams();

      // 添加 fields 參數來指定返回的字段
      queryParams.append("fields", "*,contact.*");

      // 添加篩選條件
      if (params.filter) {
        Object.keys(params.filter).forEach((key) => {
          queryParams.append(`filter[${key}]`, params.filter[key]);
        });
      }

      // 添加排序
      if (params.sort) {
        queryParams.append("sort", params.sort);
      }

      // 添加分頁
      if (params.limit) {
        queryParams.append("limit", params.limit);
      }
      if (params.offset) {
        queryParams.append("offset", params.offset);
      }

      const response = await fetch(
        `${getApiUrl(
          commonService.apiEndpoints.itemsMydata
        )}?${queryParams.toString()}`,
        {
          method: "GET",
          headers: await this.getAuthHeaders(),
        }
      );

      const data = await this.handleDirectusResponse(response);

      return {
        success: true,
        data: data,
        message: "成功獲取 Mydata 數據",
      };
    } catch (error) {
      console.error("獲取 Mydata 數據失敗:", error);
      return this.handleDirectusError(error);
    }
  }

  async getMydataById(id) {
    if (commonService.mode !== "directus") {
      console.warn("⚠️ 當前模式不是 directus，無法獲取數據");
      return { success: false, message: "請切換到 directus 模式" };
    }

    try {
      const response = await fetch(
        `${getApiUrl(
          commonService.apiEndpoints.itemsMydata
        )}/${id}?fields=*,contact.*`,
        {
          method: "GET",
          headers: await this.getAuthHeaders(),
        }
      );

      const data = await this.handleDirectusResponse(response);

      return {
        success: true,
        data: data,
        message: "成功獲取 Mydata 項目",
      };
    } catch (error) {
      console.error(`獲取 Mydata 項目 (ID: ${id}) 失敗:`, error);
      return this.handleDirectusError(error);
    }
  }

  async createMydata(mydataData) {
    if (commonService.mode !== "directus") {
      console.warn("⚠️ 當前模式不是 directus，無法創建數據");
      return { success: false, message: "請切換到 directus 模式" };
    }

    try {
      // 驗證必要字段
      if (!mydataData.formName) {
        return {
          success: false,
          message: "formName 是必填字段",
        };
      }

      // 確保 contact 字段格式正確
      const processedData = {
        ...mydataData,
        contact: mydataData.contact || {
          name: "",
          phone: "",
          mobile: "",
          relationship: "",
          otherRelationship: "",
        },
        state: mydataData.state || "draft",
      };

      const response = await fetch(
        getApiUrl(commonService.apiEndpoints.itemsMydata),
        {
          method: "POST",
          headers: await this.getAuthHeaders(),
          body: JSON.stringify(processedData),
        }
      );

      const data = await this.handleDirectusResponse(response);

      return {
        success: true,
        data: data,
        message: "成功創建 Mydata 項目",
      };
    } catch (error) {
      console.error("創建 Mydata 項目失敗:", error);
      return this.handleDirectusError(error);
    }
  }

  async updateMydata(id, mydataData) {
    if (commonService.mode !== "directus") {
      console.warn("⚠️ 當前模式不是 directus，無法更新數據");
      return { success: false, message: "請切換到 directus 模式" };
    }

    try {
      const response = await fetch(
        `${getApiUrl(commonService.apiEndpoints.itemsMydata)}/${id}`,
        {
          method: "PATCH",
          headers: await this.getAuthHeaders(),
          body: JSON.stringify(mydataData),
        }
      );

      const data = await this.handleDirectusResponse(response);

      return {
        success: true,
        data: data,
        message: "成功更新 Mydata 項目",
      };
    } catch (error) {
      console.error(`更新 Mydata 項目 (ID: ${id}) 失敗:`, error);
      return this.handleDirectusError(error);
    }
  }

  async deleteMydata(id) {
    if (commonService.mode !== "directus") {
      console.warn("⚠️ 當前模式不是 directus，無法刪除數據");
      return { success: false, message: "請切換到 directus 模式" };
    }

    try {
      const response = await fetch(
        `${getApiUrl(commonService.apiEndpoints.itemsMydata)}/${id}`,
        {
          method: "DELETE",
          headers: await this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Directus 錯誤: ${response.status}`
        );
      }

      return {
        success: true,
        message: "成功刪除 Mydata 項目",
      };
    } catch (error) {
      console.error(`刪除 Mydata 項目 (ID: ${id}) 失敗:`, error);
      return this.handleDirectusError(error);
    }
  }

  // ========== 高級查詢方法 ==========
  async getMydataByFormName(formName) {
    return this.getAllMydata({
      filter: {
        formName: { _eq: formName },
      },
    });
  }

  async getMydataByState(state) {
    return this.getAllMydata({
      filter: {
        state: { _eq: state },
      },
    });
  }

  async searchMydata(keyword) {
    return this.getAllMydata({
      filter: {
        _or: [
          { formName: { _icontains: keyword } },
          { "contact.name": { _icontains: keyword } },
        ],
      },
    });
  }

  // ========== 錯誤處理 ==========
  handleDirectusError(error) {
    // 檢查網路錯誤
    if (
      error.message.includes("Failed to fetch") ||
      error.message.includes("NetworkError")
    ) {
      return {
        success: false,
        message: "Directus 服務未啟動或網路連接失敗",
        errorCode: "DIRECTUS_NOT_AVAILABLE",
        details: "請確保 Directus 服務正在運行",
      };
    }

    // 檢查認證錯誤
    if (error.message.includes("401") || error.message.includes("token")) {
      return {
        success: false,
        message: "認證失敗，請重新登入",
        errorCode: "UNAUTHORIZED",
        details: error.message,
      };
    }

    // 檢查權限錯誤
    if (error.message.includes("403")) {
      return {
        success: false,
        message: "沒有操作權限",
        errorCode: "FORBIDDEN",
        details: error.message,
      };
    }

    return {
      success: false,
      message: "Directus 操作失敗",
      errorCode: "DIRECTUS_ERROR",
      details: error.message,
    };
  }

  // ========== 健康檢查 ==========
  async checkDirectusHealth() {
    try {
      const response = await fetch(`${getApiUrl(commonService.apiEndpoints.serverInfo)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          available: true,
          status: response.status,
          data: {
            directusVersion: data.data?.version,
            nodeVersion: data.data?.node,
            os: data.data?.os,
          },
        };
      } else {
        return {
          available: false,
          status: response.status,
          statusText: response.statusText,
        };
      }
    } catch (error) {
      return {
        available: false,
        error: error.message,
      };
    }
  }

  // ========== 模式管理 ==========
  getCurrentMode() {
    return commonService.mode;
  }

  setMode(mode) {
    if (["mock", "backend", "directus"].includes(mode)) {
      commonService.mode = mode;
      console.log(`MydataService 模式已切換為: ${mode}`);

      // 健康檢查
      if (mode === "directus") {
        this.checkDirectusHealth().then((health) => {
          if (!health.available) {
            console.warn("⚠️ Directus 服務可能未啟動:", health);
          } else {
            console.log("✅ Directus 服務正常", health.data);
          }
        });
      }
    } else {
      console.warn('無效的模式，請使用 "mock", "backend" 或 "directus"');
    }
  }
}

export const mydataService = new MydataService();
