// src/config/auth.js
export const authConfig = {
  // 可切換模式: 'mock' 或 'directus'
  mode: import.meta.env.VITE_AUTH_MODE || "mock",

  // Directus API 基礎 URL
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",

  // Directus API 端點
  apiEndpoints: {
    login: "/auth/login",
    logout: "/auth/logout",
    refresh: "/auth/refresh",
    profile: "/users/me",
    validate: "/users/me", // Directus 使用 /users/me 驗證 token
  },

  // 模擬 API 延遲（毫秒）
  mockDelay: 100,

  // Directus 特定配置
  directus: {
    // Token 儲存方式
    tokenStorage: "session", // 'session' 或 'local'
    // 是否自動刷新 token
    autoRefresh: true,
    // Token 刷新前的時間（秒）
    refreshBeforeExpiry: 300, // 5分鐘前刷新
  },
};

// 獲取完整的 API URL
export const getApiUrl = (endpoint) => {
  return `${authConfig.apiBaseUrl}${endpoint}`;
};
