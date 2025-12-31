// src/adapters/serviceAdapter2.js
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

    console.log("✅🦀 [Rust] 服務加載完成");
    return rustServices;
  } catch (error) {
    console.error("❌ [Rust] 服務加載失敗:", error);
    throw error;
  }
}

class ServiceAdapter {
  constructor() {
    this.backend = import.meta.env.VITE_BACKEND_TYPE || "directus";
    this.autoFallback = import.meta.env.VITE_AUTO_FALLBACK === "true";
    this.fallbackBackend = "directus"; // 始終降級到 Directus

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

    // 最大錯誤次數
    this.maxErrors = 3;
  }

  /**
   * 獲取指定服務（帶降級邏輯）
   */
  async getService(serviceName) {
    try {
      if (this.backend === "axum") {
        // 使用 Rust 服務
        console.log("🦀 使用 [Rust] 服務");
        const rust = await loadRustServices();
        return rust[serviceName];
      } else {
        // 使用 Directus 服務
        console.log("🦀 使用 Directus 服務");
        return this.directusServices[serviceName];
      }
    } catch (error) {
      console.error(`獲取 ${serviceName} 服務失敗:`, error);
      // 自動降級到 Directus
      if (this.autoFallback && this.backend === "axum") {
        console.warn("⚠️ 自動降級到 Directus 服務");
        return this.directusServices[serviceName];
      }

      throw error;
    }
  }

