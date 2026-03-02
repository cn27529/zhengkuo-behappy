// src/adapters/serviceAdapter.js
import { activityService as directusActivity } from "../services/activityService.js";
import { authService as directusAuth } from "../services/authService.js";
import { registrationService as directusRegistration } from "../services/registrationService.js";
import { monthlyDonateService as directusMonthlyDonate } from "../services/monthlyDonateService.js";
import { joinRecordService as directusJoinRecord } from "../services/joinRecordService.js";
import { mydataService as directusMydata } from "../services/mydataService.js";
import { directusUsersService as directusUsers } from "../services/directusUsersService.js";
import { DateUtils } from "../utils/dateUtils.js";

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
      { rustJoinRecordService },
      { rustMyDataService },
      { rustDirectusUsersService },
    ] = await Promise.all([
      import("../rustServices/rustActivityService.js"),
      import("../rustServices/rustAuthService.js"),
      import("../rustServices/rustRegistrationService.js"),
      import("../rustServices/rustMonthlyDonateService.js"),
      import("../rustServices/rustJoinRecordService.js"),
      import("../rustServices/rustMyDataService.js"),
      import("../rustServices/rustDirectusUsersService.js"),
    ]);

    rustServices = {
      activity: rustActivityService,
      auth: rustAuthService,
      registration: rustRegistrationService,
      monthlyDonate: rustMonthlyDonateService,
      joinRecord: rustJoinRecordService,
      mydata: rustMyDataService,
      user: rustDirectusUsersService,
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
    // 注意：環境變數都是字符串！"false" 是 truthy，必須用 === "true" 判斷
    /*
    * 環境變數在 JavaScript 中都是字符串，這是個常見的 truthy 陷阱：
      - VITE_MOCK=true → "true" (truthy)
      - VITE_MOCK=false → "false" (也是 truthy！)
      - VITE_MOCK= → undefined (falsy)
      所以必須用 === "true" 來正確判斷。
    */
    this.isMock = import.meta.env.VITE_MOCK === "true";
    // 是否為開發模式
    this.isDev = import.meta.env.VITE_DEV === "true";
    this.backend = import.meta.env.VITE_BACKEND_TYPE || "directus";
    this.autoFallback = import.meta.env.VITE_AUTO_FALLBACK === "true";
    this.fallbackBackend = "directus";

    // Directus 服務映射
    this.directusServices = {
      activity: directusActivity,
      auth: directusAuth,
      registration: directusRegistration,
      monthlyDonate: directusMonthlyDonate,
      joinRecord: directusJoinRecord,
      mydata: directusMydata,
      user: directusUsers,
    };

    // 錯誤計數器
    this.errorCounts = {
      directus: 0,
      axum: 0,
    };

    this.maxErrors = 3;

    // 初始化扁平化方法
    this._initializeFlatMethods();
  }

  /**
   * 獲取當前登錄用戶（直接實現，不走 callServiceMethod）
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

  // 獲取是否為模擬模式
  getIsMock() {
    return this.isMock;
  }

  // 獲取是否為開發模式
  getCurrentDev() {
    return this.isDev;
  }

  // 獲取當前後端
  getCurrentMode() {
    return this.backend;
  }

  // 切換後端
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
            setTimeout(resolve, 1000 * (attempt + 1)),
          );
        }
      }
    }

    throw lastError;
  }

  /**
   * 初始化扁平化方法
   */
  _initializeFlatMethods() {
    // Activity 方法
    const activityMethods = [
      "createActivity",
      "updateActivity",
      "deleteActivity",
      "getAllActivities",
      "getActivityById",
      "getActivitiesByActivityId",
      "getActivitiesByItemType",
      "getActivitiesByState",
      "getUpcomingActivities",
      "getCompletedActivities",
      "getActivitiesByDateRange",
      "getMonthlyStats",
      "calculateMonthlyStats",
      "getMockMonthlyStats",
      "updateParticipants",
      "completeActivity",
      "cancelActivity",
      "handleActivityDirectusError",
    ];

    activityMethods.forEach((method) => {
      this[method] = (...args) =>
        this.callServiceMethod("activity", method, ...args);
    });

    // Auth 方法（getCurrentUser 已在類中直接實現）
    const authMethods = [
      "login",
      "logout",
      "refreshToken",
      "validateToken",
      "healthCheck",
      "serverInfo",
      "serverPing",
    ];

    authMethods.forEach((method) => {
      this[method] = (...args) =>
        this.callServiceMethod("auth", method, ...args);
    });

    // Registration 方法
    const registrationMethods = [
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
      "handleRegistrationDirectusError",
    ];

    registrationMethods.forEach((method) => {
      this[method] = (...args) =>
        this.callServiceMethod("registration", method, ...args);
    });

    // MonthlyDonate 方法
    const monthlyDonateMethods = [
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
      "generateMockData",
      "handleMonthlyDonateDirectusError",
    ];

    monthlyDonateMethods.forEach((method) => {
      this[method] = (...args) =>
        this.callServiceMethod("monthlyDonate", method, ...args);
    });

    // JoinRecord 方法
    const joinRecordMethods = [
      "createParticipationRecord",
      "getAllParticipationRecords",
      "getParticipationRecordById",
      "getParticipationRecordsByRegistrationId",
      "getParticipationRecordsByActivityId",
      "updateParticipationRecord",
      "updateByReceiptPrint",
      "deleteParticipationRecord",
      "saveRecord",
      "getActivityConfig",
      "getLampTypeLabel",
      "generateMockData",
      "handleParticipationRecordError",
    ];

    joinRecordMethods.forEach((method) => {
      this[method] = (...args) =>
        this.callServiceMethod("joinRecord", method, ...args);
    });

    // Mydata 方法
    const mydataMethods = [
      "getAllMydata",
      "getMydataById",
      "createMydata",
      "updateMydata",
      "deleteMydata",
      "getMydataByFormName",
      "getMydataByState",
      "searchMydata",
      "handleMydataDirectusError",
    ];

    mydataMethods.forEach((method) => {
      this[method] = (...args) =>
        this.callServiceMethod("mydata", method, ...args);
    });

    // DirectusUsers 方法
    const userMethods = [
      "getUserById",
      "getAllUsers",
      "getUsersByStatus",
      "getUsersByRole",
      "handleUserError",
    ];

    userMethods.forEach((method) => {
      this[method] = (...args) =>
        this.callServiceMethod("user", method, ...args);
    });
  }

  /**
   * 向後兼容的服務訪問器（舊方式仍可用）
   */
  get activityService() {
    const proxy = {
      getCurrentMode: () => this.getCurrentMode(),
      setMode: (mode) => this.setMode(mode),
      getIsMock: () => this.getIsMock(),
      getCurrentUser: () => this.getCurrentUser(),
    };

    const methods = [
      "createActivity",
      "updateActivity",
      "deleteActivity",
      "getAllActivities",
      "getActivityById",
      "getActivitiesByActivityId",
      "getActivitiesByItemType",
      "getActivitiesByState",
      "getUpcomingActivities",
      "getCompletedActivities",
      "getActivitiesByDateRange",
      "getMonthlyStats",
      "calculateMonthlyStats",
      "getMockMonthlyStats",
      "updateParticipants",
      "completeActivity",
      "cancelActivity",
      "handleActivityDirectusError",
    ];

    methods.forEach((method) => {
      proxy[method] = (...args) =>
        this.callServiceMethod("activity", method, ...args);
    });

    return proxy;
  }

  get authService() {
    const proxy = {
      getCurrentMode: () => this.getCurrentMode(),
      setMode: (mode) => this.setMode(mode),
      getIsMock: () => this.getIsMock(),
      getCurrentUser: () => this.getCurrentUser(),
    };

    const methods = [
      "login",
      "logout",
      "refreshToken",
      "validateToken",
      "healthCheck",
      "serverInfo",
      "serverPing",
    ];

    methods.forEach((method) => {
      proxy[method] = (...args) =>
        this.callServiceMethod("auth", method, ...args);
    });

    return proxy;
  }

  get registrationService() {
    const proxy = {
      getCurrentMode: () => this.getCurrentMode(),
      setMode: (mode) => this.setMode(mode),
      getIsMock: () => this.getIsMock(),
      getCurrentUser: () => this.getCurrentUser(),
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
      "handleRegistrationDirectusError",
    ];

    methods.forEach((method) => {
      proxy[method] = (...args) =>
        this.callServiceMethod("registration", method, ...args);
    });

    return proxy;
  }

  get monthlyDonateService() {
    const proxy = {
      getCurrentMode: () => this.getCurrentMode(),
      setMode: (mode) => this.setMode(mode),
      getIsMock: () => this.getIsMock(),
      getCurrentUser: () => this.getCurrentUser(),
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
      "generateMockData",
      "handleMonthlyDonateDirectusError",
    ];

    methods.forEach((method) => {
      proxy[method] = (...args) =>
        this.callServiceMethod("monthlyDonate", method, ...args);
    });

    return proxy;
  }

  get joinRecordService() {
    const proxy = {
      getCurrentMode: () => this.getCurrentMode(),
      setMode: (mode) => this.setMode(mode),
      getIsMock: () => this.getIsMock(),
      getCurrentUser: () => this.getCurrentUser(),
    };

    const methods = [
      "createParticipationRecord",
      "getAllParticipationRecords",
      "getParticipationRecordById",
      "getParticipationRecordsByRegistrationId",
      "getParticipationRecordsByActivityId",
      "updateParticipationRecord",
      "updateByReceiptPrint",
      "deleteParticipationRecord",
      "saveRecord",
      "getActivityConfig",
      "getLampTypeLabel",
      "generateMockData",
      "handleParticipationRecordError",
    ];

    methods.forEach((method) => {
      proxy[method] = (...args) =>
        this.callServiceMethod("joinRecord", method, ...args);
    });

    return proxy;
  }

  get mydataService() {
    const proxy = {
      getCurrentMode: () => this.getCurrentMode(),
      setMode: (mode) => this.setMode(mode),
      getIsMock: () => this.getIsMock(),
      getCurrentUser: () => this.getCurrentUser(),
    };

    const methods = [
      "getAllMydata",
      "getMydataById",
      "createMydata",
      "updateMydata",
      "deleteMydata",
      "getMydataByFormName",
      "getMydataByState",
      "searchMydata",
      "handleMydataDirectusError",
    ];

    methods.forEach((method) => {
      proxy[method] = (...args) =>
        this.callServiceMethod("mydata", method, ...args);
    });

    return proxy;
  }

  get directusUsersService() {
    const proxy = {
      getCurrentMode: () => this.getCurrentMode(),
      setMode: (mode) => this.setMode(mode),
      getIsMock: () => this.getIsMock(),
      getCurrentUser: () => this.getCurrentUser(),
    };

    const methods = [
      "getUserById",
      "getAllUsers",
      "getUsersByStatus",
      "getUsersByRole",
      "handleUserDirectusError",
    ];

    methods.forEach((method) => {
      proxy[method] = (...args) =>
        this.callServiceMethod("user", method, ...args);
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
        timestamp: DateUtils.getCurrentISOTime(),
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
