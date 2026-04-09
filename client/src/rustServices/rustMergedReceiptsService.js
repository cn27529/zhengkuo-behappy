// src/rustServices/rustMergedReceiptsService.js
import { DateUtils } from "../utils/dateUtils.js";
import { baseRustService } from "./baseRustService.js";

// 合併打印表（mergedReceiptsDB）相關服務
export class RustMergedReceiptsService {
  constructor() {
    this.serviceName = "RustMergedReceiptsService";
    this.base = baseRustService;
    this.endpoint = this.base.endpoints.mergedReceipts || "merged-receipts";
    console.log(
      `RustMergedReceiptsService 初始化: 當前模式為 ${this.base.mode}`,
    );
  }

  // ========== CRUD 操作 ==========

  /**
   * 獲取所有 MergedReceipt
   * @param {Object} params - 查詢參數
   * @param {string} params.sort - 排序字段，例如 "id" 或 "-id" (降序)
   * @param {number} params.limit - 每頁數量
   * @param {number} params.offset - 偏移量
   * @param {Object} params.filter - 過濾條件
   * @param {string} params.filter.state - 狀態 (精確匹配)
   * @param {string} params.filter.receipt_number - 收據號 (LIKE 查詢)
   * @param {Object} context - 上下文信息
   */
  async getAllMergedReceipts(params = {}, context = {}) {
    console.log("🦀 [Rust] 服務器獲取合併打印資料...");

    const queryParams = new URLSearchParams();

    if (params.sort) {
      queryParams.append("sort", params.sort);
    } else {
      queryParams.append("sort", "-createdAt"); // 預設 createdAt 大到小
    }

    if (params.limit) {
      queryParams.append("limit", params.limit);
    }

    if (params.offset) {
      queryParams.append("offset", params.offset);
    }

    if (params.filter) {
      Object.entries(params.filter).forEach(([key, value]) => {
        if (typeof value === "object") {
          if (value._eq) queryParams.append(key, value._eq);
          else if (value._like) queryParams.append(key, value._like);
        } else {
          queryParams.append(key, value);
        }
      });
    }

    const apiUrl = `${this.endpoint}?${queryParams.toString()}`;

    try {
      const result = await this.base.rustFetch(
        apiUrl,
        { method: "GET" },
        { operation: "getAllMergedReceipts", params, ...context },
      );
      return result;
    } catch (error) {
      console.error("❌ 獲取合併打印失敗:", error);
      return this.handleMergedReceiptsError(error);
    }
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
      notes: "這是一個模擬的合併打印",
      issued_date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * 根據 ID 獲取單筆 MergedReceipt
   * @param {number} id - 收據 ID
   * @param {Object} context - 上下文信息
   */
  async getMergedReceiptById(id, context = {}) {
    if (this.base.getIsMock()) {
      return {
        success: true,
        data: this.generateMockData(),
        message: "Mock 模式：返回合併打印",
      };
    }

    try {
      const result = await this.base.rustFetch(
        `${this.endpoint}/${id}`,
        { method: "GET" },
        {
          operation: "getMergedReceiptById",
          id,
          ...context,
        },
      );
      return result;
    } catch (error) {
      console.error("❌ 獲取合併打印失敗:", error);
      return this.handleMergedReceiptsError(error);
    }
  }

  /**
   * 創建新的 MergedReceipt
   * @param {Object} mergedReceiptData - 收據數據
   * @param {string} mergedReceiptData.receipt_number - 收據號
   * @param {string} mergedReceiptData.state - 狀態
   * @param {number[]} mergedReceiptData.registration_ids - 關聯報名 ID 陣列
   * @param {number} mergedReceiptData.total_amount - 總金額
   * @param {string} mergedReceiptData.notes - 備註
   * @param {string} mergedReceiptData.issued_date - 開立日期
   * @param {Object} additionalContext - 額外上下文
   */
  async createMergedReceipt(mergedReceiptData, additionalContext = {}) {
    const processedData = {
      ...mergedReceiptData,
      state: mergedReceiptData.state || "draft",
    };

    const startTime = Date.now();
    const logContext = {
      service: this.serviceName,
      operation: "createMergedReceipt",
      method: "POST",
      startTime,
      endpoint: this.endpoint,
      requestBody: processedData,
      ...additionalContext,
    };

    if (this.base.getIsMock()) {
      console.warn("⚠️ 當前模式不為 Rust，MergedReceipt 創建成功");
      return {
        success: true,
        data: { id: Date.now(), ...processedData },
        message: "Mock 模式：MergedReceipt 創建成功",
      };
    }

    try {
      console.log("🦀 [Rust] 創建 MergedReceipt:", processedData);
      return await this.base.rustFetch(
        this.endpoint,
        { method: "POST", body: JSON.stringify(processedData) },
        logContext,
      );
    } catch (error) {
      console.error("❌ 創建 MergedReceipt 失敗:", error);
      throw error;
    }
  }

  /**
   * 更新 MergedReceipt
   * @param {number} id - 收據 ID
   * @param {Object} mergedReceiptData - 要更新的數據
   * @param {Object} context - 上下文信息
   */
  async updateMergedReceipt(id, mergedReceiptData, context = {}) {
    const updateData = {
      ...mergedReceiptData,
      user_updated: context.user_updated || "system",
    };

    return await this.base.rustFetch(
      `${this.endpoint}/${id}`,
      { method: "PATCH", body: JSON.stringify(updateData) },
      {
        service: this.serviceName,
        operation: "updateMergedReceipt",
        id,
        ...context,
      },
    );
  }

  /**
   * 刪除 MergedReceipt
   * @param {number} id - 收據 ID
   * @param {Object} context - 上下文信息
   */
  async deleteMergedReceipt(id, context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/${id}`,
      { method: "DELETE" },
      {
        service: this.serviceName,
        operation: "deleteMergedReceipt",
        id,
        ...context,
      },
    );
  }

  // ========== 高級查詢方法 ==========

  /**
   * 根據收據號獲取 MergedReceipt（支持模糊匹配）
   * @param {string} receiptNo - 收據號
   * @param {Object} context - 上下文信息
   */
  async getByReceiptNumber(receiptNo, context = {}) {
    return await this.getAllMergedReceipts(
      { filter: { receipt_number: { _like: receiptNo } } },
      context,
    );
  }

  /**
   * 根據狀態獲取 MergedReceipt（走專用路由 /by-state/:state）
   * @param {string} state - 狀態
   * @param {Object} context - 上下文信息
   */
  async getMergedReceiptByState(state, context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/by-state/${state}`,
      { method: "GET" },
      { operation: "getMergedReceiptByState", state, ...context },
    );
  }

