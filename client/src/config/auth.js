// src/config/auth.js
export const authConfig = {
  // 可切換模式: 'mock' 或 'backend'
  mode: import.meta.env.VITE_AUTH_MODE || "mock",

  // 後端 API 基礎 URL
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",

  // API 端點
  apiEndpoints: {
    login: "/auth/login",
    logout: "/auth/logout",
    refresh: "/auth/refresh",
    profile: "/auth/profile",
    validate: "/auth/validate",
  },

  // 模擬 API 延遲（毫秒）
  mockDelay: 500,
};

// 獲取完整的 API URL
export const getApiUrl = (endpoint) => {
  return `${authConfig.apiBaseUrl}${endpoint}`;
};
