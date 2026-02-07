// mongoDBLogger.js - 使用 node-schedule 的更精確版本

// 在檔案頂部加入
import schedule from "node-schedule";

// ==========================================
// 在 startServer() 函數內使用
// ==========================================

/**
 * 啟動定時清理任務（使用 node-schedule 版本）
 *
 * 優點：
 * - 更精確的時間控制（可指定具體時間，如每週一凌晨 3:00）
 * - 不受服務器重啟影響（會在下一個排程時間執行）
 * - 支援 cron 表達式
 */
function startCleanupJobWithSchedule() {
  const CLEANUP_RETAIN_DAYS = 90; // 保留 90 天

  /**
   * 執行清理
   */
  async function performCleanup() {
    try {
      const startTime = Date.now();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - CLEANUP_RETAIN_DAYS);

      console.log("");
      console.log("═".repeat(60));
      console.log(`⏰ [${new Date().toISOString()}] 開始執行定期清理`);
      console.log(`   截止日期: ${cutoffDate.toISOString()}`);

      if (!collection) {
        console.log("❌ MongoDB 未連接，跳過清理");
        console.log("═".repeat(60));
        return;
      }

      const result = await collection.deleteMany({
        uploadedAt: { $lt: cutoffDate },
      });

      const duration = Date.now() - startTime;
      const savedSpaceMB = (result.deletedCount * 3) / 1024;
      const remainingCount = await collection.countDocuments();

      console.log(`✅ 清理完成`);
      console.log(`   刪除: ${result.deletedCount.toLocaleString()} 筆`);
      console.log(`   剩餘: ${remainingCount.toLocaleString()} 筆`);
      console.log(`   節省: 約 ${savedSpaceMB.toFixed(2)} MB`);
      console.log(`   耗時: ${duration}ms`);
      console.log("═".repeat(60));
      console.log("");
    } catch (error) {
      console.error("");
      console.error("❌ 清理失敗:", error.message);
      console.error("");
    }
  }

  // 🔧 方案 A: 每週一凌晨 3:00 執行（推薦）
  const job = schedule.scheduleJob("0 3 * * 1", performCleanup);

  // 🔧 方案 B: 每天凌晨 3:00 執行
  // const job = schedule.scheduleJob('0 3 * * *', performCleanup);

  // 🔧 方案 C: 每 7 天凌晨 3:00 執行（從今天算起）
  // const job = schedule.scheduleJob('0 3 */7 * *', performCleanup);

  console.log("✅ 已啟用自動清理任務");
  console.log("   排程: 每週一凌晨 3:00");
  console.log(`   保留: ${CLEANUP_RETAIN_DAYS} 天內的日誌`);

  // 啟動時執行一次
  console.log("🔄 啟動時執行初始清理...");
  performCleanup();

  return job;
}

// ==========================================
// 安裝依賴
// ==========================================
// npm install node-schedule
