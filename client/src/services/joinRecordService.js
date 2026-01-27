// src/services/joinRecordService.js
import { baseService } from "./baseService.js";
import { generateGitHashBrowser } from "../utils/generateGitHash.js";
import { DateUtils } from "../utils/dateUtils.js";

export class JoinRecordService {
  constructor() {
    this.serviceName = "JoinRecordService";
    this.base = baseService;
    this.endpoint = `${this.base.apiBaseUrl}${this.base.apiEndpoints.itemsParticipationRecord}`;
    console.log(`JoinRecordService 初始化: 當前模式為 ${this.base.mode}`);
  }

  // ========== 核心 CRUD 方法 ==========

  /**
   * 創建參加記錄
   */
  async createParticipationRecord(recordData) {
    const processedData = {
      ...recordData,
      createdAt: DateUtils.getCurrentISOTime(),
      updatedAt: null,
    };

    if (this.base.getIsMock()) {
      console.warn("⚠️ 當前模式不為 Directus，參加記錄創建成功");
      return {
        success: true,
        data: processedData,
        message: "Mock 模式：參加記錄創建成功",
      };
    }

    const startTime = Date.now();
    const logContext = {
      service: this.serviceName,
      operation: "createParticipationRecord",
      method: "POST",
      startTime: startTime,
      endpoint: this.endpoint,
      requestBody: processedData,
    };

    try {
      const myHeaders = await this.base.getAuthJsonHeaders();
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: myHeaders,
        body: JSON.stringify(processedData),
      });

