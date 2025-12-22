// src/services/monthlyDonateService.js
import { baseService, getApiUrl } from "./baseService.js";
import { DateUtils } from "../utils/dateUtils.js";
import generateGitHash, {
  generateGitHashBrowser,
} from "../utils/generateGitHash.js";

export class MonthlyDonateService {
  // ========== 建構函式 ==========
  constructor() {
    console.log(`MonthlyDonateService 初始化: 當前模式為 ${baseService.mode}`);
  }

  /**
   * 獲取所有百元贊助記錄
   */
  async getAllMonthlyDonates(params = {}) {
    try {
      if (baseService.mode !== "directus") {
        console.warn("⚠️ 當前模式不為 Directus，返回空百元贊助記錄列表");
        // Mock 模式
        return {
          success: true,
          data: [],
          message: "Mock 模式：返回空百元贊助記錄列表",
        };
      } else {
        const queryParams = new URLSearchParams({
          sort: "-createdAt",
          ...params,
        }).toString();

        const url = getApiUrl(baseService.apiEndpoints.itemsMonthlyDonate);
        const apiUrl = `${url}?${queryParams}`;
        const myHeaders = await baseService.getAuthJsonHeaders();
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: myHeaders,
        });

        const result = await baseService.handleDirectusResponse(
          response,
          "成功獲取百元贊助記錄"
        );
        return result;
      }
    } catch (error) {
      console.error("❌ 獲取百元贊助記錄失敗:", error);
      return {
        success: false,
        data: [],
        message: `獲取百元贊助記錄失敗: ${error.message}`,
      };
    }
  }

  /**
   * 創建新的百元贊助記錄
   */
  async createMonthlyDonate(donateData) {
    try {
      const createISOTime = DateUtils.getCurrentISOTime();
      const donateId = await generateGitHashBrowser(createISOTime);

      const newDonate = {
        ...donateData,
        donateId,
        createdAt: createISOTime,
        updatedAt: "",
        updatedUser: "",
      };

      if (baseService.mode !== "directus") {
        // Mock 模式
        const mockDonate = {
          id: Math.floor(Math.random() * 1000) + 1,
          ...newDonate,
        };

        console.warn("⚠️ 當前模式不為 Directus，百元贊助記錄創建成功");
        return {
          success: true,
          data: mockDonate,
          message: "Mock 模式：百元贊助記錄創建成功",
        };
      } else {
        const myHeaders = await baseService.getAuthJsonHeaders();
        const url = getApiUrl(baseService.apiEndpoints.itemsMonthlyDonate);
        const apiUrl = `${url}`;
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: myHeaders,
          body: JSON.stringify(newDonate),
        });

        const result = await baseService.handleDirectusResponse(
          response,
          "成功創建百元贊助記錄"
        );
        return result;
      }
    } catch (error) {
      console.error("❌ 創建百元贊助記錄失敗:", error);
      return {
        success: false,
        data: null,
        message: `創建百元贊助記錄失敗: ${error.message}`,
      };
    }
  }

  /**
   * 更新百元贊助記錄
   */
  async updateMonthlyDonate(id, donateData) {
    try {
      const updateData = {
        ...donateData,
      };

      if (baseService.mode !== "directus") {
        // Mock 模式
        const mockDonate = {
          id,
          ...updateData,
        };

        console.warn("⚠️ 當前模式不為 Directus，百元贊助記錄更新成功");
        return {
          success: true,
          data: mockDonate,
          message: "Mock 模式：百元贊助記錄更新成功",
        };
      } else {
        const myHeaders = await baseService.getAuthJsonHeaders();
        const url = `${getApiUrl(
          baseService.apiEndpoints.itemsMonthlyDonate
        )}/${id}`;
        const apiUrl = `${url}`;
        const response = await fetch(apiUrl, {
          method: "PATCH",
          headers: myHeaders,
          body: JSON.stringify(updateData),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await baseService.handleDirectusResponse(
          response,
          "成功更新百元贊助記錄"
        );
        return result;
      }
    } catch (error) {
      console.error("❌ 更新百元贊助記錄失敗:", error);
      return {
        success: false,
        data: null,
        message: `更新百元贊助記錄失敗: ${error.message}`,
      };
    }
  }

  /**
   * 刪除百元贊助記錄
   */
  async deleteMonthlyDonate(id) {
    try {
      if (baseService.mode !== "directus") {
        // Mock 模式
        console.warn("⚠️ 當前模式不為 Directus，百元贊助記錄刪除成功");
        return {
          success: true,
          message: "Mock 模式：百元贊助記錄刪除成功",
        };
      } else {
        const myHeaders = await baseService.getAuthJsonHeaders();
        const url = `${baseService.apiEndpoints.itemsMonthlyDonate}/${id}`;
        const apiUrl = `${url}`;
        const response = await fetch(apiUrl, {
          method: "DELETE",
          headers: myHeaders,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return {
          success: true,
          message: "百元贊助記錄刪除成功",
        };
      }
    } catch (error) {
      console.error("❌ 刪除百元贊助記錄失敗:", error);
      return {
        success: false,
        message: `刪除百元贊助記錄失敗: ${error.message}`,
      };
    }
  }

  // ========== donateItems 操作方法 ==========

  /**
   * 新增 donateItem 到指定贊助記錄
   */
  async addDonateItem(donateId, itemData) {
    try {
      if (baseService.mode !== "directus") {
        // Mock 模式
        const newDonateItem = {
          ...itemData,
          donateItemsId: DateUtils.getCurrentISOTime(),
          createdAt: DateUtils.getCurrentISOTime(),
          createdUser: "admin",
          updatedAt: "",
          updatedUser: "",
        };

        console.warn("⚠️ 當前模式不為 Directus，贊助項目添加成功");
        return {
          success: true,
          data: newDonateItem,
          message: "Mock 模式：贊助項目添加成功",
        };
      } else {
        // 先獲取現有的贊助記錄
        const donateResponse = await this.getMonthlyDonateById(donateId);

        if (!donateResponse.success) {
          return donateResponse;
        }

        const currentDonate = donateResponse.data;
        const newDonateItem = {
          ...itemData,
          donateItemsId: generateGitHash(),
        };

        // 添加新項目到 donateItems 數組
        const updatedDonateItems = [
          ...(currentDonate.donateItems || []),
          newDonateItem,
        ];

        // 更新整個贊助記錄
        const updateData = {
          donateItems: updatedDonateItems,
        };

        const myHeaders = await baseService.getAuthJsonHeaders();
        const url = getApiUrl(
          `${baseService.apiEndpoints.itemsMonthlyDonate}/${donateId}`
        );
        const apiUrl = `${url}`;
        const response = await fetch(apiUrl, {
          method: "PATCH",
          headers: myHeaders,
          body: JSON.stringify(updateData),
        });

        const result = await baseService.handleDirectusResponse(
          response,
          "成功添加贊助項目"
        );
        return result;
      }
    } catch (error) {
      console.error("❌ 添加贊助項目失敗:", error);
      return {
        success: false,
        data: null,
        message: `添加贊助項目失敗: ${error.message}`,
      };
    }
  }

  /**
   * 更新指定 donateItem
   */
  async updateDonateItem(recordId, donateItemsId, itemData) {
    try {
      if (baseService.mode !== "directus") {
        // Mock 模式
        const updatedItem = {
          donateItemsId,
          ...itemData,
        };

        console.warn("⚠️ 當前模式不為 Directus，贊助項目更新成功");
        return {
          success: true,
          data: updatedItem,
          message: "Mock 模式：贊助項目更新成功",
        };
      } else {
        // 先獲取現有的贊助記錄
        const donateResponse = await this.getMonthlyDonateById(recordId);

        if (!donateResponse.success) {
          return donateResponse;
        }

        const currentDonate = donateResponse.data;
        const donateItems = currentDonate.donateItems || [];

        // 找到要更新的項目索引
        const itemIndex = donateItems.findIndex(
          (item) => item.donateItemsId === donateItemsId
        );

        if (itemIndex === -1) {
          return {
            success: false,
            data: null,
            message: `找不到 donateItemsId 為 ${donateItemsId} 的贊助項目`,
          };
        }

        // 更新項目
        const updatedItem = {
          ...donateItems[itemIndex],
          ...itemData,
        };

        donateItems[itemIndex] = updatedItem;

        // 更新整個贊助記錄
        const updateData = {
          donateItems: donateItems,
        };

        const myHeaders = await baseService.getAuthJsonHeaders();
        const utl = getApiUrl(
          `${baseService.apiEndpoints.itemsMonthlyDonate}/${recordId}`
        );
        const apiUrl = `${utl}`;
        const response = await fetch(apiUrl, {
          method: "PATCH",
          headers: myHeaders,
          body: JSON.stringify(updateData),
        });

        const result = await baseService.handleDirectusResponse(
          response,
          "成功更新贊助項目"
        );
        return result;
      }
    } catch (error) {
      console.error("❌ 更新贊助項目失敗:", error);
      return {
        success: false,
        data: null,
        message: `更新贊助項目失敗: ${error.message}`,
      };
    }
  }

  /**
   * 刪除指定 donateItem
   */
  async deleteDonateItem(recordId, itemsId) {
    try {
      if (baseService.mode !== "directus") {
        // Mock 模式
        console.warn("⚠️ 當前模式不為 Directus，贊助項目刪除成功");
        return {
          success: true,
          message: "Mock 模式：贊助項目刪除成功",
        };
      } else {
        // 先獲取現有的贊助記錄
        const donateResponse = await this.getMonthlyDonateById(recordId);

        if (!donateResponse.success) {
          return donateResponse;
        }

        const currentDonate = donateResponse.data;
        let donateItems = currentDonate.donateItems || [];

        // 過濾掉要刪除的項目
        const originalLength = donateItems.length;
        donateItems = donateItems.filter(
          (item) => item.donateItemsId !== itemsId
        );

        if (originalLength === donateItems.length) {
          return {
            success: false,
            message: `找不到 donateItemsId 為 ${itemsId} 的贊助項目`,
          };
        }

        // 更新整個贊助記錄
        const updateData = {
          donateItems: donateItems,
        };

        const myHeaders = await baseService.getAuthJsonHeaders();
        const url = getApiUrl(
          `${baseService.apiEndpoints.itemsMonthlyDonate}/${recordId}`
        );
        const apiUrl = `${url}`;
        const response = await fetch(apiUrl, {
          method: "PATCH",
          headers: myHeaders,
          body: JSON.stringify(updateData),
        });

        const result = await baseService.handleDirectusResponse(
          response,
          "成功刪除贊助項目"
        );
        return result;
      }
    } catch (error) {
      console.error("❌ 刪除贊助項目失敗:", error);
      return {
        success: false,
        message: `刪除贊助項目失敗: ${error.message}`,
      };
    }
  }

  /*
   * 生成 Mock 資料
   */
  generateMockData() {
    return {
      id: -1,
      name: "王小明",
      registrationId: -1,
      donateId: generateGitHash("mock data"),
      donateType: "",
      donateItems: [],
      memo: "mock data",
      createdAt: "1911-11-11T08:00:00.000Z",
      createdUser: "mock user",
      updatedAt: "1911-11-11T08:00:00.000Z",
      updatedUser: "mock user",
    };
  }

  /**
   * 根據 ID 獲取單筆百元贊助記錄
   */
  async getMonthlyDonateById(recordId) {
    try {
      if (baseService.mode !== "directus") {
        // Mock 模式
        console.warn("⚠️ 當前模式不為 Directus，返回百元贊助記錄");
        return {
          success: true,
          data: this.generateMockData(),
          message: "Mock 模式：返回百元贊助記錄",
        };
      } else {
        const myHeaders = await baseService.getAuthJsonHeaders();
        const url = `${getApiUrl(
          baseService.apiEndpoints.itemsMonthlyDonate
        )}/${recordId}`;
        const apiUrl = `${url}`;
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: myHeaders,
        });

        const result = await baseService.handleDirectusResponse(
          response,
          "成功獲取百元贊助記錄"
        );
        return result;
      }
    } catch (error) {
      console.error("❌ 獲取百元贊助記錄失敗:", error);
      return {
        success: false,
        data: null,
        message: `獲取百元贊助記錄失敗: ${error.message}`,
      };
    }
  }

  async getMonthlyDonateByDonateId(donateId) {
    try {
      if (baseService.mode !== "directus") {
        // Mock 模式
        console.warn("⚠️ 當前模式不為 Directus，返回百元贊助記錄列表");
        return {
          success: true,
          data: [this.generateMockData()],
          message: "Mock 模式：返回百元贊助記錄列表",
        };
      } else {
        const url = getApiUrl(baseService.apiEndpoints.itemsMonthlyDonate);
        const queryParams = new URLSearchParams({
          "filter[donateId][_eq]": donateId,
          sort: "-createdAt",
        }).toString();
        const apiUrl = `${url}?${queryParams}`;

        const myHeaders = await baseService.getAuthJsonHeaders();
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: myHeaders,
        });

        const result = await baseService.handleDirectusResponse(
          response,
          "成功獲取百元贊助記錄列表"
        );
        return result;
      }
    } catch (error) {
      console.error("❌ 獲取百元贊助記錄失敗:", error);
      return {
        success: false,
        data: [],
        message: `獲取百元贊助記錄失敗: ${error.message}`,
      };
    }
  }

  /**
   * 根據 registrationId 獲取百元贊助記錄
   */
  async getMonthlyDonateByRegistrationId(registrationId) {
    try {
      if (baseService.mode !== "directus") {
        // Mock 模式
        console.warn("⚠️ 當前模式不為 Directus，返回百元贊助記錄列表");
        return {
          success: true,
          data: this.generateMockData(),
          message: "Mock 模式：返回百元贊助記錄列表",
        };
      } else {
        const url = getApiUrl(baseService.apiEndpoints.itemsMonthlyDonate);
        const queryParams = new URLSearchParams({
          "filter[registrationId][_eq]": registrationId,
          sort: "-createdAt",
        }).toString();
        const apiUrl = `${url}?${queryParams}`;
        const myHeaders = await baseService.getAuthJsonHeaders();
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: myHeaders,
        });

        const result = await baseService.handleDirectusResponse(
          response,
          "成功獲取百元贊助記錄列表"
        );
        return result;
      }
    } catch (error) {
      console.error("❌ 獲取百元贊助記錄失敗:", error);
      return {
        success: false,
        data: [],
        message: `獲取百元贊助記錄失敗: ${error.message}`,
      };
    }
  }

  /**
   * 根據 donateType 獲取百元贊助記錄
   */
  async getMonthlyDonatesByDonateType(donateType) {
    try {
      if (baseService.mode !== "directus") {
        // Mock 模式
        console.warn("⚠️ 當前模式不為 Directus，返回百元贊助記錄列表");
        return {
          success: true,
          data: [],
          message: "Mock 模式：返回百元贊助記錄列表",
        };
      } else {
        const url = getApiUrl(baseService.apiEndpoints.itemsMonthlyDonate);
        const queryParams = new URLSearchParams({
          "filter[donateType][_eq]": donateType,
          sort: "-createdAt",
        }).toString();
        const apiUrl = `${url}?${queryParams}`;
        const myHeaders = await baseService.getAuthJsonHeaders();
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: myHeaders,
        });

        const result = await baseService.handleDirectusResponse(
          response,
          "成功獲取百元贊助記錄列表"
        );
        return result;
      }
    } catch (error) {
      console.error("❌ 獲取百元贊助記錄失敗:", error);
      return {
        success: false,
        data: [],
        message: `獲取百元贊助記錄失敗: ${error.message}`,
      };
    }
  }

  /**
   * 獲取月度統計
   */
  async getMonthlyDonateStats() {
    try {
      if (baseService.mode !== "directus") {
        // Mock 模式
        console.warn("⚠️ 當前模式不為 Directus，返回百元贊助統計");
        return {
          success: true,
          data: [
            { month: "1月", count: 5, totalAmount: 500 },
            { month: "2月", count: 8, totalAmount: 800 },
            { month: "3月", count: 12, totalAmount: 1200 },
          ],
          message: "Mock 模式：返回百元贊助統計",
        };
      } else {
        const url = getApiUrl(baseService.apiEndpoints.itemsMonthlyDonate);
        const queryParams = new URLSearchParams({
          "aggregate[count]": "id",
          "groupBy[]": "createdAt",
        }).toString();
        const apiUrl = `${url}?${queryParams}`;
        const myHeaders = await baseService.getAuthJsonHeaders();
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: myHeaders,
        });

        const result = await baseService.handleDirectusResponse(
          response,
          "成功獲取百元贊助統計"
        );
        return result;
      }
    } catch (error) {
      console.error("❌ 獲取百元贊助統計失敗:", error);
      return {
        success: false,
        data: [],
        message: `獲取百元贊助統計失敗: ${error.message}`,
      };
    }
  }

  /**
   * 獲取當前登錄用戶
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

  /**
   * 獲取當前模式
   */
  getCurrentMode() {
    return baseService.mode;
  }

  /**
   * 設置模式
   */
  setMode(mode) {
    baseService.setMode(mode);
    console.log(`✅ 切換到 ${mode} 模式`);
  }
}

export const monthlyDonateService = new MonthlyDonateService();
