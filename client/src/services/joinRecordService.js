// src/services/joinRecordService.js
import { baseService } from "./baseService.js";
import { generateGitHashBrowser } from "../utils/generateGitHash.js";
import { DateUtils } from "../utils/dateUtils.js";
import { authService } from "./authService.js";

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
   * 根據 IDs 列表獲取參加記錄
   * @param {*} recordIds
   */
  async getParticipationRecordByIds(recordIds) {
    if (this.base.getIsMock()) {
      return {
        success: true,
        data: [],
        message: "Mock 模式：返回空參加記錄列表",
      };
    }
    try {
      // recordIds 可能是單個 ID 或 ID 列表陣列，確保它是陣列格式
      const idsArray = Array.isArray(recordIds) ? recordIds : [recordIds];
      const result = {
        success: true,
        data: [],
        message: `成功獲取參加記錄列表 (IDs: ${idsArray.join(",")})`,
      };
      idsArray.forEach((id) => {
        const record = this.getParticipationRecordById(id, {
          operation: "getParticipationRecordByIds - individual fetch",
          id,
          ...context,
        });
        result.data.push(record.data);
      });

      return result;
    } catch (error) {
      console.error("❌ 根據 IDs 列表獲取參加記錄失敗:", error);
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
   * 更新收據打印狀態
   * 如果收據己打印這裡會是 true，receiptNumber 會記錄佛字第，needReceipt 會記錄"standard" 是 "感謝狀", "stamp" 是 "收據"。
   */
  async updateByReceiptPrint(record) {
    if (!record?.id) {
      return { success: false, message: "缺少記錄 ID" };
    }

    console.log("更新收據打印狀態 - 原始記錄:", record);

    const updateData = {
      receiptNumber: record.receiptNumber || "", // 保持原有佛字第不變，如果沒有則為空字符串
      // 直接使用 activeTemplate 的值來表示是否已開立收據（standard 或 stamp），如果沒有則為空值
      //經20260225決定修改定義默認為空值，值等於 "standard" 是 "感謝狀", "stamp" 是 "收據"，空值表示：未打印"收據"或"感謝狀"。
      receiptIssued: record.activeTemplate || "",
      receiptIssuedAt: record.receiptIssuedAt,
      receiptIssuedBy: record.receiptIssuedBy,
      needReceipt: record.needReceipt,
    };

    return await this.updateParticipationRecord(record.id, updateData);
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
        needReceipt: payload.needReceipt, // 是否需要收據
        receiptNumber: "", // 佛字第
        receiptIssued: "", // 收據是否已開立。經20260225決定修改定義默認為空值，值等於 "standard" 是 "感謝狀", "stamp" 是 "收據"，空值表示：未打印"收據"或"感謝狀"。
        receiptIssuedAt: "", // 收據開立日期
        receiptIssuedBy: "", // 收據開立者，也稱經手人
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

  // 根據活動類型獲取對應的配置（標籤、價格、來源）：超度/超薦、陽上人、點燈(光明燈)、祈福、固定消災、中元普度、護持三寶、供齋、護持道場、助印經書、放生
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
      support_triple_gem: {
        label: "護持三寶",
        price: 200,
        source: "blessing.persons",
      },
      food_offering: {
        label: "供齋",
        price: 500,
        source: "blessing.persons",
      },
      support_temple: {
        label: "護持道場",
        price: 1000,
        source: "blessing.persons",
      },
      sutra_printing: {
        label: "助印經書",
        price: 800,
        source: "blessing.persons",
      },
      life_release: {
        label: "放生",
        price: 1500,
        source: "blessing.persons",
      },
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
