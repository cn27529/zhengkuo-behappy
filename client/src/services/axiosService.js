// src/services/axiosService.js
import axios from "axios";
import { authConfig, getApiUrl } from "../config/auth.js";

class AxiosService {
  constructor() {
    // 創建 axios 實例
    this.instance = axios.create({
      baseURL: authConfig.apiBaseUrl,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // 請求攔截器
    this.instance.interceptors.request.use(
      (config) => {
        // 添加 token 到請求頭
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        console.log(`[Axios] ${config.method.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error("[Axios] 請求錯誤:", error);
        return Promise.reject(error);
      }
    );

    // 響應攔截器
    this.instance.interceptors.response.use(
      (response) => {
        console.log(`[Axios] 響應成功:`, response.config.url);
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // 處理 401 錯誤（Token 過期）
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // 嘗試刷新 token
            const refreshToken = this.getRefreshToken();
            if (refreshToken) {
              const response = await this.instance.post(
                authConfig.apiEndpoints.refresh,
                {
                  refresh_token: refreshToken,
                  mode: "json", // Directus 要求
                }
              );

              if (response.data?.data?.access_token) {
                // 保存新 token
                this.setToken(response.data.data.access_token);
                this.setRefreshToken(response.data.data.refresh_token);

                // 重試原請求
                originalRequest.headers.Authorization = `Bearer ${response.data.data.access_token}`;
                return this.instance(originalRequest);
              }
            }
          } catch (refreshError) {
            console.error("[Axios] Token 刷新失敗:", refreshError);
            // 清除 token 並跳轉登入頁
            this.clearTokens();
            window.location.href = "/login";
            return Promise.reject(refreshError);
          }
        }

        console.error(
          "[Axios] 響應錯誤:",
          error.response?.data || error.message
        );
        return Promise.reject(error);
      }
    );
  }

  // Token 管理方法
  getToken() {
    const storage =
      authConfig.directus.tokenStorage === "local"
        ? localStorage
        : sessionStorage;
    return storage.getItem("auth-token");
  }

  setToken(token) {
    const storage =
      authConfig.directus.tokenStorage === "local"
        ? localStorage
        : sessionStorage;
    storage.setItem("auth-token", token);
  }

  getRefreshToken() {
    const storage =
      authConfig.directus.tokenStorage === "local"
        ? localStorage
        : sessionStorage;
    return storage.getItem("auth-refresh-token");
  }

  setRefreshToken(token) {
    const storage =
      authConfig.directus.tokenStorage === "local"
        ? localStorage
        : sessionStorage;
    storage.setItem("auth-refresh-token", token);
  }

  clearTokens() {
    const storage =
      authConfig.directus.tokenStorage === "local"
        ? localStorage
        : sessionStorage;
    storage.removeItem("auth-token");
    storage.removeItem("auth-refresh-token");
    storage.removeItem("auth-user");
  }

  // HTTP 方法
  get(url, config = {}) {
    return this.instance.get(url, config);
  }

  post(url, data = {}, config = {}) {
    return this.instance.post(url, data, config);
  }

  put(url, data = {}, config = {}) {
    return this.instance.put(url, data, config);
  }

  patch(url, data = {}, config = {}) {
    return this.instance.patch(url, data, config);
  }

  delete(url, config = {}) {
    return this.instance.delete(url, config);
  }

  // 健康檢查
  async checkHealth() {
    try {
      const response = await this.instance.get("/server/health");
      return {
        available: true,
        status: response.status,
        data: response.data,
      };
    } catch (error) {
      return {
        available: false,
        error: error.message,
      };
    }
  }
}

export const axiosService = new AxiosService();
