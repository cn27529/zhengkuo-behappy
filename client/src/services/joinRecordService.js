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

    try {
      const myHeaders = await this.base.getAuthJsonHeaders();
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: myHeaders,
        body: JSON.stringify(processedData),
      });

      const result = await this.base.handleDirectusResponse(
        response,
        "成功創建參加記錄",
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
        "成功獲取參加記錄",
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

    try {
      const myHeaders = await this.base.getAuthJsonHeaders();
      const apiUrl = `${this.endpoint}/${recordId}`;
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: myHeaders,
      });

      const result = await this.base.handleDirectusResponse(
        response,
        "成功獲取參加記錄",
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

    try {
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
        "成功獲取參加記錄列表",
      );
      return result;
    } catch (error) {
      console.error("❌ 獲取參加記錄失敗:", error);
      return this.handleParticipationRecordError(error);
    }
  }

  /**
   * 儲存記錄 (原有方法保持兼容)
   */
  async saveRecord(payload) {
    try {
      console.log("Service 傳送資料:", payload);

      // 構建 items 陣列
      const items = [];

      // 處理各種活動類型的選擇
      if (payload.items) {
        Object.keys(payload.items).forEach((activityType) => {
          const selectedItems = payload.items[activityType];
          if (selectedItems && selectedItems.length > 0) {
            // 根據活動類型獲取配置
            const activityConfig = this.getActivityConfig(activityType);
            if (!activityConfig) return;

            // 處理點燈的特殊情況（有燈種選擇）
            if (activityType === "diandeng" && payload.personLampTypes) {
              const processedSourceData = selectedItems.map((person) => ({
                ...person,
                lampType: payload.personLampTypes[person.id] || "guangming",
                lampTypeLabel: this.getLampTypeLabel(
                  payload.personLampTypes[person.id] || "guangming",
                ),
              }));

              items.push({
                type: activityType,
                label: activityConfig.label,
                price: activityConfig.price,
                quantity: selectedItems.length,
                subtotal: activityConfig.price * selectedItems.length,
                source: activityConfig.source,
                sourceData: processedSourceData,
              });
            } else {
              // 其他活動類型
              items.push({
                type: activityType,
                label: activityConfig.label,
                price: activityConfig.price,
                quantity: selectedItems.length,
                subtotal: activityConfig.price * selectedItems.length,
                source: activityConfig.source,
                sourceData: selectedItems,
              });
            }
          }
        });
      }

      // 轉換為 participationRecordDB 格式
      const recordData = {
        registrationId: payload.registrationId || -1,
        activityId: payload.activityId || -1,
        state: "confirmed",
        items: items, // 直接傳遞陣列，讓 Directus 處理 JSON 序列化
        totalAmount: payload.total || 0,
        finalAmount: payload.total || 0,
        notes: payload.notes || "",
      };

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
