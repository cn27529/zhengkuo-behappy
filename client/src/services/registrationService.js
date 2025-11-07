// src/services/registrationService.js
import { serviceConfig, getApiUrl } from "@/config/serviceConfig.js";
import {
  generateGitHash,
  generateMultipleHashes,
} from "@/utils/generateGitHash.js";

export class RegistrationService {
  constructor() {
    console.log(`RegistrationService 初始化: 當前模式為 ${serviceConfig.mode}`);
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

  // ========== 生成表單 ID ==========
  generateFormId() {
    return generateGitHash();
  }

  // ========== CRUD 操作 ==========
  async createRegistration(registrationData) {
    if (serviceConfig.mode !== "directus") {
      console.warn(
        "報名提交成功！⚠️ 當前模式不是 directus，無法創建數據，請切換到 directus 模式"
      );
      return {
        success: true,
        message:
          "報名提交成功！⚠️ 當前模式不是 directus，無法創建數據，請切換到 directus 模式",
        data: {
          id: Date.now(),
          ...registrationData,
        },
      };
    }

    try {
      // 準備提交數據
      const processedData = {
        state: registrationData.state || "creating",
        createdAt: new Date().toISOString(),
        createdUser: registrationData.createdUser || "system",
        updatedAt: new Date().toISOString(),
        updatedUser: registrationData.updatedUser || "system",
        formName: registrationData.formName || "消災超度報名表OnService",
        formId: registrationData.formId || this.generateFormId(),
        formSource: registrationData.formSource || "",
        contact: registrationData.contact || {
          name: "",
          phone: "",
          mobile: "",
          relationship: "",
          otherRelationship: "",
        },
        blessing: registrationData.blessing || {
          persons: [], // 消災人員列表
        },
        salvation: registrationData.salvation || {
          ancestors: [], // 祖先列表
          livingPersons: [], // 陽上人列表
        },
      };

      const response = await fetch(
        getApiUrl("/items/registrationDB"), // Directus registrationDB 端點
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
        message: "成功創建報名表",
        formId: processedData.formId,
      };
    } catch (error) {
      console.error("創建報名表失敗:", error);
      return this.handleDirectusError(error);
    }
  }

  async updateRegistration(id, registrationData) {
    if (serviceConfig.mode !== "directus") {
      console.warn("⚠️ 當前模式不是 directus，無法更新數據");
      return { success: false, message: "請切換到 directus 模式" };
    }

    try {
      const updateData = {
        ...registrationData,
        updatedAt: new Date().toISOString(),
        updatedUser: registrationData.updatedUser || "system",
      };

      const response = await fetch(
        `${getApiUrl("/items/registrationDB")}/${id}`,
        {
          method: "PATCH",
          headers: await this.getAuthHeaders(),
          body: JSON.stringify(updateData),
        }
      );

      const data = await this.handleDirectusResponse(response);

      return {
        success: true,
        data: data,
        message: "成功更新報名表",
      };
    } catch (error) {
      console.error(`更新報名表 (ID: ${id}) 失敗:`, error);
      return this.handleDirectusError(error);
    }
  }

  async getRegistrationById(id) {
    if (serviceConfig.mode !== "directus") {
      console.warn("⚠️ 當前模式不是 directus，無法獲取數據");
      return { success: false, message: "請切換到 directus 模式" };
    }

    try {
      const response = await fetch(
        `${getApiUrl("/items/registrationDB")}/${id}?fields=*`,
        {
          method: "GET",
          headers: await this.getAuthHeaders(),
        }
      );

      const data = await this.handleDirectusResponse(response);

      return {
        success: true,
        data: data,
        message: "成功獲取報名表",
      };
    } catch (error) {
      console.error(`獲取報名表 (ID: ${id}) 失敗:`, error);
      return this.handleDirectusError(error);
    }
  }

  async getAllRegistrations(params = {}) {
    if (serviceConfig.mode !== "directus") {
      console.warn("⚠️ 當前模式不是 directus，無法獲取數據");
      return { success: false, message: "請切換到 directus 模式" };
    }

    try {
      const queryParams = new URLSearchParams();
      queryParams.append("fields", "*");

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

      const response = await fetch(
        `${getApiUrl("/items/registrationDB")}?${queryParams.toString()}`,
        {
          method: "GET",
          headers: await this.getAuthHeaders(),
        }
      );

      const data = await this.handleDirectusResponse(response);

      return {
        success: true,
        data: data,
        message: "成功獲取所有報名表",
      };
    } catch (error) {
      console.error("獲取報名表列表失敗:", error);
      return this.handleDirectusError(error);
    }
  }

  async deleteRegistration(id) {
    if (serviceConfig.mode !== "directus") {
      console.warn("⚠️ 當前模式不是 directus，無法刪除數據");
      return { success: false, message: "請切換到 directus 模式" };
    }

    try {
      const response = await fetch(
        `${getApiUrl("/items/registrationDB")}/${id}`,
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
        message: "成功刪除報名表",
      };
    } catch (error) {
      console.error(`刪除報名表 (ID: ${id}) 失敗:`, error);
      return this.handleDirectusError(error);
    }
  }

  // ========== 查詢方法 ==========
  async getRegistrationsByFormId(formId) {
    return this.getAllRegistrations({
      filter: {
        formId: { _eq: formId },
      },
    });
  }

  async getRegistrationsByState(state) {
    return this.getAllRegistrations({
      filter: {
        state: { _eq: state },
      },
    });
  }

  async getRegistrationsByUser(userId) {
    return this.getAllRegistrations({
      filter: {
        createdUser: { _eq: userId },
      },
    });
  }

  // ========== 狀態管理 ==========
  async submitRegistration(id) {
    return this.updateRegistration(id, {
      state: "submitted",
      updatedAt: new Date().toISOString(),
    });
  }

  async completeRegistration(id) {
    return this.updateRegistration(id, {
      state: "completed",
      updatedAt: new Date().toISOString(),
    });
  }

  async saveDraft(id, registrationData) {
    return this.updateRegistration(id, {
      ...registrationData,
      state: "saved",
      updatedAt: new Date().toISOString(),
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

  // ========== 模式管理 ==========
  getCurrentMode() {
    return serviceConfig.mode;
  }

  setMode(mode) {
    if (["mock", "backend", "directus"].includes(mode)) {
      serviceConfig.mode = mode;
      console.log(`RegistrationService 模式已切換為: ${mode}`);
    } else {
      console.warn('無效的模式，請使用 "mock", "backend" 或 "directus"');
    }
  }
}

export const registrationService = new RegistrationService();
