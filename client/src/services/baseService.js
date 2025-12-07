// src/services/baseService.js
// ========== 時間工具函數 ==========
/**
 * 獲取當前時間的 ISO 格式字符串
 * @returns {string} ISO 格式時間字符串
 */
const getCurrentISOTime = () => new Date().toISOString();

/**
 * 格式化日期為 YYYY-MM-DD 格式
 * @param {Date|string} date - 日期
 * @returns {string} 格式化後的日期字符串
 */
const formatDate = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
};

/**
 * 格式化日期時間為 YYYY-MM-DD HH:mm 格式
 * @param {Date|string} date - 日期時間
 * @returns {string} 格式化後的日期時間字符串
 */
const formatDateTime = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(
    2,
    "0"
  )}:${String(d.getMinutes()).padStart(2, "0")}`;
};

/**
 * 計算一年前的日期
 * @returns {Date} 一年前的日期
 */
const getOneYearAgo = () => {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  return oneYearAgo;
};

/**
 * 計算 N 個月前的日期
 * @param {number} months - 月數
 * @returns {Date} N 個月前的日期
 */
const getMonthsAgo = (months) => {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date;
};

/**
 * 檢查日期是否在指定時間範圍內
 * @param {string} dateString - 日期字符串
 * @param {number} months - 月份範圍
 * @returns {boolean} 是否在範圍內
 */
const isWithinMonths = (dateString, months = 12) => {
  if (!dateString) return false;
  const targetDate = new Date(dateString);
  const cutoffDate = getMonthsAgo(months);
  return targetDate >= cutoffDate;
};

/**
 * 檢查日期是否為有效日期
 * @param {string} dateString - 日期字符串
 * @returns {boolean} 是否有效
 */
const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

export class BaseService {
  constructor() {
    // 可切換模式: 'mock' 或 'backend'
    this.mode = import.meta.env.VITE_AUTH_MODE || "mock";

    // 是否為開發模式
    this.isDev = import.meta.env.VITE_DEV || false;

    this.apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8055";

    this.apiEndpoints = {
      login: "/auth/login", // Directus 登入
      logout: "/auth/logout", // Directus 登出
      refresh: "/auth/refresh", // Directus token 刷新
      profile: "/auth/profile", // 用戶信息
      validate: "/auth/validate", // token 驗證
      me: "/users/me", // Directus 端點
      itemsMydata: "/items/mydata", // mydata測試
      itemsRegistration: "/items/registrationDB", // 新增 registrationDB 端點
      serverPing: "/server/ping", // 伺服器連線檢查端點
      serverInfo: "/server/info", // 伺服器資訊端點
      itemsActivity: "/items/activityDB", // 新增 activityDB 端點
    };

    // 模擬 API 延遲（毫秒）
    this.mockDelay = 500;
  }

  // 獲取伺服器資訊，返回伺服器資訊對象或 null
  async serverInfo() {
    try {
      const response = await fetch(getApiUrl(this.apiEndpoints.serverInfo), {
        method: "GET",
        timeout: 5000,
      });

      console.log("伺服器資訊回應狀態:", JSON.stringify(response));

      if (response.ok) {
        const data = await response.json();
        console.log("伺服器資訊:", data);
        return data;
      } else {
        console.warn("無法取得伺服器資訊");
        return null;
      }
    } catch (error) {
      console.error("取得伺服器資訊異常:", error);
      return null;
    }
  }

  // 檢查伺服器是否在線，返回布林值
  async serverPing() {
    try {
      const response = await fetch(getApiUrl(this.apiEndpoints.serverPing), {
        method: "GET",
        timeout: 5000,
      });

      console.log("Ping 伺服器回應狀態:", JSON.stringify(response));

      if (response.ok) {
        console.log("伺服器 Ping 成功");
        return true;
      } else {
        console.warn("伺服器 Ping 失敗");
        return false;
      }
    } catch (error) {
      console.error("伺服器 Ping 異常:", error);
      return false;
    }
  }

  // 檢查後端連接狀態，返回一個包含 success 和 message 的對象
  async checkConnection() {
    // Mock 模式總是返回成功
    if (this.mode !== "directus") {
      return {
        success: true,
        online: true,
        message: `${this.mode} 模式連線正常`,
      };
    }

    try {
      const response = await fetch(getApiUrl(this.apiEndpoints.serverInfo), {
        method: "GET",
        timeout: 5000,
      });

      console.log("檢查後端連接回應狀態:", JSON.stringify(response));

      if (response.ok) {
        console.log("伺服器連線正常");
        return {
          success: true,
          online: true,
          message: "伺服器連線正常",
        };
      } else {
        return {
          success: false,
          online: false,
          message: "伺服器無回應",
        };
      }
    } catch (error) {
      console.error("伺服器連線異常:", error);
      return {
        success: false,
        online: false,
        message: `伺服器連線異常: ${error.message}`,
      };
    }
  }
}
export const baseService = new BaseService();

// 獲取完整的 API URL
export const getApiUrl = (endpoint) => {
  return `${baseService.apiBaseUrl}${endpoint}`;
};

// ========== 導出時間工具函數 ==========
// 直接導出工具函數，方便其他文件直接導入使用
export {
  getCurrentISOTime,
  formatDate,
  formatDateTime,
  getOneYearAgo,
  getMonthsAgo,
  isWithinMonths,
  isValidDate,
};
