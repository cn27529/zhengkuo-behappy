// src/rustServices/rustServiceFactory.js
// 動態導入，避免循環依賴
import { baseRustService } from "./baseRustService.js";

// 服務緩存
const serviceCache = new Map();

// 遷移配置
export const migrationConfig = {
  // 模塊配置
  activities: {
    current: "directus", // directus, rust, hybrid
    read: "directus",
    write: "directus",
    stats: "rust", // 統計功能先用 Rust
  },
  registrations: {
    current: "directus",
  },
  auth: {
    current: "directus",
  },
  monthlyDonates: {
    current: "directus",
  },

  // 全局設置
  autoFallback: true, // 失敗時自動降級
  performanceThreshold: 1.5, // Rust 慢 1.5 倍時自動降級
  enabled: import.meta.env.VITE_RUST_ENABLED === "true",
};

export class RustServiceFactory {
  /**
   * 獲取活動服務
   */
  static async getActivityService(feature = "default") {
    const config = migrationConfig.activities;
    const mode = config[feature] || config.current;

    if (mode === "rust" && migrationConfig.enabled) {
      const service = await this.loadRustService("activity");
      return service;
    }

    // 返回 Directus 服務
    return this.getDirectusService("activity");
  }

  /**
   * 動態加載 Rust 服務
   */
  static async loadRustService(serviceName) {
    if (serviceCache.has(serviceName)) {
      return serviceCache.get(serviceName);
    }

    try {
      let service;
      switch (serviceName) {
        case "activity":
          const { rustActivityService } = await import(
            "./rustActivityService.js"
          );
          service = rustActivityService;
          break;
        case "auth":
          const { rustAuthService } = await import("./rustAuthService.js");
          service = rustAuthService;
          break;
        // ... 其他服務
        default:
          throw new Error(`❌🦀 [Rust] 未知的服務: ${serviceName}`);
      }

      serviceCache.set(serviceName, service);
      console.log(`🦀 [Rust] 服務已加載: ${serviceName}`);
      return service;
    } catch (error) {
      console.error(`❌🦀 [Rust] 服務加載失敗: ${serviceName}`, error);
      throw error;
    }
  }

  /**
   * 動態加載 Directus 服務
   */
  static async getDirectusService(serviceName) {
    try {
      switch (serviceName) {
        case "activity":
          const { activityService } = await import(
            "../services/activityService.js"
          );
          return activityService;
        // ... 其他服務
        default:
          throw new Error(`未知的 Directus 服務: ${serviceName}`);
      }
    } catch (error) {
      console.error(`加載 Directus 服務失敗: ${serviceName}`, error);
      throw error;
    }
  }

  /**
   * 創建混合服務（讀取用 Rust，寫入用 Directus）
   */
  static createHybridService(rustService, directusService) {
    return {
      // 讀取操作使用 Rust
      getAllActivities: (params) => rustService.getAllActivities(params),
      getActivityById: (id) => rustService.getActivityById(id),

      // 寫入操作使用 Directus
      createActivity: (data) => directusService.createActivity(data),
      updateActivity: (id, data) => directusService.updateActivity(id, data),
      deleteActivity: (id) => directusService.deleteActivity(id),

      // 標識
      isHybrid: true,
      source: "rust+directus",
    };
  }

  /**
   * 更新遷移配置
   */
  static updateConfig(module, updates) {
    if (migrationConfig[module]) {
      Object.assign(migrationConfig[module], updates);
      console.log(`🔄 更新 ${module} 配置:`, updates);
    }
  }

  /**
   * 獲取遷移報告
   */
  static getMigrationReport() {
    const report = {
      config: migrationConfig,
      rustMetrics: baseRustService.getMetrics(),
      timestamp: new Date().toISOString(),
    };

    return report;
  }
}

// 導出配置供組件使用
export { migrationConfig };
