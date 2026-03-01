// client/src/services/receiptNumberService.js
import { baseService } from "./baseService.js";
import { DateUtils } from "../utils/dateUtils.js";
import { rustReceiptNumberService } from "../rustServices/rustReceiptNumberService.js";
import { authService } from "../services/authService.js"; // 獲取當前用戶

export class ReceiptNumberService {
  constructor() {
    this.serviceName = "ReceiptNumberService";
    this.base = baseService;
    // 假設 apiEndpoints 中已定義此項次
    this.endpoint = `${this.base.apiBaseUrl}${this.base.apiEndpoints.itemsReceiptNumber}`;
    console.log(`ReceiptNumberService 初始化: 當前模式為 ${this.base.mode}`);
  }

  /**
   * ✅ 生成收據編號 (Directus 軌道)
   * 注意：在 Directus 軌道可能需由前端計算或調用另一套 Hook
   */
  async generateReceiptNumber(recordId, receiptType) {
    if (this.base.getIsMock()) {
      return {
        success: true,
        data: { receiptNumber: "MOCK26020001" },
        message: "Mock 模式生成編號成功",
      };
    }

    try {
      // ⚠️ Directus 軌道不建議處理原子性取號，建議使用 Rust 方案
      console.warn(
        "⚠️ Directus 軌道不建議處理原子性取號，本方法使用 Rust 模式的 rustReceiptNumberService.generateReceiptNumber",
      );
      const result = rustReceiptNumberService.generateReceiptNumber(
        recordId,
        receiptType,
        {
          userId: authService.getCurrentUser(), // 傳遞當前用戶 ID 作為上下文
        },
      );
      return result;

      return { success: false, message: "請使用 Rust 服務生成編號" };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * ✅ 獲取所有編號
   */
  async getAllReceiptNumbers(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append("fields", "*");
      if (params.filter) {
        Object.keys(params.filter).forEach((key) => {
          queryParams.append(`filter[${key}]`, params.filter[key]);
        });
      }

      const myHeaders = await this.base.getAuthJsonHeaders();
      const response = await fetch(
        `${this.endpoint}?${queryParams.toString()}`,
        {
          method: "GET",
          headers: myHeaders,
        },
      );

      return await this.base.handleDirectusResponse(
        response,
        "成功獲取編號列表",
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * ✅ 更新狀態為
   */
  async stateReceiptNumber(id, voidReason, state) {
    try {
      const startTime = Date.now();
      const myHeaders = await this.base.getAuthJsonHeaders();
      const apiUrl = `${this.endpoint}/${id}`;
      const response = await fetch(apiUrl, {
        method: "PATCH",
        headers: myHeaders,
        body: JSON.stringify({
          state,
          voidReason: voidReason || null,
          updatedAt: DateUtils.getCurrentISOTime(),
          //userId: authService.getUserName(), // 記錄是誰更新狀態的
        }),
      });

      const logContext = {
        service: this.serviceName,
        operation: "stateReceiptNumber",
        method: "PATCH",
        startTime: startTime,
        endpoint: apiUrl,
        requestBody: {
          voidReason: voidReason || null,
          state,
          updatedAt: DateUtils.getCurrentISOTime(),
          //userId: authService.getUserName(), // 記錄是誰更新狀態的
        },
      };

      const duration = Date.now() - startTime;
      console.log(
        `✅ [Directus] 更新編號狀態完成，耗時 ${duration}ms`,
        logContext,
      );

      return await this.base.handleDirectusResponse(
        response,
        "成功更新編號狀態",
        { ...logContext, duration },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  // ========== Getters - 計算屬性 ==========

  /**
   * ✅ 更新編號狀態為作廢
   */
  async voidReceiptNumber(id, voidReason) {
    try {
      const startTime = Date.now(); // 記錄開始時間
      const myHeaders = await this.base.getAuthJsonHeaders();
      const apiUrl = `${this.endpoint}/${id}`;
      const response = await fetch(apiUrl, {
        method: "PATCH",
        headers: myHeaders,
        body: JSON.stringify({
          state: "void",
          voidReason: voidReason || "手動作廢",
          updatedAt: DateUtils.getCurrentISOTime(),
          userId: authService.getCurrentUser(), // 記錄是誰作廢的
        }),
      });

      const logContext = {
        service: this.serviceName,
        operation: "voidReceiptNumber",
        method: "PATCH",
        startTime: startTime,
        endpoint: apiUrl,
        requestBody: {
          state: "void",
          voidReason: voidReason || "手動作廢",
          updatedAt: DateUtils.getCurrentISOTime(),
          userId: authService.getCurrentUser(), // 記錄是誰作廢的
        },
      };

      // 計算實際耗時
      const duration = Date.now() - startTime;
      console.log(`✅ [Directus] 作廢編號完成，耗時 ${duration}ms`, logContext);

      return await this.base.handleDirectusResponse(response, "成功作廢編號", {
        ...logContext,
        duration,
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  handleError(error) {
    return this.base.handleDirectusError(error);
  }

  getCurrentMode() {
    return this.base.mode;
  }
}

export const receiptNumberService = new ReceiptNumberService();