  /**
   * 包裝服務方法，添加錯誤處理和降級邏輯
   */
  async callServiceMethod(serviceName, methodName, ...args) {
    // 重試次數
    const maxRetries = 2;
    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const service = await this.getService(serviceName);
        const result = await service[methodName](...args);

        // 成功後重置錯誤計數
        this.errorCounts[this.backend] = 0;

        return result;
      } catch (error) {
        lastError = error;
        console.error(
          `${serviceName}.${methodName} 失敗 (嘗試 ${attempt + 1}/${
            maxRetries + 1
          }):`,
          error
        );

        // 增加錯誤計數
        this.errorCounts[this.backend]++;

        // 如果是最後一次嘗試，且啟用自動降級
        if (
          attempt === maxRetries &&
          this.autoFallback &&
          this.backend === "axum"
        ) {
          console.warn("⚠️ 達到最大重試次數，嘗試降級到 Directus");

          // 臨時切換到 Directus
          const originalBackend = this.backend;
          this.backend = "directus";

          try {
            const service = await this.getService(serviceName);
            const result = await service[methodName](...args);

            console.log("✅ 使用 Directus 降級成功");

            // 如果錯誤次數超過閾值，永久切換
            if (this.errorCounts[originalBackend] >= this.maxErrors) {
              console.warn(
                `⚠️ ${originalBackend} 錯誤次數過多，永久切換到 Directus`
              );
            } else {
              // 否則恢復原後端
              this.backend = originalBackend;
            }

            return result;
          } catch (fallbackError) {
            console.error("❌ Directus 降級也失敗:", fallbackError);
            throw fallbackError;
          }
        }

        // 短暫延遲後重試
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
   * Activity 服務代理
   */
  get activityService() {
    return {
      // CRUD 操作
      createActivity: (...args) =>
        this.callServiceMethod("activity", "createActivity", ...args),
      updateActivity: (...args) =>
        this.callServiceMethod("activity", "updateActivity", ...args),
      deleteActivity: (...args) =>
        this.callServiceMethod("activity", "deleteActivity", ...args),
      getAllActivities: (...args) =>
        this.callServiceMethod("activity", "getAllActivities", ...args),
      getActivityById: (...args) =>
        this.callServiceMethod("activity", "getActivityById", ...args),

      // 查詢方法
      getActivitiesByActivityId: (...args) =>
        this.callServiceMethod(
          "activity",
          "getActivitiesByActivityId",
          ...args
        ),
      getActivitiesByItemType: (...args) =>
        this.callServiceMethod("activity", "getActivitiesByItemType", ...args),
      getActivitiesByState: (...args) =>
        this.callServiceMethod("activity", "getActivitiesByState", ...args),
      getUpcomingActivities: (...args) =>
        this.callServiceMethod("activity", "getUpcomingActivities", ...args),
      getCompletedActivities: (...args) =>
        this.callServiceMethod("activity", "getCompletedActivities", ...args),
      getActivitiesByDateRange: (...args) =>
        this.callServiceMethod("activity", "getActivitiesByDateRange", ...args),

      // 統計方法
      getMonthlyStats: (...args) =>
        this.callServiceMethod("activity", "getMonthlyStats", ...args),

      // 狀態管理
      updateParticipants: (...args) =>
        this.callServiceMethod("activity", "updateParticipants", ...args),
      completeActivity: (...args) =>
        this.callServiceMethod("activity", "completeActivity", ...args),
      cancelActivity: (...args) =>
        this.callServiceMethod("activity", "cancelActivity", ...args),

      // 模式管理
      getCurrentMode: (...args) =>
        this.callServiceMethod("activity", "getCurrentMode", ...args),
      setMode: (...args) =>
        this.callServiceMethod("activity", "setMode", ...args),

      // 錯誤處理
      handleDirectusError: (...args) =>
        this.callServiceMethod("activity", "handleDirectusError", ...args),

      // 計算統計（如果有的話）
      calculateMonthlyStats: (...args) =>
        this.callServiceMethod("activity", "calculateMonthlyStats", ...args),

      // 獲取模擬數據（如果有的話）
      getMockMonthlyStats: (...args) =>
        this.callServiceMethod("activity", "getMockMonthlyStats", ...args),
    };
  }

  /**
   * Auth 服務代理
   */
  get authService() {
    return {
      login: (...args) => this.callServiceMethod("auth", "login", ...args),
      logout: (...args) => this.callServiceMethod("auth", "logout", ...args),
      refreshToken: (...args) =>
        this.callServiceMethod("auth", "refreshToken", ...args),
      validateToken: (...args) =>
        this.callServiceMethod("auth", "validateToken", ...args),
    };
  }

  /**
   * Registration 服務代理
   */
  get registrationService() {
    return {
      // 核心 CRUD 操作
      createRegistration: (...args) =>
        this.callServiceMethod("registration", "createRegistration", ...args),
      updateRegistration: (...args) =>
        this.callServiceMethod("registration", "updateRegistration", ...args),
      deleteRegistration: (...args) =>
        this.callServiceMethod("registration", "deleteRegistration", ...args),
      getAllRegistrations: (...args) =>
        this.callServiceMethod("registration", "getAllRegistrations", ...args),
      getRegistrationById: (...args) =>
        this.callServiceMethod("registration", "getRegistrationById", ...args),

      // 查詢方法
      getRegistrationsByFormId: (...args) =>
        this.callServiceMethod(
          "registration",
          "getRegistrationsByFormId",
          ...args
        ),
      getRegistrationsByState: (...args) =>
        this.callServiceMethod(
          "registration",
          "getRegistrationsByState",
          ...args
        ),
      getRegistrationsByUser: (...args) =>
        this.callServiceMethod(
          "registration",
          "getRegistrationsByUser",
          ...args
        ),

      // 狀態管理方法
      submitRegistration: (...args) =>
        this.callServiceMethod("registration", "submitRegistration", ...args),
      completeRegistration: (...args) =>
        this.callServiceMethod("registration", "completeRegistration", ...args),
      saveDraft: (...args) =>
        this.callServiceMethod("registration", "saveDraft", ...args),

      // 模式管理
      getCurrentMode: (...args) =>
        this.callServiceMethod("registration", "getCurrentMode", ...args),
      setMode: (...args) =>
        this.callServiceMethod("registration", "setMode", ...args),

      // 錯誤處理
      handleDirectusError: (...args) =>
        this.callServiceMethod("registration", "handleDirectusError", ...args),

      // Rust 特有功能（可選）
      batchOperations: (...args) =>
        this.callServiceMethod("registration", "batchOperations", ...args),
      searchRegistrations: (...args) =>
        this.callServiceMethod("registration", "searchRegistrations", ...args),
      exportRegistrations: (...args) =>
        this.callServiceMethod("registration", "exportRegistrations", ...args),
    };
  }

  /**
   * MonthlyDonate 服務代理（補充完整所有方法）
   */
  get monthlyDonateService() {
    return {
      // 核心 CRUD 操作
      getAllMonthlyDonates: (...args) =>
        this.callServiceMethod(
          "monthlyDonate",
          "getAllMonthlyDonates",
          ...args
        ),
      createMonthlyDonate: (...args) =>
        this.callServiceMethod("monthlyDonate", "createMonthlyDonate", ...args),
      updateMonthlyDonate: (...args) =>
        this.callServiceMethod("monthlyDonate", "updateMonthlyDonate", ...args),
      deleteMonthlyDonate: (...args) =>
        this.callServiceMethod("monthlyDonate", "deleteMonthlyDonate", ...args),

      // 查詢方法
      getMonthlyDonateById: (...args) =>
        this.callServiceMethod(
          "monthlyDonate",
          "getMonthlyDonateById",
          ...args
        ),
      getMonthlyDonateByDonateId: (...args) =>
        this.callServiceMethod(
          "monthlyDonate",
          "getMonthlyDonateByDonateId",
          ...args
        ),
      getMonthlyDonateByRegistrationId: (...args) =>
        this.callServiceMethod(
          "monthlyDonate",
          "getMonthlyDonateByRegistrationId",
          ...args
        ),
      getMonthlyDonatesByDonateType: (...args) =>
        this.callServiceMethod(
          "monthlyDonate",
          "getMonthlyDonatesByDonateType",
          ...args
        ),

      // donateItems 操作方法
      addDonateItem: (...args) =>
        this.callServiceMethod("monthlyDonate", "addDonateItem", ...args),
      updateDonateItem: (...args) =>
        this.callServiceMethod("monthlyDonate", "updateDonateItem", ...args),
      deleteDonateItem: (...args) =>
        this.callServiceMethod("monthlyDonate", "deleteDonateItem", ...args),

      // 統計方法
      getMonthlyDonateStats: (...args) =>
        this.callServiceMethod(
          "monthlyDonate",
          "getMonthlyDonateStats",
          ...args
        ),
      getDonationStats: (...args) =>
        this.callServiceMethod("monthlyDonate", "getDonationStats", ...args),

      // 實用方法
      getCurrentUser: (...args) =>
        this.callServiceMethod("monthlyDonate", "getCurrentUser", ...args),
      generateMockData: (...args) =>
        this.callServiceMethod("monthlyDonate", "generateMockData", ...args),

      // 模式管理
      getCurrentMode: (...args) =>
        this.callServiceMethod("monthlyDonate", "getCurrentMode", ...args),
      setMode: (...args) =>
        this.callServiceMethod("monthlyDonate", "setMode", ...args),

      // 錯誤處理
      handleDirectusError: (...args) =>
        this.callServiceMethod("monthlyDonate", "handleDirectusError", ...args),

      // Rust 特有功能（如果有的話）
      batchOperations: (...args) =>
        this.callServiceMethod("monthlyDonate", "batchOperations", ...args),
      searchMonthlyDonates: (...args) =>
        this.callServiceMethod(
          "monthlyDonate",
          "searchMonthlyDonates",
          ...args
        ),
      exportMonthlyDonates: (...args) =>
        this.callServiceMethod(
          "monthlyDonate",
          "exportMonthlyDonates",
          ...args
        ),
      getDonationTypeStats: (...args) =>
        this.callServiceMethod(
          "monthlyDonate",
          "getDonationTypeStats",
          ...args
        ),
      getDonationTrend: (...args) =>
        this.callServiceMethod("monthlyDonate", "getDonationTrend", ...args),
    };
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
    this.errorCounts[type] = 0; // 重置錯誤計數
    console.log(`✅ 切換到 ${type} 後端`);
    return true;
  }

  /**
   * 獲取當前後端類型
   */
  getCurrentBackend() {
    return this.backend;
  }

  /**
   * 獲取錯誤統計
   */
  getErrorStats() {
    return {
      backend: this.backend,
      errors: this.errorCounts,
      autoFallback: this.autoFallback,
    };
  }

  /**
   * 重置錯誤計數
   */
  resetErrors() {
    this.errorCounts = { directus: 0, axum: 0 };
    console.log("✅ 錯誤計數已重置");
  }
}

export const serviceAdapter = new ServiceAdapter();
