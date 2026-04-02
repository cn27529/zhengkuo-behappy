// src/services/mergedReceiptsService.js
import { baseService } from "./baseService.js";
import { DateUtils } from "../utils/dateUtils.js";
import { authService } from "./authService.js";

export class MergedReceiptsService {
  // ========== 建構函式 ==========
  constructor() {
    this.serviceName = "MergedReceiptsService";
    this.base = baseService;
    this.endpoint = `${this.base.apiBaseUrl}${this.base.apiEndpoints.itemMergedReceipts}`;
    console.log(`MergedReceiptsService 初始化: 當前模式為 ${this.base.mode}`);
  }

  // ========== CRUD 操作 ==========

  /**
   * 創建新的合併收據記錄
   * @param {Object} receiptData - 合併收據資料
   * @returns {Promise<Object>} 創建結果
   */
  async createMergedReceipt(receiptData) {
    const createISOTime = DateUtils.getCurrentISOTime();

    if (this.base.getIsMock()) {
      console.warn("合併收據創建成功！⚠️ 當前模式不是 directus，無法創建數據");
      return {
        success: true,
        message: "合併收據創建成功！⚠️ 當前模式不是 directus，無法創建數據",
        data: {
          id: crypto.randomUUID(),
          ...receiptData,
          createdAt: createISOTime,
        },
      };
    }

    try {
      console.log("🚀 Directus 服務健康檢查中...");

      // 先檢查連接
      const healthCheck = await this.base.healthCheck();
      if (!healthCheck.online) {
        return {
          success: false,
          online: false,
          message: healthCheck.message,
          data: null,
        };
      }
      console.log("✅ 後端服務健康檢查通過");

      // 準備提交數據
      const processedData = {
        receiptNumber: receiptData.receiptNumber || "",
        receiptType: receiptData.receiptType || "",
        mergeIds: receiptData.mergeIds || [],
        totalAmount: receiptData.totalAmount || 0,
        issuedAt: receiptData.issuedAt || createISOTime,
        issuedBy: receiptData.issuedBy || "",
        notes: receiptData.notes || null,
        createdAt: createISOTime,
        createdUser: authService.getCurrentUser(),
        ...(receiptData.user_created && {
          user_created: receiptData.user_created,
        }),
      };

      const startTime = Date.now();
      const myHeaders = await this.base.getAuthJsonHeaders();
      const apiUrl = `${this.endpoint}`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: myHeaders,
        body: JSON.stringify(processedData),
      });

      const logContext = {
        service: this.serviceName,
        operation: "createMergedReceipt",
        method: "POST",
        startTime: startTime,
        endpoint: `${this.endpoint}`,
        requestBody: processedData,
      };

      const duration = Date.now() - startTime;
      const result = await this.base.handleDirectusResponse(
        response,
        "成功創建合併收據",
        { ...logContext, duration },
      );

