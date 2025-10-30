// src/config/auth.js
export const authConfig = {
  // 可切換模式: 'mock' 或 'backend'
  mode: import.meta.env.VITE_AUTH_MODE || "mock",

  // 後端 API 基礎 URL
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",

  // API 端點
  apiEndpoints: {
    login: "/api/auth/login",
    logout: "/api/auth/logout",
    refresh: "/api/auth/refresh",
    profile: "/api/auth/profile",
    validate: "/api/auth/validate",
  },

  // 模擬 API 延遲（毫秒）
  mockDelay: 100,
};

// 獲取完整的 API URL
export const getApiUrl = (endpoint) => {
  return `${authConfig.apiBaseUrl}${endpoint}`;
};
