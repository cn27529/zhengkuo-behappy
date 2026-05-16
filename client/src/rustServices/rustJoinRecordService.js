// src/rustServices/rustJoinRecordService.js
import { baseRustService } from "./baseRustService.js";
import { DateUtils } from "../utils/dateUtils.js";
import { generateGitHashBrowser } from "../utils/generateGitHash.js";
import { authService } from "../services/authService.js";
import appConfig from "../config/appConfig.js";

export class RustJoinRecordService {
  // ========== 建構函式 ==========
  constructor() {
    this.serviceName = "RustJoinRecordService";
    this.base = baseRustService;
    this.endpoint = this.base.endpoints.joinRecords || "join-records";
    console.log(`RustJoinRecordService 初始化: 當前模式為 ${this.base.mode}`);
  }

  // ========== 核心 CRUD 方法 ==========

  /**
   * 創建參加記錄
   */
  async createJoinRecord(recordData, additionalContext = {}) {
    const createISOTime = DateUtils.getCurrentISOTime();
    const processedData = {
      ...recordData,
      createdAt: createISOTime,
      updatedAt: null,
    };

    const logContext = {
      service: this.serviceName,
      operation: "createJoinRecord",
      method: "POST",
      endpoint: this.endpoint,
      requestBody: processedData,
      ...additionalContext,
    };

    if (this.base.getIsMock()) {
      console.warn("⚠️ 當前模式不為 Rust，參加記錄創建成功");
      return {
        success: true,
        data: processedData,
        message: "Mock 模式：參加記錄創建成功",
      };
    }

    try {
      console.log("🦀 [Rust] 創建參加記錄:", processedData);
      const result = await this.base.rustFetch(
        this.endpoint,
        {
          method: "POST",
          body: JSON.stringify(processedData),
        },
        logContext,
      );
      return result;
    } catch (error) {
      console.error("❌ 創建參加記錄失敗:", error);
      return this.handleJoinRecordError(error);
    }
  }

  /**
   * 獲取所有參加記錄
   */
  async getAllJoinRecords(params = {}, context = {}) {
    if (this.base.getIsMock()) {
      return {
        success: true,
        data: [],
        message: "Mock 模式：返回空參加記錄列表",
      };
    }

    const queryParams = new URLSearchParams({
      sort: "-createdAt",
      ...params,
    }).toString();

    const apiUrl = `${this.endpoint}?${queryParams}`;

    try {
      const result = await this.base.rustFetch(
        apiUrl,
        { method: "GET" },
        {
          //service: this.serviceName,
          operation: "getAllJoinRecords",
          params,
          ...context,
        },
      );
      return result;
    } catch (error) {
      console.error("❌ 獲取參加記錄失敗:", error);
      return this.handleJoinRecordError(error);
    }
  }

  /**
   * 生成 Mock 資料
   */
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

  /**
   * 根據 ID 列表獲取參加記錄
   */
  async getJoinRecordByIds(recordIds, context = {}) {
    if (this.base.getIsMock()) {
      const idsArray = Array.isArray(recordIds) ? recordIds : [recordIds];
      const mockData = this.generateMockData();
      const mockResult = [];
      idsArray.forEach((id) => {
        console.warn(`⚠️ 當前模式不為 Rust，獲取參加記錄成功 (ID: ${id})`);
        mockResult.push(mockData.filter((record) => record.id === id)[0]); // 根據 ID 返回對應的 Mock 資料
      });
      return {
        success: true,
        data: mockResult,
        message: "Mock 模式：返回參加記錄列表",
      };
    }

    try {
      // recordIds 可能是單個 ID 或 ID 列表陣列，確保它是陣列格式
      const idsArray = Array.isArray(recordIds) ? recordIds : [recordIds];
      const queryParams = new URLSearchParams({
        filter: `id_in(${idsArray.join(",")})`,
      }).toString();

      const result = {
        success: true,
        data: [],
        message: `成功獲取參加記錄列表 (IDs: ${idsArray.join(",")})`,
      };
      idsArray.forEach((id) => {
        const record = this.getJoinRecordById(id, {
          operation: "getJoinRecordByIds - individual fetch",
          id,
          ...context,
        });
        result.data.push(record.data);
      });

      return result;
    } catch (error) {
      console.error("❌ 根據 IDs 獲取參加記錄失敗:", error);
      return this.handleJoinRecordError(error);
    }
  }

