// client/src/services/directusUsersService.js
import { rustDirectusUsersService } from "../rustServices/rustDirectusUsersService.js";
import { baseService } from "./baseService.js";
import { generateGitHashBrowser } from "../utils/generateGitHash.js";
import { DateUtils } from "../utils/dateUtils.js";
import { authService } from "./authService.js";

/**
 * 用戶服務 - 客戶端入口
 * 所有方法都通過 Rust 後端服務實現
 */
export class DirectusUsersService {
  constructor() {
    this.serviceName = "DirectusUsersService";
    this.base = baseService;
    this.rustService = rustDirectusUsersService;
    console.log(`DirectusUsersService 初始化: 使用 Rust 後端服務`);
  }

  // ========== 核心 READ 方法 ==========

  /**
   * 獲取單個用戶
   * @param {string|number} id - 用戶ID
   * @param {Object} additionalContext - 額外的上下文信息
   * @returns {Promise<Object>} 用戶數據
   */
  async getUserById(id, additionalContext = {}) {
    try {
      return await this.rustService.getUserById(id, additionalContext);
    } catch (error) {
      console.error(`❌ [客戶端] 獲取用戶失敗 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 獲取所有用戶（支持過濾）
   * @param {Object} params - 查詢參數 (如 { status: 'active', role: 'admin' })
   * @param {Object} additionalContext - 額外的上下文信息
   * @returns {Promise<Array>} 用戶列表
   */
  async getAllUsers(params = {}, additionalContext = {}) {
    try {
      return await this.rustService.getAllUsers(params, additionalContext);
    } catch (error) {
      console.error("❌ [客戶端] 獲取用戶列表失敗:", error);
      throw error;
    }
  }

  /**
   * 根據狀態獲取用戶
   * @param {string} status - 用戶狀態 (如 'active', 'draft', 'archived')
   * @param {Object} additionalContext - 額外的上下文信息
   * @returns {Promise<Array>} 用戶列表
   */
  async getUsersByStatus(status, additionalContext = {}) {
    try {
      return await this.rustService.getUsersByStatus(status, additionalContext);
    } catch (error) {
      console.error(`❌ [客戶端] 根據狀態獲取用戶失敗 (${status}):`, error);
      throw error;
    }
  }

  /**
   * 根據角色獲取用戶
   * @param {string} role - 用戶角色
   * @param {Object} additionalContext - 額外的上下文信息
   * @returns {Promise<Array>} 用戶列表
   */
  async getUsersByRole(role, additionalContext = {}) {
    try {
      return await this.rustService.getUsersByRole(role, additionalContext);
    } catch (error) {
      console.error(`❌ [客戶端] 根據角色獲取用戶失敗 (${role}):`, error);
      throw error;
    }
  }

  // ========== 模式管理 ==========

  /**
   * 獲取當前模式
   * @returns {string} 當前模式 ('rust')
   */
  getCurrentMode() {
    return this.rustService.getCurrentMode();
  }

  /**
   * 設置模式（僅為保持接口兼容）
   * @param {string} mode - 模式名稱
   * @returns {string} 當前模式
   */
  setMode(mode) {
    return this.rustService.setMode(mode);
  }

  // ========== 錯誤處理 ==========

  /**
   * 處理用戶相關錯誤
   * @param {Error} error - 錯誤物件
   * @returns {Object} 標準化錯誤響應
   */
  handleUserError(error) {
    return this.rustService.handleUserError(error);
  }
}

// 導出單例實例
export const directusUsersService = new DirectusUsersService();

// 同時導出類以便需要時可以創建新實例
export default DirectusUsersService;
