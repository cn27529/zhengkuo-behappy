// src/services/monthlyDonateService.js
import { baseService, getApiUrl } from "./baseService.js";
import { DateUtils } from "../utils/dateUtils.js";

export const monthlyDonateService = {
  /**
   * 獲取所有百元贊助記錄
   */
  async getAllMonthlyDonates(params = {}) {
    try {
      if (baseService.mode === "directus") {
        const response = await fetch(
          getApiUrl(baseService.apiEndpoints.itemsMonthlyDonate),
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${
                localStorage.getItem("access_token") || ""
              }`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        return {
          success: true,
          data: data.data || [],
          message: "成功獲取百元贊助記錄",
        };
      } else {
        // Mock 模式
        return {
          success: true,
          data: [],
          message: "Mock 模式：返回空百元贊助記錄列表",
        };
      }
    } catch (error) {
      console.error("❌ 獲取百元贊助記錄失敗:", error);
      return {
        success: false,
        data: [],
        message: `獲取百元贊助記錄失敗: ${error.message}`,
      };
    }
  },

  /**
   * 創建新的百元贊助記錄
   */
  async createMonthlyDonate(donateData) {
    try {
      const currentTime = DateUtils.getCurrentISOTime();
      const donateId = DateUtils.getCurrentISOTime(); // 使用時間作為 donateId

      const newDonate = {
        ...donateData,
        donateId,
        createdAt: currentTime,
        createdUser: this.getCurrentUser(),
        updatedAt: null,
        updatedUser: null,
      };

      if (baseService.mode === "directus") {
        const response = await fetch(
          getApiUrl(baseService.apiEndpoints.itemsMonthlyDonate),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${
                localStorage.getItem("access_token") || ""
              }`,
            },
            body: JSON.stringify(newDonate),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        return {
          success: true,
          data: data.data,
          message: "百元贊助記錄創建成功",
        };
      } else {
        // Mock 模式
        const mockDonate = {
          id: Math.floor(Math.random() * 1000) + 1,
          ...newDonate,
        };

        return {
          success: true,
          data: mockDonate,
          message: "Mock 模式：百元贊助記錄創建成功",
        };
      }
    } catch (error) {
      console.error("❌ 創建百元贊助記錄失敗:", error);
      return {
        success: false,
        data: null,
        message: `創建百元贊助記錄失敗: ${error.message}`,
      };
    }
  },

  /**
   * 更新百元贊助記錄
   */
  async updateMonthlyDonate(id, donateData) {
    try {
      const updateData = {
        ...donateData,
        updatedAt: DateUtils.getCurrentISOTime(),
        updatedUser: this.getCurrentUser(),
      };

      if (baseService.mode === "directus") {
        const response = await fetch(
          getApiUrl(`${baseService.apiEndpoints.itemsMonthlyDonate}/${id}`),
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${
                localStorage.getItem("access_token") || ""
              }`,
            },
            body: JSON.stringify(updateData),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        return {
          success: true,
          data: data.data,
          message: "百元贊助記錄更新成功",
        };
      } else {
        // Mock 模式
        const mockDonate = {
          id,
          ...updateData,
        };

        return {
          success: true,
          data: mockDonate,
          message: "Mock 模式：百元贊助記錄更新成功",
        };
      }
    } catch (error) {
      console.error("❌ 更新百元贊助記錄失敗:", error);
      return {
        success: false,
        data: null,
        message: `更新百元贊助記錄失敗: ${error.message}`,
      };
    }
  },

  /**
   * 刪除百元贊助記錄
   */
  async deleteMonthlyDonate(id) {
    try {
      if (baseService.mode === "directus") {
        const response = await fetch(
          getApiUrl(`${baseService.apiEndpoints.itemsMonthlyDonate}/${id}`),
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${
                localStorage.getItem("access_token") || ""
              }`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return {
          success: true,
          message: "百元贊助記錄刪除成功",
        };
      } else {
        // Mock 模式
        return {
          success: true,
          message: "Mock 模式：百元贊助記錄刪除成功",
        };
      }
    } catch (error) {
      console.error("❌ 刪除百元贊助記錄失敗:", error);
      return {
        success: false,
        message: `刪除百元贊助記錄失敗: ${error.message}`,
      };
    }
  },

  /**
   * 根據 ID 獲取單筆百元贊助記錄
   */
  async getMonthlyDonateById(id) {
    try {
      if (baseService.mode === "directus") {
        const response = await fetch(
          getApiUrl(`${baseService.apiEndpoints.itemsMonthlyDonate}/${id}`),
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${
                localStorage.getItem("access_token") || ""
              }`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        return {
          success: true,
          data: data.data,
          message: "成功獲取百元贊助記錄",
        };
      } else {
        // Mock 模式
        return {
          success: true,
          data: {
            id,
            name: "王小明",
            registrationId: -1,
            donateId: "a8b9c0d",
            donateType: "",
            donateItems: [],
            memo: "2025年十二月贊助",
            createdAt: "2024-10-01T08:00:00.000Z",
            createdUser: "admin",
            updatedAt: "",
            updatedUser: "",
          },
          message: "Mock 模式：返回百元贊助記錄",
        };
      }
    } catch (error) {
      console.error("❌ 獲取百元贊助記錄失敗:", error);
      return {
        success: false,
        data: null,
        message: `獲取百元贊助記錄失敗: ${error.message}`,
      };
    }
  },

  /**
   * 根據 registrationId 獲取百元贊助記錄
   */
  async getMonthlyDonatesByRegistrationId(registrationId) {
    try {
      if (baseService.mode === "directus") {
        const response = await fetch(
          getApiUrl(baseService.apiEndpoints.itemsMonthlyDonate) +
            `?filter[registrationId][_eq]=${registrationId}&sort=-createdAt`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${
                localStorage.getItem("access_token") || ""
              }`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        return {
          success: true,
          data: data.data || [],
          message: "成功獲取該報名記錄的百元贊助記錄",
        };
      } else {
        // Mock 模式
        return {
          success: true,
          data: [
            {
              id: 1,
              name: "王小明",
              registrationId,
              donateId: "a8b9c0d",
              donateType: "",
              donateItems: [],
              memo: "2025年十二月贊助",
              createdAt: "2024-10-01T08:00:00.000Z",
              createdUser: "admin",
              updatedAt: "",
              updatedUser: "",
            },
          ],
          message: "Mock 模式：返回百元贊助記錄列表",
        };
      }
    } catch (error) {
      console.error("❌ 獲取百元贊助記錄失敗:", error);
      return {
        success: false,
        data: [],
        message: `獲取百元贊助記錄失敗: ${error.message}`,
      };
    }
  },

  /**
   * 根據 donateType 獲取百元贊助記錄
   */
  async getMonthlyDonatesByDonateType(donateType) {
    try {
      if (baseService.mode === "directus") {
        const response = await fetch(
          getApiUrl(baseService.apiEndpoints.itemsMonthlyDonate) +
            `?filter[donateType][_eq]=${donateType}&sort=-createdAt`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${
                localStorage.getItem("access_token") || ""
              }`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        return {
          success: true,
          data: data.data || [],
          message: "成功獲取該類型的百元贊助記錄",
        };
      } else {
        // Mock 模式
        return {
          success: true,
          data: [],
          message: "Mock 模式：返回百元贊助記錄列表",
        };
      }
    } catch (error) {
      console.error("❌ 獲取百元贊助記錄失敗:", error);
      return {
        success: false,
        data: [],
        message: `獲取百元贊助記錄失敗: ${error.message}`,
      };
    }
  },

  /**
   * 獲取月度統計
   */
  async getMonthlyDonateStats() {
    try {
      if (baseService.mode === "directus") {
        // 這裡可以根據需要實現統計邏輯
        // 例如：按月份分組統計
        const response = await fetch(
          getApiUrl(baseService.apiEndpoints.itemsMonthlyDonate) +
            "?aggregate[count]=id&groupBy[]=createdAt",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${
                localStorage.getItem("access_token") || ""
              }`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        return {
          success: true,
          data: data.data || [],
          message: "成功獲取百元贊助統計",
        };
      } else {
        // Mock 模式
        return {
          success: true,
          data: [
            { month: "1月", count: 5, totalAmount: 500 },
            { month: "2月", count: 8, totalAmount: 800 },
            { month: "3月", count: 12, totalAmount: 1200 },
          ],
          message: "Mock 模式：返回百元贊助統計",
        };
      }
    } catch (error) {
      console.error("❌ 獲取百元贊助統計失敗:", error);
      return {
        success: false,
        data: [],
        message: `獲取百元贊助統計失敗: ${error.message}`,
      };
    }
  },

  /**
   * 獲取當前登錄用戶
   */
  getCurrentUser() {
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
  },

  /**
   * 獲取當前模式
   */
  getCurrentMode() {
    return baseService.mode;
  },

  /**
   * 設置模式
   */
  setMode(mode) {
    baseService.setMode(mode);
    console.log(`✅ 切換到 ${mode} 模式`);
  },
};
