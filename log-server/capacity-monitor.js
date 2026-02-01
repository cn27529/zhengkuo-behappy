// capacity-monitor.js - MongoDB 容量監控工具

/**
 * MongoDB Atlas M0 容量監控
 * 使用方式: node capacity-monitor.js
 */

const BASE_URL = "http://localhost:3002";
const M0_CAPACITY_MB = 512;
const AVG_LOG_SIZE_KB = 3; // 你的日誌平均大小

async function getCapacityInfo() {
  console.log("📊 MongoDB Atlas M0 容量監控\n");
  console.log("=".repeat(60));

  try {
    // 1. 取得統計資料
    const response = await fetch(`${BASE_URL}/mongo/stats`);
    const result = await response.json();

    if (!result.success) {
      throw new Error("無法取得統計資料");
    }

    const stats = result.stats;

    // 2. 計算使用量
    const totalLogs = stats.total;
    const usedSpaceKB = totalLogs * AVG_LOG_SIZE_KB;
    const usedSpaceMB = usedSpaceKB / 1024;
    const usedPercentage = (usedSpaceMB / M0_CAPACITY_MB) * 100;

    // 3. 計算剩餘容量
    const remainingMB = M0_CAPACITY_MB - usedSpaceMB;
    const remainingLogs = Math.floor((remainingMB * 1024) / AVG_LOG_SIZE_KB);

    // 4. 預估可用時間（假設每天 100 筆錯誤）
    const dailyLogs = 100;
    const daysRemaining = Math.floor(remainingLogs / dailyLogs);
    const yearsRemaining = (daysRemaining / 365).toFixed(1);

    // 5. 顯示結果
    console.log("\n📈 容量使用情況:");
    console.log(`   總日誌數: ${totalLogs.toLocaleString()} 筆`);
    console.log(`   已使用空間: ${usedSpaceMB.toFixed(2)} MB`);
    console.log(`   使用率: ${usedPercentage.toFixed(2)}%`);

    console.log("\n💾 剩餘容量:");
    console.log(`   剩餘空間: ${remainingMB.toFixed(2)} MB`);
    console.log(`   還可存: ${remainingLogs.toLocaleString()} 筆日誌`);

    console.log("\n⏰ 預估可用時間:");
    console.log(`   (假設每天 ${dailyLogs} 筆錯誤日誌)`);
    console.log(`   剩餘天數: ${daysRemaining.toLocaleString()} 天`);
    console.log(`   剩餘年數: ${yearsRemaining} 年`);

    console.log("\n📊 日誌詳情:");
    console.log(`   錯誤數: ${stats.errors.toLocaleString()}`);
    console.log(`   錯誤率: ${stats.errorRate}`);
    console.log(`   24小時內: ${stats.last24h.toLocaleString()} 筆`);

    // 6. 容量警告
    console.log("\n⚠️  容量狀態:");
    if (usedPercentage < 50) {
      console.log("   🟢 容量充足");
    } else if (usedPercentage < 80) {
      console.log("   🟡 容量正常，建議開始規劃清理");
    } else if (usedPercentage < 95) {
      console.log("   🟠 容量偏高，請儘快清理舊日誌");
    } else {
      console.log("   🔴 容量即將用盡！立即清理舊日誌");
    }

    // 7. 建議
    console.log("\n💡 建議:");
    if (usedPercentage > 50) {
      console.log("   - 考慮清理 90 天前的日誌");
      console.log(`   - 執行: curl -X DELETE ${BASE_URL}/mongo/cleanup/90`);
    }
    if (stats.errorRate === "0%" || parseFloat(stats.errorRate) < 5) {
      console.log("   - 錯誤率很低，系統運作良好 ✅");
    } else if (parseFloat(stats.errorRate) > 20) {
      console.log("   - 錯誤率偏高，建議檢查系統 ⚠️");
    }

    console.log("\n" + "=".repeat(60));

    return {
      totalLogs,
      usedSpaceMB,
      usedPercentage,
      remainingMB,
      remainingLogs,
      daysRemaining,
      yearsRemaining,
    };
  } catch (error) {
    console.error("\n❌ 錯誤:", error.message);
    console.error("   請確認後端服務器正在運行");
    return null;
  }
}

// 執行監控
getCapacityInfo()
  .then((info) => {
    if (info) {
      // 如果容量超過 80%，退出碼為 1（可用於自動化腳本）
      process.exit(info.usedPercentage > 80 ? 1 : 0);
    } else {
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("未預期的錯誤:", error);
    process.exit(1);
  });
