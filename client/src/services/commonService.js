// src/services/commonService.js
export const commonService = {
  // 可切換模式: 'mock' 或 'backend'
  mode: import.meta.env.VITE_AUTH_MODE || "mock",

  // 是否為開發模式
  isDev: import.meta.env.VITE_DEV || false,

  // Directus|supabase 後端 API 基礎 URL
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:8055",

  // API 端點
  apiEndpoints: {
    login: "/auth/login", // Directus|supabase 登入
    logout: "/auth/logout", // Directus|supabase 登出
    refresh: "/auth/refresh", // Directus|supabase token 刷新
    profile: "/auth/profile", // supabase 用戶信息
    validate: "/auth/validate", // supabase token 驗證
    me: "/users/me", // Directus 端點
    itemsMydata: "/items/mydata", // Directus mydata
    itemsRegistration: "/items/registrationDB", // 新增 registrationDB 端點
    serverPing: "/server/ping", // 伺服器連線檢查端點
    serverInfo: "/server/info", // 伺服器資訊端點
  },

  // 模擬 API 延遲（毫秒）
  mockDelay: 500,
};

// 獲取完整的 API URL
export const getApiUrl = (endpoint) => {
  return `${commonService.apiBaseUrl}${endpoint}`;
};
