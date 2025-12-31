// src/services/registrationService.js
import { baseService } from "../services/baseService.js";
import { generateGitHashBrowser } from "../utils/generateGitHash.js";
import { DateUtils } from "../utils/dateUtils.js";

export class RegistrationService {
  // ========== 建構函式 ==========
  constructor() {
    this.serverName = "RegistrationService";
    this.base = baseService;
    this.endpoint = `${this.base.apiBaseUrl}${this.base.apiEndpoints.itemsRegistration}`;
    console.log(`RegistrationService 初始化: 當前模式為 ${this.base.mode}`);
  }

  async healthCheck() {
    return await this.base.healthCheck();
  }

  getIsMock() {
    return this.base.isMock;
  }

  // ========== CRUD 操作 ==========
  async createRegistration(registrationData) {
    const createISOTime = DateUtils.getCurrentISOTime();

    if (this.getIsMock()) {
      console.warn("報名提交成功！⚠️ 當前模式不是 directus，無法創建數據");
      return {
        success: true,
        message: "報名提交成功！⚠️ 當前模式不是 directus，無法創建數據",
        data: {
          id: crypto.randomUUID(), // 標準且保證唯一
          ...registrationData,
        },
      };
    }

    try {
      // 先檢查連接 ✅ 修正：正確的健康檢查邏輯
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

      const formId = await generateGitHashBrowser(createISOTime);
      // 準備提交數據
      const processedData = {
        state: registrationData.state || "creating",
        createdAt: createISOTime,
        createdUser: registrationData.createdUser || "system",
        updatedAt: "",
        updatedUser: registrationData.updatedUser || "system",
        formName: registrationData.formName || "消災超度報名表OnService",
        formId: registrationData.formId || formId,
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

      const myHeaders = await this.base.getAuthJsonHeaders();
      const apiUrl = this.endpoint;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: myHeaders,
        body: JSON.stringify(processedData),
      });

      const result = await this.base.handleDirectusResponse(
        response,
        "成功創建報名表"
      );
      return result;
    } catch (error) {
      console.error("創建報名表失敗:", error);
      return this.handleDirectusError(error);
    }
  }

  async updateRegistration(id, registrationData) {
    if (this.getIsMock()) {
      console.warn("⚠️ 當前模式不是 directus，無法更新數據");
      return {
        success: false,
        message: "⚠️ 當前模式不是 directus，無法更新數據",
      };
    }

    try {
      const updateData = {
        ...registrationData,
        updatedAt: DateUtils.getCurrentISOTime(),
        updatedUser: registrationData.updatedUser || "system",
      };

      const myHeaders = await this.base.getAuthJsonHeaders();
      const apiUrl = `${this.endpoint}/${id}`;
      const response = await fetch(apiUrl, {
        method: "PATCH",
        headers: myHeaders,
        body: JSON.stringify(updateData),
      });

      const result = await this.base.handleDirectusResponse(
        response,
        "成功更新報名表"
      );
      return result;
    } catch (error) {
      console.error(`更新報名表 (ID: ${id}) 失敗:`, error);
      return this.handleDirectusError(error);
    }
  }

  async getRegistrationById(id) {
    if (this.getIsMock()) {
      console.warn("⚠️ 當前模式不是 directus，無法獲取數據");
      return {
        success: false,
        message: "⚠️ 當前模式不是 directus，無法獲取數據",
      };
    }

    try {
      const myHeaders = await this.base.getAuthJsonHeaders();
      const apiUrl = `${this.endpoint}/${id}?fields=*`;
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: myHeaders,
      });

      const result = await this.base.handleDirectusResponse(
        response,
        "成功獲取報名表"
      );
      return result;
    } catch (error) {
      console.error(`獲取報名表 (ID: ${id}) 失敗:`, error);
      return this.handleDirectusError(error);
    }
  }

  async getAllRegistrations(params = {}) {
    if (this.getIsMock()) {
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
          queryParams.append(`filter[${key}]`, params.filter[key]);
        });
      }

      // 添加排序
      if (params.sort) {
        queryParams.append("sort", params.sort);
      }

      const apiUrl = `${this.endpoint}?${queryParams.toString()}`;
      console.log("📡 查詢 URL:", apiUrl);
      const myHeaders = await this.base.getAuthJsonHeaders();
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: myHeaders,
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

      const result = await this.base.handleDirectusResponse(
        response,
        "成功獲取報名表列表"
      );
      return result;
    } catch (error) {
      console.error("❌ 獲取報名表列表失敗:", error);
      return this.handleDirectusError(error);
    }
  }

  async deleteRegistration(id) {
    if (this.getIsMock()) {
      console.warn("⚠️ 當前模式不是 directus，無法刪除數據");
      return {
        success: false,
        message: "⚠️ 當前模式不是 directus，無法刪除數據",
      };
    }

    try {
      const myHeaders = await this.base.getAuthJsonHeaders();
      const apiUrl = `${this.endpoint}/${id}`;
      const response = await fetch(apiUrl, {
        method: "DELETE",
        headers: myHeaders,
      });

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

  // 根據報名表 formId 查詢報名表
  async getRegistrationsByFormId(formId) {
    return this.getAllRegistrations({
      filter: {
        formId: { _eq: formId },
      },
    });
  }

  // 根據狀態查詢報名表
  async getRegistrationsByState(state) {
    return this.getAllRegistrations({
      filter: {
        state: { _eq: state },
      },
    });
  }

  // 根據用戶 ID 查詢報名表
  async getRegistrationsByUser(userId) {
    return this.getAllRegistrations({
      filter: {
        user_created: { _eq: userId },
      },
    });
  }

  // ========== 狀態管理 ==========

  // 變更報名表狀態
  async submitRegistration(id) {
    return this.updateRegistration(id, {
      state: "submitted",
      updatedAt: DateUtils.getCurrentISOTime(),
    });
  }

  // 變更報名表狀態
  async completeRegistration(id) {
    return this.updateRegistration(id, {
      state: "completed",
      updatedAt: DateUtils.getCurrentISOTime(),
    });
  }

  async saveDraft(id, registrationData) {
    return this.updateRegistration(id, {
      ...registrationData,
      state: "saved",
      updatedAt: DateUtils.getCurrentISOTime(),
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
    if (sessionStorage.getItem("auth-mode") !== null) {
      this.base.mode = sessionStorage.getItem("auth-mode");
    }
    console.log("getCurrentMode: ", this.base.mode);
    return this.base.mode;
  }

  setMode(mode) {
    if (["mock", "backend", "directus"].includes(mode)) {
      this.base.mode = mode;
      console.log(`RegistrationService 模式已切換為: ${mode}`);
    } else {
      console.warn('無效的模式，請使用 "mock", "backend" 或 "directus"');
    }
  }
}

export const registrationService = new RegistrationService();
