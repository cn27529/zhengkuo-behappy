// src/config/axiosConfig.js

/**
 * Axios 與 API 配置中心
 * 所有後端 URL 和認證配置都在這裡統一管理
 */

// ========== 基礎配置 ==========
export const axiosConfig = {
  // API 基礎 URL
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",

  // 請求超時時間（毫秒）
  timeout: 10000,

  // 請求重試配置
  retry: {
    maxRetries: 3,
    retryDelay: 1000,
  },

  // Mock 模式的 API 延遲（毫秒）
  mockDelay: 500,
};

// ========== 認證配置 ==========
export const authConfig = {
  // 認證模式: 'mock' 或 'directus'
  mode: import.meta.env.VITE_AUTH_MODE || "mock",

  // Token 儲存方式: 'session' 或 'local'
  tokenStorage: "session",

  // 是否自動刷新 token
  autoRefresh: true,

  // Token 刷新前的時間（秒）- 在過期前 5 分鐘刷新
  refreshBeforeExpiry: 300,
};

// ========== API 端點配置 ==========
export const apiEndpoints = {
  // ===== 認證相關 =====
  auth: {
    login: "/auth/login",
    logout: "/auth/logout",
    refresh: "/auth/refresh",
    validate: "/users/me",
    profile: "/users/me",
    register: "/users",
    resetPassword: "/auth/password/request",
    updatePassword: "/auth/password/reset",
  },

  // ===== 用戶管理 =====
  users: {
    list: "/users",
    detail: (id) => `/users/${id}`,
    create: "/users",
    update: (id) => `/users/${id}`,
    delete: (id) => `/users/${id}`,
    me: "/users/me",
    avatar: (id) => `/assets/${id}`,
  },

  // ===== 角色與權限 =====
  roles: {
    list: "/roles",
    detail: (id) => `/roles/${id}`,
    permissions: (id) => `/permissions?filter[role][_eq]=${id}`,
  },

  // ===== 系統功能 =====
  system: {
    health: "/server/health",
    info: "/server/info",
    ping: "/server/ping",
  },

  // ===== 檔案管理 =====
  files: {
    upload: "/files",
    list: "/files",
    detail: (id) => `/files/${id}`,
    delete: (id) => `/files/${id}`,
    import: "/utils/import",
    export: "/utils/export",
  },

  // ===== 集合管理 (Collections) =====
  collections: {
    list: "/collections",
    detail: (name) => `/collections/${name}`,
    items: (collection) => `/items/${collection}`,
    item: (collection, id) => `/items/${collection}/${id}`,
  },

  // ===== 活動日誌 =====
  activity: {
    list: "/activity",
    detail: (id) => `/activity/${id}`,
  },

  // ===== 通知系統 =====
  notifications: {
    list: "/notifications",
    detail: (id) => `/notifications/${id}`,
    markRead: (id) => `/notifications/${id}`,
  },

  // ===== 自定義業務端點（範例） =====
  custom: {
    // 寺廟相關
    temples: "/items/temples",
    templeDetail: (id) => `/items/temples/${id}`,

    // 活動相關
    events: "/items/events",
    eventDetail: (id) => `/items/events/${id}`,

    // 志工相關
    volunteers: "/items/volunteers",
    volunteerDetail: (id) => `/items/volunteers/${id}`,
  },
};

// ========== URL 構建器 ==========
/**
 * 構建完整的 API URL
 * @param {string} endpoint - API 端點路徑
 * @param {object} params - URL 查詢參數（可選）
 * @returns {string} 完整的 URL
 */
export const buildApiUrl = (endpoint, params = null) => {
  const url = new URL(endpoint, axiosConfig.baseURL);

  // 添加查詢參數
  if (params) {
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });
  }

  return url.toString();
};

/**
 * 獲取簡單的 API URL（不帶查詢參數）
 * @param {string} endpoint - API 端點路徑
 * @returns {string} 完整的 URL
 */
export const getApiUrl = (endpoint) => {
  return `${axiosConfig.baseURL}${endpoint}`;
};

// ========== Directus 查詢構建器 ==========
/**
 * 構建 Directus 查詢參數
 * @param {object} options - 查詢選項
 * @returns {object} 查詢參數對象
 */
export const buildDirectusQuery = (options = {}) => {
  const params = {};

  // 欄位選擇
  if (options.fields) {
    params.fields = Array.isArray(options.fields)
      ? options.fields.join(",")
      : options.fields;
  }

  // 過濾條件
  if (options.filter) {
    Object.keys(options.filter).forEach((key) => {
      params[`filter[${key}]`] = options.filter[key];
    });
  }

  // 排序
  if (options.sort) {
    params.sort = Array.isArray(options.sort)
      ? options.sort.join(",")
      : options.sort;
  }

  // 分頁
  if (options.limit) params.limit = options.limit;
  if (options.offset) params.offset = options.offset;
  if (options.page) params.page = options.page;

  // 搜尋
  if (options.search) params.search = options.search;

  // 深度查詢（關聯資料）
  if (options.deep) params.deep = options.deep;

  return params;
};

// ========== 預設請求頭 ==========
export const defaultHeaders = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

// ========== 環境檢查 ==========
export const isDevelopment = import.meta.env.MODE === "development";
export const isProduction = import.meta.env.MODE === "production";

// ========== 日誌配置 ==========
export const loggingConfig = {
  // 是否啟用請求日誌
  enableRequestLog: isDevelopment,
  // 是否啟用響應日誌
  enableResponseLog: isDevelopment,
  // 是否啟用錯誤日誌
  enableErrorLog: true,
};

// ========== 導出配置摘要（用於調試） ==========
export const getConfigSummary = () => {
  return {
    baseURL: axiosConfig.baseURL,
    authMode: authConfig.mode,
    environment: import.meta.env.MODE,
    tokenStorage: authConfig.tokenStorage,
  };
};

// 在開發環境下打印配置摘要
if (isDevelopment) {
  console.log("📡 API 配置:", getConfigSummary());
}
