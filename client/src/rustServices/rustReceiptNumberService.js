// client/src/rustServices/rustReceiptNumberService.js
import { baseRustService } from "./baseRustService.js";
import { DateUtils } from "../utils/dateUtils.js";
import { authService } from "../services/authService.js"; // 獲取當前用戶

export class RustReceiptNumberService {
  constructor() {
    this.serviceName = "RustReceiptNumberService";
    this.base = baseRustService;
    this.endpoint = this.base.endpoints.receiptNumber;
    console.log(
      `RustReceiptNumberService 初始化: 當前模式為 ${this.base.mode}`,
    );
  }

  // 作廢合併打印的接口
  /*
    \"receiptNumber\": \"$RECEIPT_NUMBER\",
    \"recordIds\": $RECORD_IDS,
    \"state\": \"$STATE\",  
    \"receiptType\": \"$RECEIPT_TYPE\",
    \"voidReason\": \"$VOID_REASON\",            
    \"userId\": \"$TEST_ADMIN\"
  */
  async removeMergedReceiptNumber(
    receiptNumber,
    state,
    voidReason,
    recordIds,
    additionalContext = {},
  ) {
    const startTime = Date.now();
    const requestBody = {
      receiptNumber: receiptNumber, // 需要作廢的合併編號
      state: state || "remove merged", // "remove merged" 作廢合併打印
      receiptType: "", // "stamp" 或 "standard"
      voidReason: voidReason || "作廢合併打印", // 作廢原因
      recordIds: recordIds, // 參與合併的多個 recordId
      userId: additionalContext.userId || authService.getCurrentUser() || null,
    };

    const logContext = {
      service: this.serviceName,
      operation: "removeMergedReceiptNumber",
      method: "POST",
      startTime: startTime,
      endpoint: `${this.endpoint}/merge/remove`,
      requestBody: requestBody,
      ...additionalContext,
    };

    try {
      console.log("🦀 [Rust] 請求作廢合併打印:", requestBody);

      const result = await this.base.rustFetch(
        `${this.endpoint}/merge/remove`,
        {
          method: "POST",
          body: JSON.stringify(requestBody),
        },
        logContext,
      );

      return result;
    } catch (error) {
      console.error("❌ Rust 作廢合併打印失敗:", error);
      return this.handleError(error);
    }
  }

  // 合併打印的接口
  /*
    \"receiptNumber\": \"$RECEIPT_NUMBER\",
    \"recordIds\": $RECORD_IDS,
    \"state\": \"$STATE\",
    \"receiptType\": \"$RECEIPT_TYPE\",
    \"voidReason\": \"$VOID_REASON\",
    \"userId\": \"$TEST_ADMIN\"
  */
  async generateMergedReceiptNumber(
    recordIds,
    receiptType,
    state,
    voidReason,
    additionalContext = {},
  ) {
    const startTime = Date.now();
    const receiptIssuedBy = authService.getUserName() || "未知的經手人";

    const requestBody = {
      receiptNumber: "",
      recordIds: recordIds, // 參與合併的多個 recordId
      state: "merged", // "merged" 合併打印
      receiptType: receiptType, // "stamp" 或 "standard"
      voidReason: voidReason || "合併打印", // 作廢原因
      receiptIssuedBy: receiptIssuedBy,
      userId: additionalContext.userId || authService.getCurrentUser() || null,
    };

    const logContext = {
      service: this.serviceName,
      operation: "generateMergedReceiptNumber",
      method: "POST",
      startTime: startTime,
      endpoint: `${this.endpoint}/merge`,
      requestBody: requestBody,
      ...additionalContext,
    };

    try {
      console.log("🦀 [Rust] 請求原子性生成合併打印編號:", requestBody);

      const result = await this.base.rustFetch(
        `${this.endpoint}/merge`,
        {
          method: "POST",
          body: JSON.stringify(requestBody),
        },
        logContext,
      );

      return result;
    } catch (error) {
      console.error("❌ Rust 合併打印編號失敗:", error);
      return this.handleError(error);
    }
  }

  /**
   * ✅ 🔥 核心功能：原子性生成收據編號 (對應 Rust 方案 1)
   */
  async generateReceiptNumber(recordId, receiptType, additionalContext = {}) {
    const startTime = Date.now();
    const receiptIssuedBy = authService.getUserName() || "未知的經手人";
    const requestBody = {
      recordId: parseInt(recordId),
      receiptType: receiptType, // "stamp" 或 "standard"
      receiptIssuedBy: receiptIssuedBy,
      userId: additionalContext.userId || authService.getCurrentUser() || null,
    };

    const logContext = {
      service: this.serviceName,
      operation: "generateReceiptNumber",
      method: "POST",
      startTime: startTime,
      endpoint: `${this.endpoint}/generate`,
      requestBody: requestBody,
      ...additionalContext,
    };

    try {
      console.log(
        `🦀 [Rust] 請求原子性生成編號: recordId=${recordId}, receiptType=${receiptType}, userId=${additionalContext.userId}`,
        requestBody,
      );

      const result = await this.base.rustFetch(
        `${this.endpoint}/generate`,
        {
          method: "POST",
          body: JSON.stringify(requestBody),
        },
        logContext,
      );

      return result;
    } catch (error) {
      console.error("❌ Rust 生成收據編號失敗:", error);
      return this.handleError(error);
    }
  }

  /**
   * ✅ 獲取編號歷史記錄
   */
  async getAllReceiptNumbers(params = {}, additionalContext = {}) {
    const queryParams = new URLSearchParams();
    if (params.yearMonth) queryParams.append("yearMonth", params.yearMonth);
    if (params.receiptType)
      queryParams.append("receiptType", params.receiptType);
    if (params.state) queryParams.append("state", params.state);

    const endpoint = queryParams.toString()
      ? `${this.endpoint}?${queryParams.toString()}`
      : this.endpoint;

    try {
      const result = await this.base.rustFetch(endpoint, { method: "GET" });
      return result;
    } catch (error) {
      console.error("❌ 獲取編號列表失敗:", error);
      return this.handleError(error);
    }
  }

  /**
   * ✅ 更新編號狀態為作廢
   */
  async voidReceiptNumber(id, voidReason, additionalContext = {}) {
    const startTime = Date.now();
    const requestBody = {
      state: "void",
      voidReason: voidReason || "手動作廢",
      updatedAt: DateUtils.getCurrentISOTime(),
      userId: authService.getCurrentUser() || null, // 記錄是誰作廢的
    };

    const logContext = {
      service: this.serviceName,
      operation: "voidReceiptNumber",
      method: "PATCH",
      startTime: startTime,
      endpoint: `${this.endpoint}/${id}/status`,
      requestBody: requestBody,
      ...additionalContext,
    };

    try {
      const result = await this.base.rustFetch(
        `${this.endpoint}/${id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify(requestBody),
        },
        logContext,
      );
      return result;
    } catch (error) {
      console.error(`❌ 作廢編號失敗 (ID: ${id}):`, error);
      return this.handleError(error);
    }
  }

  handleError(error) {
    return this.base.handleRustError(error);
  }

  getCurrentMode() {
    return "rust";
  }
}

export const rustReceiptNumberService = new RustReceiptNumberService();