  /**
   * 根據 ID 獲取參加記錄
   */
  async getJoinRecordById(recordId, context = {}) {
    if (this.base.getIsMock()) {
      return {
        success: true,
        data: this.generateMockData(),
        message: "Mock 模式：返回參加記錄",
      };
    }

    try {
      const result = await this.base.rustFetch(
        `${this.endpoint}/${recordId}`,
        { method: "GET" },
        {
          //service: this.serviceName,
          operation: "getJoinRecordById",
          id: recordId,
          ...context,
        },
      );
      return result;
    } catch (error) {
      console.error("❌ 獲取參加記錄失敗:", error);
      return this.handleJoinRecordError(error);
    }
  }

  /**
   * 根據 registrationId 獲取參加記錄
   */
  async getJoinRecordsByRegistrationId(registrationId, context = {}) {
    if (this.base.getIsMock()) {
      return {
        success: true,
        data: [],
        message: "Mock 模式：返回參加記錄列表",
      };
    }

    try {
      const result = await this.base.rustFetch(
        `${this.endpoint}/by-registration/${registrationId}`,
        { method: "GET" },
        {
          //service: this.serviceName,
          operation: "getJoinRecordsByRegistrationId",
          registrationId,
          ...context,
        },
      );
      return result;
    } catch (error) {
      console.error("❌ 獲取參加記錄失敗:", error);
      return this.handleJoinRecordError(error);
    }
  }

  /**
   * 根據 activityId 獲取參加記錄
   */
  async getJoinRecordsByActivityId(activityId, context = {}) {
    if (this.base.getIsMock()) {
      return {
        success: true,
        data: [],
        message: "Mock 模式：返回參加記錄列表",
      };
    }

    try {
      const result = await this.base.rustFetch(
        `${this.endpoint}/by-activity/${activityId}`,
        { method: "GET" },
        {
          //service: this.serviceName,
          operation: "getJoinRecordsByActivityId",
          activityId,
          ...context,
        },
      );
      return result;
    } catch (error) {
      console.error("❌ 獲取參加記錄失敗:", error);
      return this.handleJoinRecordError(error);
    }
  }