  /**
   * 根據狀態批量獲取多種狀態的 MergedReceipt
   * 使用並發請求取得各狀態結果，並合併回傳
   *
   * @param {string[]} states - 狀態陣列，例如 ["issued", "draft"]
   * @param {Object} context - 上下文信息
   */
  async getMergedReceiptsByState(states = [], context = {}) {
    if (!states || states.length === 0) {
      return { success: true, data: [], message: "未提供狀態條件" };
    }

    if (states.length === 1) {
      return await this.getMergedReceiptByState(states[0], context);
    }

    const promises = states.map((state) =>
      this.getMergedReceiptByState(state, context).catch((error) => ({
        success: false,
        state,
        error: error.message,
      })),
    );

    const results = await Promise.all(promises);
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    const mergedData = successful.flatMap((r) =>
      Array.isArray(r.data) ? r.data : [],
    );

    return {
      success: failed.length === 0,
      data: mergedData,
      failed: failed.length > 0 ? failed : undefined,
      message:
        failed.length > 0
          ? `部分狀態請求失敗: ${failed.map((f) => f.state).join(", ")}`
          : `共取得 ${mergedData.length} 筆記錄`,
    };
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
   * @param {Object} context  - 上下文信息
   */
  async getMergedReceiptByDate(dateFrom, dateTo, options = {}, context = {}) {
    if (!dateFrom && !dateTo) {
      return { success: false, data: [], message: "需提供 dateFrom 或 dateTo" };
    }

    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;

    if (from && isNaN(from.getTime())) {
      return {
        success: false,
        data: [],
        message: `dateFrom 格式無效: ${dateFrom}`,
      };
    }
    if (to && isNaN(to.getTime())) {
      return {
        success: false,
        data: [],
        message: `dateTo 格式無效: ${dateTo}`,
      };
    }

    const result = await this.getAllMergedReceipts(
      {
        sort: options.sort || "-id",
        limit: options.limit || 1000,
      },
      { operation: "getMergedReceiptByDate", ...context },
    );

    if (!result.success || !Array.isArray(result.data)) {
      return result;
    }

    const filtered = result.data.filter((item) => {
      const raw = item.issuedDate || item.issued_date || item.date_created;
      if (!raw) return false;

      const itemDate = new Date(raw);
      if (isNaN(itemDate.getTime())) return false;

      if (from && itemDate < from) return false;
      if (to && itemDate > to) return false;
      return true;
    });

    return {
      success: true,
      data: filtered,
      message: `日期範圍 [${dateFrom ?? "*"} ~ ${dateTo ?? "*"}] 共 ${filtered.length} 筆`,
    };
  }

  /**
   * 獲取 MergedReceipt 歷史記錄
   * 依建立時間降序排列，支持依狀態縮小範圍
   *
   * @param {Object} options - 選項
   * @param {string} options.state    - 限定狀態
   * @param {number} options.limit    - 返回筆數，預設 50
   * @param {number} options.offset   - 偏移量，預設 0
   * @param {Object} context - 上下文信息
   */
  async getMergedReceiptsHistory(options = {}, context = {}) {
    const { state, limit = 50, offset = 0 } = options;

    const filter = {};
    if (state) filter.state = { _eq: state };

    const result = await this.getAllMergedReceipts(
      {
        sort: "-date_created",
        limit,
        offset,
        ...(Object.keys(filter).length > 0 ? { filter } : {}),
      },
      { operation: "getMergedReceiptsHistory", ...context },
    );

    if (!result.success || !Array.isArray(result.data)) {
      return result;
    }

    const history = result.data.map((item, index) => ({
      ...item,
      _historyIndex: offset + index + 1,
      _createdLabel: item.date_created
        ? new Date(item.date_created).toLocaleString("zh-TW", {
            timeZone: "Asia/Taipei",
          })
        : null,
      _updatedLabel: item.date_updated
        ? new Date(item.date_updated).toLocaleString("zh-TW", {
            timeZone: "Asia/Taipei",
          })
        : null,
    }));

    return {
      success: true,
      data: history,
      meta: result.meta,
      message: `共取得 ${history.length} 筆歷史記錄`,
    };
  }

  /**
   * 按收據類型統計金額
   * @param {string} startDate - 開始日期（可選）
   * @param {string} endDate - 結束日期（可選）
   * @param {Object} context - 上下文信息
   * @returns {Promise<Object>} 各類型金額統計
   */
  async getAmountStatsByType(startDate, endDate, context = {}) {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    try {
      const result = await this.getAllMergedReceipts(
        {
          filter: params,
        },
        { operation: "getAmountStatsByType", ...context },
      );

      result.data = result.data.reduce((acc, item) => {
        const type = item.receipt_type || "unknown";
        const amount = parseFloat(item.total_amount) || 0;
        if (!acc[type]) acc[type] = 0;
        acc[type] += amount;
        return acc;
      }, {});

      return result;
    } catch (error) {
      console.error("獲取金額統計失敗:", error);
      return this.handleMergedReceiptsError(error);
    }
  }

  /**
   * 檢查收據是否已被合併
   * @param {number|string} recordId - 參加記錄(participationRecordDB) ID
   * @param {Object} context - 上下文信息
   * @returns {Promise<Object>} 檢查結果
   */
  async isReceiptMerged(recordId) {
    const result = await this.getAllMergedReceipts(
      {
        filter: { mergeIds: { _contains: recordId } },
      },
      { operation: "isReceiptMerged", recordId },
    );

    if (!result.success) {
      return { success: false, data: null, message: "檢查失敗" };
    }

    const isMerged = Array.isArray(result.data) && result.data.length > 0;
    return {
      success: true,
      data: { isMerged, mergedReceipts: result.data },
      message: isMerged
        ? `Record ID ${recordId} 已被合併至 ${result.data.length} 筆收據`
        : `Record ID ${recordId} 尚未被合併`,
    };
  }

  /**
   * 獲取最新一筆 MergedReceipt
   * @param {Object} context - 上下文信息
   */
  async getLatestMergedReceipt(context = {}) {
    return await this.getAllMergedReceipts({ sort: "-id", limit: 1 }, context);
  }

  /**
   * 根據收據類型獲取合併打印
   * @param {string} receiptType - 收據類型（stamp/...）
   * @param {Object} context - 上下文信息
   * @returns {Promise<Object>} 合併打印列表
   */
  async getMergedReceiptsByType(receiptType, context = {}) {
    return await this.getAllMergedReceipts(
      { filter: { receipt_type: { _eq: receiptType } } },
      context,
    );
  }

  /**
   * 搜索 MergedReceipt
   * @param {string} keyword - 搜索關鍵詞 (搜索 receipt_number)
   * @param {Object} context - 上下文信息
   */
  async searchMergedReceipt(keyword, context = {}) {
    return await this.getAllMergedReceipts(
      { filter: { receipt_number: { _like: keyword } } },
      context,
    );
  }

  // ========== 批量操作 ==========

  /**
   * 批量獲取 MergedReceipt
   * @param {number[]} ids - ID 數組
   * @param {Object} context - 上下文信息
   */
  async getMergedReceiptsByIds(ids, context = {}) {
    if (!ids || ids.length === 0) {
      return { success: true, data: [], message: "沒有提供 ID" };
    }

    const promises = ids.map((id) =>
      this.getMergedReceiptById(id, context).catch((error) => ({
        success: false,
        id,
        error: error.message,
      })),
    );

    const results = await Promise.all(promises);
    const successful = results.filter((r) => r.success).map((r) => r.data);
    const failed = results.filter((r) => !r.success);

    return {
      success: failed.length === 0,
      data: successful,
      failed: failed.length > 0 ? failed : undefined,
      message:
        failed.length > 0 ? `部分請求失敗: ${failed.length} 個` : undefined,
    };
  }

  // ========== 錯誤處理 ==========

  /**
   * Rust 特定的錯誤處理
   * @param {Error} error - 錯誤對象
   */
  handleMergedReceiptsError(error) {
    return this.base.handleRustError(error);
  }

  // ========== 模式管理 ==========

  getCurrentMode() {
    return this.base.mode;
  }

  setMode(mode) {
    console.warn(`⚠️🦀 [Rust] 服務不支持切換模式，當前固定為 rust 模式`);
    return "rust";
  }
}

export const rustMergedReceiptsService = new RustMergedReceiptsService();
