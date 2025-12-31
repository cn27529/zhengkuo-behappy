// src/adapters/serviceAdapter.js
import { activityService as directusActivity } from "../services/activityService.js";
import { authService as directusAuth } from "../services/authService.js";
import { registrationService as directusRegistration } from "../services/registrationService.js";
import { monthlyDonateService as directusMonthlyDonate } from "../services/monthlyDonateService.js";

// Rust 服務（延遲加載，避免初始化錯誤）
let rustServices = null;

async function loadRustServices() {
  if (rustServices) return rustServices;

  try {
    const [
      { rustActivityService },
      { rustAuthService },
      { rustRegistrationService },
      { rustMonthlyDonateService },
    ] = await Promise.all([
      import("../rustServices/rustActivityService.js"),
      import("../rustServices/rustAuthService.js"),
      import("../rustServices/rustRegistrationService.js"),
      import("../rustServices/rustMonthlyDonateService.js"),
    ]);

    rustServices = {
      activity: rustActivityService,
      auth: rustAuthService,
      registration: rustRegistrationService,
      monthlyDonate: rustMonthlyDonateService,
    };

    console.log("✅ Rust 服務加載完成");
    return rustServices;
  } catch (error) {
    console.error("❌ Rust 服務加載失敗:", error);
    throw error;
  }
}

class ServiceAdapter {
  constructor() {
    this.backend = import.meta.env.VITE_BACKEND_TYPE || "directus";
    this.autoFallback = import.meta.env.VITE_AUTO_FALLBACK === "true";
    this.fallbackBackend = "directus";

    // Directus 服務映射
    this.directusServices = {
      activity: directusActivity,
      auth: directusAuth,
      registration: directusRegistration,
      monthlyDonate: directusMonthlyDonate,
    };

    // 錯誤計數器
    this.errorCounts = {
      directus: 0,
      axum: 0,
    };

    this.maxErrors = 3;
  }

  /**
   * 模式管理
   */
  getCurrentMode() {
    return this.backend;
  }

  setMode(mode) {
    return this.switchBackend(mode);
  }

  /**
   * 獲取指定服務
   */
  async getService(serviceName) {
    try {
      if (this.backend === "axum") {
        const rust = await loadRustServices();
        return rust[serviceName];
      } else {
        return this.directusServices[serviceName];
      }
    } catch (error) {
      console.error(`獲取 ${serviceName} 服務失敗:`, error);

      if (this.autoFallback && this.backend === "axum") {
        console.warn("⚠️ 自動降級到 Directus 服務");
        return this.directusServices[serviceName];
      }

      throw error;
    }
  }

