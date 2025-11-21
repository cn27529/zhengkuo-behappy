// src/services/registrationService.js
import { baseService, getApiUrl } from "../services/baseService.js";
import {
  generateGitHash,
  generateMultipleHashes,
} from "../utils/generateGitHash.js";

export class RegistrationService {
  // ========== 建構函式 ==========
  constructor() {
    console.log(`RegistrationService 初始化: 當前模式為 ${baseService.mode}`);
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
    // 在 registrationService.js 頂部添加時間工具函數
    const getCurrentISOTime = () => new Date().toISOString();
    const createISOTime = new Date().toISOString();

    if (baseService.mode !== "directus") {
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
      // 先檢查連線 ✅ 修正：正確的健康檢查邏輯
      const healthCheck = await baseService.checkConnection();
      if (!healthCheck.online) {
        return {
          success: false,
          online: false,
          message: healthCheck.message,
          data: null,
        };
      }
      console.log("✅ Directus 服務健康檢查通過");

      // 準備提交數據
      const processedData = {
        state: registrationData.state || "creating",
        createdAt: createISOTime,
        createdUser: registrationData.createdUser || "system",
        updatedAt: "",
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
        getApiUrl(baseService.apiEndpoints.itemsRegistration), // Directus registrationDB 端點
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
    if (baseService.mode !== "directus") {
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
        `${getApiUrl(baseService.apiEndpoints.itemsRegistration)}/${id}`,
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
    if (baseService.mode !== "directus") {
      console.warn("⚠️ 當前模式不是 directus，無法獲取數據");
      return { success: false, message: "請切換到 directus 模式" };
    }

    try {
      const response = await fetch(
        `${getApiUrl(baseService.apiEndpoints.registrations)}/${id}?fields=*`,
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
    if (baseService.mode !== "directus") {
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

      const apiUrl = `${getApiUrl(
        baseService.apiEndpoints.itemsRegistration
      )}?${queryParams.toString()}`;
      console.log("📡 查詢 URL:", apiUrl);

      const headers = await this.getAuthHeaders();
      console.log("🔑 請求頭:", headers);

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: headers,
      });

      console.log("📊 響應狀態:", response.status, response.statusText);

      // 詳細的 HTTP 狀態碼處理
      if (response.status === 403) {
        const errorText = await response.text();
        console.error("❌ 403 權限拒絕詳細信息:", errorText);
        throw new Error(`權限拒絕 (403): ${errorText}`);
      }

      if (response.status === 401) {
        throw new Error("未經授權 (401): 請檢查認證令牌");
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ 響應錯誤數據:", errorData);
        throw new Error(errorData.message || `HTTP ${response.status} 錯誤`);
      }

      const data = await this.handleDirectusResponse(response);
      console.log("✅ 查詢成功，數據數量:", data?.length || 0);

      return {
        success: true,
        data: data,
        message: "成功獲取所有報名表",
      };
    } catch (error) {
      console.error("❌ 獲取報名表列表失敗:", error);
      return this.handleDirectusError(error);
    }
  }

  // 在 registrationService.js 中添加測試方法
  async testSimpleQuery() {
    try {
      console.log("🧪 開始簡單查詢測試...");

      // 測試 1: 最簡單的查詢
      const simpleUrl = `${getApiUrl(
        baseService.apiEndpoints.itemsRegistration
      )}?limit=1`;
      console.log("測試 URL:", simpleUrl);

      const response = await fetch(simpleUrl, {
        method: "GET",
        headers: await this.getAuthHeaders(),
      });

      console.log("測試響應狀態:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ 簡單查詢成功:", data);
        return { success: true, data: data };
      } else {
        const errorText = await response.text();
        console.error("❌ 簡單查詢失敗:", errorText);
        return { success: false, error: errorText };
      }
    } catch (error) {
      console.error("❌ 測試查詢異常:", error);
      return { success: false, error: error.message };
    }
  }

  async deleteRegistration(id) {
    if (baseService.mode !== "directus") {
      console.warn("⚠️ 當前模式不是 directus，無法刪除數據");
      return { success: false, message: "請切換到 directus 模式" };
    }

    try {
      const response = await fetch(
        `${getApiUrl(baseService.apiEndpoints.itemsRegistration)}/${id}`,
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
    return baseService.mode;
  }

  setMode(mode) {
    if (["mock", "backend", "directus"].includes(mode)) {
      baseService.mode = mode;
      console.log(`RegistrationService 模式已切換為: ${mode}`);
    } else {
      console.warn('無效的模式，請使用 "mock", "backend" 或 "directus"');
    }
  }
}

export const registrationService = new RegistrationService();