      return result;
    } catch (error) {
      console.error("創建合併收據失敗:", error);
      return this.handleMergedReceiptsError(error);
    }
  }

  /**
   * 更新合併收據記錄
   * @param {number|string} recordId - 記錄 ID
   * @param {Object} receiptData - 合併收據資料
   * @returns {Promise<Object>} 更新結果
   */
  async updateMergedReceipt(recordId, receiptData) {
    if (this.base.getIsMock()) {
      console.warn("⚠️ 當前模式不是 directus，無法更新數據");
      return {
        success: false,
        message: "⚠️ 當前模式不是 directus，無法更新數據",
      };
    }

    try {
      const processedData = {
        ...receiptData,
        updatedAt: DateUtils.getCurrentISOTime(),
        updatedUser: authService.getCurrentUser(),
      };

      const startTime = Date.now();
      const myHeaders = await this.base.getAuthJsonHeaders();
      const apiUrl = `${this.endpoint}/${recordId}`;
      const response = await fetch(apiUrl, {
        method: "PATCH",
        headers: myHeaders,
        body: JSON.stringify(processedData),
      });

      const logContext = {
        service: this.serviceName,
        operation: "updateMergedReceipt",
        method: "PATCH",
        startTime: startTime,
        endpoint: `${this.endpoint}/${recordId}`,
        requestBody: processedData,
      };

      const duration = Date.now() - startTime;
      const result = await this.base.handleDirectusResponse(
        response,
        "成功更新合併收據",
        { ...logContext, duration },
      );

      return result;
    } catch (error) {
      console.error(`❌ 更新合併收據失敗 (ID: ${recordId})`, error);
      return this.handleMergedReceiptsError(error);
    }
  }

  /**
   * 刪除合併收據記錄（軟刪除）
   * @param {number|string} recordId - 記錄 ID
   * @returns {Promise<Object>} 刪除結果
   */
  async deleteMergedReceipt(recordId) {
    if (this.base.getIsMock()) {
      console.warn("⚠️ 當前模式不是 directus，無法刪除數據");
      return {
        success: false,
        message: "⚠️ 當前模式不是 directus，無法刪除數據",
      };
    }

    try {
      const currentRecord = await this.getMergedReceiptById(recordId);
      if (!currentRecord) {
        return {
          success: false,
          message: `找不到 ID 為 ${recordId} 的合併收據記錄`,
          data: null,
        };
      }

      console.log("服務器返回的合併收據數據:", currentRecord);

      let processedData = null;
      if (currentRecord.success && currentRecord.data) {
        const recordData = currentRecord.data;
        processedData = {
          ...recordData,
          deletedAt: DateUtils.getCurrentISOTime(),
          deletedUser: authService.getCurrentUser(),
        };
      }

      const startTime = Date.now();
      const myHeaders = await this.base.getAuthJsonHeaders();
      const apiUrl = `${this.endpoint}/${recordId}`;
      const response = await fetch(apiUrl, {
        method: "DELETE",
        headers: myHeaders,
      });

      const logContext = {
        service: this.serviceName,
        operation: "deleteMergedReceipt",
        method: "DELETE",
        startTime: startTime,
        endpoint: `${this.endpoint}/${recordId}`,
        requestBody: processedData,
      };

      const duration = Date.now() - startTime;
      const result = await this.base.handleDirectusResponse(
        response,
        "成功刪除合併收據",
        { ...logContext, duration },
      );

      return result;
    } catch (error) {
      console.error(`❌ 刪除合併收據失敗 (ID: ${recordId})`, error);
      return this.handleMergedReceiptsError(error);
    }
  }

  /**
   * 根據 ID 獲取合併收據記錄
   * @param {number|string} recordId - 記錄 ID
   * @returns {Promise<Object>} 合併收據資料
   */
  async getMergedReceiptById(recordId) {
    if (this.base.getIsMock()) {
      console.warn("⚠️ 當前模式不是 directus，無法獲取數據");
      return {
        success: false,
        message: "⚠️ 當前模式不是 directus，無法獲取數據",
      };
    }

    try {
      const startTime = Date.now();
      const myHeaders = await this.base.getAuthJsonHeaders();
      const apiUrl = `${this.endpoint}/${recordId}?fields=*`;
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: myHeaders,
      });

      const result = await this.base.handleDirectusResponse(
        response,
        "成功獲取合併收據",
      );

      return result;
    } catch (error) {
      console.error(`獲取合併收據 (ID: ${recordId}) 失敗:`, error);
      return this.handleMergedReceiptsError(error);
    }
  }

  /**
   * 獲取所有合併收據記錄
   * @param {Object} params - 查詢參數（過濾、排序等）
   * @returns {Promise<Object>} 合併收據列表
   */
  async getAllMergedReceipts(params = {}) {
    if (this.base.getIsMock()) {
      console.warn("⚠️ 當前模式不是 directus，無法獲取數據");
      return {
        success: false,
        message: "⚠️ 當前模式不是 directus，無法獲取數據",
      };
    }

    try {
      const queryParams = new URLSearchParams();
      queryParams.append("fields", "*");

      // 添加篩選條件
      if (params.filter) {
        Object.keys(params.filter).forEach((key) => {
          const filterValue = params.filter[key];
          if (typeof filterValue === "object") {
            Object.keys(filterValue).forEach((operator) => {
              queryParams.append(
                `filter[${key}][${operator}]`,
                filterValue[operator],
              );
            });
          } else {
            queryParams.append(`filter[${key}]`, filterValue);
          }
        });
      }

      // 添加排序
      if (params.sort) {
        queryParams.append("sort", params.sort);
      } else {
        queryParams.append("sort", "-createdAt"); // 預設按創建時間降序
      }

      // 添加分頁
      if (params.limit) {
        queryParams.append("limit", params.limit);
      }

      if (params.offset) {
        queryParams.append("offset", params.offset);
      }

      const apiUrl = `${this.endpoint}?${queryParams.toString()}`;
      console.log("📡 查詢 URL:", apiUrl);

      const myHeaders = await this.base.getAuthJsonHeaders();
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: myHeaders,
      });

      const result = await this.base.handleDirectusResponse(
        response,
        "成功獲取所有合併收據",
      );
      return result;
    } catch (error) {
      console.error("❌ 獲取合併收據列表失敗:", error);
      return this.handleMergedReceiptsError(error);
    }
  }

  // ========== 查詢方法 ==========

  /**
   * 根據收據類型獲取合併收據
   * @param {string} receiptType - 收據類型（stamp/...）
   * @returns {Promise<Object>} 合併收據列表
   */
  async getMergedReceiptsByType(receiptType) {
    return this.getAllMergedReceipts({
      filter: {
        receiptType: { _eq: receiptType },
      },
      sort: "-issuedAt", // 按開立日期降序排列
    });
  }

  /**
   * 根據收據號獲取 MergedReceipt（支持模糊匹配）
   * @param {string} receiptNo - 收據號
   */
  async getByReceiptNumber(receiptNo) {
    return this.getAllMergedReceipts({
      filter: {
        receiptNumber: { _like: receiptNo },
      },
      sort: "-issuedAt",
    });
  }

  /**
   * 獲取 MergedReceipt 歷史記錄
   * 依建立時間降序排列，支持依狀態縮小範圍
   *
   * @param {Object} options - 選項
   * @param {string} options.state    - 限定狀態
   * @param {number} options.limit    - 返回筆數，預設 50
   * @param {number} options.offset   - 偏移量，預設 0
   
   */
  async getMergedReceiptsHistory(options = {}) {
    const { state, limit = 50, offset = 0 } = options;
    const filter = state
      ? {
          state: { _eq: state },
        }
      : {};

    return this.getAllMergedReceipts({
      filter,
      sort: "-createdAt",
      limit,
      offset,
    });
  }

  /**
   * 根據開立人獲取合併收據
   * @param {string} issuedBy - 開立人
   * @returns {Promise<Object>} 合併收據列表
   */
  async getMergedReceiptsByIssuer(issuedBy) {
    return this.getAllMergedReceipts({
      filter: {
        issuedBy: { _eq: issuedBy },
      },
      sort: "-issuedAt",
    });
  }

  /**
   * 根據日期範圍獲取合併收據
   * @param {string} startDate - 開始日期（ISO 格式）
   * @param {string} endDate - 結束日期（ISO 格式）
   * @returns {Promise<Object>} 合併收據列表
   */
  async getMergedReceiptsByDateRange(startDate, endDate) {
    return this.getAllMergedReceipts({
      filter: {
        issuedAt: {
          _gte: startDate,
          _lte: endDate,
        },
      },
      sort: "-issuedAt",
    });
  }

  /**
   * 計算指定日期範圍的總金額
   * @param {string} startDate - 開始日期（可選）
   * @param {string} endDate - 結束日期（可選）
   * @returns {Promise<Object>} 總金額統計
   */
  async getTotalAmountByDateRange(startDate, endDate) {
    const filter = {};

    if (startDate && endDate) {
      filter.issuedAt = {
        _gte: startDate,
        _lte: endDate,
      };
    } else if (startDate) {
      filter.issuedAt = {
        _gte: startDate,
      };
    } else if (endDate) {
      filter.issuedAt = {
        _lte: endDate,
      };
    }

    const result = await this.getAllMergedReceipts({ filter });

    if (!result.success || !result.data) {
      return {
        success: false,
        total: 0,
        count: 0,
        message: result.message || "獲取總金額失敗",
      };
    }

    const total = result.data.reduce(
      (sum, receipt) => sum + (receipt.totalAmount || 0),
      0,
    );
    const count = result.data.length;

    return {
      success: true,
      total: total,
      count: count,
      message: "成功計算總金額",
    };
  }

  /**
   * 按收據類型統計金額
   * @param {string} startDate - 開始日期（可選）
   * @param {string} endDate - 結束日期（可選）
   * @returns {Promise<Object>} 各類型金額統計
   */
  async getAmountStatsByType(startDate, endDate) {
    const filter = {};

    if (startDate && endDate) {
      filter.issuedAt = {
        _gte: startDate,
        _lte: endDate,
      };
    } else if (startDate) {
      filter.issuedAt = {
        _gte: startDate,
      };
    } else if (endDate) {
      filter.issuedAt = {
        _lte: endDate,
      };
    }

    const result = await this.getAllMergedReceipts({ filter });

    if (!result.success || !result.data) {
      return {
        success: false,
        stats: {},
        message: result.message || "獲取統計資料失敗",
      };
    }

    const stats = {};
    result.data.forEach((receipt) => {
      const type = receipt.receiptType;
      if (!stats[type]) {
        stats[type] = {
          totalAmount: 0,
          count: 0,
          receipts: [],
        };
      }
      stats[type].totalAmount += receipt.totalAmount || 0;
      stats[type].count += 1;
      stats[type].receipts.push({
        id: receipt.id,
        receiptNumber: receipt.receiptNumber,
        totalAmount: receipt.totalAmount,
        issuedAt: receipt.issuedAt,
      });
    });

    return {
      success: true,
      stats: stats,
      message: "成功獲取類型統計",
    };
  }

  /**
   * 獲取最新一筆 MergedReceipt
   * @param {Object} context - 上下文信息
   */
  async getLatestMergedReceipt() {
    return this.getAllMergedReceipts({
      sort: "-createdAt",
      limit: 1,
    });
  }

  /**
   * 根據日期範圍獲取 MergedReceipt（依 issuedDate 過濾）
   *
   * 目前實作：拉取全量資料後在前端過濾（適合資料量小的場景）
   *
   * ⚠️ 若資料量大，建議在 Rust 端擴充：
   *   1. MergedReceiptQuery struct 加入 issued_date_from / issued_date_to: Option<String>
   *   2. get_all_merged_receipts handler 加入對應 WHERE 條件
   *
   * @param {string} dateFrom - 起始日期，ISO 8601 格式
   * @param {string} dateTo   - 結束日期，ISO 8601 格式
   * @param {Object} options  - 額外選項
   * @param {string} options.sort  - 排序，預設 "-id"
   * @param {number} options.limit - 筆數上限
   */
  async getMergedReceiptByDate(dateFrom, dateTo, options = {}) {
    const result = await this.getAllMergedReceipts({
      sort: options.sort || "-id",
      limit: options.limit || 100,
    });

    if (!result.success || !result.data) {
      return {
        success: false,
        data: [],
        message: result.message || "獲取合併收據失敗",
      };
    }

    const filteredData = result.data.filter((receipt) => {
      const issuedAt = new Date(receipt.issuedAt);
      const fromDate = dateFrom ? new Date(dateFrom) : null;
      const toDate = dateTo ? new Date(dateTo) : null;

      if (fromDate && issuedAt < fromDate) {
        return false;
      }
      if (toDate && issuedAt > toDate) {
        return false;
      }
      return true;
    });

    return {
      success: true,
      data: filteredData,
      message: "成功獲取指定日期範圍的合併收據",
    };
  }

  /**
   * 根據狀態獲取 MergedReceipt（走專用路由 /by-state/:state）
   * @param {string} state - 狀態
   */
  async getMergedReceiptByState(state) {
    const result = await this.getAllMergedReceipts({
      filter: {
        state: state,
      },
    });
    return result;
  }

  /**
   * 根據狀態批量獲取多種狀態的 MergedReceipt
   * 使用並發請求取得各狀態結果，並合併回傳
   *
   * @param {string[]} states - 狀態陣列，例如 ["issued", "draft"]
   */
  async getMergedReceiptsByState(states = []) {
    const result = await this.getAllMergedReceipts({
      filter: {
        state: { _in: states },
      },
    });
    return result;
  }

  /**
   * 批量獲取 MergedReceipt
   * @param {number[]} ids - ID 數組
   */
  async getMergedReceiptsByIds(ids) {
    const result = await this.getAllMergedReceipts({
      filter: {
        id: { _in: ids },
      },
    });
    return result;
  }

  /**
   * 搜索 MergedReceipt
   * @param {string} keyword - 搜索關鍵詞 (搜索 receipt_number)
   */
  async searchMergedReceipt(keyword) {
    const result = await this.getAllMergedReceipts({
      filter: {
        receiptNumber: { _contains: keyword },
      },
    });
    return result;
  }

  /**
   * 生成 Mock 資料
   */
  generateMockData() {
    return {
      id: -1,
      receipt_number: "RC-MOCK-99",
      state: "draft",
      registration_ids: [],
      total_amount: 0,
      notes: "這是一個模擬的合併收據",
      issued_date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // ========== 合併操作 ==========

  /**
   * 檢查收據是否已被合併
   * @param {number|string} recordId - 參加記錄(participationRecordDB) ID
   * @returns {Promise<Object>} 檢查結果
   */
  async isReceiptMerged(recordId) {
    const result = await this.getAllMergedReceipts({
      filter: {
        mergeIds: { _contains: recordId },
      },
    });

    if (!result.success) {
      return {
        success: false,
        isMerged: false,
        message: result.message || "檢查失敗",
      };
    }

    const isMerged = result.data && result.data.length > 0;
    const mergedReceipt = isMerged ? result.data[0] : null;

    return {
      success: true,
      isMerged: isMerged,
      mergedReceipt: mergedReceipt,
      message: isMerged ? "收據已被合併" : "收據未被合併",
    };
  }

  // ========== 錯誤處理 ==========
  handleMergedReceiptsError(error) {
    return this.base.handleDirectusError(error);
  }

  // ========== 模式管理 ==========
  getCurrentMode() {
    if (sessionStorage.getItem("auth-mode") !== null) {
      this.base.mode = sessionStorage.getItem("auth-mode");
    }
    console.log("getCurrentMode: ", this.base.mode);
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

export const mergedReceiptsService = new MergedReceiptsService();
