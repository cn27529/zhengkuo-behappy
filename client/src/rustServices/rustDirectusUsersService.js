// src/rustServices/rustDirectusUsersService.js
import { baseRustService } from "./baseRustService.js";

export class RustDirectusUsersService {
  constructor() {
    this.serviceName = "RustDirectusUsersService";
    this.base = baseRustService;
    this.endpoint = this.base.endpoints.directusUsers;
    console.log(
      `RustDirectusUsersService 初始化: 當前模式為 ${this.base.mode}`,
    );
  }

  // ========== 核心 READ 方法 ==========

  /**
   * 獲取單個用戶
   */
  async getUserById(id, additionalContext = {}) {
    try {
      const result = await this.base.rustFetch(`${this.endpoint}/${id}`, {
        method: "GET",
      });

      return result;
    } catch (error) {
      console.error(`❌ 獲取用戶失敗 (ID: ${id}):`, error);
      return this.handleError(error);
    }
  }

  /**
   * 獲取所有用戶（支持過濾）
   */
  async getAllUsers(params = {}, additionalContext = {}) {
    console.log("🦀 [Rust] 獲取用戶數據...");

    const queryParams = new URLSearchParams();

    if (params.status) {
      queryParams.append("status", params.status);
    }

    if (params.role) {
      queryParams.append("role", params.role);
    }

    const endpoint = queryParams.toString()
      ? `${this.endpoint}?${queryParams.toString()}`
      : this.endpoint;

    try {
      const result = await this.base.rustFetch(endpoint, {
        method: "GET",
      });

      return result;
    } catch (error) {
      console.error("❌ 獲取用戶列表失敗:", error);
      return this.handleError(error);
    }
  }

  /**
   * 根據狀態獲取用戶
   */
  async getUsersByStatus(status, additionalContext = {}) {
    try {
      const result = await this.getAllUsers({ status }, additionalContext);
      return result;
    } catch (error) {
      console.error(`❌ 根據狀態獲取用戶失敗 (${status}):`, error);
      return this.handleError(error);
    }
  }

  /**
   * 根據角色獲取用戶
   */
  async getUsersByRole(role, additionalContext = {}) {
    try {
      const result = await this.getAllUsers({ role }, additionalContext);
      return result;
    } catch (error) {
      console.error(`❌ 根據角色獲取用戶失敗 (${role}):`, error);
      return this.handleError(error);
    }
  }

  // ========== 模式管理 ==========

  /**
   * 獲取當前模式
   */
  getCurrentMode() {
    return "rust";
  }

  /**
   * 設置模式（在 Rust 服務中無效，但保持接口兼容）
   */
  setMode(mode) {
    console.warn(`⚠️🦀 [Rust] 服務不支持切換模式，當前固定為 rust 模式`);
    return "rust";
  }

  // ========== 錯誤處理 ==========

  /**
   * Rust 特定的錯誤處理
   */
  handleUserError(error) {
    return this.base.handleRustError(error);
  }
}

export const rustDirectusUsersService = new RustDirectusUsersService();