  /**
   * 更新參加記錄
   */
  async updateJoinRecord(recordId, recordData, context = {}) {
    if (this.base.getIsMock()) {
      console.warn("⚠️ 當前模式不是 rust，無法更新數據");
      return {
        success: false,
        message: "⚠️ 當前模式不是 rust，無法更新數據",
      };
    }

    const updateData = {
      ...recordData,
      updatedAt: DateUtils.getCurrentISOTime(),
      user_updated: context.user_updated || "system",
    };

    try {
      const result = await this.base.rustFetch(
        `${this.endpoint}/${recordId}`,
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
        },
        {
          service: this.serviceName,
          operation: "updateJoinRecord",
          id: recordId,
          requestBody: updateData,
          ...context,
        },
      );
      return result;
    } catch (error) {
      console.error(`❌ 更新參加記錄失敗 (ID: ${recordId})`, error);
      return this.handleJoinRecordError(error);
    }
  }

  /**
   * 刪除參加記錄
   */
  async deleteJoinRecord(recordId, context = {}) {
    if (this.base.getIsMock()) {
      console.warn("⚠️ 當前模式不是 rust，無法刪除數據");
      return {
        success: false,
        message: "⚠️ 當前模式不是 rust，無法刪除數據",
      };
    }

    try {
      const result = await this.base.rustFetch(
        `${this.endpoint}/${recordId}`,
        { method: "DELETE" },
        {
          service: this.serviceName,
          operation: "deleteJoinRecord",
          id: recordId,
          ...context,
        },
      );
      return result;
    } catch (error) {
      console.error(`❌ 刪除參加記錄失敗 (ID: ${recordId})`, error);
      return this.handleJoinRecordError(error);
    }
  }

  /**
   * 更新收據打印狀態
   * 如果收據己打印這裡會是 true，receiptNumber 會記錄佛字第，needReceipt 會記錄"standard" 是 "感謝狀", "stamp" 是 "收據"。
   */
  async updateByReceiptPrint(record, context = {}) {
    if (!record?.id) {
      return { success: false, message: "缺少記錄 ID" };
    }

    console.log("更新收據打印狀態 - 原始記錄:", record);

    // 根據參加類型決定是否需要收據
    const isNeedReceipt =
      record.activeTemplate === "standard" || record.activeTemplate === "stamp";

    const updateData = {
      needReceipt: isNeedReceipt,
      receiptNumber: `${record.id}A${record.activityId}R${record.registrationId}`,
      // 直接使用 activeTemplate 的值來表示是否已開立收據（standard 或 stamp），如果沒有則為空值。
      // 經20260225決定修改定義默認為空值，值等於 "standard" 是 "感謝狀", "stamp" 是 "收據"，空值表示：未打印"收據"或"感謝狀"。
      receiptIssued: record.activeTemplate || "",
      receiptIssuedAt:
        record?.receiptIssuedAt === "" ? "" : DateUtils.getCurrentISOTime(),
      //receiptIssuedBy: authService.getCurrentUser(),
      receiptIssuedBy:
        record?.receiptIssuedBy === ""
          ? ""
          : authService.getUserName() || "沒有名稱", // 確保有名稱可用，否則使用預設值
    };

    return await this.updateJoinRecord(record.id, updateData, {
      operation: "updateByReceiptPrint",
      ...context,
    });
  }

  /**
   * 儲存記錄 (原有方法保持兼容)
   */
  async saveRecord(payload, context = {}) {
    try {
      console.log("🦀 [Rust] Service 傳送資料:", payload);
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
        notes: payload.notes || "",
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

      console.log("🦀 [Rust] 準備儲存的記錄資料:", recordData);
      const result = await this.createJoinRecord(recordData, {
        ...context,
      });
      return result;
    } catch (error) {
      console.error("🦀 [Rust] 儲存失敗", error);
      throw error;
    }
  }

  // ========== 輔助方法 ==========

  // 根據參加類型對應的配置（標籤、價格、來源）：超度/超薦、陽上人、點燈(光明燈)、祈福、固定消災、中元普度、護持三寶、供齋、護持道場、助印經書、放生
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
      food_offering: { label: "供齋", price: 500, source: "offering.food" },
      support_temple: {
        label: "護持道場",
        price: 1000,
        source: "offering.temple",
      },
      sutra_printing: {
        label: "助印經書",
        price: 800,
        source: "offering.sutra_printing",
      },
      life_release: {
        label: "放生",
        price: 1500,
        source: "offering.life_release",
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

  // ========== Rust 特有功能 ==========

  /**
   * 批量操作（Rust 特有功能）
   */
  async batchOperations(operations, context = {}) {
    return await this.base.rustFetch(
      `${this.endpoint}/batch`,
      {
        method: "POST",
        body: JSON.stringify({ operations }),
      },
      {
        //service: this.serviceName,
        operation: "batchOperations",
        count: operations.length,
        ...context,
      },
    );
  }

  // ========== 錯誤處理 ==========

  /**
   * Rust 特定的錯誤處理
   */
  handleJoinRecordError(error) {
    return this.base.handleRustError(error);
  }

  // ========== 模式管理 ==========

  /**
   * 獲取當前模式
   */
  getCurrentMode() {
    return this.base.mode;
  }

  /**
   * 設置模式（在 Rust 服務中無效，但保持接口兼容）
   */
  setMode(mode) {
    console.warn(`⚠️🦀 [Rust] 服務不支持切換模式，當前固定為 rust 模式`);
    return "rust";
  }
}

export const rustJoinRecordService = new RustJoinRecordService();
