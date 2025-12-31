// src/services/monthlyDonateService.js
import { baseService } from "./baseService.js";
import { DateUtils } from "../utils/dateUtils.js";
import generateGitHash, {
  generateGitHashBrowser,
} from "../utils/generateGitHash.js";

export class MonthlyDonateService {
  // ========== 建構函式 ==========
  constructor() {
    this.serviceName = "MonthlyDonateService";
    this.base = baseService;
    this.endpoint = `${this.base.apiBaseUrl}${this.base.apiEndpoints.itemsMonthlyDonate}`;
    console.log(`MonthlyDonateService 初始化: 當前模式為 ${this.base.mode}`);
  }

  // ========== 核心 CRUD 方法 ==========
  /**
   * 獲取所有百元贊助記錄
   */
  async getAllMonthlyDonates(params = {}) {
    if (this.base.mode !== "directus") {
      console.warn("⚠️ 當前模式不為 Directus，返回空百元贊助記錄列表");
      // Mock 模式
      return {
        success: true,
        data: [],
        message: "Mock 模式：返回空百元贊助記錄列表",
      };
    }

    try {
      const queryParams = new URLSearchParams({
        sort: "-createdAt",
        ...params,
      }).toString();

      const apiUrl = `${this.endpoint}?${queryParams}`;
      const myHeaders = await this.base.getAuthJsonHeaders();
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: myHeaders,
      });

      const result = await this.base.handleDirectusResponse(
        response,
        "成功獲取百元贊助記錄"
      );
      return result;
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
   * 創建新的百元贊助人
   */
  async createMonthlyDonate(donateData) {
    const createISOTime = DateUtils.getCurrentISOTime();
    const donateId = await generateGitHashBrowser(createISOTime);
    const recordId = crypto.randomUUID(); // 標準且保證唯一
    const processedData = {
      id: recordId,
      ...donateData,
      donateId,
      createdAt: createISOTime,
    };

    if (this.base.mode !== "directus") {
      // Mock 模式
      console.warn("⚠️ 當前模式不為 Directus，百元贊助人創建成功");
      return {
        success: true,
        data: processedData,
        message: "Mock 模式：百元贊助人創建成功",
      };
    }

    try {
      const startTime = Date.now();
      const logContext = {
        service: this.serviceName,
        operation: "createMonthlyDonate",
        method: "POST",
        startTime: startTime,
        endpoint: this.endpoint,
        requestBody: processedData, // ✅ 記錄請求 body
      };

      const myHeaders = await this.base.getAuthJsonHeaders();
      const apiUrl = `${this.endpoint}`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: myHeaders,
        body: JSON.stringify(processedData),
      });