      const duration = Date.now() - startTime;
      const result = await this.base.handleDirectusResponse(
        response,
        "成功創建參加記錄",
        { ...logContext, duration },
      );
      return result;
    } catch (error) {
      console.error("❌ 創建參加記錄失敗:", error);
      return this.handleParticipationRecordError(error);
    }
  }

  /**
   * 獲取所有參加記錄
   */
  async getAllParticipationRecords(params = {}) {
    if (this.base.getIsMock()) {
      return {
        success: true,
        data: [],
        message: "Mock 模式：返回空參加記錄列表",
      };
    }

    const startTime = Date.now();
    const queryParams = new URLSearchParams({
      sort: "-createdAt",
      ...params,
    }).toString();
    const apiUrl = `${this.endpoint}?${queryParams}`;

    const logContext = {
      //service: this.serviceName,
      operation: "getAllParticipationRecords",
      method: "GET",
      startTime: startTime,
      endpoint: apiUrl,
    };

    try {
      const myHeaders = await this.base.getAuthJsonHeaders();
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: myHeaders,
      });

      const duration = Date.now() - startTime;
      const result = await this.base.handleDirectusResponse(
        response,
        "成功獲取參加記錄",
        { ...logContext, duration },
      );
      return result;
    } catch (error) {
      console.error("❌ 獲取參加記錄失敗:", error);
      return this.handleParticipationRecordError(error);
    }
  }

  /**
   * 根據 ID 獲取參加記錄
   */
  async getParticipationRecordById(recordId) {
    if (this.base.getIsMock()) {
      return {
        success: true,
        data: this.generateMockData(),
        message: "Mock 模式：返回參加記錄",
      };
    }

    const startTime = Date.now();
    const apiUrl = `${this.endpoint}/${recordId}`;
    const logContext = {
      //service: this.serviceName,
      operation: "getParticipationRecordById",
      method: "GET",
      startTime: startTime,
      endpoint: apiUrl,
    };

    try {
      const myHeaders = await this.base.getAuthJsonHeaders();
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: myHeaders,
      });

      const duration = Date.now() - startTime;
      const result = await this.base.handleDirectusResponse(
        response,
        "成功獲取參加記錄",
        { ...logContext, duration },
      );
      return result;
    } catch (error) {
      console.error("❌ 獲取參加記錄失敗:", error);
      return this.handleParticipationRecordError(error);
    }
  }

  /**
   * 根據 registrationId 獲取參加記錄
   */
  async getParticipationRecordsByRegistrationId(registrationId) {
    if (this.base.getIsMock()) {
      return {
        success: true,
        data: [],
        message: "Mock 模式：返回參加記錄列表",
      };
    }

    const startTime = Date.now();
    const queryParams = new URLSearchParams({
      "filter[registrationId][_eq]": registrationId,
      sort: "-createdAt",
    }).toString();
    const apiUrl = `${this.endpoint}?${queryParams}`;

    const logContext = {
      //service: this.serviceName,
      operation: "getParticipationRecordsByRegistrationId",
      method: "GET",
      startTime: startTime,
      endpoint: apiUrl,
    };

    try {
      const myHeaders = await this.base.getAuthJsonHeaders();
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: myHeaders,
      });

      const duration = Date.now() - startTime;
      const result = await this.base.handleDirectusResponse(
        response,
        "成功獲取參加記錄列表",
        { ...logContext, duration },
      );
      return result;
    } catch (error) {
      console.error("❌ 獲取參加記錄失敗:", error);
      return this.handleParticipationRecordError(error);
    }
  }

  /**
   * 更新參加記錄
   */
  async updateParticipationRecord(recordId, recordData) {
    if (this.base.getIsMock()) {
      console.warn("⚠️ 當前模式不是 directus，無法更新數據");
      return {
        success: false,
        message: "⚠️ 當前模式不是 directus，無法更新數據",
      };
    }

    const updateData = {
      ...recordData,
      updatedAt: DateUtils.getCurrentISOTime(),
    };

    const startTime = Date.now();
    const logContext = {
      service: this.serviceName,
      operation: "updateParticipationRecord",
      method: "PATCH",
      startTime: startTime,
      endpoint: `${this.endpoint}/${recordId}`,
      requestBody: updateData,
    };

    try {
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
        "成功更新參加記錄",
        { ...logContext, duration },
      );
      return result;
    } catch (error) {
      console.error(`❌ 更新參加記錄失敗 (ID: ${recordId})`, error);
      return this.handleParticipationRecordError(error);
    }
  }

  /**
   * 刪除參加記錄
   */
  async deleteParticipationRecord(recordId) {
    if (this.base.getIsMock()) {
      console.warn("⚠️ 當前模式不是 directus，無法刪除數據");
      return {
        success: false,
        message: "⚠️ 當前模式不是 directus，無法刪除數據",
      };
    }

    const currentRecord = await this.getParticipationRecordById(recordId);
    if (!currentRecord) {
      return {
        success: false,
        message: `找不到 ID 為 ${recordId} 的參加記錄`,
        data: null,
      };
    }

    const startTime = Date.now();
    const logContext = {
      service: this.serviceName,
      operation: "deleteParticipationRecord",
      method: "DELETE",
      startTime: startTime,
      endpoint: `${this.endpoint}/${recordId}`,
      requestBody: currentRecord,
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
        "成功刪除參加記錄",
        { ...logContext, duration },
      );
      return result;
    } catch (error) {
      console.error(`❌ 刪除參加記錄失敗 (ID: ${recordId})`, error);
      return this.handleParticipationRecordError(error);
    }
  }

  /**
   * 儲存記錄 (原有方法保持兼容)
   */
  async saveRecord(payload) {
    try {
      console.log("Service 傳送資料:", payload);
      const createISOTime = DateUtils.getCurrentISOTime();

      // 轉換為 participationRecordDB 格式
      const recordData = {
        registrationId: payload.registrationId || -1,
        activityId: payload.activityId || -1,
        state: "confirmed",
        items: payload.items || [], // 直接使用 store 處理好的 items（已包含 sourceAddress）
        contact: payload.contact || null, // 新增聯絡人資訊
        totalAmount: payload.total || 0,
        finalAmount: payload.total || 0,
        notes: payload.notes || "", // 備註
        discountAmount: 0, // 折扣金額
        paidAmount: 0, // 付款金額
        needReceipt: false, // 需要收據
        receiptNumber: "", // 收據號碼
        receiptIssued: false, // 收據已開立
        receiptIssuedAt: "", // 收據開立日期
        receiptIssuedBy: "", // 收據開立者
        accountingState: "pending", // pending=未沖帳,reconciled=已沖帳, none=無需沖帳
        accountingDate: "", // 沖帳日期
        accountingBy: "", // 沖帳者
        accountingNotes: "", // 沖帳備註
        paymentState: "", // paid=已付款，partial=部分付款，unpaid=未付款, none=無需付款
        paymentMethod: "", // cash=現金，transfer=轉帳，credit_card=信用卡，other=其他
        paymentDate: "", // 付款日期
        paymentNotes: "", // 付款備註
        createdAt: createISOTime,
      };

      console.log("準備儲存的記錄資料:", recordData);

      const result = await this.createParticipationRecord(recordData);
      return result;
    } catch (error) {
      console.error("儲存失敗", error);
      throw error;
    }
  }

  // ========== 輔助方法 ==========

  getActivityConfig(activityType) {
    const configs = {
      chaodu: {
        label: "超度/超薦",
        price: 1000,
        source: "salvation.ancestors",
      },
      survivors: { label: "陽上人", price: 0, source: "salvation.survivors" },
      diandeng: { label: "點燈", price: 600, source: "blessing.persons" },
      qifu: { label: "消災祈福", price: 300, source: "blessing.persons" },
      xiaozai: { label: "固定消災", price: 100, source: "blessing.persons" },
      pudu: { label: "中元普度", price: 1200, source: "blessing.persons" },
    };
    return configs[activityType];
  }

  getLampTypeLabel(lampType) {
    const lampTypes = {
      guangming: "光明燈",
      taisui: "太歲燈",
      yuanchen: "元辰燈",
    };
    return lampTypes[lampType] || "光明燈";
  }

  // ========== 輔助方法 ==========

  generateMockData() {
    return {
      id: -1,
      registrationId: -1,
      activityId: -1,
      state: "confirmed",
      items: [],
      totalAmount: 0,
      finalAmount: 0,
      createdAt: DateUtils.getCurrentISOTime(),
      updatedAt: DateUtils.getCurrentISOTime(),
    };
  }

  // ========== 錯誤處理 ==========
  handleParticipationRecordError(error) {
    return this.base.handleDirectusError(error);
  }

  // ========== 模式管理 ==========
  getCurrentMode() {
    if (sessionStorage.getItem("auth-mode") !== null) {
      this.base.mode = sessionStorage.getItem("auth-mode");
    }
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

export const joinRecordService = new JoinRecordService();