  /**
   * 包裝服務方法
   */
  async callServiceMethod(serviceName, methodName, ...args) {
    const maxRetries = 2;
    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const service = await this.getService(serviceName);

        if (typeof service[methodName] !== "function") {
          throw new Error(`方法 ${methodName} 不存在`);
        }

        const result = await service[methodName](...args);
        this.errorCounts[this.backend] = 0;
        return result;
      } catch (error) {
        lastError = error;
        console.error(`${serviceName}.${methodName} 失敗:`, error);
        this.errorCounts[this.backend]++;

        if (
          attempt === maxRetries &&
          this.autoFallback &&
          this.backend === "axum"
        ) {
          console.warn("⚠️ 嘗試降級到 Directus");
          const originalBackend = this.backend;
          this.backend = "directus";

          try {
            const service = await this.getService(serviceName);
            const result = await service[methodName](...args);
            console.log("✅ 降級成功");

            if (this.errorCounts[originalBackend] >= this.maxErrors) {
              console.warn(`⚠️ ${originalBackend} 錯誤過多，永久切換`);
            } else {
              this.backend = originalBackend;
            }

            return result;
          } catch (fallbackError) {
            console.error("❌ 降級失敗:", fallbackError);
            throw fallbackError;
          }
        }

        if (attempt < maxRetries) {
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * (attempt + 1))
          );
        }
      }
    }

    throw lastError;
  }

  /**
   * Activity 服務代理（完整版）
   */
  get activityService() {
    const proxy = {
      // 模式管理
      getCurrentMode: () => this.getCurrentMode(),
      setMode: (mode) => this.setMode(mode),
      //getBackendInfo: () => this.getErrorStats(),
      getIsMock: () => this.getIsMock(),
    };

    // 添加所有方法
    const methods = [
      // CRUD
      "createActivity",
      "updateActivity",
      "deleteActivity",
      "getAllActivities",
      "getActivityById",
      // 查詢
      "getActivitiesByActivityId",
      "getActivitiesByItemType",
      "getActivitiesByState",
      "getUpcomingActivities",
      "getCompletedActivities",
      "getActivitiesByDateRange",
      // 統計
      "getMonthlyStats",
      "calculateMonthlyStats",
      "getMockMonthlyStats",
      // 狀態管理
      "updateParticipants",
      "completeActivity",
      "cancelActivity",
      // 錯誤處理
      "handleDirectusError",
    ];

    methods.forEach((method) => {
      proxy[method] = (...args) =>
        this.callServiceMethod("activity", method, ...args);
    });

    return proxy;
  }

  /**
   * Auth 服務代理
   */
  get authService() {
    const proxy = {
      getCurrentMode: () => this.getCurrentMode(),
      setMode: (mode) => this.setMode(mode),
      getIsMock: () => this.getIsMock(),
    };

    const methods = [
      "login",
      "logout",
      "refreshToken",
      "validateToken",
      "getCurrentUser",
    ];

    methods.forEach((method) => {
      proxy[method] = (...args) =>
        this.callServiceMethod("auth", method, ...args);
    });

    return proxy;
  }

  /**
   * Registration 服務代理
   */
  get registrationService() {
    const proxy = {
      getCurrentMode: () => this.getCurrentMode(),
      setMode: (mode) => this.setMode(mode),
      getIsMock: () => this.getIsMock(),
    };

    const methods = [
      "createRegistration",
      "updateRegistration",
      "deleteRegistration",
      "getAllRegistrations",
      "getRegistrationById",
      "getRegistrationsByFormId",
      "getRegistrationsByState",
      "getRegistrationsByUser",
      "submitRegistration",
      "completeRegistration",
      "saveDraft",
      "handleDirectusError",
    ];

    methods.forEach((method) => {
      proxy[method] = (...args) =>
        this.callServiceMethod("registration", method, ...args);
    });

    return proxy;
  }

  /**
   * MonthlyDonate 服務代理
   */
  get monthlyDonateService() {
    const proxy = {
      getCurrentMode: () => this.getCurrentMode(),
      setMode: (mode) => this.setMode(mode),
      getIsMock: () => this.getIsMock(),
    };

    const methods = [
      "getAllMonthlyDonates",
      "createMonthlyDonate",
      "updateMonthlyDonate",
      "deleteMonthlyDonate",
      "getMonthlyDonateById",
      "getMonthlyDonateByDonateId",
      "getMonthlyDonateByRegistrationId",
      "getMonthlyDonatesByDonateType",
      "addDonateItem",
      "updateDonateItem",
      "deleteDonateItem",
      "getMonthlyDonateStats",
      "getDonationStats",
      "getCurrentUser",
      "generateMockData",
      "handleDirectusError",
    ];

    methods.forEach((method) => {
      proxy[method] = (...args) =>
        this.callServiceMethod("monthlyDonate", method, ...args);
    });

    return proxy;
  }

  /**
   * 手動切換後端
   */
  switchBackend(type) {
    if (!["directus", "axum"].includes(type)) {
      console.error("無效的後端類型");
      return false;
    }

    this.backend = type;
    this.errorCounts[type] = 0;
    console.log(`✅ 切換到 ${type} 後端`);
    return true;
  }

  getCurrentBackend() {
    return this.backend;
  }

  getErrorStats() {
    return {
      backend: this.backend,
      errors: this.errorCounts,
      autoFallback: this.autoFallback,
    };
  }

  resetErrors() {
    this.errorCounts = { directus: 0, axum: 0 };
    console.log("✅ 錯誤計數已重置");
  }

  async healthCheck() {
    try {
      const backend = this.getCurrentBackend();
      console.log(`🩺 檢查 ${backend} 後端健康狀態...`);
      return {
        success: true,
        backend,
        status: "healthy",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        backend: this.getCurrentBackend(),
        status: "unhealthy",
        error: error.message,
      };
    }
  }
}

export const serviceAdapter = new ServiceAdapter();
