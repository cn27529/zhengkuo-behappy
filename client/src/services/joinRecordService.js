// src/services/joinRecordService.js
import { baseService } from "./baseService.js";
import { generateGitHashBrowser } from "../utils/generateGitHash.js";
import { DateUtils } from "../utils/dateUtils.js";

export class JoinRecordService {
  // ========== 建構函式 ==========
  constructor() {
    this.serviceName = "joinRecordService";
    this.base = baseService;
    this.endpoint = `${this.base.apiBaseUrl}${this.base.apiEndpoints.itemsActivity}`;
    console.log(`joinRecordService 初始化: 當前模式為 ${this.base.mode}`);
  }
  
  // ========== CRUD 操作 ==========

  // 儲存記錄
  async saveRecord (payload) {
    try {
      console.log("Service 傳送資料:", payload);
      // return await axios.post('/api/save-record', payload);
      return { success: true };
    } catch (error) {
      console.error("儲存失敗", error);
      throw error;
    }
  }

  // ========== 錯誤處理 ==========
  handleActivityError(error) {
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

export const joinRecordService = new JoinRecordService();