      // 計算實際耗時
      const duration = Date.now() - startTime;
      const result = await this.base.handleDirectusResponse(
        response,
        "成功創建百元贊助人",
        { ...logContext, duration }
      );
      return result;
    } catch (error) {
      console.error("❌ 創建百元贊助人失敗:", error);
      return this.handleDirectusError(error);
    }
  }

  /**
   * 更新百元贊助人
   */
  async updateMonthlyDonate(recordId, donateData) {
    const updateData = {
      ...donateData,
      updatedAt: DateUtils.getCurrentISOTime(),
      id: recordId,
    };

    if (this.base.mode !== "directus") {
      // Mock 模式
      const mockData = {
        ...updateData,
      };

      console.warn("⚠️ 當前模式不為 Directus，百元贊助人更新成功");
      return {
        success: true,
        data: mockData,
        message: "Mock 模式：百元贊助人更新成功",
      };
    }

    try {
      const startTime = Date.now();
      const logContext = {
        service: "MonthlyDonateService",
        operation: "updateMonthlyDonate",
        method: "PATCH",
        startTime: startTime,
        endpoint: `${this.endpoint}/${recordId}`,
        requestBody: updateData, // ✅ 記錄請求 body
      };

      const myHeaders = await this.base.getAuthJsonHeaders();
      const apiUrl = `${this.endpoint}/${recordId}`;
      const response = await fetch(apiUrl, {
        method: "PATCH",
        headers: myHeaders,
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const duration = Date.now() - startTime;
      const result = await this.base.handleDirectusResponse(
        response,
        "成功更新百元贊助人",
        { ...logContext, duration }
      );
      return result;
    } catch (error) {
      console.error("❌ 更新百元贊助人失敗:", error);
      return this.handleDirectusError(error);
    }
  }

  /**
   * 刪除百元贊助人
   */
  async deleteMonthlyDonate(recordId) {
    if (this.base.mode !== "directus") {
      // Mock 模式
      console.warn("⚠️ 當前模式不為 Directus，百元贊助人刪除成功");
      return {
        success: true,
        message: "Mock 模式：百元贊助人刪除成功",
      };
    }

    const currentDelete = await this.getMonthlyDonateById(recordId);
    if (!currentDelete) {
      return {
        success: false,
        message: `找不到 ID 為 ${recordId} 的百元贊助人`,
        data: null,
      };
    }

    const startTime = Date.now();
    const logContext = {
      service: "MonthlyDonateService",
      operation: "deleteMonthlyDonate",
      method: "DELETE",
      startTime: startTime,
      endpoint: `${this.endpoint}/${recordId}`,
      requestBody: currentDelete, // Log 刪除的資料
    };

    try {
      const myHeaders = await this.base.getAuthJsonHeaders();
      const apiUrl = `${this.endpoint}/${recordId}`;
      const response = await fetch(apiUrl, {
        method: "DELETE",
        headers: myHeaders,
      });

      const duration = Date.now() - startTime;
      const result = await this.base.handleDirectusResponse(
        response,
        "成功刪除百元贊助人",
        { ...logContext, duration }
      );
      return result;
    } catch (error) {
      console.error(`刪除百元贊助人失敗 (ID: ${recordId})`, error);
      return this.handleDirectusError(error);
    }
  }

  // ========== donateItems 操作方法 ==========

  /**
   * 新增指定贊助記錄
   */
  async addDonateItem(donateId, itemData) {
    const donateItemsId = generateGitHash();
    const newDonateItem = {
      ...itemData,
      donateItemsId: donateItemsId,
      createdAt: DateUtils.getCurrentISOTime(),
    };

    if (this.base.mode !== "directus") {
      // Mock 模式
      console.warn("⚠️ 當前模式不為 Directus，贊助項目添加成功");
      return {
        success: true,
        data: newDonateItem,
        message: "Mock 模式：贊助項目添加成功",
      };
    }

    try {
      // 先獲取現有的贊助記錄
      const donateResponse = await this.getMonthlyDonateById(donateId);

      if (!donateResponse.success) {
        return donateResponse;
      }

      const currentDonate = donateResponse.data;
      // 添加新項目到 donateItems 數組
      const updatedDonateItems = [
        ...(currentDonate.donateItems || []),
        newDonateItem,
      ];

      // 更新整個贊助記錄
      const processedData = {
        donateItems: updatedDonateItems,
        updatedAt: DateUtils.getCurrentISOTime(),
      };

      // ✅ 在 try 外面定義，確保 catch 也能訪問
      const startTime = Date.now();
      const logContext = {
        service: "MonthlyDonateService",
        operation: "addDonateItem",
        method: "PATCH",
        startTime: startTime,
        endpoint: `${this.endpoint}/${donateId}`,
        requestBody: processedData,
      };

      const myHeaders = await this.base.getAuthJsonHeaders();
      const apiUrl = `${this.endpoint}/${donateId}`;
      const response = await fetch(apiUrl, {
        method: "PATCH",
        headers: myHeaders,
        body: JSON.stringify(processedData),
      });

      const duration = Date.now() - startTime;
      const result = await this.base.handleDirectusResponse(
        response,
        "成功添加贊助項目",
        { ...logContext, duration }
      );
      return result;
    } catch (error) {
      console.error("❌ 添加贊助項目失敗:", error);
      return this.handleDirectusError(error);
    }
  }

  /**
   * 更新指定贊助記錄
   */
  async updateDonateItem(recordId, donateItemsId, itemData) {
    if (this.base.mode !== "directus") {
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
    }

    try {
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

      const startTime = Date.now();
      const logContext = {
        service: "MonthlyDonateService",
        operation: "updateDonateItem",
        method: "PATCH",
        startTime: startTime,
        endpoint: `${this.endpoint}/${recordId}`,
        requestBody: updateData,
      };

      const myHeaders = await this.base.getAuthJsonHeaders();
      const apiUrl = `${this.endpoint}/${recordId}`;
      const response = await fetch(apiUrl, {
        method: "PATCH",
        headers: myHeaders,
        body: JSON.stringify(updateData),
      });

      const duration = Date.now() - startTime;
      const result = await this.base.handleDirectusResponse(
        response,
        "成功更新贊助項目",
        { ...logContext, duration }
      );
      return result;
    } catch (error) {
      console.error("❌ 更新贊助項目失敗:", error);
      console.error(
        `❌ 更新贊助項目失敗 (ID: ${recordId} donateItemsId: ${donateItemsId}) ${error.message}`
      );
      return {
        success: false,
        data: null,
        message: `更新贊助項目失敗: ${error.message}`,
      };
    }
  }

  /**
   * 刪除指定贊助記錄
   */
  async deleteDonateItem(recordId, itemsId) {
    if (this.base.mode !== "directus") {
      // Mock 模式
      console.warn("⚠️ 當前模式不為 Directus，贊助項目刪除成功");
      return {
        success: true,
        message: "Mock 模式：贊助項目刪除成功",
      };
    }

    try {
      // 先獲取現有的贊助記錄
      const donateResponse = await this.getMonthlyDonateById(recordId);

      if (!donateResponse.success) {
        return donateResponse;
      }

      const currentDonate = donateResponse.data;
      let donateItems = currentDonate.donateItems || [];

      let currentDelete = donateItems.find(
        (item) => item.donateItemsId === itemsId
      );
      if (!currentDelete) {
        return {
          success: false,
          message: `找不到 donateItemsId 為 ${itemsId} 的贊助項目`,
        };
      }

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

      const startTime = Date.now();
      const logContext = {
        service: "MonthlyDonateService",
        operation: "deleteDonateItem",
        method: "PATCH",
        startTime: startTime,
        endpoint: `${this.endpoint}/${recordId}`,
        requestBody: currentDelete, // Log 刪除的資料
      };

      const myHeaders = await this.base.getAuthJsonHeaders();
      const apiUrl = `${this.endpoint}/${recordId}`;
      const response = await fetch(apiUrl, {
        method: "PATCH",
        headers: myHeaders,
        body: JSON.stringify(updateData),
      });

      const duration = Date.now() - startTime;
      const result = await this.base.handleDirectusResponse(
        response,
        "成功刪除贊助項目",
        { ...logContext, duration }
      );
      return result;
    } catch (error) {
      console.error(
        `❌ 刪除贊助項目失敗: (ID: ${recordId}, itemsId: ${itemsId}) ${error.message}`
      );
      return this.handleDirectusError(error);
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
   * 根據 ID 獲取單筆百元贊助人
   */
  async getMonthlyDonateById(recordId) {
    try {
      if (this.base.mode !== "directus") {
        // Mock 模式
        console.warn("⚠️ 當前模式不為 Directus，返回百元贊助記錄");
        return {
          success: true,
          data: this.generateMockData(),
          message: "Mock 模式：返回百元贊助記錄",
        };
      } else {
        const myHeaders = await this.base.getAuthJsonHeaders();
        const apiUrl = `${this.endpoint}/${recordId}`;
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: myHeaders,
        });

        const result = await this.base.handleDirectusResponse(
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

  /**
   * 根據 donateId 獲取百元贊助人
   */
  async getMonthlyDonateByDonateId(donateId) {
    try {
      if (this.base.mode !== "directus") {
        // Mock 模式
        console.warn("⚠️ 當前模式不為 Directus，返回百元贊助記錄列表");
        return {
          success: true,
          data: [this.generateMockData()],
          message: "Mock 模式：返回百元贊助記錄列表",
        };
      } else {
        const queryParams = new URLSearchParams({
          "filter[donateId][_eq]": donateId,
          sort: "-createdAt",
        }).toString();
        const apiUrl = `${this.endpoint}?${queryParams}`;

        const myHeaders = await this.base.getAuthJsonHeaders();
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: myHeaders,
        });

        const result = await this.base.handleDirectusResponse(
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
   * 根據 registrationId 獲取百元贊助人
   */
  async getMonthlyDonateByRegistrationId(registrationId) {
    try {
      if (this.base.mode !== "directus") {
        // Mock 模式
        console.warn("⚠️ 當前模式不為 Directus，返回百元贊助記錄列表");
        return {
          success: true,
          data: this.generateMockData(),
          message: "Mock 模式：返回百元贊助記錄列表",
        };
      } else {
        const queryParams = new URLSearchParams({
          "filter[registrationId][_eq]": registrationId,
          sort: "-createdAt",
        }).toString();
        const apiUrl = `${this.endpoint}?${queryParams}`;
        const myHeaders = await this.base.getAuthJsonHeaders();
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: myHeaders,
        });

        const result = await this.base.handleDirectusResponse(
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
   * 根據 donateType 獲取百元贊助人
   */
  async getMonthlyDonatesByDonateType(donateType) {
    try {
      if (this.base.mode !== "directus") {
        // Mock 模式
        console.warn("⚠️ 當前模式不為 Directus，返回百元贊助記錄列表");
        return {
          success: true,
          data: [],
          message: "Mock 模式：返回百元贊助記錄列表",
        };
      } else {
        const queryParams = new URLSearchParams({
          "filter[donateType][_eq]": donateType,
          sort: "-createdAt",
        }).toString();
        const apiUrl = `${this.endpoint}?${queryParams}`;
        const myHeaders = await this.base.getAuthJsonHeaders();
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: myHeaders,
        });

        const result = await this.base.handleDirectusResponse(
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
      if (this.base.mode !== "directus") {
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
        const queryParams = new URLSearchParams({
          "aggregate[count]": "id",
          "groupBy[]": "createdAt",
        }).toString();
        const apiUrl = `${this.endpoint}?${queryParams}`;
        const myHeaders = await this.base.getAuthJsonHeaders();
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: myHeaders,
        });

        const result = await this.base.handleDirectusResponse(
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

  // ========== 錯誤處理 ==========
  handleDirectusError(error) {
    // 檢查網路錯誤
    if (
      error.message.includes("Failed to fetch") ||
      error.message.includes("NetworkError")
    ) {
      return {
        success: false,
        message: "Directus 服務未啟動或網路連接失敗",
        errorCode: "DIRECTUS_NOT_AVAILABLE",
        details: "請確保 Directus 服務正在運行",
      };
    }

    // 檢查認證錯誤
    if (error.message.includes("401") || error.message.includes("token")) {
      return {
        success: false,
        message: "認證失敗，請重新登入",
        errorCode: "UNAUTHORIZED",
        details: error.message,
      };
    }

    // 檢查權限錯誤
    if (error.message.includes("403")) {
      return {
        success: false,
        message: "沒有操作權限",
        errorCode: "FORBIDDEN",
        details: error.message,
      };
    }

    return {
      success: false,
      message: "Directus 操作失敗",
      errorCode: "DIRECTUS_ERROR",
      details: error.message,
    };
  }

  // ========== 模式管理 ==========
  getCurrentMode() {
    return this.base.mode;
  }

  setMode(mode) {
    if (["mock", "backend", "directus"].includes(mode)) {
      this.base.mode = mode;
      console.log(`✅ 切換到 ${mode} 模式`);
    } else {
      console.warn('無效的模式，請使用 "mock", "backend" 或 "directus"');
    }
  }
}

export const monthlyDonateService = new MonthlyDonateService();
